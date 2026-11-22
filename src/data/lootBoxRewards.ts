/** Типы наград лутбокса */
export type LootBoxRewardType = 'money'  | 'staff' | 'rigging' | 'token' | 'none'

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

/** Награда: жетон */
export interface TokenReward {
  type: 'token'
  id: string // ID из data/tokens.ts (lootboxTokenGold, accelerationTokenRed и т.д.)
}

/**
 * Награда: пусто. Не выпадает ни из одной таблицы, оставлена как аварийный
 * вариант: на неё опирается отрисовка модалки, если таблица оказалась пустой.
 */
export interface NoneReward {
  type: 'none'
}

/** Все типы наград объединены */
export type LootBoxReward = MoneyReward | StaffReward | RiggingReward | TokenReward | NoneReward

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
  // --- Персонал сборщики: обычные ---
  { reward: { type: 'staff', id: 'picker_19' }, weight: 5 },
  { reward: { type: 'staff', id: 'picker_28' }, weight: 5 },
  { reward: { type: 'staff', id: 'picker_29' }, weight: 5 },
  { reward: { type: 'staff', id: 'picker_30' }, weight: 5 },

  // --- Персонал сборщики: легендарные (500000, 10★) ---
  { reward: { type: 'staff', id: 'picker_23' }, weight: 3 },
  { reward: { type: 'staff', id: 'picker_24' }, weight: 3 },
  { reward: { type: 'staff', id: 'picker_25' }, weight: 3 },
  { reward: { type: 'staff', id: 'picker_26' }, weight: 3 },
  { reward: { type: 'staff', id: 'picker_27' }, weight: 3 },

  // --- Персонал водители: легендарные (500000, 10★) ---
  { reward: { type: 'staff', id: 'reachtruck_18' }, weight: 3 },
  { reward: { type: 'staff', id: 'reachtruck_19' }, weight: 3 },
  { reward: { type: 'staff', id: 'reachtruck_20' }, weight: 3 },
  { reward: { type: 'staff', id: 'reachtruck_21' }, weight: 3 },
  { reward: { type: 'staff', id: 'reachtruck_22' }, weight: 3 },
  { reward: { type: 'staff', id: 'reachtruck_23' }, weight: 3 },
  { reward: { type: 'staff', id: 'reachtruck_24' }, weight: 3 },
  { reward: { type: 'staff', id: 'reachtruck_25' }, weight: 3 },
  { reward: { type: 'staff', id: 'reachtruck_26' }, weight: 3 },

  // --- Снаряжение: веса по редкости (слабое падает чаще, сильное — реже) ---
  // Каски: factor 1.25–1.3 обычные, 1.5 — золотая
  { reward: { type: 'rigging', id: 'helmet_01' }, weight: 9 },
  { reward: { type: 'rigging', id: 'helmet_02' }, weight: 8 },
  { reward: { type: 'rigging', id: 'helmet_03' }, weight: 7 },
  { reward: { type: 'rigging', id: 'helmet_04' }, weight: 5 },
  { reward: { type: 'rigging', id: 'helmet_05' }, weight: 5 },
  { reward: { type: 'rigging', id: 'helmet_06' }, weight: 2 },
  { reward: { type: 'rigging', id: 'helmet_07' }, weight: 4 },
  { reward: { type: 'rigging', id: 'helmet_08' }, weight: 5 },
  { reward: { type: 'rigging', id: 'helmet_09' }, weight: 5 },
  { reward: { type: 'rigging', id: 'helmet_10' }, weight: 4 },
  { reward: { type: 'rigging', id: 'helmet_12' }, weight: 4 },

  // Одежда: жилеты слабые (частые), куртки крепкие, золотая — редкая
  { reward: { type: 'rigging', id: 'closes_01' }, weight: 9 },
  { reward: { type: 'rigging', id: 'closes_02' }, weight: 8 },
  { reward: { type: 'rigging', id: 'closes_03' }, weight: 7 },
  { reward: { type: 'rigging', id: 'closes_04' }, weight: 2 },
  { reward: { type: 'rigging', id: 'closes_05' }, weight: 4 },
  { reward: { type: 'rigging', id: 'closes_07' }, weight: 4 },
  { reward: { type: 'rigging', id: 'closes_08' }, weight: 8 },
  { reward: { type: 'rigging', id: 'closes_09' }, weight: 7 },
  { reward: { type: 'rigging', id: 'closes_10' }, weight: 6 },
  { reward: { type: 'rigging', id: 'closes_11' }, weight: 5 },
  { reward: { type: 'rigging', id: 'closes_12' }, weight: 5 },

  // Терминалы: самые дорогие и сильные предметы — падают реже всего
  { reward: { type: 'rigging', id: 'ted_01' }, weight: 9 },
  { reward: { type: 'rigging', id: 'ted_02' }, weight: 8},
  { reward: { type: 'rigging', id: 'ted_03' }, weight: 7 },
  { reward: { type: 'rigging', id: 'ted_04' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_05' }, weight: 6 },
  { reward: { type: 'rigging', id: 'ted_06' }, weight: 4 },
  { reward: { type: 'rigging', id: 'ted_07' }, weight: 5 },
  { reward: { type: 'rigging', id: 'ted_08' }, weight: 2 },
  { reward: { type: 'rigging', id: 'ted_09' }, weight: 9 },
  { reward: { type: 'rigging', id: 'ted_10' }, weight: 9 },
  { reward: { type: 'rigging', id: 'ted_11' }, weight: 9 },

  // --- Персонажное снаряжение (лутбокс) ---
  // Шлемы персонажей
  { reward: { type: 'rigging', id: 'helmet_isaak' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_gordon' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_john117' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_witcher' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_kratos' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_predator' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_terminator' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_shepard' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_stalker' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_doom' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_santa' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_verstappen' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_avatar' }, weight: 3 },
  { reward: { type: 'rigging', id: 'helmet_rembo' }, weight: 3 },

  // Куртки персонажей
  { reward: { type: 'rigging', id: 'closes_isaak' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_gordon' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_john117' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_witcher' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_kratos' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_predator' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_terminator' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_shepard' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_stalker' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_doom' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_santa' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_verstappen' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_avatar' }, weight: 3 },
  { reward: { type: 'rigging', id: 'closes_rembo' }, weight: 3 },

  // Терминалы персонажей (редкие)
  { reward: { type: 'rigging', id: 'ted_isaak' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_gordon' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_john117' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_witcher' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_kratos' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_predator' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_terminator' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_shepard' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_stalker_omega' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_stalker_taiga' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_stalker_veles' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_stalker_otklik' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_doom' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_santa' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_verstappen' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_avatar' }, weight: 3 },
  { reward: { type: 'rigging', id: 'ted_rembo' }, weight: 3 },

  // --- Жетоны ---
  { reward: { type: 'token', id: 'lootboxTokenGold' }, weight: 4 },
  { reward: { type: 'token', id: 'lootboxTokenGreen' }, weight: 7 },
  { reward: { type: 'token', id: 'lootboxTokenRed' }, weight: 8 },
  { reward: { type: 'token', id: 'accelerationTokenGold' }, weight: 4 },
  { reward: { type: 'token', id: 'accelerationTokenGreen' }, weight: 7 },
  { reward: { type: 'token', id: 'accelerationTokenRed' }, weight: 8 },

]

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

/** Получить случайную награду за уровень */
export function getRandomLevelReward(): LootBoxReward {
  return pickWeightedDrop(LOOTBOX_DROPS)
}
