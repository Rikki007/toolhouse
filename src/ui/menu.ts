import { startCarAnimationBack, startCarAnimationFront } from '../effects/carAnimation.ts'
import { initPixiBackground } from '../effects/pixiBackground.ts'
import { createBackgroundContainer } from '../utils/domFactory.ts'
import { menuItems, type MenuItem } from '../data/menu.ts'
import { playSound } from '../state/audioManager.ts'

export type MenuAction = MenuItem['id']

export interface MenuHandlers {
  onPlay?: () => void
  onTutorial?: () => void
  onSettings?: () => void
  onAbout?: () => void
  onShare?: () => void
}

/**
 * Диспетчер действий меню через record-маппинг.
 */
function handleMenuAction(action: MenuAction, handlers: MenuHandlers): void {
  const actions: Record<string, () => void> = {
    play: () => handlers.onPlay?.(),
    tutorial: () => handlers.onTutorial?.(),
    settings: () => handlers.onSettings?.(),
    about: () => handlers.onAbout?.(),
    share: () => handlers.onShare?.(),
  }
  actions[action]?.()
}

export async function renderMenu(container: HTMLElement, handlers: MenuHandlers = {}): Promise<{ cleanup: () => void }> {
  container.style.position = 'relative'
  container.style.overflow = 'hidden'
  container.style.width = '100%'
  container.style.height = '100%'

  const bgContainer = createBackgroundContainer()
  container.insertBefore(bgContainer, container.firstChild)

  const { cleanup: cleanupBg, app } = await initPixiBackground({
    container: bgContainer,
    backgroundUrl: 'src/assets/backgrounds/mainMenuBack.png',
    resizeMode: 'stretch',
  })

  const cleanupCarAnimations = (() => {
    let backCleanup: (() => void) | undefined
    let frontCleanup: (() => void) | undefined

    backCleanup = startCarAnimationBack(app)
    frontCleanup = startCarAnimationFront(app)

    return () => {
      backCleanup?.()
      frontCleanup?.()
    }
  })()

  const menu = document.createElement('nav')
  menu.className = 'menu'

  const buttonList = document.createElement('ul')
  buttonList.className = 'menu-list'

  for (const item of menuItems) {
    const li = document.createElement('li')
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'menu-button'
    button.textContent = item.label
    button.addEventListener('click', () => {
      playSound('click')
      handleMenuAction(item.id, handlers)
    })
    li.appendChild(button)
    buttonList.appendChild(li)
  }

  menu.appendChild(buttonList)
  container.appendChild(menu)

  return {
    cleanup: () => {
      cleanupCarAnimations()
      cleanupBg()
    }
  }
}

