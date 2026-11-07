import { getState } from './state.ts'
import { updateStateWithIncome } from './shiftsStore.ts'
import { MASTER_UPGRADE_LEVELS, MASTER_UPGRADE_COST_RATIO, MASTER_UPGRADE_PRICE_MULTIPLIER } from '../data/masterUpgrades.ts'
import { MAX_MASTER_UPGRADES } from '../types/masterUpgrades.ts'
import type { MasterUpgrades } from '../types/masterUpgrades.ts'

/** Получить текущий уровень прокачки мастера */
export function getMasterUpgradeLevel(masterId: string): number {
  return getState().masterUpgrades[masterId] ?? 0
}

/** Получить все прокачки мастеров */
export function getMasterUpgrades(): MasterUpgrades {
  return getState().masterUpgrades
}

/** Получить множитель мастера по его текущему уровню */
export function getMasterFactor(masterId: string): number {
  const level = getMasterUpgradeLevel(masterId)
  const levelData = MASTER_UPGRADE_LEVELS[level]
  return levelData?.factor ?? 1.0
}

/** Получить текущее звание мастера */
export function getMasterTitle(masterId: string): string {
  const level = getMasterUpgradeLevel(masterId)
  const levelData = MASTER_UPGRADE_LEVELS[level]
  return levelData?.name ?? 'Новичок'
}

/** Получить иконку текущего уровня мастера */
export function getMasterLevelImageKey(masterId: string): string {
  const level = getMasterUpgradeLevel(masterId)
  const levelData = MASTER_UPGRADE_LEVELS[level]
  return levelData?.imageKey ?? 'first'
}

/** Проверить, достиг ли мастер максимального уровня */
export function isMasterMaxedOut(masterId: string): boolean {
  return getMasterUpgradeLevel(masterId) >= MAX_MASTER_UPGRADES
}

/**
 * Рассчитать стоимость следующего повышения мастера.
 * Цена привязана к стоимости смены.
 */
export function getMasterUpgradeCost(masterId: string, shiftCost: number): number | null {
  if (isMasterMaxedOut(masterId)) return null
  const level = getMasterUpgradeLevel(masterId)
  return Math.round(
    shiftCost * MASTER_UPGRADE_COST_RATIO * Math.pow(MASTER_UPGRADE_PRICE_MULTIPLIER, level),
  )
}

/**
 * Прокачать мастера.
 * @param masterId ID мастера
 * @param shiftCost Стоимость смены (для расчёта цены)
 * @returns true если успешно прокачан
 */
export function upgradeMaster(masterId: string, shiftCost: number): boolean {
  const level = getMasterUpgradeLevel(masterId)
  if (level >= MAX_MASTER_UPGRADES) return false

  const cost = getMasterUpgradeCost(masterId, shiftCost)
  if (cost === null) return false

  const state = getState()
  if (state.money < cost) return false

  const currentUpgrades = state.masterUpgrades
  updateStateWithIncome({
    money: state.money - cost,
    masterUpgrades: {
      ...currentUpgrades,
      [masterId]: level + 1,
    },
  })

  return true
}
