/** ID жетонов (см. data/tokens.ts) */
export type TokenId =
  | 'lootboxTokenGold'
  | 'lootboxTokenGreen'
  | 'lootboxTokenRed'
  | 'accelerationTokenGold'
  | 'accelerationTokenGreen'
  | 'accelerationTokenRed'

/** Конфигурация одного типа жетона */
export interface TokenConfig {
  id: TokenId
  label: string
  description: string
  /** Ключ картинки из assetLoader */
  imageKey: string
  /** Тип жетона */
  kind: 'lootbox' | 'acceleration'
  /** Цвет (для UI-подсветки) */
  color: 'gold' | 'green' | 'red'
  /** Сколько лутбоксов открывает (для kind: 'lootbox') */
  lootboxCount?: number
  /** Сколько миллисекунд добавляет к ускорению (для kind: 'acceleration') */
  boostDurationMs?: number
}
