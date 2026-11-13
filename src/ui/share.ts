import { createBackButton } from '../utils/domFactory.ts'
import { claimShareReward, getShareRewardAmount, subscribe } from '../state/state.ts'
import { formatMoney } from '../utils/format.ts'
import { linkIconImages } from '../assets/assetLoader.ts'
import { playSound } from '../state/audioManager.ts'

/**
 * Экран «Поделиться»: отправить игру другу и получить бонус.
 * Рендерится как обычная страница меню (на примере about/settings), а не как модалка.
 * Кнопки остаются активными всегда — поделиться можно сколько угодно раз,
 * а бонус начисляется только один раз.
 */
export function renderShare(container: HTMLElement, onBack: () => void): { cleanup: () => void } {
  const section = document.createElement('section')
  section.className = 'share-screen'

  const head = document.createElement('div')
  head.className = 'share-screen-head'
  head.appendChild(createBackButton(onBack))

  const card = document.createElement('div')
  card.className = 'share-card'

  const desc = document.createElement('p')
  desc.className = 'share-desc'
  desc.innerHTML =
    'Расскажи другу про <strong>ToolHouse</strong> — выбери удобный способ отправить ссылку. ' +
    'За первое приглашение ты получишь бонус на счёт склада.'
  card.appendChild(desc)

  const reward = document.createElement('div')
  reward.className = 'share-reward'

  const rewardLabel = document.createElement('span')
  rewardLabel.className = 'share-reward-label'
  rewardLabel.textContent = 'Награда'

  const rewardValue = document.createElement('span')
  rewardValue.className = 'share-reward-value'
  rewardValue.textContent = formatMoney(getShareRewardAmount())

  reward.appendChild(rewardLabel)
  reward.appendChild(rewardValue)
  card.appendChild(reward)

  // Кнопки действий — круглые с иконками, всегда активны
  const actions = document.createElement('div')
  actions.className = 'share-actions'

  const copyBtn = createIconButton(linkIconImages['copy'], 'Копировать ссылку')
  const telegramBtn = createIconButton(linkIconImages['telegram'], 'Отправить в Telegram')

  actions.appendChild(copyBtn)
  actions.appendChild(telegramBtn)
  card.appendChild(actions)

  // Сообщение под кнопками
  const result = document.createElement('p')
  result.className = 'share-result'
  result.setAttribute('role', 'status')
  card.appendChild(result)

  // Бонус начисляется один раз, но поделиться можно повторно
  function finish(message: string): void {
    if (claimShareReward()) {
      result.textContent = `${message} Бонус ${formatMoney(getShareRewardAmount())} зачислен.`
    } else {
      result.textContent = `${message} Бонус за приглашение уже был получен.`
    }
  }

  copyBtn.addEventListener('click', async () => {
    playSound('click')
    try {
      await navigator.clipboard.writeText(window.location.href)
      finish('Ссылка скопирована.')
    } catch {
      result.textContent = 'Браузер не разрешил скопировать ссылку'
    }
  })

  telegramBtn.addEventListener('click', () => {
    playSound('click')
    const shareUrl = encodeURIComponent(window.location.href)
    const shareText = encodeURIComponent('Попробуй игру ToolHouse — симулятор управления складом!')
    window.open(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`, '_blank')
    finish('Ссылка отправлена в Telegram.')
  })

  // Подписка на стейт — при загрузке экрана показывает сообщение, если бонус уже получен.
  // finish() сам ставит текст с префиксом действия, поэтому подписка не должна его перезаписывать:
  // сообщение обновляется только когда оно пустое.
  const unsubscribe = subscribe((state) => {
    if (state.shareRewardClaimed) {
      if (!result.textContent) {
        result.textContent = 'Бонус за приглашение уже получен'
      }
    } else {
      result.textContent = ''
    }
  })

  section.appendChild(head)
  section.appendChild(card)
  container.appendChild(section)

  return { cleanup: unsubscribe }
}

/** Создаёт круглую кнопку с иконкой */
function createIconButton(iconSrc: string, label: string): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'share-action-btn'
  btn.title = label
  btn.setAttribute('aria-label', label)

  const icon = document.createElement('img')
  icon.src = iconSrc
  icon.alt = label
  icon.className = 'share-action-icon'
  btn.appendChild(icon)

  return btn
}
