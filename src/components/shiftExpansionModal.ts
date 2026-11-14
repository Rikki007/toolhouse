import { createModal } from '../utils/modalFactory.ts'
import { getState, updateState, subscribe } from '../state/state.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { playSound } from '../state/audioManager.ts'
import { interfaceIconImages } from '../assets/assetLoader.ts'

/** Запись о расширении смены */
interface ShiftExpansion {
  id: string
  level: number
  totalForklifts: number
  totalPickers: number
}

/** Список расширений смен: 4→5→6→7→8 водителей, 5→6→7→8→9 сборщиков */
const SHIFT_EXPANSIONS: ShiftExpansion[] = [
  { id: 'shift_exp_1', level: 22, totalForklifts: 5, totalPickers: 6 },
  { id: 'shift_exp_2', level: 27, totalForklifts: 6, totalPickers: 7 },
  { id: 'shift_exp_3', level: 32, totalForklifts: 7, totalPickers: 8 },
  { id: 'shift_exp_4', level: 37, totalForklifts: 8, totalPickers: 9 },
]

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
