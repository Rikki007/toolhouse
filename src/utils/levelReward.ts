import type { LootBoxReward, StaffReward, RiggingReward } from '../data/lootBoxRewards.ts'
import { getRandomLevelReward } from '../data/lootBoxRewards.ts'
import { getState, updateState } from '../state/state.ts'
import { getAllStaffIds, addLootboxReward } from '../state/inventoryStore.ts'
import { getStaffById } from '../utils/itemLookup.ts'

/** Результат подбора награды за уровень */
export interface LevelRewardResult {
  /** Итоговая награда (предмет или деньги, если выпал дубликат персонала) */
  reward: LootBoxReward
}

/**
 * Выбрать награду для уровня.
 * Берётся из той же таблицы, что и лутбоксы, но без денег — чтобы награда
 * не повышала xpMoney и не запускала каскад новых уровней.
 * Проверяет дубликаты персонала — если сотрудник уже в инвентаре или смене,
 * заменяет награду на его стоимость в деньгах.
 */
export function pickLevelReward(): LevelRewardResult {
  const reward = getRandomLevelReward()

  if (reward.type === 'staff') {
    const allStaffIds = getAllStaffIds()
    if (allStaffIds.includes(reward.id)) {
      // Дубликат — выдаём стоимость сотрудника деньгами
      const staff = getStaffById(reward.id)
      return {
        reward: { type: 'money', amount: staff?.cost ?? 0 },
      }
    }
  }

  return { reward }
}

/**
 * Применить награду за уровень: деньги на счёт, сотрудник/снаряжение в инвентарь.
 * Награда типа «none» — ничего не делает.
 */
export function applyLevelReward(reward: LootBoxReward): void {
  if (reward.type === 'none') {
    // Пусто — ничего не начисляем
    return
  }

  if (reward.type === 'money') {
    updateState({ money: getState().money + reward.amount })
  } else if (reward.type === 'staff') {
    addLootboxReward(reward as StaffReward)
  } else if (reward.type === 'rigging') {
    addLootboxReward(reward as RiggingReward)
  }
}
