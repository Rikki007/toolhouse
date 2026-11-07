import { Application, Assets, Sprite } from 'pixi.js'
import { resizeBackground, resizeToStretch } from '../utils/pixiHelpers.ts'

export type PixiBackgroundResizeMode = 'cover' | 'stretch'

export interface PixiBackgroundConfig {
  /** Контейнер, в который будет добавлен canvas */
  container: HTMLElement
  /** URL фонового изображения */
  backgroundUrl: string
  /** Режим масштабирования: cover (с сохранением пропорций) или stretch (растянуть) */
  resizeMode?: PixiBackgroundResizeMode
  /** Цвет фона (используется если картинка не загрузилась) */
  backgroundColor?: number
}

let currentApp: Application | null = null
let currentBackgroundUrl: string | null = null

/**
 * Инициализирует PixiJS canvas с фоном.
 * @returns объект с функцией очистки и экземпляром Application
 */
export async function initPixiBackground(config: PixiBackgroundConfig): Promise<{
  /** Функция для очистки (удаляет canvas, слушатели, уничтожает приложение) */
  cleanup: () => void
  /** Экземпляр Application, на который добавлен фон */
  app: Application
}> {
  const {
    container,
    backgroundUrl,
    resizeMode = 'stretch',
    backgroundColor = 0x000000,
  } = config

  // Очистка предыдущего экземпляра если есть
  if (currentApp) {
    if (currentBackgroundUrl) {
      await Assets.unload(currentBackgroundUrl)
      currentBackgroundUrl = null
    }
    currentApp.destroy(true, { children: true, texture: false })
    currentApp = null
  }

  currentApp = new Application()

  try {
    await currentApp.init({ background: backgroundColor, resizeTo: window })
    container.appendChild(currentApp.canvas)

    const texture = await Assets.load(backgroundUrl)
    const bgSprite = new Sprite(texture)
    currentApp.stage.addChild(bgSprite)
    currentBackgroundUrl = backgroundUrl

    // Обработчик ресайза
    const resizeHandler = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      if (resizeMode === 'cover') {
        resizeBackground(bgSprite, w, h)
      } else {
        resizeToStretch(bgSprite, w, h)
      }
    }

    // Первичное масштабирование
    resizeHandler()

    window.addEventListener('resize', resizeHandler)

    // Возвращаем объект с функцией очистки и приложением
    return {
      cleanup: () => {
        window.removeEventListener('resize', resizeHandler)
        if (currentApp) {
          if (currentBackgroundUrl) {
            void Assets.unload(currentBackgroundUrl)
            currentBackgroundUrl = null
          }
          currentApp.destroy(true, { children: true, texture: false })
          currentApp = null
        }
      },
      app: currentApp,
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации PixiJS фона:', error)
    // Даже при ошибке возвращаем объект с функцией очистки
    return {
      cleanup: () => {
        if (currentApp) {
          if (currentBackgroundUrl) {
            void Assets.unload(currentBackgroundUrl)
            currentBackgroundUrl = null
          }
          currentApp.destroy(true, { children: true, texture: false })
          currentApp = null
        }
      },
      app: currentApp!,
    }
  }
}

