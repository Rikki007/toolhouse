import { createBackButton } from '../utils/domFactory.ts'
import { tutorialSections, type TutorialSection } from '../data/tutorial.ts'
import { playSound } from '../state/audioManager.ts'
import { coinFrames, interfaceIconImages, tierImages } from '../assets/assetLoader'

/**
 * Иконка раздела обучения.
 * Ключи совпадают с interfaceIconImages, кроме 'coin' — иконка хаускоина лежит в кадрах монеты.
 */
function getSectionIconSrc(iconKey: string): string | undefined {
  if (iconKey === 'coin') return coinFrames[0]
  return interfaceIconImages[iconKey]
}

/**
 * Один пункт аккордеона: заголовок-кнопка и раскрываемая панель.
 * Панель всегда в DOM, но скрыта через CSS — это даёт плавную анимацию высоты.
 */
function createAccordionItem(section: TutorialSection): {
  item: HTMLElement
  header: HTMLButtonElement
} {
  const item = document.createElement('div')
  item.className = 'tutorial-accordion-item'

  const headerId = `tutorial-header-${section.id}`
  const panelId = `tutorial-panel-${section.id}`

  const header = document.createElement('button')
  header.type = 'button'
  header.className = 'tutorial-accordion-header'
  header.id = headerId
  header.setAttribute('aria-expanded', 'false')
  header.setAttribute('aria-controls', panelId)

  const title = document.createElement('span')
  title.className = 'tutorial-accordion-title'
  title.textContent = section.title

  const marker = document.createElement('span')
  marker.className = 'tutorial-accordion-marker'
  marker.setAttribute('aria-hidden', 'true')

  header.appendChild(title)
  header.appendChild(marker)

  const panel = document.createElement('div')
  panel.className = 'tutorial-accordion-panel'
  panel.id = panelId
  panel.setAttribute('role', 'region')
  panel.setAttribute('aria-labelledby', headerId)

  const panelInner = document.createElement('div')
  panelInner.className = 'tutorial-accordion-panel-inner'
  panel.appendChild(panelInner)

  const iconSrc = section.iconKey ? getSectionIconSrc(section.iconKey) : undefined
  if (iconSrc) {
    const icon = document.createElement('div')
    icon.className = 'tutorial-accordion-icon'
    icon.setAttribute('aria-hidden', 'true')

    const image = document.createElement('img')
    image.src = iconSrc
    image.alt = ''
    image.draggable = false
    icon.appendChild(image)

    panelInner.appendChild(icon)
  }

  if (section.content.length > 0) {
    for (const paragraph of section.content) {
      const p = document.createElement('p')
      p.className = 'tutorial-accordion-text'
      p.textContent = paragraph
      panelInner.appendChild(p)
    }
  } else {
    const placeholder = document.createElement('p')
    placeholder.className = 'tutorial-accordion-text tutorial-accordion-text-placeholder'
    placeholder.textContent = 'Раздел в разработке'
    panelInner.appendChild(placeholder)
  }

  // Карточки лиг с картинками
  if (section.tiers && section.tiers.length > 0) {
    const caption = document.createElement('div')
    caption.className = 'tutorial-tier-caption'
    caption.textContent = 'Лиги персонала'
    panelInner.appendChild(caption)

    const list = document.createElement('div')
    list.className = 'tutorial-tier-list'

    for (const tier of section.tiers) {
      const card = document.createElement('div')
      card.className = 'tutorial-tier-card'

      const imageSrc = tierImages[tier.imageKey]
      if (imageSrc) {
        const image = document.createElement('img')
        image.className = 'tutorial-tier-image'
        image.src = imageSrc
        image.alt = tier.name
        image.draggable = false
        card.appendChild(image)
      }

      const info = document.createElement('div')
      info.className = 'tutorial-tier-info'

      const name = document.createElement('div')
      name.className = 'tutorial-tier-name'
      name.textContent = tier.name
      info.appendChild(name)

      const description = document.createElement('div')
      description.className = 'tutorial-tier-description'
      description.textContent = tier.description
      info.appendChild(description)

      card.appendChild(info)
      list.appendChild(card)
    }

    panelInner.appendChild(list)
  }

  item.appendChild(header)
  item.appendChild(panel)

  return { item, header }
}

/**
 * Экран «Обучение»: рендерится как обычная страница меню (на примере about/settings/share),
 * а не как модалка. Содержимое — аккордеон с разделами из data/tutorial.ts.
 */
export function renderTutorial(container: HTMLElement, onBack: () => void): void {
  const section = document.createElement('section')
  section.className = 'tutorial-screen'

  const head = document.createElement('div')
  head.className = 'tutorial-screen-head'
  head.appendChild(createBackButton(onBack))

  const card = document.createElement('div')
  card.className = 'tutorial-card'

  const accordion = document.createElement('div')
  accordion.className = 'tutorial-accordion'

  const items = tutorialSections.map(createAccordionItem)
  for (const entry of items) {
    accordion.appendChild(entry.item)
  }

  /**
   * Открывает выбранный пункт, закрывая остальные.
   * Повторный клик по открытому пункту закрывает его.
   */
  function toggle(target: (typeof items)[number], wasOpen: boolean): void {
    for (const entry of items) {
      const open = !wasOpen && entry === target
      entry.item.classList.toggle('tutorial-accordion-item-open', open)
      entry.header.setAttribute('aria-expanded', String(open))
    }
  }

  for (const entry of items) {
    entry.header.addEventListener('click', () => {
      playSound('click')
      toggle(entry, entry.item.classList.contains('tutorial-accordion-item-open'))
    })
  }

  card.appendChild(accordion)

  section.appendChild(head)
  section.appendChild(card)
  container.appendChild(section)
}
