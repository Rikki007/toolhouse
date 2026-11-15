/**
 * Количество слотов персонала в смене.
 *
 * Файл намеренно не импортирует состояние: его используют и расчёт дохода,
 * и загрузка сейва (state.ts), поэтому циклические зависимости недопустимы.
 */

/** Начальное количество слотов водителей ричтраков */
export const BASE_FORKLIFT_SLOTS = 4

/** Начальное количество слотов сборщиков */
export const BASE_PICKER_SLOTS = 5

/** Уровни игрока, на которых смены расширяются на одного водителя и одного сборщика */
export const SHIFT_EXPANSION_LEVELS: number[] = [22, 27, 32, 37]

/**
 * Количество слотов для роли на указанном уровне игрока.
 * На каждом уровне из SHIFT_EXPANSION_LEVELS добавляется +1 слот.
 */
export function getMaxSlotsForLevel(playerLevel: number, role: 'forklift' | 'picker'): number {
  const base = role === 'forklift' ? BASE_FORKLIFT_SLOTS : BASE_PICKER_SLOTS
  const expansions = SHIFT_EXPANSION_LEVELS.filter((level) => level <= playerLevel).length
  return base + expansions
}
