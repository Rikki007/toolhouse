import type { Staff, StaffUpgrades } from '../types/index.ts'
import { MAX_STAFF_UPGRADES } from '../types/index.ts'
import { pickersList, reachTruckDriversList } from '../data/staff.ts'
import {
  MAX_STAFF_SPEED,
  UPGRADE_COST_RATIO,
  UPGRADE_PRICE_MULTIPLIER,
  UPGRADE_SPEED_BONUS,
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

/** Сколько повышений квалификации уже куплено на сотрудника */
export function getUpgradeCount(upgrades: StaffUpgrades | undefined, staffId: string): number {
  return upgrades?.[staffId] ?? 0
}

/** Скорость сотрудника с учётом купленных повышений, не выше MAX_STAFF_SPEED */
export function getStaffSpeed(staff: Staff, upgrades?: StaffUpgrades): number {
  const count = getUpgradeCount(upgrades, staff.id)
  return Math.min(MAX_STAFF_SPEED, staff.baseSpeed + UPGRADE_SPEED_BONUS * count)
}

/** Достигнут либо потолок скорости, либо лимит повышений */
export function isStaffMaxedOut(staff: Staff, upgrades?: StaffUpgrades): boolean {
  return (
    getUpgradeCount(upgrades, staff.id) >= MAX_STAFF_UPGRADES ||
    getStaffSpeed(staff, upgrades) >= MAX_STAFF_SPEED
  )
}

/**
 * Цена следующего повышения: стоимость сотрудника × UPGRADE_COST_RATIO,
 * каждое следующее дороже предыдущего в UPGRADE_PRICE_MULTIPLIER раз.
 * null — повышать дальше некуда.
 */
export function getUpgradeCost(staff: Staff, upgrades?: StaffUpgrades): number | null {
  if (isStaffMaxedOut(staff, upgrades)) return null
  const count = getUpgradeCount(upgrades, staff.id)
  return Math.round(
    staff.cost * UPGRADE_COST_RATIO * Math.pow(UPGRADE_PRICE_MULTIPLIER, count),
  )
}

/** Что игрок получит за следующие деньги, либо null если прокачка завершена */
export function getNextUpgrade(
  staff: Staff,
  upgrades?: StaffUpgrades,
): { cost: number; from: number; to: number } | null {
  const cost = getUpgradeCost(staff, upgrades)
  if (cost === null) return null

  const from = getStaffSpeed(staff, upgrades)
  return { cost, from, to: Math.min(from + UPGRADE_SPEED_BONUS, MAX_STAFF_SPEED) }
}

/**
 * Покупка повышения: возвращает обновлённую карту повышений и цену,
 * либо null если покупка невозможна (прокачка завершена).
 * Проверку баланса делает вызывающая сторона — тут только расчёт.
 */
export function applyStaffUpgrade(
  staff: Staff,
  upgrades?: StaffUpgrades,
): { upgrades: StaffUpgrades; cost: number } | null {
  const cost = getUpgradeCost(staff, upgrades)
  if (cost === null) return null

  const current: StaffUpgrades = upgrades ?? {}
  return {
    upgrades: { ...current, [staff.id]: getUpgradeCount(upgrades, staff.id) + 1 },
    cost,
  }
}

