import type { Settings, SkillId, SkillBranchChoices, ShiftConfig, ShiftsState, ShopState, InventoryState, ShiftStaff, StaffUpgrades, NewsItem, AchievementId, MasterUpgrades, StaffTier, ActingManagerState, TokenId } from '../types/index.ts'
import { defaultSettings } from './settingsStore.ts'
import { orderPickersList, reachTrucksList } from '../data/equipment.ts'
import { pickersList, reachTruckDriversList } from '../data/staff.ts'
import { riggingList } from '../data/rigging.ts'
import { calculatePassiveIncome, getIncomeSources, roundToCents } from '../utils/passiveIncome.ts'
import {
  getActingOfflineDurationMs,
  getActingOfflineRate,
  getActingTokenChance,
  getActingTokenDistribution,
  getActingTokenDrawsPerHour,
  rollActingTokens,
} from '../utils/actingOffline.ts'
import { ACTING_TOKEN_MAX_LEVELS } from '../data/actingManager.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { achievements } from '../data/achievements.ts'

const STORAGE_KEY = 'toolhouse_app_state'

const OLD_KEYS = [
  'toolhouse_game_money',
  'toolhouse_inventory',
  'toolhouse_clicks',
  'toolhouse_skills',
] as const

const DEFAULT_SHOP: ShopState = {
  staff: {
    reachTruckDrivers: reachTruckDriversList.map(item => item.id),
    pickers: pickersList.map(item => item.id),
  },
  equipment: {
    reachTrucks: reachTrucksList.map(item => item.id),
    orderPickers: orderPickersList.map(item => item.id),
  },
  rigging: riggingList.filter(item => item.purpose === 'shop').map(item => item.id),
}

const DEFAULT_INVENTORY: ShopState = {
  staff: {
    reachTruckDrivers: [],
    pickers: [],
  },
  equipment: {
    reachTrucks: [],
    orderPickers: [],
  },
  rigging: [],
  tokens: [],
}

/** Миграция: старый InventoryState → новый ShopState */
function migrateShopToIds(inventory: Partial<InventoryState>): ShopState {
  // Собираем ID из старого формата
  const allIds = [
    ...(Array.isArray(inventory.technique) ? inventory.technique : []),
    ...(Array.isArray(inventory.staff) ? inventory.staff : []),
    ...(Array.isArray(inventory.equipment) ? inventory.equipment : []),
  ]
    .map((item: unknown) => (typeof item === 'string' ? item : (item as { id?: string }).id ?? ''))
    .filter(Boolean)

  const reachTruckDrivers: string[] = []
  const pickers: string[] = []
  const reachTrucks: string[] = []
  const orderPickers: string[] = []

  for (const id of allIds) {
    if (id.startsWith('reachtruck_')) {
      reachTruckDrivers.push(id)
    } else if (id.startsWith('picker_')) {
      pickers.push(id)
    } else if (id.startsWith('reachtruck_eq_')) {
      reachTrucks.push(id)
    } else if (id.startsWith('orderpicker_')) {
      orderPickers.push(id)
    }
  }

  return {
    staff: { reachTruckDrivers, pickers },
    equipment: { reachTrucks, orderPickers },
    rigging: [],
  }
}

// ==================== КОНФИГУРАЦИЯ СМЕН ====================

export const SHIFT_CONFIGS: ShiftConfig[] = [
  { id: 1, label: '1-я смена', price: 5000, incomeMultiplier: 1, requiredLevel: 1 },
  { id: 2, label: '2-я смена', price: 10_000_000, incomeMultiplier: 1.2, requiredLevel: 10 },
  { id: 3, label: '3-я смена', price: 500_000_000, incomeMultiplier: 1.5, requiredLevel: 20 },
  { id: 4, label: 'Средняя смена', price: 650_000_000, incomeMultiplier: 2, requiredLevel: 32 },
]

const DEFAULT_SHIFTS: ShiftsState = {
  first: {
    isActive: false,
    personnel: {
      master: 'master_01',
      reachTruckDrivers: [],
      pickers: [],
    },
    cost: 5000,
  },
  second: {
    isActive: false,
    personnel: {
      master: 'master_02',
      reachTruckDrivers: [],
      pickers: [],
    },
    cost: 10_000_000,
  },
  third: {
    isActive: false,
    personnel: {
      master: 'master_03',
      reachTruckDrivers: [],
      pickers: [],
    },
    cost: 500_000_000,
  },
  fourth: {
    isActive: false,
    personnel: {
      master: 'master_04',
      reachTruckDrivers: [],
      pickers: [],
    },
    cost: 650_000_000,
  },
}

const DEFAULT_SKILLS: Record<SkillId, number> = {
  accounting: 0,
  hr: 0,
  it: 0,
  laborProt: 0,
  marketing: 0,
  repair: 0,
  security: 0,
}

/** Пустой набор выборов веток */
const DEFAULT_BRANCH_CHOICES: SkillBranchChoices = {}

/** Стартовое состояние И.О.: первый уровень, навыки не прокачаны */
const DEFAULT_ACTING_MANAGER: ActingManagerState = {
  level: 1,
  xp: 0,
  branches: {
    performance: 0,
    duration: 0,
    tokens: 0,
  },
  tokenUpgrades: {
    frequency: 0,
    chance: 0,
    value: 0,
  },
  tokensCollected: 0,
  tokenProgressMs: 0,
}

export interface AppState {
  settings: Settings
  shop: ShopState
  inventory: ShopState
  money: number
  /** Суммарный заработок за всю игру (только растёт, никогда не уменьшается) */
  xpMoney: number
  clicks: number
  skills: Record<SkillId, number>
  /** Выбранные ветки: ключ 'skillId-level' → выбранный путь */
  branchChoices: SkillBranchChoices
  /** Гейты разветвлений (уровни 3/5/7/9/10), по которым анализ уже показан */
  analysisShown: number[]
  /** Последний выданный уровень игрока (для лутбоксов) */
  lastPlayerLevel: number
  /** Последний уровень, за который выдана награда (для системы наград за уровень) */
  lastRewardedLevel: number
  /** Новости о событиях, о которых игрок ещё не проинформирован */
  news: NewsItem[]
  /** Уровень игрока, который был показан в интерфейсе (для индикаторов) */
  seenPlayerLevel: number
  shifts: ShiftsState
  lootboxLastClaim: number // timestamp последнего получения лутбокса
  lastSaveTime: number // Unix-время последнего сохранения (мс)
  passiveIncomePerSecond: number // текущий пассивный доход в секунду
  timeToEvent: number // Unix-время срабатывания последнего глобального события (мс)
  staffUpgrades: StaffUpgrades // купленные повышения квалификации: staffId → количество
  /** Получен ли бонус за приглашение друга (одноразово) */
  shareRewardClaimed: boolean
  /** Прокачка мастеров: masterId → уровень (0-4) */
  masterUpgrades: MasterUpgrades
  /** Номера лиг персонала, об открытии которых игрок уже уведомлён */
  tierUnlocksSeen: number[]
  /** ID техники, о разблокировке которой игрок уже уведомлён (однократные модалки) */
  equipmentUnlocksSeen: string[]
  /** ID расширений смен, о которых игрок уже уведомлён */
  shiftExpansionSeen: string[]
  /** Статус ачивок: id → 'locked' | 'unlocked' */
  achievements: Record<AchievementId, 'locked' | 'unlocked'>
  /** Timestamp окончания действия буста ускорения */
  boostActiveUntil: number
  /** Timestamp окончания кулдауна буста */
  boostCooldownEndsAt: number
  /** Прогресс И.О.: уровень, опыт и уровни навыков дерева */
  actingManager: ActingManagerState
  /** Последний уровень И.О., который игрок уже видел (для индикатора на кнопке) */
  actingSeenLevel: number
  /** Показано ли стартовое приветствие И.О. (только при первом входе в игру) */
  introSeen: boolean
}

let state: AppState
const listeners: Set<(state: AppState) => void> = new Set()

function loadFromOldKeys(): Partial<AppState> {
  const result: Partial<AppState> = {}

  try {
    const raw = localStorage.getItem('toolhouse_game_money')
    if (raw) {
      const parsed = Number(raw)
      if (!isNaN(parsed)) result.money = parsed
    }
  } catch { /* ignore */ }

  try {
    const raw = localStorage.getItem('toolhouse_inventory')
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<InventoryState>
      result.shop = migrateShopToIds(parsed)
    }
  } catch { /* ignore */ }

  try {
    const raw = localStorage.getItem('toolhouse_clicks')
    if (raw) {
      const parsed = Number(raw)
      if (!isNaN(parsed) && parsed >= 0) result.clicks = parsed
    }
  } catch { /* ignore */ }

  try {
    const raw = localStorage.getItem('toolhouse_skills')
    if (raw) {
      const parsed = JSON.parse(raw) as Record<SkillId, number>
      result.skills = { ...DEFAULT_SKILLS, ...parsed }
    }
  } catch { /* ignore */ }

  return result
}

/** Удаляет старые ключи localStorage после миграции в единый ключ */
function migrateFromOldKeys(): void {
  for (const key of OLD_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch { /* ignore */ }
  }
}

/**
 * Миграция: у ещё не купленных смен берём актуальную цену из SHIFT_CONFIGS.
 * Без неё старый сейв позволил бы купить 2-ю/3-ю смену по устаревшей цене.
 * Купленные смены не трогаем — там записано, сколько игрок реально заплатил
 * (эта сумма влияет на стоимость прокачки мастера).
 */
function migrateShiftPrices(shifts: ShiftsState): ShiftsState {
  const keysByShiftId: Record<number, keyof ShiftsState> = {
    1: 'first',
    2: 'second',
    3: 'third',
    4: 'fourth',
  }

  const result: ShiftsState = { ...shifts }

  for (const config of SHIFT_CONFIGS) {
    const key = keysByShiftId[config.id]
    const shift = result[key]
    if (shift && !shift.isActive && shift.cost !== config.price) {
      result[key] = { ...shift, cost: config.price }
    }
  }

  return result
}

/** Миграция старого формата shifts → новый формат */
function migrateShiftsToNewFormat(oldShifts: unknown): ShiftsState {
  // Проверяем, что это старый формат с activeShifts и personnel
  if (oldShifts && typeof oldShifts === 'object') {
    const old = oldShifts as Record<string, unknown>
    if ('activeShifts' in old || 'personnel' in old) {
      const activeShifts = (old.activeShifts as number) ?? 1

      // Преобразуем string[] в ShiftStaff[]
      const stringToShiftStaff = (ids: string[]): ShiftStaff[] =>
        ids.map(id => ({ id, slots: { headdress: null, uniform: null, tool: null, technique: null } }))

      const reachTruckDrivers1: ShiftStaff[] = []
      const pickers1: ShiftStaff[] = []
      const reachTruckDrivers2: ShiftStaff[] = []
      const pickers2: ShiftStaff[] = []
      const reachTruckDrivers3: ShiftStaff[] = []
      const pickers3: ShiftStaff[] = []

      // Копируем персонал из старого формата
      if (old.personnel && typeof old.personnel === 'object') {
        const personnel = old.personnel as Record<number, unknown>
        for (let i = 1; i <= 3; i++) {
          const shiftData = personnel[i]
          if (shiftData && typeof shiftData === 'object') {
            const shiftObj = shiftData as Record<string, unknown>
            const forklift = (shiftObj.forklift as (string | null)[]) ?? []
            const picker = (shiftObj.picker as (string | null)[]) ?? []

            const forkliftIds = forklift.filter((s): s is string => s !== null)
            const pickerIds = picker.filter((s): s is string => s !== null)

            if (i === 1) {
              reachTruckDrivers1.push(...stringToShiftStaff(forkliftIds))
              pickers1.push(...stringToShiftStaff(pickerIds))
            } else if (i === 2) {
              reachTruckDrivers2.push(...stringToShiftStaff(forkliftIds))
              pickers2.push(...stringToShiftStaff(pickerIds))
            } else if (i === 3) {
              reachTruckDrivers3.push(...stringToShiftStaff(forkliftIds))
              pickers3.push(...stringToShiftStaff(pickerIds))
            }
          }
        }
      }

      return {
        first: {
          isActive: true,
          personnel: { master: null, reachTruckDrivers: reachTruckDrivers1, pickers: pickers1 },
          cost: 0,
        },
        second: {
          isActive: activeShifts >= 2,
          personnel: { master: null, reachTruckDrivers: reachTruckDrivers2, pickers: pickers2 },
          cost: 20000,
        },
        third: {
          isActive: activeShifts >= 3,
          personnel: { master: null, reachTruckDrivers: reachTruckDrivers3, pickers: pickers3 },
          cost: 100000,
        },
        fourth: {
          isActive: false,
          personnel: { master: null, reachTruckDrivers: [], pickers: [] },
          cost: 0,
        },
      }
    }
  }

  // Если не удалось распознать — возвращаем дефолт
  return DEFAULT_SHIFTS
}

/** Миграция: personnel в string[] → ShiftStaff[] (для данных после обновления) */
function migratePersonnelToStringArrays(shifts: ShiftsState): ShiftsState {
  const stringToShiftStaff = (ids: string[]): ShiftStaff[] =>
    ids.map(id => ({ id, slots: { headdress: null, uniform: null, tool: null, technique: null } }))

  const result: ShiftsState = {
    first: { isActive: false, personnel: { master: null, reachTruckDrivers: [], pickers: [] }, cost: 0 },
    second: { isActive: false, personnel: { master: null, reachTruckDrivers: [], pickers: [] }, cost: 0 },
    third: { isActive: false, personnel: { master: null, reachTruckDrivers: [], pickers: [] }, cost: 0 },
    fourth: { isActive: false, personnel: { master: null, reachTruckDrivers: [], pickers: [] }, cost: 0 },
  }

  for (const key of ['first', 'second', 'third', 'fourth'] as const) {
    const shift = shifts[key]
    // Проверяем, что это string[] (старый формат после обновления)
    const rtData = shift.personnel.reachTruckDrivers
    const pData = shift.personnel.pickers

    const reachTruckDrivers: ShiftStaff[] = rtData.length > 0 && typeof rtData[0] === 'string'
      ? stringToShiftStaff(rtData as unknown as string[])
      : (rtData as ShiftStaff[])

    const pickers: ShiftStaff[] = pData.length > 0 && typeof pData[0] === 'string'
      ? stringToShiftStaff(pData as unknown as string[])
      : (pData as ShiftStaff[])

    result[key] = {
      isActive: shift.isActive,
      personnel: { master: null, reachTruckDrivers, pickers },
      cost: shift.cost,
    }
  }

  return result
}

/** Миграция: заполняем null master дефолтными значениями */
function migrateMasterFields(shifts: ShiftsState): ShiftsState {
  const masterDefaults: Record<keyof ShiftsState, string | null> = {
    first: 'master_01',
    second: 'master_02',
    third: 'master_03',
    fourth: 'master_04',
  }

  const result: ShiftsState = { ...shifts }

  for (const key of ['first', 'second', 'third', 'fourth'] as const) {
    if (result[key].personnel.master === null) {
      result[key] = {
        ...result[key],
        personnel: {
          ...result[key].personnel,
          master: masterDefaults[key],
        },
      }
    }
  }

  return result
}

/** Миграция: добавляем technique: null всем существующим ShiftStaff */
function migrateAddTechniqueSlot(shifts: ShiftsState): ShiftsState {
  const result: ShiftsState = { ...shifts }

  for (const key of ['first', 'second', 'third', 'fourth'] as const) {
    const shift = result[key]
    const migrateStaff = (arr: ShiftStaff[]): ShiftStaff[] =>
      arr.map(s => ({
        ...s,
        slots: { ...s.slots, technique: s.slots.technique ?? null },
      }))

    result[key] = {
      ...shift,
      personnel: {
        ...shift.personnel,
        reachTruckDrivers: migrateStaff(shift.personnel.reachTruckDrivers),
        pickers: migrateStaff(shift.personnel.pickers),
      },
    }
  }

  return result
}

/**
 * Миграция старого формата staffUpgrades (Record<string, number>)
 * в новый (Record<string, { tier, level }>).
 * Старое число = количество повышений на красном тире.
 * Новый level = baseSpeed + count ( capped at 10 ).
 */
function migrateStaffUpgrades(raw: unknown): StaffUpgrades {
  if (!raw || typeof raw !== 'object') return {}
  const result: StaffUpgrades = {}
  const allStaff = [...pickersList, ...reachTruckDriversList]

  for (const [staffId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value && typeof value === 'object' && 'tier' in (value as Record<string, unknown>)) {
      // Уже новый формат
      result[staffId] = value as StaffUpgrades[string]
      continue
    }
    // Старый формат: number
    const oldCount = typeof value === 'number' ? value : 0
    const staffData = allStaff.find(s => s.id === staffId)
    // У легендариков стартовая лига задана в данных, а старый числовой прогресс
    // означает «0 повышений» — оставляем дефолт из getStaffTierProgress
    if (staffData?.startTier) continue
    const baseSpeed = staffData?.baseSpeed ?? 3
    const newLevel = Math.min(10, baseSpeed + oldCount)
    result[staffId] = { tier: 1 as StaffTier, level: newLevel }
  }

  return result
}

/** Миграция: у старых сейвов нет прогресса И.О. — подставляем дефолт */
function migrateActingManager(raw: unknown): ActingManagerState {
  const defaults: ActingManagerState = {
    ...DEFAULT_ACTING_MANAGER,
    branches: { ...DEFAULT_ACTING_MANAGER.branches },
    tokenUpgrades: { ...DEFAULT_ACTING_MANAGER.tokenUpgrades },
  }
  if (!raw || typeof raw !== 'object') return defaults

  const data = raw as Partial<ActingManagerState>
  const xp = typeof data.xp === 'number' && data.xp >= 0 ? data.xp : 0
  const branches = { ...defaults.branches, ...(data.branches ?? {}) }

  // Миграция старого единого уровня «Сбора жетонов» на три параметра.
  // Сумма уровней параметров должна совпасть со старым уровнем,
  // иначе у игрока изменится количество потраченных очков.
  let tokenUpgrades = data.tokenUpgrades
  if (!tokenUpgrades) {
    const legacy = Math.max(0, Math.floor(branches.tokens ?? 0))
    const frequency = Math.min(ACTING_TOKEN_MAX_LEVELS.frequency, legacy)
    const afterFrequency = legacy - frequency
    const chance = Math.min(ACTING_TOKEN_MAX_LEVELS.chance, afterFrequency)
    const value = Math.min(ACTING_TOKEN_MAX_LEVELS.value, afterFrequency - chance)
    tokenUpgrades = { frequency, chance, value }
    branches.tokens = frequency + chance + value
  }

  return {
    xp,
    // Уровень И.О. — производная от накопленного оффлайн-дохода
    level: levelFromXp(xp),
    branches,
    tokenUpgrades: { ...defaults.tokenUpgrades, ...tokenUpgrades },
    tokensCollected:
      typeof data.tokensCollected === 'number' && data.tokensCollected >= 0
        ? data.tokensCollected
        : 0,
    tokenProgressMs:
      typeof data.tokenProgressMs === 'number' && data.tokenProgressMs >= 0 ? data.tokenProgressMs : 0,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>
      let shifts: ShiftsState
      
      // Проверяем формат shifts
      if (parsed.shifts && typeof parsed.shifts === 'object' && !('first' in parsed.shifts)) {
        // Старый формат — конвертируем
        shifts = migrateShiftsToNewFormat(parsed.shifts)
      } else {
        shifts = parsed.shifts || { ...DEFAULT_SHIFTS }
      }

      // Миграция: personnel string[] → ShiftStaff[]
      shifts = migratePersonnelToStringArrays(shifts)

      // Миграция: заполняем null master дефолтными значениями
      shifts = migrateMasterFields(shifts)

      // Миграция: добавляем technique: null существующим ShiftStaff
      shifts = migrateAddTechniqueSlot(shifts)

      // Миграция: актуализируем цену ещё не купленных смен
      shifts = migrateShiftPrices(shifts)

      // Каталог снаряжения: берём сохранённый список, выкидываем устаревшие/нешоповые ID,
      // и добираем те shop-предметы, которых в сейве нет (их добавили в данные позже).
      const savedRigging = (parsed.shop?.rigging ?? DEFAULT_SHOP.rigging).filter((id: string) =>
        riggingList.some(item => item.id === id && item.purpose === 'shop')
      )
      const shopRigging = savedRigging.length > 0 ? savedRigging : [...DEFAULT_SHOP.rigging]
      for (const id of DEFAULT_SHOP.rigging) {
        if (!shopRigging.includes(id)) shopRigging.push(id)
      }

      const shopState: ShopState = {
        ...DEFAULT_SHOP,
        ...(parsed.shop || {}),
        rigging: shopRigging,
      }

      // Жетоны появились позже — у старых сейвов поля нет
      const inventoryState: ShopState = {
        ...(parsed.inventory || { ...DEFAULT_INVENTORY }),
        tokens: parsed.inventory?.tokens ?? [],
      }
      const skillsState = parsed.skills || { ...DEFAULT_SKILLS }
      const staffUpgradesState = migrateStaffUpgrades(parsed.staffUpgrades)
      const branchChoicesState: SkillBranchChoices = parsed.branchChoices ?? {}

      // Старые сейвы могли содержать переключатель музыки — поле удалено из настроек
      const { music: _removedMusic, ...savedSettings } = (parsed.settings ?? {}) as Partial<Settings> & { music?: boolean }
      const settingsState: Settings = { ...defaultSettings, ...savedSettings }

      return {
        settings: settingsState,
        shop: shopState,
        inventory: inventoryState,
        money: parsed.money ?? 0,
        xpMoney: parsed.xpMoney ?? 0,
        clicks: parsed.clicks ?? 0,
        skills: skillsState,
        branchChoices: branchChoicesState,
        analysisShown: parsed.analysisShown ?? [],
        lastPlayerLevel: parsed.lastPlayerLevel ?? 1,
        // Старые сейвы без поля: стартуем с текущего уровня, чтобы не выдавать
        // награды за уже пройденные уровни после обновления
        lastRewardedLevel: parsed.lastRewardedLevel ?? (parsed.lastPlayerLevel ?? 1),
        news: parsed.news ?? [],
        seenPlayerLevel: parsed.seenPlayerLevel ?? levelFromXp(parsed.xpMoney ?? 0),
        shifts,
        lootboxLastClaim: parsed.lootboxLastClaim ?? 0,
        lastSaveTime: parsed.lastSaveTime ?? Date.now(),
        passiveIncomePerSecond: calculatePassiveIncome(getIncomeSources({
          skills: skillsState,
          branchChoices: branchChoicesState,
          shifts,
          staffUpgrades: staffUpgradesState,
          masterUpgrades: parsed.masterUpgrades ?? {},
          xpMoney: parsed.xpMoney ?? 0,
        })),
        timeToEvent: parsed.timeToEvent ?? Date.now(),
        staffUpgrades: staffUpgradesState,
        shareRewardClaimed: parsed.shareRewardClaimed ?? false,
        masterUpgrades: parsed.masterUpgrades ?? {},
        tierUnlocksSeen: parsed.tierUnlocksSeen ?? [],
        equipmentUnlocksSeen: parsed.equipmentUnlocksSeen ?? [],
        shiftExpansionSeen: parsed.shiftExpansionSeen ?? [],
        achievements: parsed.achievements ?? {},
        boostActiveUntil: parsed.boostActiveUntil ?? 0,
        boostCooldownEndsAt: parsed.boostCooldownEndsAt ?? 0,
        actingManager: migrateActingManager(parsed.actingManager),
        // Старые сейвы без поля: считаем текущий уровень уже просмотренным
        actingSeenLevel: parsed.actingSeenLevel ?? levelFromXp(parsed.actingManager?.xp ?? 0),
        // Старые сейвы: приветствие уже неактуально, не показываем его повторно
        introSeen: parsed.introSeen ?? true,
      }
    }
  } catch (error) {
    // Не глушим ошибку молча: иначе сломанный сейв выглядит как «сброс прогресса»
    console.error('Не удалось загрузить сохранение — создано новое состояние', error)
  }

  // Миграция из старых ключей
  const oldData = loadFromOldKeys()
  if (oldData.money !== undefined || oldData.shop || oldData.clicks !== undefined || oldData.skills) {
    migrateFromOldKeys()
    return {
      settings: { ...defaultSettings },
      shop: { ...DEFAULT_SHOP, ...(oldData.shop || {}) },
      inventory: { ...DEFAULT_INVENTORY },
      money: oldData.money ?? 0,
      xpMoney: oldData.money ?? 0,
      clicks: oldData.clicks ?? 0,
      skills: oldData.skills || { ...DEFAULT_SKILLS },
      branchChoices: {},
      analysisShown: [],
      lastPlayerLevel: 1,
      lastRewardedLevel: 1,
      news: [],
      seenPlayerLevel: levelFromXp(oldData.money ?? 0),
      shifts: oldData.shifts || { ...DEFAULT_SHIFTS },
      lootboxLastClaim: 0,
      lastSaveTime: Date.now(),
      passiveIncomePerSecond: calculatePassiveIncome(
        getIncomeSources({
          skills: oldData.skills || DEFAULT_SKILLS,
          branchChoices: {},
          shifts: oldData.shifts || DEFAULT_SHIFTS,
          staffUpgrades: oldData.staffUpgrades ?? {},
          masterUpgrades: {},
          xpMoney: oldData.money ?? 0,
        })
      ),
      timeToEvent: Date.now(),
      staffUpgrades: oldData.staffUpgrades ?? {},
      shareRewardClaimed: false,
      masterUpgrades: {},
      tierUnlocksSeen: [],
      equipmentUnlocksSeen: [],
      shiftExpansionSeen: [],
      achievements: {},
      boostActiveUntil: 0,
      boostCooldownEndsAt: 0,
      actingManager: migrateActingManager(null),
      actingSeenLevel: 1,
      introSeen: true,
    }
  }

  return createDefaultState()
}

/** Чистое состояние новой игры: весь прогресс обнулён */
function createDefaultState(): AppState {
  return {
    settings: { ...defaultSettings },
    shop: { ...DEFAULT_SHOP },
    inventory: { ...DEFAULT_INVENTORY },
    money: 0,
    xpMoney: 0,
    clicks: 0,
    skills: { ...DEFAULT_SKILLS },
    branchChoices: { ...DEFAULT_BRANCH_CHOICES },
    analysisShown: [],
    lastPlayerLevel: 1,
    lastRewardedLevel: 1,
    news: [],
    seenPlayerLevel: 1,
    shifts: { ...DEFAULT_SHIFTS },
    lootboxLastClaim: 0,
    lastSaveTime: Date.now(),
    passiveIncomePerSecond: calculatePassiveIncome(getIncomeSources({
      skills: DEFAULT_SKILLS,
      branchChoices: DEFAULT_BRANCH_CHOICES,
      shifts: DEFAULT_SHIFTS,
      staffUpgrades: {},
      masterUpgrades: {},
      xpMoney: 0,
    })),
    timeToEvent: Date.now(),
    staffUpgrades: {},
    shareRewardClaimed: false,
    masterUpgrades: {},
    tierUnlocksSeen: [],
    equipmentUnlocksSeen: [],
    shiftExpansionSeen: [],
    achievements: {},
    boostActiveUntil: 0,
    boostCooldownEndsAt: 0,
    actingManager: migrateActingManager(null),
    actingSeenLevel: 1,
    introSeen: false,
  }
}

function saveState(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/**
 * Проверяет все ачивки и разблокирует новые.
 * О новых достижениях И.О. пишет сообщение в новости.
 * Новости добавляем напрямую в state: addNewsItem вызвал бы updateState
 * и повторный заход в эту же функцию.
 */
function checkAchievements(): void {
  const current = state.achievements
  const unlocked = achievements.filter((ach) => {
    if (current[ach.id] === 'unlocked') return false
    if (!ach.check(state)) return false
    current[ach.id] = 'unlocked'
    return true
  })
  if (unlocked.length === 0) return

  // При обычной игре достижения открываются по одному; пачка возможна
  // только после обновления на старом сейве — тогда шлём одно сводное сообщение.
  let description: string
  if (unlocked.length === 1) {
    const ach = unlocked[0]
    description = `Получено новое достижение «${ach.title}». ${ach.description}`
  } else {
    const titles = unlocked.slice(0, 5).map((ach) => `«${ach.title}»`).join(', ')
    const rest = unlocked.length - 5
    description = `Получено сразу ${unlocked.length} новых достижений: ${titles}${rest > 0 ? ` и ещё ${rest}` : ''}.`
  }

  state = {
    ...state,
    achievements: { ...current },
    news: [
      ...state.news,
      createNewsItem({
        kind: 'achievement',
        title: 'Новое достижение',
        description,
        amount: 0,
      }),
    ],
  }
}

export function updateState(partial: Partial<AppState>): void {
  // Сохраняем старые значения ДО обновления
  const oldMoney = state.money
  const oldLevel = levelFromXp(state.xpMoney)

  if (partial.settings) {
    state = { ...state, settings: { ...state.settings, ...partial.settings } }
  } else {
    state = { ...state, ...partial }
  }

  // Авто-инкремент xpMoney: разница money → xpMoney
  if (state.money > oldMoney) {
    state.xpMoney += state.money - oldMoney
  }

  // Проверка повышения уровня (для лутбоксов)
  const newLevel = levelFromXp(state.xpMoney)
  if (newLevel > oldLevel) {
    state.lastPlayerLevel = newLevel
  }

  // Проверка ачивок
  checkAchievements()

  // Всегда округляем money и passiveIncomePerSecond до сотых при сохранении
  state.money = roundToCents(state.money)
  state.passiveIncomePerSecond = roundToCents(state.passiveIncomePerSecond)

  saveState()
  notify()
}

export function subscribe(listener: (state: AppState) => void): () => void {
  listeners.add(listener)
  listener(state)
  return () => {
    listeners.delete(listener)
  }
}

export function getState(): AppState {
  return state
}

/**
 * Сброс прогресса игры («Начать заново» в финальном окне анализа).
 * Обнуляется всё: деньги, XP, уровни отделов, выборы веток, смены, инвентарь,
 * новости и лутбоксы. Сохраняются только ачивки и настройки интерфейса.
 */
export function resetProgress(): void {
  state = {
    ...createDefaultState(),
    settings: { ...state.settings },
    achievements: { ...state.achievements },
  }
  saveState()
  notify()
}

/** Создаёт новость с уникальным идентификатором */
function createNewsItem(item: Omit<NewsItem, 'id'>): NewsItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...item,
  }
}

/** Добавляет новость о произошедшем событии (деньги по событию уже применены) */
export function addNewsItem(item: Omit<NewsItem, 'id'>): void {
  updateState({ news: [...state.news, createNewsItem(item)] })
}

/** Помечает новости прочитанными — удаляет их по идентификаторам */
export function markNewsRead(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  updateState({ news: state.news.filter((newsItem) => !idSet.has(newsItem.id)) })
}

/** Помечает текущий уровень игрока как «увиденный» (гасит индикатор) */
export function markPlayerLevelSeen(): void {
  const currentLevel = levelFromXp(state.xpMoney)
  if (currentLevel > state.seenPlayerLevel) {
    updateState({ seenPlayerLevel: currentLevel })
  }
}

/** Помечает текущий уровень И.О. как «увиденный» (гасит индикатор на кнопке) */
export function markActingLevelSeen(): void {
  if (state.actingManager.level > state.actingSeenLevel) {
    updateState({ actingSeenLevel: state.actingManager.level })
  }
}

/** Помечает стартовое приветствие И.О. показанным */
export function markIntroSeen(): void {
  if (!state.introSeen) {
    updateState({ introSeen: true })
  }
}

function notify(): void {
  listeners.forEach((listener) => listener(state))
}

state = loadState()

// Сразу сохраняем загруженное/мигрированное состояние, чтобы актуальный ключ
// всегда присутствовал в localStorage (в т.ч. после миграции из старых ключей).
saveState()

// ==================== ОФФЛАЙН ДОХОД ====================

let saveIntervalId: number | null = null

export interface OfflineIncomeInfo {
  /** Сколько денег начислить */
  amount: number
  /** Время отсутствия больше потолка — начислили только за доступное время */
  capped: boolean
  /** Фактическое время отсутствия в миллисекундах */
  offlineMs: number
  /** Добытые за оффлайн жетоны */
  tokens: TokenId[]
  /** Остаток времени до следующего жетона после начисления */
  tokenProgressMs: number
  /** Сколько опыта получит И.О. (равно начисленному оффлайн-доходу) */
  actingXpGained: number
}

/**
 * Вычисляет оффлайн-доход, жетоны и опыт И.О. за время отсутствия.
 * Доля дохода и потолок времени зависят от навыков И.О.
 */
export function calculateOfflineIncome(): OfflineIncomeInfo {
  const acting = state.actingManager
  const rate = getActingOfflineRate(acting.branches.performance)
  const durationMs = getActingOfflineDurationMs(acting.branches.duration)

  // Перевод часов назад не должен давать отрицательный оффлайн
  const offlineMs = Math.max(0, Date.now() - state.lastSaveTime)
  const effectiveDiffMs = Math.min(offlineMs, durationMs)
  const secondsOffline = effectiveDiffMs / 1000
  const amount = Math.floor(secondsOffline * state.passiveIncomePerSecond * rate)

  // Жетоны: накапливаем остаток времени, чтобы короткие заходы тоже шли в счёт.
  // За час происходит фиксированное число розыгрышей, каждый с шансом дать жетон.
  const drawsPerHour = getActingTokenDrawsPerHour(acting.tokenUpgrades.frequency)
  let tokenProgressMs = acting.tokenProgressMs
  let tokens: TokenId[] = []

  if (drawsPerHour > 0) {
    const intervalMs = 3_600_000 / drawsPerHour
    const totalMs = tokenProgressMs + effectiveDiffMs
    const count = Math.floor(totalMs / intervalMs)
    tokenProgressMs = totalMs - count * intervalMs
    tokens = rollActingTokens(
      count,
      getActingTokenChance(acting.tokenUpgrades.chance),
      getActingTokenDistribution(acting.tokenUpgrades.value),
    )
  }

  return {
    amount,
    capped: offlineMs > durationMs,
    offlineMs,
    tokens,
    tokenProgressMs,
    actingXpGained: amount,
  }
}

/**
 * Начисляет оффлайн-доход: деньги, жетоны и опыт И.О.
 * Всегда сдвигает время последнего сохранения, даже при нулевом доходе,
 * иначе оффлайн копился бы повторно.
 */
export function applyOfflineIncome(info: OfflineIncomeInfo): void {
  const acting = state.actingManager
  const xp = acting.xp + info.actingXpGained

  const inventory = info.tokens.length > 0
    ? { ...state.inventory, tokens: [...(state.inventory.tokens ?? []), ...info.tokens] }
    : state.inventory

  updateState({
    money: state.money + info.amount,
    inventory,
    lastSaveTime: Date.now(),
    actingManager: {
      ...acting,
      xp,
      level: levelFromXp(xp),
      tokensCollected: acting.tokensCollected + info.tokens.length,
      tokenProgressMs: info.tokenProgressMs,
    },
  })
}

/** Запускает периодическое сохранение времени (каждые 10 сек) */
export function startPassiveIncomeTracking(): void {
  if (saveIntervalId !== null) return
  saveIntervalId = setInterval(() => {
    updateState({ lastSaveTime: Date.now() })
  }, 10000)
}

/** Останавливает таймер и сохраняет актуальное время */
export function stopPassiveIncomeTracking(): void {
  if (saveIntervalId !== null) {
    clearInterval(saveIntervalId)
    saveIntervalId = null
    updateState({ lastSaveTime: Date.now() })
  }
}

// ==================== БОНУС ЗА ПРИГЛАШЕНИЕ ====================

/** Награда за нажатие кнопки «Поделиться» */
const SHARE_REWARD_AMOUNT = 10000

/** Начисляет бонус за приглашение (одноразово) и возвращает true, если начислено */
export function claimShareReward(): boolean {
  if (state.shareRewardClaimed) return false
  updateState({ shareRewardClaimed: true, money: state.money + SHARE_REWARD_AMOUNT })
  return true
}

/** Возвращает размер бонуса за приглашение */
export function getShareRewardAmount(): number {
  return SHARE_REWARD_AMOUNT
}
