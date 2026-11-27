import type { SkillId } from '../types/index.ts'
import { skills } from '../data/skills.ts'
import { BRANCH_GATES } from '../data/skillUnlocks.ts'
import {
  TIER_ANALYSIS_TEXTS,
  FINALE_TEXT,
  PATH_LABEL,
  AXIS_LABELS,
  REGIME_SPEECH,
  BUSINESS_SPEECH,
  isLightPath,
  type AxisSpeech,
} from '../data/skillAnalysis.ts'
import { chosenBranch, isFinalTier, markAnalysisShown, pendingAnalysisTier } from '../utils/skillProgress.ts'
import { getRegimeBalance, getBusinessBalance, type AxisBalance } from '../utils/skillAnalysis.ts'
import { skillLevelImages, mastersImages } from '../assets/assetLoader.ts'
import { createModal, type ModalHandle } from '../utils/modalFactory.ts'
import { resetProgress, subscribe } from '../state/state.ts'
import { playSound } from '../state/audioManager.ts'
import { ACTING_MANAGER_PROFILE } from '../data/actingManager.ts'

/** Название отдела по id */
function departmentName(skillId: SkillId): string {
  return skills.find((skill) => skill.id === skillId)?.name ?? skillId
}

/** Разрешает ключ картинки в URL: сначала маппинг, потом как есть */
function resolveImage(key: string): string {
  return skillLevelImages[key] || key
}

/** Карточка одного отдела в окне анализа */
function createAnalysisItem(skillId: SkillId, tier: number): HTMLElement | null {
  const option = chosenBranch(skillId, tier)
  if (!option) return null

  const item = document.createElement('div')
  item.className = `skill-analysis-item ${isLightPath(option.path) ? 'skill-analysis-item-light' : 'skill-analysis-item-hard'}`

  const image = document.createElement('img')
  image.className = 'skill-analysis-item-image'
  image.src = resolveImage(option.unlocksImage)
  image.alt = option.unlocksName
  image.draggable = false
  image.onerror = () => { image.style.visibility = 'hidden' }
  item.appendChild(image)

  const info = document.createElement('div')
  info.className = 'skill-analysis-item-info'

  const dept = document.createElement('div')
  dept.className = 'skill-analysis-item-dept'
  dept.textContent = `${departmentName(skillId)} · ${tier} ур. · ${PATH_LABEL[option.path]}`
  info.appendChild(dept)

  const name = document.createElement('div')
  name.className = 'skill-analysis-item-name'
  name.textContent = option.unlocksName
  info.appendChild(name)

  const description = document.createElement('div')
  description.className = 'skill-analysis-item-description'
  description.textContent = option.unlocksDescription
  info.appendChild(description)

  item.appendChild(info)

  const factor = document.createElement('div')
  factor.className = 'skill-analysis-item-factor'
  factor.textContent = `×${option.factor.toFixed(2)}`
  item.appendChild(factor)

  return item
}

/** Создаёт блок оси анализа: подписи полюсов, полосу и текст-комментарий */
function createAxisBlock(
  labelLeft: string,
  labelRight: string,
  balance: AxisBalance,
  speech: AxisSpeech,
): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'skill-analysis-axis'

  // Подписи полюсов
  const head = document.createElement('div')
  head.className = 'skill-analysis-axis-head'
  const leftLabel = document.createElement('span')
  leftLabel.className = 'skill-analysis-axis-label'
  leftLabel.textContent = labelLeft
  const rightLabel = document.createElement('span')
  rightLabel.className = 'skill-analysis-axis-label'
  rightLabel.textContent = labelRight
  head.appendChild(leftLabel)
  head.appendChild(rightLabel)
  wrap.appendChild(head)

  // Полоса и маркер
  const track = document.createElement('div')
  track.className = 'skill-analysis-axis-track'
  const fill = document.createElement('div')
  fill.className = 'skill-analysis-axis-fill'
  fill.style.setProperty('--pos', `${((balance.value + 1) / 2) * 100}%`)
  track.appendChild(fill)
  wrap.appendChild(track)

  // Счётчики
  const counts = document.createElement('div')
  counts.className = 'skill-analysis-axis-counts'
  counts.textContent = `Мягких: ${balance.light} · Жёстких: ${balance.hard}`
  wrap.appendChild(counts)

  // Текст-комментарий
  const note = document.createElement('div')
  note.className = 'skill-analysis-axis-note'
  note.textContent = speech[balance.band]
  wrap.appendChild(note)

  return wrap
}

/**
 * Окно анализа закрытого гейта разветвлений: И.О. докладывает обстановку
 * по двум осям и показывает, что выбрали отделы.
 */
export function renderSkillAnalysisModal(
  tier: number,
  onClose: () => void,
  onRestart?: () => void,
): HTMLElement {
  const gate = BRANCH_GATES.find((item) => item.tier === tier)
  const text = TIER_ANALYSIS_TEXTS[tier]
  const isFinal = isFinalTier(tier)

  const modal = document.createElement('div')
  modal.className = isFinal ? 'skill-analysis-modal skill-analysis-modal-final' : 'skill-analysis-modal'

  // ===== Шапка =====
  const header = document.createElement('div')
  header.className = 'skill-analysis-header'

  const title = document.createElement('h3')
  title.className = 'skill-analysis-title'
  title.textContent = text?.title ?? `Анализ И.О.: развилки ${tier} уровня`
  header.appendChild(title)

  if (!isFinal) {
    const closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'skill-analysis-close'
    closeBtn.textContent = '×'
    closeBtn.addEventListener('click', () => {
      playSound('click')
      onClose()
    })
    header.appendChild(closeBtn)
  }
  modal.appendChild(header)

  // ===== Тело =====
  const body = document.createElement('div')
  body.className = 'skill-analysis-body'

  // --- Блок И.О. ---
  const speaker = document.createElement('div')
  speaker.className = 'skill-analysis-speaker'

  const portrait = document.createElement('img')
  portrait.className = 'skill-analysis-portrait'
  portrait.src = mastersImages['actingAva'] ?? ''
  portrait.alt = ACTING_MANAGER_PROFILE.name
  portrait.draggable = false
  speaker.appendChild(portrait)

  const speechWrap = document.createElement('div')
  speechWrap.className = 'skill-analysis-speech'

  const speakerName = document.createElement('div')
  speakerName.className = 'skill-analysis-speaker-name'
  speakerName.textContent = ACTING_MANAGER_PROFILE.name
  speechWrap.appendChild(speakerName)

  const speakerRole = document.createElement('div')
  speakerRole.className = 'skill-analysis-speaker-role'
  speakerRole.textContent = ACTING_MANAGER_PROFILE.role
  speechWrap.appendChild(speakerRole)

  const intro = document.createElement('p')
  intro.className = 'skill-analysis-intro'
  intro.textContent = text?.intro ?? ''
  speechWrap.appendChild(intro)

  speaker.appendChild(speechWrap)
  body.appendChild(speaker)

  // --- Оси ---
  const regime = getRegimeBalance()
  const business = getBusinessBalance()

  const axesWrap = document.createElement('div')
  axesWrap.className = 'skill-analysis-axes'

  axesWrap.appendChild(
    createAxisBlock(
      AXIS_LABELS.regime.left,
      AXIS_LABELS.regime.right,
      regime,
      REGIME_SPEECH,
    ),
  )

  axesWrap.appendChild(
    createAxisBlock(
      AXIS_LABELS.business.left,
      AXIS_LABELS.business.right,
      business,
      BUSINESS_SPEECH,
    ),
  )

  body.appendChild(axesWrap)

  // --- Список выборов отделов ---
  const list = document.createElement('div')
  list.className = 'skill-analysis-list'

  let lightCount = 0
  let factorTotal = 1

  for (const skillId of gate?.skillIds ?? []) {
    const item = createAnalysisItem(skillId, tier)
    if (!item) continue
    list.appendChild(item)
    const option = chosenBranch(skillId, tier)
    if (option) {
      if (isLightPath(option.path)) lightCount++
      factorTotal *= option.factor
    }
  }

  body.appendChild(list)

  // --- Итог ---
  const summary = document.createElement('div')
  summary.className = 'skill-analysis-summary'

  const factorRow = document.createElement('div')
  factorRow.className = 'skill-analysis-factor'
  factorRow.textContent = `Совокупный множитель развилки: ×${factorTotal.toFixed(2)}`
  summary.appendChild(factorRow)

  const total = gate?.skillIds.length ?? 0
  const hardCount = total - lightCount
  const course = lightCount === total ? 'light' : hardCount === total ? 'dark' : 'mixed'

  const verdict = document.createElement('p')
  verdict.className = 'skill-analysis-verdict'
  verdict.textContent = text ? text[course] : ''
  summary.appendChild(verdict)

  if (isFinal) {
    const finale = document.createElement('p')
    finale.className = 'skill-analysis-finale'
    finale.textContent = FINALE_TEXT
    summary.appendChild(finale)
  }

  body.appendChild(summary)
  modal.appendChild(body)

  // ===== Кнопки =====
  const actions = document.createElement('div')
  actions.className = 'skill-analysis-actions'

  const continueBtn = document.createElement('button')
  continueBtn.type = 'button'
  continueBtn.className = 'skill-analysis-btn skill-analysis-btn-primary'
  continueBtn.textContent = isFinal ? 'Продолжить' : 'Принять'
  continueBtn.addEventListener('click', () => {
    playSound('click')
    onClose()
  })
  actions.appendChild(continueBtn)

  if (isFinal && onRestart) {
    const restartBtn = document.createElement('button')
    restartBtn.type = 'button'
    restartBtn.className = 'skill-analysis-btn skill-analysis-btn-restart'
    restartBtn.textContent = 'Начать заново'
    restartBtn.addEventListener('click', () => {
      playSound('buy')
      resetProgress()
      onClose()
      onRestart()
    })
    actions.appendChild(restartBtn)
  }

  modal.appendChild(actions)
  return modal
}

/** Открытое сейчас окно анализа (одно — модалки не складываются в стопку) */
let currentHandle: ModalHandle | null = null

/** Признак того, что окно только что создаётся: отсекает рекурсивный вызов из notify */
let opening = false

/**
 * Следит за состоянием и показывает окна анализа по закрытым гейтам разветвлений.
 * Окно появляется, когда все развилки уровня выбраны во всех отделах,
 * и показывается один раз — факт записи хранится в стейте.
 * @returns функция отписки при выходе из игрового экрана
 */
export function startSkillAnalysisWatcher(container: HTMLElement, onRestart: () => void): () => void {
  let stopped = false

  const check = (): void => {
    if (stopped || currentHandle || opening) return

    const tier = pendingAnalysisTier()
    if (tier === null) return

    opening = true
    markAnalysisShown(tier)
    opening = false

    currentHandle = createModal(container, {
      overlayClass: 'skill-analysis-overlay',
      closeOnOverlayClick: false,
      renderContent: (onClose) => renderSkillAnalysisModal(tier, onClose, onRestart),
      onClose: () => {
        currentHandle = null
        check()
      },
    })
  }

  check()

  const unsubscribe = subscribe(check)

  return () => {
    stopped = true
    unsubscribe()
    currentHandle?.close()
    currentHandle = null
  }
}
