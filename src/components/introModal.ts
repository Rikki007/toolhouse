import { ACTING_MANAGER_PROFILE } from '../data/actingManager.ts'
import { INTRO_LINES, INTRO_NEXT_LABEL, INTRO_START_LABEL } from '../data/intro.ts'
import { mastersImages } from '../assets/assetLoader.ts'
import { createModal } from '../utils/modalFactory.ts'
import { getState, markIntroSeen } from '../state/state.ts'
import { playSound } from '../state/audioManager.ts'

/**
 * Показывает стартовое приветствие И.О., если игрок ещё его не видел.
 * Вызывается при входе в игру после прелоадера.
 */
export function maybeShowIntro(container: HTMLElement): void {
  if (getState().introSeen) return
  showIntroModal(container)
}

/** Диалог знакомства: портрет И.О. и реплики с кнопкой «Далее» */
function showIntroModal(container: HTMLElement): void {
  playSound('message')

  createModal(container, {
    overlayClass: 'intro-overlay',
    closeOnOverlayClick: false,
    renderContent: (onClose) => {
      let index = 0

      const modal = document.createElement('div')
      modal.className = 'intro-modal'

      const portraitSrc = mastersImages['actingFirstMet']
      if (portraitSrc) {
        const portrait = document.createElement('img')
        portrait.className = 'intro-portrait'
        portrait.src = portraitSrc
        portrait.alt = ACTING_MANAGER_PROFILE.name
        portrait.draggable = false
        modal.appendChild(portrait)
      }

      const dialog = document.createElement('div')
      dialog.className = 'intro-dialog'

      const name = document.createElement('div')
      name.className = 'intro-name'
      name.textContent = 'И.О.'
      dialog.appendChild(name)

      const bubble = document.createElement('div')
      bubble.className = 'intro-bubble'
      dialog.appendChild(bubble)

      const title = document.createElement('div')
      title.className = 'intro-line-title'
      bubble.appendChild(title)

      const text = document.createElement('p')
      text.className = 'intro-line-text'
      bubble.appendChild(text)

      const actions = document.createElement('div')
      actions.className = 'intro-actions'

      const nextBtn = document.createElement('button')
      nextBtn.type = 'button'
      nextBtn.className = 'intro-next-btn'
      actions.appendChild(nextBtn)
      dialog.appendChild(actions)

      // Точки прогресса: одна на реплику
      const progress = document.createElement('div')
      progress.className = 'intro-progress'
      const dots: HTMLElement[] = []
      for (let i = 0; i < INTRO_LINES.length; i++) {
        const dot = document.createElement('span')
        dot.className = 'intro-dot'
        progress.appendChild(dot)
        dots.push(dot)
      }
      dialog.appendChild(progress)

      /** Отрисовывает текущую реплику */
      const render = (): void => {
        const line = INTRO_LINES[index]
        title.textContent = line.title ?? ''
        title.hidden = !line.title
        text.textContent = line.text
        nextBtn.textContent =
          index === INTRO_LINES.length - 1 ? INTRO_START_LABEL : INTRO_NEXT_LABEL

        dots.forEach((dot, i) => {
          dot.classList.toggle('intro-dot-active', i === index)
        })

        // Перезапуск анимации появления текста при смене реплики
        bubble.classList.remove('intro-bubble-enter')
        void bubble.offsetWidth
        bubble.classList.add('intro-bubble-enter')
      }

      nextBtn.addEventListener('click', () => {
        playSound('click')
        if (index < INTRO_LINES.length - 1) {
          index++
          render()
          return
        }
        markIntroSeen()
        onClose()
      })

      render()

      modal.appendChild(dialog)
      return modal
    },
  })
}
