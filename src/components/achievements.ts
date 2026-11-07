import { achievements } from '../data/achievements.ts'
import { getAchievements, isAchievementUnlocked } from '../state/achievementsStore.ts'
import { interfaceIconImages } from '../assets/assetLoader.ts'
import { createModal } from '../utils/modalFactory.ts'
import { playSound } from '../state/audioManager.ts'

/** Текстовая заглушка вместо картинки */
function createPlaceholder(symbol: string): HTMLElement {
  const placeholder = document.createElement('div')
  placeholder.className = 'achievement-icon-placeholder'
  placeholder.textContent = symbol
  return placeholder
}

/**
 * Иконка ачивки: картинка из ассетов, либо текстовая заглушка,
 * если картинка ещё не добавлена (или не загрузилась).
 */
function createAchievementVisual(
  imageKey: string,
  alt: string,
  symbol: string,
  imageClass: string
): HTMLElement {
  const src = interfaceIconImages[imageKey]
  if (!src) return createPlaceholder(symbol)

  const img = document.createElement('img')
  img.className = imageClass
  img.src = src
  img.alt = alt
  img.draggable = false
  img.onerror = () => img.replaceWith(createPlaceholder(symbol))
  return img
}

/**
 * Показывает модалку с деталями одной ачивки.
 * Оверлей вкладывается в оверлей вкладки: он удаляется вместе с ним
 * и гарантированно перекрывает game-bottom-bar.
 */
function showAchievementDetail(host: HTMLElement, ach: (typeof achievements)[number]): void {
  createModal(host, {
    overlayClass: 'achievement-detail-overlay',
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'achievement-detail-modal'

      // Кнопка закрытия
      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.className = 'modal-close-btn achievement-detail-close'
      closeBtn.textContent = '×'
      closeBtn.addEventListener('click', () => {
        playSound('click')
        onClose()
      })
      modal.appendChild(closeBtn)

      modal.appendChild(
        createAchievementVisual(ach.imageKey, ach.title, '🏆', 'achievement-detail-image')
      )

      // Название
      const name = document.createElement('div')
      name.className = 'achievement-detail-name'
      name.textContent = ach.title
      modal.appendChild(name)

      // Описание
      const desc = document.createElement('div')
      desc.className = 'achievement-detail-desc'
      desc.textContent = ach.description
      modal.appendChild(desc)

      return modal
    },
  })
}

/**
 * Рендерит сетку иконок достижений.
 * Закрытые ачивки — приглушённые и не кликабельные,
 * открытые — цветные, по клику открывается карточка с описанием.
 * Заголовок вкладки рисует game-modal-header, поэтому здесь его нет.
 */
export function renderAchievementsModal(): HTMLElement & { cleanup: () => void } {
  const modal = document.createElement('div')
  modal.className = 'achievements-modal'

  const unlocked = Object.values(getAchievements()).filter((s) => s === 'unlocked').length
  const total = achievements.length

  const info = document.createElement('div')
  info.className = 'achievements-info'
  info.textContent = total > 0 ? `${unlocked} / ${total}` : 'Пока нет достижений'
  modal.appendChild(info)

  if (total === 0) {
    const empty = document.createElement('div')
    empty.className = 'achievements-empty'
    empty.textContent = 'Достижения будут добавлены в будущих обновлениях'
    modal.appendChild(empty)
  } else {
    const grid = document.createElement('div')
    grid.className = 'achievements-grid'

    for (const ach of achievements) {
      const unlockedState = isAchievementUnlocked(ach.id)

      const icon = document.createElement('div')
      icon.className = 'achievement-icon'
      if (unlockedState) {
        icon.classList.add('achievement-icon-unlocked')
        icon.title = ach.title
      }

      icon.appendChild(
        createAchievementVisual(
          ach.imageKey,
          unlockedState ? ach.title : '???',
          unlockedState ? '🏆' : '🔒',
          'achievement-icon-image'
        )
      )

      if (unlockedState) {
        icon.addEventListener('click', () => {
          playSound('click')
          // Оверлей вкладки — общий родитель для модалки вкладок и карточки ачивки
          const host = (icon.closest('.game-modal-overlay') as HTMLElement | null) ?? modal
          showAchievementDetail(host, ach)
        })
      }

      grid.appendChild(icon)
    }

    modal.appendChild(grid)
  }

  const result = modal as unknown as HTMLElement & { cleanup: () => void }
  result.cleanup = () => {}
  return result
}
