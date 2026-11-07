import type { Sprite, Graphics } from 'pixi.js'

const rotationKeyPoints = [
  { aspect: 9 / 16, rotation: 0.15 },
  { aspect: 1,      rotation: -0.1 },
  { aspect: 16 / 9, rotation: -0.28 },
].sort((a, b) => a.aspect - b.aspect)

/**
 * Вычисляет угол поворота машины в зависимости от соотношения сторон экрана.
 * Использует линейную интерполяцию между ключевыми точками.
 */
export function computeCarRotation(winW: number, winH: number): number {
  const aspect = winW / winH
  const points = rotationKeyPoints

  if (aspect <= points[0].aspect) {
    if (points.length >= 2) {
      const p0 = points[0], p1 = points[1]
      const t = (aspect - p0.aspect) / (p1.aspect - p0.aspect)
      return p0.rotation + t * (p1.rotation - p0.rotation)
    }
    return points[0].rotation
  }

  if (aspect >= points[points.length - 1].aspect) {
    const n = points.length
    if (n >= 2) {
      const p0 = points[n - 2], p1 = points[n - 1]
      const t = (aspect - p0.aspect) / (p1.aspect - p0.aspect)
      return p0.rotation + t * (p1.rotation - p0.rotation)
    }
    return points[n - 1].rotation
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1]
    if (aspect >= p0.aspect && aspect <= p1.aspect) {
      const t = (aspect - p0.aspect) / (p1.aspect - p0.aspect)
      return p0.rotation + t * (p1.rotation - p0.rotation)
    }
  }

  return points[0].rotation
}

/**
 * Обновляет масштаб спрайта машины относительно размеров окна.
 */
export function updateCarScale(sprite: Sprite, winW: number, winH: number): void {
  const diagonal = Math.sqrt(winW ** 2 + winH ** 2)
  const carW = diagonal / 23
  const textureW = sprite.texture.width
  if (textureW > 0) {
    sprite.scale.set(carW / textureW)
  }
}

/**
 * Масштабирует спрайт фона под размер экрана с сохранением пропорций (cover).
 * Центрирует спрайт по середине.
 */
export function resizeBackground(sprite: Sprite, screenWidth: number, screenHeight: number): void {
  const textureWidth = sprite.texture.width
  const textureHeight = sprite.texture.height

  const scaleX = screenWidth / textureWidth
  const scaleY = screenHeight / textureHeight
  const scale = Math.max(scaleX, scaleY)

  sprite.width = textureWidth * scale
  sprite.height = textureHeight * scale

  sprite.x = (screenWidth - sprite.width) / 2
  sprite.y = (screenHeight - sprite.height) / 2
}

/**
 * Растягивает спрайт на весь указанный размер (без сохранения пропорций).
 */
export function resizeToStretch(sprite: Sprite, width: number, height: number): void {
  sprite.width = width
  sprite.height = height
}

/**
 * Рисует прямоугольник-заглушку заданного цвета.
 */
export function drawFallbackBackground(graphics: Graphics, width: number, height: number, color: number): void {
  graphics.rect(0, 0, width, height)
  graphics.fill(color)
}
