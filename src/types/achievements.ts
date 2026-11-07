/** Уникальный идентификатор ачивки */
export type AchievementId = string

/** Статус ачивки */
export type AchievementStatus = 'locked' | 'unlocked'

/** Срез состояния, достаточный для проверки условий ачивки */
import type { AppState } from '../state/state.ts'

/** Описание ачивки (статические данные из data-файла) */
export interface AchievementDef {
  /** Уникальный id */
  id: AchievementId
  /** Название */
  title: string
  /** Описание */
  description: string
  /** Ключ картинки (из assetLoader) — заглушка, пока не добавлены ассеты */
  imageKey: string
  /** Функция проверки: получает срез состояния и возвращает true, если ачивка должна быть разблокирована */
  check: (state: AppState) => boolean
}

/** Хранилище статусов ачивок: id → статус */
export type AchievementsState = Record<AchievementId, AchievementStatus>
