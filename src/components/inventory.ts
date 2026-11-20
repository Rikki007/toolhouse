import { getState } from '../state/state.ts'
import { createModal, showConfirmModal } from '../utils/modalFactory.ts'
import { createInventoryCard, type InventoryCardUpgrade } from '../utils/inventory.ts'
import { getItemById, getRiggingById, getStaffById } from '../utils/itemLookup.ts'
import { sellItem, removeStaffFromInventory, sellRiggingItem, sellTechniqueItem, upgradeStaff, sellItemAll, sellRiggingItemAll, sellTechniqueItemAll } from '../state/inventoryStore.ts'
import { MAX_TIER_LEVEL } from '../data/staffUpgrades.ts'
import { getStaffTierProgress, getNextUpgrade } from '../utils/staffUpgrades.ts'
import { updateUpgradeCardUI } from '../utils/inventory.ts'
import { assignStaffToShift, getActiveShifts, getShiftSlotAvailability } from '../state/shiftsStore.ts'
import { playSound } from '../state/audioManager.ts'
import { levelFromXp } from '../data/playerLevels.ts'

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
              // Перерисовываем инвентарь на месте — скролл не сбрасывается
              refreshInventory(container)
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
function buildStaffUpgrade(staffId: string): InventoryCardUpgrade | undefined {
  const staff = getStaffById(staffId)
  if (!staff) return undefined

  const state = getState()
  const playerLevel = levelFromXp(state.xpMoney)
  const progress = getStaffTierProgress(staff, state.staffUpgrades)
  const next = getNextUpgrade(staff, state.staffUpgrades, playerLevel)

  return {
    level: progress.level,
    maxLevel: MAX_TIER_LEVEL,
    tier: progress.tier,
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
  renderInventoryBody(body, container)
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

/**
 * Группирует одинаковые ID: возвращает массив { id, count }.
 * Сохраняет порядок первого появления каждого ID.
 */
function groupIds(ids: string[]): { id: string; count: number }[] {
  const groups: { id: string; count: number }[] = []
  const index = new Map<string, number>()
  for (const id of ids) {
    const at = index.get(id)
    if (at === undefined) {
      index.set(id, groups.length)
      groups.push({ id, count: 1 })
    } else {
      groups[at].count++
    }
  }
  return groups
}

/**
 * Перерисовывает содержимое инвентаря на месте, сохраняя позицию прокрутки.
 * Полное пересоздание окна сбрасывало скролл к началу страницы.
 */
function refreshInventory(container: HTMLElement): void {
  const body = document.querySelector<HTMLElement>('.inventory-modal .inventory-modal-body')
  if (!body) return

  const scrollTop = body.scrollTop
  renderInventoryBody(body, container)
  body.scrollTop = scrollTop
}

/**
 * Заполняет тело окна инвентаря секциями.
 * Вызывается и при первом рендере, и при обновлении после продажи/назначения.
 */
function renderInventoryBody(body: HTMLElement, container: HTMLElement): void {
  body.replaceChildren()

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
    // Одинаковая техника складывается в одну карточку со счётчиком
    for (const { id: techId, count } of groupIds(allTechIds)) {
      const item = getItemById(techId)
      if (item) {
        const card = createInventoryCard(
          item,
          undefined,
          () => {
            showConfirmModal(container, `Вы точно хотите продать "${item.name}"?`, () => {
              playSound('buy')
              sellTechniqueItem(techId)
              refreshInventory(container)
            })
          },
          undefined,
          {
            count,
            onSellAll: () => {
              showConfirmModal(container, `Вы точно хотите продать все "${item.name}" (${count})?`, () => {
                playSound('buy')
                sellTechniqueItemAll(techId)
                refreshInventory(container)
              })
            },
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
    // Одинаковые сотрудники складываются в одну карточку со счётчиком
    for (const { id: pickerId, count } of groupIds(pickerIds)) {
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
              refreshInventory(container)
            })
          },
          buildStaffUpgrade(pickerId),
          {
            count,
            onSellAll: () => {
              showConfirmModal(container, `Вы точно хотите продать все "${item.name}" (${count})?`, () => {
                playSound('buy')
                sellItemAll(pickerId)
                refreshInventory(container)
              })
            },
          }
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
    // Одинаковые водители складываются в одну карточку со счётчиком
    for (const { id: driverId, count } of groupIds(driverIds)) {
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
              refreshInventory(container)
            })
          },
          buildStaffUpgrade(driverId),
          {
            count,
            onSellAll: () => {
              showConfirmModal(container, `Вы точно хотите продать все "${item.name}" (${count})?`, () => {
                playSound('buy')
                sellItemAll(driverId)
                refreshInventory(container)
              })
            },
          }
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
    // Одинаковое снаряжение складывается в одну карточку со счётчиком
    for (const { id: riggingId, count } of groupIds(riggingIds)) {
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
            // Продать — удаляем одну копию из инвентаря и возвращаем деньги
            sellRiggingItem(riggingId)
            refreshInventory(container)
          },
          undefined,
          {
            count,
            onSellAll: () => {
              sellRiggingItemAll(riggingId)
              refreshInventory(container)
            },
          }
        )
        equipmentGrid.appendChild(card)
      }
    }
  }

  equipmentSection.appendChild(equipmentGrid)
  body.appendChild(equipmentSection)
}
