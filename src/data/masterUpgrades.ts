/**
 * Данные прокачки мастеров.
 * Каждый уровень имеет множитель, название статуса и иконку уровня.
 */

export interface MasterUpgradeLevel {
  /** Название статуса мастера */
  name: string
  /** Множитель дохода смены */
  factor: number
  /** Ключ иконки уровня (для assetLoader) */
  imageKey: string
}

/** Все уровни прокачки мастера (индекс = уровень прокачки) */
export const MASTER_UPGRADE_LEVELS: MasterUpgradeLevel[] = [
  { name: 'Новичок', factor: 1.0, imageKey: 'first' },
  { name: 'Умелый', factor: 1.2, imageKey: 'second' },
  { name: 'Битый', factor: 1.4, imageKey: 'third' },
  { name: 'Матёрый', factor: 1.6, imageKey: 'fourth' },
  { name: 'Супермастер', factor: 1.8, imageKey: 'fifth' },
]

/** Доля от стоимости смены, которую стоит первое повышение мастера */
export const MASTER_UPGRADE_COST_RATIO = 0.5

/** Во сколько раз дорожает каждое следующее повышение мастера */
export const MASTER_UPGRADE_PRICE_MULTIPLIER = 1.5
