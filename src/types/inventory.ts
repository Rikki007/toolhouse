/** Полные данные предмета (из data) */
export interface InventoryItem {
  id: string
  name: string
  type: 'staff' | 'equipment' | 'rigging'
  category: string
  cost: number
  avatar?: string
  speed?: number
  imageKey?: string // ключ для изображения
}

/** Состояние инвентаря — только ID, полные данные lookup из data */
export interface InventoryState {
  technique: string[] // массив ID техники
  staff: string[]     // массив ID персонала
  equipment: string[] // массив ID снаряжения
  rigging: string[]   // массив ID купленного снаряжения
}
