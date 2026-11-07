/**
 * Пороги суммарного заработка (xpMoney) для получения уровня игрока.
 * Индекс + 1 = номер уровня. XP_THRESHOLDS[0] = 0 → уровень 1 с самого начала.
 */
export const XP_THRESHOLDS: number[] = [
  0,            // ур. 1
  5_000,        // ур. 2
  15_000,       // ур. 3
  40_000,       // ур. 4
  100_000,      // ур. 5
  250_000,      // ур. 6
  600_000,      // ур. 7
  1_500_000,    // ур. 8
  3_500_000,    // ур. 9
  8_000_000,    // ур. 10
  15_000_000,   // ур. 11
  30_000_000,   // ур. 12
  50_000_000,   // ур. 13
  80_000_000,   // ур. 14
  120_000_000,  // ур. 15
  170_000_000,  // ур. 16
  230_000_000,  // ур. 17
  300_000_000,  // ур. 18
  400_000_000,  // ур. 19
  500_000_000,  // ур. 20
]

/** Множитель роста порога за пределами таблицы */
const XP_GROWTH_FACTOR = 1.5

/**
 * Вычисляет уровень игрока по суммарному заработку.
 * Уровень 1 — с самого начала (xpMoney >= 0).
 */
export function levelFromXp(xpMoney: number): number {
  if (xpMoney < 0) return 1

  // В пределах таблицы — бинарный поиск
  if (xpMoney < XP_THRESHOLDS[XP_THRESHOLDS.length - 1]) {
    let lo = 0
    let hi = XP_THRESHOLDS.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1
      if (xpMoney >= XP_THRESHOLDS[mid]) {
        lo = mid
      } else {
        hi = mid - 1
      }
    }
    return lo + 1
  }

  // За пределами таблицы — экспоненциальный хвост
  let level = XP_THRESHOLDS.length
  let threshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1]
  while (xpMoney >= threshold) {
    threshold = Math.floor(threshold * XP_GROWTH_FACTOR)
    level++
  }
  return level
}

/**
 * Минимальный xpMoney для достижения указанного уровня.
 * Уровень 1 → 0.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  if (level <= XP_THRESHOLDS.length) return XP_THRESHOLDS[level - 1]

  // Экспоненциальный хвост
  let threshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1]
  for (let i = XP_THRESHOLDS.length; i < level; i++) {
    threshold = Math.floor(threshold * XP_GROWTH_FACTOR)
  }
  return threshold
}

/**
 * Прогресс до следующего уровня.
 * @returns current — xpMoney в начале текущего уровня, next — порог следующего, progress — доля 0..1
 */
export function nextLevelProgress(xpMoney: number): {
  current: number
  next: number
  progress: number
} {
  const level = levelFromXp(xpMoney)
  const current = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const span = next - current
  const progress = span > 0 ? (xpMoney - current) / span : 1
  return { current, next, progress }
}
