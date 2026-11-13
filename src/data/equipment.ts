import type { Equipment } from '../types/index.ts'
import type { EquipmentCategoryConfig } from '../types/index.ts'

export const equipmentCategories: EquipmentCategoryConfig[] = [
  { id: 'orderPickers', label: 'Ордерпикеры', icon: '🚜' },
  { id: 'reachTrucks', label: 'Ричтраки', icon: '🏗️' },
]

export const orderPickersList: Equipment[] = [
  {
    id: 'orderpicker_1',
    name: 'Тихоходный ордерпикер',
    image: 'picker_slow',
    price: 100000,
    speed: 3,
    factor: 1.1,
  },
  {
    id: 'orderpicker_2',
    name: 'Среднескоростной ордерпикер',
    image: 'picker_medium',
    price: 350000,
    speed: 5,
    factor: 1.2,
  },
  {
    id: 'orderpicker_3',
    name: 'Максимальный ордерпикер',
    image: 'picker_fast',
    price: 700000,
    speed: 7,
    factor: 1.3,
  },
  {
    id: 'orderpicker_4',
    name: 'Премиум ордерпикер',
    image: 'picker_prem',
    price: 2000000,
    speed: 10,
    factor: 2,
    unlockLevel: 17,
  },
]

export const reachTrucksList: Equipment[] = [
  {
    id: 'reachtruck_eq_1',
    name: 'Тихоходный погрузчик',
    image: 'reachtruck_slow',
    price: 350000,
    speed: 2,
    factor: 1.05,
  },
  {
    id: 'reachtruck_eq_2',
    name: 'Среднескоростной погрузчик',
    image: 'reachtruck_medium',
    price: 600000,
    speed: 3,
    factor: 1.1,
  },
  {
    id: 'reachtruck_eq_3',
    name: 'Высокоскоростной погрузчик',
    image: 'reachtruck_fast',
    price: 800000,
    speed: 4,
    factor: 1.15,
  },
  {
    id: 'reachtruck_eq_4',
    name: 'Тихоходный ричтрак',
    image: 'reachtruck_tall_slow',
    price: 1100000,
    speed: 5,
    factor: 1.2,
  },
  {
    id: 'reachtruck_eq_5',
    name: 'Среднескоростной ричтрак',
    image: 'reachtruck_tall_medium',
    price: 1500000,
    speed: 6,
    factor: 1.25,
  },
  {
    id: 'reachtruck_eq_6',
    name: 'Высокоскоростной ричтрак',
    image: 'reachtruck_tall_fast',
    price: 1900000,
    speed: 7,
    factor: 1.3,
  },
  {
    id: 'reachtruck_eq_7',
    name: 'Премиальный ричтрак',
    image: 'reachtruck_tall_prem',
    price: 5000000,
    speed: 10,
    factor: 2,
    unlockLevel: 19,
  },
]

// Объединённый список для обратной совместимости
export const equipmentList: Equipment[] = [
  ...orderPickersList,
  ...reachTrucksList,
]

