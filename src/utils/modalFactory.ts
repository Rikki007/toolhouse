import { playSound } from '../state/audioManager.ts'

/**
 * Результат создания модального окна
 */
export interface ModalHandle {
  /** Удалить оверлей из DOM */
  close: () => void
  /** Оверлей */
  overlay: HTMLElement
}

/**
 * Опции для создания модального окна
 */
export interface ModalOptions {
  /** CSS-класс оверлея */
  overlayClass: string
  /** Функция рендера содержимого модалки. Получает onClose в качестве аргумента */
  renderContent: (onClose: () => void) => HTMLElement
  /** Функция, вызываемая при закрытии (после удаления оверлея) */
  onClose?: () => void
  /** Закрытие по клику на оверлей (по умолчанию true) */
  closeOnOverlayClick?: boolean
}

/**
 * Создаёт модальное окно с оверлеем.
 * Инкапсулирует паттерн: оверлей + рендер контента + закрытие по клику на фон.
 */
export function createModal(
  container: HTMLElement,
  options: ModalOptions
): ModalHandle {
  const {
    overlayClass,
    renderContent,
    onClose,
    closeOnOverlayClick = true,
  } = options

  const overlay = document.createElement('div')
  overlay.className = overlayClass

  const modal = renderContent(() => close())
  overlay.appendChild(modal)
  container.appendChild(overlay)

  // Закрытие по клику на оверлей
  if (closeOnOverlayClick) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close()
      }
    })
  }

  function close(): void {
    // модалка может вернуть cleanup-функцию (отписка от стейта и т.п.)
    const cleanup = (modal as HTMLElement & { cleanup?: () => void }).cleanup
    cleanup?.()
    overlay.remove()
    onClose?.()
  }

  return { close, overlay }
}

/**
 * Показывает модальное окно с ошибкой.
 */
export function showErrorModal(
  container: HTMLElement,
  message: string
): ModalHandle {
  playSound('message')

  return createModal(container, {
    overlayClass: 'error-modal-overlay',
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'error-modal'

      const messageEl = document.createElement('p')
      messageEl.className = 'error-modal-message'
      messageEl.textContent = message
      modal.appendChild(messageEl)

      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.className = 'error-modal-close'
      closeBtn.textContent = 'OK'
      closeBtn.addEventListener('click', () => {
        playSound('click')
        onClose()
      })
      modal.appendChild(closeBtn)

      return modal
    },
  })
}
