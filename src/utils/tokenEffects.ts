import { getState, updateState } from '../state/state.ts'
import { getTokenConfig } from './tokenLookup.ts'
import type { TokenId } from '../types/index.ts'
import { BOOST_COOLDOWN_MS } from './warehouseBoost.ts'
import { playSound } from '../state/audioManager.ts'

/** Куда открывать лутбоксы после использования жетона */
export interface TokenEffectOptions {
  /** Открыть указанное число лутбоксов подряд. Возвращает промис — ждём окончания серии */
  onLootboxOpen?: (count: number) => void | Promise<void>
}

/**
 * Применяет эффект жетона (без добавления в инвентарь).
 * Используется кнопкой «Использовать» в модалке лутбокса, в инвентаре
 * и в награде за уровень.
 * @returns промис, если эффект запускает серию лутбоксов, иначе undefined
 */
export function applyTokenEffect(
  tokenId: TokenId,
  options?: TokenEffectOptions,
): Promise<void> | undefined {
  const config = getTokenConfig(tokenId)

  if (config.kind === 'lootbox') {
    playSound('lootbox')
    const pending = options?.onLootboxOpen?.(config.lootboxCount ?? 1)
    return pending instanceof Promise ? pending : undefined
  }

  if (config.kind === 'acceleration') {
    applyAccelerationToken(config.boostDurationMs ?? 0)
  }
  return undefined
}

/**
 * Активирует или продлевает ускорение склада на durationMs.
 * Кулдаун всегда отсчитывается от нового окончания ускорения.
 * Жетон работает независимо от текущего кулдауна.
 */
export function applyAccelerationToken(durationMs: number): void {
  const state = getState()
  const now = Date.now()

  // Если буст уже идёт — продлеваем, иначе стартуем от текущего момента
  const baseUntil = Math.max(now, state.boostActiveUntil)
  const newActiveUntil = baseUntil + durationMs

  updateState({
    boostActiveUntil: newActiveUntil,
    boostCooldownEndsAt: newActiveUntil + BOOST_COOLDOWN_MS,
  })

  playSound('acceleration')
}
