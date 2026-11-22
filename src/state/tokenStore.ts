import { getState, updateState } from './state.ts'
import { getTokenConfig } from '../utils/tokenLookup.ts'
import type { TokenId } from '../types/index.ts'

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

/**
 * Продать жетон (вернуть в каталог).
 * Стоимость зависит от типа: золотой дороже, красный дешевле.
 */
export function sellLootboxToken(tokenId: TokenId): void {
  const config = getTokenConfig(tokenId)
  // Цена продажи — по редкости
  const sellPrice = config.color === 'gold' ? 500_000 : config.color === 'green' ? 200_000 : 50_000

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
