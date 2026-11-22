import type { StaffTier } from './staffUpgrades.ts'

export type ShopCategory = 'equipment' | 'staff'

export type StaffCategory = 'pickers' | 'reachTruckDrivers'

export type EquipmentCategory = 'orderPickers' | 'reachTrucks'

export interface Equipment {
  id: string
  name: string
  image: string
  price: number
  speed: number // 0-100
  factor: number
  /** Минимальный уровень игрока для появления в магазине */
  unlockLevel?: number
  /** Уровень игрока, с которого предмет пропадает из магазина */
  removeLevel?: number
}

export interface EquipmentCategoryConfig {
  id: EquipmentCategory
  label: string
  icon: string
}

export interface Staff {
  id: string
  name: string
  position: string
  avatar: string
  cost: number
  baseSpeed: number // 0-100
  purpose: 'shop' | 'lootbox'
  /** Стартовая лига без прокачки. По умолчанию 1 (красная) */
  startTier?: StaffTier
  /** Стартовый уровень скорости внутри startTier. По умолчанию baseSpeed */
  startLevel?: number
  /** Стоимость одного повышения квалификации. По умолчанию — доля от cost */
  upgradeCost?: number
  /** Во сколько раз дорожает квалификация за каждое следующее повышение. По умолчанию 1.5 */
  upgradePriceMultiplier?: number
}

export interface StaffCategoryConfig {
  id: StaffCategory
  label: string
  icon: string
}

export interface Rigging {
  id: string
  name: string
  image: string
  price: number
  speed: number
  factor: number
  type: 'headdress' | 'uniform' | 'tool'
  purpose: 'shop' | 'lootbox'
  /** Уровень игрока, с которого предмет пропадает из магазина */
  removeLevel?: number
}

/** Сотрудник в смене — с ID и слотами снаряжения */
export interface ShiftStaff {
  id: string
  slots: {
    headdress: string | null
    uniform: string | null
    tool: string | null
    technique: string | null
  }
}

/** Состояние магазина — только ID, полные данные lookup из data */
export interface ShopState {
  staff: {
    reachTruckDrivers: string[] // ID водителей ричтраков
    pickers: string[]           // ID сборщиков
  }
  equipment: {
    reachTrucks: string[]      // ID ричтраков
    orderPickers: string[]     // ID ордерпикеров
  }
  rigging: string[]            // ID купленного снаряжения
  /** ID жетонов (см. data/tokens.ts) */
  tokens?: string[]
}
