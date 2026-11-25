import { createModal } from '../utils/modalFactory.ts'
import { pickLevelReward, applyLevelReward } from '../utils/levelReward.ts'
import { getStaffById, getRiggingById } from '../utils/itemLookup.ts'
import { createRewardCardForStaff, createRewardCardForRigging, createRewardCardForToken } from '../utils/rewardCard.ts'
import { sellLootboxReward } from '../state/inventoryStore.ts'
import { consumeToken } from '../state/tokenStore.ts'
import { getTokenConfig } from '../utils/tokenLookup.ts'
import type { TokenId } from '../types/index.ts'
import { formatMoney } from '../utils/format.ts'
import { playSound } from '../state/audioManager.ts'
import { getState, updateState, subscribe } from '../state/state.ts'
import { applyTokenEffect } from '../utils/tokenEffects.ts'
import { openStaffTokenPicker } from './staffTokenModal.ts'
import { openLootBoxSequence } from './lootboxModal.ts'

/**
 * Показывает модальное окно награды за уровень (схема как у лутбоксов).
 * Игрок обязан выбрать «Забрать» (или «Использовать» для жетона) либо «Продать» —
 * закрытие без выбора недоступно, поэтому очередь наград не может зациклиться.
 *
 * @param level — уровень, за который выдаётся награда
 * @param container — DOM-контейнер для оверлея
 * @param onClosed — вызывается после удаления оверлея и завершения эффектов жетона
 */
export function showLevelRewardModal(
  level: number,
  container: HTMLElement,
  onClosed: () => void
): void {
  const { reward } = pickLevelReward()

  createModal(container, {
    overlayClass: 'lootbox-modal-overlay',
    closeOnOverlayClick: false,
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'lootbox-modal'

      // Заголовок
      const title = document.createElement('h3')
      title.className = 'lootbox-modal-title'
      title.textContent = `Награда за уровень ${level}`
      modal.appendChild(title)

      // Тело: текст-пояснение + карточка/сумма
      const body = document.createElement('div')
      body.className = 'lootbox-container'
      body.style.flexDirection = 'column'

      if (reward.type === 'none') {
        const note = document.createElement('div')
        note.className = 'lootbox-result'
        note.textContent = 'Награда не выпала'
        body.appendChild(note)
      } else if (reward.type === 'money') {
        const amount = document.createElement('div')
        amount.className = 'lootbox-result'
        amount.textContent = `Вы получили ${formatMoney(reward.amount)}!`
        body.appendChild(amount)
      } else if (reward.type === 'staff') {
        const staff = getStaffById(reward.id)
        if (staff) body.appendChild(createRewardCardForStaff(staff))
      } else if (reward.type === 'rigging') {
        const rig = getRiggingById(reward.id)
        if (rig) body.appendChild(createRewardCardForRigging(rig))
      } else if (reward.type === 'token') {
        body.appendChild(createRewardCardForToken(getTokenConfig(reward.id as TokenId)))
      }

      modal.appendChild(body)

      // Кнопки: завершают выдачу — помечают уровень награждённым.
      // after — механика, запущенная наградой (например, применение жетона):
      // очередь наград ждёт её завершения, чтобы окна не наслаивались.
      const finish = (claim: () => void, after?: () => Promise<void> | undefined): void => {
        claim()
        updateState({ lastRewardedLevel: level })
        onClose()

        const pending = after?.()
        if (pending) {
          void pending.then(onClosed)
        } else {
          onClosed()
        }
      }

      const buttons = document.createElement('div')
      buttons.style.display = 'flex'
      buttons.style.gap = '12px'
      buttons.style.justifyContent = 'center'

      const btnTake = document.createElement('button')
      btnTake.type = 'button'
      btnTake.className = 'lootbox-modal-close'
      btnTake.textContent = reward.type === 'none' ? 'Понятно' : 'Забрать'
      btnTake.addEventListener('click', () => {
        playSound(reward.type === 'none' ? 'message' : 'buy')
        finish(() => applyLevelReward(reward))
      })
      buttons.appendChild(btnTake)

      // «Использовать» — только для жетонов
      if (reward.type === 'token') {
        const tokenConfig = getTokenConfig(reward.id as TokenId)

        const btnUse = document.createElement('button')
        btnUse.type = 'button'
        btnUse.className = 'lootbox-modal-close'
        btnUse.textContent = 'Использовать'
        btnUse.style.background = 'rgba(99, 102, 241, 0.15)'
        btnUse.style.border = '1px solid rgba(99, 102, 241, 0.3)'
        btnUse.style.color = '#a5b4fc'
        btnUse.addEventListener('click', () => {
          playSound('buy')
          finish(
            () => applyLevelReward(reward),
            () => {
              // Жетон повышения сначала попадает в инвентарь, затем открывается
              // выбор сотрудника — окно само спишет жетон при применении
              if (tokenConfig.kind === 'levelUp') {
                return openStaffTokenPicker(container, tokenConfig.id)
              }
              // Ускорение и лутбоксы применяем сразу, без хранения в инвентаре
              consumeToken(tokenConfig.id)
              return applyTokenEffect(tokenConfig.id, {
                onLootboxOpen: (count) => openLootBoxSequence(container, count),
              })
            },
          )
        })
        buttons.appendChild(btnUse)
      }

      // «Продать» — только для предметов (у жетона вместо неё «Использовать»)
      if (reward.type === 'staff' || reward.type === 'rigging') {
        const btnSell = document.createElement('button')
        btnSell.type = 'button'
        btnSell.className = 'lootbox-modal-close'
        btnSell.textContent = 'Продать'
        btnSell.style.background = 'rgba(255, 68, 68, 0.15)'
        btnSell.style.border = '1px solid rgba(255, 68, 68, 0.3)'
        btnSell.style.color = '#ff4444'
        btnSell.addEventListener('click', () => {
          playSound('buy')
          finish(() => sellLootboxReward(reward))
        })
        buttons.appendChild(btnSell)
      }

      modal.appendChild(buttons)
      return modal
    },
  })

  playSound('lootbox')
}

/**
 * Подписывается на изменения стейта и выдаёт награды за каждый новый уровень.
 * Если игрок перескочил несколько уровней — модалки показываются по очереди.
 * @returns функция отписки (вызывать при выходе с игрового экрана)
 */
export function startLevelRewardObserver(container: HTMLElement): () => void {
  let showing = false

  const checkQueue = (): void => {
    if (showing) return
    const state = getState()
    // Не выдаём награды за 1-й уровень — игрок стартует с него без заработка
    if (state.lastRewardedLevel >= state.lastPlayerLevel || state.lastRewardedLevel < 1) return

    const level = state.lastRewardedLevel + 1
    showing = true
    showLevelRewardModal(level, container, () => {
      showing = false
      checkQueue()
    })
  }

  return subscribe(checkQueue)
}
