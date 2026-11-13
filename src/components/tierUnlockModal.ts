import { createModal } from '../utils/modalFactory.ts'
import { getState, updateState, subscribe } from '../state/state.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { playSound } from '../state/audioManager.ts'
import { STAFF_TIERS } from '../data/staffUpgrades.ts'
import { tierImages } from '../assets/assetLoader.ts'

/** Запись о разблокированной лиге */
interface TierUnlock {
  tier: number
  name: string
  imageKey: string
  unlockLevel: number
}

/** Список лиг, о которых нужно уведомить при достижении уровня игрока (кроме стартовой) */
const TIER_UNLOCKS: TierUnlock[] = STAFF_TIERS.slice(1).map((cfg, i) => ({
  tier: i + 2,
  name: cfg.name,
  imageKey: cfg.imageKey,
  unlockLevel: cfg.unlockLevel,
}))

/**
 * Наблюдатель за разблокировкой лиг персонала.
 * Показывает модалку при достижении уровня игрока, указанного в STAFF_TIERS.
 * Показанные лиги сохраняются в state, поэтому после перезагрузки не повторяются.
 * @returns функция отписки
 */
export function startTierUnlockObserver(container: HTMLElement): () => void {
  let showing = false

  const checkUnlocks = (): void => {
    if (showing) return
    const state = getState()
    const playerLevel = levelFromXp(state.xpMoney)
    const seen = state.tierUnlocksSeen ?? []

    const unlock = TIER_UNLOCKS.find(
      (u) => u.unlockLevel <= playerLevel && !seen.includes(u.tier)
    )

    if (!unlock) return

    // Помечаем лигу как показанную — модалка не появится снова
    updateState({ tierUnlocksSeen: [...seen, unlock.tier] })

    showing = true
    showTierUnlockModal(unlock, container, () => {
      showing = false
      checkUnlocks()
    })
  }

  return subscribe(checkUnlocks)
}

/** Показывает модальное окно разблокировки лиги */
function showTierUnlockModal(
  unlock: TierUnlock,
  container: HTMLElement,
  onClosed: () => void
): void {
  createModal(container, {
    overlayClass: 'tier-unlock-modal-overlay',
    closeOnOverlayClick: false,
    onClose: onClosed,
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'tier-unlock-modal'

      // Картинка закладки новой лиги
      const bookmarkSrc = tierImages[unlock.imageKey]
      if (bookmarkSrc) {
        const bookmark = document.createElement('img')
        bookmark.className = 'tier-unlock-bookmark'
        bookmark.src = bookmarkSrc
        bookmark.alt = unlock.name
        bookmark.draggable = false
        modal.appendChild(bookmark)
      }

      const title = document.createElement('h3')
      title.className = 'tier-unlock-title'
      title.textContent = `🌟 Открыта ${unlock.name} лига!`
      modal.appendChild(title)

      const desc = document.createElement('p')
      desc.className = 'tier-unlock-desc'
      desc.textContent = `Прокачка персонала до ${unlock.name.toLowerCase()} лиги доступна. Теперь сотрудников можно улучшить ещё на ${STAFF_TIERS[unlock.tier - 1].speedBonus} единиц скорости за уровень.`
      modal.appendChild(desc)

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'tier-unlock-btn'
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
