import { createLootBoxAnimation } from '../effects/lootBoxAnimation.ts'
import { showPreloader, hidePreloader } from './preloader.ts'
import { getState, updateState } from '../state/state.ts'
import { getRandomLootBoxReward } from '../data/lootBoxRewards.ts'
import { getAllStaffIds, getStaffCategory, sellLootboxReward } from '../state/inventoryStore.ts'
import { getStaffById, getRiggingById } from '../utils/itemLookup.ts'
import { createRewardCardForStaff, createRewardCardForRigging, createRewardCardForToken } from '../utils/rewardCard.ts'
import { formatMoney } from '../utils/format.ts'
import { getTokenConfig } from '../utils/tokenLookup.ts'
import type { TokenId } from '../types/index.ts'
import { takeLootboxToken } from '../state/tokenStore.ts'
import { applyTokenEffect } from '../utils/tokenEffects.ts'
import { openStaffTokenPicker } from './staffTokenModal.ts'

/** Создать кнопку в модалке лутбокса с заданным цветом */
function createLootboxButton(
  label: string,
  color: { bg: string; border: string; text: string },
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'lootbox-modal-close'
  btn.textContent = label
  btn.style.background = color.bg
  btn.style.border = `1px solid ${color.border}`
  btn.style.color = color.text
  btn.style.padding = '8px 20px'
  btn.addEventListener('click', onClick)
  return btn
}

const GREEN_BTN = { bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.3)', text: '#4ade80' }
const RED_BTN = { bg: 'rgba(255, 68, 68, 0.15)', border: 'rgba(255, 68, 68, 0.3)', text: '#ff4444' }
const INDIGO_BTN = { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)', text: '#a5b4fc' }

/**
 * Открывает один лутбокс с анимацией и модалкой награды.
 * Promise резолвится, когда игрок закрыл награду и завершились все
 * вложенные механики (окно применения жетона, новая серия лутбоксов).
 */
export function openLootBoxAnimation(container: HTMLElement): Promise<void> {
  return new Promise<void>((resolve) => {
    void runLootBox(container, resolve)
  })
}

/**
 * Открывает указанное количество лутбоксов подряд.
 * Каждый следующий открывается после закрытия модалки предыдущего
 * и после завершения действий, запущенных из неё (например, применение
 * жетона повышения) — оставшиеся открытия не прогорают.
 */
export function openLootBoxSequence(container: HTMLElement, count: number): Promise<void> {
  return (async () => {
    for (let i = 0; i < count; i++) {
      await openLootBoxAnimation(container)
    }
  })()
}

async function runLootBox(
  container: HTMLElement,
  resolve: () => void,
): Promise<void> {
  // Показываем прелоадер
  const preloader = showPreloader(container)

  // Создаём модальное окно для анимации
  const modalOverlay = document.createElement('div')
  modalOverlay.className = 'lootbox-modal-overlay'

  const modal = document.createElement('div')
  modal.className = 'lootbox-modal'

  // Действие, которое должно завершиться до продолжения цепочки
  // (например, окно применения жетона повышения)
  let pendingAfterClose: Promise<void> | null = null
  let closed = false

  // Единая точка закрытия — резолвит промис после удаления оверлея
  // и после завершения вложенных механик
  const closeModal = (): void => {
    if (closed) return
    closed = true
    modalOverlay.remove()

    if (pendingAfterClose) {
      void pendingAfterClose.then(() => resolve())
      return
    }
    resolve()
  }

  // Контейнер для кнопок (показываются после награды)
  const closeBtn = document.createElement('div')
  closeBtn.style.display = 'none'
  closeBtn.style.gap = '12px'
  closeBtn.style.marginTop = '16px'
  closeBtn.style.justifyContent = 'center'

  // Анимация (внутри preloadLootBoxImages, картинки загружаются в кэш)
  const animation = await createLootBoxAnimation(300, () => {
    // После завершения анимации — показываем награду
    modal.removeChild(animation)

    // Получаем случайную награду
    const reward = getRandomLootBoxReward()

    if (reward.type === 'money') {
      const message = document.createElement('div')
      message.className = 'lootbox-result'
      message.textContent = `Вы получили ${formatMoney(reward.amount)}!`
      modal.appendChild(message)

      closeBtn.appendChild(createLootboxButton('Забрать', GREEN_BTN, () => {
        updateState({ money: getState().money + reward.amount })
        closeModal()
      }))
    } else if (reward.type === 'staff') {
      // Персонал — проверяем, есть ли уже в инвентаре или сменах
      const allStaffIds = getAllStaffIds()
      const staffId = reward.id
      const isDuplicate = allStaffIds.includes(staffId)

      if (isDuplicate) {
        // Персонал уже есть — выдаём деньги
        const staff = getStaffById(staffId)
        const cashAmount = staff?.cost ?? 0

        const message = document.createElement('div')
        message.className = 'lootbox-result'
        message.textContent = `Вы получили ${formatMoney(cashAmount)}!`
        modal.appendChild(message)

        closeBtn.appendChild(createLootboxButton('Забрать', GREEN_BTN, () => {
          updateState({ money: getState().money + cashAmount })
          closeModal()
        }))
      } else {
        // Новый сотрудник — показываем карточку
        const staff = getStaffById(staffId)
        if (staff) {
          modal.appendChild(createRewardCardForStaff(staff))

          const btnTake = createLootboxButton('Забрать', GREEN_BTN, () => {
            const inventory = getState().inventory
            const staffCat = getStaffCategory(staffId)
            if (!staffCat) {
              closeModal()
              return
            }

            const currentList = [...inventory.staff[staffCat], staffId]
            updateState({
              inventory: {
                ...inventory,
                staff: {
                  ...inventory.staff,
                  [staffCat]: currentList,
                },
              },
            })
            closeModal()
          })

          const btnSell = createLootboxButton('Продать', RED_BTN, () => {
            sellLootboxReward(reward)
            closeModal()
          })

          closeBtn.appendChild(btnTake)
          closeBtn.appendChild(btnSell)
        }
      }
    } else if (reward.type === 'rigging') {
      // Снаряжение — показываем карточку (НЕ добавляем в inventory пока)
      const rig = getRiggingById(reward.id)
      if (rig) {
        modal.appendChild(createRewardCardForRigging(rig))

        const btnTake = createLootboxButton('Забрать', GREEN_BTN, () => {
          const inventory = getState().inventory
          const currentRigging = [...(inventory.rigging ?? []), reward.id]
          updateState({
            inventory: {
              ...inventory,
              rigging: currentRigging,
            },
          })
          closeModal()
        })

        const btnSell = createLootboxButton('Продать', RED_BTN, () => {
          sellLootboxReward(reward)
          closeModal()
        })

        closeBtn.appendChild(btnTake)
        closeBtn.appendChild(btnSell)
      }
    } else if (reward.type === 'token') {
      // Жетон — карточка с кнопками «Использовать» и «Забрать»
      const tokenConfig = getTokenConfig(reward.id as TokenId)
      modal.appendChild(createRewardCardForToken(tokenConfig))

      const btnUse = createLootboxButton('Использовать', INDIGO_BTN, () => {
        // Жетон повышения: кладём в инвентарь и открываем выбор сотрудника.
        // Оставшиеся лутбоксы серии открываются после закрытия этого окна.
        if (tokenConfig.kind === 'levelUp') {
          takeLootboxToken(tokenConfig.id)
          pendingAfterClose = openStaffTokenPicker(container, tokenConfig.id)
          closeModal()
          return
        }
        // Жетон лутбокса открывает свою серию, затем продолжается текущая
        if (tokenConfig.kind === 'lootbox') {
          pendingAfterClose = openLootBoxSequence(container, tokenConfig.lootboxCount ?? 1)
          closeModal()
          return
        }
        closeModal()
        applyTokenEffect(tokenConfig.id)
      })

      const btnTake = createLootboxButton('Забрать', GREEN_BTN, () => {
        takeLootboxToken(tokenConfig.id)
        closeModal()
      })

      closeBtn.appendChild(btnUse)
      closeBtn.appendChild(btnTake)
    }

    closeBtn.style.display = 'flex'
  })

  // Скрываем прелоадер после загрузки картинок
  hidePreloader(preloader)

  modal.appendChild(animation)
  modal.appendChild(closeBtn)

  modalOverlay.appendChild(modal)
  container.appendChild(modalOverlay)
}
