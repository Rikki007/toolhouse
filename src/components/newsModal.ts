import type { NewsItem } from '../types/index.ts'
import { getState } from '../state/state.ts'
import { formatMoney } from '../utils/format.ts'

/** Карточка одной новости: заголовок, текст и изменение баланса */
function createNewsCard(item: NewsItem): HTMLElement {
  const isIncome = item.amount >= 0

  const card = document.createElement('div')
  card.className = `news-card ${isIncome ? 'news-card-income' : 'news-card-expense'}`

  const title = document.createElement('div')
  title.className = 'news-card-title'
  title.textContent = item.title
  card.appendChild(title)

  const description = document.createElement('div')
  description.className = 'news-card-description'
  description.textContent = item.description
  card.appendChild(description)

  const amount = document.createElement('div')
  amount.className = `news-card-amount ${isIncome ? 'news-card-positive' : 'news-card-negative'}`
  amount.textContent = `${isIncome ? '+' : '−'}${formatMoney(Math.abs(item.amount))} 🪙`
  card.appendChild(amount)

  return card
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
      list.appendChild(createNewsCard(item))
    }
    body.appendChild(list)
  }

  modal.appendChild(body)
  return modal
}
