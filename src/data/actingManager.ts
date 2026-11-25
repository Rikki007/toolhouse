import type { ActingBranch, ActingBranchId, ActingTokenParam } from '../types/index.ts'

/** Доля пассивного дохода в оффлайне без прокачки «Производительности»: 40% */
export const ACTING_PERFORMANCE_BASE_RATE = 0.4

/** Прибавка к доле оффлайна за уровень «Производительности»: +3% */
export const ACTING_PERFORMANCE_STEP = 0.03

/** Потолок доли оффлайна: 100% — оффлайн не должен быть выгоднее онлайна */
export const ACTING_PERFORMANCE_MAX_RATE = 1

/** Базовое время накопления оффлайн-дохода: 1 час */
export const ACTING_DURATION_BASE_MS = 60 * 60 * 1000

/** Прибавка ко времени накопления за уровень «Продолжительности»: +10 минут */
export const ACTING_DURATION_STEP_MS = 10 * 60 * 1000

/** Потолок накопления оффлайн-дохода: 6 часов */
export const ACTING_DURATION_MAX_MS = 6 * 60 * 60 * 1000

/**
 * Базовое количество розыгрышей жетона за час оффлайна (без прокачки «Частоты»).
 * Один розыгрыш — это шанс получить жетон, а не гарантированная награда.
 */
export const ACTING_TOKEN_FREQUENCY_BASE = 1

/** Максимум розыгрышей жетона за час оффлайна */
export const ACTING_TOKEN_FREQUENCY_MAX = 6

/** Базовая вероятность выпадения жетона при розыгрыше, % */
export const ACTING_TOKEN_CHANCE_BASE = 25

/** Прибавка к вероятности выпадения жетона за уровень «Вероятности», % */
export const ACTING_TOKEN_CHANCE_STEP = 5

/** Максимальная вероятность выпадения жетона, % */
export const ACTING_TOKEN_CHANCE_MAX = 75

/**
 * Распределение цветов выпавшего жетона по уровню «Ценности», %.
 * Индекс массива — уровень параметра (0 — базовое распределение).
 * Порядок значений: [красный, зелёный, золотой].
 */
export const ACTING_TOKEN_DISTRIBUTION: Array<[number, number, number]> = [
  [60, 30, 10],
  [57, 32, 11],
  [55, 33, 12],
  [52, 35, 13],
  [50, 36, 14],
  [47, 38, 15],
  [45, 39, 16],
  [45, 37, 18],
  [45, 35, 20],
]

/** Максимальные уровни трёх параметров навыка «Сбор жетонов» */
export const ACTING_TOKEN_MAX_LEVELS: Record<ActingTokenParam, number> = {
  frequency: ACTING_TOKEN_FREQUENCY_MAX - ACTING_TOKEN_FREQUENCY_BASE,
  chance: (ACTING_TOKEN_CHANCE_MAX - ACTING_TOKEN_CHANCE_BASE) / ACTING_TOKEN_CHANCE_STEP,
  value: ACTING_TOKEN_DISTRIBUTION.length - 1,
}

/** Максимальный уровень каждого навыка */
export const ACTING_MAX_BRANCH_LEVELS: Record<ActingBranchId, number> = {
  performance: 20,
  duration: 30,
  // «Сбор жетонов» прокачивается тремя параметрами — сумма их максимумов
  tokens:
    ACTING_TOKEN_MAX_LEVELS.frequency +
    ACTING_TOKEN_MAX_LEVELS.chance +
    ACTING_TOKEN_MAX_LEVELS.value,
}

/** Личные данные И.О. для карточки профиля */
export const ACTING_MANAGER_PROFILE = {
  name: 'Соловей Анастасия Кирилловна',
  role: 'Исполняющая обязанности управляющего складом',
  /** Краткое описание опыта и квалификации */
  bio: 'В складской логистике уже 7 лет. Два высших образования: логистика и управление персоналом.',
  /** Фраза персонажа в карточке профиля */
  quote: 'Пока Вас нет, склад под моим присмотром.',
}

/** Три навыка дерева развития И.О. */
export const ACTING_BRANCHES: ActingBranch[] = [
  {
    id: 'performance',
    label: 'Производительность',
    iconKey: 'departments',
    color: 'blue',
    description:
      'Какая доля пассивного дохода начисляется в оффлайне. Без прокачки — 40%, каждый уровень добавляет 3%. На 100% оффлайн-доход сравнивается с онлайн-доходом.',
  },
  {
    id: 'duration',
    label: 'Продолжительность',
    iconKey: 'acceleration',
    color: 'green',
    description:
      'Сколько времени оффлайн-доход продолжает копиться без игрока. Без прокачки — 1 час, каждый уровень добавляет 10 минут. Максимум — 6 часов.',
  },
  {
    id: 'tokens',
    label: 'Сбор жетонов',
    iconKey: 'lootboxTokenGold',
    color: 'purple',
    description:
      'Жетоны добываются розыгрышами. «Частота» — сколько розыгрышей происходит за час оффлайна, «Вероятность» — шанс, что розыгрыш даст жетон, «Ценность» — распределение выпавших жетонов по цветам. Тип жетона случаен: лутбокс, ускорение или улучшение персонала.',
  },
]
