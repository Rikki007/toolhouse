import type { SkillId } from '../types/index.ts'
import { skills } from '../data/skills.ts'
import { BRANCH_GATES } from '../data/skillUnlocks.ts'
import { TIER_ANALYSIS_TEXTS, FINALE_TEXT, PATH_LABEL, isLightPath } from '../data/skillAnalysis.ts'
import { chosenBranch, isFinalTier, markAnalysisShown, pendingAnalysisTier } from '../utils/skillProgress.ts'
import { skillLevelImages } from '../assets/assetLoader.ts'
import { createModal, type ModalHandle } from '../utils/modalFactory.ts'
import { resetProgress, subscribe } from '../state/state.ts'
import { playSound } from '../state/audioManager.ts'

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

/**
 * Окно анализа закрытого гейта разветвлений: что выбрал каждый отдел
 * и к какому курсу это приводит. Финальный уровень (10) — концовка игры
 * с кнопками «Продолжить» и «Начать заново».
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
  title.textContent = text?.title ?? `Анализ: развилки ${tier} уровня`
  header.appendChild(title)

  // В финальном окне нет крестика: игрок должен выбрать один из двух вариантов
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

  const intro = document.createElement('p')
  intro.className = 'skill-analysis-intro'
  intro.textContent = text?.intro ?? ''
  body.appendChild(intro)

  // Список выборов отделов + подсчёт мягких/жёстких решений
  const list = document.createElement('div')
  list.className = 'skill-analysis-list'

  let lightCount = 0
  let factorTotal = 1

  for (const skillId of gate?.skillIds ?? []) {
    const option = chosenBranch(skillId, tier)
    const item = createAnalysisItem(skillId, tier)
    if (!item) continue
    list.appendChild(item)
    if (option) {
      if (isLightPath(option.path)) lightCount++
      factorTotal *= option.factor
    }
  }

  body.appendChild(list)

  const total = gate?.skillIds.length ?? 0
  const hardCount = total - lightCount
  const course = lightCount === total ? 'light' : hardCount === total ? 'dark' : 'mixed'

  // ===== Итог =====
  const summary = document.createElement('div')
  summary.className = 'skill-analysis-summary'

  const counters = document.createElement('div')
  counters.className = 'skill-analysis-counters'
  counters.innerHTML =
    `<span class="skill-analysis-counter skill-analysis-counter-light">Мягких решений: ${lightCount}</span>` +
    `<span class="skill-analysis-counter skill-analysis-counter-hard">Жёстких: ${hardCount}</span>`
  summary.appendChild(counters)

  const factorRow = document.createElement('div')
  factorRow.className = 'skill-analysis-factor'
  factorRow.textContent = `Совокупный множитель развилки: ×${factorTotal.toFixed(2)}`
  summary.appendChild(factorRow)

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
      // Сначала сброс: подписка на стейт не должна открыть следующее окно
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

    // Помечаем анализ показанным до создания окна: updateState внутри
    // markAnalysisShown вызывает notify и повторную проверку
    opening = true
    markAnalysisShown(tier)
    opening = false

    currentHandle = createModal(container, {
      overlayClass: 'skill-analysis-overlay',
      closeOnOverlayClick: false,
      renderContent: (onClose) => renderSkillAnalysisModal(tier, onClose, onRestart),
      onClose: () => {
        currentHandle = null
        // Если накопились незакрытые гейты — показываем следующий анализ
        check()
      },
    })
  }

  // Первая проверка: гейт мог быть закрыт в предыдущей сессии
  check()

  const unsubscribe = subscribe(check)

  return () => {
    stopped = true
    unsubscribe()
    currentHandle?.close()
    currentHandle = null
  }
}
