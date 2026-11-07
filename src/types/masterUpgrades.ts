/** Максимальный уровень прокачки мастера (0-4) */
export const MAX_MASTER_UPGRADES = 4

/** Прокачка мастеров: masterId → уровень (0-4) */
export type MasterUpgrades = Record<string, number>
