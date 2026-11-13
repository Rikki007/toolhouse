/**
 * Тир (лига) прокачки персонала.
 * 1 — красная, 2 — зелёная, 3 — жёлтая, 4 — серебряная,
 * 5 — рубиновая, 6 — изумрудная, 7 — алмазная, 8 — премиум.
 */
export type StaffTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/** Прогресс сотрудника внутри текущего тира */
export interface StaffTierProgress {
  /** Текущий тир (1-8) */
  tier: StaffTier
  /** Количество прокачанных уровней скорости внутри тира (0-10) */
  level: number
}

/** Прогресс прокачки персонала: staffId → прогресс тира */
export type StaffUpgrades = Record<string, StaffTierProgress>
