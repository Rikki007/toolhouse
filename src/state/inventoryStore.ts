import { getState, updateState } from './state.ts'
import { getItemById, getStaffById, getRiggingById } from '../utils/itemLookup.ts'
import { applyStaffUpgrade } from '../utils/staffUpgrades.ts'
import { updateStateWithIncome } from './shiftsStore.ts'
import type { StaffReward, RiggingReward } from '../data/lootBoxRewards.ts'

/** Определяет слот техники по ID предмета */
export function getTechniqueSlot(itemId: string): 'orderPickers' | 'reachTrucks' | null {
  if (itemId.startsWith('orderpicker_')) return 'orderPickers'
  if (itemId.startsWith('reachtruck_eq_')) return 'reachTrucks'
  return null
}

/** Определяет категорию персонала по ID */
export function getStaffCategory(itemId: string): 'reachTruckDrivers' | 'pickers' | null {
  if (itemId.startsWith('reachtruck_')) return 'reachTruckDrivers'
  if (itemId.startsWith('picker_')) return 'pickers'
  return null
}

/** Определяет категорию снаряжения по ID */
export function getRiggingCategory(itemId: string): 'rigging' | null {
  if (itemId.startsWith('helmet_') || itemId.startsWith('closes_') || itemId.startsWith('ted_')) return 'rigging'
  return null
}

export function getShop() {
  return getState().shop
}

export function getInventory() {
  return getState().inventory
}

/** Удаляет прогресс прокачки сотрудника (при продаже) */
function withoutUpgrade(
  upgrades: Record<string, number>,
  itemId: string
): Record<string, number> {
  if (!(itemId in upgrades)) return upgrades
  const { [itemId]: _removed, ...rest } = upgrades
  return rest
}

/** Продать снаряжение из inventory — удаляет и возвращает деньги (НЕ возвращает в shop) */
export function sellRiggingItem(itemId: string): void {
  const item = getItemById(itemId)
  if (!item) return

  const shop = getState().shop
  const inventory = getState().inventory
  const money = getState().money
  const invRigging = [...(inventory.rigging ?? [])]

  // Удаляем только первый найденный элемент
  const idx = invRigging.indexOf(itemId)
  if (idx !== -1) {
    invRigging.splice(idx, 1)
  }

  updateState({
    shop: {
      ...shop,
    },
    inventory: {
      ...inventory,
      rigging: invRigging,
    },
    money: money + item.cost,
  })
}

/** Продать технику из inventory — удаляет один предмет и возвращает деньги */
export function sellTechniqueItem(itemId: string): void {
  const item = getItemById(itemId)
  if (!item) return

  const inventory = getState().inventory
  const money = getState().money

  const equipCat = getTechniqueSlot(itemId)
  if (!equipCat) return

  const invEquip = [...(inventory.equipment[equipCat] ?? [])]
  const idx = invEquip.indexOf(itemId)
  if (idx !== -1) {
    invEquip.splice(idx, 1)
  }

  // Доход не меняется: на него влияет только техника, закреплённая за сотрудником в смене
  updateState({
    inventory: {
      ...inventory,
      equipment: {
        ...inventory.equipment,
        [equipCat]: invEquip,
      },
    },
    money: money + item.cost,
  })
}

/** Убрать сотрудника из inventory (при назначении в смену) */
export function removeStaffFromInventory(staffId: string): void {
  const inventory = getState().inventory
  const staffCat = getStaffCategory(staffId)
  if (!staffCat) return

  updateState({
    inventory: {
      ...inventory,
      staff: {
        ...inventory.staff,
        [staffCat]: inventory.staff[staffCat].filter((id: string) => id !== staffId),
      },
    },
  })
}

/** Проверить, куплен ли предмет — то есть лежит ли он в инвентаре */
export function isItemPurchased(itemId: string): boolean {
  const inventory = getState().inventory

  const equipCat = getTechniqueSlot(itemId)
  if (equipCat) return inventory.equipment[equipCat].includes(itemId)

  const staffCat = getStaffCategory(itemId)
  if (staffCat) return inventory.staff[staffCat].includes(itemId)

  return (inventory.rigging ?? []).includes(itemId)
}

/**
 * Купить технику — добавляет в inventory без удаления из shop.
 * Техника покупается многократно, как снаряжение.
 * На пассивный доход техника влияет только будучи закреплённой за сотрудником
 * в смене, поэтому здесь достаточно обычного updateState.
 */
export function addTechniqueToInventory(itemId: string): void {
  const inventory = getState().inventory

  const equipCat = getTechniqueSlot(itemId)
  if (!equipCat) return

  updateState({
    inventory: {
      ...inventory,
      equipment: {
        ...inventory.equipment,
        [equipCat]: [...inventory.equipment[equipCat], itemId],
      },
    },
  })
}

/**
 * Купить предмет: кладёт его в inventory и убирает из shop.
 * Снаряжение покупается многократно, поэтому из shop.rigging не изымается.
 */
export function addItemToShop(itemId: string): void {
  const shop = getState().shop
  const inventory = getState().inventory

  if (getTechniqueSlot(itemId)) {
    addTechniqueToInventory(itemId)
    return
  }

  const staffCat = getStaffCategory(itemId)
  if (staffCat) {
    updateState({
      shop: {
        ...shop,
        staff: {
          ...shop.staff,
          [staffCat]: shop.staff[staffCat].filter((id: string) => id !== itemId),
        },
      },
      inventory: {
        ...inventory,
        staff: {
          ...inventory.staff,
          [staffCat]: [...inventory.staff[staffCat], itemId],
        },
      },
    })
    return
  }

  if (getRiggingCategory(itemId)) {
    updateState({
      inventory: {
        ...inventory,
        rigging: [...(inventory.rigging ?? []), itemId],
      },
    })
  }
}

/** Добавить награду лутбокса в инвентарь */
export function addLootboxReward(reward: StaffReward | RiggingReward): void {
  const inventory = getState().inventory

  if (reward.type === 'staff') {
    const staffCat = getStaffCategory(reward.id)
    if (!staffCat) return

    updateState({
      inventory: {
        ...inventory,
        staff: {
          ...inventory.staff,
          [staffCat]: [...inventory.staff[staffCat], reward.id],
        },
      },
    })
  } else if (reward.type === 'rigging') {
    updateState({
      inventory: {
        ...inventory,
        rigging: [...(inventory.rigging ?? []), reward.id],
      },
    })
  }
}

/** Забрать предмет из лутбокса — добавить в inventory */
/** Забрать награду лутбокса — добавить предмет в inventory */
export function takeLootboxReward(reward: StaffReward | RiggingReward): void {
  const inventory = getState().inventory

  if (reward.type === 'staff') {
    const staffCat = getStaffCategory(reward.id)
    if (!staffCat) return

    updateState({
      inventory: {
        ...inventory,
        staff: {
          ...inventory.staff,
          [staffCat]: [...inventory.staff[staffCat], reward.id],
        },
      },
    })
  } else if (reward.type === 'rigging') {
    updateState({
      inventory: {
        ...inventory,
        rigging: [...(inventory.rigging ?? []), reward.id],
      },
    })
  }
}

/** @deprecated используйте takeLootboxReward */
export function takeLootboxItem(reward: StaffReward | RiggingReward): void {
  takeLootboxReward(reward)
}

/** Продать предмет из лутбокса — удалить из inventory, начислить деньги */
/** Продать награду лутбокса — добавить предмет в inventory и сразу продать, начислив деньги */
export function sellLootboxReward(reward: StaffReward | RiggingReward): void {
  const inventory = getState().inventory
  const money = getState().money

  if (reward.type === 'staff') {
    const staffCat = getStaffCategory(reward.id)
    if (!staffCat) return

    const item = getStaffById(reward.id)
    const cost = item?.cost ?? 0

    // Удаляем из inventory, если там уже есть (на случай если игрок сначала нажал "Забрать")
    const invStaff = [...inventory.staff[staffCat]]
    const idx = invStaff.indexOf(reward.id)
    if (idx !== -1) invStaff.splice(idx, 1)

    updateState({
      inventory: {
        ...inventory,
        staff: {
          ...inventory.staff,
          [staffCat]: invStaff,
        },
      },
      money: money + cost,
    })
  } else if (reward.type === 'rigging') {
    const item = getRiggingById(reward.id)
    const cost = item?.price ?? 0

    const invRigging = [...(inventory.rigging ?? [])]
    const idx = invRigging.indexOf(reward.id)
    if (idx !== -1) invRigging.splice(idx, 1)

    updateState({
      inventory: {
        ...inventory,
        rigging: invRigging,
      },
      money: money + cost,
    })
  }
}

/** Продать предмет из inventory */
export function sellLootboxItem(reward: StaffReward | RiggingReward): void {
  const inventory = getState().inventory
  const money = getState().money

  if (reward.type === 'staff') {
    const staffCat = getStaffCategory(reward.id)
    if (!staffCat) return

    const item = getStaffById(reward.id)
    const cost = item?.cost ?? 0

    const invStaff = [...inventory.staff[staffCat]]
    const invIndex = invStaff.indexOf(reward.id)
    if (invIndex !== -1) invStaff.splice(invIndex, 1)

    updateState({
      inventory: {
        ...inventory,
        staff: {
          ...inventory.staff,
          [staffCat]: invStaff,
        },
      },
      money: money + cost,
    })
  } else if (reward.type === 'rigging') {
    const item = getRiggingById(reward.id)
    const cost = item?.price ?? 0

    const invRigging = [...(inventory.rigging ?? [])]
    const invIndex = invRigging.indexOf(reward.id)
    if (invIndex !== -1) invRigging.splice(invIndex, 1)

    updateState({
      inventory: {
        ...inventory,
        rigging: invRigging,
      },
      money: money + cost,
    })
  }
}


/** Продать предмет из inventory обратно в shop и вернуть деньги */
export function sellItem(itemId: string): void {
  const item = getItemById(itemId)
  if (!item) return

  const shop = getState().shop
  const inventory = getState().inventory
  const money = getState().money
  const staffUpgrades = getState().staffUpgrades

  // Определяем категорию
  const equipCat = getTechniqueSlot(itemId)
  const staffCat = getStaffCategory(itemId)
  const riggingCat = getRiggingCategory(itemId)

  if (equipCat) {
    // Техника — удаляем один предмет из inventory, возвращаем деньги (как снаряжение).
    // Доход не меняется: на него влияет только техника в слоте сотрудника в смене.
    const invEquip = [...(inventory.equipment[equipCat] ?? [])]
    const idx = invEquip.indexOf(itemId)
    if (idx !== -1) invEquip.splice(idx, 1)

    updateState({
      inventory: {
        ...inventory,
        equipment: {
          ...inventory.equipment,
          [equipCat]: invEquip,
        },
      },
      money: money + item.cost,
    })
  } else if (staffCat) {
    // Персонал — возвращаем в staff shop, прокачка аннулируется
    updateState({
      shop: {
        ...shop,
        staff: {
          ...shop.staff,
          [staffCat]: [...shop.staff[staffCat], itemId],
        },
      },
      inventory: {
        ...inventory,
        staff: {
          ...inventory.staff,
          [staffCat]: inventory.staff[staffCat].filter((id: string) => id !== itemId),
        },
      },
      staffUpgrades: withoutUpgrade(staffUpgrades, itemId),
      money: money + item.cost,
    })
  } else if (riggingCat) {
    // Снаряжение — возвращаем в rigging shop
    const shopRigging = shop.rigging ?? []
    const invRigging = [...(inventory.rigging ?? [])]
    const idx = invRigging.indexOf(itemId)
    if (idx !== -1) {
      invRigging.splice(idx, 1)
    }
    updateState({
      shop: {
        ...shop,
        rigging: [...shopRigging, itemId],
      },
      inventory: {
        ...inventory,
        rigging: invRigging,
      },
      money: money + item.cost,
    })
  }
}

/** Все id сотрудников, которыми сейчас владеет игрок (инвентарь + смены). */
export function getAllStaffIds(): string[] {
  const state = getState()
  const ids = new Set<string>()

  // Из инвентаря — массивы строк
  for (const id of state.inventory.staff.reachTruckDrivers) {
    ids.add(id)
  }
  for (const id of state.inventory.staff.pickers) {
    ids.add(id)
  }

  // Из смен — массивы ShiftStaff (объекты с id)
  for (const key of ['first', 'second', 'third'] as const) {
    const shift = state.shifts[key]
    for (const staff of shift.personnel.reachTruckDrivers) {
      const staffId = typeof staff === 'string' ? staff : staff.id
      ids.add(staffId)
    }
    for (const staff of shift.personnel.pickers) {
      const staffId = typeof staff === 'string' ? staff : staff.id
      ids.add(staffId)
    }
  }

  return Array.from(ids)
}

/**
 * Прокачать квалификацию сотрудника.
 * Списывает деньги, повышает скорость и пересчитывает пассивный доход.
 * Возвращает false, если сотрудник уже на потолке либо не хватает денег.
 */
export function upgradeStaff(staffId: string): boolean {
  const staff = getStaffById(staffId)
  if (!staff) return false

  const state = getState()
  const applied = applyStaffUpgrade(staff, state.staffUpgrades)
  if (!applied) return false

  if (state.money < applied.cost) return false

  updateStateWithIncome({
    money: state.money - applied.cost,
    staffUpgrades: applied.upgrades,
  })
  return true
}

