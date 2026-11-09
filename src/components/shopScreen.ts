import type { Equipment, Staff, Rigging } from '../types/index.ts'
import { pickerImages, richDriversImages, interfaceIconImages } from '../assets/assetLoader.ts'
import { getEquipmentImage, getRiggingImage } from '../utils/assets.ts'
import { createPriceElement, formatMoney } from '../utils/format.ts'
import { createProgressBar } from '../utils/progressBar.ts'
import { showErrorModal } from '../utils/modalFactory.ts'
import { createShopOverlay } from '../utils/shopModalFactory.ts'
import coinImage from '../assets/coin/1.png'
import { getState, updateState } from '../state/state.ts'
import { addItemToShop, isItemPurchased } from '../state/inventoryStore.ts'
import { getEquipmentById, getStaffById, getRiggingById } from '../utils/itemLookup.ts'
import { playSound } from '../state/audioManager.ts'

const SHOP_CATEGORIES = [
  { id: 'orderPickers', label: 'Ордерпикеры', icon: interfaceIconImages['orderpickers'] },
  { id: 'reachTrucks', label: 'Ричтраки', icon: interfaceIconImages['forclifts'] },
  { id: 'pickers', label: 'Сборщики', icon: interfaceIconImages['pickers'] },
  { id: 'reachTruckDrivers', label: 'Водители ричтраков', icon: interfaceIconImages['forcliftDriver'] },
  { id: 'rigging', label: 'Снаряжение', icon: interfaceIconImages['rigging'] },
]

function updateMoneyDisplay(container: HTMLElement): void {
  const el = container.querySelector('.game-money')
  if (el) {
    el.textContent = formatMoney(getState().money)
  }
}

/**
 * Создаёт карточку товара магазина.
 */
function createCard(item: Equipment | Staff | Rigging, categoryId: 'orderPickers' | 'reachTrucks' | 'pickers' | 'reachTruckDrivers' | 'rigging', container: HTMLElement): HTMLElement {
  const card = document.createElement('div')
  card.className = 'shop-card'

  // Снаряжение
  if (categoryId === 'rigging') {
    const rig = item as Rigging
    const imageSrc = getRiggingImage(rig.image)
    if (imageSrc) {
      const image = document.createElement('img')
      image.className = 'shop-card-image'
      image.src = imageSrc
      image.alt = rig.name
      image.onerror = () => {
        image.style.display = 'none'
        const placeholder = document.createElement('div')
        placeholder.className = 'shop-card-image-placeholder'
        placeholder.textContent = '🪖'
        card.insertBefore(placeholder, card.firstChild)
      }
      card.appendChild(image)
    } else {
      const imagePlaceholder = document.createElement('div')
      imagePlaceholder.className = 'shop-card-image'
      imagePlaceholder.textContent = '🪖'
      card.appendChild(imagePlaceholder)
    }
  }

  // Техника
  if (categoryId === 'orderPickers' || categoryId === 'reachTrucks') {
    const equip = item as Equipment
    const imageSrc = getEquipmentImage(equip.image)
    if (imageSrc) {
      const image = document.createElement('img')
      image.className = 'shop-card-image'
      image.src = imageSrc
      image.alt = equip.name
      image.onerror = () => {
        image.style.display = 'none'
        const placeholder = document.createElement('div')
        placeholder.className = 'shop-card-image-placeholder'
        placeholder.textContent = '📷'
        card.insertBefore(placeholder, card.firstChild)
      }
      card.appendChild(image)
    } else {
      const imagePlaceholder = document.createElement('div')
      imagePlaceholder.className = 'shop-card-image'
      imagePlaceholder.textContent = '📷'
      card.appendChild(imagePlaceholder)
    }
  }

  // Персонал
  if (categoryId === 'pickers' || categoryId === 'reachTruckDrivers') {
    const staff = item as Staff
    const avatarKey = staff.avatar
    const imageSrc = avatarKey ? (pickerImages[avatarKey] || richDriversImages[avatarKey]) : ''
    if (imageSrc) {
      const image = document.createElement('img')
      image.className = 'shop-card-image'
      image.src = imageSrc
      image.alt = staff.name
      image.onerror = () => {
        image.style.display = 'none'
        const placeholder = document.createElement('div')
        placeholder.className = 'shop-card-image-placeholder'
        placeholder.textContent = '👤'
        card.insertBefore(placeholder, card.firstChild)
      }
      card.appendChild(image)
    } else {
      const imagePlaceholder = document.createElement('div')
      imagePlaceholder.className = 'shop-card-image'
      imagePlaceholder.textContent = '👤'
      card.appendChild(imagePlaceholder)
    }
  }

  const name = document.createElement('h3')
  name.className = 'shop-card-name'
  name.textContent = item.name
  card.appendChild(name)

  const price = createPriceElement(
    categoryId === 'orderPickers' || categoryId === 'reachTrucks' 
      ? (item as Equipment).price 
      : categoryId === 'rigging'
        ? (item as Rigging).price
        : (item as Staff).cost,
    coinImage
  )
  price.className = 'shop-card-price'
  card.appendChild(price)

  // Прогресс-бары для техники и персонала
  if (categoryId === 'orderPickers' || categoryId === 'reachTrucks') {
    const equip = item as Equipment
    const speedValue = equip.speed ?? 0
    card.appendChild(createProgressBar('Скорость', speedValue))
  } else if (categoryId === 'pickers' || categoryId === 'reachTruckDrivers') {
    const staff = item as Staff
    const speedValue = staff.baseSpeed ?? 0
    card.appendChild(createProgressBar('Скорость', speedValue))
  } else if (categoryId === 'rigging') {
    const rig = item as Rigging
    const speedValue = rig.speed ?? 0
    card.appendChild(createProgressBar('Скорость', speedValue))
  }

  // Кнопка покупки
  const buyBtn = document.createElement('button')
  buyBtn.type = 'button'
  buyBtn.className = 'shop-card-buy'
  buyBtn.textContent = 'Купить'
  buyBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation()
    const priceNum = categoryId === 'orderPickers' || categoryId === 'reachTrucks'
      ? (item as Equipment).price
      : categoryId === 'rigging'
        ? (item as Rigging).price
        : (item as Staff).cost
    const currentMoney = getState().money
    
    // Проверка: достаточно ли денег
    if (currentMoney < priceNum) {
      playSound('message')
      showErrorModal(container, 'Недостаточно средств')
      return
    }

    // Звук покупки — деньги есть, покупка состоится
    playSound('buy')
    
    if (categoryId === 'orderPickers' || categoryId === 'reachTrucks') {
      // ===== ЛОГИКА ПОКУПКИ ТЕХНИКИ =====
      updateState({ money: currentMoney - priceNum })
      addItemToShop(item.id)
      openCategory(categoryId, container)
      updateMoneyDisplay(container)
      return
    }
    
    if (categoryId === 'rigging') {
      // ===== ЛОГИКА ПОКУПКИ СНАРЯЖЕНИЯ =====
      updateState({ money: currentMoney - priceNum })
      addItemToShop(item.id)
      openCategory(categoryId, container)
      updateMoneyDisplay(container)
      return
    }
    
    // ===== ЛОГИКА ПОКУПКИ ПЕРСОНАЛА =====
    const staffItem = item as Staff
    updateState({ money: currentMoney - priceNum })
    addItemToShop(staffItem.id)
    openCategory(categoryId, container)
    updateMoneyDisplay(container)
  })
  card.appendChild(buyBtn)
  
  return card
}

export function renderShopModal(container: HTMLElement): HTMLElement {
  const content = document.createElement('div')
  content.className = 'shop-container'

  for (const cat of SHOP_CATEGORIES) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'shop-category-btn'
    const iconImg = document.createElement('img')
    iconImg.className = 'shop-category-icon'
    iconImg.src = cat.icon
    iconImg.alt = cat.label
    const labelEl = document.createElement('span')
    labelEl.className = 'shop-category-label'
    labelEl.textContent = cat.label
    btn.appendChild(iconImg)
    btn.appendChild(labelEl)
    btn.addEventListener('click', () => {
      playSound('click')
      openCategory(cat.id as 'orderPickers' | 'reachTrucks' | 'pickers' | 'reachTruckDrivers' | 'rigging', container)
    })
    content.appendChild(btn)
  }

  return content
}

function openCategory(categoryId: 'orderPickers' | 'reachTrucks' | 'pickers' | 'reachTruckDrivers' | 'rigging', container: HTMLElement): void {
  // Берём ID из state.shop
  const shop = getState().shop
  let idList: string[] = []
  
  if (categoryId === 'orderPickers') {
    idList = shop.equipment.orderPickers
  } else if (categoryId === 'reachTrucks') {
    idList = shop.equipment.reachTrucks
  } else if (categoryId === 'pickers') {
    idList = shop.staff.pickers
  } else if (categoryId === 'reachTruckDrivers') {
    idList = shop.staff.reachTruckDrivers
  } else if (categoryId === 'rigging') {
    idList = shop.rigging
  }

  // Преобразуем ID в полные объекты
  let items: Array<Equipment | Staff | Rigging> = []
  if (categoryId === 'pickers' || categoryId === 'reachTruckDrivers') {
    items = idList
      .map(id => getStaffById(id))
      .filter((item): item is NonNullable<typeof item> => item !== undefined)
      .filter(item => item.purpose === 'shop')
      .filter(item => !isItemPurchased(item.id))
  } else if (categoryId === 'rigging') {
    items = idList
      .map(id => getRiggingById(id))
      .filter((item): item is NonNullable<typeof item> => item !== undefined)
      .sort((a, b) => {
        const order: Record<string, number> = { headdress: 1, uniform: 2, tool: 3 }
        return (order[a.type] ?? 99) - (order[b.type] ?? 99)
      })
  } else {
    items = idList
      .map(id => getEquipmentById(id))
      .filter((item): item is NonNullable<typeof item> => item !== undefined)
  }

  createShopOverlay(container, (onClose) => {
    const modal = document.createElement('div')
    modal.className = 'shop-modal'

    const header = document.createElement('div')
    header.className = 'shop-modal-header'

    const title = document.createElement('h2')
    title.className = 'shop-modal-title'
    title.textContent = SHOP_CATEGORIES.find(c => c.id === categoryId)?.label ?? ''
    header.appendChild(title)

    const closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'shop-modal-close'
    closeBtn.innerHTML = '×'
    closeBtn.addEventListener('click', () => {
      playSound('click')
      onClose()
    })
    header.appendChild(closeBtn)

    modal.appendChild(header)

    const itemsGrid = document.createElement('div')
    itemsGrid.className = 'shop-items-grid'

    if (items.length === 0) {
      const emptyCard = document.createElement('div')
      emptyCard.className = 'shop-card'
      emptyCard.style.textAlign = 'center'
      emptyCard.style.padding = '2rem'
      emptyCard.style.opacity = '0.5'
      emptyCard.style.color = '#999'
      emptyCard.textContent = categoryId === 'rigging' 
        ? 'Нет доступного снаряжения' 
        : categoryId === 'pickers' || categoryId === 'reachTruckDrivers' 
          ? 'Нет доступного персонала' 
          : 'Нет доступной техники'
      itemsGrid.appendChild(emptyCard)
    } else {
      for (const item of items) {
        const card = createCard(item, categoryId, container)
        itemsGrid.appendChild(card)
      }
    }

    modal.appendChild(itemsGrid)
    return modal
  })
}

