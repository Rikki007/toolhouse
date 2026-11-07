export interface GameState {
  money: number
  moneyPerMinute: number
}

export interface GameStats {
  /** Загруженность склада паллетами (0-100%) */
  capacity: number
  /** Настроение сотрудников (0-100%) */
  mood: number
  /** Брак товара (0-100%) */
  defects: number
  /** Недостача товара (0-100%) */
  shortages: number
}

export type TabType = 'shop' | 'skills' | 'achievements'

export interface TabConfig {
  id: TabType
  label: string
  iconKey?: string
}

export const tabs: TabConfig[] = [
  { id: 'shop', label: 'Магазин', iconKey: 'store' },
  { id: 'skills', label: 'Отделы', iconKey: 'departments' },
  { id: 'achievements', label: 'Достижения', iconKey: 'achievements' },
]

/**
 * Возвращает label таба по его id.
 */
export function getTabLabel(tabId: TabType): string {
  const tab = tabs.find(t => t.id === tabId)
  return tab?.label || ''
}
