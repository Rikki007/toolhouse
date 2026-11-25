/** ID навыков дерева развития И.О. */
export type ActingBranchId = 'performance' | 'duration' | 'tokens'

/** Цвет подсветки навыка */
export type ActingBranchColor = 'blue' | 'purple' | 'green'

/** Цвет добытого жетона */
export type ActingTokenColor = 'red' | 'green' | 'gold'

/** Тип добытого жетона */
export type ActingTokenKind = 'lootbox' | 'acceleration' | 'levelUp'

/** Параметр прокачки навыка «Сбор жетонов» */
export type ActingTokenParam = 'frequency' | 'chance' | 'value'

/** Уровни трёх параметров навыка «Сбор жетонов» */
export interface ActingTokenUpgrades {
  /** Частота: количество розыгрышей жетона за час оффлайна */
  frequency: number
  /** Вероятность: шанс, что розыгрыш даст жетон */
  chance: number
  /** Ценность: распределение цветов выпавших жетонов */
  value: number
}

/** Описание одного навыка дерева И.О. */
export interface ActingBranch {
  id: ActingBranchId
  label: string
  /** Ключ иконки из assetLoader (interfaceIconImages либо tokenImages) */
  iconKey: string
  color: ActingBranchColor
  /** Что даёт навык — текст в модалке навыка */
  description: string
}

/** Прогресс И.О.: опыт, уровень, уровни навыков и накопленный прогресс жетона */
export interface ActingManagerState {
  /** Накопленный оффлайн-доход — он же опыт И.О. */
  xp: number
  /** Уровень И.О., вычисляется из xp */
  level: number
  branches: Record<ActingBranchId, number>
  /** Уровни параметров сбора жетонов (навык «Сбор жетонов») */
  tokenUpgrades: ActingTokenUpgrades
  /** Сколько жетонов И.О. собрала за всё время (только растёт) */
  tokensCollected: number
  /** Остаток времени до следующего жетона (мс) */
  tokenProgressMs: number
}
