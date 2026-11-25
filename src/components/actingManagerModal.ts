import type { ActingBranch, ActingBranchId } from '../types/index.ts'
import { createModal } from '../utils/modalFactory.ts'
import { playSound } from '../state/audioManager.ts'
import { formatMoney, formatNumber, pluralRu } from '../utils/format.ts'
import { ACTING_BRANCHES, ACTING_MANAGER_PROFILE } from '../data/actingManager.ts'
import {
  getActingAvailablePoints,
  getActingBranchEffectText,
  getActingBranchIconSrc,
  getActingBranchLevel,
  getActingIncomePerHour,
  getActingLevelProgress,
  getActingSpentPoints,
  getActingTokensPerHourApproxText,
} from '../utils/actingManager.ts'
import { actingParamImages, mastersImages } from '../assets/assetLoader.ts'
import { getState, markActingLevelSeen } from '../state/state.ts'
import { openActingSkillModal } from './actingSkillModal.ts'

/**
 * Портрет И.О. (регистрируется в assetLoader).
 * Читаем карту в момент рендера: initEquipmentImages вызывается позже импорта модуля.
 */
function getActingPortraitSrc(): string {
  return mastersImages['acting'] ?? ''
}

/** Круглая иконка И.О. для корня дерева */
function getActingAvatarSrc(): string {
  return mastersImages['actingAva'] ?? mastersImages['acting'] ?? ''
}

/** Полоса опыта: заполнение по доле прогресса */
function createXpBar(progress: number): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'acting-xp-bar'

  const fill = document.createElement('div')
  fill.className = 'acting-xp-fill'
  fill.style.width = `${Math.round(progress * 100)}%`
  bar.appendChild(fill)

  return bar
}

/** Строка «иконка + название + значение» для карточки параметров И.О. */
function createParamLabel(iconSrc: string, label: string, value: string): HTMLElement {
  const row = document.createElement('div')
  row.className = 'acting-income-line'

  const labelEl = document.createElement('span')
  labelEl.className = 'acting-income-label'

  if (iconSrc) {
    const icon = document.createElement('img')
    icon.src = iconSrc
    icon.alt = ''
    icon.draggable = false
    labelEl.appendChild(icon)
  }

  const text = document.createElement('span')
  text.textContent = label
  labelEl.appendChild(text)
  row.appendChild(labelEl)

  const valueEl = document.createElement('span')
  valueEl.className = 'acting-income-value'
  valueEl.textContent = value
  row.appendChild(valueEl)

  return row
}

/**
 * Круговая диаграмма аналитики дохода И.О.
 * Сравнивает доход за час, когда игрок в игре, и доход за час в режиме И.О.
 */
const CHART_RADIUS = 42
const CHART_STROKE = 16
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS
const CHART_COLOR_ONLINE = '#a855f7'
const CHART_COLOR_ACTING = '#4ade80'

/** Доля в процентах для подписи легенды */
function formatChartPercent(part: number, total: number): string {
  const percent = total > 0 ? (part / total) * 100 : 0
  if (percent > 0 && percent < 1) return '<1%'
  return `${Math.round(percent)}%`
}

/** SVG-кольцо с двумя секторами: доход в игре и доход И.О. */
function createIncomeDonut(onlineIncome: number, actingIncome: number): SVGSVGElement {
  const total = onlineIncome + actingIncome

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('class', 'acting-donut')
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', 'Соотношение дохода в игре и дохода И.О.')

  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  track.setAttribute('cx', '50')
  track.setAttribute('cy', '50')
  track.setAttribute('r', String(CHART_RADIUS))
  track.setAttribute('fill', 'none')
  track.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)')
  track.setAttribute('stroke-width', String(CHART_STROKE))
  svg.appendChild(track)

  const segments: Array<{ value: number; color: string }> = [
    { value: onlineIncome, color: CHART_COLOR_ONLINE },
    { value: actingIncome, color: CHART_COLOR_ACTING },
  ]

  let offset = 0
  for (const segment of segments) {
    const share = total > 0 ? segment.value / total : 0
    const length = share * CHART_CIRCUMFERENCE
    const gap = length > 0 ? Math.min(2, length / 2) : 0

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', '50')
    circle.setAttribute('cy', '50')
    circle.setAttribute('r', String(CHART_RADIUS))
    circle.setAttribute('fill', 'none')
    circle.setAttribute('stroke', segment.color)
    circle.setAttribute('stroke-width', String(CHART_STROKE))
    circle.setAttribute('stroke-linecap', 'butt')
    circle.setAttribute('stroke-dasharray', `${Math.max(0, length - gap)} ${CHART_CIRCUMFERENCE}`)
    circle.setAttribute('stroke-dashoffset', String(-offset))
    circle.setAttribute('transform', 'rotate(-90 50 50)')
    svg.appendChild(circle)

    offset += length
  }

  return svg
}

/** Строка легенды диаграммы дохода */
function createDonutLegendRow(
  color: string,
  label: string,
  value: string,
  percent: string,
): HTMLElement {
  const row = document.createElement('div')
  row.className = 'acting-donut-legend-row'

  const swatch = document.createElement('span')
  swatch.className = 'acting-donut-legend-color'
  swatch.style.background = color
  row.appendChild(swatch)

  const name = document.createElement('span')
  name.className = 'acting-donut-legend-name'
  name.textContent = label
  row.appendChild(name)

  const valueEl = document.createElement('span')
  valueEl.className = 'acting-donut-legend-value'
  valueEl.textContent = value
  row.appendChild(valueEl)

  const percentEl = document.createElement('span')
  percentEl.className = 'acting-donut-legend-percent'
  percentEl.textContent = percent
  row.appendChild(percentEl)

  return row
}

/** Карточка аналитики: круговая диаграмма дохода в игре и дохода И.О. */
function createIncomeChartCard(): HTMLElement {
  const actingIncome = getActingIncomePerHour()
  const onlineIncome = getState().passiveIncomePerSecond * 3600
  const total = onlineIncome + actingIncome

  const card = document.createElement('div')
  card.className = 'acting-card acting-chart-card'

  const title = document.createElement('div')
  title.className = 'acting-card-title'
  title.textContent = 'Аналитика дохода'
  card.appendChild(title)

  const content = document.createElement('div')
  content.className = 'acting-donut-content'

  const wrapper = document.createElement('div')
  wrapper.className = 'acting-donut-wrapper'
  wrapper.appendChild(createIncomeDonut(onlineIncome, actingIncome))

  const center = document.createElement('div')
  center.className = 'acting-donut-center'

  const centerValue = document.createElement('span')
  centerValue.className = 'acting-donut-center-value'
  centerValue.textContent = formatMoney(actingIncome)
  center.appendChild(centerValue)

  const centerLabel = document.createElement('span')
  centerLabel.className = 'acting-donut-center-label'
  centerLabel.textContent = 'И.О. / час'
  center.appendChild(centerLabel)

  wrapper.appendChild(center)
  content.appendChild(wrapper)

  const legend = document.createElement('div')
  legend.className = 'acting-donut-legend'
  legend.appendChild(
    createDonutLegendRow(
      CHART_COLOR_ONLINE,
      'Вы',
      `${formatMoney(onlineIncome)}/ч`,
      formatChartPercent(onlineIncome, total),
    ),
  )
  legend.appendChild(
    createDonutLegendRow(
      CHART_COLOR_ACTING,
      'И.О.',
      `${formatMoney(actingIncome)}/ч`,
      formatChartPercent(actingIncome, total),
    ),
  )
  content.appendChild(legend)

  card.appendChild(content)
  return card
}

/** Блок с портретом, уровнем и доходами И.О. */
function createHero(): HTMLElement {
  const { level, xp, nextXp, progress } = getActingLevelProgress()

  const hero = document.createElement('section')
  hero.className = 'acting-hero'

  const portraitBlock = document.createElement('div')
  portraitBlock.className = 'acting-portrait-block'

  const portraitWrap = document.createElement('div')
  portraitWrap.className = 'acting-portrait-wrap'
  const portraitSrc = getActingPortraitSrc()
  if (portraitSrc) {
    const portrait = document.createElement('img')
    portrait.className = 'acting-portrait'
    portrait.src = portraitSrc
    portrait.alt = 'И. О.'
    portrait.draggable = false
    portraitWrap.appendChild(portrait)
  }
  portraitBlock.appendChild(portraitWrap)
  hero.appendChild(portraitBlock)

  const cards = document.createElement('div')
  cards.className = 'acting-hero-cards'

  // Уровень
  const levelCard = document.createElement('div')
  levelCard.className = 'acting-card acting-level-card'

  const levelTitle = document.createElement('div')
  levelTitle.className = 'acting-card-title'
  levelTitle.textContent = 'Уровень И.О.'
  levelCard.appendChild(levelTitle)

  const levelValue = document.createElement('div')
  levelValue.className = 'acting-level-value'
  levelValue.textContent = String(level)
  levelCard.appendChild(levelValue)

  levelCard.appendChild(createXpBar(progress))

  const xpText = document.createElement('div')
  xpText.className = 'acting-xp-text'
  xpText.textContent = `${formatNumber(xp)} / ${formatNumber(nextXp)} XP`
  levelCard.appendChild(xpText)

  cards.appendChild(levelCard)

  // Доходы И.О.
  const incomeCard = document.createElement('div')
  incomeCard.className = 'acting-card acting-income-card'

  const incomeTitle = document.createElement('div')
  incomeTitle.className = 'acting-card-title'
  incomeTitle.textContent = 'Доход И.О.'
  incomeCard.appendChild(incomeTitle)

  const incomeList = document.createElement('div')
  incomeList.className = 'acting-income-list'

  incomeList.appendChild(
    createParamLabel(actingParamImages['performance'] ?? '', 'Производительность',
      getActingBranchEffectText('performance', getActingBranchLevel('performance'))),
  )
  incomeList.appendChild(
    createParamLabel(actingParamImages['duration'] ?? '', 'Продолжительность',
      getActingBranchEffectText('duration', getActingBranchLevel('duration'))),
  )
  incomeList.appendChild(
    createParamLabel(actingParamImages['tokens'] ?? '', 'Сбор жетонов', getActingTokensPerHourApproxText()),
  )

  incomeCard.appendChild(incomeList)
  cards.appendChild(incomeCard)
  cards.appendChild(createIncomeChartCard())
  hero.appendChild(cards)

  return hero
}

/**
 * Layout дерева навыков: координаты центров узлов и параметры соединений.
 * Все значения в px в системе координат viewBox графа (TREE_W × TREE_H).
 */
const TREE_W = 360
const TREE_H = 400
const ROOT_R = 44
const SKILL_R = 38
const LINE_GAP = 8

type SkillLayout = {
  x: number
  y: number
  floatDelay: number
}

const ACTING_SKILL_LAYOUT: Record<ActingBranchId, SkillLayout> = {
  performance: { x: 72, y: 150, floatDelay: 0 },
  duration: { x: 288, y: 230, floatDelay: -2.6 },
  tokens: { x: 108, y: 340, floatDelay: -5.2 },
}

const ROOT_POS = { x: 180, y: 44 }

/** Доля, на которую линия укорачивается с каждой стороны (суммарно −15%) */
const LINE_SHORTEN = 0.075

/** Одиночный отрезок, укороченный с двух сторон на радиус + зазор + долю длины */
function makeConnector(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromR: number,
  toR: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const baseIn1 = fromR + LINE_GAP
  const baseIn2 = toR + LINE_GAP
  // Дополнительное укорочение: по 7.5% длины видимой линии с каждой стороны
  const extra = Math.max(0, len - baseIn1 - baseIn2) * LINE_SHORTEN
  const in1 = baseIn1 + extra
  const in2 = baseIn2 + extra
  return {
    x1: from.x + ux * in1,
    y1: from.y + uy * in1,
    x2: to.x - ux * in2,
    y2: to.y - uy * in2,
  }
}

/** SVG с линиями между узлами дерева (не касаются иконок) */
function createTreeLines(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('viewBox', `0 0 ${TREE_W} ${TREE_H}`)
  svg.setAttribute('class', 'acting-tree-lines')
  svg.setAttribute('aria-hidden', 'true')

  const edges: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; fromR: number; toR: number }> = [
    { from: ROOT_POS, to: ACTING_SKILL_LAYOUT.performance, fromR: ROOT_R, toR: SKILL_R },
    {
      from: ACTING_SKILL_LAYOUT.performance,
      to: ACTING_SKILL_LAYOUT.duration,
      fromR: SKILL_R,
      toR: SKILL_R,
    },
    {
      from: ACTING_SKILL_LAYOUT.duration,
      to: ACTING_SKILL_LAYOUT.tokens,
      fromR: SKILL_R,
      toR: SKILL_R,
    },
  ]

  for (const edge of edges) {
    const seg = makeConnector(edge.from, edge.to, edge.fromR, edge.toR)
    const line = document.createElementNS(ns, 'line')
    line.setAttribute('x1', String(seg.x1))
    line.setAttribute('y1', String(seg.y1))
    line.setAttribute('x2', String(seg.x2))
    line.setAttribute('y2', String(seg.y2))
    line.setAttribute('class', 'acting-tree-line')
    svg.appendChild(line)
  }

  return svg
}

/** Кнопка навыка в дереве: круглая иконка с плавным «плаванием» */
function createSkillNode(
  branch: ActingBranch,
  onOpen: (branchId: ActingBranchId) => void,
): HTMLButtonElement {
  const layout = ACTING_SKILL_LAYOUT[branch.id]

  const node = document.createElement('button')
  node.type = 'button'
  node.className = `acting-skill acting-skill-${branch.color}`
  node.style.left = `${layout.x - SKILL_R}px`
  node.style.top = `${layout.y - SKILL_R}px`

  const iconWrap = document.createElement('span')
  iconWrap.className = 'acting-skill-icon'
  iconWrap.style.animationDelay = `${layout.floatDelay}s`

  const iconSrc = getActingBranchIconSrc(branch)
  if (iconSrc) {
    const icon = document.createElement('img')
    icon.src = iconSrc
    icon.alt = branch.label
    icon.draggable = false
    iconWrap.appendChild(icon)
  }
  node.appendChild(iconWrap)

  node.addEventListener('click', () => {
    playSound('click')
    onOpen(branch.id)
  })

  return node
}

/** Строка «параметр — значение» в карточке профиля */
function createProfileStatRow(label: string, value: string): HTMLElement {
  const row = document.createElement('div')
  row.className = 'acting-skill-stat'

  const labelEl = document.createElement('span')
  labelEl.textContent = label
  row.appendChild(labelEl)

  const valueEl = document.createElement('b')
  valueEl.textContent = value
  row.appendChild(valueEl)

  return row
}

/**
 * Карточка профиля И.О.: личные данные и сводка прогресса.
 * @param onOpenSkills — вызывается по кнопке «К навыкам» (закрыть профиль и показать дерево)
 */
function openActingProfileModal(container: HTMLElement, onOpenSkills: () => void): void {
  createModal(container, {
    overlayClass: 'acting-profile-overlay',
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'acting-profile-modal'

      const header = document.createElement('div')
      header.className = 'acting-skill-header'

      const title = document.createElement('h3')
      title.className = 'acting-skill-title'
      title.textContent = 'Профиль И.О.'
      header.appendChild(title)

      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.className = 'modal-close-btn acting-skill-close'
      closeBtn.textContent = '×'
      closeBtn.setAttribute('aria-label', 'Закрыть')
      closeBtn.addEventListener('click', () => {
        playSound('click')
        onClose()
      })
      header.appendChild(closeBtn)

      modal.appendChild(header)

      const body = document.createElement('div')
      body.className = 'acting-profile-body'

      const avatarSrc = getActingAvatarSrc()
      if (avatarSrc) {
        const avatar = document.createElement('img')
        avatar.className = 'acting-profile-avatar'
        avatar.src = avatarSrc
        avatar.alt = ACTING_MANAGER_PROFILE.name
        avatar.draggable = false
        body.appendChild(avatar)
      }

      const name = document.createElement('h4')
      name.className = 'acting-profile-name'
      name.textContent = ACTING_MANAGER_PROFILE.name
      body.appendChild(name)

      const role = document.createElement('div')
      role.className = 'acting-profile-role'
      role.textContent = ACTING_MANAGER_PROFILE.role
      body.appendChild(role)

      const bio = document.createElement('p')
      bio.className = 'acting-profile-bio'
      bio.textContent = ACTING_MANAGER_PROFILE.bio
      body.appendChild(bio)

      const quote = document.createElement('p')
      quote.className = 'acting-profile-quote'
      quote.textContent = `«${ACTING_MANAGER_PROFILE.quote}»`
      body.appendChild(quote)

      const { level, xp, nextXp } = getActingLevelProgress()
      const acting = getState().actingManager
      const available = getActingAvailablePoints()
      const spent = getActingSpentPoints()
      const collected = acting.tokensCollected ?? 0

      const stats = document.createElement('div')
      stats.className = 'acting-skill-stats'
      stats.appendChild(createProfileStatRow('Уровень', String(level)))
      stats.appendChild(
        createProfileStatRow('Опыт', `${formatMoney(xp)} / ${formatMoney(nextXp)} XP`),
      )
      stats.appendChild(
        createProfileStatRow('Заработано', formatMoney(acting.xp)),
      )
      stats.appendChild(
        createProfileStatRow(
          'Собрано жетонов',
          `${formatNumber(collected)} ${pluralRu(collected, ['жетон', 'жетона', 'жетонов'])}`,
        ),
      )
      stats.appendChild(
        createProfileStatRow('Очки навыков', `${spent} / ${spent + available}`),
      )
      body.appendChild(stats)

      const skillsBtn = document.createElement('button')
      skillsBtn.type = 'button'
      skillsBtn.className = 'acting-profile-skills-btn'
      skillsBtn.textContent =
        available > 0 ? `К навыкам · доступно очков: ${available}` : 'К навыкам'
      skillsBtn.addEventListener('click', () => {
        playSound('click')
        onClose()
        onOpenSkills()
      })
      body.appendChild(skillsBtn)

      modal.appendChild(body)
      return modal
    },
  })
}

/** Дерево развития: И.О. и три навыка, соединённые линиями */
function createTree(
  onOpenSkill: (branchId: ActingBranchId) => void,
  onOpenProfile: () => void,
): HTMLElement {
  const section = document.createElement('section')
  section.className = 'acting-tree'

  const title = document.createElement('h3')
  title.className = 'acting-tree-title'
  title.textContent = 'Навыки'
  section.appendChild(title)

  const graph = document.createElement('div')
  graph.className = 'acting-tree-graph'
  graph.appendChild(createTreeLines())

  const root = document.createElement('div')
  root.className = 'acting-tree-root'
  root.style.left = `${ROOT_POS.x - ROOT_R}px`
  root.style.top = `${ROOT_POS.y - ROOT_R}px`

  const avatarBtn = document.createElement('button')
  avatarBtn.type = 'button'
  avatarBtn.className = 'acting-tree-root-btn'
  avatarBtn.setAttribute('aria-label', 'Профиль И.О.')

  const avatarSrc = getActingAvatarSrc()
  if (avatarSrc) {
    const avatar = document.createElement('img')
    avatar.className = 'acting-tree-root-avatar'
    avatar.src = avatarSrc
    avatar.alt = ACTING_MANAGER_PROFILE.name
    avatar.draggable = false
    avatarBtn.appendChild(avatar)
  }

  // Бейдж доступных очков навыков на аватаре
  const availablePoints = getActingAvailablePoints()
  if (availablePoints > 0) {
    const badge = document.createElement('span')
    badge.className = 'acting-tree-root-badge'
    badge.textContent = String(availablePoints)
    badge.title = 'Доступны очки навыков'
    avatarBtn.appendChild(badge)
  }

  avatarBtn.addEventListener('click', () => {
    playSound('click')
    onOpenProfile()
  })
  root.appendChild(avatarBtn)

  graph.appendChild(root)

  for (const branch of ACTING_BRANCHES) {
    graph.appendChild(createSkillNode(branch, onOpenSkill))
  }

  section.appendChild(graph)
  return section
}

/** Полноэкранное содержимое модалки И.О. */
function renderActingManagerModal(
  container: HTMLElement,
  onClose: () => void,
): HTMLElement {
  const modal = document.createElement('div')
  modal.className = 'acting-modal'

  const header = document.createElement('div')
  header.className = 'acting-modal-header'

  const title = document.createElement('h2')
  title.className = 'acting-modal-title'
  title.textContent = 'И. О.'
  header.appendChild(title)

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'modal-close-btn acting-modal-close'
  closeBtn.textContent = '×'
  closeBtn.setAttribute('aria-label', 'Закрыть')
  closeBtn.addEventListener('click', () => {
    playSound('click')
    onClose()
  })
  header.appendChild(closeBtn)

  modal.appendChild(header)

  const body = document.createElement('div')
  body.className = 'acting-modal-body'

  const openSkill = (branchId: ActingBranchId): void => {
    openActingSkillModal(container, branchId, renderBody)
  }

  /** Профиль И.О.; кнопка «К навыкам» прокручивает к дереву навыков */
  const openProfile = (): void => {
    openActingProfileModal(container, () => {
      body.querySelector('.acting-tree')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  /** Перерисовывает тело модалки: после улучшения навыка значения меняются */
  function renderBody(): void {
    body.replaceChildren(createHero(), createTree(openSkill, openProfile))
  }

  renderBody()
  modal.appendChild(body)
  return modal
}

let actingModalHandle: ReturnType<typeof createModal> | null = null

/** Открывает (или закрывает, если уже открыта) модалку И.О. */
export function openActingManagerModal(container: HTMLElement): void {
  if (actingModalHandle) {
    actingModalHandle.close()
    actingModalHandle = null
    return
  }

  actingModalHandle = createModal(container, {
    overlayClass: 'acting-modal-overlay',
    renderContent: (onClose) => renderActingManagerModal(container, onClose),
    onClose: () => {
      actingModalHandle = null
    },
  })

  // Игрок увидел текущий уровень — гасим индикатор на кнопке
  markActingLevelSeen()
}
