import { lootBoxFrames } from '../assets/assetLoader'
import { generateKeyframes, injectKeyframes } from '../utils/cssAnimation.ts'

// Кэш подготовленных кадров: ключ — размер, значение — промис с массивом data URL
const framesCache = new Map<number, Promise<string[]>>()

/**
 * Возвращает массив data URL кадров, отмасштабированных под указанный размер.
 * Результат кэшируется, поэтому при повторных вызовах с тем же size
 * canvas-операции не выполняются заново.
 */
async function prepareLootBoxFrames(size: number): Promise<string[]> {
  if (framesCache.has(size)) {
    return framesCache.get(size)!
  }

  const promise = (async () => {
    const framePromises = lootBoxFrames.map(url => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = async () => {
          try {
            await img.decode()
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')!

            // Имитация background-size: cover
            const scale = Math.max(size / img.width, size / img.height)
            const w = img.width * scale
            const h = img.height * scale
            const x = (size - w) / 2
            const y = (size - h) / 2

            ctx.drawImage(img, x, y, w, h)
            resolve(canvas.toDataURL('image/png'))
          } catch {
            reject(new Error(`Failed to decode ${url}`))
          }
        }
        img.onerror = () => reject(new Error(`Failed to load ${url}`))
      })
    })

    return Promise.all(framePromises)
  })()

  framesCache.set(size, promise)
  return promise
}

/**
 * Создаёт элемент анимации открытия loot box
 * @param size - Размер в пикселях
 * @param onComplete - Коллбек при завершении анимации
 * @returns HTMLElement с анимацией
 */
export async function createLootBoxAnimation(
  size: number,
  onComplete?: () => void
): Promise<HTMLElement> {
  const frames = await prepareLootBoxFrames(size)

  const container = document.createElement('div')
  container.className = 'lootbox-animation'
  container.style.width = `${size}px`
  container.style.height = `${size}px`
  container.style.backgroundSize = 'cover'
  container.style.backgroundPosition = 'center'
  container.style.backgroundRepeat = 'no-repeat'
  container.style.backgroundImage = `url('${frames[0]}')`

  // Кастомные проценты для 12 кадров
  const keyframesPercentages = [0, 8, 16, 25, 33, 41, 50, 58, 66, 75, 83, 100]
  const animationId = `lootbox-${size}`

  const css = generateKeyframes(animationId, frames, keyframesPercentages)
  injectKeyframes(css, animationId)

  container.style.animation = `${animationId} 1s steps(12) forwards`
  container.style.animationFillMode = 'forwards'

  container.addEventListener('animationend', () => {
    onComplete?.()
  })

  return container
}