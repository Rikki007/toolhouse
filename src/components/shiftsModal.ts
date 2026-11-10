import { getCurrentShiftConfig, buyShift, shiftConfigs } from '../state/shiftsStore.ts'
import { createModal } from '../utils/modalFactory.ts'
import { createPersonnelCard, createMasterCard, FORKLIFT_SLOTS, ASSEMBLER_SLOTS } from '../utils/personnel.ts'
import { getState, subscribe } from '../state/state.ts'
import { getMasterUpgradeLevel, getMasterUpgradeCost } from '../state/masterUpgradeStore.ts'
import { isShiftFullyStaffed } from '../utils/passiveIncome.ts'
import { interfaceIconImages, coinFrames } from '../assets/assetLoader.ts'
import { playSound } from '../state/audioManager.ts'
import { formatMoney } from '../utils/format.ts'
import { playerLevel } from '../utils/skillProgress.ts'

/**
 * Рендерит кнопку «Смены» в тулбаре
 */
export function renderShiftsButton(onToggle: () => void): HTMLElement {
  const shift = getCurrentShiftConfig()
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'shifts-toolbar-btn'
  btn.dataset.shifts = String(shift.id)
  
  // Иконка и количество активных смен
  const icon = document.createElement('span')
  icon.className = 'shifts-toolbar-icon'
  const iconImg = document.createElement('img')
  iconImg.src = interfaceIconImages['shifts']
  iconImg.alt = 'Смены'
  icon.appendChild(iconImg)
  
  btn.appendChild(icon)
  
  btn.addEventListener('click', onToggle)
  return btn
}

/**
 * Обновляет бейдж кнопки смен
 */
export function updateShiftsButton(btn: HTMLElement): void {
  const shift = getCurrentShiftConfig()
  btn.dataset.shifts = String(shift.id)
  const badge = btn.querySelector('.shifts-toolbar-badge')
  if (badge) {
    badge.textContent = String(shift.id)
  }
}

/**
 * Рендерит модальное окно управления сменами.
 * Возвращает элемент с cleanup-функцией для отписки от изменений стейта.
 */
export function renderShiftsModal(onClose: () => void): HTMLElement & { cleanup: () => void } {
  const modal = document.createElement('div')
  modal.className = 'shifts-modal'

  const modalHeader = document.createElement('div')
  modalHeader.className = 'shifts-modal-header'
  
  const title = document.createElement('h3')
  title.className = 'shifts-modal-title'
  title.textContent = 'Управление сменами'
  modalHeader.appendChild(title)
  
  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'modal-close-btn shifts-modal-close'
  closeBtn.textContent = '×'
  closeBtn.addEventListener('click', () => {
    playSound('click')
    onClose()
  })
  modalHeader.appendChild(closeBtn)
  
  modal.appendChild(modalHeader)

  const modalBody = document.createElement('div')
  modalBody.className = 'shifts-modal-body'

  const state = getState()
  const shifts = [
    { id: 1, key: 'first' as const, label: '1-я смена' },
    { id: 2, key: 'second' as const, label: '2-я смена' },
    { id: 3, key: 'third' as const, label: '3-я смена' },
  ]

  for (const shiftInfo of shifts) {
    const shift = state.shifts[shiftInfo.key]
    const config = shiftConfigs.find(c => c.id === shiftInfo.id)
    const isActive = shift.isActive
    const isNext = !isActive && isPreviousShiftActive(shiftInfo.id)
    // Смена открывается для покупки только с определённого уровня игрока
    const levelOk = !config || playerLevel(state) >= config.requiredLevel

    const item = document.createElement('div')
    item.className = 'shifts-modal-item'

    // Название и статус
    const itemHeader = document.createElement('div')
    itemHeader.className = 'shifts-modal-item-header'

    const nameLabel = document.createElement('span')
    nameLabel.className = 'shifts-modal-item-name'
    nameLabel.textContent = shiftInfo.label
    itemHeader.appendChild(nameLabel)

    const statusLabel = document.createElement('span')
    statusLabel.className = 'shifts-modal-item-status'
    if (isActive) {
      statusLabel.textContent = 'Активна'
      statusLabel.classList.add('status-active')
    } else if (isNext && config && !levelOk) {
      statusLabel.textContent = `🔒 Нужен ${config.requiredLevel} уровень`
      statusLabel.classList.add('status-locked')
    } else if (isNext) {
      statusLabel.textContent = 'Доступна'
      statusLabel.classList.add('status-unlocked')
    } else {
      statusLabel.textContent = '🔒 Закрыта'
      statusLabel.classList.add('status-locked')
    }
    itemHeader.appendChild(statusLabel)

    item.appendChild(itemHeader)

    // Цена и кнопка
    const itemFooter = document.createElement('div')
    itemFooter.className = 'shifts-modal-item-footer'

    if (isActive) {
      // Уже активна — просто показываем множитель
      const mult = document.createElement('span')
      mult.className = 'shifts-modal-item-multiplier'
      const multiplier = getShiftIncomeMultiplierForShift(shiftInfo.id)
      mult.textContent = `Множитель дохода: ×${multiplier}`
      itemFooter.appendChild(mult)

      // Бонус за полную укомплектованность смены
      if (isShiftFullyStaffed(shift)) {
        // Множитель и бонус stack'ом друг под другом
        itemFooter.classList.add('shifts-modal-item-footer-stacked')
        const bonus = document.createElement('span')
        bonus.className = 'shifts-modal-item-bonus'
        bonus.textContent = 'Активен бонус укомплектованности'
        itemFooter.appendChild(bonus)
      }
    } else if (isNext && config) {
      // Следующая смена — можно купить
      const price = document.createElement('span')
      price.className = 'shifts-modal-item-price'
      
      const coinImg = document.createElement('img')
      coinImg.src = coinFrames[0]
      coinImg.alt = 'Валюта'
      coinImg.style.width = '20px'
      coinImg.style.height = '20px'
      coinImg.style.verticalAlign = 'middle'
      coinImg.style.marginRight = '4px'
      price.appendChild(coinImg)
      
      const priceText = document.createTextNode(formatMoney(shift.cost))
      price.appendChild(priceText)
      itemFooter.appendChild(price)

      const buyBtn = document.createElement('button')
      buyBtn.type = 'button'
      buyBtn.className = 'shifts-modal-buy-btn'
      buyBtn.textContent = 'Купить'
      buyBtn.dataset.cost = String(shift.cost)
      buyBtn.dataset.requiredLevel = String(config.requiredLevel)

      itemFooter.appendChild(buyBtn)
      updateBuyButtonsAvailability()

      buyBtn.addEventListener('click', (e) => {
        // предотвращаем всплытие на карточку — иначе откроется модалка персонала
        e.stopPropagation()

        if (buyBtn.disabled) return

        // Звук покупки — кнопка активна, покупка состоится
        playSound('buy')

        const result = buyShift(shiftInfo.id)
        if (result.success) {
          onClose()
        } else {
          alert(result.error ?? 'Не удалось купить')
        }
      })
    } else {
      // Закрыта — показываем, что нужно купить предыдущую
      const locked = document.createElement('span')
      locked.className = 'shifts-modal-item-locked'
      locked.textContent = 'Сначала купите предыдущую смену'
      itemFooter.appendChild(locked)
    }

    item.appendChild(itemFooter)

    // Клик по карточке смены — открыть управление персоналом
    item.addEventListener('click', () => {
      playSound('click')
      openShiftPersonnelModal(shiftInfo.id, onClose)
    })

    modalBody.appendChild(item)
  }

  modal.appendChild(modalBody)

  // Подписка на изменения стейта — обновляем disabled кнопок при изменении денег
  const unsubscribe = subscribe(updateBuyButtonsAvailability)

  // Добавляем cleanup-функцию к HTMLElement
  const result = modal as unknown as HTMLElement & { cleanup: () => void }
  result.cleanup = () => unsubscribe()

  return result
}

/** Обновляет доступность всех кнопок покупки в зависимости от денег и уровня */
function updateBuyButtonsAvailability(): void {
  const state = getState()
  const level = playerLevel(state)
  const buttons = document.querySelectorAll<HTMLButtonElement>('.shifts-modal-buy-btn')
  for (const btn of buttons) {
    const cost = Number(btn.dataset.cost ?? 0)
    const requiredLevel = Number(btn.dataset.requiredLevel ?? 0)
    btn.disabled = state.money < cost || level < requiredLevel
  }

  // Подписи требования уровня прячем, как только уровень достигнут
  const reqs = document.querySelectorAll<HTMLElement>('.shifts-modal-item-level-req')
  for (const req of reqs) {
    req.hidden = level >= Number(req.dataset.requiredLevel ?? 0)
  }
}

/** Проверяет, активна ли предыдущая смена */
function isPreviousShiftActive(shiftId: number): boolean {
  const state = getState()
  if (shiftId === 1) return true // первая всегда доступна для покупки
  if (shiftId === 2) return state.shifts.first.isActive
  if (shiftId === 3) return state.shifts.second.isActive
  return false
}

/** Получить множитель дохода для смены */
function getShiftIncomeMultiplierForShift(shiftId: number): number {
  const state = getState()
  let multiplier = 1
  
  if (shiftId >= 1 && state.shifts.first.isActive) multiplier = Math.max(multiplier, 1)
  if (shiftId >= 2 && state.shifts.second.isActive) multiplier = Math.max(multiplier, 1.2)
  if (shiftId >= 3 && state.shifts.third.isActive) multiplier = Math.max(multiplier, 1.5)
  
  return multiplier
}

// ===== Открытие модалки персонала =====

/**
 * Рендерит модальное окно управления персоналом смены
 */
function renderShiftPersonnelModal(shiftId: number, onClose: () => void): HTMLElement {
  const config = shiftConfigs.find(c => c.id === shiftId) ?? shiftConfigs[0]
  const modal = document.createElement('div')
  modal.className = 'shifts-personnel-modal'

  // Заголовок
  const header = document.createElement('div')
  header.className = 'shifts-personnel-modal-header'

  const title = document.createElement('h3')
  title.className = 'shifts-modal-item-name'
  title.textContent = config.label
  header.appendChild(title)

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'modal-close-btn shifts-modal-close'
  closeBtn.textContent = '×'
  closeBtn.addEventListener('click', () => {
    playSound('click')
    onClose()
  })
  header.appendChild(closeBtn)

  modal.appendChild(header)

  const body = document.createElement('div')
  body.className = 'shifts-modal-body'

  // Секция: мастер смены — перерисовывается при изменениях стейта,
  // чтобы актуальными были и цена прокачки, и доступность кнопки
  const masterSection = document.createElement('div')
  masterSection.className = 'shifts-personnel-section'

  const masterTitle = document.createElement('h4')
  masterTitle.className = 'shifts-personnel-section-title'
  masterTitle.textContent = 'Мастер смены'
  masterSection.appendChild(masterTitle)

  /** Ключ смены в стейте */
  const shiftKey = shiftId === 1 ? 'first' : shiftId === 2 ? 'second' : 'third'

  // Подпись отрендеренного блока: перерисовываем только когда реально
  // поменялись мастер, его уровень, цена или доступность покупки
  let renderedSignature = ''

  const refreshMasterCard = (): void => {
    const state = getState()
    const shift = state.shifts[shiftKey]
    const masterId = shift.personnel.master ?? 'master_01'
    const level = getMasterUpgradeLevel(masterId)
    const cost = getMasterUpgradeCost(masterId, shift.cost)
    const affordable = cost === null || state.money >= cost
    const signature = `${masterId}|${level}|${cost}|${affordable}`
    if (signature === renderedSignature) return

    renderedSignature = signature
    masterSection.querySelector('.shifts-master-card')?.remove()
    masterSection.appendChild(createMasterCard(masterId, shift.cost))
  }

  refreshMasterCard()
  const unsubscribeMaster = subscribe(refreshMasterCard)

  body.appendChild(masterSection)

  // Секция: водители ричтраков
  const forkliftSection = document.createElement('div')
  forkliftSection.className = 'shifts-personnel-section'

  const forkliftTitle = document.createElement('h4')
  forkliftTitle.className = 'shifts-personnel-section-title'
  forkliftTitle.textContent = 'Водители ричтраков'
  forkliftSection.appendChild(forkliftTitle)

  const forkliftGrid = document.createElement('div')
  forkliftGrid.className = 'shifts-personnel-grid'

  for (const slot of FORKLIFT_SLOTS) {
    forkliftGrid.appendChild(createPersonnelCard(slot, shiftId, FORKLIFT_SLOTS.indexOf(slot)))
  }

  forkliftSection.appendChild(forkliftGrid)
  body.appendChild(forkliftSection)

  // Секция: сборщики
  const assemblerSection = document.createElement('div')
  assemblerSection.className = 'shifts-personnel-section'

  const assemblerTitle = document.createElement('h4')
  assemblerTitle.className = 'shifts-personnel-section-title'
  assemblerTitle.textContent = 'Сборщики'
  assemblerSection.appendChild(assemblerTitle)

  const assemblerGrid = document.createElement('div')
  assemblerGrid.className = 'shifts-personnel-grid'

  for (const slot of ASSEMBLER_SLOTS) {
    assemblerGrid.appendChild(createPersonnelCard(slot, shiftId, ASSEMBLER_SLOTS.indexOf(slot)))
  }

  assemblerSection.appendChild(assemblerGrid)
  body.appendChild(assemblerSection)

  modal.appendChild(body)

  // Отписка от стейта при закрытии модалки
  const result = modal as unknown as HTMLElement & { cleanup: () => void }
  result.cleanup = () => unsubscribeMaster()
  return result
}

export function openShiftPersonnelModal(shiftId: number, onClose: () => void): void {
  const container = document.querySelector('.game-screen') as HTMLElement | null
  if (!container) return

  createModal(container, {
    overlayClass: 'shifts-personnel-overlay',
    renderContent: (onCloseModal) => renderShiftPersonnelModal(shiftId, onCloseModal),
    onClose: () => {
      onClose()
    },
  })
}

