import { getState } from './state.ts'
import minigSound00 from '../assets/music/minig00.mp3'
import minigSound01 from '../assets/music/mining01.mp3'
import minigSound02 from '../assets/music/mining02.mp3'
import minigSound03 from '../assets/music/mining03.mp3'
import minigSound04 from '../assets/music/mining04.mp3'
import minigSound05 from '../assets/music/mining05.mp3'
import minigSound06 from '../assets/music/mining06.mp3'
import lootboxSound from '../assets/music/lootbox.mp3'
import messageSound from '../assets/music/message.mp3'
import levelUpSound from '../assets/music/levelUp.mp3'
import buySound from '../assets/music/buy.mp3'
import clickSound from '../assets/music/click.mp3'
import helmetSound from '../assets/music/helmet.mp3'
import closesSound from '../assets/music/closes.mp3'
import terminalSound from '../assets/music/terminal.mp3'

// Фоновая музыка — строковые пути (файлы в public/assets/music/)
const musicFiles: Record<string, string> = {
  mainMenu: 'assets/music/mainMenu.mp3',
  game: 'assets/music/game.mp3',
}

// Звуковые эффекты — Vite-импорты (файлы в src/assets/music/)
const soundFiles: Record<string, string> = {
  lootbox: lootboxSound,
  message: messageSound,
  levelUp: levelUpSound,
  buy: buySound,
  click: clickSound,
  helmet: helmetSound,
  closes: closesSound,
  terminal: terminalSound,
}

/** Варианты звука майнинга (бывший одиночный minig.mp3) */
const minigVariations: string[] = [
  minigSound00,
  minigSound01,
  minigSound02,
  minigSound03,
  minigSound04,
  minigSound05,
  minigSound06,
]

const audioMap: Map<string, HTMLAudioElement> = new Map()

let musicEnabled = true
let soundEnabled = true

export function setMusicEnabled(enabled: boolean): void {
  musicEnabled = enabled
  if (!enabled) {
    stopAllMusic()
  }
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled
}

function isMusicEnabled(): boolean {
  return musicEnabled
}

function isSoundEnabled(): boolean {
  return soundEnabled
}

function getAudio(trackName: string): HTMLAudioElement {
  if (!audioMap.has(trackName)) {
    const audio = new Audio(musicFiles[trackName])
    audio.loop = true
    audio.volume = 0.5
    audioMap.set(trackName, audio)
  }
  return audioMap.get(trackName)!
}

/**
 * Группы вариаций одного звука.
 * При каждом проигрывании выбирается случайный вариант, не совпадающий с предыдущим,
 * плюс небольшой джиттер громкости — за счёт частых повторов (клик при майнинге)
 * звук не приедается.
 *
 * Каждый вызов playSound создаёт новый Audio-элемент — так не возникает
 * AbortError при быстрых повторных кликах на один и тот же звук.
 * Кэширование в audioMap оставлено только для фоновой музыки (loop).
 */
const soundVariations: Record<string, string[]> = {
  minig: minigVariations,
}

/** Базовая громкость эффектов */
const SOUND_BASE_VOLUME = 0.25

/** Отклонение громкости: ±5% */
const SOUND_JITTER = 0.05

/** Индекс последнего сыгранного варианта для каждой группы — защита от повтора */
const lastVariationIndex: Record<string, number> = {}

/**
 * Выбирает индекс варианта группы, отличный от предыдущего.
 * При длине группы 1 повтор неизбежен — возвращает 0.
 */
function pickVariationIndex(groupName: string, group: string[]): number {
  if (group.length < 2) return 0
  const previous = lastVariationIndex[groupName] ?? -1
  let index = Math.floor(Math.random() * group.length)
  while (index === previous) {
    index = Math.floor(Math.random() * group.length)
  }
  lastVariationIndex[groupName] = index
  return index
}

export function playMusic(trackName: string): void {
  if (!isMusicEnabled()) return

  const audio = getAudio(trackName)
  // Останавливаем другие треки
  stopAllMusicExcept(trackName)
  audio.play().catch(() => {
    // Автоплей может быть заблокирован браузером
    console.warn(`Не удалось воспроизвести трек: ${trackName}`)
  })
}

export function playSound(soundName: string): void {
  if (!isSoundEnabled()) return

  const group = soundVariations[soundName]
  const url = group
    ? group[pickVariationIndex(soundName, group)]
    : soundFiles[soundName]

  if (!url) {
    console.warn(`Неизвестный звук: ${soundName}`)
    return
  }

  // Новый элемент на каждый вызов: переиспользование одного Audio приводит
  // к AbortError и тишине при частых кликах (play() отменяет предыдущее)
  const audio = new Audio(url)
  audio.loop = false

  // Джиттер громкости в пределах ±5% от базовой
  const volumeFactor = 1 + (Math.random() * 2 - 1) * SOUND_JITTER
  audio.volume = SOUND_BASE_VOLUME * volumeFactor

  audio.play().catch(() => {
    console.warn(`Не удалось воспроизвести звук: ${soundName}`)
  })
}

export function stopMusic(trackName: string): void {
  const audio = audioMap.get(trackName)
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
}

export function stopAllMusicExcept(except: string): void {
  for (const name of Object.keys(musicFiles)) {
    if (name === except) continue
    const audio = audioMap.get(name)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }
}

export function stopAllMusic(): void {
  for (const name of Object.keys(musicFiles)) {
    const audio = audioMap.get(name)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }
}

export function initAudioFromSettings(): void {
  const settings = getState().settings
  setMusicEnabled(settings.music)
  setSoundEnabled(settings.sound)
}
