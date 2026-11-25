import {
  ACTING_DURATION_BASE_MS,
  ACTING_DURATION_MAX_MS,
  ACTING_DURATION_STEP_MS,
  ACTING_PERFORMANCE_BASE_RATE,
  ACTING_PERFORMANCE_MAX_RATE,
  ACTING_PERFORMANCE_STEP,
  ACTING_TOKEN_CHANCE_BASE,
  ACTING_TOKEN_CHANCE_MAX,
  ACTING_TOKEN_CHANCE_STEP,
  ACTING_TOKEN_DISTRIBUTION,
  ACTING_TOKEN_FREQUENCY_BASE,
  ACTING_TOKEN_FREQUENCY_MAX,
} from '../data/actingManager.ts'
import type { ActingTokenColor, ActingTokenKind, TokenId } from '../types/index.ts'

/**
 * Доля пассивного дохода, которая начисляется в оффлайне.
 * Растёт на ACTING_PERFORMANCE_STEP за уровень и упирается в 100%.
 */
export function getActingOfflineRate(level: number): number {
  const rate = ACTING_PERFORMANCE_BASE_RATE + ACTING_PERFORMANCE_STEP * Math.max(0, level)
  return Math.min(ACTING_PERFORMANCE_MAX_RATE, Math.round(rate * 100) / 100)
}

/** Сколько времени оффлайн-доход копится при текущем уровне «Продолжительности» */
export function getActingOfflineDurationMs(level: number): number {
  const duration = ACTING_DURATION_BASE_MS + ACTING_DURATION_STEP_MS * Math.max(0, level)
  return Math.min(ACTING_DURATION_MAX_MS, duration)
}

/** Сколько розыгрышей жетона происходит за час оффлайна */
export function getActingTokenDrawsPerHour(frequencyLevel: number): number {
  const draws = ACTING_TOKEN_FREQUENCY_BASE + Math.max(0, Math.floor(frequencyLevel))
  return Math.min(ACTING_TOKEN_FREQUENCY_MAX, draws)
}

/** Вероятность, что розыгрыш даст жетон, % */
export function getActingTokenChance(chanceLevel: number): number {
  const chance = ACTING_TOKEN_CHANCE_BASE + ACTING_TOKEN_CHANCE_STEP * Math.max(0, Math.floor(chanceLevel))
  return Math.min(ACTING_TOKEN_CHANCE_MAX, chance)
}

/** Распределение цветов выпавшего жетона, % */
export function getActingTokenDistribution(valueLevel: number): Record<ActingTokenColor, number> {
  const index = Math.min(
    Math.max(0, Math.floor(valueLevel)),
    ACTING_TOKEN_DISTRIBUTION.length - 1,
  )
  const [red, green, gold] = ACTING_TOKEN_DISTRIBUTION[index]
  return { red, green, gold }
}

/** Ожидаемое количество жетонов за час с учётом частоты и вероятности */
export function getActingExpectedTokensPerHour(
  frequencyLevel: number,
  chanceLevel: number,
): number {
  return (getActingTokenDrawsPerHour(frequencyLevel) * getActingTokenChance(chanceLevel)) / 100
}

/** Все типы добываемых жетонов — по 1/3 вероятности на каждый */
const TOKEN_KINDS: ActingTokenKind[] = ['lootbox', 'acceleration', 'levelUp']

/** ID жетона по типу и цвету */
const TOKEN_IDS: Record<ActingTokenKind, Record<ActingTokenColor, TokenId>> = {
  lootbox: {
    red: 'lootboxTokenRed',
    green: 'lootboxTokenGreen',
    gold: 'lootboxTokenGold',
  },
  acceleration: {
    red: 'accelerationTokenRed',
    green: 'accelerationTokenGreen',
    gold: 'accelerationTokenGold',
  },
  levelUp: {
    red: 'levelUpTokenRed',
    green: 'levelUpTokenGreen',
    gold: 'levelUpTokenGold',
  },
}

/** Цвет жетона по распределению; roll — число в [0, 1) */
function pickTokenColor(
  distribution: Record<ActingTokenColor, number>,
  roll: number,
): ActingTokenColor {
  const redThreshold = distribution.red / 100
  const greenThreshold = (distribution.red + distribution.green) / 100
  if (roll < redThreshold) return 'red'
  if (roll < greenThreshold) return 'green'
  return 'gold'
}

/**
 * Розыгрыш жетонов за оффлайн.
 * Каждый розыгрыш с вероятностью `chance` даёт жетон, цвет выбирается
 * по распределению `distribution`. Тип жетона случаен (1/3).
 * @param draws — сколько розыгрышей произошло
 * @param chance — вероятность выпадения жетона при розыгрыше, %
 * @param distribution — распределение цветов, %
 * @param random — генератор случайных чисел (подменяется в тестах)
 */
export function rollActingTokens(
  draws: number,
  chance: number,
  distribution: Record<ActingTokenColor, number>,
  random: () => number = Math.random,
): TokenId[] {
  const tokens: TokenId[] = []
  if (draws <= 0 || chance <= 0) return tokens

  for (let i = 0; i < draws; i++) {
    // Розыгрыш: выпал ли жетон
    if (random() * 100 >= chance) continue
    const color = pickTokenColor(distribution, random())
    const kind = TOKEN_KINDS[Math.floor(random() * TOKEN_KINDS.length)] ?? 'lootbox'
    tokens.push(TOKEN_IDS[kind][color])
  }
  return tokens
}
