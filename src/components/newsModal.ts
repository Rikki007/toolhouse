import type { NewsItem } from '../types/index.ts'
import { getState } from '../state/state.ts'
import { formatMoney, pluralRu } from '../utils/format.ts'
import { mastersImages, pickerImages, richDriversImages } from '../assets/assetLoader.ts'
import coinImage from '../assets/coin/1.png'

/**
 * Аватарка автора сообщения.
 * Оффлайн-доход и глобальные события приходят от И.О.,
 * локальные — от сотрудника, задействованного в событии.
 */
function getNewsAvatarSrc(item: NewsItem): string {
  if (item.avatar) {
    const src =
      pickerImages[item.avatar] ||
      richDriversImages[item.avatar] ||
      mastersImages[item.avatar]
    if (src) return src
  }
  return mastersImages['actingAva'] ?? mastersImages['acting'] ?? ''
}

/** Сообщение в виде чата: аватарка слева, пузырь с текстом справа */
function createNewsMessage(item: NewsItem): HTMLElement {
  const isIncome = item.amount >= 0

  const message = document.createElement('div')
  message.className = 'news-message'

  const avatarSrc = getNewsAvatarSrc(item)
  if (avatarSrc) {
    const avatarWrap = document.createElement('span')
    avatarWrap.className = 'news-message-avatar-wrap'

    const avatar = document.createElement('img')
    avatar.className = 'news-message-avatar'
    avatar.src = avatarSrc
    avatar.alt = ''
    avatar.draggable = false
    avatarWrap.appendChild(avatar)

    message.appendChild(avatarWrap)
  }

  const bubble = document.createElement('div')
  bubble.className = `news-message-bubble ${isIncome ? 'news-card-income' : 'news-card-expense'}`

  const description = document.createElement('div')
  description.className = 'news-card-description'
  description.textContent = item.description
  bubble.appendChild(description)

  if (item.amount !== 0) {
    const amount = document.createElement('div')
    amount.className = `news-card-amount ${isIncome ? 'news-card-positive' : 'news-card-negative'}`
    amount.textContent = `${isIncome ? '+' : '−'}${formatMoney(Math.abs(item.amount))} `
    const coin = document.createElement('img')
    coin.className = 'news-card-coin'
    coin.src = coinImage
    coin.alt = ''
    amount.appendChild(coin)
    bubble.appendChild(amount)
  }

  if (item.tokens && item.tokens > 0) {
    const tokens = document.createElement('div')
    tokens.className = 'news-card-tokens'
    const count = `${item.tokens} ${pluralRu(item.tokens, ['жетон', 'жетона', 'жетонов'])}`
    tokens.textContent = item.amount !== 0 ? `и собрала ${count}` : count
    bubble.appendChild(tokens)
  }

  message.appendChild(bubble)
  return message
}

/**
 * Рендерит модальное окно новостей со списком непрочитанных событий.
 * Деньги по событиям уже применены — окно только информирует игрока.
 */
export function renderNewsModal(onClose: () => void): HTMLElement {
  const modal = document.createElement('div')
  modal.className = 'news-modal'

  const header = document.createElement('div')
  header.className = 'news-modal-header'

  const title = document.createElement('h2')
  title.className = 'news-modal-title'
  title.textContent = 'Новости'
  header.appendChild(title)

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'modal-close-btn news-modal-close'
  closeBtn.innerHTML = '×'
  closeBtn.addEventListener('click', onClose)
  header.appendChild(closeBtn)

  modal.appendChild(header)

  const body = document.createElement('div')
  body.className = 'news-modal-body'

  const items = getState().news

  if (items.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'news-empty'
    empty.textContent = 'Пока новостей нет'
    body.appendChild(empty)
  } else {
    const list = document.createElement('div')
    list.className = 'news-list'
    for (const item of items) {
      list.appendChild(createNewsMessage(item))
    }
    body.appendChild(list)
  }

  modal.appendChild(body)
  return modal
}
