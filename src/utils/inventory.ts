import { orderPickerImages, reachTruckImages, pickerImages, richDriversImages, riggingImages } from '../assets/assetLoader.ts'
import type { InventoryItem, InventoryState } from '../types/index.ts'
import { createCreditIcon } from './creditIcon.ts'
import { formatMoney } from './format.ts'
import { playSound } from '../state/audioManager.ts'

// ===== Утилиты миграции =====

/**
 * Функция миграции больше не нужна — инвентарь хранит только ID.
 * Старые данные с полными объектами конвертируются в state.ts.
 */
export function migrateInventoryData(_inventory: InventoryState): boolean {
  return false
}

// ===== Утилиты рендеринга =====

/** Определяет, является ли предмет персоналом (сборщик или водитель ричтрака) */
export function isStaffItem(_item: InventoryItem): boolean {
  return _item.type === 'staff'
}

/** Определяет роль персонала по ID предмета */
export function getStaffRole(item: InventoryItem): 'forklift' | 'picker' | null {
  if (item.id.startsWith('reachtruck_')) return 'forklift'
  if (item.id.startsWith('picker_')) return 'picker'
  return null
}

/** Создаёт кнопки для карточки инвентаря */
function createInventoryButtons(
  assignLabel: string,
  sellLabel: string,
  onAssign: () => void,
  onSell: () => void
): HTMLElement {
  const buttonsContainer = document.createElement('div')
  buttonsContainer.className = 'inventory-card-buttons'
  buttonsContainer.style.display = 'none'
  buttonsContainer.style.gap = '8px'
  buttonsContainer.style.marginTop = '8px'
  buttonsContainer.style.flexDirection = 'column'

  // Кнопка действия
  const actionBtn = document.createElement('button')
  actionBtn.type = 'button'
  actionBtn.className = 'inventory-card-btn inventory-card-btn-assign'
  actionBtn.textContent = assignLabel
  actionBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    playSound('click')
    onAssign()
  })

  // Кнопка "Продать"
  const sellBtn = document.createElement('button')
  sellBtn.type = 'button'
  sellBtn.className = 'inventory-card-btn inventory-card-btn-sell'
  sellBtn.textContent = sellLabel
  sellBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    playSound('buy')
    onSell()
  })

  buttonsContainer.appendChild(actionBtn)
  buttonsContainer.appendChild(sellBtn)

  return buttonsContainer
}

/** Создаёт контейнер с одной кнопкой "Продать" (для снаряжения) */
function createSellOnlyButton(sellLabel: string, onSell: () => void): HTMLElement {
  const buttonsContainer = document.createElement('div')
  buttonsContainer.className = 'inventory-card-buttons'
  buttonsContainer.style.display = 'none'
  buttonsContainer.style.gap = '8px'
  buttonsContainer.style.marginTop = '8px'
  buttonsContainer.style.flexDirection = 'column'

  const sellBtn = document.createElement('button')
  sellBtn.type = 'button'
  sellBtn.className = 'inventory-card-btn inventory-card-btn-sell'
  sellBtn.textContent = sellLabel
  sellBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    playSound('buy')
    onSell()
  })

  buttonsContainer.appendChild(sellBtn)
  return buttonsContainer
}

/** Создаёт кнопки "Назначить" и "Продать" для карточки персонала */
function createStaffButtons(
  onAssign: () => void,
  onSell: () => void
): HTMLElement {
  return createInventoryButtons('Назначить', 'Продать', onAssign, onSell)
}

/** Данные для кнопки прокачки квалификации на карточке сотрудника */
export interface InventoryCardUpgrade {
  /** Текущий уровень квалификации (0 = без прокачки) */
  level: number
  /** Максимальный уровень квалификации */
  maxLevel: number
  /** Стоимость следующей прокачки */
  cost: number
  /** Хватает ли денег на прокачку */
  affordable: boolean
  /** Обработчик прокачки */
  onUpgrade: () => void
}

/** Создаёт кнопку прокачки квалификации */
function createUpgradeButton(upgrade: InventoryCardUpgrade): HTMLElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'inventory-card-btn inventory-card-btn-upgrade'

  const isMax = upgrade.level >= upgrade.maxLevel
  if (isMax) {
    btn.textContent = 'Макс. квалификация'
    btn.disabled = true
    btn.classList.add('inventory-card-btn-upgrade-max')
    return btn
  }

  // Текст кнопки 12px — значок берём чуть меньше базового, чтобы не спорил с цифрами
  btn.append(`Прокачать · ${formatMoney(upgrade.cost)}`, createCreditIcon(10))
  if (!upgrade.affordable) {
    btn.disabled = true
    btn.classList.add('inventory-card-btn-upgrade-expensive')
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    playSound('buy')
    upgrade.onUpgrade()
  })

  return btn
}

/**
 * Создаёт DOM-карточку инвентаря для купленного предмета.
 * @param upgrade — если передан, на карточке сотрудника показывается уровень и кнопка прокачки
 */
export function createInventoryCard(
  item: InventoryItem,
  onAssign?: () => void,
  onSell?: () => void,
  upgrade?: InventoryCardUpgrade
): HTMLElement {
  const card = document.createElement('div')
  card.className = 'inventory-card'
  card.dataset.itemId = item.id

  // Изображение
  let imageSrc = ''
  if (item.type === 'staff' && item.avatar) {
    imageSrc = pickerImages[item.avatar] || richDriversImages[item.avatar] || ''
  } else if (item.imageKey) {
    imageSrc = riggingImages[item.imageKey] || orderPickerImages[item.imageKey] || reachTruckImages[item.imageKey] || ''
  }

  if (imageSrc) {
    const image = document.createElement('img')
    image.className = 'inventory-card-image'
    image.src = imageSrc
    image.alt = item.name
    card.appendChild(image)
  } else {
    const placeholder = document.createElement('div')
    placeholder.className = 'inventory-card-placeholder'
    placeholder.textContent = item.type === 'staff' ? '👤' : '🚜'
    card.appendChild(placeholder)
  }

  // Название
  const nameEl = document.createElement('div')
  nameEl.className = 'inventory-card-name'
  nameEl.textContent = item.name
  card.appendChild(nameEl)

  // Скорость (если есть) — отображаем звёздочками
  if (item.speed !== undefined) {
    const speed = document.createElement('div')
    speed.className = 'inventory-card-speed'
    const starsCount = Math.max(0, Math.min(10, item.speed))
    speed.textContent = '⭐'.repeat(starsCount) + '☆'.repeat(10 - starsCount)
    card.appendChild(speed)
  }

  // Уровень квалификации сотрудника
  if (upgrade) {
    const QUALIFICATION_NAMES = ['Новичок', 'Опытный', 'Матёрый', 'Рвач']
    const badge = document.createElement('div')
    badge.className = 'inventory-card-qualification'
    badge.textContent = QUALIFICATION_NAMES[upgrade.level] ?? ''
    if (upgrade.level >= upgrade.maxLevel) {
      badge.classList.add('inventory-card-qualification-max')
    }
    card.appendChild(badge)
  }

  // Кликабельные карточки: персонал (назначить/продать) и снаряжение (только продать)
  const expandable = (item.type === 'staff' && onAssign && onSell)
    || (item.type === 'rigging' && onSell)

  if (expandable) {
    const buttons = item.type === 'staff'
      ? createStaffButtons(onAssign!, onSell!)
      : createSellOnlyButton('Продать', onSell!)

    // Кнопка прокачки — первой, чтобы она была заметнее технических действий
    if (upgrade) {
      buttons.insertBefore(createUpgradeButton(upgrade), buttons.firstChild)
    }

    card.appendChild(buttons)

    card.style.cursor = 'pointer'

    card.addEventListener('click', (e) => {
      e.stopPropagation()
      // Звук раскрытия/сворачивания карточки
      playSound('click')
      const isExpanded = card.classList.contains('inventory-card-expanded')

      // Закрываем все карточки (включая текущую)
      document.querySelectorAll('.inventory-card-expanded').forEach(c => {
        c.classList.remove('inventory-card-expanded')
        const btns = c.querySelector('.inventory-card-buttons') as HTMLElement | null
        if (btns) btns.style.display = 'none'
      })

      // Если карточка не была открыта — открываем её
      if (!isExpanded) {
        card.classList.add('inventory-card-expanded')
        buttons.style.display = 'flex'
      }
    })
  } else {
    // Техника (equipment) — некликабельна, убираем hover-эффект
    card.classList.add('inventory-card-static')
    card.style.cursor = 'default'
  }

  return card
}
