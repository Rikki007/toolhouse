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

/** ID смены со средним (фиксированным) штатом */
export const MIDDLE_SHIFT_ID = 4
/** Фиксированное количество водителей ричтраков в средней смене */
export const MIDDLE_SHIFT_FORKLIFT_SLOTS = 2
/** Фиксированное количество сборщиков в средней смене */
export const MIDDLE_SHIFT_PICKER_SLOTS = 3

/**
 * Количество слотов для роли на указанном уровне игрока.
 * На каждом уровне из SHIFT_EXPANSION_LEVELS добавляется +1 слот.
 */
export function getMaxSlotsForLevel(playerLevel: number, role: 'forklift' | 'picker'): number {
  const base = role === 'forklift' ? BASE_FORKLIFT_SLOTS : BASE_PICKER_SLOTS
  const expansions = SHIFT_EXPANSION_LEVELS.filter((level) => level <= playerLevel).length
  return base + expansions
}

/**
 * Максимум слотов для роли в конкретной смене.
 * Для смены с фиксированным штатом (средней) количество не зависит от уровня.
 */
export function getMaxSlotsForShift(playerLevel: number, role: 'forklift' | 'picker', shiftId: number): number {
  if (shiftId === MIDDLE_SHIFT_ID) {
    return role === 'forklift' ? MIDDLE_SHIFT_FORKLIFT_SLOTS : MIDDLE_SHIFT_PICKER_SLOTS
  }
  return getMaxSlotsForLevel(playerLevel, role)
}
