/**
 * Персонажное снаряжение легендарных сотрудников.
 * Достижение открывается, когда в смене на сотрудника надет полный комплект:
 * каска (headdress), одежда (uniform) и терминал (tool).
 */
export interface LegendarySet {
  /** Ключ набора — используется в id и imageKey достижения */
  key: string
  /** ID сотрудника из data/staff.ts */
  staffId: string
  /** Имя сотрудника для описания достижения */
  staffName: string
  /** Название достижения */
  title: string
  /** ID каски (слот headdress) */
  headdress: string
  /** ID одежды (слот uniform) */
  uniform: string
  /** Подходящие терминалы (слот tool) — у Стрелка их несколько */
  tools: string[]
}

export const LEGENDARY_SETS: LegendarySet[] = [
  {
    key: 'strelok',
    staffId: 'reachtruck_18',
    staffName: 'Strelok',
    title: 'В полной выкладке',
    headdress: 'helmet_stalker',
    uniform: 'closes_stalker',
    tools: ['ted_stalker_omega', 'ted_stalker_taiga', 'ted_stalker_veles', 'ted_stalker_otklik'],
  },
  {
    key: 'isaak',
    staffId: 'reachtruck_19',
    staffName: 'Айзек Кларк',
    title: 'Космический инженер',
    headdress: 'helmet_isaak',
    uniform: 'closes_isaak',
    tools: ['ted_isaak'],
  },
  {
    key: 'gordon',
    staffId: 'reachtruck_20',
    staffName: 'Гордон Фримен',
    title: 'Костюм HEV',
    headdress: 'helmet_gordon',
    uniform: 'closes_gordon',
    tools: ['ted_gordon'],
  },
  {
    key: 'john117',
    staffId: 'reachtruck_21',
    staffName: 'Джон 117',
    title: 'Спартанец',
    headdress: 'helmet_john117',
    uniform: 'closes_john117',
    tools: ['ted_john117'],
  },
  {
    key: 'doom',
    staffId: 'reachtruck_22',
    staffName: 'Палач',
    title: 'Рвать и метать',
    headdress: 'helmet_doom',
    uniform: 'closes_doom',
    tools: ['ted_doom'],
  },
  {
    key: 'shepard',
    staffId: 'reachtruck_23',
    staffName: 'Шепард',
    title: 'Спектр',
    headdress: 'helmet_shepard',
    uniform: 'closes_shepard',
    tools: ['ted_shepard'],
  },
  {
    key: 'terminator',
    staffId: 'reachtruck_24',
    staffName: 'Терминатор',
    title: 'Я вернусь',
    headdress: 'helmet_terminator',
    uniform: 'closes_terminator',
    tools: ['ted_terminator'],
  },
  {
    key: 'santa',
    staffId: 'reachtruck_25',
    staffName: 'Санта',
    title: 'Готов к Рождеству',
    headdress: 'helmet_santa',
    uniform: 'closes_santa',
    tools: ['ted_santa'],
  },
  {
    key: 'verstappen',
    staffId: 'reachtruck_26',
    staffName: 'Макс Ферстаппен',
    title: 'Поул-позиция',
    headdress: 'helmet_verstappen',
    uniform: 'closes_verstappen',
    tools: ['ted_verstappen'],
  },
  {
    key: 'witcher',
    staffId: 'picker_23',
    staffName: 'Геральт',
    title: 'Ведьмак в полном снаряжении',
    headdress: 'helmet_witcher',
    uniform: 'closes_witcher',
    tools: ['ted_witcher'],
  },
  {
    key: 'kratos',
    staffId: 'picker_24',
    staffName: 'Кратос',
    title: 'Спартанская ярость',
    headdress: 'helmet_kratos',
    uniform: 'closes_kratos',
    tools: ['ted_kratos'],
  },
  {
    key: 'predator',
    staffId: 'picker_25',
    staffName: 'Хищник',
    title: 'Охота началась',
    headdress: 'helmet_predator',
    uniform: 'closes_predator',
    tools: ['ted_predator'],
  },
  {
    key: 'rembo',
    staffId: 'picker_26',
    staffName: 'Джон Рэмбо',
    title: 'Зелёный берет',
    headdress: 'helmet_rembo',
    uniform: 'closes_rembo',
    tools: ['ted_rembo'],
  },
  {
    key: 'avatar',
    staffId: 'picker_27',
    staffName: 'Джейк Салли',
    title: 'Аватар',
    headdress: 'helmet_avatar',
    uniform: 'closes_avatar',
    tools: ['ted_avatar'],
  },
]
