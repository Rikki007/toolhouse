import { createModal } from '../utils/modalFactory.ts'
import { getState, updateState, subscribe } from '../state/state.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { playSound } from '../state/audioManager.ts'
import { interfaceIconImages, tierImages } from '../assets/assetLoader.ts'
import { getEquipmentById } from '../utils/itemLookup.ts'
import { STAFF_TIERS } from '../data/staffUpgrades.ts'

/**
 * Комбинированное событие разблокировки: на одном уровне игрока появляются
 * и новая техника в магазине, и новая лига прокачки персонала.
 */
interface CombinedUnlock {
  /** Уникальный ключ события для отметки «прочитано» */
  id: string
  unlockLevel: number
  /** ID техники, появляющейся в магазине на этом уровне */
  equipmentIds: string[]
  /** Номер лиги (1-based индекс в STAFF_TIERS), либо null если лига не открывается */
  tier: number | null
}

/**
 * Техника и лиги персонала открываются на одних и тех же уровнях (20/25/30/35),
 * поэтому показываем их одним окном. Номера лиг соответствуют STAFF_TIERS:
 * рубиновая=5, изумрудная=6, алмазная=7, премиум=8.
 */
const COMBINED_UNLOCKS: CombinedUnlock[] = [
  { id: 'unlock-20', unlockLevel: 20, equipmentIds: ['orderpicker_4', 'reachtruck_eq_7'], tier: 5 },
  { id: 'unlock-25', unlockLevel: 25, equipmentIds: ['orderpicker_5', 'reachtruck_eq_8'], tier: 6 },
  { id: 'unlock-30', unlockLevel: 30, equipmentIds: ['orderpicker_6', 'reachtruck_eq_9'], tier: 7 },
  { id: 'unlock-35', unlockLevel: 35, equipmentIds: ['orderpicker_7', 'reachtruck_eq_10'], tier: 8 },
]

/** Номера лиг, о которых уведомляет комбинированное окно — tierUnlockModal их пропускает */
export const COMBINED_TIER_LEVELS: number[] = COMBINED_UNLOCKS
  .map((u) => u.tier)
  .filter((t): t is number => t !== null)

export function startEquipmentUnlockObserver(container: HTMLElement): () => void {
  let showing = false

  const checkUnlocks = (): void => {
    if (showing) return
    const state = getState()
    const playerLevel = levelFromXp(state.xpMoney)
    const seenEquip = state.equipmentUnlocksSeen ?? []

    // Находим первое непрочитанное комбинированное событие
    const unlock = COMBINED_UNLOCKS.find(
      (u) => u.unlockLevel <= playerLevel && !seenEquip.includes(u.id)
    )

    if (!unlock) return

    showing = true

    // Отмечаем событие и связанную лигу прочитанными, чтобы окна не дублировались
    const patch: { equipmentUnlocksSeen: string[]; tierUnlocksSeen?: number[] } = {
      equipmentUnlocksSeen: [...seenEquip, unlock.id],
    }
    if (unlock.tier !== null) {
      const seenTier = state.tierUnlocksSeen ?? []
      if (!seenTier.includes(unlock.tier)) {
        patch.tierUnlocksSeen = [...seenTier, unlock.tier]
      }
    }
    updateState(patch)

    showCombinedUnlockModal(unlock, container, () => {
      showing = false
      checkUnlocks() // проверяем следующее разблокированное событие
    })
  }

  return subscribe(checkUnlocks)
}

/** Показывает комбинированное окно: новая техника + новая лига персонала */
function showCombinedUnlockModal(
  unlock: CombinedUnlock,
  container: HTMLElement,
  onClosed: () => void
): void {
  const tierCfg = unlock.tier !== null ? STAFF_TIERS[unlock.tier - 1] : undefined
  const equipmentNames = unlock.equipmentIds
    .map((id) => getEquipmentById(id)?.name)
    .filter((name): name is string => Boolean(name))

  createModal(container, {
    overlayClass: 'equipment-unlock-modal-overlay',
    closeOnOverlayClick: false,
    onClose: onClosed,
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'equipment-unlock-modal'

      // Ряд иконок: закладка лиги + категории техники
      const imagesRow = document.createElement('div')
      imagesRow.className = 'equipment-unlock-images'

      if (tierCfg) {
        const bookmarkSrc = tierImages[tierCfg.imageKey]
        if (bookmarkSrc) {
          const bookmark = document.createElement('img')
          bookmark.className = 'equipment-unlock-image'
          bookmark.src = bookmarkSrc
          bookmark.alt = tierCfg.name
          bookmark.draggable = false
          imagesRow.appendChild(bookmark)
        }
      }

      for (const iconKey of ['orderpickers', 'forclifts']) {
        const iconSrc = interfaceIconImages[iconKey]
        if (!iconSrc) continue
        const iconImg = document.createElement('img')
        iconImg.className = 'equipment-unlock-image'
        iconImg.src = iconSrc
        iconImg.alt = ''
        iconImg.draggable = false
        imagesRow.appendChild(iconImg)
      }

      if (imagesRow.childNodes.length > 0) {
        modal.appendChild(imagesRow)
      }

      const title = document.createElement('h3')
      title.className = 'equipment-unlock-title'
      title.textContent = tierCfg
        ? '🌟 Новая техника и новая лига!'
        : 'Новая техника доступна!'
      modal.appendChild(title)

      const desc = document.createElement('p')
      desc.className = 'equipment-unlock-desc'
      const parts: string[] = []
      if (equipmentNames.length > 0) {
        parts.push(`В магазине появилась новая техника: ${equipmentNames.join(', ')}.`)
      }
      if (tierCfg) {
        parts.push(
          `Открыта ${tierCfg.name.toLowerCase()} лига прокачки персонала — сотрудников можно улучшить ещё на ${tierCfg.speedBonus} единиц скорости за уровень.`
        )
      }
      desc.textContent = parts.join(' ')
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
