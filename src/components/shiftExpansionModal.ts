import { createModal } from '../utils/modalFactory.ts'
import { getState, updateState, subscribe } from '../state/state.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { playSound } from '../state/audioManager.ts'
import { interfaceIconImages } from '../assets/assetLoader.ts'
import { BASE_FORKLIFT_SLOTS, BASE_PICKER_SLOTS, SHIFT_EXPANSION_LEVELS } from '../data/shiftSlots.ts'

/** Запись о расширении смены */
interface ShiftExpansion {
  id: string
  level: number
  totalForklifts: number
  totalPickers: number
}

/** Список расширений смен: на каждом шаге +1 водитель и +1 сборщик */
const SHIFT_EXPANSIONS: ShiftExpansion[] = SHIFT_EXPANSION_LEVELS.map((level, index) => ({
  id: `shift_exp_${index + 1}`,
  level,
  totalForklifts: BASE_FORKLIFT_SLOTS + index + 1,
  totalPickers: BASE_PICKER_SLOTS + index + 1,
}))

/**
 * Наблюдатель за расширением смен.
 * Показывает модалку при достижении уровня игрока.
 * Показанные расширения сохраняются в state.
 * @returns функция отписки
 */
export function startShiftExpansionObserver(container: HTMLElement): () => void {
  let showing = false

  const checkExpansions = (): void => {
    if (showing) return
    const state = getState()
    const playerLevel = levelFromXp(state.xpMoney)
    const seen = state.shiftExpansionSeen ?? []

    const expansion = SHIFT_EXPANSIONS.find(
      (e) => e.level <= playerLevel && !seen.includes(e.id)
    )

    if (!expansion) return

    updateState({ shiftExpansionSeen: [...seen, expansion.id] })

    showing = true
    showShiftExpansionModal(expansion, container, () => {
      showing = false
      checkExpansions()
    })
  }

  return subscribe(checkExpansions)
}

/** Показывает модальное окно расширения смен */
function showShiftExpansionModal(
  expansion: ShiftExpansion,
  container: HTMLElement,
  onClosed: () => void
): void {
  const iconSrc = interfaceIconImages['shifts']

  createModal(container, {
    overlayClass: 'shift-expansion-modal-overlay',
    closeOnOverlayClick: false,
    onClose: onClosed,
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'shift-expansion-modal'

      if (iconSrc) {
        const iconImg = document.createElement('img')
        iconImg.className = 'shift-expansion-icon'
        iconImg.src = iconSrc
        iconImg.alt = 'Смены'
        iconImg.draggable = false
        modal.appendChild(iconImg)
      }

      const title = document.createElement('h3')
      title.className = 'shift-expansion-title'
      title.textContent = 'Смены расширены!'
      modal.appendChild(title)

      const desc = document.createElement('p')
      desc.className = 'shift-expansion-desc'
      desc.textContent = `Количество слотов увеличено: водителей ричтраков — до ${expansion.totalForklifts}, сборщиков — до ${expansion.totalPickers}.`
      modal.appendChild(desc)

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'shift-expansion-btn'
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
