import { getState } from '../state/state.ts'
import { getMasterUpgradeLevel, getMasterUpgradeCost, upgradeMaster, isMasterMaxedOut } from '../state/masterUpgradeStore.ts'
import { MASTER_UPGRADE_LEVELS } from '../data/masterUpgrades.ts'
import { createCreditIcon } from '../utils/creditIcon.ts'
import { playSound } from '../state/audioManager.ts'
import { formatMoney } from '../utils/format.ts'

/** Получить иконку текущего уровня мастера */
export function getMasterLevelImageKey(masterId: string): string {
  const level = getMasterUpgradeLevel(masterId)
  return MASTER_UPGRADE_LEVELS[level]?.imageKey ?? 'first'
}

/** Получить текущее звание мастера */
export function getMasterTitle(masterId: string): string {
  const level = getMasterUpgradeLevel(masterId)
  return MASTER_UPGRADE_LEVELS[level]?.name ?? 'Новичок'
}

/**
 * Кнопка прокачки квалификации мастера.
 * На максимальном уровне рендерится неактивной с пометкой «МАКС».
 * @param masterId ID мастера
 * @param shiftCost Стоимость смены (для расчёта цены)
 * @param onUpgraded — вызывается после успешной покупки, чтобы перерисовать экран
 */
export function createMasterUpgradeButton(
  masterId: string,
  shiftCost: number,
  onUpgraded?: () => void
): HTMLElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'staff-upgrade-btn master-upgrade-btn'

  if (isMasterMaxedOut(masterId)) {
    button.classList.add('maxed')
    button.disabled = true
    button.textContent = 'Максимальный уровень'
    return button
  }

  const state = getState()
  const cost = getMasterUpgradeCost(masterId, shiftCost) ?? 0
  const currentLevel = getMasterUpgradeLevel(masterId)
  const nextLevel = MASTER_UPGRADE_LEVELS[currentLevel + 1]
  const currentTitle = MASTER_UPGRADE_LEVELS[currentLevel]?.name ?? ''

  button.append(
    `Прокачать: ${currentTitle} → ${nextLevel.name} · ${formatMoney(cost)}`,
    createCreditIcon(),
  )

  if (state.money < cost) {
    button.disabled = true
    button.title = 'Недостаточно средств'
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation()
    if (upgradeMaster(masterId, shiftCost)) {
      playSound('buy')
      onUpgraded?.()
    }
  })

  return button
}
