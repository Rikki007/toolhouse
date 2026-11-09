import type { Staff } from '../types/equipment.ts'
import { getState } from '../state/state.ts'
import { upgradeStaff } from '../state/inventoryStore.ts'
import { getStaffSpeed, getNextUpgrade } from '../utils/staffUpgrades.ts'
import { createCreditIcon } from '../utils/creditIcon.ts'
import { MAX_STAFF_SPEED, QUALIFICATION_NAMES } from '../data/staffUpgrades.ts'
import { playSound } from '../state/audioManager.ts'
import { formatMoney } from '../utils/format.ts'

/**
 * Строка «Новичок» / «Вникающий» / … / «Лучший» под шкалой скорости.
 * Название берётся по итоговой скорости сотрудника (текущему уровню).
 */
export function createQualificationRow(staff: Staff): HTMLElement {
  const level = getStaffSpeed(staff, getState().staffUpgrades)

  const row = document.createElement('div')
  row.className = 'staff-qualification'
  row.textContent = QUALIFICATION_NAMES[level] ?? ''
  if (level >= MAX_STAFF_SPEED) {
    row.classList.add('staff-qualification-max')
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
  const next = getNextUpgrade(staff, state.staffUpgrades)
  if (!next) return null

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'staff-upgrade-btn'
  // Стоимость рисуется иконкой кредитов, а не символом рубля
  button.append(`Прокачать ${next.from}★ → ${next.to}★ · ${formatMoney(next.cost)}`, createCreditIcon())

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
