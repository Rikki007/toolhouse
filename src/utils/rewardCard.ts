import { pickerImages, richDriversImages } from '../assets/assetLoader.ts'
import { getRiggingImage } from './assets.ts'
import { createProgressBar } from './progressBar.ts'

/**
 * Создаёт карточку сотрудника-награды (для лутбоксов и наград за уровень).
 */
export function createRewardCardForStaff(staff: { name: string; avatar: string; baseSpeed: number; position: string }): HTMLElement {
  const card = document.createElement('div')
  card.className = 'shop-card lootbox-reward-card'

  // Аватар
  const avatarKey = staff.avatar
  const imageSrc = avatarKey ? (pickerImages[avatarKey] || richDriversImages[avatarKey]) : ''
  if (imageSrc) {
    const image = document.createElement('img')
    image.className = 'shop-card-image'
    image.src = imageSrc
    image.alt = staff.name
    image.onerror = () => {
      image.style.display = 'none'
      const placeholder = document.createElement('div')
      placeholder.className = 'shop-card-image-placeholder'
      placeholder.textContent = '👤'
      card.insertBefore(placeholder, card.firstChild)
    }
    card.appendChild(image)
  } else {
    const imagePlaceholder = document.createElement('div')
    imagePlaceholder.className = 'shop-card-image'
    imagePlaceholder.textContent = '👤'
    card.appendChild(imagePlaceholder)
  }

  // Имя
  const name = document.createElement('h3')
  name.className = 'shop-card-name'
  name.textContent = staff.name
  card.appendChild(name)

  // Позиция
  const position = document.createElement('div')
  position.style.fontSize = '12px'
  position.style.color = '#999'
  position.style.marginBottom = '8px'
  position.textContent = staff.position
  card.appendChild(position)

  // Скорость (звёзды)
  card.appendChild(createProgressBar('Скорость', staff.baseSpeed))

  return card
}

/**
 * Создаёт карточку снаряжения-награды (для лутбоксов и наград за уровень).
 */
export function createRewardCardForRigging(rigging: { name: string; image: string; speed: number }): HTMLElement {
  const card = document.createElement('div')
  card.className = 'shop-card lootbox-reward-card'

  // Изображение
  const imageSrc = getRiggingImage(rigging.image)
  if (imageSrc) {
    const image = document.createElement('img')
    image.className = 'shop-card-image'
    image.src = imageSrc
    image.alt = rigging.name
    image.onerror = () => {
      image.style.display = 'none'
      const placeholder = document.createElement('div')
      placeholder.className = 'shop-card-image-placeholder'
      placeholder.textContent = '🪖'
      card.insertBefore(placeholder, card.firstChild)
    }
    card.appendChild(image)
  } else {
    const imagePlaceholder = document.createElement('div')
    imagePlaceholder.className = 'shop-card-image'
    imagePlaceholder.textContent = '🪖'
    card.appendChild(imagePlaceholder)
  }

  // Имя
  const name = document.createElement('h3')
  name.className = 'shop-card-name'
  name.textContent = rigging.name
  card.appendChild(name)

  // Скорость (звёзды)
  card.appendChild(createProgressBar('Скорость', rigging.speed))

  return card
}
