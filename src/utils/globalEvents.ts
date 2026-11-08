import type { GlobalEvents, LocaleEvents, ChoiceEvents } from '../types/index.ts'
import { globalEventsList, localeEventsList, choiceEventsList } from '../data/eventsData.ts'
import { dismisPleasList } from '../data/dismisPleas.ts'
import { createModal } from './modalFactory.ts'
import { getState, updateState, addNewsItem } from '../state/state.ts'
import type { AppState } from '../state/state.ts'
import { getAllStaffIds, getStaffCategory } from '../state/inventoryStore.ts'
import { registerChoiceOutcome } from '../state/allegianceStore.ts'
import { getStaffById } from './itemLookup.ts'
import { roundToCents, formatPassiveIncome } from './passiveIncome.ts'
import { formatMoney } from './format.ts'
import { playSound } from '../state/audioManager.ts'

/** Минимальная пауза между событиями — 2 минуты */
const EVENT_MIN_INTERVAL = 20 * 60 * 1000

/** Максимальная пауза между событиями — 4 минуты */
const EVENT_MAX_INTERVAL = 40 * 60 * 1000

/** Как часто наблюдатель проверяет, пора ли запускать событие */
const OBSERVER_TICK = 1000

/**
 * Порядок чередования событий: локальное, глобальное, локальное и выбор.
 * Индекс сдвигается после каждого сработавшего события.
 */
const EVENT_SEQUENCE = ['locale', 'global', 'choice', 'choice', 'choice'] as const

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
 * Имя сотрудника для подстановки в текст события.
 * @param role — нужна конкретная роль (для локальных событий) либо любая (для выбора)
 */
function pickStaffName(role?: LocaleEvents['role']): string {
  const ids = getAllStaffIds()
  const pool = role
    ? ids.filter((id) => getStaffCategory(id) === (role === 'reachtruck' ? 'reachTruckDrivers' : 'pickers'))
    : ids
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

/** Метка имени сотрудника в шаблонах сообщений из файла данных */
const STAFF_NAME_TOKEN = '{name}'

/**
 * Подставляет имя сотрудника в шаблон сообщения уговоров.
 * replaceAll — в одном тексте имя может упоминаться дважды.
 */
function fillStaffName(template: string, staffName: string): string {
  return template.replaceAll(STAFF_NAME_TOKEN, staffName)
}

/** Каркас окна события: заголовок, крестик и контейнер под контент */
function buildEventModal(
  title: string,
  onClose: () => void
): { modal: HTMLElement; content: HTMLElement } {
  const modal = document.createElement('div')
  modal.className = 'game-modal global-event-modal'

  const header = document.createElement('div')
  header.className = 'game-modal-header'

  const titleEl = document.createElement('h2')
  titleEl.className = 'game-modal-title'
  titleEl.textContent = title
  header.appendChild(titleEl)

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'modal-close-btn game-modal-close'
  closeBtn.innerHTML = '×'
  closeBtn.addEventListener('click', () => {
    playSound('click')
    onClose()
  })
  header.appendChild(closeBtn)

  modal.appendChild(header)

  const content = document.createElement('div')
  content.className = 'game-modal-content global-event-modal-body'
  modal.appendChild(content)

  return { modal, content }
}

function createText(text: string, className: string): HTMLElement {
  const el = document.createElement('p')
  el.className = className
  el.textContent = text
  return el
}

/** Кнопка события; onClose текущей модалки передаётся, чтобы окно можно было закрыть или перезаоткрыть */
function createEventButton(
  label: string,
  className: string,
  onClick: (onClose: () => void) => void,
  onClose: () => void
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = `skill-level-buy-btn ${className}`
  btn.textContent = label
  btn.addEventListener('click', () => onClick(onClose))
  return btn
}

/** Кнопка решения по сотруднику */
interface DecisionButton {
  label: string
  className: string
  onClick: (onClose: () => void) => void
}

/** Данные для отрисовки окна события с финансовым итогом */
interface EventModalData {
  title: string
  description: string
  /** Абсолютное изменение денег */
  amount: number
  isPositive: boolean
}

/**
 * Рисует модальное окно события через универсальный createModal.
 */
function renderEventModal(container: HTMLElement, data: EventModalData): void {
  createModal(container, {
    overlayClass: 'game-modal-overlay',
    renderContent: (onClose) => {
      const { modal, content } = buildEventModal(data.title, onClose)

      content.appendChild(createText(data.description, 'global-event-description'))

      const sign = data.isPositive ? '+' : '−'
      content.appendChild(
        createText(
          `${sign}${formatPassiveIncome(data.amount)}`,
          `global-event-result ${data.isPositive ? 'global-event-positive' : 'global-event-negative'}`
        )
      )

      content.appendChild(createEventButton('Понятно', 'global-event-ok-btn', (close) => close(), onClose))
      return modal
    },
  })
}

/**
 * Рисует окно с текстом и набором кнопок решения.
 */
function renderDecisionModal(
  container: HTMLElement,
  data: { title: string; description: string; buttons: DecisionButton[] }
): void {
  createModal(container, {
    overlayClass: 'game-modal-overlay',
    renderContent: (onClose) => {
      const { modal, content } = buildEventModal(data.title, onClose)

      content.appendChild(createText(data.description, 'global-event-description'))

      const actions = document.createElement('div')
      actions.className = 'global-event-actions'
      for (const button of data.buttons) {
        actions.appendChild(createEventButton(button.label, button.className, button.onClick, onClose))
      }
      content.appendChild(actions)
      return modal
    },
  })
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

/**
 * Уговоры после нажатия «Уволить». Каждый следующий шаг мягче предыдущего,
 * последний шаг оставляет только «Простить» — уволить уже нельзя.
 * Тексты берутся из данных (по три варианта на ступень), имя подставляется в {name}.
 */
const DISMISS_PLEA_STEPS: { messages: string[]; allowDismiss: boolean }[] = [
  { messages: dismisPleasList.firstStep, allowDismiss: true },
  { messages: dismisPleasList.secondStep, allowDismiss: true },
  { messages: dismisPleasList.thirdStep, allowDismiss: false },
]

/** Данные, которые нужно помнить на всю цепочку решений по сотруднику */
interface ChoiceContext {
  staffName: string
  decisions: ChoiceEvents['decisions']
}

/**
 * Завершает цепочку решений по сотруднику: фиксирует шаг прощения в лояльности
 * и показывает вердикт коллектива, если окно из ALLEGIANCE_WINDOW выборов закрылось.
 * @param pleaStep — 0 если простили сразу, иначе номер шага уговоров
 */
function finishChoice(deps: GlobalEventsDeps, pleaStep: number): void {
  const outcome = registerChoiceOutcome(pleaStep)
  if (!outcome) return

  if (deps.moneyEl) {
    deps.moneyEl.textContent = formatMoney(outcome.money)
  }

  renderEventModal(deps.container, {
    title: outcome.episode.title,
    description: pickRandom(outcome.episode.description),
    amount: Math.abs(outcome.delta),
    isPositive: outcome.episode.influence === 'positive',
  })
}

/**
 * Показывает очередной шаг уговоров.
 * @param pleaIndex — индекс в DISMISS_PLEA_STEPS
 */
function showDismissPlea(
  deps: GlobalEventsDeps,
  ctx: ChoiceContext,
  pleaIndex: number
): void {
  const plea = DISMISS_PLEA_STEPS[pleaIndex]

  const buttons: DecisionButton[] = [
    {
      label: ctx.decisions.positive,
      className: 'global-event-forgive-btn',
      // Прощение после pleaIndex-го уговора засчитывается как шаг pleaIndex + 1
      onClick: (close) => {
        close()
        finishChoice(deps, pleaIndex + 1)
      },
    },
  ]

  if (plea.allowDismiss) {
    buttons.push({
      label: ctx.decisions.negative,
      className: 'global-event-dismiss-btn',
      onClick: (close) => {
        close()
        showDismissPlea(deps, ctx, pleaIndex + 1)
      },
    })
  }

  renderDecisionModal(deps.container, {
    title: 'Отказ от увольнения',
    description: fillStaffName(pickRandom(plea.messages), ctx.staffName),
    buttons,
  })
}

/**
 * Запускает событие с выбором: берёт случайный объект из choiceEventsList,
 * рисует модалку с двумя решениями и запускает цепочку уговоров при увольнении.
 * На доход решения влияют только через лояльность коллектива (allegiance).
 */
export function triggerChoiceEvent(deps: GlobalEventsDeps): void {
  const event: ChoiceEvents = pickRandom(choiceEventsList)
  const ctx: ChoiceContext = {
    staffName: pickStaffName(),
    decisions: event.decisions,
  }

  // Событие уже состоялось, поэтому таймер следующего стартует сразу:
  // иначе ожидание накопится, пока игрок проходит цепочку решений
  finishEvent(deps)

  renderDecisionModal(deps.container, {
    title: 'Решение по сотруднику',
    description: joinSubject(ctx.staffName, event.description),
    buttons: [
      {
        label: event.decisions.positive,
        className: 'global-event-forgive-btn',
        onClick: (close) => {
          close()
          finishChoice(deps, 0)
        },
      },
      {
        label: event.decisions.negative,
        className: 'global-event-dismiss-btn',
        onClick: (close) => {
          close()
          showDismissPlea(deps, ctx, 0)
        },
      },
    ],
  })
}

/** Запускает следующее событие в цикле чередования */
export function triggerNextEvent(deps: GlobalEventsDeps): void {
  const type: EventType = EVENT_SEQUENCE[sequenceIndex]
  if (type === 'global') {
    triggerGlobalEvent(deps)
  } else if (type === 'choice') {
    triggerChoiceEvent(deps)
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
