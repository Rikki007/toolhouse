export interface ShiftConfig {
  id: number
  label: string
  price: number
  incomeMultiplier: number // множитель дохода при активной смене
  requiredLevel: number // минимальный уровень игрока для покупки
}

import type { ShiftStaff } from './equipment.ts'

export interface PersonnelSlot {
  id: string
  role: 'forklift' | 'picker'
  label: string
}

export interface ShiftMaster {
  id: string
  name: string
  position: string
  avatar: string
}

export interface ShiftPersonnel {
  master: string | null
  reachTruckDrivers: ShiftStaff[]
  pickers: ShiftStaff[]
}

export interface Shift {
  isActive: boolean
  personnel: ShiftPersonnel
  cost: number
}

export interface ShiftsState {
  first: Shift
  second: Shift
  third: Shift
}
