import { orderPickerImages, reachTruckImages, pickerImages, richDriversImages, riggingImages, tierImages } from '../assets/assetLoader.ts'
import type { InventoryItem, InventoryState } from '../types/index.ts'
import { createCreditIcon } from './creditIcon.ts'
import { formatMoney } from './format.ts'
import { playSound } from '../state/audioManager.ts'
import { getStaffById } from './itemLookup.ts'
import { getStaffTierProgress, getNextUpgrade, getStaffTierImageKey, getTierNameByNumber } from './staffUpgrades.ts'
import { MAX_STAFF_TIER, MAX_TIER_LEVEL, STAFF_TIERS } from '../data/staffUpgrades.ts'
import { getState } from '../state/state.ts'
import { levelFromXp } from '../data/playerLevels.ts'

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
    playSound('click')
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
  /** Текущий уровень внутри тира (0-10) */
  level: number
  /** Максимальный уровень внутри тира */
  maxLevel: number
  /** Текущий тир (1-8) */
  tier: number
  /** Стоимость следующей прокачки */
  cost: number
  /** Хватает ли денег на прокачку */
  affordable: boolean
  /** ID сотрудника для обновления карточки на месте */
  staffId: string
  /** Обработчик прокачки */
  onUpgrade: () => void
}

/** Создаёт кнопку прокачки квалификации */
function createUpgradeButton(upgrade: InventoryCardUpgrade): HTMLElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'inventory-card-btn inventory-card-btn-upgrade'

  const isMax = upgrade.tier >= MAX_STAFF_TIER && upgrade.level >= upgrade.maxLevel
  if (isMax) {
    btn.textContent = 'Макс. квалификация'
    btn.disabled = true
    btn.classList.add('inventory-card-btn-upgrade-max')
    return btn
  }

  // При переходе в новую лигу — особый текст
  if (upgrade.level >= upgrade.maxLevel && upgrade.tier < MAX_STAFF_TIER) {
    const label = getTierNameByNumber(upgrade.tier + 1)
    btn.append(`Открыть ${label} лигу · ${formatMoney(upgrade.cost)}`, createCreditIcon(10))
  } else {
    // Текст кнопки 12px — значок берём чуть меньше базового, чтобы не спорил с цифрами
    btn.append(`Прокачать · ${formatMoney(upgrade.cost)}`, createCreditIcon(10))
  }

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
 * Обновляет DOM-элементы карточки инвентаря сотрудника после прокачки.
 * Работает в-place: меняет закладку тира, звёзды и кнопку, не закрывая модалку.
 */
export function updateUpgradeCardUI(staffId: string): void {
  const card = document.querySelector(`.inventory-card[data-item-id="${staffId}"]`) as HTMLElement | null
  if (!card) return

  const state = getState()
  const rawStaff = getStaffById(staffId)
  if (!rawStaff) return

  const progress = getStaffTierProgress(rawStaff, state.staffUpgrades)
  const next = getNextUpgrade(rawStaff, state.staffUpgrades, levelFromXp(state.xpMoney))
  const cost = next?.cost ?? 0
  const affordable = state.money >= cost

  // Обновляем закладку тира
  const bookmark = card.querySelector('.staff-tier-bookmark') as HTMLImageElement | null
  const tierKey = getStaffTierImageKey(rawStaff, state.staffUpgrades)
  if (bookmark && tierImages[tierKey]) {
    bookmark.src = tierImages[tierKey]
    const tierCfg = STAFF_TIERS[progress.tier - 1]
    if (tierCfg) bookmark.alt = tierCfg.name
  }

  // Обновляем звёзды скорости (level внутри тира, 0-10)
  const speedEl = card.querySelector('.inventory-card-speed') as HTMLElement | null
  if (speedEl) {
    const stars = Math.max(0, Math.min(10, progress.level))
    speedEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(10 - stars)
  }

  // Обновляем кнопку прокачки
  const btn = card.querySelector('.inventory-card-btn-upgrade') as HTMLButtonElement | null
  if (btn) {
    const isMax = progress.tier >= MAX_STAFF_TIER && progress.level >= MAX_TIER_LEVEL
    if (isMax || !next) {
      btn.textContent = 'Макс. квалификация'
      btn.disabled = true
      btn.classList.add('inventory-card-btn-upgrade-max')
      btn.classList.remove('inventory-card-btn-upgrade-expensive')
    } else {
      btn.innerHTML = ''
      // Текст: при переходе в новую лигу — "Открыть X лигу", иначе — "Прокачать"
      if (progress.level >= MAX_TIER_LEVEL && next.nextTier !== progress.tier) {
        const label = getTierNameByNumber(next.nextTier)
        btn.append(`Открыть ${label} лигу · ${formatMoney(cost)}`, createCreditIcon(10))
      } else {
        btn.append(`Прокачать · ${formatMoney(cost)}`, createCreditIcon(10))
      }
      btn.classList.remove('inventory-card-btn-upgrade-max')
      if (!affordable) {
        btn.disabled = true
        btn.classList.add('inventory-card-btn-upgrade-expensive')
      } else {
        btn.disabled = false
        btn.classList.remove('inventory-card-btn-upgrade-expensive')
      }
    }
  }
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

  // Закладка тира для персонала
  if (item.type === 'staff') {
    const rawStaff = getStaffById(item.id)
    if (rawStaff) {
      const tierKey = getStaffTierImageKey(rawStaff, getState().staffUpgrades)
      const tierSrc = tierImages[tierKey]
      if (tierSrc) {
        const bookmark = document.createElement('img')
        bookmark.className = 'staff-tier-bookmark'
        bookmark.src = tierSrc
        bookmark.alt = ''
        bookmark.draggable = false
        card.appendChild(bookmark)
      }
    }
  }

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

  // Скорость (если есть) — отображаем звёздочками (уровень внутри тира 0-10)
  if (item.speed !== undefined) {
    const speed = document.createElement('div')
    speed.className = 'inventory-card-speed'
    // Для персонала показываем level внутри тира, а не total speed
    let starsCount: number
    if (item.type === 'staff') {
      const rawStaff = getStaffById(item.id)
      if (rawStaff) {
        const progress = getStaffTierProgress(rawStaff, getState().staffUpgrades)
        starsCount = Math.max(0, Math.min(10, progress.level))
      } else {
        starsCount = Math.max(0, Math.min(10, item.speed))
      }
    } else {
      starsCount = Math.max(0, Math.min(10, item.speed))
    }
    speed.textContent = '⭐'.repeat(starsCount) + '☆'.repeat(10 - starsCount)
    card.appendChild(speed)
  }

  // Кликабельные карточки: персонал (назначить/продать), снаряжение и техника (только продать)
  const expandable = (item.type === 'staff' && onAssign && onSell)
    || ((item.type === 'rigging' || item.type === 'equipment') && onSell)

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
