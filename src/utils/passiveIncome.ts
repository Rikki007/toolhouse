import { skills } from '../data/skills.ts'
import { MASTER_UPGRADE_LEVELS } from '../data/masterUpgrades.ts'
import type { SkillId, SkillLevel, SkillPath, SkillBranchChoices, BranchChoiceKey } from '../types/skills.ts'
import type { Shift, ShiftStaff, ShiftsState, StaffUpgrades, MasterUpgrades } from '../types/index.ts'
import { getStaffById, getRiggingById, getEquipmentById } from './itemLookup.ts'
import { getStaffSpeed } from './staffUpgrades.ts'
import { formatMoney } from './format.ts'
import { getMaxSlotsForLevel } from './personnel.ts'
import { getState } from '../state/state.ts'
import { levelFromXp } from '../data/playerLevels.ts'

/** Базовый пассивный доход: 1 монета в секунду */
const BASE_PASSIVE_INCOME = 1

/** Множитель дохода полностью укомплектованной смены */
const FULLY_STAFFED_MULTIPLIER = 1.5

/**
 * Во сколько раз скорость техники больше её вклада в доход.
 * В данных speed — шкала 0–10 для звёздочек в UI, в пассивный доход идёт как speed × 10.
 */
const EQUIPMENT_INCOME_MULTIPLIER = 10

/** Смена укомплектована, если заняты все слоты водителей и сборщиков */
export function isShiftFullyStaffed(shift: Shift): boolean {
  const playerLevel = levelFromXp(getState().xpMoney)
  const maxForklifts = getMaxSlotsForLevel(playerLevel, 'forklift')
  const maxPickers = getMaxSlotsForLevel(playerLevel, 'picker')
  return (
    shift.personnel.reachTruckDrivers.length >= maxForklifts &&
    shift.personnel.pickers.length >= maxPickers
  )
}

/** Мноитель мастера смены по его уровню прокачки (1.0 если не прокачан/нет мастера) */
function getMasterFactorForShift(shift: Shift, masterUpgrades?: MasterUpgrades): number {
  const masterId = shift.personnel.master
  if (!masterId) return 1.0
  const level = masterUpgrades?.[masterId] ?? 0
  return MASTER_UPGRADE_LEVELS[level]?.factor ?? 1.0
}

/**
 * Всё, что влияет на пассивный доход.
 * Все поля обязательны: новый источник дохода нельзя «забыть» в вызове,
 * иначе расчёт даст неполное значение.
 */
export interface IncomeSources {
  skills: Record<SkillId, number>
  branchChoices: SkillBranchChoices
  shifts: ShiftsState
  staffUpgrades: StaffUpgrades
  masterUpgrades: MasterUpgrades
}

/** Минимальный срез состояния, из которого считаются источники дохода */
export interface IncomeStateSlice {
  skills: Record<SkillId, number>
  branchChoices: SkillBranchChoices
  shifts: ShiftsState
  staffUpgrades: StaffUpgrades
  masterUpgrades: MasterUpgrades
}

/** Собирает источники дохода из состояния игры */
export function getIncomeSources(state: IncomeStateSlice): IncomeSources {
  return {
    skills: state.skills,
    branchChoices: state.branchChoices,
    shifts: state.shifts,
    staffUpgrades: state.staffUpgrades,
    masterUpgrades: state.masterUpgrades,
  }
}

/** Округляет число до сотых (2 знака после запятой) */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * KPI сотрудника в смене: собственная скорость (с учётом прокачки) × факторы надетого снаряжения.
 * Снаряжение без слота (null) на KPI не влияет.
 */
export function calculateStaffKpi(staff: ShiftStaff, upgrades?: StaffUpgrades): number {
  const staffData = getStaffById(staff.id)
  if (!staffData) return 0

  let kpi = getStaffSpeed(staffData, upgrades)
  for (const riggingId of [staff.slots.headdress, staff.slots.uniform, staff.slots.tool]) {
    if (!riggingId) continue
    kpi *= getRiggingById(riggingId)?.factor ?? 1
  }
  return kpi
}

/**
 * Доход от техники, закреплённой за сотрудником: speed × EQUIPMENT_INCOME_MULTIPLIER.
 * Пустой слот или неизвестный ID не вкладывают ничего.
 *
 * Само поле speed в данных — это шкала 0–10 для отрисовки звёздочек
 * и прогресс-баров в UI, поэтому в расчёт оно идёт с множителем.
 */
export function calculateTechniqueIncome(techniqueId: string | null): number {
  if (!techniqueId) return 0
  return (getEquipmentById(techniqueId)?.speed ?? 0) * EQUIPMENT_INCOME_MULTIPLIER
}

/**
 * Суммарный доход в секунду от персонала всех активных смен.
 * Считается как сумма KPI сотрудников (скорость × снаряжение)
 * и дохода закреплённой за ними техники (speed × 10).
 * Если смена полностью укомплектована (все водители и сборщики),
 * доход от этой смены умножается на FULLY_STAFFED_MULTIPLIER.
 * Доход каждой смены дополнительно умножается на множитель её мастера.
 */
export function calculateShiftStaffIncome(
  shifts: ShiftsState,
  upgrades?: StaffUpgrades,
  masterUpgrades?: MasterUpgrades
): number {
  let income = 0

  for (const shift of Object.values(shifts)) {
    if (!shift.isActive) continue
    let shiftIncome = 0
    for (const staff of [...shift.personnel.reachTruckDrivers, ...shift.personnel.pickers]) {
      shiftIncome += calculateStaffKpi(staff, upgrades) + calculateTechniqueIncome(staff.slots.technique)
    }
    // Бонус за полную укомплектованность смены
    if (isShiftFullyStaffed(shift)) {
      shiftIncome *= FULLY_STAFFED_MULTIPLIER
    }
    // Множитель мастера смены
    shiftIncome *= getMasterFactorForShift(shift, masterUpgrades)
    income += shiftIncome
  }

  return income
}

/**
 * Множитель дохода от открытых смен: вторая смена поднимает его до 1.2,
 * третья — до 1.5. Учитывается наибольший из достигнутых уровней.
 */
export function calculateShiftsMultiplier(shifts: ShiftsState): number {
  let multiplier = 1
  if (shifts.second.isActive) multiplier = Math.max(multiplier, 1.2)
  if (shifts.third.isActive) multiplier = Math.max(multiplier, 1.5)
  return multiplier
}

/**
 * Множитель одного купленного уровня отдела.
 * У обычного уровня factor лежит прямо в описании, у ветвящегося — в выбранном варианте.
 * Если вариант ветки не выбран (сломанный/старый сейв), множитель равен 1.
 */
export function getLevelFactor(levelData: SkillLevel, chosenPath?: SkillPath): number {
  if (levelData.branch) {
    return levelData.branch.find((option) => option.path === chosenPath)?.factor ?? 1
  }
  return levelData.factor
}

/**
 * Множитель дохода от навыков отдела: перемножаются factor'ы
 * всех купленных уровней каждого навыка.
 * Для уровней с ветвлением берётся factor того варианта, что выбран в branchChoices.
 */
function calculateSkillsMultiplier(
  skillLevels: Record<SkillId, number>,
  branchChoices: SkillBranchChoices,
): number {
  let multiplier = 1

  for (const skill of skills) {
    const level = skillLevels[skill.id] ?? 0
    for (const levelData of skill.levels) {
      if (levelData.level > level) continue
      const chosenPath = branchChoices[`${skill.id}-${levelData.level}` as BranchChoiceKey]
      multiplier *= getLevelFactor(levelData, chosenPath)
    }
  }

  return multiplier
}

/**
 * Рассчитывает текущий пассивный доход через мультипликативный метод.
 * Каждый открытый уровень навыка умножает доход на свой factor.
 * Персонал активных смен прибавляет свой KPI и доход закреплённой техники (скорость × 10).
 * Открытые смены умножают весь итог (вторая — ×1.2, третья — ×1.5).
 */
export function calculatePassiveIncome(sources: IncomeSources): number {
  const skillsMultiplier = calculateSkillsMultiplier(sources.skills, sources.branchChoices)
  const staffIncome = calculateShiftStaffIncome(sources.shifts, sources.staffUpgrades, sources.masterUpgrades)
  const shiftsMultiplier = calculateShiftsMultiplier(sources.shifts)

  return roundToCents(
    (BASE_PASSIVE_INCOME * skillsMultiplier + staffIncome) * shiftsMultiplier,
  )
}

/**
 * Форматирует пассивный доход для отображения.
 * Показывает целую часть и до 2 знаков после запятой; большие значения — с суффиксом (1.5M).
 */
export function formatPassiveIncome(value: number): string {
  if (Math.abs(value) >= 1000) return formatMoney(value)
  return value % 1 === 0
    ? value.toString()
    : value.toFixed(2).replace(/\.?0+$/, '')
}
