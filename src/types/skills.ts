/** id всех отделов */
export type SkillId =
    | 'accounting'
    | 'hr'
    | 'it'
    | 'laborProt'
    | 'marketing'
    | 'repair'
    | 'security';

/** Путь ветки выбора пользователя */
export type SkillPath =
    | 'legal'
    | 'dark'
    | 'liberal'
    | 'totalitarian';

/** Разблокировки, общие для уровня и варианта выбора */
interface SkillUnlocks {
    unlocksName: string;
    unlocksDescription: string;
    unlocksImage: string;
}

/** Вариант выбора на уровне с ветвлением */
export interface SkillBranchOption extends SkillUnlocks {
    path: SkillPath;
    cost: number;
    factor: number;
}

/** Уровень без выбора (нейтральный) */
export interface SkillPlainLevel extends SkillUnlocks {
    level: number;
    cost: number;
    factor: number;
    branch?: undefined;
}

/** Уровень с выбором из нескольких вариантов */
export interface SkillChoiceLevel {
    level: number;
    branch: SkillBranchOption[];
}

/** Один уровень прокачки отдела */
export type SkillLevel = SkillPlainLevel | SkillChoiceLevel;

/** Ключ выбора ветки: `${skillId}-${level}` */
export type BranchChoiceKey = `${SkillId}-${number}`;

/** Хранилище выборов веток: ключ → выбранный путь */
export type SkillBranchChoices = Record<BranchChoiceKey, SkillPath>;

/** Главный объект отдела */
export interface Skill {
    id: SkillId;
    name: string;
    imagePath: string;
    description: string;
    maxLevel: number;
    levels: SkillLevel[];
}
