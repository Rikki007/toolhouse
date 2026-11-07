import { coinFrames } from '../assets/assetLoader.ts'
import { preloadImages } from '../utils/assetPreloader.ts'
import { generateKeyframes } from '../utils/cssAnimation.ts'

// Предзагрузка кадров при первом импорте
preloadImages(coinFrames)

// Кэш style-элементов с keyframes: key = размер монетки
const keyframeStyles = new Map<number, HTMLStyleElement>()

/**
 * Создаёт элемент с анимацией монетки.
 * Кэширует @keyframes для каждого размера, чтобы не дублировать style-элементы.
 * @param size — размер монетки в пикселях
 * @returns HTMLElement с запущенной анимацией
 */
export function createCoinAnimation(size: number): HTMLElement {
  // Создаём или берём из кэша style с keyframes
  let styleEl = keyframeStyles.get(size)
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.textContent = generateKeyframes(`coin-spin-${size}`, coinFrames)
    document.head.appendChild(styleEl)
    keyframeStyles.set(size, styleEl)
  }

  const coin = document.createElement('div')
  coin.className = 'coin-animation'
  coin.style.width = `${size}px`
  coin.style.height = `${size}px`
  coin.style.backgroundSize = 'cover'
  coin.style.backgroundPosition = 'center'
  coin.style.backgroundRepeat = 'no-repeat'
  coin.style.backgroundImage = `url('${coinFrames[0]}')`
  coin.style.animation = `coin-spin-${size} 1s steps(${coinFrames.length}) infinite`
  
  return coin
}