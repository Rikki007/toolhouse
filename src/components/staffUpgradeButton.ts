import type { Staff } from '../types/equipment.ts'
import { getState } from '../state/state.ts'
import { upgradeStaff } from '../state/inventoryStore.ts'
import { getStaffTierProgress, getNextUpgrade, getStaffTierName, getTierNameByNumber } from '../utils/staffUpgrades.ts'
import { createCreditIcon } from '../utils/creditIcon.ts'
import { MAX_STAFF_TIER, MAX_TIER_LEVEL, STAFF_TIERS } from '../data/staffUpgrades.ts'
import { playSound } from '../state/audioManager.ts'
import { formatMoney } from '../utils/format.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { tierImages } from '../assets/assetLoader.ts'

/**
 * Закладка тира — маленький img в углу карточки.
 * Возвращает null для не-персонала.
 */
export function createTierBookmark(staff: Staff): HTMLElement | null {
  const progress = getStaffTierProgress(staff, getState().staffUpgrades)
  const tierCfg = STAFF_TIERS[progress.tier - 1]
  if (!tierCfg) return null

  const src = tierImages[tierCfg.imageKey]
  if (!src) return null

  const img = document.createElement('img')
  img.className = 'staff-tier-bookmark'
  img.src = src
  img.alt = getStaffTierName(staff)
  img.draggable = false
  return img
}

/**
 * Строка с названием лиги (вместо квалификации).
 * Если текущая лига прокачана до конца, подсказывает, что дальше.
 */
export function createTierRow(staff: Staff): HTMLElement {
  const state = getState()
  const progress = getStaffTierProgress(staff, state.staffUpgrades)
  const row = document.createElement('div')
  row.className = 'staff-tier-row'
  row.textContent = `${getStaffTierName(staff)} лига · ${progress.level}/${MAX_TIER_LEVEL}★`

  if (progress.level >= MAX_TIER_LEVEL && progress.tier < MAX_STAFF_TIER) {
    const nextCfg = STAFF_TIERS[progress.tier]
    const playerLevel = levelFromXp(state.xpMoney)
    row.textContent += playerLevel >= nextCfg.unlockLevel
      ? ` · доступна ${nextCfg.name.toLowerCase()} лига`
      : ` · ${nextCfg.name.toLowerCase()} лига с ${nextCfg.unlockLevel} ур.`
  }
  return row
}

/**
 * Кнопка прокачки квалификации сотрудника.
 * Не рендерится (null), если сотрудник уже на потолке — тогда прокачивать нечего.
 * @param onUpgraded — вызывается после успешной покупки, чтобы перерисовать экран
 */
export function createStaffUpgradeButton(
  staff: Staff,
  onUpgraded: () => void
): HTMLElement | null {
  const state = getState()
  const playerLevel = levelFromXp(state.xpMoney)
  const next = getNextUpgrade(staff, state.staffUpgrades, playerLevel)
  if (!next) return null

  const progress = getStaffTierProgress(staff, state.staffUpgrades)

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'staff-upgrade-btn'

  // Текст кнопки зависит от типа повышения
  if (progress.level >= MAX_TIER_LEVEL && next.nextTier !== progress.tier && progress.tier < MAX_STAFF_TIER) {
    // Переход в новую лигу
    button.append(`Открыть ${getTierNameByNumber(next.nextTier)} лигу · ${formatMoney(next.cost)}`, createCreditIcon())
  } else {
    // Обычное повышение уровня внутри тира
    button.append(`Прокачать ${next.from}★ → ${next.to}★ · ${formatMoney(next.cost)}`, createCreditIcon())
  }

  if (state.money < next.cost) {
    button.disabled = true
    button.title = 'Недостаточно средств'
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation()
    if (upgradeStaff(staff.id)) {
      playSound('buy')
      onUpgraded()
    }
  })

  return button
}
