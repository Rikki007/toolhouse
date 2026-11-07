import { createCoinAnimation } from '../effects/coinAnimation.ts'

/**
 * Создаёт прелоадер с анимацией монетки
 * @returns HTMLElement прелоадера
 */
export function createPreloader(): HTMLElement {
  const preloader = document.createElement('div')
  preloader.className = 'preloader'
  
  const spinner = document.createElement('div')
  spinner.className = 'preloader-spinner'
  
  // Добавляем анимацию монетки
  const coinAnimation = createCoinAnimation(64)
  spinner.appendChild(coinAnimation)
  
  const message = document.createElement('div')
  message.className = 'preloader-message'
  message.textContent = 'Загрузка...'
  
  preloader.appendChild(spinner)
  preloader.appendChild(message)
  
  return preloader
}

/**
 * Показывает прелоадер в контейнере
 * @param container - Контейнер для прелоадера
 * @returns Прелоадер (для последующего удаления)
 */
export function showPreloader(container: HTMLElement): HTMLElement {
  const preloader = createPreloader()
  container.appendChild(preloader)
  return preloader
}

/**
 * Скрывает прелоадер
 * @param preloader - Элемент прелоадера
 */
export function hidePreloader(preloader: HTMLElement): void {
  preloader.style.opacity = '0'
  preloader.style.transition = 'opacity 0.3s ease'
  
  setTimeout(() => {
    preloader.remove()
  }, 300)
}
