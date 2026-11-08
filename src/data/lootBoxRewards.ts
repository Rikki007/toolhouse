/** Типы наград лутбокса */
export type LootBoxRewardType = 'money'  | 'staff' | 'rigging'

/** Награда: деньги */
export interface MoneyReward {
  type: 'money'
  amount: number // сумма денег
}

/** Награда: персонал */
export interface StaffReward {
  type: 'staff'
  id: string // ID из data/staff.ts (picker_01, reachtruck_01 и т.д.)
}

/** Награда: снаряжение (заглушка, пока нет продуманной системы) */
export interface EquipmentItemReward {
  type: 'equipment_item'
  id: string // будущий ID снаряжения
}

/** Награда: снаряжение (rigging) */
export interface RiggingReward {
  type: 'rigging'
  id: string
}

/** Все типы наград объединены */
export type LootBoxReward = MoneyReward | StaffReward | RiggingReward

/** Конфигурация выпадения — награда + вероятность (вес) */
export interface LootBoxDropConfig {
  reward: LootBoxReward
  weight: number // чем больше число, тем выше шанс выпадения
}

/** Список всех возможных наград с весами */
export const LOOTBOX_DROPS: LootBoxDropConfig[] = [
  // --- Деньги (лёгкие награды) ---
  { reward: { type: 'money', amount: 5000 }, weight: 30 },
  { reward: { type: 'money', amount: 5500 }, weight: 30 },
  { reward: { type: 'money', amount: 5500 }, weight: 30 },
  { reward: { type: 'money', amount: 7500 }, weight: 25 },
  { reward: { type: 'money', amount: 8500 }, weight: 25 },
  { reward: { type: 'money', amount: 8000 }, weight: 25 },
  { reward: { type: 'money', amount: 11500 }, weight: 20 },
  { reward: { type: 'money', amount: 12000 }, weight: 20 },
  { reward: { type: 'money', amount: 12500 }, weight: 20 },
  { reward: { type: 'money', amount: 27000 }, weight: 15 },
  { reward: { type: 'money', amount: 26500 }, weight: 15 },
  { reward: { type: 'money', amount: 27500 }, weight: 15 },
  { reward: { type: 'money', amount: 50000 }, weight: 10 },
  { reward: { type: 'money', amount: 60000 }, weight: 10 },
  { reward: { type: 'money', amount: 65000 }, weight: 10 },
  { reward: { type: 'money', amount: 70000 }, weight: 10 },
  { reward: { type: 'money', amount: 100000 }, weight: 5 },
  { reward: { type: 'money', amount: 110000 }, weight: 5 },
  { reward: { type: 'money', amount: 120000 }, weight: 5 },
  { reward: { type: 'money', amount: 130000 }, weight: 5 },
  { reward: { type: 'money', amount: 140000 }, weight: 5 },
  { reward: { type: 'money', amount: 500000 }, weight: 3 },
  { reward: { type: 'money', amount: 1000000 }, weight: 2 },
  { reward: { type: 'money', amount: 1500000 }, weight: 1 },

  // --- Персонал сборщики ---
  { reward: { type: 'staff', id: 'picker_03' }, weight: 27 },
  { reward: { type: 'staff', id: 'picker_19' }, weight: 3 },
  { reward: { type: 'staff', id: 'picker_20' }, weight: 3 },
  { reward: { type: 'staff', id: 'picker_22' }, weight: 2 },
  { reward: { type: 'staff', id: 'picker_23' }, weight: 4 },

  // --- Персонал водители ---
  { reward: { type: 'staff', id: 'reachtruck_07' }, weight: 10 },
  { reward: { type: 'staff', id: 'reachtruck_10' }, weight: 10 },
  { reward: { type: 'staff', id: 'reachtruck_15' }, weight: 4 },
  { reward: { type: 'staff', id: 'reachtruck_16' }, weight: 4 },
  { reward: { type: 'staff', id: 'reachtruck_17' }, weight: 4 },
  { reward: { type: 'staff', id: 'reachtruck_18' }, weight: 3 },
  { reward: { type: 'staff', id: 'reachtruck_19' }, weight: 2 },

  // --- снаряжение ---
  { reward: { type: 'rigging', id: 'helmet_04' }, weight: 4 },
  { reward: { type: 'rigging', id: 'helmet_05' }, weight: 4 },
  { reward: { type: 'rigging', id: 'helmet_06' }, weight: 2 },
  { reward: { type: 'rigging', id: 'helmet_07' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_08' }, weight: 4 },
  { reward: { type: 'rigging', id: 'helmet_09' }, weight: 4 },
  { reward: { type: 'rigging', id: 'helmet_10' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_11' }, weight: 2 },
  { reward: { type: 'rigging', id: 'helmet_12' }, weight: 2 },

  { reward: { type: 'rigging', id: 'closes_04' }, weight: 2 },
  { reward: { type: 'rigging', id: 'closes_05' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_06' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_07' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_08' }, weight: 25 },
  { reward: { type: 'rigging', id: 'closes_09' }, weight: 20 },
  { reward: { type: 'rigging', id: 'closes_10' }, weight: 15 },
  { reward: { type: 'rigging', id: 'closes_11' }, weight: 4 },
  { reward: { type: 'rigging', id: 'closes_12' }, weight: 4 },

  { reward: { type: 'rigging', id: 'ted_04' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_05' }, weight: 20 },
  { reward: { type: 'rigging', id: 'ted_06' }, weight: 4 },
  { reward: { type: 'rigging', id: 'ted_07' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_08' }, weight: 2 },

]

/** Получить случайную награду на основе весов */
export function getRandomLootBoxReward(): LootBoxReward {
  // Считаем общий вес
  const totalWeight = LOOTBOX_DROPS.reduce((sum, drop) => sum + drop.weight, 0)

  // Выбираем случайное число
  let random = Math.random() * totalWeight

  // Проходим по списку и находим, в какой диапазон попало число
  for (const drop of LOOTBOX_DROPS) {
    random -= drop.weight
    if (random <= 0) {
      return drop.reward
    }
  }

  // На всякий случай возвращаем последнюю награду
  return LOOTBOX_DROPS[LOOTBOX_DROPS.length - 1].reward
}
