import type { AchievementDef } from '../types/achievements.ts'
import type { AppState } from '../state/state.ts'
import type { SkillPath, BranchChoiceKey } from '../types/skills.ts'

// ==================== Уровень игрока ====================
function getPlayerLevel(state: AppState): number {
  return state.lastPlayerLevel
}

// ==================== Аллегианс ====================
const ALLEGIANCE_PARAGON_THRESHOLD = 20
const ALLEGIANCE_RENEGADE_THRESHOLD = 80

// ==================== Режим (liberal vs totalitarian) ====================
const REGIME_BRANCH_LEVELS: BranchChoiceKey[] = [
  'hr-3', 'hr-5', 'hr-7', 'hr-9', 'hr-10',
  'it-3', 'it-5', 'it-7', 'it-9', 'it-10',
  'laborProt-3', 'laborProt-5', 'laborProt-7', 'laborProt-9', 'laborProt-10',
  'security-3', 'security-5', 'security-7', 'security-9', 'security-10',
] as const

/** Сколько liberal веток выбрано */
function countRegimeBranches(state: AppState, path: SkillPath): number {
  let count = 0
  for (const key of REGIME_BRANCH_LEVELS) {
    if (state.branchChoices[key] === path) count++
  }
  return count
}

/** Абсолютный парagon: все 20 веток liberal */
function isRegimeAbsoluteParagon(state: AppState): boolean {
  return countRegimeBranches(state, 'liberal') >= REGIME_BRANCH_LEVELS.length
}

/** Абсолютный ренегейд: все 20 веток totalitarian */
function isRegimeAbsoluteRenegade(state: AppState): boolean {
  return countRegimeBranches(state, 'totalitarian') >= REGIME_BRANCH_LEVELS.length
}

/** Доминирует liberal: больше половины веток */
function isRegimeParagon(state: AppState): boolean {
  return countRegimeBranches(state, 'liberal') > REGIME_BRANCH_LEVELS.length / 2
}

/** Доминирует totalitarian: больше половины веток */
function isRegimeRenegade(state: AppState): boolean {
  return countRegimeBranches(state, 'totalitarian') > REGIME_BRANCH_LEVELS.length / 2
}

/** Баланс: нет доминирующей ветки */
function isRegimeBalanced(state: AppState): boolean {
  return !isRegimeParagon(state) && !isRegimeRenegade(state)
}

// ==================== Бизнес (legal vs dark) ====================
const BUSINESS_BRANCH_LEVELS: BranchChoiceKey[] = [
  'accounting-3', 'accounting-5', 'accounting-7', 'accounting-9', 'accounting-10',
  'marketing-3', 'marketing-5', 'marketing-7', 'marketing-9',
] as const

function countBusinessBranches(state: AppState, path: SkillPath): number {
  let count = 0
  for (const key of BUSINESS_BRANCH_LEVELS) {
    if (state.branchChoices[key] === path) count++
  }
  return count
}

function isBusinessAbsoluteLegal(state: AppState): boolean {
  return countBusinessBranches(state, 'legal') >= BUSINESS_BRANCH_LEVELS.length
}

function isBusinessAbsoluteDark(state: AppState): boolean {
  return countBusinessBranches(state, 'dark') >= BUSINESS_BRANCH_LEVELS.length
}

function isBusinessLegal(state: AppState): boolean {
  return countBusinessBranches(state, 'legal') > BUSINESS_BRANCH_LEVELS.length / 2
}

function isBusinessDark(state: AppState): boolean {
  return countBusinessBranches(state, 'dark') > BUSINESS_BRANCH_LEVELS.length / 2
}

// ==================== Кросс-ачивки ====================

/** Утопия: все 6 отделов на максимуме с ветками liberal/legal */
function isUtopia(state: AppState): boolean {
  return (
    state.skills.accounting >= 10 && state.branchChoices['accounting-10'] === 'legal' &&
    state.skills.marketing >= 10 && state.branchChoices['marketing-10'] === 'legal' &&
    state.skills.hr >= 10 && state.branchChoices['hr-10'] === 'liberal' &&
    state.skills.it >= 10 && state.branchChoices['it-10'] === 'liberal' &&
    state.skills.laborProt >= 10 && state.branchChoices['laborProt-10'] === 'liberal' &&
    state.skills.security >= 10 && state.branchChoices['security-10'] === 'liberal'
  )
}

/** Антиутопия: все 6 отделов на максимуме с ветками totalitarian */
function isDystopia(state: AppState): boolean {
  return (
    state.skills.accounting >= 10 && state.branchChoices['accounting-3'] === 'dark' && state.skills.accounting >= 10 &&
    state.skills.marketing >= 10 && state.branchChoices['marketing-10'] === 'dark' &&
    state.skills.hr >= 10 && state.branchChoices['hr-10'] === 'totalitarian' &&
    state.skills.it >= 10 && state.branchChoices['it-10'] === 'totalitarian' &&
    state.skills.laborProt >= 10 && state.branchChoices['laborProt-10'] === 'totalitarian' &&
    state.skills.security >= 10 && state.branchChoices['security-10'] === 'totalitarian'
  )
}

/** Честная империя: accounting + marketing на legal, уровень 10 */
function isHonestEmpire(state: AppState): boolean {
  return (
    state.skills.accounting >= 10 && state.branchChoices['accounting-10'] === 'legal' &&
    state.skills.marketing >= 10 && state.branchChoices['marketing-10'] === 'legal'
  )
}

/** Финансовая пирамида: accounting + marketing на dark, уровень 10 */
function isFinancialPyramid(state: AppState): boolean {
  return (
    state.skills.accounting >= 10 && state.branchChoices['accounting-10'] === 'dark' &&
    state.skills.marketing >= 10 && state.branchChoices['marketing-10'] === 'dark'
  )
}

/** Большой брат: it.5 totalitarian + security.5 totalitarian + hr.7 totalitarian */
function isBigBrother(state: AppState): boolean {
  return (
    state.skills.it >= 5 && state.branchChoices['it-5'] === 'totalitarian' &&
    state.skills.security >= 5 && state.branchChoices['security-5'] === 'totalitarian' &&
    state.skills.hr >= 7 && state.branchChoices['hr-7'] === 'totalitarian'
  )
}

/** Цифровая тюрьма: it.3 totalitarian + it.9 totalitarian + security.3 totalitarian */
function isDigitalPrison(state: AppState): boolean {
  return (
    state.skills.it >= 3 && state.branchChoices['it-3'] === 'totalitarian' &&
    state.skills.it >= 9 && state.branchChoices['it-9'] === 'totalitarian' &&
    state.skills.security >= 3 && state.branchChoices['security-3'] === 'totalitarian'
  )
}

/** Паноптикум: it.10 totalitarian + security.10 totalitarian + hr.10 totalitarian */
function isPanopticon(state: AppState): boolean {
  return (
    state.skills.it >= 10 && state.branchChoices['it-10'] === 'totalitarian' &&
    state.skills.security >= 10 && state.branchChoices['security-10'] === 'totalitarian' &&
    state.skills.hr >= 10 && state.branchChoices['hr-10'] === 'totalitarian'
  )
}

/** Стеклянный замок: it.3 liberal + security.5 liberal + hr.7 liberal */
function isGlassOffice(state: AppState): boolean {
  return (
    state.skills.it >= 3 && state.branchChoices['it-3'] === 'liberal' &&
    state.skills.security >= 5 && state.branchChoices['security-5'] === 'liberal' &&
    state.skills.hr >= 7 && state.branchChoices['hr-7'] === 'liberal'
  )
}

/** Свободная корпорация: it.7 liberal + hr.9 liberal + security.9 liberal */
function isFreeCorporation(state: AppState): boolean {
  return (
    state.skills.it >= 7 && state.branchChoices['it-7'] === 'liberal' &&
    state.skills.hr >= 9 && state.branchChoices['hr-9'] === 'liberal' &&
    state.skills.security >= 9 && state.branchChoices['security-9'] === 'liberal'
  )
}

/** Теневой оффшор: accounting.3 dark + it.6 */
function isShadowOffshore(state: AppState): boolean {
  return (
    state.skills.accounting >= 3 && state.branchChoices['accounting-3'] === 'dark' &&
    state.skills.it >= 6
  )
}

/** Скандал: accounting.7 dark + marketing.3 dark */
function isScandal(state: AppState): boolean {
  return (
    state.skills.accounting >= 7 && state.branchChoices['accounting-7'] === 'dark' &&
    state.skills.marketing >= 3 && state.branchChoices['marketing-3'] === 'dark'
  )
}

/** Двойное дно: marketing.3 legal + accounting.3 dark */
function isDoubleBottom(state: AppState): boolean {
  return (
    state.skills.marketing >= 3 && state.branchChoices['marketing-3'] === 'legal' &&
    state.skills.accounting >= 3 && state.branchChoices['accounting-3'] === 'dark'
  )
}

/** Профсоюз: hr.3 liberal + laborProt.9 liberal + security.9 liberal */
function isTradeUnion(state: AppState): boolean {
  return (
    state.skills.hr >= 3 && state.branchChoices['hr-3'] === 'liberal' &&
    state.skills.laborProt >= 9 && state.branchChoices['laborProt-9'] === 'liberal' &&
    state.skills.security >= 9 && state.branchChoices['security-9'] === 'liberal'
  )
}

/** Конвейер: hr.3 totalitarian + laborProt.5 totalitarian + security.7 totalitarian */
function isConveyor(state: AppState): boolean {
  return (
    state.skills.hr >= 3 && state.branchChoices['hr-3'] === 'totalitarian' &&
    state.skills.laborProt >= 5 && state.branchChoices['laborProt-5'] === 'totalitarian' &&
    state.skills.security >= 7 && state.branchChoices['security-7'] === 'totalitarian'
  )
}

/** Кнут и пряник: hr.5 totalitarian + laborProt.9 liberal */
function isCarrotAndStick(state: AppState): boolean {
  return (
    state.skills.hr >= 5 && state.branchChoices['hr-5'] === 'totalitarian' &&
    state.skills.laborProt >= 9 && state.branchChoices['laborProt-9'] === 'liberal'
  )
}

/** Умный склад: it.2 + security.6 + repair.8 */
function isSmartWarehouse(state: AppState): boolean {
  return (
    state.skills.it >= 2 &&
    state.skills.security >= 6 &&
    state.skills.repair >= 8
  )
}

/** Тотальная автоматизация: accounting.8 + it.8 + repair.10 */
function isTotalAutomation(state: AppState): boolean {
  return (
    state.skills.accounting >= 8 &&
    state.skills.it >= 8 &&
    state.skills.repair >= 10
  )
}

/** Кризис-менеджмент: security.8 + laborProt.4 + repair.7 */
function isCrisisManagement(state: AppState): boolean {
  return (
    state.skills.security >= 8 &&
    state.skills.laborProt >= 4 &&
    state.skills.repair >= 7
  )
}

/** Синергия ИИ: it.9 liberal + laborProt.7 liberal + marketing.9 legal */
function isAiSynergy(state: AppState): boolean {
  return (
    state.skills.it >= 9 && state.branchChoices['it-9'] === 'liberal' &&
    state.skills.laborProt >= 7 && state.branchChoices['laborProt-7'] === 'liberal' &&
    state.skills.marketing >= 9 && state.branchChoices['marketing-9'] === 'legal'
  )
}

/** ИИ-надзиратель: it.9 totalitarian + laborProt.7 totalitarian + marketing.9 dark */
function isAiOverseer(state: AppState): boolean {
  return (
    state.skills.it >= 9 && state.branchChoices['it-9'] === 'totalitarian' &&
    state.skills.laborProt >= 7 && state.branchChoices['laborProt-7'] === 'totalitarian' &&
    state.skills.marketing >= 9 && state.branchChoices['marketing-9'] === 'dark'
  )
}

/** Корпоративный университет: hr.8 + it.5 liberal + laborProt.1 */
function isCorporateUniversity(state: AppState): boolean {
  return (
    state.skills.hr >= 8 &&
    state.skills.it >= 5 && state.branchChoices['it-5'] === 'liberal' &&
    state.skills.laborProt >= 1
  )
}

// ==================== Массив ачивок ====================

export const achievements: AchievementDef[] = [
  // ===== КЛИКИ =====
  {
    id: 'clicks_1',
    title: 'Первые шаги',
    description: 'Первые 100 кликов.',
    imageKey: 'achievements/clicks_1',
    check: (state) => state.clicks >= 100,
  },
  {
    id: 'clicks_2',
    title: 'Кликоголик',
    description: '1 000 кликов.',
    imageKey: 'achievements/clicks_2',
    check: (state) => state.clicks >= 1_000,
  },
  {
    id: 'clicks_3',
    title: 'Кликпрофи',
    description: '10 000 кликов.',
    imageKey: 'achievements/clicks_3',
    check: (state) => state.clicks >= 10_000,
  },
  {
    id: 'clicks_4',
    title: 'Кликмастер',
    description: '100 000 кликов.',
    imageKey: 'achievements/clicks_4',
    check: (state) => state.clicks >= 100_000,
  },
  {
    id: 'clicks_5',
    title: 'Кликлегенда',
    description: '1 000 000 кликов.',
    imageKey: 'achievements/clicks_5',
    check: (state) => state.clicks >= 1_000_000,
  },

  // ===== ДЕНЬГИ (xpMoney — суммарный заработок) =====
  {
    id: 'money_1',
    title: 'Карманные деньги',
    description: 'Заработано 10 000.',
    imageKey: 'achievements/money_1',
    check: (state) => state.xpMoney >= 10_000,
  },
  {
    id: 'money_2',
    title: 'Небольшой капитал',
    description: 'Заработано 100 000.',
    imageKey: 'achievements/money_2',
    check: (state) => state.xpMoney >= 100_000,
  },
  {
    id: 'money_3',
    title: 'Миллионер',
    description: 'Заработано 1 000 000.',
    imageKey: 'achievements/money_3',
    check: (state) => state.xpMoney >= 1_000_000,
  },
  {
    id: 'money_4',
    title: 'Майнер',
    description: 'Заработано 10 000 000.',
    imageKey: 'achievements/money_4',
    check: (state) => state.xpMoney >= 10_000_000,
  },
  {
    id: 'money_5',
    title: 'Золотой дождь',
    description: 'Заработано 100 000 000.',
    imageKey: 'achievements/money_5',
    check: (state) => state.xpMoney >= 100_000_000,
  },

  // ===== УРОВНИ =====
  {
    id: 'level_1',
    title: 'Начало пути',
    description: 'Получен первый уровень.',
    imageKey: 'achievements/level_1',
    check: (state) => getPlayerLevel(state) >= 1,
  },
  {
    id: 'level_2',
    title: 'Встать на ноги',
    description: 'Получен седьмой уровень.',
    imageKey: 'achievements/level_2',
    check: (state) => getPlayerLevel(state) >= 7,
  },
  {
    id: 'level_3',
    title: 'Колосс',
    description: 'Получен пятнадцатый уровень.',
    imageKey: 'achievements/level_3',
    check: (state) => getPlayerLevel(state) >= 15,
  },
  {
    id: 'level_4',
    title: 'Видавщий виды',
    description: 'Получен двадцатый уровень.',
    imageKey: 'achievements/level_4',
    check: (state) => getPlayerLevel(state) >= 20,
  },
  {
    id: 'level_5',
    title: 'Живая легенда',
    description: 'Достигнут двадцать пятый уровень.',
    imageKey: 'achievements/level_5',
    check: (state) => getPlayerLevel(state) >= 25,
  },

  // ===== АЛЛЕГИАНС (лояльность коллектива) =====
  {
    id: 'allegiance_paragon',
    title: 'Приятный парень',
    description: 'Всегда становитесь на сторону сотрудников. Ваш девиз - доверие.',
    imageKey: 'achievements/allegiance_paragon',
    check: (state) => state.allegiance.agression < ALLEGIANCE_PARAGON_THRESHOLD,
  },
  {
    id: 'allegiance_balanced',
    title: 'Сбалансированный',
    description: 'Непредвзятость в принятии решений - ваша натура.',
    imageKey: 'achievements/allegiance_balanced',
    check: (state) =>
      state.allegiance.agression >= ALLEGIANCE_PARAGON_THRESHOLD &&
      state.allegiance.agression < ALLEGIANCE_RENEGADE_THRESHOLD,
  },
  {
    id: 'allegiance_renegade',
    title: 'Бессердечный',
    description: 'Никогда не прощаете ошибки сотрудников. Ваше кредо - порядок.',
    imageKey: 'achievements/allegiance_renegade',
    check: (state) => state.allegiance.agression >= ALLEGIANCE_RENEGADE_THRESHOLD,
  },

  // ===== РЕЖИМ (liberal vs totalitarian) =====
  {
    id: 'regime_absolute_paragon',
    title: 'Абсолютная свобода',
    description: 'Каждое решение направлено на свободу и уважение к людям. В компании не осталось ни одной репрессивной практики.',
    imageKey: 'achievements/regime_absolute_paragon',
    check: isRegimeAbsoluteParagon,
  },
  {
    id: 'regime_paragon',
    title: 'Либерал',
    description: 'Система рабочих отношений построена на свободе, доверии и правах.',
    imageKey: 'achievements/regime_paragon',
    check: isRegimeParagon,
  },
  {
    id: 'regime_balanced',
    title: 'Центрист',
    description: 'Свобода и контроль уравновешены. Ни одна из идеологий не получила решающего преимущества.',
    imageKey: 'achievements/regime_balanced',
    check: isRegimeBalanced,
  },
  {
    id: 'regime_renegade',
    title: 'Тиран',
    description: 'Система рабочих отношений построена на контроле, надзоре и подчинении.',
    imageKey: 'achievements/regime_renegade',
    check: isRegimeRenegade,
  },
  {
    id: 'regime_absolute_renegade',
    title: 'Тотальный контроль',
    description: 'Каждое решение направлено на контроль и подчинение.',
    imageKey: 'achievements/regime_absolute_renegade',
    check: isRegimeAbsoluteRenegade,
  },

  // ===== БИЗНЕС (legal vs dark) =====
  {
    id: 'business_absolute_legal',
    title: 'Законопослушный гражданин',
    description: 'Каждое решение в бизнесе в рамках закона. Ни одной тёмной схемы.',
    imageKey: 'achievements/business_absolute_legal',
    check: isBusinessAbsoluteLegal,
  },
  {
    id: 'business_legal',
    title: 'Честный',
    description: 'Ведение дел построено на прозрачности, законности и доверии.',
    imageKey: 'achievements/business_legal',
    check: isBusinessLegal,
  },
  {
    id: 'business_balanced',
    title: 'Прагматик',
    description: 'Закон и выгода уравновешены. Вы не чураетесь тёмных схем, но и не строите на них весь бизнес.',
    imageKey: 'achievements/business_balanced',
    check: (state) => !isBusinessLegal(state) && !isBusinessDark(state),
  },
  {
    id: 'business_dark',
    title: 'Отступник',
    description: 'Ведение дел построено на обходе правил, сомнительных сделках и теневых схемах.',
    imageKey: 'achievements/business_dark',
    check: isBusinessDark,
  },
  {
    id: 'business_absolute_dark',
    title: 'Мошенник',
    description: 'Каждое решение в бизнесе вне закона.',
    imageKey: 'achievements/business_absolute_dark',
    check: isBusinessAbsoluteDark,
  },

  // ===== КРОСС-АЧИВКИ =====
  {
    id: 'cross_big_brother',
    title: 'Большой брат',
    description: 'Три системы слежки работают как одна. Вы знаете о сотруднике больше, чем он сам.',
    imageKey: 'achievements/cross_big_brother',
    check: isBigBrother,
  },
  {
    id: 'cross_digital_prison',
    title: 'Цифровая тюрьма',
    description: 'Каждый клик, каждая транзакция, каждый вход: всё записано и проанализировано.',
    imageKey: 'achievements/cross_digital_prison',
    check: isDigitalPrison,
  },
  {
    id: 'cross_panopticon',
    title: 'Паноптикум',
    description: 'Идеальная тюрьма построена. Все на виду, наказание следует автоматически.',
    imageKey: 'achievements/cross_panopticon',
    check: isPanopticon,
  },
  {
    id: 'cross_glass_office',
    title: 'Стеклянный замок',
    description: 'Каждое решение открыто, каждый процесс прозрачен. Сотрудники доверяют компании.',
    imageKey: 'achievements/cross_glass_office',
    check: isGlassOffice,
  },
  {
    id: 'cross_free_corporation',
    title: 'Свободная корпорация',
    description: 'Никакого надзора. Все отношения построены на доверии.',
    imageKey: 'achievements/cross_free_corporation',
    check: isFreeCorporation,
  },
  {
    id: 'cross_utopia',
    title: 'Утопия',
    description: 'Выбраны голубые ветки во сех отделах. Компания либеральная и открытая.',
    imageKey: 'achievements/cross_utopia',
    check: isUtopia,
  },
  {
    id: 'cross_honest_empire',
    title: 'Честная империя',
    description: 'Клиенты возвращаются сами и приводят друзей. Рынок, построенный на доверии, не боится проверок.',
    imageKey: 'achievements/cross_honest_empire',
    check: isHonestEmpire,
  },
  {
    id: 'cross_financial_pyramid',
    title: 'Финансовая пирамида',
    description: 'Теневые деньги и монополия слились в единую империю. Регуляторы куплены.',
    imageKey: 'achievements/cross_financial_pyramid',
    check: isFinancialPyramid,
  },
  {
    id: 'cross_shadow_offshore',
    title: 'Теневой оффшор',
    description: 'Теневая касса спрятана под слоем криптографии. Ни налоговая, ни конкуренты её не найдут.',
    imageKey: 'achievements/cross_shadow_offshore',
    check: isShadowOffshore,
  },
  {
    id: 'cross_scandal',
    title: 'Скандал',
    description: 'Спам-рассылки и двойная бухгалтерия — компания живёт на грани разоблачения.',
    imageKey: 'achievements/cross_scandal',
    check: isScandal,
  },
  {
    id: 'cross_double_bottom',
    title: 'Двойное дно',
    description: 'Снаружи - репутация и качество. Внутри - теневая касса и неучтённые схемы.',
    imageKey: 'achievements/cross_double_bottom',
    check: isDoubleBottom,
  },
  {
    id: 'cross_trade_union',
    title: 'Профсоюз',
    description: 'Мягкая мотивация, страховка и юридическая защита. Сотрудники чувствуют заботу.',
    imageKey: 'achievements/cross_trade_union',
    check: isTradeUnion,
  },
  {
    id: 'cross_conveyor',
    title: 'Конвейер',
    description: 'KPI, формальные медосмотры и объяснительные. Люди - это ресурс.',
    imageKey: 'achievements/cross_conveyor',
    check: isConveyor,
  },
  {
    id: 'cross_carrot_and_stick',
    title: 'Кнут и пряник',
    description: 'Жёсткая культура HR сочетается со щедрой страховкой. Сотрудник не хочет уходить.',
    imageKey: 'achievements/cross_carrot_and_stick',
    check: isCarrotAndStick,
  },
  {
    id: 'cross_smart_warehouse',
    title: 'Умный склад',
    description: 'WMS, видеонаблюдение и ремонтная база работают в связке.',
    imageKey: 'achievements/cross_smart_warehouse',
    check: isSmartWarehouse,
  },
  {
    id: 'cross_total_automation',
    title: 'Тотальная автоматизация',
    description: 'Бухгалтерия, IT и техотдел работают как единый механизм. Человеческий фактор исключён.',
    imageKey: 'achievements/cross_total_automation',
    check: isTotalAutomation,
  },
  {
    id: 'cross_crisis_management',
    title: 'Кризис-менеджмент',
    description: 'Кризисный центр, культура безопасности и регламентное ТО сводят аварии к нулю.',
    imageKey: 'achievements/cross_crisis_management',
    check: isCrisisManagement,
  },
  {
    id: 'cross_ai_synergy',
    title: 'Синергия ИИ',
    description: 'Три нейросети работают как единая экосистема. Люди получают помощь, а не надзор.',
    imageKey: 'achievements/cross_ai_synergy',
    check: isAiSynergy,
  },
  {
    id: 'cross_ai_overseer',
    title: 'ИИ-надзиратель',
    description: 'Нейросети предсказывают нарушения, продавливают покупки и управляют поведением.',
    imageKey: 'achievements/cross_ai_overseer',
    check: isAiOverseer,
  },
  {
    id: 'cross_corporate_university',
    title: 'Корпоративный университет',
    description: 'Обучение встроено в каждый процесс: адаптация, кибергигиена, инструктаж.',
    imageKey: 'achievements/cross_corporate_university',
    check: isCorporateUniversity,
  },
  {
    id: 'cross_dystopia',
    title: 'Антиутопия',
    description: 'Шесть отделов - шесть тёмных финалов. Компания-государство, где каждый шаг под контролем.',
    imageKey: 'achievements/cross_dystopia',
    check: isDystopia,
  },
]
