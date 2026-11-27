import { Application, Assets, Sprite, Texture } from 'pixi.js'

// Статические импорты картинок — Vite хэширует их в dist/
// (тот же подход, что и с машинами в carAnimation.ts)
import rack01 from '../assets/racks/rack01.png'
import rack02 from '../assets/racks/rack02.png'
import rack03 from '../assets/racks/rack03.png'
import rack04 from '../assets/racks/rack04.png'
import rack05 from '../assets/racks/rack05.png'
import rack06 from '../assets/racks/rack06.png'
import rack07 from '../assets/racks/rack01.png'
import rack08 from '../assets/racks/rack02.png'
import rack09 from '../assets/racks/rack03.png'
import rack10 from '../assets/racks/rack04.png'
import rack11 from '../assets/racks/rack05.png'
import rack12 from '../assets/racks/rack06.png'
import rack13 from '../assets/racks/rack07.png'
import rack14 from '../assets/racks/rack08.png'


/**
 * Описание одного стеллажа на игровом поле.
 * Все координаты и размеры заданы в долях от размера окна (0..1),
 * поэтому расстановка сохраняется на экранах любого размера.
 */
export interface WarehouseRackConfig {
  /** Картинка стеллажа */
  url: string
  /** Центр спрайта по горизонтали: 0 — левый край окна, 1 — правый */
  x: number
  /** Центр спрайта по вертикали: 0 — верх окна, 1 — низ */
  y: number
  /** Ширина спрайта в долях от ширины окна: 0.2 = 20% ширины экрана */
  width: number
  /** Поворот в градусах (по умолчанию 0) */
  rotation?: number
  /**
   * Слой отрисовки (z-index): чем больше, тем выше стеллаж.
   * По умолчанию — порядок в массиве (+1, чтобы быть поверх фона).
   */
  z?: number
}

/**
 * Раскладка стеллажей по умолчанию: два ряда — дальний (меньше) и ближний (больше).
 * Порядок элементов = порядок отрисовки, если не задан z:
 * первые рисуются позади, последние — спереди.
 * Двигай стеллаж через x / y, меняй размер через width, слой — через z.
 */
export const warehouseRackLayout: WarehouseRackConfig[] = [
  { url: rack14, x: 0.75, y: 0.3, width: 0.65, z: 100},
]

interface RackSprite {
  sprite: Sprite
  config: WarehouseRackConfig
}

/**
 * Добавляет стеллажи на сцену Pixi поверх фона и держит их позиции
 * привязанными к размерам окна (в процентах от экрана).
 * @returns функция очистки
 */
export function startWarehouseRacks(
  app: Application,
  layout: WarehouseRackConfig[] = warehouseRackLayout,
): () => void {
  const racks: RackSprite[] = []
  const loadedUrls: string[] = []
  let disposed = false

  const applyLayout = (sprite: Sprite, config: WarehouseRackConfig): void => {
    const winW = window.innerWidth
    const winH = window.innerHeight
    const textureWidth = sprite.texture.width

    // anchor 0.5 — x/y задают центр спрайта, а не левый верхний угол
    sprite.anchor.set(0.5)
    if (textureWidth > 0) {
      sprite.scale.set((winW * config.width) / textureWidth)
    }
    sprite.x = winW * config.x
    sprite.y = winH * config.y
    sprite.rotation = ((config.rotation ?? 0) * Math.PI) / 180
  }

  const resizeHandler = (): void => {
    for (const rack of racks) {
      applyLayout(rack.sprite, rack.config)
    }
  }

  const addSprites = (): void => {
    if (disposed || !app.stage) return

    // Включаем сортировку по zIndex, иначе Pixi рисует строго по порядку добавления
    app.stage.sortableChildren = true

    layout.forEach((config, index) => {
      const texture = Assets.cache.get(config.url) as Texture | undefined
      if (!texture) return

      const sprite = new Sprite(texture)
      // По умолчанию слой = порядок в массиве (+1: фон занимает слой 0)
      sprite.zIndex = config.z ?? index + 1
      applyLayout(sprite, config)
      app.stage.addChild(sprite)
      racks.push({ sprite, config })
    })

    window.addEventListener('resize', resizeHandler)
  }

  const urlsToLoad = [...new Set(layout.map((config) => config.url))]
    .filter((url) => !Assets.cache.has(url))

  if (urlsToLoad.length > 0) {
    Assets.load(urlsToLoad)
      .then(() => {
        loadedUrls.push(...urlsToLoad)
        addSprites()
      })
      .catch((error: unknown) => {
        console.error('❌ Ошибка загрузки стеллажей:', error)
      })
  } else {
    addSprites()
  }

  // Функция очистки
  return () => {
    disposed = true
    window.removeEventListener('resize', resizeHandler)

    // Приложение могло быть уже уничтожено (например, при переходе между экранами)
    if (app.stage) {
      for (const rack of racks) {
        app.stage.removeChild(rack.sprite)
      }
    }
    racks.length = 0

    // Освобождаем текстуры из кеша
    for (const url of loadedUrls) {
      void Assets.unload(url)
    }
  }
}
