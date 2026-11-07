import { getState, updateState, DEFAULT_ALLEGIANCE } from './state.ts'
import type { Allegiance, AllegianceEpisode } from '../types/index.ts'
import { allegianceEpisodes, pleaAggressionSteps } from '../data/choiseExodus.ts'
import { roundToCents } from '../utils/passiveIncome.ts'

/** Сколько выборов руководителя усредняется в одном окне */
export const ALLEGIANCE_WINDOW = 5

/** Итог закрытого окна выборов: что показать в модалке и что изменилось в деньгах */
export interface AllegianceOutcome {
  /** Уровень агрессивности, подобраннный по среднему значению */
  episode: AllegianceEpisode
  /** Изменение денег: положительное — доход, отрицательное — потери */
  delta: number
  /** Новая сумма денег */
  money: number
}

/**
 * Подбирает уровень агрессивности по её среднему значению.
 * Диапазоны в данных непрерывны, поэтому fallback на последний уровень
 * срабатывает только для пограничного 100.
 */
export function getAllegianceEpisode(agression: number): AllegianceEpisode {
  const episode = allegianceEpisodes.find(
    (item) => agression >= item.min && agression < item.max
  )
  return episode ?? allegianceEpisodes[allegianceEpisodes.length - 1]
}

/** Текущее состояние лояльности */
export function getAllegiance(): Allegiance {
  return getState().allegiance
}

/**
 * Учитывает решение руководителя в модалке с выбором.
 * @param pleaStep — шаг цепочки уговоров, на котором сотрудник был прощён:
 *   0 — прощён сразу, 1 — после мольбы сотрудника, 2 — после HR, 3 — после совета директоров
 * @returns итог окна, если окно из ALLEGIANCE_WINDOW выборов закрыто, иначе null
 */
export function registerChoiceOutcome(pleaStep: number): AllegianceOutcome | null {
  const state = getState()
  const { current, agression } = state.allegiance
  const value = pleaAggressionSteps[pleaStep] ?? 0

  // Новое среднее дописываем в накопленную сумму, чтобы не хранить историю выборов
  const filled = current + 1
  const average = roundToCents((agression * current + value) / filled)

  if (filled < ALLEGIANCE_WINDOW) {
    updateState({ allegiance: { current: filled, agression: average } })
    return null
  }

  const episode = getAllegianceEpisode(average)
  const amount = roundToCents(state.money * episode.rate)
  const delta = episode.influence === 'positive' ? amount : -amount
  const money = Math.max(0, roundToCents(state.money + delta))

  // Окно закрыто — счётчики обнуляются, следующий цикл считается заново
  updateState({ allegiance: { ...DEFAULT_ALLEGIANCE }, money })

  return { episode, delta, money }
}
