/** Типы наград лутбокса */
export type LootBoxRewardType = 'money'  | 'staff' | 'rigging' | 'none'

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

/**
 * Награда: пусто. Не выпадает ни из одной таблицы, оставлена как аварийный
 * вариант: на неё опирается отрисовка модалки, если таблица оказалась пустой.
 */
export interface NoneReward {
  type: 'none'
}

/** Все типы наград объединены */
export type LootBoxReward = MoneyReward | StaffReward | RiggingReward | NoneReward

/** Конфигурация выпадения — награда + вероятность (вес) */
export interface LootBoxDropConfig {
  reward: LootBoxReward
  weight: number // чем больше число, тем выше шанс выпадения
}

/**
 * Единая таблица всех наград с весами.
 * Используется и лутбоксами, и наградами за уровень (см. LEVEL_DROPS ниже).
 */
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

  // --- Персонал сборщики: обычные ---
  { reward: { type: 'staff', id: 'picker_19' }, weight: 6 },

  // --- Персонал сборщики: легендарные (500000, 10★) ---
  { reward: { type: 'staff', id: 'picker_23' }, weight: 2 },
  { reward: { type: 'staff', id: 'picker_24' }, weight: 2 },
  { reward: { type: 'staff', id: 'picker_25' }, weight: 2 },
  { reward: { type: 'staff', id: 'picker_26' }, weight: 2 },
  { reward: { type: 'staff', id: 'picker_27' }, weight: 2 },

  // --- Персонал водители: легендарные (500000, 10★) ---
  { reward: { type: 'staff', id: 'reachtruck_18' }, weight: 2 },
  { reward: { type: 'staff', id: 'reachtruck_19' }, weight: 2 },
  { reward: { type: 'staff', id: 'reachtruck_20' }, weight: 2 },
  { reward: { type: 'staff', id: 'reachtruck_21' }, weight: 2 },
  { reward: { type: 'staff', id: 'reachtruck_22' }, weight: 2 },
  { reward: { type: 'staff', id: 'reachtruck_23' }, weight: 2 },
  { reward: { type: 'staff', id: 'reachtruck_24' }, weight: 2 },

  // --- Снаряжение: веса по редкости (слабое падает чаще, сильное — реже) ---
  // Каски: factor 1.25–1.3 обычные, 1.5 — золотая
  { reward: { type: 'rigging', id: 'helmet_04' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_05' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_06' }, weight: 2 },
  { reward: { type: 'rigging', id: 'helmet_07' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_08' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_09' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_10' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_11' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_12' }, weight: 3 },

  // Одежда: жилеты слабые (частые), куртки крепкие, золотая — редкая
  { reward: { type: 'rigging', id: 'closes_04' }, weight: 2 },
  { reward: { type: 'rigging', id: 'closes_05' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_06' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_07' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_08' }, weight: 4 },
  { reward: { type: 'rigging', id: 'closes_09' }, weight: 4 },
  { reward: { type: 'rigging', id: 'closes_10' }, weight: 4 },
  { reward: { type: 'rigging', id: 'closes_11' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_12' }, weight: 3 },

  // Терминалы: самые дорогие и сильные предметы — падают реже всего
  { reward: { type: 'rigging', id: 'ted_04' }, weight: 1 },
  { reward: { type: 'rigging', id: 'ted_05' }, weight: 2 },
  { reward: { type: 'rigging', id: 'ted_06' }, weight: 1 },
  { reward: { type: 'rigging', id: 'ted_07' }, weight: 1 },
  { reward: { type: 'rigging', id: 'ted_08' }, weight: 1 },

]

/**
 * Награды за уровень берутся из той же таблицы LOOTBOX_DROPS, но без денег.
 *
 * Деньги из награды попадают в xpMoney и повышают уровень, а новый уровень
 * снова даёт награду — получался бы каскад. Предметы уровень не двигают,
 * поэтому за уровень всегда выдаётся предмет: «пусто» из таблицы исключено,
 * и шанс не получить ничего исчез.
 */
const LEVEL_DROPS: LootBoxDropConfig[] = LOOTBOX_DROPS.filter(
  (drop) => drop.reward.type !== 'money'
)

/** Выбрать награду из таблицы по весам */
function pickWeightedDrop(drops: LootBoxDropConfig[]): LootBoxReward {
  // Считаем общий вес
  const totalWeight = drops.reduce((sum, drop) => sum + drop.weight, 0)

  // Выбираем случайное число
  let random = Math.random() * totalWeight

  // Проходим по списку и находим, в какой диапазон попало число
  for (const drop of drops) {
    random -= drop.weight
    if (random <= 0) {
      return drop.reward
    }
  }

  // На всякий случай возвращаем последнюю награду
  return drops[drops.length - 1].reward
}

/** Получить случайную награду лутбокса на основе весов */
export function getRandomLootBoxReward(): LootBoxReward {
  return pickWeightedDrop(LOOTBOX_DROPS)
}

/** Получить случайную награду за уровень: тот же дроп, но всегда предмет */
export function getRandomLevelReward(): LootBoxReward {
  return pickWeightedDrop(LEVEL_DROPS)
}
