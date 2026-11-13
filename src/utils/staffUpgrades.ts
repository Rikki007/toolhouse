import type { Staff, StaffUpgrades, StaffTier } from '../types/index.ts'
import { pickersList, reachTruckDriversList } from '../data/staff.ts'
import {
  MAX_STAFF_TIER,
  MAX_TIER_LEVEL,
  STAFF_TIERS,
  UPGRADE_COST_RATIO,
  UPGRADE_MAX_COST_EXPONENT,
  UPGRADE_PRICE_MULTIPLIER,
} from '../data/staffUpgrades.ts'

// Каталог сотрудников берём прямо из данных: itemLookup импортирует getStaffSpeed,
// поэтому импорт отсюда был бы циклическим.
const staffCatalog = new Map<string, Staff>()
for (const item of pickersList) staffCatalog.set(item.id, item)
for (const item of reachTruckDriversList) staffCatalog.set(item.id, item)

/** Данные сотрудника по ID */
export function getUpgradeableStaff(staffId: string): Staff | undefined {
  return staffCatalog.get(staffId)
}

/** Получает прогресс тира для сотрудника (дефолт: тир 1, уровень = baseSpeed) */
export function getStaffTierProgress(staff: Staff, upgrades?: StaffUpgrades): { tier: StaffTier; level: number } {
  const progress = upgrades?.[staff.id]
  if (progress) return progress
  // Начальный прогресс: тир 1, уровень = baseSpeed
  return { tier: 1, level: Math.min(staff.baseSpeed, MAX_TIER_LEVEL) }
}

/** Скорость сотрудника с учётом тира и уровня внутри него */
export function getStaffSpeed(staff: Staff, upgrades?: StaffUpgrades): number {
  const progress = getStaffTierProgress(staff, upgrades)
  const tierCfg = STAFF_TIERS[progress.tier - 1]
  return tierCfg.baseSpeed + progress.level * tierCfg.speedBonus
}

/** Итоговая максимальная скорость при достижении максимума текущего тира */
export function getMaxTierSpeed(tier: number): number {
  const tierCfg = STAFF_TIERS[tier - 1]
  return tierCfg.baseSpeed + MAX_TIER_LEVEL * tierCfg.speedBonus
}

/** Прокачка завершена: последняя лига на максимуме */
export function isStaffMaxedOut(staff: Staff, upgrades?: StaffUpgrades): boolean {
  const progress = getStaffTierProgress(staff, upgrades)
  return progress.tier >= MAX_STAFF_TIER && progress.level >= MAX_TIER_LEVEL
}

/** Ключ картинки закладки для текущего тира */
export function getStaffTierImageKey(staff: Staff, upgrades?: StaffUpgrades): string {
  const progress = getStaffTierProgress(staff, upgrades)
  return STAFF_TIERS[progress.tier - 1].imageKey
}

/**
 * Глобальный счётчик прокачки для расчёта цены.
 * На красном тире начальная позиция = baseSpeed, поэтому учитываем сдвиг.
 */
function getGlobalUpgradeCount(staff: Staff, progress: { tier: StaffTier; level: number }): number {
  if (progress.tier === 1) return progress.level - staff.baseSpeed
  return (MAX_TIER_LEVEL - staff.baseSpeed) + (progress.tier - 2) * MAX_TIER_LEVEL + progress.level
}

/**
 * Название текущего тира (лиги).
 */
export function getStaffTierName(staff: Staff, upgrades?: StaffUpgrades): string {
  const progress = getStaffTierProgress(staff, upgrades)
  return STAFF_TIERS[progress.tier - 1]?.name ?? STAFF_TIERS[0].name
}

/**
 * Название тира по его номеру (для кнопок перехода в новую лигу).
 */
export function getTierNameByNumber(tier: number): string {
  return STAFF_TIERS[tier - 1]?.name ?? 'Новый'
}

/**
 * Цена следующего повышения.
 * null — повышать дальше некуда.
 */
export function getUpgradeCost(staff: Staff, upgrades?: StaffUpgrades): number | null {
  if (isStaffMaxedOut(staff, upgrades)) return null
  const progress = getStaffTierProgress(staff, upgrades)

  // Текущий тир заполнен — проверяем, доступен ли переход
  if (progress.level >= MAX_TIER_LEVEL) {
    const nextTier = (progress.tier + 1) as StaffTier
    if (nextTier > MAX_STAFF_TIER) return null
  }

  const count = getGlobalUpgradeCount(staff, progress)
  const exponent = Math.min(count, UPGRADE_MAX_COST_EXPONENT)
  return Math.round(staff.cost * UPGRADE_COST_RATIO * Math.pow(UPGRADE_PRICE_MULTIPLIER, exponent))
}

/**
 * Что игрок получит за следующие деньги, либо null если прокачка завершена.
 * @param playerLevel — уровень игрока (нужен для проверки перехода на новый тир)
 */
export function getNextUpgrade(
  staff: Staff,
  upgrades?: StaffUpgrades,
  playerLevel?: number,
): { cost: number; from: number; to: number; nextTier: StaffTier } | null {
  if (isStaffMaxedOut(staff, upgrades)) return null

  const progress = getStaffTierProgress(staff, upgrades)
  const cost = getUpgradeCost(staff, upgrades)
  if (cost === null) return null

  if (progress.level < MAX_TIER_LEVEL) {
    // Обычное повышение внутри тира
    return { cost, from: progress.level, to: progress.level + 1, nextTier: progress.tier }
  }

  // Переход на следующий тир
  const nextTier = (progress.tier + 1) as StaffTier
  if (nextTier > MAX_STAFF_TIER) return null

  // Проверяем уровень игрока
  if (playerLevel !== undefined && playerLevel < STAFF_TIERS[nextTier - 1].unlockLevel) {
    return null
  }

  return { cost, from: MAX_TIER_LEVEL, to: 1, nextTier }
}

/**
 * Покупка повышения: возвращает обновлённую карту повышений и цену,
 * либо null если покупка невозможна.
 * @param playerLevel — уровень игрока (нужен для перехода на новый тир)
 */
export function applyStaffUpgrade(
  staff: Staff,
  upgrades?: StaffUpgrades,
  playerLevel?: number,
): { upgrades: StaffUpgrades; cost: number } | null {
  const cost = getUpgradeCost(staff, upgrades)
  if (cost === null) return null

  const progress = getStaffTierProgress(staff, upgrades)
  const current: StaffUpgrades = upgrades ?? {}
  let newProgress: { tier: StaffTier; level: number }

  if (progress.level < MAX_TIER_LEVEL) {
    newProgress = { tier: progress.tier, level: progress.level + 1 }
  } else {
    const nextTier = (progress.tier + 1) as StaffTier
    if (nextTier > MAX_STAFF_TIER) return null
    if (playerLevel !== undefined && playerLevel < STAFF_TIERS[nextTier - 1].unlockLevel) return null
    newProgress = { tier: nextTier, level: 1 }
  }

  return {
    upgrades: { ...current, [staff.id]: newProgress },
    cost,
  }
}

