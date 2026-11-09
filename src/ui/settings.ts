import type { Theme } from '../types/index.ts'
import { subscribe } from '../state/state.ts'
import { toggleSound, setTheme, getSettings } from '../state/settingsStore.ts'
import { createBackButton, createToggleRow, createSelectRow } from '../utils/domFactory.ts'

export async function renderSettings(container: HTMLElement, onBack: () => void): Promise<{ cleanup: () => void }> {
  const section = document.createElement('section')
  section.className = 'settings-screen'

  const head = document.createElement('div')
  head.className = 'settings-screen-head'
  head.appendChild(createBackButton(onBack))

  const card = document.createElement('div')
  card.className = 'settings-card'

  const title = document.createElement('h1')
  title.textContent = 'Настройки'
  card.appendChild(title)

  let soundRow: HTMLDivElement
  let themeRow: HTMLDivElement

  function render() {
    const settings = getSettings()

    if (!soundRow) {
      soundRow = createToggleRow('Звук', settings.sound, async () => toggleSound())
      card.appendChild(soundRow)
    } else {
      const toggle = soundRow.querySelector('.toggle-button') as HTMLButtonElement | null
      const label = soundRow.querySelector('.settings-label') as HTMLSpanElement | null
      if (toggle && label) {
        toggle.setAttribute('aria-pressed', String(settings.sound))
        toggle.textContent = settings.sound ? 'Вкл' : 'Выкл'
        label.textContent = `Звук: ${settings.sound ? 'Вкл' : 'Выкл'}`
      }
    }

    if (!themeRow) {
      themeRow = createSelectRow<Theme>(
        'Тема',
        [
          { value: 'dark', label: 'Тёмная' },
          { value: 'light', label: 'Светлая' },
        ],
        settings.theme,
        async (value) => setTheme(value)
      )
      card.appendChild(themeRow)
    } else {
      const select = themeRow.querySelector('.settings-select') as HTMLSelectElement | null
      if (select) {
        select.value = settings.theme
      }
    }
  }

  section.appendChild(head)
  section.appendChild(card)
  container.appendChild(section)

  render()

  const unsubscribe = subscribe(render)

  return { cleanup: unsubscribe }
}

