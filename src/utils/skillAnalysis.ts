import type { AppState } from '../state/state.ts'
import { getState } from '../state/state.ts'
import type { SkillId, SkillPath } from '../types/index.ts'
import { BUSINESS_SKILLS, REGIME_SKILLS } from '../data/skillAnalysis.ts'

/** Полоса баланса: от «почти все мягкие» до «почти все жёсткие» */
export type AxisBand = 'lightStrong' | 'lightLean' | 'balanced' | 'hardLean' | 'hardStrong'

/** Состояние одной оси анализа */
export interface AxisBalance {
  /** Сколько развилочных решений — мягкие (legal / liberal) */
  light: number
  /** Сколько — жёсткие (dark / totalitarian) */
  hard: number
  /** Общее число развилочных решений */
  total: number
  /** -1 — полностью жёсткий курс, +1 — полностью мягкий, 0 — баланс */
  value: number
  /** Нормализованная полоса */
  band: AxisBand
}

/** Определяет «мягкость» пути */
function isLightPath(path: SkillPath): boolean {
  return path === 'legal' || path === 'liberal'
}

/** Собирает баланс по заданному набору отделов */
function collectBalance(state: AppState, skillIds: SkillId[]): AxisBalance {
  let light = 0
  let hard = 0
  for (const [key, path] of Object.entries(state.branchChoices)) {
    const skillId = key.slice(0, key.lastIndexOf('-')) as SkillId
    if (!skillIds.includes(skillId)) continue
    if (isLightPath(path)) light++
    else hard++
  }
  const total = light + hard
  const value = total === 0 ? 0 : (light - hard) / total
  return { light, hard, total, value, band: bandOf(value) }
}

function bandOf(value: number): AxisBand {
  if (value >= 0.6) return 'lightStrong'
  if (value >= 0.2) return 'lightLean'
  if (value > -0.2) return 'balanced'
  if (value > -0.6) return 'hardLean'
  return 'hardStrong'
}

/** Баланс по оси «тоталитаризм ↔ либерализм» */
export function getRegimeBalance(state: AppState = getState()): AxisBalance {
  return collectBalance(state, REGIME_SKILLS)
}

/** Баланс по оси «теневые схемы ↔ честный бизнес» */
export function getBusinessBalance(state: AppState = getState()): AxisBalance {
  return collectBalance(state, BUSINESS_SKILLS)
}
