import type { Equipment, Staff, Rigging, StaffUpgrades } from '../types/index.ts'
import { orderPickersList, reachTrucksList } from '../data/equipment.ts'
import { pickersList, reachTruckDriversList } from '../data/staff.ts'
import { riggingList } from '../data/rigging.ts'
import { getStaffSpeed } from './staffUpgrades.ts'
import type { InventoryItem } from '../types/index.ts'

// Все объекты техники
const equipmentMap = new Map<string, Equipment>()
for (const item of orderPickersList) equipmentMap.set(item.id, item)
for (const item of reachTrucksList) equipmentMap.set(item.id, item)

// Все объекты персонала
const staffMap = new Map<string, Staff>()
for (const item of pickersList) staffMap.set(item.id, item)
for (const item of reachTruckDriversList) staffMap.set(item.id, item)

// Все объекты снаряжения
const riggingMap = new Map<string, Rigging>()
for (const item of riggingList) riggingMap.set(item.id, item)

/** Получить полные данные Equipment по ID */
export function getEquipmentById(id: string): Equipment | undefined {
  return equipmentMap.get(id)
}

/** Получить полные данные Staff по ID */
export function getStaffById(id: string): Staff | undefined {
  return staffMap.get(id)
}

/** Скорость склада по ID с учётом купленных повышений, либо undefined если склада нет */
export function getStaffSpeedById(id: string, upgrades?: StaffUpgrades): number | undefined {
  const staff = staffMap.get(id)
  return staff ? getStaffSpeed(staff, upgrades) : undefined
}

/** Получить полные данные Rigging по ID */
export function getRiggingById(id: string): Rigging | undefined {
  return riggingMap.get(id)
}

/** Получить InventoryItem по ID (нормализация из Equipment/Staff/Rigging) */
export function getItemById(id: string, upgrades?: StaffUpgrades): InventoryItem | undefined {
  const equip = equipmentMap.get(id)
  if (equip) {
    const category = equip.name.includes('Ордерпикер')
      ? 'Ордерпикеры'
      : 'Погрузчики/ричтраки'
    return {
      id: equip.id,
      name: equip.name,
      type: 'equipment',
      category,
      cost: equip.price,
      speed: equip.speed,
      imageKey: equip.image,
    }
  }

  const staff = staffMap.get(id)
  if (staff) {
    return {
      id: staff.id,
      name: staff.name,
      type: 'staff',
      category: staff.position,
      cost: staff.cost,
      avatar: staff.avatar,
      speed: getStaffSpeed(staff, upgrades),
    }
  }

  const rigging = riggingMap.get(id)
  if (rigging) {
    return {
      id: rigging.id,
      name: rigging.name,
      type: 'rigging',
      category: 'Снаряжение',
      cost: rigging.price,
      speed: rigging.speed,
      imageKey: rigging.image,
    }
  }

  return undefined
}

/** Получить массив InventoryItem по массиву ID */
export function getItemsByIds(ids: string[], upgrades?: StaffUpgrades): InventoryItem[] {
  return ids
    .map(id => getItemById(id, upgrades))
    .filter((item): item is InventoryItem => item !== undefined)
}
