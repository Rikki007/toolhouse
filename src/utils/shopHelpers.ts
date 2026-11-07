import type { Equipment, Staff, StaffCategory, EquipmentCategory, Rigging } from '../types/index.ts'
import { equipmentList, orderPickersList, reachTrucksList } from '../data/equipment.ts'
import { staffList, pickersList, reachTruckDriversList } from '../data/staff.ts'
import { riggingList } from '../data/rigging.ts'

/** Получить все предметы категории */
export function getItemsByCategory(categoryId: string): (Equipment | Staff)[] {
  switch (categoryId) {
    case 'equipment':
      return equipmentList
    case 'staff':
      return staffList
    default:
      return []
  }
}

/** Получить персонал по подкатегории */
export function getStaffByCategory(categoryId: StaffCategory): Staff[] {
  switch (categoryId) {
    case 'pickers':
      return pickersList
    case 'reachTruckDrivers':
      return reachTruckDriversList
    default:
      return []
  }
}

/** Получить технику по подкатегории */
export function getEquipmentByCategory(categoryId: EquipmentCategory): Equipment[] {
  switch (categoryId) {
    case 'orderPickers':
      return orderPickersList
    case 'reachTrucks':
      return reachTrucksList
    default:
      return []
  }
}

/** Получить снаряжение */
export function getRiggingByCategory(): Rigging[] {
  return riggingList
}
