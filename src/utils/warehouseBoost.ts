/**
 * Константы буста «Ускорение работы склада».
 */
export const BOOST_DURATION_MS = 30_000  // 30 секунд
export const BOOST_COOLDOWN_MS = 5 * 60_000  // 5 минут
export const BOOST_MULTIPLIER = 2  // двойной доход

/**
 * Запускает буст.
 * @returns true если буст успешно активирован
 */
export function startBoost(state: { boostActiveUntil: number; boostCooldownEndsAt: number }): { success: boolean; error?: string } {
  const now = Date.now()

  // Уже активен
  if (state.boostActiveUntil > now) {
    return { success: false, error: 'Буст уже активен' }
  }

  // На кулдауне
  if (state.boostCooldownEndsAt > now) {
    return { success: false, error: 'Буст ещё не готов' }
  }

  return { success: true }
}

/**
 * Активирует буст.
 * Возвращает новые значения полей состояния.
 */
export function activateBoost(_state: { boostActiveUntil: number; boostCooldownEndsAt: number }): { boostActiveUntil: number; boostCooldownEndsAt: number } {
  const now = Date.now()
  return {
    boostActiveUntil: now + BOOST_DURATION_MS,
    boostCooldownEndsAt: now + BOOST_DURATION_MS + BOOST_COOLDOWN_MS,
  }
}

/**
 * Проверяет, активен ли буст.
 */
export function isBoostActive(state: { boostActiveUntil: number; boostCooldownEndsAt: number }): boolean {
  return state.boostActiveUntil > Date.now()
}

/**
 * Получает множитель дохода от буста (1 или 2).
 */
export function getBoostMultiplier(state: { boostActiveUntil: number; boostCooldownEndsAt: number }): number {
  return isBoostActive(state) ? BOOST_MULTIPLIER : 1
}

/**
 * Получает оставшееся время в мс (отрицательное если истекло).
 * @param targetTimestamp timestamp окончания
 */
export function getTimeRemaining(targetTimestamp: number): number {
  return Math.max(0, targetTimestamp - Date.now())
}

/**
 * Форматирует время в мм:сс.
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
