import './styles/variables.css'
import './styles/buttons.css'
import './styles/menu.css'
import './styles/about.css'
import './styles/settings.css'
import './styles/share.css'
import './styles/tutorial.css'
import './styles/modalsWindows.css'
import './styles/cards.css'
import './styles/skills.css'
import './styles/game.css'
import { renderMenu } from './ui/menu.ts'
import { renderAbout } from './ui/about.ts'
import { renderSettings } from './ui/settings.ts'
import { renderShare } from './ui/share.ts'
import { renderTutorial } from './ui/tutorial.ts'
import { renderGameScreen } from './ui/gameScreen.ts'
import { getState } from './state/state.ts'
import { setTheme } from './state/settingsStore.ts'
import { initEquipmentImages, initSkillsImages } from './assets/assetLoader.ts'
import { showPreloader, hidePreloader } from './components/preloader.ts'
import { playMusic, initAudioFromSettings } from './state/audioManager.ts'

// Инициализация изображений техники
initEquipmentImages()

// Инициализация изображений навыков
initSkillsImages()

// Инициализация аудио из настроек
initAudioFromSettings()

const app = document.querySelector<HTMLDivElement>('#app')!

let currentCleanup: (() => void) | null = null

// Загружаем дефолтные настройки для старта
const initialSettings = getState().settings
setTheme(initialSettings.theme)

// Показываем прелоадер при старте
let preloader = showPreloader(app)

/**
 * Показывает прелоадер минимум на указанное время
 * @param minDuration - Минимальное время показа в миллисекундах
 * @returns Promise, который разрешится после завершения прелоадера
 */
function showPreloaderWithMinDuration(minDuration: number = 2000): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    preloader = showPreloader(app)
    
    const checkDuration = () => {
      const elapsed = Date.now() - startTime
      if (elapsed >= minDuration) {
        hidePreloader(preloader)
        resolve()
      } else {
        requestAnimationFrame(checkDuration)
      }
    }
    
    requestAnimationFrame(checkDuration)
  })
}

export async function showMenu(): Promise<void> {
  // Очищаем интервалы кликера
  if (app.dataset.clickerIntervalId) {
    clearInterval(Number(app.dataset.clickerIntervalId))
    delete app.dataset.clickerIntervalId
  }
  currentCleanup?.()
  currentCleanup = null
  app.innerHTML = ''
  const menuCleanup = await renderMenu(app, { onPlay: showGame, onTutorial: showTutorial, onSettings: showSettings, onAbout: showAbout, onShare: showShare })
  currentCleanup = menuCleanup.cleanup
  playMusic('mainMenu')
}

export async function showGame(): Promise<void> {
  currentCleanup?.()
  currentCleanup = null
  app.innerHTML = ''
  const gameCleanup = await renderGameScreen(app, showMenu, showSettings, showGame)
  currentCleanup = gameCleanup
  playMusic('game')
  // Показываем прелоадер минимум 2 секунды
  await showPreloaderWithMinDuration(2000)
}

export async function showSettings(): Promise<void> {
  // Очищаем интервалы кликера
  if (app.dataset.clickerIntervalId) {
    clearInterval(Number(app.dataset.clickerIntervalId))
    delete app.dataset.clickerIntervalId
  }
  currentCleanup?.()
  currentCleanup = null
  app.innerHTML = ''
  await renderSettings(app, showMenu)
  // Показываем прелоадер минимум 2 секунды
  await showPreloaderWithMinDuration(2000)
}

export async function showAbout(): Promise<void> {
  // Очищаем интервалы кликера
  if (app.dataset.clickerIntervalId) {
    clearInterval(Number(app.dataset.clickerIntervalId))
    delete app.dataset.clickerIntervalId
  }
  currentCleanup?.()
  currentCleanup = null
  app.innerHTML = ''
  renderAbout(app, showMenu)
  // Показываем прелоадер минимум 2 секунды
  await showPreloaderWithMinDuration(2000)
}

export async function showShare(): Promise<void> {
  // Очищаем интервалы кликера
  if (app.dataset.clickerIntervalId) {
    clearInterval(Number(app.dataset.clickerIntervalId))
    delete app.dataset.clickerIntervalId
  }
  currentCleanup?.()
  currentCleanup = null
  app.innerHTML = ''
  const shareCleanup = renderShare(app, showMenu)
  currentCleanup = shareCleanup.cleanup
  // Показываем прелоадер минимум 2 секунды
  await showPreloaderWithMinDuration(2000)
}

export async function showTutorial(): Promise<void> {
  // Очищаем интервалы кликера
  if (app.dataset.clickerIntervalId) {
    clearInterval(Number(app.dataset.clickerIntervalId))
    delete app.dataset.clickerIntervalId
  }
  currentCleanup?.()
  currentCleanup = null
  app.innerHTML = ''
  renderTutorial(app, showMenu)
  // Показываем прелоадер минимум 2 секунды
  await showPreloaderWithMinDuration(2000)
}

// Скрываем прелоадер после полной загрузки страницы
window.addEventListener('load', async () => {
  // Ждём ещё 2 секунды после загрузки, чтобы пользователь увидел прелоадер
  await showPreloaderWithMinDuration(2000)
  showMenu()
})