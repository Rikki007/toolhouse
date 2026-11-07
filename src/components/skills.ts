import type { Skill, SkillLevel, SkillPath, BranchChoiceKey, SkillPlainLevel } from '../types/index.ts'
import type { AppState } from '../state/state.ts'
import { skills, skillIcons } from '../data/skills.ts'
import { updateStateWithIncome } from '../state/shiftsStore.ts'
import { getState, subscribe } from '../state/state.ts'
import { skillLevelImages, skillImages, initSkillsImages } from '../assets/assetLoader.ts'
import { activeGate, isBranchTierChosen, isNodeUnlocked } from '../utils/skillProgress.ts'
import { levelFromXp, nextLevelProgress } from '../data/playerLevels.ts'
import { playSound } from '../state/audioManager.ts'
import { formatMoney } from '../utils/format.ts'
import coinImage from '../assets/coin/1.png'

// Инициализируем маппинг картинок
initSkillsImages()

// ============================================================
// Утилиты для работы с ветвлениями
// ============================================================

/** Ключ выбора ветки для уровня */
function branchChoiceKey(skillId: Skill['id'], level: number): BranchChoiceKey {
  return `${skillId}-${level}`
}

/** Куплен ли уже вариант ветки на данном уровне */
function isBranchChosen(skillId: Skill['id'], level: number, path: SkillPath): boolean {
  return getState().branchChoices[branchChoiceKey(skillId, level)] === path
}

/** Заблокирован ли альтернативный вариант ветки */
function isBranchLocked(skillId: Skill['id'], level: number, path: SkillPath): boolean {
  const chosen = getState().branchChoices[branchChoiceKey(skillId, level)]
  return chosen !== undefined && chosen !== path
}

/** Доступен ли уровень для покупки */
function isLevelAvailable(skillId: Skill['id'], level: number): boolean {
  return getState().skills[skillId] === level - 1
}

/** Доступен ли отдел по уровню игрока (открывается первый узел) */
function isDepartmentUnlocked(skillId: Skill['id']): boolean {
  return isNodeUnlocked(skillId, 1)
}

/** Есть ли в отделе хотя бы один доступный для прокачки навык */
function hasAvailableSkill(skillId: Skill['id']): boolean {
  const skill = skills.find(s => s.id === skillId)
  if (!skill) return false
  const state = getState()
  const currentLevel = state.skills[skillId]
  
  for (const level of skill.levels) {
    if (level.level === currentLevel + 1 && isNodeUnlocked(skillId, level.level)) {
      return true
    }
  }
  return false
}

/** Статус узла дерева */
type NodeStatus = 'purchased' | 'available' | 'locked'

/**
 * Применяет статус к уже созданному узлу.
 * Используется и при первой отрисовке, и при обновлении дерева по подписке
 * на стейт — чтобы не пересоздавать DOM и не перезапускать анимацию появления.
 */
function applyNodeStatus(node: HTMLElement, status: NodeStatus): void {
  node.classList.remove('skill-node-purchased', 'skill-node-available', 'skill-node-locked')
  node.classList.add(`skill-node-${status}`)

  const indicator = node.querySelector('.skill-node-indicator')
  if (status === 'available' && !indicator) {
    const created = document.createElement('div')
    created.className = 'skill-node-indicator'
    node.appendChild(created)
  } else if (status !== 'available' && indicator) {
    indicator.remove()
  }

  const lock = node.querySelector('.skill-node-lock')
  if (status === 'locked' && !lock) {
    const created = document.createElement('div')
    created.className = 'skill-node-lock'
    created.textContent = '🔒'
    node.appendChild(created)
  } else if (status !== 'locked' && lock) {
    lock.remove()
  }
}

// ============================================================
// Модальное окно уровня
// ============================================================

/**
 * Строка стата модалки навыка: «Метка: значение».
 * Для стоимости передаётся coinSrc — тогда вместо текста значения ставится картинка монетки.
 */
function createSkillStat(label: string, value: string, coinSrc?: string): HTMLElement {
  const row = document.createElement('div')
  const labelEl = document.createElement('span')
  labelEl.className = 'skill-modal-label'
  labelEl.textContent = `${label}:`
  row.appendChild(labelEl)

  const valueEl = document.createElement('span')
  valueEl.className = 'skill-modal-value'
  valueEl.textContent = value

  if (coinSrc) {
    const coin = document.createElement('img')
    coin.className = 'skill-modal-coin'
    coin.src = coinSrc
    coin.alt = '$'
    valueEl.appendChild(coin)
  }

  row.appendChild(valueEl)
  return row
}

/**
 * Создаёт кнопку покупки навыка с реактивным disabled.
 * Кнопка неактивна, пока денег не хватает; включается автоматически,
 * как только баланс позволяет (учитывает пассивный доход).
 * При покупке — звук buy; при отказе — message.
 * Подписка на стейт снимается через cleanups.
 */
function createBuyButton(
  cost: number,
  buy: () => boolean,
  cleanups: Array<() => void>,
  onClose: () => void,
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'skill-modal-buy-btn'
  btn.textContent = 'Изучить'

  const sync = (): void => {
    btn.disabled = getState().money < cost
  }

  sync()
  const unsubscribe = subscribe(sync)
  cleanups.push(unsubscribe)

  btn.addEventListener('click', () => {
    if (buy()) {
      playSound('buy')
      onClose()
    } else {
      playSound('message')
    }
  })

  return btn
}

function showLevelModal(skillId: Skill['id'], level: SkillPlainLevel): void {
  const state = getState()
  const isMaxed = state.skills[skillId] >= level.level
  const isAvailable = state.skills[skillId] === level.level - 1

  // Очистки, которые нужно выполнить при закрытии модалки (отписка от стейта)
  const cleanups: Array<() => void> = []

  const modal = document.createElement('div')
  modal.className = 'skill-modal'

  const overlay = document.createElement('div')
  overlay.className = 'skill-modal-overlay'

  const content = document.createElement('div')
  content.className = 'skill-modal-content'

  // Заголовок
  const header = document.createElement('div')
  header.className = 'skill-modal-header'
  const title = document.createElement('h3')
  title.textContent = level.unlocksName
  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'skill-modal-close'
  closeBtn.textContent = '×'
  header.appendChild(title)
  header.appendChild(closeBtn)
  content.appendChild(header)

  // Тело
  const body = document.createElement('div')
  body.className = 'skill-modal-body'

  // Картинка
  const img = document.createElement('img')
  img.src = resolveSkillImage(level.unlocksImage)
  img.alt = level.unlocksName
  img.className = 'skill-modal-image'
  body.appendChild(img)

  // Описание
  const desc = document.createElement('p')
  desc.className = 'skill-modal-description'
  desc.textContent = level.unlocksDescription
  body.appendChild(desc)

  // Статы
  const stats = document.createElement('div')
  stats.className = 'skill-modal-stats'

  const factorStat = document.createElement('div')
  factorStat.innerHTML = `<span class="skill-modal-label">Factor:</span><span class="skill-modal-value">×${level.factor.toFixed(2)}</span>`
  stats.appendChild(factorStat)

  if (!isMaxed) {
    stats.appendChild(createSkillStat('Стоимость', formatMoney(level.cost), coinImage))
  }
  body.appendChild(stats)

  // Кнопка покупки
  if (isAvailable) {
    body.appendChild(
      createBuyButton(
        level.cost,
        () => purchasePlainLevel(skillId, level),
        cleanups,
        () => closeModal(),
      ),
    )
  }

  content.appendChild(body)
  modal.appendChild(overlay)
  modal.appendChild(content)
  document.body.appendChild(modal)

  const closeModal = () => {
    for (const cleanup of cleanups) cleanup()
    modal.remove()
  }
  closeBtn.addEventListener('click', () => {
    playSound('click')
    closeModal()
  })
  overlay.addEventListener('click', closeModal)
}

// ============================================================
// Модальное окно варианта ветки
// ============================================================

function showBranchOptionModal(
  skillId: Skill['id'],
  level: SkillLevel,
  option: { path: SkillPath; cost: number; factor: number; unlocksName: string; unlocksDescription: string; unlocksImage: string }
): void {
  const state = getState()
  const chosen = isBranchChosen(skillId, level.level, option.path)
  const locked = isBranchLocked(skillId, level.level, option.path)
  const isMaxed = state.skills[skillId] >= level.level
  const isAvailable = isLevelAvailable(skillId, level.level) && !locked && !chosen

  // Очистки, которые нужно выполнить при закрытии модалки (отписка от стейта)
  const cleanups: Array<() => void> = []

  const modal = document.createElement('div')
  modal.className = 'skill-modal'

  const overlay = document.createElement('div')
  overlay.className = 'skill-modal-overlay'

  const content = document.createElement('div')
  content.className = 'skill-modal-content'

  // Заголовок
  const header = document.createElement('div')
  header.className = 'skill-modal-header'
  const title = document.createElement('h3')
  title.textContent = option.unlocksName
  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'skill-modal-close'
  closeBtn.textContent = '×'
  header.appendChild(title)
  header.appendChild(closeBtn)
  content.appendChild(header)

  // Тело
  const body = document.createElement('div')
  body.className = 'skill-modal-body'

  // Картинка
  const img = document.createElement('img')
  img.src = resolveSkillImage(option.unlocksImage)
  img.alt = option.unlocksName
  img.className = 'skill-modal-image'
  body.appendChild(img)

  // Описание
  const desc = document.createElement('p')
  desc.className = 'skill-modal-description'
  desc.textContent = option.unlocksDescription
  body.appendChild(desc)

  // Статы
  const stats = document.createElement('div')
  stats.className = 'skill-modal-stats'

  const factorStat = document.createElement('div')
  factorStat.innerHTML = `<span class="skill-modal-label">Factor:</span><span class="skill-modal-value">×${option.factor.toFixed(2)}</span>`
  stats.appendChild(factorStat)

  if (!isMaxed) {
    stats.appendChild(createSkillStat('Стоимость', formatMoney(option.cost), coinImage))
  }
  body.appendChild(stats)

  // Кнопка покупки
  if (isAvailable) {
    body.appendChild(
      createBuyButton(
        option.cost,
        () => purchaseBranch(skillId, level.level, option.path, option.cost),
        cleanups,
        () => closeModal(),
      ),
    )
  }

  content.appendChild(body)
  modal.appendChild(overlay)
  modal.appendChild(content)
  document.body.appendChild(modal)

  const closeModal = () => {
    for (const cleanup of cleanups) cleanup()
    modal.remove()
  }
  closeBtn.addEventListener('click', () => {
    playSound('click')
    closeModal()
  })
  overlay.addEventListener('click', closeModal)
}

// ============================================================
// Покупка обычного уровня
// ============================================================

function purchasePlainLevel(skillId: Skill['id'], level: SkillLevel): boolean {
  if ('branch' in level && level.branch) return false
  const state = getState()
  // Узел мог закрыться гейтом разветвлений, пока модалка открыта
  if (!isNodeUnlocked(skillId, level.level)) return false
  if (state.skills[skillId] !== level.level - 1) return false
  if (state.money < level.cost) return false

  const newSkills = { ...state.skills, [skillId]: level.level }
  updateStateWithIncome({ money: state.money - level.cost, skills: newSkills })
  return true
}

// ============================================================
// Покупка ветки
// ============================================================

function purchaseBranch(skillId: Skill['id'], level: number, path: SkillPath, cost: number): boolean {
  const state = getState()
  if (!isNodeUnlocked(skillId, level)) return false
  if (state.skills[skillId] !== level - 1) return false
  if (state.money < cost) return false

  const newSkills = { ...state.skills, [skillId]: level }
  const newBranchChoices = { ...state.branchChoices, [branchChoiceKey(skillId, level)]: path }

  updateStateWithIncome({ money: state.money - cost, skills: newSkills, branchChoices: newBranchChoices })
  return true
}

// ============================================================
// Создание карточки отдела с деревом скиллов (круглые иконки)
// ============================================================

/** Разрешает ключ картинки в URL: сначала маппинг, потом как есть (путь) */
function resolveSkillImage(key: string): string {
  return skillLevelImages[key] || key
}

/**
 * Создаёт круглый узел скилла.
 * status: 'purchased' — куплен (яркий), 'available' — доступен (затенён + индикатор),
 *         'locked' — закрыт (сильно затенён + замок)
 * onClick вешается независимо от статуса: узел может открыться позже
 * (покупка предыдущего уровня, рост уровня игрока), поэтому доступность
 * проверяется внутри обработчика.
 */
function createSkillNode(opts: {
  imageKey: string
  name: string
  status: NodeStatus
  onClick?: () => void
}): HTMLElement {
  const node = document.createElement('div')
  node.className = 'skill-node'
  applyNodeStatus(node, opts.status)

  const img = document.createElement('img')
  img.className = 'skill-node-image'
  img.src = resolveSkillImage(opts.imageKey)
  img.alt = opts.name
  img.draggable = false
  img.onerror = () => { img.style.visibility = 'hidden' }
  node.appendChild(img)

  if (opts.onClick) {
    node.addEventListener('click', () => {
      if (node.classList.contains('skill-node-locked')) {
        // Узел ещё закрыт: звук отказа + короткая вибрация вместо молчаливого игнора
        playSound('message')
        node.classList.add('skill-node-denied')
        window.setTimeout(() => node.classList.remove('skill-node-denied'), 400)
        return
      }
      playSound('click')
      opts.onClick?.()
    })
  }

  return node
}

/** Вертикальный коннектор между строками */
function createTreeConnector(): HTMLElement {
  const c = document.createElement('div')
  c.className = 'skill-tree-connector'
  return c
}

/** SVG-развилка: линия из центра сверху расходится к двум позициям снизу */
function createTreeFork(merge: boolean): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'skill-tree-fork'
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 260 44')
  svg.setAttribute('preserveAspectRatio', 'none')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  // fork: из центра сверху расходимся к 65 и 195 снизу; merge — наоборот
  const d = merge
    ? 'M65,0 C65,22 130,22 130,44 M195,0 C195,22 130,22 130,44'
    : 'M130,0 C130,22 65,22 65,44 M130,0 C130,22 195,22 195,44'
  path.setAttribute('d', d)
  path.setAttribute('class', 'skill-tree-fork-line')
  svg.appendChild(path)
  wrap.appendChild(svg)
  return wrap
}

/**
 * Создаёт карточку отдела с деревом скиллов.
 * Структура дерева статична, а статусы узлов пересчитываются по подписке на стейт,
 * поэтому покупка навыка сразу видна без пересборки DOM.
 * Возвращает элемент с cleanup-функцией — её нужно вызвать при уходе из карточки.
 */
function createSkillCard(skillId: Skill['id'], onBack: () => void): HTMLElement & { cleanup: () => void } {
  const skill = skills.find(s => s.id === skillId)
  if (!skill) {
    const empty = document.createElement('div') as unknown as HTMLElement & { cleanup: () => void }
    empty.cleanup = () => {}
    return empty
  }

  const card = document.createElement('div')
  card.className = 'skill-detail-card'
  card.dataset.skillId = skillId

  // Заголовок
  const header = document.createElement('div')
  header.className = 'skill-detail-header'

  const backBtn = document.createElement('button')
  backBtn.type = 'button'
  backBtn.className = 'skill-back-btn'
  backBtn.textContent = '←'
  backBtn.addEventListener('click', () => {
    playSound('click')
    onBack()
  })
  header.appendChild(backBtn)

  card.appendChild(header)

  // Дерево скиллов
  const tree = document.createElement('div')
  tree.className = 'skill-tree'

  /** Узлы дерева с резолвером актуального статуса — нужно для обновления по стейту */
  const nodes: Array<{ el: HTMLElement; status: () => NodeStatus }> = []

  let nodeIndex = 0
  let wasBranch = false

  for (let i = 0; i < skill.levels.length; i++) {
    const level = skill.levels[i]
    const isBranch = 'branch' in level && !!level.branch

    // Коннектор сверху строки
    if (i > 0) {
      if (isBranch) {
        // Развилка: из центрального узла расходимся к двум узлам ветки
        tree.appendChild(createTreeFork(false))
      } else if (!wasBranch) {
        // Обычная вертикальная линия
        tree.appendChild(createTreeConnector())
      }
      // Если предыдущий уровень был веткой — merge-развилка уже добавлена после неё
    }

    if (isBranch && 'branch' in level && level.branch) {
      // Ветвящийся уровень: два узла на одной линии
      const branchRow = document.createElement('div')
      branchRow.className = 'skill-row skill-row-branch'

      for (const option of level.branch) {
        // Статус пересчитывается из стейта при каждом обновлении,
        // поэтому все проверки (включая открываемость по уровню игрока) — внутри
        const resolveStatus = (): NodeStatus => {
          if (isBranchChosen(skillId, level.level, option.path)) return 'purchased'
          if (isBranchLocked(skillId, level.level, option.path)) return 'locked'
          return isLevelAvailable(skillId, level.level) && isNodeUnlocked(skillId, level.level)
            ? 'available'
            : 'locked'
        }

        const node = createSkillNode({
          imageKey: option.unlocksImage,
          name: option.unlocksName,
          status: resolveStatus(),
          onClick: () => {
            if (resolveStatus() === 'locked') return
            showBranchOptionModal(skillId, level, option)
          },
        })
        node.style.animationDelay = `${(nodeIndex % 7) * 0.9}s`
        nodeIndex++
        nodes.push({ el: node, status: resolveStatus })
        branchRow.appendChild(node)
      }

      tree.appendChild(branchRow)

      // Схождение к следующему уровню
      if (i < skill.levels.length - 1) {
        tree.appendChild(createTreeFork(true))
      }
    } else {
      // Нейтральный уровень: один узел по центру
      const row = document.createElement('div')
      row.className = 'skill-row'

      const plainLevel = level as SkillPlainLevel
      const resolveStatus = (): NodeStatus => {
        if (getState().skills[skillId] >= plainLevel.level) return 'purchased'
        return isLevelAvailable(skillId, plainLevel.level) && isNodeUnlocked(skillId, plainLevel.level)
          ? 'available'
          : 'locked'
      }

      const node = createSkillNode({
        imageKey: plainLevel.unlocksImage,
        name: plainLevel.unlocksName,
        status: resolveStatus(),
        onClick: () => {
          if (resolveStatus() === 'locked') return
          showLevelModal(skillId, plainLevel)
        },
      })
      node.style.animationDelay = `${(nodeIndex % 7) * 0.9}s`
      nodeIndex++
      nodes.push({ el: node, status: resolveStatus })
      row.appendChild(node)

      tree.appendChild(row)
    }

    wasBranch = isBranch
  }

  card.appendChild(tree)

  // Подпись статусов: обновляем DOM только когда статусы реально изменились,
  // иначе перерисовка шла бы на каждом тике пассивного дохода
  let renderedSignature = ''

  const refreshTree = (): void => {
    const statuses = nodes.map((node) => node.status())
    const signature = statuses.join('|')
    if (signature === renderedSignature) return

    renderedSignature = signature
    nodes.forEach((node, index) => applyNodeStatus(node.el, statuses[index]))
  }

  refreshTree()
  const unsubscribe = subscribe(refreshTree)

  const result = card as unknown as HTMLElement & { cleanup: () => void }
  result.cleanup = () => unsubscribe()
  return result
}

// ============================================================
// Сетка отделов
// ============================================================

function createDepartmentCard(skillId: Skill['id'], onOpen: (skillId: Skill['id']) => void): HTMLElement {
  const skill = skills.find(s => s.id === skillId)
  if (!skill) return document.createElement('div')

  const isUnlocked = isDepartmentUnlocked(skillId)
  const hasAvailable = hasAvailableSkill(skillId)

  const card = document.createElement('div')
  card.className = 'department-card'
  card.dataset.skillId = skillId

  // Контейнер иконки (img + индикатор)
  const iconWrap = document.createElement('div')
  iconWrap.className = 'department-icon-wrap'

  const img = document.createElement('img')
  img.className = 'department-icon'
  img.src = skillImages[skillId] || ''
  img.alt = skill.name
  img.onerror = () => {
    img.style.display = 'none'
    const fb = iconWrap.querySelector('.department-icon-fallback') as HTMLElement
    if (fb) fb.style.display = 'flex'
  }
  iconWrap.appendChild(img)

  // Фоллбэк на эмодзи
  const fallback = document.createElement('div')
  fallback.className = 'department-icon-fallback'
  fallback.textContent = isUnlocked ? skillIcons[skillId] : '🔒'
  fallback.style.display = 'none'
  iconWrap.appendChild(fallback)

  // Индикатор доступных навыков
  const indicator = document.createElement('div')
  indicator.className = 'department-indicator'
  if (hasAvailable) indicator.classList.add('department-indicator-available')
  iconWrap.appendChild(indicator)

  card.appendChild(iconWrap)

  const name = document.createElement('div')
  name.className = 'department-name'
  name.textContent = skill.name
  card.appendChild(name)

  // Все отделы кликабельны (даже locked)
  card.addEventListener('click', () => {
    playSound('click')
    onOpen(skillId)
  })

  return card
}

// ============================================================
// Рендер сетки отделов
// ============================================================

function renderSkillsGrid(container: HTMLElement, onOpen: (skillId: Skill['id']) => void): void {
  const grid = document.createElement('div')
  grid.className = 'skills-grid'

  for (const skill of skills) {
    grid.appendChild(createDepartmentCard(skill.id, onOpen))
  }

  container.appendChild(grid)
}

// ============================================================
// Обратная совместимость: renderSkillsModal
// ============================================================

/**
 * Рендерит блок прогрессии игрока (уровень + шкала).
 * Возвращает элемент и функцию обновления по состоянию —
 * обновление инлайновое, чтобы не терять подписку на старый DOM.
 */
function renderPlayerLevelBar(): {
  el: HTMLElement
  update: (state: AppState) => void
} {
  const bar = document.createElement('div')
  bar.className = 'player-level-bar'

  // Верхняя строка: уровень + текст
  const topRow = document.createElement('div')
  topRow.className = 'player-level-bar-top'

  const levelIcon = document.createElement('div')
  levelIcon.className = 'player-level-icon'
  levelIcon.textContent = 'Уровень'
  topRow.appendChild(levelIcon)

  const levelText = document.createElement('div')
  levelText.className = 'player-level-text'
  const levelNum = document.createElement('span')
  levelNum.className = 'player-level-number'
  levelText.appendChild(levelNum)
  topRow.appendChild(levelText)

  bar.appendChild(topRow)

  // Шкала прогресса
  const track = document.createElement('div')
  track.className = 'player-level-track'

  const fill = document.createElement('div')
  fill.className = 'player-level-fill'
  track.appendChild(fill)

  bar.appendChild(track)

  // Текст под шкалой
  const bottomRow = document.createElement('div')
  bottomRow.className = 'player-level-bar-bottom'
  bar.appendChild(bottomRow)

  const update = (state: AppState): void => {
    levelNum.textContent = String(levelFromXp(state.xpMoney))
    const progress = nextLevelProgress(state.xpMoney)
    fill.style.width = `${Math.min(progress.progress * 100, 100)}%`
    const remaining = Math.max(0, progress.next - state.xpMoney)
    bottomRow.textContent = `Осталось: ${remaining.toLocaleString('ru-RU')} xp`
  }

  update(getState())
  return { el: bar, update }
}

/**
 * Баннер о незакрытой развилке: новые улучшения не откроются, пока игрок
 * не выберет ветку на текущем уровне во всех отделах с разветвлением.
 */
function renderGateNotice(): {
  el: HTMLElement
  update: (state: AppState) => void
} {
  const el = document.createElement('div')
  el.className = 'skill-gate-notice'
  el.style.display = 'none'

  const update = (state: AppState): void => {
    const gate = activeGate(state)
    if (!gate) {
      el.style.display = 'none'
      return
    }

    const done = gate.skillIds.filter((skillId) => isBranchTierChosen(state, skillId, gate.tier)).length
    el.style.display = ''
    el.textContent =
      `🔒 Новые улучшения закрыты, пока не выбраны все ветки ${gate.tier} уровня. ` +
      `Пройдено ${done} из ${gate.skillIds.length} отделов.`
  }

  update(getState())
  return { el, update }
}

/**
 * Рендерит модалку с отделами и прогрессом игрока.
 * Возвращает HTMLElement с cleanup-функцией для отписки от изменений стейта.
 */
export function renderSkillsModal(): HTMLElement & { cleanup: () => void } {
  const wrapper = document.createElement('div')
  wrapper.className = 'skills-container'

  // Блок прогрессии игрока — обновляется инлайново, без замены DOM
  const levelBar = renderPlayerLevelBar()
  wrapper.appendChild(levelBar.el)

  // Подсказка о незакрытой развилке — видна только когда гейт активен
  const gateNotice = renderGateNotice()
  wrapper.appendChild(gateNotice.el)

  // Контейнер для содержимого (сетка или карточка отдела)
  const view = document.createElement('div')
  view.className = 'skills-view'
  wrapper.appendChild(view)

  /** Cleanup-функция текущей карточки отдела — null, когда показана сетка */
  let cardCleanup: (() => void) | null = null

  /** Показывает сетку отделов, отписываясь от карточки */
  const showGrid = (): void => {
    cardCleanup?.()
    cardCleanup = null
    view.innerHTML = ''
    renderSkillsGrid(view, showSkillCard)
  }

  /** Показывает карточку отдела с подпиской на актуализацию дерева */
  const showSkillCard = (skillId: Skill['id']): void => {
    cardCleanup?.()
    view.innerHTML = ''
    const card = createSkillCard(skillId, showGrid)
    cardCleanup = card.cleanup
    view.appendChild(card)
  }

  showGrid()

  const unsubscribe = subscribe((state: AppState) => {
    levelBar.update(state)
    gateNotice.update(state)

    // Обновляем индикаторы на карточках отделов
    const cards = view.querySelectorAll<HTMLElement>('.department-card')
    for (const card of cards) {
      const skillId = card.dataset.skillId as Skill['id']
      const indicator = card.querySelector('.department-indicator')
      if (!indicator) continue
      indicator.classList.toggle('department-indicator-available', hasAvailableSkill(skillId))
    }
  })

  const result = wrapper as unknown as HTMLElement & { cleanup: () => void }
  result.cleanup = () => {
    unsubscribe()
    cardCleanup?.()
  }
  return result
}
