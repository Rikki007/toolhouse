export interface MenuItem {
  id: string
  label: string
}

export const menuItems: MenuItem[] = [
  { id: 'play', label: 'На склад' },
  { id: 'tutorial', label: 'Обучение' },
  { id: 'settings', label: 'Настройки' },
  { id: 'about', label: 'О проекте' },
  { id: 'share', label: 'Поделиться' },
]
