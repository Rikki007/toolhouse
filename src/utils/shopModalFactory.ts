import type { ModalHandle } from './modalFactory.ts'

let currentOverlay: HTMLElement | null = null

/** Закрыть текущий оверлей магазина */
export function closeCurrentOverlay(): void {
  if (currentOverlay) {
    currentOverlay.remove()
    currentOverlay = null
  }
}

/**
 * Создать оверлей магазина с модалкой.
 * Возвращает handle для закрытия.
 */
export function createShopOverlay(
  container: HTMLElement,
  renderModal: (onClose: () => void) => HTMLElement
): ModalHandle {
  closeCurrentOverlay()

  const overlay = document.createElement('div')
  overlay.className = 'shop-overlay'

  const modal = renderModal(() => closeShopOverlay(overlay))
  overlay.appendChild(modal)
  container.appendChild(overlay)

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeShopOverlay(overlay)
    }
  })

  currentOverlay = overlay

  return { close: () => closeShopOverlay(overlay), overlay }
}

function closeShopOverlay(overlay: HTMLElement): void {
  overlay.remove()
  if (currentOverlay === overlay) {
    currentOverlay = null
  }
}
