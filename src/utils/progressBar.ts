/**
 * Создаёт DOM-элемент прогресс-бара с лейблом и звёздами.
 */
export function createProgressBar(label: string, value: number): HTMLElement {
  const container = document.createElement('div')
  container.className = 'shop-progress-container'

  const labelEl = document.createElement('span')
  labelEl.className = 'shop-progress-label'
  labelEl.textContent = label
  container.appendChild(labelEl)

  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0
  const starsCount = Math.max(0, Math.min(10, safeValue))
  const stars = document.createElement('span')
  stars.className = 'shop-progress-stars'
  stars.textContent = '⭐'.repeat(starsCount) + '☆'.repeat(10 - starsCount)
  container.appendChild(stars)

  return container
}
