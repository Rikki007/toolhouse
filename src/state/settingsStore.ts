import type { Theme, Settings } from '../types/index.ts'
import { setMusicEnabled, setSoundEnabled } from './audioManager.ts'
import { updateState, getState } from './state.ts'

export const defaultSettings: Settings = {
  sound: true,
  music: true,
  theme: 'dark',
}

export function getSettings(): Settings {
  return getState().settings
}

export function toggleSound(): void {
  const current = getSettings()
  updateState({ settings: { ...current, sound: !current.sound } })
  setSoundEnabled(!current.sound)
}

export function toggleMusic(): void {
  const current = getSettings()
  updateState({ settings: { ...current, music: !current.music } })
  setMusicEnabled(!current.music)
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  updateState({ settings: { ...getSettings(), theme } })
}

