import { getState } from '../state/state.ts'
import { shiftConfigs } from '../state/shiftsStore.ts'
import { calculateShiftIncomes } from '../utils/passiveIncome.ts'
import { formatMoney } from '../utils/format.ts'
import { levelFromXp } from '../data/playerLevels.ts'

/** Цвета секторов диаграммы по ID смены */
const SHIFT_COLORS: Record<number, string> = {
  1: '#4ade80',
  2: '#fbbf24',
  3: '#a855f7',
  4: '#f97316',
}

/** Радиус и толщина кольца диаграммы (в единицах viewBox 0 0 100 100) */
const CHART_RADIUS = 42
const CHART_STROKE = 16
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS

/** Название смены по ID */
function getShiftLabel(shiftId: number): string {
  return shiftConfigs.find((c) => c.id === shiftId)?.label ?? `${shiftId}-я смена`
}

/** Форматирует долю в процентах */
function formatPercent(part: number, total: number): string {
  const percent = total > 0 ? (part / total) * 100 : 0
  if (percent > 0 && percent < 1) return '<1%'
  return `${Math.round(percent)}%`
}

/** Создаёт SVG-кольцо с секторами */
function createDonut(entries: Array<{ shiftId: number; income: number }>, total: number): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('class', 'shift-chart-donut')
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', 'Доход по сменам')

  // Фоновое кольцо
  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  track.setAttribute('cx', '50')
  track.setAttribute('cy', '50')
  track.setAttribute('r', String(CHART_RADIUS))
  track.setAttribute('fill', 'none')
  track.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)')
  track.setAttribute('stroke-width', String(CHART_STROKE))
  svg.appendChild(track)

  let offset = 0
  for (const entry of entries) {
    const share = total > 0 ? entry.income / total : 0
    const length = share * CHART_CIRCUMFERENCE
    // Небольшой зазор между секторами, но не больше половины сектора
    const gap = entries.length > 1 ? Math.min(2, length / 2) : 0

    const segment = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    segment.setAttribute('cx', '50')
    segment.setAttribute('cy', '50')
    segment.setAttribute('r', String(CHART_RADIUS))
    segment.setAttribute('fill', 'none')
    segment.setAttribute('stroke', SHIFT_COLORS[entry.shiftId] ?? '#94a3b8')
    segment.setAttribute('stroke-width', String(CHART_STROKE))
    segment.setAttribute('stroke-linecap', 'butt')
    segment.setAttribute('stroke-dasharray', `${Math.max(0, length - gap)} ${CHART_CIRCUMFERENCE}`)
    segment.setAttribute('stroke-dashoffset', String(-offset))
    segment.setAttribute('transform', 'rotate(-90 50 50)')
    svg.appendChild(segment)

    offset += length
  }

  return svg
}

/** Создаёт строку легенды */
function createLegendRow(shiftId: number, income: number, total: number): HTMLElement {
  const row = document.createElement('div')
  row.className = 'shift-chart-legend-row'

  const color = document.createElement('span')
  color.className = 'shift-chart-legend-color'
  color.style.background = SHIFT_COLORS[shiftId] ?? '#94a3b8'
  row.appendChild(color)

  const name = document.createElement('span')
  name.className = 'shift-chart-legend-name'
  name.textContent = getShiftLabel(shiftId)
  row.appendChild(name)

  const value = document.createElement('span')
  value.className = 'shift-chart-legend-value'
  value.textContent = `${formatMoney(income)}/сек`
  row.appendChild(value)

  const percent = document.createElement('span')
  percent.className = 'shift-chart-legend-percent'
  percent.textContent = formatPercent(income, total)
  row.appendChild(percent)

  return row
}

/**
 * Блок аналитики дохода по купленным сменам (круговая диаграмма).
 * Возвращает элемент с методом refresh() — пересобирает диаграмму по актуальному
 * стейту (после прокачки сотрудника, выдачи техники или снаряжения).
 * Если активных смен нет или их доход нулевой, блок скрывается.
 */
export function createShiftIncomeChart(): HTMLElement & { refresh: () => void } {
  const section = document.createElement('div')
  section.className = 'shift-chart'

  const title = document.createElement('h4')
  title.className = 'shift-chart-title'
  title.textContent = 'Доход по сменам'
  section.appendChild(title)

  const content = document.createElement('div')
  content.className = 'shift-chart-content'
  section.appendChild(content)

  const render = (): void => {
    const state = getState()
    const level = levelFromXp(state.xpMoney)

    const entries = calculateShiftIncomes(
      state.shifts,
      state.staffUpgrades,
      state.masterUpgrades,
      level,
    ).filter((entry) => entry.income > 0)

    content.replaceChildren()

    if (entries.length === 0) {
      section.hidden = true
      return
    }
    section.hidden = false

    const total = entries.reduce((sum, entry) => sum + entry.income, 0)

    // Диаграмма с подписью итога в центре
    const chartWrapper = document.createElement('div')
    chartWrapper.className = 'shift-chart-donut-wrapper'
    chartWrapper.appendChild(createDonut(entries, total))

    const center = document.createElement('div')
    center.className = 'shift-chart-center'

    const centerValue = document.createElement('span')
    centerValue.className = 'shift-chart-center-value'
    centerValue.textContent = formatMoney(total)
    center.appendChild(centerValue)

    const centerLabel = document.createElement('span')
    centerLabel.className = 'shift-chart-center-label'
    centerLabel.textContent = 'в секунду'
    center.appendChild(centerLabel)

    chartWrapper.appendChild(center)
    content.appendChild(chartWrapper)

    // Легенда
    const legend = document.createElement('div')
    legend.className = 'shift-chart-legend'
    for (const entry of entries) {
      legend.appendChild(createLegendRow(entry.shiftId, entry.income, total))
    }
    content.appendChild(legend)
  }

  render()

  const result = section as unknown as HTMLElement & { refresh: () => void }
  result.refresh = render
  return result
}
