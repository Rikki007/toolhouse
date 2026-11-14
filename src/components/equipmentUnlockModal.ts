import { createModal } from '../utils/modalFactory.ts'
import { getState, updateState, subscribe } from '../state/state.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { playSound } from '../state/audioManager.ts'
import { interfaceIconImages } from '../assets/assetLoader.ts'

/** Запись о разблокированной технике */
interface EquipmentUnlock {
  id: string
  type: 'orderPicker' | 'reachTruck'
  name: string
  unlockLevel: number
  /** Ключ иконки из interfaceIconImages */
  iconKey: string
}

/** Список техники, о которой нужно уведомить при достижении уровня */
const EQUIPMENT_UNLOCKS: EquipmentUnlock[] = [
  { id: 'orderpicker_4', type: 'orderPicker', name: 'Премиум ордерпикер', unlockLevel: 17, iconKey: 'orderpickers' },
  { id: 'reachtruck_eq_7', type: 'reachTruck', name: 'Премиальный ричтрак', unlockLevel: 19, iconKey: 'forclifts' },
]

export function startEquipmentUnlockObserver(container: HTMLElement): () => void {
  let showing = false

  const checkUnlocks = (): void => {
    if (showing) return
    const state = getState()
    const playerLevel = levelFromXp(state.xpMoney)
    const seen = state.equipmentUnlocksSeen ?? []

    // Находим первую непрочитанную разблокировку
    const unlock = EQUIPMENT_UNLOCKS.find(
      (u) => u.unlockLevel <= playerLevel && !seen.includes(u.id)
    )

    if (!unlock) return

    // Помечаем технику как показанную — модалка не появится снова
    updateState({ equipmentUnlocksSeen: [...seen, unlock.id] })

    showing = true
    showEquipmentUnlockModal(unlock, container, () => {
      showing = false
      checkUnlocks() // проверяем следующую разблокировку
    })
  }

  return subscribe(checkUnlocks)
}

/** Показывает модальное окно разблокировки техники */
function showEquipmentUnlockModal(
  unlock: EquipmentUnlock,
  container: HTMLElement,
  onClosed: () => void
): void {
  const iconSrc = interfaceIconImages[unlock.iconKey]

  createModal(container, {
    overlayClass: 'equipment-unlock-modal-overlay',
    closeOnOverlayClick: false,
    onClose: onClosed,
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'equipment-unlock-modal'

      // Иконка техники
      if (iconSrc) {
        const iconImg = document.createElement('img')
        iconImg.className = 'equipment-unlock-icon'
        iconImg.src = iconSrc
        iconImg.alt = unlock.name
        iconImg.draggable = false
        modal.appendChild(iconImg)
      }

      const title = document.createElement('h3')
      title.className = 'equipment-unlock-title'
      title.textContent = `Новый ${unlock.type === 'orderPicker' ? 'ордерпикер' : 'ричтрак'} доступен!`
      modal.appendChild(title)

      const desc = document.createElement('p')
      desc.className = 'equipment-unlock-desc'
      desc.textContent = `${unlock.name} теперь доступен в магазине!`
      modal.appendChild(desc)

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'equipment-unlock-btn'
      btn.textContent = 'Отлично!'
      btn.addEventListener('click', () => {
        playSound('click')
        onClose()
      })
      modal.appendChild(btn)

      return modal
    },
  })

  playSound('levelUp')
}
