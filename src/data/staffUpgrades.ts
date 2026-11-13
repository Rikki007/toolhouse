/**
 * Баланс повышения квалификации сотрудников.
 *
 * Цена повышения привязана к стоимости самого сотрудника, поэтому менять
 * приходится только коэффициенты, а не список из 43 сотрудников.
 */

/** Доля от стоимости сотрудника, которую стоит первое повышение */
export const UPGRADE_COST_RATIO = 0.5

/** Во сколько раз дорожает каждое следующее повышение */
export const UPGRADE_PRICE_MULTIPLIER = 1.5

/**
 * Потолок показателя роста цены.
 * Всего в игре 8 лиг × 10 уровней = 80 повышений; без ограничения
 * множитель 1.5^80 делал бы последние уровни недостижимыми.
 */
export const UPGRADE_MAX_COST_EXPONENT = 25

/** Количество уровней внутри каждого тира */
export const MAX_TIER_LEVEL = 10

/**
 * Конфигурация тиров (лиг) персонала.
 * Определяет множитель скорости, порог уровня игрока для открытия и ключ картинки закладки.
 */
export interface StaffTierConfig {
  /** Название лиги */
  name: string
  /** Ключ картинки закладки (для tierImages) */
  imageKey: string
  /** Множитель скорости за один уровень внутри тира */
  speedBonus: number
  /** Уровень игрока для открытия тира */
  unlockLevel: number
  /** Базовая скорость при входе в тир (накоплено с предыдущих тиров) */
  baseSpeed: number
}

/**
 * Таблица лиг:
 * красная (1×), зелёная (5×), жёлтая (10×), серебряная (15×),
 * рубиновая (20×), изумрудная (25×), алмазная (30×), премиум (35×).
 * baseSpeed — сумма максимальной скорости всех предыдущих лиг (10 уровней × speedBonus).
 */
export const STAFF_TIERS: StaffTierConfig[] = [
  { name: 'Красная',    imageKey: 'tierOne',   speedBonus: 1,  unlockLevel: 1,  baseSpeed: 0 },
  { name: 'Зелёная',    imageKey: 'tierTwo',   speedBonus: 5,  unlockLevel: 5,  baseSpeed: 10 },
  { name: 'Жёлтая',     imageKey: 'tierThree', speedBonus: 10, unlockLevel: 10, baseSpeed: 60 },
  { name: 'Серебряная', imageKey: 'tierFour',  speedBonus: 15, unlockLevel: 15, baseSpeed: 160 },
  { name: 'Рубиновая',  imageKey: 'tierFive',  speedBonus: 20, unlockLevel: 20, baseSpeed: 310 },
  { name: 'Изумрудная', imageKey: 'tierSix',   speedBonus: 25, unlockLevel: 25, baseSpeed: 510 },
  { name: 'Алмазная',   imageKey: 'tierSeven', speedBonus: 30, unlockLevel: 30, baseSpeed: 760 },
  { name: 'Премиум',    imageKey: 'tierPrem',  speedBonus: 35, unlockLevel: 35, baseSpeed: 1060 },
]

/** Последний тир (номер последней лиги) */
export const MAX_STAFF_TIER = STAFF_TIERS.length
