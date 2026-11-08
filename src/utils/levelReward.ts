import type { LootBoxReward, StaffReward, RiggingReward } from '../data/lootBoxRewards.ts'
import { getRandomLootBoxReward } from '../data/lootBoxRewards.ts'
import { getState, updateState } from '../state/state.ts'
import { getAllStaffIds, addLootboxReward } from '../state/inventoryStore.ts'
import { getStaffById } from '../utils/itemLookup.ts'

/** Результат подбора награды за уровень */
export interface LevelRewardResult {
  /** Итоговая награда (деньги, если дубликат персонала) */
  reward: LootBoxReward
  /** Был ли дубликат персонала (награда заменена на деньги) */
  wasDuplicate: boolean
  /** Имя сотрудника-дубликата (для сообщения) */
  duplicateStaffName?: string
}

/**
 * Выбрать награду для уровня.
 * Проверяет дубликаты персонала — если сотрудник уже в инвентаре или смене,
 * заменяет награду на его стоимость в деньгах (как в лутбоксах).
 */
export function pickLevelReward(): LevelRewardResult {
  const reward = getRandomLootBoxReward()

  if (reward.type === 'staff') {
    const allStaffIds = getAllStaffIds()
    if (allStaffIds.includes(reward.id)) {
      // Дубликат — выдаём стоимость сотрудника деньгами
      const staff = getStaffById(reward.id)
      const cashAmount = staff?.cost ?? 0
      return {
        reward: { type: 'money', amount: cashAmount },
        wasDuplicate: true,
        duplicateStaffName: staff?.name,
      }
    }
  }

  return { reward, wasDuplicate: false }
}

/**
 * Применить награду за уровень: деньги на счёт, сотрудник/снаряжение в инвентарь.
 */
export function applyLevelReward(reward: LootBoxReward): void {
  if (reward.type === 'money') {
    updateState({ money: getState().money + reward.amount })
  } else if (reward.type === 'staff') {
    addLootboxReward(reward as StaffReward)
  } else if (reward.type === 'rigging') {
    addLootboxReward(reward as RiggingReward)
  }
}
