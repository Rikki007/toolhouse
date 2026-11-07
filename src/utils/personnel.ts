import type { PersonnelSlot } from '../types/shifts.ts'
import type { Staff, ShiftStaff, Rigging } from '../types/equipment.ts'
import { getShiftPersonnel, removeStaffFromShift, setStaffEquipmentSlot } from '../state/shiftsStore.ts'
import { getStaffById, getRiggingById } from '../utils/itemLookup.ts'
import { getRiggingImage } from '../utils/assets.ts'
import { pickerImages, richDriversImages, mastersImages } from '../assets/assetLoader.ts'
import { getState } from '../state/state.ts'
import { createModal } from '../utils/modalFactory.ts'
import { getStaffSpeed } from './staffUpgrades.ts'
import { playSound } from '../state/audioManager.ts'
import { createQualificationRow, createStaffUpgradeButton } from '../components/staffUpgradeButton.ts'
import { createMasterUpgradeButton, getMasterTitle, getMasterLevelImageKey } from '../components/masterUpgradeButton.ts'
import { shiftMasters } from '../data/staff.ts'
import { masterLevelImages } from '../assets/assetLoader.ts'

export const FORKLIFT_SLOTS: PersonnelSlot[] = [
  { id: 'forklift-1', role: 'forklift', label: 'Водитель ричтрака 1' },
  { id: 'forklift-2', role: 'forklift', label: 'Водитель ричтрака 2' },
  { id: 'forklift-3', role: 'forklift', label: 'Водитель ричтрака 3' },
  { id: 'forklift-4', role: 'forklift', label: 'Водитель ричтрака 4' },
]

export const ASSEMBLER_SLOTS: PersonnelSlot[] = [
  { id: 'picker-1', role: 'picker', label: 'Сборщик 1' },
  { id: 'picker-2', role: 'picker', label: 'Сборщик 2' },
  { id: 'picker-3', role: 'picker', label: 'Сборщик 3' },
  { id: 'picker-4', role: 'picker', label: 'Сборщик 4' },
  { id: 'picker-5', role: 'picker', label: 'Сборщик 5' },
]

/**
  * Рендерит модальное окно с деталями сотрудника и слотами снаряжения.
  */
/**
 * Рендерит модальное окно с деталями сотрудника и слотами снаряжения.
 */
function renderStaffDetailModal(
  container: HTMLElement,
  staffInfo: Staff,
  shiftStaff: ShiftStaff,
  shiftId: number,
  role: 'forklift' | 'picker',
  slotIndex: number,
  onClose: () => void
): HTMLElement {
  const modal = document.createElement('div')
  modal.className = 'staff-detail-modal'

  // Заголовок — только кнопка закрытия
  const header = document.createElement('div')
  header.className = 'staff-detail-modal-header'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'modal-close-btn staff-detail-modal-close'
  closeBtn.textContent = '×'
  closeBtn.addEventListener('click', () => {
    playSound('click')
    onClose()
  })
  header.appendChild(closeBtn)

  modal.appendChild(header)

  const body = document.createElement('div')
  body.className = 'staff-detail-modal-body'

  // Аватар
  const avatarKey = staffInfo.avatar
  const imageSrc = avatarKey ? (pickerImages[avatarKey] || richDriversImages[avatarKey]) : ''
  if (imageSrc) {
    const image = document.createElement('img')
    image.className = 'staff-detail-avatar'
    image.src = imageSrc
    image.alt = staffInfo.name
    image.onerror = () => {
      image.style.display = 'none'
      const placeholder = document.createElement('div')
      placeholder.className = 'staff-detail-avatar-placeholder'
      placeholder.textContent = '👤'
      body.appendChild(placeholder)
    }
    body.appendChild(image)
  } else {
    const placeholder = document.createElement('div')
    placeholder.className = 'staff-detail-avatar-placeholder'
    placeholder.textContent = '👤'
    body.appendChild(placeholder)
  }

  // Имя
  const nameEl = document.createElement('div')
  nameEl.className = 'staff-detail-name'
  nameEl.textContent = staffInfo.name
  body.appendChild(nameEl)

  // Должность
  const positionEl = document.createElement('div')
  positionEl.className = 'staff-detail-position'
  positionEl.textContent = staffInfo.position
  body.appendChild(positionEl)

  // Скорость
  const speedEl = document.createElement('div')
  speedEl.className = 'staff-detail-speed'
  const starsCount = getStaffSpeed(staffInfo, getState().staffUpgrades)
  speedEl.textContent = '⭐'.repeat(starsCount) + '☆'.repeat(10 - starsCount)
  body.appendChild(speedEl)

  // Квалификация и кнопка прокачки
  body.appendChild(createQualificationRow(staffInfo))
  const upgradeBtn = createStaffUpgradeButton(staffInfo, () => {
    rerenderStaffDetail(container, staffInfo.id, shiftId, role, slotIndex, onClose)
  })
  if (upgradeBtn) body.appendChild(upgradeBtn)

  // Секция снаряжения
  const equipmentTitle = document.createElement('div')
  equipmentTitle.className = 'staff-detail-equipment-title'
  equipmentTitle.textContent = 'Снаряжение'
  body.appendChild(equipmentTitle)

  // Три слота снаряжения в ряд
  const equipmentGrid = document.createElement('div')
  equipmentGrid.className = 'staff-detail-equipment-grid'

  const equipmentSlots: Array<{ key: 'headdress' | 'uniform' | 'tool'; label: string }> = [
    { key: 'headdress', label: 'Каска' },
    { key: 'uniform', label: 'Униформа' },
    { key: 'tool', label: 'Терминал' },
  ]

  for (const eqSlot of equipmentSlots) {
    const slot = document.createElement('div')
    slot.className = 'staff-detail-equipment-slot'

    const riggingId = shiftStaff.slots[eqSlot.key]
    if (riggingId) {
      const rigging = getRiggingById(riggingId)
      if (rigging) {
        // Рендерим картинку вместо текста
        const img = document.createElement('img')
        img.className = 'staff-detail-equipment-slot-image'
        img.src = getRiggingImage(rigging.image)
        img.alt = rigging.name
        img.onerror = () => { img.style.display = 'none' }
        slot.appendChild(img)
        slot.classList.add('staff-detail-equipment-slot-filled')
      } else {
        slot.textContent = eqSlot.label
      }
    } else {
      slot.textContent = eqSlot.label
    }

    // Сохраняем текущий ID в dataset
    slot.dataset.riggingId = riggingId ?? ''

    // Клик по слоту — открыть список снаряжения
    slot.addEventListener('click', () => {
      playSound('click')
      openEquipmentSelectorModal(
        container,
        eqSlot.key,
        riggingId,
        shiftId,
        role,
        slotIndex,
        // Функция ререндера модалки сотрудника
        () => rerenderStaffDetail(container, staffInfo.id, shiftId, role, slotIndex, onClose)
      )
    })

    equipmentGrid.appendChild(slot)
  }

  body.appendChild(equipmentGrid)
  modal.appendChild(body)
  return modal
}

/** Перерендерить модалку сотрудника с новыми данными из стейта */
function rerenderStaffDetail(
  container: HTMLElement,
  staffId: string,
  shiftId: number,
  role: 'forklift' | 'picker',
  slotIndex: number,
  onClose: () => void
): void {
  const overlay = container.querySelector('.staff-detail-overlay') as HTMLElement | null
  if (!overlay) return

  const newStaffInfo = getStaffById(staffId)
  if (!newStaffInfo) return

  const personnel = getShiftPersonnel(shiftId)
  const currentStaff = role === 'forklift'
    ? personnel.reachTruckDrivers[slotIndex]
    : personnel.pickers[slotIndex]
  const newShiftStaff: ShiftStaff = typeof currentStaff === 'string'
    ? { id: currentStaff, slots: { headdress: null, uniform: null, tool: null } }
    : currentStaff

  // Создаем новую модалку
  const newModal = renderStaffDetailModal(container, newStaffInfo, newShiftStaff, shiftId, role, slotIndex, onClose)
  // Заменяем содержимое оверлея (модалку) на новую
  const oldModal = overlay.querySelector('.staff-detail-modal')
  if (oldModal) {
    oldModal.replaceWith(newModal)
  } else {
    overlay.appendChild(newModal)
  }
}

/** Открыть модальное окно выбора снаряжения */
function openEquipmentSelectorModal(
  container: HTMLElement,
  equipmentSlot: 'headdress' | 'uniform' | 'tool',
  currentRiggingId: string | null,
  shiftId: number,
  role: 'forklift' | 'picker',
  slotIndex: number,
  onRerender: () => void  // функция ререндера модалки сотрудника
): void {
  const state = getState()
  const slotLabels: Record<string, string> = {
    headdress: 'Каска',
    uniform: 'Униформа',
    tool: 'Терминал',
  }

  // Звук зависит от типа слота: каска / униформа / терминал
  const slotSound: Record<'headdress' | 'uniform' | 'tool', string> = {
    headdress: 'helmet',
    uniform: 'closes',
    tool: 'terminal',
  }
  const equipSound = slotSound[equipmentSlot]

  // Получаем ID снаряжения из инвентаря
  const inventoryRiggingIds = state.inventory.rigging
  // Фильтруем по типу
  const availableRigging: Rigging[] = []
  for (const id of inventoryRiggingIds) {
    const rigging = getRiggingById(id)
    if (rigging && rigging.type === equipmentSlot) {
      availableRigging.push(rigging)
    }
  }

  createModal(container, {
    overlayClass: 'equipment-selector-overlay',
    renderContent: (onCloseModal) => {
      const modal = document.createElement('div')
      modal.className = 'equipment-selector-modal'

      // Заголовок
      const header = document.createElement('div')
      header.className = 'equipment-selector-modal-header'

      const title = document.createElement('h3')
      title.className = 'equipment-selector-modal-title'
      title.textContent = `Выбор: ${slotLabels[equipmentSlot]}`
      header.appendChild(title)

      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.className = 'modal-close-btn equipment-selector-modal-close'
      closeBtn.textContent = '×'
      closeBtn.addEventListener('click', () => {
        playSound('click')
        onCloseModal()
      })
      header.appendChild(closeBtn)

      modal.appendChild(header)

      const body = document.createElement('div')
      body.className = 'equipment-selector-modal-body'

      // Кнопка "Снять" (если что-то надето)
      if (currentRiggingId) {
        const removeBtn = document.createElement('button')
        removeBtn.type = 'button'
        removeBtn.className = 'equipment-selector-remove-btn'
        removeBtn.textContent = 'Снять'
        removeBtn.addEventListener('click', () => {
          playSound(equipSound)
          setStaffEquipmentSlot(shiftId, role, slotIndex, equipmentSlot, null)
          onCloseModal()
          onRerender()  // ререндерим модалку сотрудника после снятия
        })
        body.appendChild(removeBtn)
      }

      // Список снаряжения
      if (availableRigging.length === 0) {
        const empty = document.createElement('div')
        empty.className = 'equipment-selector-empty'
        empty.textContent = 'Нет доступного снаряжения'
        body.appendChild(empty)
      } else {
        for (const rigging of availableRigging) {
          const item = document.createElement('div')
          item.className = 'equipment-selector-item'
          if (rigging.id === currentRiggingId) {
            item.classList.add('equipment-selector-item-selected')
          }

          // Иконка
          const img = document.createElement('img')
          img.className = 'equipment-selector-item-image'
          img.src = getRiggingImage(rigging.image)
          img.alt = rigging.name
          img.onerror = () => { img.style.display = 'none' }
          item.appendChild(img)

          // Название
          const nameEl = document.createElement('div')
          nameEl.className = 'equipment-selector-item-name'
          nameEl.textContent = rigging.name
          item.appendChild(nameEl)

          item.addEventListener('click', () => {
            playSound(equipSound)
            setStaffEquipmentSlot(shiftId, role, slotIndex, equipmentSlot, rigging.id)
            onCloseModal()
            onRerender()  // ререндерим модалку сотрудника после выбора
          })

          body.appendChild(item)
        }
      }

      modal.appendChild(body)
      return modal
    },
  })
}

 /**
   * Создаёт карточку сотрудника (похожую на shop-card).
   */
  function createStaffCard(
    staffId: string,
    _shiftStaff: ShiftStaff,
    shiftId: number,
    role: 'forklift' | 'picker',
    slotIndex: number
  ): HTMLElement {
    const staff = getStaffById(staffId)
    if (!staff) {
      return document.createElement('div')
    }

    const card = document.createElement('div')
    card.className = 'shifts-personnel-card'
    card.dataset.staffId = staffId

   // Аватар
   const avatarKey = staff.avatar
   const imageSrc = avatarKey ? (pickerImages[avatarKey] || richDriversImages[avatarKey]) : ''
   if (imageSrc) {
     const image = document.createElement('img')
     image.className = 'shifts-personnel-card-image'
     image.src = imageSrc
     image.alt = staff.name
     image.onerror = () => {
       image.style.display = 'none'
       const placeholder = document.createElement('div')
       placeholder.className = 'shifts-personnel-card-avatar'
       placeholder.textContent = '👤'
       card.appendChild(placeholder)
     }
     card.appendChild(image)
   } else {
     const placeholder = document.createElement('div')
     placeholder.className = 'shifts-personnel-card-avatar'
     placeholder.textContent = '👤'
     card.appendChild(placeholder)
   }

   // Имя
   const nameEl = document.createElement('div')
   nameEl.className = 'shifts-personnel-card-name'
   nameEl.textContent = staff.name
   card.appendChild(nameEl)

   // Скорость
   const speedEl = document.createElement('div')
   speedEl.className = 'shifts-personnel-card-speed'
   const starsCount = getStaffSpeed(staff, getState().staffUpgrades)
   speedEl.textContent = '⭐'.repeat(starsCount) + '☆'.repeat(10 - starsCount)
   card.appendChild(speedEl)

     // Клик по карточке — открыть модалку с деталями
     card.addEventListener('click', () => {
      playSound('click')
      const container = document.querySelector('.game-screen') as HTMLElement | null
      if (!container) return

      const staffInfo = getStaffById(staffId)
      if (!staffInfo) return

      // Берём актуальные данные из стейта при каждом открытии
      const personnel = getShiftPersonnel(shiftId)
      const currentStaff = role === 'forklift'
        ? personnel.reachTruckDrivers[slotIndex]
        : personnel.pickers[slotIndex]
      const shiftStaff: ShiftStaff = typeof currentStaff === 'string'
        ? { id: currentStaff, slots: { headdress: null, uniform: null, tool: null } }
        : currentStaff

      createModal(container, {
        overlayClass: 'staff-detail-overlay',
        renderContent: (onClose) => renderStaffDetailModal(container, staffInfo, shiftStaff, shiftId, role, slotIndex, onClose),
      })
    })

  // Кнопка "Снять"
  const removeBtn = document.createElement('button')
  removeBtn.type = 'button'
  removeBtn.className = 'modal-close-btn shifts-personnel-card-remove'
  removeBtn.textContent = '×'
  removeBtn.title = 'Снять со смены'
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    playSound('click')
    removeStaffFromShift(shiftId, role, slotIndex)
    // Перерендерим всю секцию
    const grid = card.closest('.shifts-personnel-grid')
    if (grid) {
      grid.innerHTML = ''
      const slots = role === 'forklift' ? FORKLIFT_SLOTS : ASSEMBLER_SLOTS
      for (let i = 0; i < slots.length; i++) {
        grid.appendChild(createPersonnelCard(slots[i], shiftId, i))
      }
    }
  })
  card.appendChild(removeBtn)

  return card
}

/**
 * Создаёт пустую карточку-слот.
 */
function createEmptySlotCard(
  slot: PersonnelSlot,
  _shiftId: number
): HTMLElement {
  const card = document.createElement('div')
  card.className = 'shifts-personnel-card'
  card.dataset.slotId = slot.id
  card.style.opacity = '0.6'

  const status = document.createElement('div')
  status.className = 'shifts-personnel-card-status'
  status.textContent = 'Свободно'
  card.appendChild(status)

  return card
}

/**
 * Рендерит карточку персонала с учётом назначенного сотрудника.
 */
export function createPersonnelCard(
  slot: PersonnelSlot,
  shiftId: number,
  slotIndex: number
): HTMLElement {
  const personnel = getShiftPersonnel(shiftId)
  const assignedStaff = slot.role === 'forklift'
    ? personnel.reachTruckDrivers[slotIndex]
    : personnel.pickers[slotIndex]

  if (assignedStaff) {
    // Если сотрудник назначен — рендерим карточку сотрудника
    const staffId = typeof assignedStaff === 'string' ? assignedStaff : assignedStaff.id
    return createStaffCard(staffId, assignedStaff, shiftId, slot.role, slotIndex)
  } else {
    // Если слот пустой — рендерим пустую карточку-слот
    return createEmptySlotCard(slot, shiftId)
  }
}

/**
 * Создаёт карточку мастера смены.
 * Обновление блока после прокачки выполняет подписка на стейт в shiftsModal.
 * @param masterId ID мастера
 * @param shiftCost Стоимость смены (для расчёта цены прокачки)
 */
export function createMasterCard(masterId: string, shiftCost: number): HTMLElement {
  const card = document.createElement('div')
  card.className = 'shifts-master-card'

  // Находим данные мастера
  const masterData = shiftMasters.find(m => m.id === masterId)

  // Аватар — ищем по masterId
  const avatarImg = mastersImages[masterId]

  if (avatarImg) {
    const image = document.createElement('img')
    image.className = 'shifts-master-card-image'
    image.src = avatarImg
    image.alt = masterData?.name ?? 'Мастер'
    image.onerror = () => {
      image.style.display = 'none'
      const placeholder = document.createElement('div')
      placeholder.className = 'shifts-master-card-avatar'
      placeholder.textContent = '👷'
      card.appendChild(placeholder)
    }
    card.appendChild(image)
  } else {
    const placeholder = document.createElement('div')
    placeholder.className = 'shifts-master-card-avatar'
    placeholder.textContent = '👷'
    card.appendChild(placeholder)
  }

  // Иконка уровня мастера (левый верхний угол)
  const levelKey = getMasterLevelImageKey(masterId)
  const levelImgSrc = masterLevelImages[levelKey]
  if (levelImgSrc) {
    const levelImg = document.createElement('img')
    levelImg.className = 'shifts-master-card-level'
    levelImg.src = levelImgSrc
    levelImg.alt = 'Уровень мастера'
    levelImg.draggable = false
    card.appendChild(levelImg)
  }

  // Имя и должность
  if (masterData) {
    const info = document.createElement('div')
    info.className = 'shifts-master-card-info'

    const nameEl = document.createElement('div')
    nameEl.className = 'shifts-master-card-name'
    nameEl.textContent = masterData.name
    info.appendChild(nameEl)

    // Звание мастера
    const titleEl = document.createElement('div')
    titleEl.className = 'shifts-master-card-title'
    titleEl.textContent = getMasterTitle(masterId)
    info.appendChild(titleEl)

    card.appendChild(info)
  }

  // Кнопка прокачки: блок перерисует подписка на стейт в shiftsModal
  card.appendChild(createMasterUpgradeButton(masterId, shiftCost))

  return card
}
