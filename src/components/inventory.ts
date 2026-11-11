import { getState } from '../state/state.ts'
import { createModal, showConfirmModal } from '../utils/modalFactory.ts'
import { createInventoryCard, type InventoryCardUpgrade } from '../utils/inventory.ts'
import { getItemById, getRiggingById, getStaffById } from '../utils/itemLookup.ts'
import { sellItem, removeStaffFromInventory, sellRiggingItem, sellTechniqueItem, upgradeStaff } from '../state/inventoryStore.ts'
import { MAX_STAFF_SPEED } from '../data/staffUpgrades.ts'
import { getStaffSpeed, getNextUpgrade } from '../utils/staffUpgrades.ts'
import { updateUpgradeCardUI } from '../utils/inventory.ts'
import { assignStaffToShift, getActiveShifts, getShiftSlotAvailability } from '../state/shiftsStore.ts'
import { playSound } from '../state/audioManager.ts'

let inventoryModalHandle: ReturnType<typeof createModal> | null = null

export function openInventoryModal(container: HTMLElement): void {
  if (inventoryModalHandle) {
    inventoryModalHandle.close()
    inventoryModalHandle = null
    return
  }

  inventoryModalHandle = createModal(container, {
    overlayClass: 'inventory-modal-overlay',
    renderContent: (onClose) => renderInventoryModal(container, onClose),
    onClose: () => {
      inventoryModalHandle = null
    },
  })
}

/** Открыть модальное окно выбора смены */
function openShiftSelector(staffId: string, role: 'forklift' | 'picker'): void {
  const container = document.querySelector('.game-screen') as HTMLElement | null
  if (!container) return

  const activeShifts = getActiveShifts()
  if (activeShifts.length === 0) {
    alert('Нет активных смен')
    return
  }

  // Получаем информацию о свободных слотах
  const slotAvailability = getShiftSlotAvailability(role)

  createModal(container, {
    overlayClass: 'shift-selector-overlay',
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'shift-selector-modal'

      const header = document.createElement('div')
      header.className = 'shift-selector-header'

      const title = document.createElement('h3')
      title.className = 'shift-selector-title'
      title.textContent = 'Выберите смену'
      header.appendChild(title)

      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.className = 'shift-selector-close'
      closeBtn.textContent = '×'
      closeBtn.addEventListener('click', () => {
        playSound('click')
        onClose()
      })
      header.appendChild(closeBtn)

      modal.appendChild(header)

      const body = document.createElement('div')
      body.className = 'shift-selector-body'

      // Список смен
      const shiftList = document.createElement('div')
      shiftList.className = 'shift-selector-list'

      for (const shift of activeShifts) {
        // Ищем доступные слоты для этой смены
        const avail = slotAvailability.find(a => a.shiftId === shift.id)
        const availableSlots = avail?.availableSlots ?? 0
        const isFull = availableSlots === 0

        const shiftItem = document.createElement('div')
        shiftItem.className = 'shift-selector-item'
        
        if (isFull) {
          // Смена заполнена — делаем неактивной
          shiftItem.classList.add('shift-selector-item-full')
          shiftItem.textContent = `${shift.label} (нет мест)`
        } else {
          // Смена свободна — показываем количество мест
          shiftItem.textContent = `${shift.label} (${availableSlots} мест)`
          shiftItem.addEventListener('click', () => {
            playSound('click')
            // Назначаем сотрудника
            const success = assignStaffToShift(shift.id, role, staffId)
            
            if (success) {
              // Удаляем из inventory
              removeStaffFromInventory(staffId)
              // Закрываем выбор смены
              onClose()
              // Перерендериваем инвентарь
              inventoryModalHandle?.close()
              openInventoryModal(container)
            } else {
              alert('Не удалось назначить сотрудника')
            }
          })
        }
        
        shiftList.appendChild(shiftItem)
      }

      body.appendChild(shiftList)
      modal.appendChild(body)
      return modal
    },
  })
}

/**
 * Собирает данные прокачки квалификации для карточки сотрудника.
 * undefined — сотрудника нет в каталоге.
 */
function buildStaffUpgrade(
  staffId: string,
  _container: HTMLElement,
  _onClose: () => void
): InventoryCardUpgrade | undefined {
  const staff = getStaffById(staffId)
  if (!staff) return undefined

  const state = getState()
  const next = getNextUpgrade(staff, state.staffUpgrades)

  return {
    level: getStaffSpeed(staff, state.staffUpgrades),
    maxLevel: MAX_STAFF_SPEED,
    cost: next?.cost ?? 0,
    affordable: next ? state.money >= next.cost : false,
    staffId,
    onUpgrade: () => {
      if (!upgradeStaff(staffId)) return
      // Обновляем карточку на месте — скролл не сбрасывается
      updateUpgradeCardUI(staffId)
    },
  }
}

function renderInventoryModal(container: HTMLElement, onClose: () => void): HTMLElement {
  const modal = document.createElement('div')
  modal.className = 'inventory-modal'

  // Заголовок
  const header = document.createElement('div')
  header.className = 'inventory-modal-header'

  const title = document.createElement('h3')
  title.className = 'inventory-modal-title'
  title.textContent = 'Инвентарь'
  header.appendChild(title)

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'modal-close-btn inventory-modal-close'
  closeBtn.textContent = '×'
  closeBtn.addEventListener('click', () => {
    playSound('click')
    onClose()
  })
  header.appendChild(closeBtn)

  modal.appendChild(header)

  const body = document.createElement('div')
  body.className = 'inventory-modal-body'

  // Загружаем инвентарь (купленные товары)
  const inventory = getState().inventory

  // Секция: Техника
  const transportSection = document.createElement('div')
  transportSection.className = 'inventory-section'

  const transportTitle = document.createElement('h4')
  transportTitle.className = 'inventory-section-title'
  transportTitle.textContent = 'Техника'
  transportSection.appendChild(transportTitle)

  const transportGrid = document.createElement('div')
  transportGrid.className = 'inventory-grid'

  // Собираем все ID техники
  const allTechIds = [
    ...inventory.equipment.orderPickers,
    ...inventory.equipment.reachTrucks,
  ]

  if (allTechIds.length === 0) {
    const emptySlot = document.createElement('div')
    emptySlot.className = 'inventory-empty-card'
    emptySlot.textContent = 'Пусто'
    transportGrid.appendChild(emptySlot)
  } else {
    for (const techId of allTechIds) {
      const item = getItemById(techId)
      if (item) {
        const card = createInventoryCard(
          item,
          undefined,
          () => {
            showConfirmModal(container, `Вы точно хотите продать "${item.name}"?`, () => {
              playSound('buy')
              sellTechniqueItem(techId)
              onClose()
              openInventoryModal(container)
            })
          }
        )
        transportGrid.appendChild(card)
      }
    }
  }

  transportSection.appendChild(transportGrid)
  body.appendChild(transportSection)

  // Секция: Сборщики
  const pickersSection = document.createElement('div')
  pickersSection.className = 'inventory-section'

  const pickersTitle = document.createElement('h4')
  pickersTitle.className = 'inventory-section-title'
  pickersTitle.textContent = 'Сборщики'
  pickersSection.appendChild(pickersTitle)

  const pickersGrid = document.createElement('div')
  pickersGrid.className = 'inventory-grid'

  const pickerIds = inventory.staff.pickers
  if (pickerIds.length === 0) {
    const emptyCard = document.createElement('div')
    emptyCard.className = 'inventory-empty-card'
    emptyCard.textContent = 'Нет сборщиков'
    pickersGrid.appendChild(emptyCard)
  } else {
    for (const pickerId of pickerIds) {
      const item = getItemById(pickerId, getState().staffUpgrades)
      if (item) {
        const card = createInventoryCard(
          item,
          () => {
            // Назначить — открываем выбор смены
            openShiftSelector(pickerId, 'picker')
          },
          () => {
            // Продажа требует подтверждения — сумма возврата зависит от состояния shop
            showConfirmModal(container, `Вы точно хотите продать "${item.name}"?`, () => {
              playSound('buy')
              // Продать — перемещаем в shop и возвращаем деньги
              sellItem(pickerId)
              // Перерисовываем модальное окно
              onClose()
              openInventoryModal(container)
            })
          },
          buildStaffUpgrade(pickerId, container, onClose)
        )
        pickersGrid.appendChild(card)
      }
    }
  }

  pickersSection.appendChild(pickersGrid)
  body.appendChild(pickersSection)

  // Секция: Водители ричтраков
  const driversSection = document.createElement('div')
  driversSection.className = 'inventory-section'

  const driversTitle = document.createElement('h4')
  driversTitle.className = 'inventory-section-title'
  driversTitle.textContent = 'Водители ричтраков'
  driversSection.appendChild(driversTitle)

  const driversGrid = document.createElement('div')
  driversGrid.className = 'inventory-grid'

  const driverIds = inventory.staff.reachTruckDrivers
  if (driverIds.length === 0) {
    const emptyCard = document.createElement('div')
    emptyCard.className = 'inventory-empty-card'
    emptyCard.textContent = 'Нет водителей'
    driversGrid.appendChild(emptyCard)
  } else {
    for (const driverId of driverIds) {
      const item = getItemById(driverId, getState().staffUpgrades)
      if (item) {
        const card = createInventoryCard(
          item,
          () => {
            // Назначить — открываем выбор смены
            openShiftSelector(driverId, 'forklift')
          },
          () => {
            // Продажа требует подтверждения — сумма возврата зависит от состояния shop
            showConfirmModal(container, `Вы точно хотите продать "${item.name}"?`, () => {
              playSound('buy')
              // Продать — перемещаем в shop и возвращаем деньги
              sellItem(driverId)
              // Перерисовываем модальное окно
              onClose()
              openInventoryModal(container)
            })
          },
          buildStaffUpgrade(driverId, container, onClose)
        )
        driversGrid.appendChild(card)
      }
    }
  }

  driversSection.appendChild(driversGrid)
  body.appendChild(driversSection)

  // Секция: Снаряжение
  const equipmentSection = document.createElement('div')
  equipmentSection.className = 'inventory-section'

  const equipmentTitle = document.createElement('h4')
  equipmentTitle.className = 'inventory-section-title'
  equipmentTitle.textContent = 'Снаряжение'
  equipmentSection.appendChild(equipmentTitle)

  const equipmentGrid = document.createElement('div')
  equipmentGrid.className = 'inventory-grid'

  const riggingIds = inventory.rigging ?? []
  if (riggingIds.length === 0) {
    const emptyCard = document.createElement('div')
    emptyCard.className = 'inventory-empty-card'
    emptyCard.textContent = 'Пусто'
    equipmentGrid.appendChild(emptyCard)
  } else {
    for (const riggingId of riggingIds) {
      const rigging = getRiggingById(riggingId)
      if (rigging) {
        const item = {
          id: rigging.id,
          name: rigging.name,
          type: 'rigging' as const,
          category: 'Снаряжение',
          cost: rigging.price,
          speed: rigging.speed,
          imageKey: rigging.image,
        }
        const card = createInventoryCard(
          item,
          undefined,
          () => {
            // Продать — удаляем из инвентаря и возвращаем деньги
            sellRiggingItem(riggingId)
            onClose()
            openInventoryModal(container)
          }
        )
        equipmentGrid.appendChild(card)
      }
    }
  }

  equipmentSection.appendChild(equipmentGrid)
  body.appendChild(equipmentSection)

  modal.appendChild(body)

  // Клик мимо карточек (карточки делают stopPropagation) — закрываем все раскрытые
  modal.addEventListener('click', () => {
    document.querySelectorAll('.inventory-card-expanded').forEach(c => {
      c.classList.remove('inventory-card-expanded')
      const btns = c.querySelector('.inventory-card-buttons') as HTMLElement | null
      if (btns) btns.style.display = 'none'
    })
  })

  return modal
}
