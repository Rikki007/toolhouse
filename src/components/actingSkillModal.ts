import type { ActingBranchId, ActingTokenParam } from '../types/index.ts'
import { createModal } from '../utils/modalFactory.ts'
import { playSound } from '../state/audioManager.ts'
import { formatMoney } from '../utils/format.ts'
import { ACTING_BRANCHES } from '../data/actingManager.ts'
import {
  ACTING_TOKEN_PARAM_TITLES,
  canAffordActingUpgrade,
  getActingAvailablePoints,
  getActingBranchEffectText,
  getActingBranchIconSrc,
  getActingBranchLevel,
  getActingBranchMaxLevel,
  getActingTokenParamLevel,
  getActingTokenParamMaxLevel,
  getActingTokenParamValueText,
  getActingTokensPerHourText,
  getActingUpgradeCost,
  upgradeActingBranch,
  upgradeActingTokenParam,
} from '../utils/actingManager.ts'

/** Строка «параметр — значение» */
function createStatRow(label: string, value: string): HTMLElement {
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

/** Блок одного параметра «Сбора жетонов» с собственной кнопкой улучшения */
function createTokenParamBlock(
  param: ActingTokenParam,
  points: number,
  onUpgraded: (() => void) | undefined,
  rerender: () => void,
): HTMLElement {
  const level = getActingTokenParamLevel(param)
  const maxLevel = getActingTokenParamMaxLevel(param)
  const isMax = level >= maxLevel

  const block = document.createElement('div')
  block.className = 'acting-skill-param'

  const header = document.createElement('div')
  header.className = 'acting-skill-param-header'

  const title = document.createElement('span')
  title.className = 'acting-skill-param-title'
  title.textContent = ACTING_TOKEN_PARAM_TITLES[param]
  header.appendChild(title)

  const levelEl = document.createElement('span')
  levelEl.className = 'acting-skill-param-level'
  // Уровни показываем с единицы: «1 / 6», «1 / 9» и т.д.
  levelEl.textContent = `Уровень ${level + 1} / ${maxLevel + 1}`
  header.appendChild(levelEl)

  block.appendChild(header)

  const valueEl = document.createElement('div')
  valueEl.className = 'acting-skill-param-value'
  valueEl.textContent = getActingTokenParamValueText(param, level)
  block.appendChild(valueEl)

  if (!isMax) {
    const nextEl = document.createElement('div')
    nextEl.className = 'acting-skill-param-next'
    nextEl.textContent = `Следующий: ${getActingTokenParamValueText(param, level + 1)}`
    block.appendChild(nextEl)
  }

  const upgradeBtn = document.createElement('button')
  upgradeBtn.type = 'button'
  upgradeBtn.className = 'acting-skill-param-upgrade'

  if (isMax) {
    upgradeBtn.textContent = 'Максимум'
    upgradeBtn.disabled = true
  } else if (points <= 0) {
    upgradeBtn.textContent = 'Нет очков'
    upgradeBtn.disabled = true
  } else {
    const cost = getActingUpgradeCost()
    upgradeBtn.textContent = `Улучшить · ${formatMoney(cost)}`
    upgradeBtn.disabled = !canAffordActingUpgrade()
    upgradeBtn.addEventListener('click', () => {
      if (!upgradeActingTokenParam(param)) return
      playSound('levelUp')
      onUpgraded?.()
      rerender()
    })
  }

  block.appendChild(upgradeBtn)
  return block
}

/**
 * Модалка навыка И.О.: описание, текущий эффект и кнопка улучшения.
 * @param onUpgraded — вызывается после успешного улучшения (обновить дерево под модалкой)
 */
export function openActingSkillModal(
  container: HTMLElement,
  branchId: ActingBranchId,
  onUpgraded?: () => void,
): void {
  const branch = ACTING_BRANCHES.find((item) => item.id === branchId)
  if (!branch) return

  createModal(container, {
    overlayClass: 'acting-skill-overlay',
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'acting-skill-modal'

      const render = (): void => {
        const level = getActingBranchLevel(branch.id)
        const maxLevel = getActingBranchMaxLevel(branch.id)
        const isMax = level >= maxLevel
        const points = getActingAvailablePoints()

        modal.replaceChildren()

        // Шапка
        const header = document.createElement('div')
        header.className = 'acting-skill-header'

        const title = document.createElement('h3')
        title.className = 'acting-skill-title'
        title.textContent = branch.label
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

        // Тело
        const body = document.createElement('div')
        body.className = 'acting-skill-body'

        const iconWrap = document.createElement('div')
        iconWrap.className = `acting-skill-big-icon acting-skill-big-icon-${branch.color}`
        const iconSrc = getActingBranchIconSrc(branch)
        if (iconSrc) {
          const icon = document.createElement('img')
          icon.src = iconSrc
          icon.alt = branch.label
          icon.draggable = false
          iconWrap.appendChild(icon)
        }
        body.appendChild(iconWrap)

        const description = document.createElement('p')
        description.className = 'acting-skill-description'
        description.textContent = branch.description
        body.appendChild(description)

        // «Сбор жетонов» прокачивается тремя независимыми параметрами
        if (branch.id === 'tokens') {
          const summary = document.createElement('div')
          summary.className = 'acting-skill-stats'
          summary.appendChild(
            createStatRow('Ожидаемая добыча', getActingTokensPerHourText()),
          )
          body.appendChild(summary)

          const params: ActingTokenParam[] = ['frequency', 'chance', 'value']
          for (const param of params) {
            body.appendChild(createTokenParamBlock(param, points, onUpgraded, render))
          }

          const pointsEl = document.createElement('div')
          pointsEl.className = 'acting-skill-points'
          pointsEl.textContent = `Доступно очков навыков: ${points}`
          body.appendChild(pointsEl)

          modal.appendChild(body)
          return
        }

        const stats = document.createElement('div')
        stats.className = 'acting-skill-stats'

        stats.appendChild(createStatRow('Уровень', `${level} / ${maxLevel}`))
        stats.appendChild(createStatRow('Сейчас', getActingBranchEffectText(branch.id, level)))

        if (!isMax) {
          stats.appendChild(
            createStatRow('После улучшения', getActingBranchEffectText(branch.id, level + 1)),
          )
        }

        body.appendChild(stats)

        const pointsEl = document.createElement('div')
        pointsEl.className = 'acting-skill-points'
        pointsEl.textContent = `Доступно очков навыков: ${points}`
        body.appendChild(pointsEl)

        const upgradeBtn = document.createElement('button')
        upgradeBtn.type = 'button'
        upgradeBtn.className = 'acting-skill-upgrade'

        if (isMax) {
          upgradeBtn.textContent = 'Максимальный уровень'
          upgradeBtn.disabled = true
        } else if (points <= 0) {
          upgradeBtn.textContent = 'Нет очков навыков'
          upgradeBtn.disabled = true
        } else {
          const cost = getActingUpgradeCost()
          upgradeBtn.textContent = `Улучшить · ${formatMoney(cost)}`
          upgradeBtn.disabled = !canAffordActingUpgrade()
          upgradeBtn.addEventListener('click', () => {
            if (!upgradeActingBranch(branch.id)) return
            playSound('levelUp')
            onUpgraded?.()
            render()
          })
        }

        body.appendChild(upgradeBtn)
        modal.appendChild(body)
      }

      render()
      return modal
    },
  })
}
