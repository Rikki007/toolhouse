import type { GlobalEvents, LocaleEvents } from '../types/index.ts'
import { globalEventsList, localeEventsList } from '../data/eventsData.ts'
import { getState, updateState, addNewsItem } from '../state/state.ts'
import type { AppState } from '../state/state.ts'
import { getAllStaffIds, getStaffCategory } from '../state/inventoryStore.ts'
import { getStaffById } from './itemLookup.ts'
import { roundToCents } from './passiveIncome.ts'
import { formatMoney } from './format.ts'

/** Минимальная пауза между событиями — 2 минуты */
const EVENT_MIN_INTERVAL = 5 * 60 * 1000

/** Максимальная пауза между событиями — 4 минуты */
const EVENT_MAX_INTERVAL = 10 * 60 * 1000

/** Как часто наблюдатель проверяет, пора ли запускать событие */
const OBSERVER_TICK = 1000

/**
 * Порядок чередования событий: локальное, глобальное.
 * Индекс сдвигается после каждого сработавшего события.
 */
const EVENT_SEQUENCE = ['locale', 'global'] as const

type EventType = (typeof EVENT_SEQUENCE)[number]

/** Текущая позиция в цикле чередования */
let sequenceIndex = 0

/** Зависимости наблюдателя */
export interface GlobalEventsDeps {
  /** Контейнер, в котором открываются модальные окна (.game-screen) */
  container: HTMLElement
  /** Элемент с суммой денег для обновления UI */
  moneyEl?: HTMLElement | null
}

/** Случайный элемент массива */
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

/** Случайная пауза до следующего события (плавающая, от 2 до 4 минут) */
function getRandomEventDelay(): number {
  return EVENT_MIN_INTERVAL + Math.random() * (EVENT_MAX_INTERVAL - EVENT_MIN_INTERVAL)
}

/** Текущая пауза до следующего события. Пересчитывается после каждого события */
let nextEventDelay = getRandomEventDelay()

/** Открыта ли сейчас какая-нибудь модалка — чтобы не накладывать окно события поверх */
function hasOpenModal(container: HTMLElement): boolean {
  return Array.from(container.children).some((child) => {
    const className = (child as HTMLElement).className
    return typeof className === 'string' && className.includes('overlay')
  })
}

/**
 * Подставляется, когда подходящих сотрудников нет ни в инвентаре, ни в сменах.
 * Описания событий — сказуемые без подлежащего, поэтому подлежащее нужно всегда:
 * «Сотрудник уронил паллет при транспортировке».
 */
const FALLBACK_STAFF_NAME = 'Сотрудник'

/**
 * Имя сотрудника для подстановки в текст локального события.
 */
function pickStaffName(role: LocaleEvents['role']): string {
  const ids = getAllStaffIds()
  const pool = ids.filter((id) => getStaffCategory(id) === (role === 'reachtruck' ? 'reachTruckDrivers' : 'pickers'))
  if (pool.length === 0) return FALLBACK_STAFF_NAME

  return getStaffById(pickRandom(pool))?.name ?? FALLBACK_STAFF_NAME
}

/**
 * Склеивает подлежащее со сказуемым из данных события.
 * Описания в данных идут с ведущим пробелом и со строчной буквы (« уронил паллет...»),
 * приведение к «имя + пробел + строчная» страхует от смены формата при правке данных.
 */
function joinSubject(name: string, description: string): string {
  const predicate = description.trimStart()
  return `${name} ${predicate.charAt(0).toLowerCase()}${predicate.slice(1)}`
}

/** Текст локального события: имя сотрудника + проступок или заслуга */
function buildLocaleEventText(event: LocaleEvents): string {
  return joinSubject(pickStaffName(event.role), event.description)
}

/**
 * Завершает событие: сдвигает позицию в цикле, перезапускает таймер
 * и сохраняет изменения стейта (например, новые деньги).
 */
function finishEvent(deps: GlobalEventsDeps, changes: Partial<AppState> = {}): void {
  const { moneyEl } = deps

  nextEventDelay = getRandomEventDelay()
  sequenceIndex = (sequenceIndex + 1) % EVENT_SEQUENCE.length

  updateState({ ...changes, timeToEvent: Date.now() })

  if (changes.money !== undefined && moneyEl) {
    moneyEl.textContent = formatMoney(changes.money)
  }
}

/**
 * Применяет финансовый итог события и завершает его.
 * @param delta положительное — доход, отрицательное — потери
 */
function applyEventResult(deps: GlobalEventsDeps, delta: number): void {
  const newMoney = Math.max(0, roundToCents(getState().money + delta))
  finishEvent(deps, { money: newMoney })
}

/**
 * Запускает глобальное событие: берёт случайный объект из globalEventsList,
 * сразу применяет money * cost к балансу и сообщает о событии новостью.
 */
export function triggerGlobalEvent(deps: GlobalEventsDeps): void {
  const event: GlobalEvents = pickRandom(globalEventsList)

  const amount = roundToCents(Math.abs(getState().money * event.cost))
  const isPositive = event.influence === 'positive'
  const delta = isPositive ? amount : -amount

  applyEventResult(deps, delta)
  addNewsItem({
    kind: 'global',
    title: 'Глобальное событие',
    description: event.description,
    amount: delta,
  })
}

/**
 * Запускает локальное событие: берёт случайный объект из localeEventsList,
 * сразу применяет cost к балансу и сообщает о событии новостью.
 */
export function triggerLocaleEvent(deps: GlobalEventsDeps): void {
  const event: LocaleEvents = pickRandom(localeEventsList)

  const amount = roundToCents(Math.abs(event.cost))
  const isPositive = event.influence === 'positive'
  const delta = isPositive ? amount : -amount

  applyEventResult(deps, delta)
  addNewsItem({
    kind: 'locale',
    title: 'Локальное событие',
    description: buildLocaleEventText(event),
    amount: delta,
  })
}

/** Запускает следующее событие в цикле чередования */
export function triggerNextEvent(deps: GlobalEventsDeps): void {
  const type: EventType = EVENT_SEQUENCE[sequenceIndex]
  if (type === 'global') {
    triggerGlobalEvent(deps)
  } else {
    triggerLocaleEvent(deps)
  }
}

/**
 * Наблюдатель: раз в секунду сверяет, прошло ли достаточно времени
 * с последнего события (timeToEvent), и если да — запускает следующее
 * событие в цикле чередования.
 * @returns функция остановки наблюдателя
 */
export function startGlobalEventsObserver(deps: GlobalEventsDeps): () => void {
  const { container, moneyEl } = deps

  const intervalId = setInterval(() => {
    const elapsed = Date.now() - getState().timeToEvent
    if (elapsed < nextEventDelay) return

    // Не открываем окно поверх уже открытой модалки — попробуем в следующий тик
    if (hasOpenModal(container)) return

    triggerNextEvent({ container, moneyEl })
  }, OBSERVER_TICK)

  return () => clearInterval(intervalId)
}
