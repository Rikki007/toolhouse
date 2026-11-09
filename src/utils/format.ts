/** Суффиксы для сокращения больших чисел */
const NUM_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

/**
 * Сокращает большие числа: 1 234 → «1.23 K», 1 000 000 → «1.00 M».
 * При ≥1000 в текущем суффиксе — автоматически переходит к следующему (999.999K → «1.00 M»).
 * За пределами массива суффиксов — экспоненциальная запись.
 * Дробная часть всегда с двумя цифрами: ширина строки внутри разряда постоянна,
 * поэтому иконка монеты не «прыгает» при каждом изменении баланса.
 */
function formatShortNumber(n: number, suffixIdx = 0): string {
  if (Math.abs(n) < 1000) return Math.abs(n).toLocaleString('ru-RU')
  const nextIdx = suffixIdx + 1
  // Суффиксов не хватило (≥1e36) — динамическая экспоненциальная запись
  if (nextIdx >= NUM_SUFFIXES.length) {
    const exp = Math.floor(Math.log10(n))
    return `${(n / Math.pow(10, exp)).toFixed(2)}e${exp}`
  }

  const divisor = Math.pow(10, (suffixIdx + 1) * 3)
  const val = n / divisor
  const formatted = val.toFixed(2)

  // Если округление дало ≥1000 — переходим к следующему суффиксу
  if (Math.abs(parseFloat(formatted)) >= 1000) {
    return formatShortNumber(n, nextIdx)
  }

  return `${formatted} ${NUM_SUFFIXES[nextIdx]}`
}

/** Форматирует число с пробелами */
export function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

/** Форматирует деньги как целое число (без дробной части), сокращая большие значения */
export function formatMoney(n: number): string {
  const sign = n < 0 ? '−' : ''
  return sign + formatShortNumber(Math.abs(Math.round(n)))
}

/**
 * Русская плюрализация: возвращает нужную форму слова по числу.
 * @param forms — [1 час, 2 часа, 5 часов]
 */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

/** Форматирует длительность в миллисекундах как «1 час 5 минут» / «12 минут» */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  if (totalSec < 60) return `${totalSec} ${pluralRu(totalSec, ['секунду', 'секунды', 'секунд'])}`

  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} ${pluralRu(hours, ['час', 'часа', 'часов'])}`)
  if (minutes > 0) parts.push(`${minutes} ${pluralRu(minutes, ['минуту', 'минуты', 'минут'])}`)

  return parts.join(' ') || 'меньше минуты'
}

/**
 * Создаёт DOM-элемент цены с иконкой монетки.
 * @param prefix — префикс для CSS-классов (по умолчанию 'shop')
 */
export function createPriceElement(
  priceValue: number,
  coinSrc: string,
  prefix = 'shop'
): HTMLElement {
  const priceContainer = document.createElement('span')
  priceContainer.className = `${prefix}-price-with-coin`

  const amount = document.createElement('span')
  amount.className = `${prefix}-price-amount`
  amount.textContent = formatMoney(priceValue)
  priceContainer.appendChild(amount)

  const coinImg = document.createElement('img')
  coinImg.className = `${prefix}-price-coin`
  coinImg.src = coinSrc
  coinImg.alt = '$'
  priceContainer.appendChild(coinImg)

  return priceContainer
}
