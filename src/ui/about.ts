import { aboutRows } from '../data/about.ts'
import { createBackButton, createIconLink } from '../utils/domFactory.ts'
import { linkIconImages } from '../assets/assetLoader.ts'

export function renderAbout(container: HTMLElement, onBack: () => void): void {
  const section = document.createElement('section')
  section.className = 'about-screen'

  const head = document.createElement('div')
  head.className = 'about-screen-head'
  head.appendChild(createBackButton(onBack))

  const card = document.createElement('div')
  card.className = 'about-card'

  const desc = document.createElement('p')
  desc.className = 'about-desc'
  desc.innerHTML =
    '<strong>ToolHouse</strong> - симулятор управления складом. ' +
    'Развивай склад, покупай технику, работай с персоналом и становись лучшим логистом.'
  card.appendChild(desc)

  const details = document.createElement('div')
  details.className = 'about-details'

  for (const row of aboutRows) {
    const rowEl = document.createElement('div')
    rowEl.className = 'about-row'

    const labelEl = document.createElement('span')
    labelEl.className = 'about-label'
    labelEl.textContent = row.label

    const valueEl = document.createElement('span')
    valueEl.className = 'about-value'
    valueEl.textContent = row.value

    rowEl.appendChild(labelEl)
    rowEl.appendChild(valueEl)
    details.appendChild(rowEl)
  }

  card.appendChild(details)

  const links = document.createElement('div')
  links.className = 'about-links'

  links.appendChild(createIconLink('https://t.me/KirillOresh', linkIconImages['telegram'], 'Telegram', '_blank'))
  links.appendChild(createIconLink('https://github.com/Rikki007', linkIconImages['gitHub'], 'GitHub', '_blank'))

  card.appendChild(links)

  section.appendChild(head)
  section.appendChild(card)
  container.appendChild(section)
}
