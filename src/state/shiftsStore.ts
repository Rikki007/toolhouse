import type { ShiftConfig, ShiftsState, ShiftStaff } from '../types/index.ts'
import type { AppState } from './state.ts'
import { getState, updateState, SHIFT_CONFIGS } from './state.ts'
import { calculatePassiveIncome, calculateShiftsMultiplier, getIncomeSources } from '../utils/passiveIncome.ts'

export { SHIFT_CONFIGS as shiftConfigs }

/**
 * Обновляет стейт с пересчётом пассивного дохода.
 * На доход влияют навыки, персонал активных смен, его снаряжение,
 * прокачка квалификации и купленная техника — поэтому любое изменение
 * этих ключей должно проходить через эту функцию (аналогично покупке навыков).
 */
export function updateStateWithIncome(changes: Partial<AppState>): void {
  const state = getState()
  updateState({
    ...changes,
    passiveIncomePerSecond: calculatePassiveIncome(getIncomeSources({
      skills: changes.skills ?? state.skills,
      branchChoices: changes.branchChoices ?? state.branchChoices,
      shifts: changes.shifts ?? state.shifts,
      staffUpgrades: changes.staffUpgrades ?? state.staffUpgrades,
      masterUpgrades: changes.masterUpgrades ?? state.masterUpgrades,
      inventory: changes.inventory ?? state.inventory,
    })),
  })
}

/** Создать пустого сотрудника со слотами */
function createEmptyStaff(id: string): ShiftStaff {
  return { id, slots: { headdress: null, uniform: null, tool: null } }
}

/** Получить ключ смены по ID */
function getShiftKeyById(id: number): 'first' | 'second' | 'third' {
  if (id === 1) return 'first'
  if (id === 2) return 'second'
  return 'third'
}

/**
 * Покупает смену. Если смена уже куплена — возвращает false.
 * Читает текущий баланс из централизованного стейта.
 * @returns true если успешно куплена, false если уже активна
 */
export function buyShift(shiftId: number): { success: boolean; error?: string } {
  const state = getState()
  const config = SHIFT_CONFIGS.find(c => c.id === shiftId)

  if (!config) {
    return { success: false, error: 'Неизвестная смена' }
  }

  const shiftKey = getShiftKeyById(shiftId)
  const shift = state.shifts[shiftKey]

  // Проверяем, что предыдущая смена уже куплена (цепочка: 1→2→3)
  if (shiftId > 1) {
    const prevShiftKey = getShiftKeyById(shiftId - 1)
    const prevShift = state.shifts[prevShiftKey]
    if (!prevShift.isActive) {
      return { success: false, error: 'Сначала купите предыдущую смену' }
    }
  }

  // Если уже активна
  if (shift.isActive) {
    return { success: false, error: 'Эта смена уже активна' }
  }

  // Проверяем деньги
  if (state.money < shift.cost) {
    return { success: false, error: 'Недостаточно средств' }
  }

  // Покупаем
  updateStateWithIncome({
    money: state.money - shift.cost,
    shifts: {
      ...state.shifts,
      [shiftKey]: {
        ...shift,
        isActive: true,
      },
    },
  })
  return { success: true }
}

/** Множитель дохода в зависимости от активных смен */
export function getShiftIncomeMultiplier(): number {
  return calculateShiftsMultiplier(getState().shifts)
}

/** Получить смену по ID */
export function getShift(shiftId: number): ShiftsState[keyof ShiftsState] {
  const state = getState()
  const shiftKey = getShiftKeyById(shiftId)
  return state.shifts[shiftKey]
}

/** Текущий активный сдвиг (максимальный ID) */
export function getCurrentShiftConfig(): ShiftConfig {
  const state = getState()
  const activeShifts = SHIFT_CONFIGS.filter(c => {
    const shiftKey = getShiftKeyById(c.id)
    return state.shifts[shiftKey].isActive
  })
  
  if (activeShifts.length === 0) return SHIFT_CONFIGS[0]
  return activeShifts[activeShifts.length - 1]
}

/** Получить персонал смены по ID */
export function getShiftPersonnel(shiftId: number): ShiftsState['first']['personnel'] {
  const state = getState()
  const shiftKey = getShiftKeyById(shiftId)
  return state.shifts[shiftKey].personnel
}

/** Назначить персонал на слот (по индексу в массиве) */
export function setPersonnelSlot(
  shiftId: number,
  role: 'forklift' | 'picker',
  slotIndex: number,
  staff: ShiftStaff | null
): void {
  const state = getState()
  const shiftKey = getShiftKeyById(shiftId)
  const shift = state.shifts[shiftKey]
  
  // Преобразуем role в название массива
  const personnelKey = role === 'forklift' ? 'reachTruckDrivers' as const : 'pickers' as const
  const currentArray = [...shift.personnel[personnelKey]]
  
  // Обновляем массив
  if (staff === null) {
    currentArray.splice(slotIndex, 1)
  } else {
    currentArray[slotIndex] = staff
  }

  updateStateWithIncome({
    shifts: {
      ...state.shifts,
      [shiftKey]: {
        ...shift,
        personnel: {
          ...shift.personnel,
          [personnelKey]: currentArray,
        },
      },
    },
  })
}

/**
 * Добавить сотрудника в массив personnel (как объект ShiftStaff)
 */
export function addStaffToShift(
  shiftId: number,
  role: 'forklift' | 'picker',
  staffId: string
): void {
  const state = getState()
  const shiftKey = getShiftKeyById(shiftId)
  const shift = state.shifts[shiftKey]
  
  const personnelKey = role === 'forklift' ? 'reachTruckDrivers' as const : 'pickers' as const
  const currentArray = [...shift.personnel[personnelKey]]
  
  // Создаём объект сотрудника со слотами
  const staff: ShiftStaff = createEmptyStaff(staffId)
  
  // Добавляем в конец массива
  currentArray.push(staff)

  updateStateWithIncome({
    shifts: {
      ...state.shifts,
      [shiftKey]: {
        ...shift,
        personnel: {
          ...shift.personnel,
          [personnelKey]: currentArray,
        },
      },
    },
  })
}

/**
 * Удалить сотрудника со слота и вернуть в инвентарь
 * При этом снаряжение сотрудника тоже возвращается в инвентарь rigging
 */
export function removeStaffFromShift(
  shiftId: number,
  role: 'forklift' | 'picker',
  slotIndex: number
): void {
  const state = getState()
  const shiftKey = getShiftKeyById(shiftId)
  const shift = state.shifts[shiftKey]
  
  const personnelKey = role === 'forklift' ? 'reachTruckDrivers' as const : 'pickers' as const
  const currentArray = [...shift.personnel[personnelKey]]
  
  // Получаем объект сотрудника для возврата в инвентарь
  const staffObj = currentArray[slotIndex]
  const staffId = typeof staffObj === 'string' ? staffObj : staffObj.id
  
  // Извлекаем ID снаряжения для возврата в инвентарь
  const riggingIds: string[] = []
  if (typeof staffObj !== 'string') {
    if (staffObj.slots.headdress) riggingIds.push(staffObj.slots.headdress)
    if (staffObj.slots.uniform) riggingIds.push(staffObj.slots.uniform)
    if (staffObj.slots.tool) riggingIds.push(staffObj.slots.tool)
  }
  
  // Удаляем сотрудника со слота
  currentArray.splice(slotIndex, 1)

  updateStateWithIncome({
    shifts: {
      ...state.shifts,
      [shiftKey]: {
        ...shift,
        personnel: {
          ...shift.personnel,
          [personnelKey]: currentArray,
        },
      },
    },
    inventory: {
      ...state.inventory,
      staff: {
        ...state.inventory.staff,
        [personnelKey]: [...state.inventory.staff[personnelKey], staffId],
      },
      rigging: [...state.inventory.rigging, ...riggingIds],
    },
  })
}

/**
 * Получить роль по позиции персонала
 */
export function getRoleByPosition(position: string): 'forklift' | 'picker' | null {
  if (position === 'Водитель ричтрака') return 'forklift'
  if (position === 'Комплектовщик') return 'picker'
  return null
}

/**
 * Получить список активных смен
 */
export function getActiveShifts(): Array<{ id: number; label: string }> {
  const state = getState()
  const result: Array<{ id: number; label: string }> = []
  
  if (state.shifts.first.isActive) {
    result.push({ id: 1, label: '1-я смена' })
  }
  if (state.shifts.second.isActive) {
    result.push({ id: 2, label: '2-я смена' })
  }
  if (state.shifts.third.isActive) {
    result.push({ id: 3, label: '3-я смена' })
  }
  
  return result
}

/**
 * Получить информацию о заполненности смен для указанной роли
 * Возвращает массив с количеством свободных слотов для каждой смены
 */
export function getShiftSlotAvailability(role: 'forklift' | 'picker'): Array<{ shiftId: number; availableSlots: number }> {
  const state = getState()
  
  const maxSlots = role === 'forklift' ? 4 : 5
  
  return [
    { shiftId: 1, availableSlots: maxSlots - state.shifts.first.personnel[role === 'forklift' ? 'reachTruckDrivers' : 'pickers'].length },
    { shiftId: 2, availableSlots: maxSlots - state.shifts.second.personnel[role === 'forklift' ? 'reachTruckDrivers' : 'pickers'].length },
    { shiftId: 3, availableSlots: maxSlots - state.shifts.third.personnel[role === 'forklift' ? 'reachTruckDrivers' : 'pickers'].length },
  ]
}

/**
 * Назначить сотрудника в конкретную смену
 * @param shiftId ID смены (1, 2 или 3)
 * @param role роль сотрудника
 * @param staffId ID сотрудника
 * @returns true если успешно назначен
 */
export function assignStaffToShift(
  shiftId: number,
  role: 'forklift' | 'picker',
  staffId: string
): boolean {
  const state = getState()
  const shiftKey = getShiftKeyById(shiftId)
  const shift = state.shifts[shiftKey]
  
  // Проверяем, что смена активна
  if (!shift.isActive) {
    return false
  }
  
  const personnelKey = role === 'forklift' ? 'reachTruckDrivers' as const : 'pickers' as const
  const currentArray = [...shift.personnel[personnelKey]]
  
  // Проверяем, есть ли свободные слоты
  const maxSlots = role === 'forklift' ? 4 : 5
  if (currentArray.length >= maxSlots) {
    return false
  }
  
  // Создаём объект сотрудника со слотами
  const staff: ShiftStaff = createEmptyStaff(staffId)
  
  // Добавляем сотрудника
  currentArray.push(staff)

  updateStateWithIncome({
    shifts: {
      ...state.shifts,
      [shiftKey]: {
        ...shift,
        personnel: {
          ...shift.personnel,
          [personnelKey]: currentArray,
        },
      },
    },
  })
  
  return true
}

/**
 * Установить снаряжение в слот сотруднику в смене
 * @param shiftId ID смены
 * @param role роль сотрудника
 * @param slotIndex индекс слота сотрудника в массиве
 * @param equipmentSlot 'headdress' | 'uniform' | 'tool'
 * @param riggingId ID снаряжения (null для очистки)
 */
export function setStaffEquipmentSlot(
  shiftId: number,
  role: 'forklift' | 'picker',
  slotIndex: number,
  equipmentSlot: 'headdress' | 'uniform' | 'tool',
  riggingId: string | null
): void {
  const state = getState()
  const shiftKey = getShiftKeyById(shiftId)
  const shift = state.shifts[shiftKey]
  
  const personnelKey = role === 'forklift' ? 'reachTruckDrivers' as const : 'pickers' as const
  const currentArray = [...shift.personnel[personnelKey]]
  
  // Проверяем что слот существует
  if (slotIndex < 0 || slotIndex >= currentArray.length) return
  
  const staffObj = currentArray[slotIndex]
  // Если это строка (старый формат), конвертируем
  const staff: ShiftStaff = typeof staffObj === 'string' 
    ? createEmptyStaff(staffObj) 
    : { ...staffObj }
  
  // Если снимаем снаряжение — возвращаем в инвентарь
  if (riggingId === null && staff.slots[equipmentSlot] !== null) {
    const oldRiggingId = staff.slots[equipmentSlot]!
    // Обнуляем слот в объекте сотрудника
    staff.slots = { ...staff.slots, [equipmentSlot]: null }
    updateStateWithIncome({
      shifts: {
        ...state.shifts,
        [shiftKey]: {
          ...shift,
          personnel: {
            ...shift.personnel,
            [personnelKey]: [
              ...currentArray.slice(0, slotIndex),
              staff,
              ...currentArray.slice(slotIndex + 1),
            ],
          },
        },
      },
      inventory: {
        ...state.inventory,
        rigging: [...state.inventory.rigging, oldRiggingId],
      },
    })
  } else {
    // Ставим новое снаряжение
    const oldRiggingId = staff.slots[equipmentSlot]
    staff.slots = { ...staff.slots, [equipmentSlot]: riggingId }
    
    // Если было старое снаряжение — возвращаем в инвентарь
    let updatedRigging = [...state.inventory.rigging]
    if (oldRiggingId !== null) {
      updatedRigging = [...updatedRigging, oldRiggingId]
    }
    // Удаляем одно новое снаряжение из инвентаря
    if (riggingId !== null) {
      const removeIndex = updatedRigging.indexOf(riggingId)
      if (removeIndex !== -1) {
        updatedRigging.splice(removeIndex, 1)
      }
    }
    
    updateStateWithIncome({
      shifts: {
        ...state.shifts,
        [shiftKey]: {
          ...shift,
          personnel: {
            ...shift.personnel,
            [personnelKey]: [
              ...currentArray.slice(0, slotIndex),
              staff,
              ...currentArray.slice(slotIndex + 1),
            ],
          },
        },
      },
      inventory: {
        ...state.inventory,
        rigging: updatedRigging,
      },
    })
  }
}
