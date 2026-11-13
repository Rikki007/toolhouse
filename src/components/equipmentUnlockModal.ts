import { createModal } from '../utils/modalFactory.ts'
import { getState, subscribe } from '../state/state.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { playSound } from '../state/audioManager.ts'

/** Запись о разблокированной технике */
interface EquipmentUnlock {
  id: string
  type: 'orderPicker' | 'reachTruck'
  name: string
  unlockLevel: number
  notified: boolean
}

/** Список техники, о которой нужно уведомить при достижении уровня */
const EQUIPMENT_UNLOCKS: EquipmentUnlock[] = [
  { id: 'orderpicker_4', type: 'orderPicker', name: 'Премиум ордерпикер', unlockLevel: 17, notified: false },
  { id: 'reachtruck_eq_7', type: 'reachTruck', name: 'Премиальный ричтрак', unlockLevel: 19, notified: false },
]

export function startEquipmentUnlockObserver(container: HTMLElement): () => void {
  let showing = false

  const checkUnlocks = (): void => {
    if (showing) return
    const state = getState()
    const playerLevel = levelFromXp(state.xpMoney)

    // Находим первую непрочитанную разблокировку
    const unlock = EQUIPMENT_UNLOCKS.find(
      (u) => u.unlockLevel <= playerLevel && !u.notified
    )

    if (!unlock) return

    // Отмечаем как уведомлённую
    unlock.notified = true

    showing = true
    showEquipmentUnlockModal(unlock, container, () => {
      showing = false
      checkUnlocks() // проверяем следующую разблокировку
    })
  }

  return subscribe(checkUnlocks)
}

function getUnlockTitle(unlock: EquipmentUnlock): string {
  return unlock.type === 'orderPicker'
    ? '🚜 Новый ордерпикер доступен!'
    : '🏗️ Новый ричтрак доступен!'
}

/** Показывает модальное окно разблокировки техники */
function showEquipmentUnlockModal(
  unlock: EquipmentUnlock,
  container: HTMLElement,
  onClosed: () => void
): void {
  createModal(container, {
    overlayClass: 'equipment-unlock-modal-overlay',
    closeOnOverlayClick: false,
    onClose: onClosed,
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'equipment-unlock-modal'

      const title = document.createElement('h3')
      title.className = 'equipment-unlock-title'
      title.textContent = getUnlockTitle(unlock)
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
