import { getState, updateState } from './state.ts'
import { updateStateWithIncome } from './shiftsStore.ts'
import { getTokenConfig } from '../utils/tokenLookup.ts'
import { applyStarUpgrade, getUpgradeableStaff } from '../utils/staffUpgrades.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import type { TokenConfig, TokenId } from '../types/index.ts'

/**
 * Использовать жетон — удалить из инвентаря и вернуть конфиг.
 * @returns null если жетона нет в инвентаре
 */
export function consumeToken(tokenId: TokenId): ReturnType<typeof getTokenConfig> | null {
  const inventory = getState().inventory
  const tokens = inventory.tokens ?? []
  const idx = tokens.indexOf(tokenId)
  if (idx === -1) return null

  // Удаляем жетон из инвентаря
  const newTokens = [...tokens]
  newTokens.splice(idx, 1)

  updateState({
    inventory: {
      ...inventory,
      tokens: newTokens,
    },
  })

  return getTokenConfig(tokenId)
}

/**
 * Забрать жетон в инвентарь из лутбокса.
 */
export function takeLootboxToken(tokenId: TokenId): void {
  const inventory = getState().inventory
  updateState({
    inventory: {
      ...inventory,
      tokens: [...(inventory.tokens ?? []), tokenId],
    },
  })
}

/** Цена продажи жетона по его редкости (одинакова для всех типов жетонов) */
export function getTokenSellPrice(tokenId: TokenId): number {
  const config = getTokenConfig(tokenId)
  if (config.color === 'gold') return 10_500
  if (config.color === 'green') return 8_000
  return 5_000
}

/**
 * Продать жетон (вернуть в каталог).
 * Стоимость зависит только от редкости: красный, зелёный, золотой.
 */
export function sellLootboxToken(tokenId: TokenId): void {
  const sellPrice = getTokenSellPrice(tokenId)

  const inventory = getState().inventory
  const tokens = inventory.tokens ?? []
  const idx = tokens.indexOf(tokenId)

  if (idx !== -1) {
    const newTokens = [...tokens]
    newTokens.splice(idx, 1)
    updateState({
      inventory: { ...inventory, tokens: newTokens },
      money: getState().money + sellPrice,
    })
  } else {
    // Продаём сразу из лутбокса — начисляем деньги без добавления в инвентарь
    updateState({ money: getState().money + sellPrice })
  }
}

/** Количество жетонов данного типа в инвентаре */
export function getTokenCount(tokenId: TokenId): number {
  const tokens = getState().inventory.tokens ?? []
  return tokens.filter((id) => id === tokenId).length
}

/**
 * Продать все жетоны одного типа из инвентаря.
 * Возвращает сумму, начисленную за продажу.
 */
export function sellAllTokens(tokenId: TokenId): number {
  const inventory = getState().inventory
  const tokens = inventory.tokens ?? []
  const count = tokens.filter((id) => id === tokenId).length
  if (count === 0) return 0

  const total = getTokenSellPrice(tokenId) * count
  updateState({
    inventory: { ...inventory, tokens: tokens.filter((id) => id !== tokenId) },
    money: getState().money + total,
  })
  return total
}

/** Порядок предпочтения жетонов повышения: золото → зелёный → красный */
const LEVEL_UP_TOKEN_ORDER: TokenId[] = [
  'levelUpTokenGold',
  'levelUpTokenGreen',
  'levelUpTokenRed',
]

/** Лучший жетон повышения уровня в инвентаре, либо null */
export function getBestLevelUpToken(): TokenId | null {
  const tokens = getState().inventory.tokens ?? []
  for (const tokenId of LEVEL_UP_TOKEN_ORDER) {
    if (tokens.includes(tokenId)) return tokenId
  }
  return null
}

/** Результат применения жетона повышения */
export interface LevelUpTokenResult {
  config: TokenConfig
  /** Сколько звёзд реально потрачено */
  spent: number
  /** Сколько звёзд осталось неиспользованными */
  leftover: number
}

/**
 * Применить жетон повышения уровня к сотруднику:
 * списывает жетон, повышает скорость и пересчитывает пассивный доход.
 * @returns null — жетона нет в инвентаре либо сотрудник на максимуме
 */
export function applyLevelUpTokenToStaff(
  tokenId: TokenId,
  staffId: string,
): LevelUpTokenResult | null {
  const config = getTokenConfig(tokenId)
  if (config.kind !== 'levelUp') return null

  const staff = getUpgradeableStaff(staffId)
  if (!staff) return null

  const state = getState()
  const tokens = state.inventory.tokens ?? []
  const idx = tokens.indexOf(tokenId)
  if (idx === -1) return null

  const stars = config.starCount ?? 1
  const applied = applyStarUpgrade(
    staff,
    state.staffUpgrades,
    stars,
    levelFromXp(state.xpMoney),
  )
  if (!applied) return null

  const newTokens = [...tokens]
  newTokens.splice(idx, 1)

  updateStateWithIncome({
    inventory: {
      ...state.inventory,
      tokens: newTokens,
    },
    staffUpgrades: applied.upgrades,
  })

  return { config, spent: applied.spent, leftover: applied.leftover }
}
