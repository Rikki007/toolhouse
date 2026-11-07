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
  },
  {
    id: 'orderpicker_2',
    name: 'Среднескоростной ордерпикер',
    image: 'picker_medium',
    price: 250000,
    speed: 5,
  },
  {
    id: 'orderpicker_3',
    name: 'Максимальный ордерпикер',
    image: 'picker_fast',
    price: 500000,
    speed: 7,
  },
]

export const reachTrucksList: Equipment[] = [
  {
    id: 'reachtruck_eq_1',
    name: 'Тихоходный погрузчик',
    image: 'reachtruck_slow',
    price: 250000,
    speed: 2,
  },
  {
    id: 'reachtruck_eq_2',
    name: 'Среднескоростной погрузчик',
    image: 'reachtruck_medium',
    price: 350000,
    speed: 3,
  },
  {
    id: 'reachtruck_eq_3',
    name: 'Высокоскоростной погрузчик',
    image: 'reachtruck_fast',
    price: 550000,
    speed: 4,
  },
  {
    id: 'reachtruck_eq_4',
    name: 'Тихоходный ричтрак',
    image: 'reachtruck_tall_slow',
    price: 650000,
    speed: 5,
  },
  {
    id: 'reachtruck_eq_5',
    name: 'Среднескоростной ричтрак',
    image: 'reachtruck_tall_medium',
    price: 750000,
    speed: 6,
  },
  {
    id: 'reachtruck_eq_6',
    name: 'Высокоскоростной ричтрак',
    image: 'reachtruck_tall_fast',
    price: 850000,
    speed: 7,
  },
]

// Объединённый список для обратной совместимости
export const equipmentList: Equipment[] = [
  ...orderPickersList,
  ...reachTrucksList,
]

