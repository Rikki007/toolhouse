import { getState, updateState } from './state.ts'
import type { AchievementId, AchievementStatus } from '../types/achievements.ts'
import { achievements } from '../data/achievements.ts'

export function getAchievements(): Record<AchievementId, AchievementStatus> {
  return getState().achievements
}

export function unlockAchievement(id: AchievementId): void {
  const current = getState().achievements
  if (current[id] === 'unlocked') return
  updateState({ achievements: { ...current, [id]: 'unlocked' } })
}

export function isAchievementUnlocked(id: AchievementId): boolean {
  return getState().achievements[id] === 'unlocked'
}

export function getUnlockedCount(): number {
  const achievementsState = getState().achievements
  return Object.values(achievementsState).filter((status) => status === 'unlocked').length
}

export function getTotalCount(): number {
  return achievements.length
}

/**
 * Проверяет все ачивки против текущего состояния и разблокирует новые.
 * Вызывать после любого изменения состояния, которое может повлиять на условия.
 */
export function checkAllAchievements(): void {
  const currentState = getState()
  const currentAchievements = currentState.achievements
  let needsUpdate = false

  for (const ach of achievements) {
    if (currentAchievements[ach.id] === 'unlocked') continue
    if (ach.check(currentState)) {
      currentAchievements[ach.id] = 'unlocked'
      needsUpdate = true
    }
  }

  if (needsUpdate) {
    updateState({ achievements: { ...currentAchievements } })
  }
}
