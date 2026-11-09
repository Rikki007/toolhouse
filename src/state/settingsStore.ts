import type { Theme, Settings } from '../types/index.ts'
import { setSoundEnabled } from './audioManager.ts'
import { updateState, getState } from './state.ts'

export const defaultSettings: Settings = {
  sound: true,
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

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  updateState({ settings: { ...getSettings(), theme } })
}

