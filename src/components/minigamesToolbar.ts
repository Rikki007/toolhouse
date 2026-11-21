import { createLootBoxAnimation } from '../effects/lootBoxAnimation.ts'
import { showPreloader, hidePreloader } from './preloader.ts'
import { renderShiftsButton, updateShiftsButton } from './shiftsModal.ts'
import { renderShiftsModal } from './shiftsModal.ts'
import { createModal } from '../utils/modalFactory.ts'
import { openInventoryModal } from './inventory.ts'
import { renderNewsModal } from './newsModal.ts'
import { getState, updateState, subscribe, markNewsRead } from '../state/state.ts'
import { interfaceIconImages } from '../assets/assetLoader.ts'
import { getRandomLootBoxReward } from '../data/lootBoxRewards.ts'
import { sellLootboxReward, getAllStaffIds } from '../state/inventoryStore.ts'
import { getStaffCategory } from '../state/inventoryStore.ts'
import { getStaffById, getRiggingById } from '../utils/itemLookup.ts'
import { createRewardCardForStaff, createRewardCardForRigging } from '../utils/rewardCard.ts'
import { playSound } from '../state/audioManager.ts'
import { formatMoney } from '../utils/format.ts'
// Кулдаун лутбокса: 5 секунд (5000 мс)
const LOOTBOX_COOLDOWN = 10 * 60 * 1000

/**
 * Рендерит тулбар с мини-играми, лутбоксами и сменами
 */
export function renderGameToolbar(container: HTMLElement): HTMLElement {
  const toolbar = document.createElement('div')
  toolbar.className = 'game-toolbar'

  // Кнопка "Лутбоксы"
  const lootBoxBtn = document.createElement('button')
  lootBoxBtn.type = 'button'
  lootBoxBtn.className = 'toolbar-btn'
  lootBoxBtn.innerHTML = `
    <span class="toolbar-btn-icon">
      <img src="${interfaceIconImages['lootbox']}" alt="Лутбоксы">
    </span>
  `
  
  // Обновляем состояние кнопки лутбокса
  function updateLootBoxButton(): void {
    const state = getState()
    const lastClaim = state.lootboxLastClaim ?? 0
    const timeSinceClaim = Date.now() - lastClaim
    const remaining = Math.max(0, LOOTBOX_COOLDOWN - timeSinceClaim)
    
    if (remaining > 0) {
      // На кулдауне
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      lootBoxBtn.disabled = true
      lootBoxBtn.style.opacity = '0.5'
      lootBoxBtn.innerHTML = `
        <span class="toolbar-btn-icon">
          <img src="${interfaceIconImages['lootbox']}" alt="Лутбоксы">
        </span>
        <span class="toolbar-btn-label">${minutes}:${seconds.toString().padStart(2, '0')}</span>
      `
    } else {
      // Готова к использованию
      lootBoxBtn.disabled = false
      lootBoxBtn.style.opacity = '1'
      lootBoxBtn.innerHTML = `
        <span class="toolbar-btn-icon">
          <img src="${interfaceIconImages['lootbox']}" alt="Лутбоксы">
        </span>
      `
    }
  }
  
  // Обновляем каждую секунду
  setInterval(updateLootBoxButton, 1000)
  updateLootBoxButton() // Первый вызов сразу
  
  lootBoxBtn.addEventListener('click', () => {
    const state = getState()
    const lastClaim = state.lootboxLastClaim ?? 0
    const timeSinceClaim = Date.now() - lastClaim
    
    if (timeSinceClaim < LOOTBOX_COOLDOWN) {
      // На кулдауне — показываем сообщение
      const remaining = Math.ceil((LOOTBOX_COOLDOWN - timeSinceClaim) / 1000)
      alert(`Лутбокс будет доступен через ${remaining} сек`)
      return
    }
    
    // Обновляем timestamp
    updateState({ lootboxLastClaim: Date.now() })
    playSound('lootbox')
    openLootBoxAnimation(container)
  })
  
  toolbar.appendChild(lootBoxBtn)

  // Кнопка "Инвентарь"
  const inventoryBtn = document.createElement('button')
  inventoryBtn.type = 'button'
  inventoryBtn.className = 'toolbar-btn'
  inventoryBtn.setAttribute('aria-label', 'Инвентарь')
  inventoryBtn.innerHTML = `
    <span class="toolbar-btn-icon">
      <img src="${interfaceIconImages['inventory']}" alt="Инвентарь">
    </span>
  `
  inventoryBtn.addEventListener('click', () => {
    playSound('click')
    openInventoryModal(container)
  })
  toolbar.appendChild(inventoryBtn)

  // Кнопка "Смены"
  const shiftsBtn = renderShiftsButton(() => {
    playSound('click')
    openShiftsModal(container)
  })
  toolbar.appendChild(shiftsBtn)

  // Кнопка "Новости" с индикатором непрочитанных событий
  toolbar.appendChild(createNewsButton(container))

  container.appendChild(toolbar)
  return toolbar
}

// ===== Вспомогательные функции для карточек наград =====

async function openLootBoxAnimation(container: HTMLElement): Promise<void> {
  // Показываем прелоадер
  const preloader = showPreloader(container)

  // Создаём модальное окно для анимации
  const modalOverlay = document.createElement('div')
  modalOverlay.className = 'lootbox-modal-overlay'

  const modal = document.createElement('div')
  modal.className = 'lootbox-modal'

  // Контейнер для кнопок (показываются после награды)
  const closeBtn = document.createElement('div')
  closeBtn.style.display = 'none'
  closeBtn.style.gap = '12px'
  closeBtn.style.marginTop = '16px'
  closeBtn.style.justifyContent = 'center'

  // Анимация (внутри preloadLootBoxImages, картинки загружаются в кэш)
  const animation = await createLootBoxAnimation(300, () => {
    // После завершения анимации — показываем награду
    modal.removeChild(animation)

    // Получаем случайную награду
    const reward = getRandomLootBoxReward()

    if (reward.type === 'money') {
      // Деньги — показываем сообщение
      const message = document.createElement('div')
      message.className = 'lootbox-result'
      message.textContent = `Вы получили ${formatMoney(reward.amount)}!`
      modal.appendChild(message)

      // Только кнопка "Забрать"
      const btnTake = document.createElement('button')
      btnTake.type = 'button'
      btnTake.className = 'lootbox-modal-close'
      btnTake.textContent = 'Забрать'
      btnTake.style.background = 'rgba(74, 222, 128, 0.15)'
      btnTake.style.border = '1px solid rgba(74, 222, 128, 0.3)'
      btnTake.style.color = '#4ade80'
      btnTake.style.padding = '8px 20px'
        btnTake.addEventListener('click', () => {
          updateState({ money: getState().money + reward.amount })
          modalOverlay.remove()
        })
      closeBtn.appendChild(btnTake)
    } else if (reward.type === 'staff') {
      // Персонал — проверяем, есть ли уже в инвентаре или сменах
      const allStaffIds = getAllStaffIds()
      const staffId = reward.id
      const isDuplicate = allStaffIds.includes(staffId)

      if (isDuplicate) {
        // Персонал уже есть — выдаём деньги
        const staff = getStaffById(staffId)
        const cashAmount = staff?.cost ?? 0

        const message = document.createElement('div')
        message.className = 'lootbox-result'
        message.textContent = `Вы получили ${formatMoney(cashAmount)}!`
        modal.appendChild(message)

        const btnTake = document.createElement('button')
        btnTake.type = 'button'
        btnTake.className = 'lootbox-modal-close'
        btnTake.textContent = 'Забрать'
        btnTake.style.background = 'rgba(74, 222, 128, 0.15)'
        btnTake.style.border = '1px solid rgba(74, 222, 128, 0.3)'
        btnTake.style.color = '#4ade80'
        btnTake.style.padding = '8px 20px'
        btnTake.addEventListener('click', () => {
          updateState({ money: getState().money + cashAmount })
          modalOverlay.remove()
        })
        closeBtn.appendChild(btnTake)
      } else {
        // Новый сотрудник — показываем карточку
        const staff = getStaffById(staffId)
        if (staff) {
          const card = createRewardCardForStaff(staff)
          modal.appendChild(card)

          // Две кнопки: "Забрать" и "Продать"
          const btnTake = document.createElement('button')
          btnTake.type = 'button'
          btnTake.className = 'lootbox-modal-close'
          btnTake.textContent = 'Забрать'
          btnTake.style.background = 'rgba(74, 222, 128, 0.15)'
          btnTake.style.border = '1px solid rgba(74, 222, 128, 0.3)'
          btnTake.style.color = '#4ade80'
          btnTake.style.padding = '8px 20px'
          btnTake.addEventListener('click', () => {
            const inventory = getState().inventory
            const staffCat = getStaffCategory(staffId)
            if (!staffCat) {
              modalOverlay.remove()
              return
            }

            const currentList = [...inventory.staff[staffCat], staffId]

            updateState({
              inventory: {
                ...inventory,
                staff: {
                  ...inventory.staff,
                  [staffCat]: currentList,
                },
              },
            })
            modalOverlay.remove()
          })

          const btnSell = document.createElement('button')
          btnSell.type = 'button'
          btnSell.className = 'lootbox-modal-close'
          btnSell.textContent = 'Продать'
          btnSell.style.background = 'rgba(255, 68, 68, 0.15)'
          btnSell.style.border = '1px solid rgba(255, 68, 68, 0.3)'
          btnSell.style.color = '#ff4444'
          btnSell.style.padding = '8px 20px'
          btnSell.addEventListener('click', () => {
            sellLootboxReward(reward)
            modalOverlay.remove()
          })

          closeBtn.appendChild(btnTake)
          closeBtn.appendChild(btnSell)
        }
      }
    } else if (reward.type === 'rigging') {
      // Снаряжение — показываем карточку (НЕ добавляем в inventory пока)
      const rig = getRiggingById(reward.id)
      if (rig) {
        const card = createRewardCardForRigging(rig)
        modal.appendChild(card)

        // Две кнопки: "Забрать" и "Продать"
        const btnTake = document.createElement('button')
        btnTake.type = 'button'
        btnTake.className = 'lootbox-modal-close'
        btnTake.textContent = 'Забрать'
        btnTake.style.background = 'rgba(74, 222, 128, 0.15)'
        btnTake.style.border = '1px solid rgba(74, 222, 128, 0.3)'
        btnTake.style.color = '#4ade80'
        btnTake.style.padding = '8px 20px'
        btnTake.addEventListener('click', () => {
          const inventory = getState().inventory
          const currentRigging = [...(inventory.rigging ?? []), reward.id]
          updateState({
            inventory: {
              ...inventory,
              rigging: currentRigging,
            },
          })
          modalOverlay.remove()
        })

        const btnSell = document.createElement('button')
        btnSell.type = 'button'
        btnSell.className = 'lootbox-modal-close'
        btnSell.textContent = 'Продать'
        btnSell.style.background = 'rgba(255, 68, 68, 0.15)'
        btnSell.style.border = '1px solid rgba(255, 68, 68, 0.3)'
        btnSell.style.color = '#ff4444'
        btnSell.style.padding = '8px 20px'
        btnSell.addEventListener('click', () => {
          sellLootboxReward(reward)
          modalOverlay.remove()
        })

        closeBtn.appendChild(btnTake)
        closeBtn.appendChild(btnSell)
      }
    }

    closeBtn.style.display = 'flex'
  })

  // Скрываем прелоадер после загрузки картинок
  hidePreloader(preloader)

  modal.appendChild(animation)
  modal.appendChild(closeBtn)

  modalOverlay.appendChild(modal)
  container.appendChild(modalOverlay)
}

// ===== Новости =====

/** Отписка от обновлений стейта для индикатора кнопки новостей */
let newsUnsubscribe: (() => void) | null = null

let newsModalHandle: ReturnType<typeof createModal> | null = null

/** Кнопка «Новости»: открывает список событий, индикатор горит при непрочитанных */
function createNewsButton(container: HTMLElement): HTMLElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'toolbar-btn news-toolbar-btn'
  btn.setAttribute('aria-label', 'Новости')
  btn.innerHTML = `
    <span class="toolbar-btn-icon news-toolbar-icon">
      <img src="${interfaceIconImages['news']}" alt="Новости">
    </span>
    <span class="department-indicator"></span>
  `

  const indicator = btn.querySelector('.department-indicator') as HTMLElement | null

  // Следим за появлением новых новостей: звук + индикатор
  let previousCount = getState().news.length
  const updateIndicator = () => {
    if (!indicator) return
    const count = getState().news.length
    if (count > previousCount) {
      // Появилась новая новость
      playSound('message')
      previousCount = count
    }
    indicator.classList.toggle('department-indicator-available', count > 0)
  }

  // Пересоздаём подписку, чтобы не копить слушатели при повторном входе в игру
  newsUnsubscribe?.()
  newsUnsubscribe = subscribe(updateIndicator)

  btn.addEventListener('click', () => {
    playSound('click')
    openNewsModal(container)
  })
  return btn
}

/** Открывает модалку новостей; при закрытии события помечаются прочитанными */
function openNewsModal(container: HTMLElement): void {
  if (newsModalHandle) {
    newsModalHandle.close()
    newsModalHandle = null
    return
  }

  const ids = getState().news.map((item) => item.id)

  newsModalHandle = createModal(container, {
    overlayClass: 'news-modal-overlay',
    renderContent: (onClose) => renderNewsModal(onClose),
    onClose: () => {
      markNewsRead(ids)
      newsModalHandle = null
    },
  })
}

// ===== Смены =====

let shiftsModalHandle: ReturnType<typeof createModal> | null = null

function openShiftsModal(container: HTMLElement): void {
  if (shiftsModalHandle) {
    shiftsModalHandle.close()
    shiftsModalHandle = null
    return
  }

  shiftsModalHandle = createModal(container, {
    overlayClass: 'shifts-modal-overlay',
    renderContent: (onClose) =>
      renderShiftsModal(() => {
        onClose()
        const shiftsBtn = document.querySelector('.shifts-toolbar-btn')
        if (shiftsBtn) {
          updateShiftsButton(shiftsBtn as HTMLElement)
        }
      }),
    onClose: () => {
      shiftsModalHandle = null
    },
  })
}

// ===== Инвентарь =====

// Экспортируется из src/components/inventory.ts
export { openInventoryModal } from './inventory.ts'

