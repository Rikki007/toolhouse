import { getState, updateState } from '../state/state.ts'
import { nextLevelProgress } from '../data/playerLevels.ts'
import {
  ACTING_MAX_BRANCH_LEVELS,
  ACTING_SKILL_COST_BASE_SECONDS,
  ACTING_SKILL_COST_MAX_EXPONENT,
  ACTING_SKILL_COST_MIN,
  ACTING_SKILL_COST_MULTIPLIER,
  ACTING_SKILL_LATE_COST_MULTIPLIER,
  ACTING_TOKEN_MAX_LEVELS,
} from '../data/actingManager.ts'
import { pluralRu } from './format.ts'
import { actingParamImages, coinFrames, interfaceIconImages, tokenImages } from '../assets/assetLoader.ts'
import {
  getActingExpectedTokensPerHour,
  getActingOfflineDurationMs,
  getActingOfflineRate,
  getActingTokenChance,
  getActingTokenDistribution,
  getActingTokenDrawsPerHour,
} from './actingOffline.ts'
import type {
  ActingBranch,
  ActingBranchId,
  ActingTokenColor,
  ActingTokenParam,
} from '../types/index.ts'

/** Иконка навыка: сначала actingParamImages, затем tokenImages/interfaceIconImages */
export function getActingBranchIconSrc(branch: ActingBranch): string {
  return (
    actingParamImages[branch.id] ??
    tokenImages[branch.iconKey] ??
    interfaceIconImages[branch.iconKey] ??
    coinFrames[0] ??
    ''
  )
}

/** Прогресс уровня И.О. */
export interface ActingLevelProgress {
  level: number
  /** Опыт внутри текущего уровня */
  xp: number
  /** Опыт, необходимый для перехода на следующий уровень */
  nextXp: number
  /** Доля заполнения полосы опыта 0..1 */
  progress: number
}

/** Текущий уровень и опыт И.О. с готовой долей прогресс-бара */
export function getActingLevelProgress(): ActingLevelProgress {
  const { level, xp } = getState().actingManager
  const { current, next, progress } = nextLevelProgress(xp)
  return {
    level,
    xp: Math.max(0, xp - current),
    nextXp: Math.max(0, next - current),
    progress,
  }
}

/** Купленный уровень навыка */
export function getActingBranchLevel(branchId: ActingBranchId): number {
  return getState().actingManager.branches[branchId] ?? 0
}

/** Уровень параметра навыка «Сбор жетонов» */
export function getActingTokenParamLevel(param: ActingTokenParam): number {
  return getState().actingManager.tokenUpgrades[param] ?? 0
}

/** Максимальный уровень параметра навыка «Сбор жетонов» */
export function getActingTokenParamMaxLevel(param: ActingTokenParam): number {
  return ACTING_TOKEN_MAX_LEVELS[param]
}

/** Сколько очков навыков уже потрачено (включая три параметра сбора жетонов) */
export function getActingSpentPoints(): number {
  const acting = getState().actingManager
  return (
    (acting.branches.performance ?? 0) +
    (acting.branches.duration ?? 0) +
    (acting.tokenUpgrades.frequency ?? 0) +
    (acting.tokenUpgrades.chance ?? 0) +
    (acting.tokenUpgrades.value ?? 0)
  )
}

/** Сколько очков навыков доступно: один уровень И.О. — одно очко */
export function getActingAvailablePoints(): number {
  return Math.max(0, getState().actingManager.level - getActingSpentPoints())
}

/**
 * Стоимость следующего уровня любого навыка (хаускоины).
 * База привязана к пассивному доходу, чтобы цена не устаревала по мере роста экономики.
 * Растёт с каждым купленным уровнем; после порога рост замедляется,
 * иначе последние уровни становились бы недостижимыми.
 */
export function getActingUpgradeCost(): number {
  const spent = getActingSpentPoints()
  const base = Math.max(
    ACTING_SKILL_COST_MIN,
    getState().passiveIncomePerSecond * ACTING_SKILL_COST_BASE_SECONDS,
  )
  const exponent = Math.min(spent, ACTING_SKILL_COST_MAX_EXPONENT)
  const lateExponent = Math.max(0, spent - ACTING_SKILL_COST_MAX_EXPONENT)

  return Math.round(
    base *
      Math.pow(ACTING_SKILL_COST_MULTIPLIER, exponent) *
      Math.pow(ACTING_SKILL_LATE_COST_MULTIPLIER, lateExponent),
  )
}

/** Хватает ли денег на следующий уровень навыка */
export function canAffordActingUpgrade(): boolean {
  return getState().money >= getActingUpgradeCost()
}

/** Доход в час, который И.О. приносит оффлайн с учётом «Производительности» */
export function getActingIncomePerHour(): number {
  const rate = getActingOfflineRate(getActingBranchLevel('performance'))
  return getState().passiveIncomePerSecond * 3600 * rate
}

/** Сколько времени доход копится без игрока */
export function getActingOfflineDuration(): number {
  return getActingOfflineDurationMs(getActingBranchLevel('duration'))
}

/** Длительность оффлайна в часах: «1.33 часа», «2 часа», «6 часов» */
export function getActingDurationHoursText(ms: number): string {
  const hours = Math.round((ms / 3_600_000) * 100) / 100
  const isInteger = Number.isInteger(hours)
  // Для дробных значений в русском используется форма «часа»
  const noun = isInteger ? pluralRu(hours, ['час', 'часа', 'часов']) : 'часа'
  return `${isInteger ? hours : hours.toFixed(2)} ${noun}`
}

/** Сколько жетонов И.О. добывает за час оффлайна (ожидаемое значение) */
export function getActingTokensPerHourValue(): number {
  return getActingExpectedTokensPerHour(
    getActingTokenParamLevel('frequency'),
    getActingTokenParamLevel('chance'),
  )
}

/** Текст ожидаемой добычи жетонов в час: «1.8 жетона/ч» */
export function getActingTokensPerHourText(): string {
  const expected = getActingTokensPerHourValue()
  if (expected < 0.01) return 'Нет'

  const rounded = Math.round(expected * 10) / 10
  const isInteger = Number.isInteger(rounded)
  // Для дробных значений в русском используется форма «жетона»
  const noun = isInteger ? pluralRu(rounded, ['жетон', 'жетона', 'жетонов']) : 'жетона'
  const valueText = isInteger ? String(rounded) : rounded.toFixed(1)
  return `${valueText} ${noun}/ч`
}

/** Приблизительная добыча жетонов в час округлённая до целых: «~2 жетона/ч» */
export function getActingTokensPerHourApproxText(): string {
  const expected = getActingTokensPerHourValue()
  const rounded = Math.round(expected)
  if (rounded <= 0) return '~0 жетонов/ч'
  return `~${rounded} ${pluralRu(rounded, ['жетон', 'жетона', 'жетонов'])}/ч`
}

/** Текст значения параметра «Сбор жетонов» для указанного уровня */
export function getActingTokenParamValueText(param: ActingTokenParam, level: number): string {
  if (param === 'frequency') {
    const draws = getActingTokenDrawsPerHour(level)
    return `${draws} ${pluralRu(draws, ['розыгрыш', 'розыгрыша', 'розыгрышей'])}/ч`
  }
  if (param === 'chance') {
    return `${getActingTokenChance(level)}%`
  }
  return getActingTokenBreakdown(level)
}

/** Названия параметров «Сбора жетонов» */
export const ACTING_TOKEN_PARAM_TITLES: Record<ActingTokenParam, string> = {
  frequency: 'Частота',
  chance: 'Вероятность',
  value: 'Ценность',
}

/** Текст эффекта навыка для указанного уровня */
export function getActingBranchEffectText(branchId: ActingBranchId, level: number): string {
  if (branchId === 'performance') {
    return `${Math.round(getActingOfflineRate(level) * 100)}%`
  }
  if (branchId === 'duration') {
    return getActingDurationHoursText(getActingOfflineDurationMs(level))
  }
  // «Сбор жетонов» прокачивается тремя параметрами — показываем ожидаемый доход
  return getActingTokensPerHourText()
}

/** Распределение цветов жетонов для уровня «Ценности»: «красные 60% + зелёные 30% + золотые 10%» */
export function getActingTokenBreakdown(valueLevel: number): string {
  const distribution = getActingTokenDistribution(valueLevel)
  const labels: Record<ActingTokenColor, string> = {
    red: 'красные',
    green: 'зелёные',
    gold: 'золотые',
  }
  const order: ActingTokenColor[] = ['red', 'green', 'gold']

  return order
    .filter((color) => distribution[color] > 0)
    .map((color) => `${labels[color]} ${distribution[color]}%`)
    .join(' + ')
}

/** Максимальный уровень навыка */
export function getActingBranchMaxLevel(branchId: ActingBranchId): number {
  return ACTING_MAX_BRANCH_LEVELS[branchId]
}

/**
 * Улучшает навык «Производительность» или «Продолжительность» на один уровень.
 * «Сбор жетонов» прокачивается через upgradeActingTokenParam.
 * Уровень навыка покупается за хаускоины и требует свободного очка навыков.
 * @returns true если улучшение прошло
 */
export function upgradeActingBranch(branchId: ActingBranchId): boolean {
  if (branchId === 'tokens') return false

  const state = getState()
  const acting = state.actingManager
  const level = acting.branches[branchId] ?? 0

  if (level >= ACTING_MAX_BRANCH_LEVELS[branchId]) return false
  if (getActingAvailablePoints() <= 0) return false

  const cost = getActingUpgradeCost()
  if (state.money < cost) return false

  updateState({
    money: state.money - cost,
    actingManager: {
      ...acting,
      branches: { ...acting.branches, [branchId]: level + 1 },
    },
  })
  return true
}

/**
 * Улучшает один из трёх параметров «Сбора жетонов» на один уровень.
 * Уровень покупается за хаускоины и требует свободного очка навыков.
 * @returns true если улучшение прошло
 */
export function upgradeActingTokenParam(param: ActingTokenParam): boolean {
  const state = getState()
  const acting = state.actingManager
  const current = acting.tokenUpgrades[param] ?? 0

  if (current >= getActingTokenParamMaxLevel(param)) return false
  if (getActingAvailablePoints() <= 0) return false

  const cost = getActingUpgradeCost()
  if (state.money < cost) return false

  updateState({
    money: state.money - cost,
    actingManager: {
      ...acting,
      tokenUpgrades: { ...acting.tokenUpgrades, [param]: current + 1 },
      // Общий уровень ветки — сумма трёх параметров (для учёта очков)
      branches: { ...acting.branches, tokens: (acting.branches.tokens ?? 0) + 1 },
    },
  })
  return true
}
