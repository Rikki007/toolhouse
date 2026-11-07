import type { SkillId, SkillBranchOption } from '../types/index.ts'
import { skills } from './skills.ts'

/**
 * Явная таблица открытий узлов прокачки.
 * SKILL_NODE_UNLOCK[отдел][N - 1] — уровень игрока, на котором отделу
 * открывается узел N. Порядок задан дизайном: три узла за уровень, а
 * ветвящиеся уровни (3, 5, 7, 9, 10) растянуты по одному узлу на уровень —
 * чтобы игрок успевал закрыть все развилки до следующего гейта.
 * 1-й уровень игрока не открывает ничего.
 */
export const SKILL_NODE_UNLOCK: Record<SkillId, number[]> = {
  accounting:  [2, 4, 6, 12, 14, 20, 22, 28, 30, 37],
  hr:          [2, 4, 7, 12, 15, 20, 23, 28, 31, 38],
  it:          [2, 5, 8, 12, 16, 20, 24, 28, 32, 39],
  laborProt:   [3, 5, 9, 13, 17, 21, 25, 29, 33, 40],
  marketing:   [3, 5, 10, 13, 18, 21, 26, 29, 34, 41],
  repair:      [3, 6, 10, 13, 18, 21, 26, 29, 34, 36],
  security:    [4, 6, 11, 14, 19, 22, 27, 30, 35, 42],
}

/**
 * Минимальный уровень игрока для открытия отдела.
 * Пока игрок не достигнет этого уровня, иконка отдела показывается запертой.
 * Совпадает с открытием первого узла отдела.
 */
export const DEPARTMENT_UNLOCK: Record<SkillId, number> = Object.fromEntries(
  (Object.keys(SKILL_NODE_UNLOCK) as SkillId[]).map((id) => [id, SKILL_NODE_UNLOCK[id][0] ?? 1]),
) as Record<SkillId, number>

/**
 * Требуемый уровень игрока для конкретного узла отдела.
 * За пределами таблицы (например, 11-й уровень отдела) узел закрыт навсегда.
 * @param skillId — id отдела
 * @param level   — номер уровня внутри отдела (1-based)
 */
export function requiredPlayerLevel(skillId: SkillId, level: number): number {
  const levels = SKILL_NODE_UNLOCK[skillId]
  if (!levels || level < 1 || level > levels.length) return Number.POSITIVE_INFINITY
  return levels[level - 1]
}

/** Варианты развилки на указанном уровне отдела (если она есть) */
export function branchAtLevel(skillId: SkillId, tier: number): SkillBranchOption[] | undefined {
  const level = skills.find((skill) => skill.id === skillId)?.levels.find((item) => item.level === tier)
  return level?.branch
}

/**
 * Уровни отделов, на которых есть развилка.
 * После того как последний узел развилки открыт (triggerLevel), игрок обязан
 * закрыть все ветки этого уровня — иначе новые улучшения не открываются.
 */
export const BRANCH_TIERS = [3, 5, 7, 9, 10]

/** Гейт разветвлений: набор отделов с развилкой на уровне tier */
export interface BranchGate {
  /** Уровень развилки внутри отдела */
  tier: number
  /** Отделы, у которых на этом уровне есть развилка (тех отдел ветвлений не имеет) */
  skillIds: SkillId[]
  /** Уровень игрока, на котором открывается последний узел развилки */
  triggerLevel: number
}

export const BRANCH_GATES: BranchGate[] = BRANCH_TIERS.map((tier) => {
  const skillIds = skills.filter((skill) => !!branchAtLevel(skill.id, tier)).map((skill) => skill.id)
  const triggerLevel = skillIds.reduce((max, id) => Math.max(max, requiredPlayerLevel(id, tier)), 1)
  return { tier, skillIds, triggerLevel }
})

/** Уровень последнего гейта — по его закрытию показывается финальное окно */
export const FINAL_GATE_TIER: number = BRANCH_GATES[BRANCH_GATES.length - 1]?.tier ?? 0
