import type { AppState } from '../state/state.ts'
import type { BranchChoiceKey, SkillBranchOption, SkillId } from '../types/index.ts'
import { getState, updateState } from '../state/state.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import {
  BRANCH_GATES,
  FINAL_GATE_TIER,
  branchAtLevel,
  requiredPlayerLevel,
  type BranchGate,
} from '../data/skillUnlocks.ts'

/** Текущий уровень игрока */
export function playerLevel(state: AppState = getState()): number {
  return levelFromXp(state.xpMoney)
}

/** Выбрана ли развилка отдела на указанном уровне */
export function isBranchTierChosen(state: AppState, skillId: SkillId, tier: number): boolean {
  return state.branchChoices[`${skillId}-${tier}` as BranchChoiceKey] !== undefined
}

/** Выбранный вариант развилки отдела (null — если выбор ещё не сделан) */
export function chosenBranch(
  skillId: SkillId,
  tier: number,
  state: AppState = getState(),
): SkillBranchOption | null {
  const path = state.branchChoices[`${skillId}-${tier}` as BranchChoiceKey]
  if (!path) return null
  return branchAtLevel(skillId, tier)?.find((option) => option.path === path) ?? null
}

/** Закрыт ли гейт: все развилки уровня tier выбраны во всех отделах с ветвлением */
export function isGateCompleted(gate: BranchGate, state: AppState): boolean {
  return gate.skillIds.every((skillId) => isBranchTierChosen(state, skillId, gate.tier))
}

/**
 * Активный блокирующий гейт: первый незакрытый, чей уровень-триггер уже достигнут.
 * Пока гейт активен, узлы, требующие более высокого уровня игрока, не открываются —
 * но все узлы самой развилки остаются доступны, чтобы игрок мог её закрыть.
 */
export function activeGate(state: AppState = getState()): BranchGate | null {
  const level = playerLevel(state)
  for (const gate of BRANCH_GATES) {
    if (level < gate.triggerLevel) continue
    if (!isGateCompleted(gate, state)) return gate
  }
  return null
}

/**
 * Открыт ли узел отдела: по таблице открытий и без учёта блокировки
 * незакрытой развилки. Узлы самой активной развилки остаются открытыми.
 */
export function isNodeUnlocked(skillId: SkillId, level: number, state: AppState = getState()): boolean {
  const required = requiredPlayerLevel(skillId, level)
  if (playerLevel(state) < required) return false

  const gate = activeGate(state)
  if (gate && required > gate.triggerLevel) return false

  return true
}

/**
 * Гейт, по которому пора показать окно анализа: развилка закрыта,
 * а анализ этого уровня ещё не показывался.
 */
export function pendingAnalysisTier(state: AppState = getState()): number | null {
  const level = playerLevel(state)
  for (const gate of BRANCH_GATES) {
    if (state.analysisShown.includes(gate.tier)) continue
    if (level < gate.triggerLevel) continue
    if (isGateCompleted(gate, state)) return gate.tier
  }
  return null
}

/** Помечает анализ уровня показанным — окно не появится повторно */
export function markAnalysisShown(tier: number): void {
  const state = getState()
  if (state.analysisShown.includes(tier)) return
  updateState({ analysisShown: [...state.analysisShown, tier] })
}

/** Финальный ли это гейт (последний анализ — концовка игры) */
export function isFinalTier(tier: number): boolean {
  return tier === FINAL_GATE_TIER
}
