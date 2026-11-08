import { Application, Assets, Sprite, Texture, Ticker } from 'pixi.js'
import { computeCarRotation, updateCarScale } from '../utils/pixiHelpers.ts'

interface MovingCar {
  sprite: Sprite
  speed: number
  angle: number
}

interface CarAnimationConfig {
  carFiles: string[]
  getStartPoint: (winW: number, winH: number) => { x: number; y: number }
  getTargetAngle: (winW: number, winH: number) => number
  isOutOfBounds: (car: MovingCar, currentWinW: number, currentWinH: number) => boolean
}

const baseSpeed = 40

// Статические импорты картинок — Vite хэширует их в dist/
// (в dev работает и как строка, но в проде src/ недоступен)
import carBack1 from '../assets/transportBack/car1.png'
import carBack2 from '../assets/transportBack/car2.png'
import carBack3 from '../assets/transportBack/car3.png'
import carBack4 from '../assets/transportBack/car4.png'
import carBack5 from '../assets/transportBack/car5.png'
import carBack6 from '../assets/transportBack/car6.png'

import carFront1 from '../assets/transportFront/car1.png'
import carFront2 from '../assets/transportFront/car2.png'
import carFront3 from '../assets/transportFront/car3.png'
import carFront4 from '../assets/transportFront/car4.png'
import carFront5 from '../assets/transportFront/car5.png'
import carFront6 from '../assets/transportFront/car6.png'
import carFront7 from '../assets/transportFront/car7.png'
import carFront8 from '../assets/transportFront/car8.png'

const BACK_CAR_FILES: string[] = [carBack1, carBack2, carBack3, carBack4, carBack5, carBack6]
const FRONT_CAR_FILES: string[] = [carFront1, carFront2, carFront3, carFront4, carFront5, carFront6, carFront7, carFront8]

export function startCarAnimationBack(app: Application): () => void {
  return startCarAnimation(app, {
    carFiles: BACK_CAR_FILES,
    getStartPoint: (winW, winH) => ({ x: winW, y: winH * 0.97 }),
    getTargetAngle: (winW, winH) => Math.atan2(-winH / 2.26, -winW),
    isOutOfBounds: (car, _currentWinW, currentWinH) =>
      car.sprite.x < -car.sprite.width ||
      car.sprite.y < -car.sprite.height ||
      car.sprite.y > currentWinH + car.sprite.height,
  })
}

export function startCarAnimationFront(app: Application): () => void {
  return startCarAnimation(app, {
    carFiles: FRONT_CAR_FILES,
    getStartPoint: (_winW, winH) => ({ x: 0, y: winH / 1.77 }),
    getTargetAngle: (winW, winH) => {
      const targetX = winW * 1.09
      const targetY = winH * 0.985
      const dx = targetX - 0
      const dy = targetY - winH / 2
      return Math.atan2(dy, dx)
    },
    isOutOfBounds: (car, _currentWinW, currentWinH) =>
      car.sprite.x > _currentWinW + car.sprite.width ||
      car.sprite.y > currentWinH + car.sprite.height ||
      car.sprite.y < -car.sprite.height,
  })
}

function startCarAnimation(app: Application, config: CarAnimationConfig): () => void {
  const carTextures: Texture[] = []
  const activeCars: MovingCar[] = []
  const loadedUrls: string[] = []

  const spawnCar = (winW: number, winH: number) => {
    if (carTextures.length === 0) return

    const texture = carTextures[Math.floor(Math.random() * carTextures.length)]
    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5)

    updateCarScale(sprite, winW, winH)
    sprite.rotation = computeCarRotation(winW, winH)

    const start = config.getStartPoint(winW, winH)
    sprite.x = start.x
    sprite.y = start.y

    activeCars.push({
      sprite,
      speed: baseSpeed,
      angle: config.getTargetAngle(winW, winH)
    })
    app.stage.addChild(sprite)
  }

  const tickerCallback = (ticker: Ticker) => {
    const elapsedSec = ticker.lastTime / 1000
    const currentWinW = window.innerWidth
    const currentWinH = window.innerHeight

    if (elapsedSec >= nextSpawnTime) {
      spawnCar(currentWinW, currentWinH)
      nextSpawnTime = elapsedSec + 2 + Math.random() * 2
    }

    for (let i = activeCars.length - 1; i >= 0; i--) {
      const car = activeCars[i]
      car.sprite.x += Math.cos(car.angle) * car.speed * (ticker.deltaTime / 16)
      car.sprite.y += Math.sin(car.angle) * car.speed * (ticker.deltaTime / 16)

      if (config.isOutOfBounds(car, currentWinW, currentWinH)) {
        app.stage.removeChild(car.sprite)
        activeCars.splice(i, 1)
      }
    }
  }

  const resizeHandler = () => {
    const _winW = window.innerWidth
    const winH = window.innerHeight

    for (let i = activeCars.length - 1; i >= 0; i--) {
      const car = activeCars[i]
      updateCarScale(car.sprite, _winW, winH)
      car.sprite.rotation = computeCarRotation(_winW, winH)
      car.angle = config.getTargetAngle(_winW, winH)

      if (config.isOutOfBounds(car, _winW, winH)) {
        app.stage.removeChild(car.sprite)
        activeCars.splice(i, 1)
      }
    }
  }

  let nextSpawnTime = 0

  // Загружаем только те текстуры, которых ещё нет в кеше
  const urlsToLoad = config.carFiles.filter(url => !Assets.cache.has(url))

  if (urlsToLoad.length > 0) {
    Assets.load(urlsToLoad).then((textures) => {
      for (const key of Object.keys(textures)) {
        carTextures.push(textures[key] as Texture)
        loadedUrls.push(key)
      }

      const winW = window.innerWidth
      const winH = window.innerHeight
      spawnCar(winW, winH)

      app.ticker.add(tickerCallback)
      window.addEventListener('resize', resizeHandler)
    })
  } else {
    // Все текстуры уже в кеше, просто используем их
    for (const url of config.carFiles) {
      const tex = Assets.cache.get(url) as Texture | undefined
      if (tex) {
        carTextures.push(tex)
      }
    }

    const winW = window.innerWidth
    const winH = window.innerHeight
    spawnCar(winW, winH)

    app.ticker.add(tickerCallback)
    window.addEventListener('resize', resizeHandler)
  }

  // Функция очистки
  return () => {
    window.removeEventListener('resize', resizeHandler)

    // Приложение могло быть уже уничтожено (например, при переходе между экранами)
    if (app.ticker) {
      app.ticker.remove(tickerCallback)
    }

    // Удаляем все машины со сцены
    if (app.stage) {
      for (const car of activeCars) {
        app.stage.removeChild(car.sprite)
      }
    }
    activeCars.length = 0

    // Освобождаем текстуры из кеша
    for (const url of loadedUrls) {
      void Assets.unload(url)
    }
  }
}
