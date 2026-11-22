import type { TokenConfig } from '../types/index.ts'

/** Конфиги всех жетонов */
export const TOKENS: TokenConfig[] = [
  // Токены лутбоксов
  {
    id: 'lootboxTokenGold',
    label: 'Золотой жетон',
    description: 'Открывает 3 лутбокса подряд',
    imageKey: 'lootboxTokenGold',
    kind: 'lootbox',
    color: 'gold',
    lootboxCount: 3,
  },
  {
    id: 'lootboxTokenGreen',
    label: 'Зелёный жетон',
    description: 'Открывает 2 лутбокса подряд',
    imageKey: 'lootboxTokenGreen',
    kind: 'lootbox',
    color: 'green',
    lootboxCount: 2,
  },
  {
    id: 'lootboxTokenRed',
    label: 'Красный жетон',
    description: 'Открывает 1 лутбокс',
    imageKey: 'lootboxTokenRed',
    kind: 'lootbox',
    color: 'red',
    lootboxCount: 1,
  },
  // Токены ускорения
  {
    id: 'accelerationTokenGold',
    label: 'Золотой жетон ускорения',
    description: '+90 секунд ускорения',
    imageKey: 'accelerationTokenGold',
    kind: 'acceleration',
    color: 'gold',
    boostDurationMs: 90_000,
  },
  {
    id: 'accelerationTokenGreen',
    label: 'Зелёный жетон ускорения',
    description: '+60 секунд ускорения',
    imageKey: 'accelerationTokenGreen',
    kind: 'acceleration',
    color: 'green',
    boostDurationMs: 60_000,
  },
  {
    id: 'accelerationTokenRed',
    label: 'Красный жетон ускорения',
    description: '+30 секунд ускорения',
    imageKey: 'accelerationTokenRed',
    kind: 'acceleration',
    color: 'red',
    boostDurationMs: 30_000,
  },
]
