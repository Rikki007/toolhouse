import type { Staff } from '../types/equipment.ts'
import type { TokenId } from '../types/index.ts'
import { createModal } from '../utils/modalFactory.ts'
import { getState } from '../state/state.ts'
import { getAllStaffIds } from '../state/inventoryStore.ts'
import { getStaffById } from '../utils/itemLookup.ts'
import { applyLevelUpTokenToStaff, getTokenCount } from '../state/tokenStore.ts'
import { getTokenConfig } from '../utils/tokenLookup.ts'
import {
  getStaffTierProgress,
  getStaffTierName,
  getStaffTierImageKey,
  previewStarUpgrade,
} from '../utils/staffUpgrades.ts'
import type { StarUpgradePreview } from '../utils/staffUpgrades.ts'
import { MAX_STAFF_TIER, MAX_TIER_LEVEL, STAFF_TIERS } from '../data/staffUpgrades.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { playSound } from '../state/audioManager.ts'
import { pickerImages, richDriversImages, tierImages } from '../assets/assetLoader.ts'

/** Опции модалки применения жетона повышения */
export interface StaffTokenPickerOptions {
  /** Вызывается после успешного применения жетона */
  onApplied?: () => void
}

/** Картинка аватара сотрудника */
function getStaffAvatarSrc(staff: Staff): string {
  return pickerImages[staff.avatar] || richDriversImages[staff.avatar] || ''
}

/** Звёзды уровня внутри лиги: ⭐⭐⭐☆☆☆… */
function formatStars(level: number): string {
  const stars = Math.max(0, Math.min(MAX_TIER_LEVEL, level))
  return '⭐'.repeat(stars) + '☆'.repeat(MAX_TIER_LEVEL - stars)
}

/** Причина, по которой часть звёзд не поместится в прогресс */
function getLeftoverNote(preview: StarUpgradePreview, playerLevel: number): string | null {
  if (preview.leftover === 0) return null

  if (preview.to.tier >= MAX_STAFF_TIER && preview.to.level >= MAX_TIER_LEVEL) {
    return `Сотрудник на максимуме: ${preview.leftover}★ сгорит`
  }

  const nextTier = preview.to.tier + 1
  const unlockLevel = STAFF_TIERS[nextTier - 1]?.unlockLevel
  if (unlockLevel !== undefined && playerLevel < unlockLevel) {
    return `Нужен ${unlockLevel}-й уровень игрока для перехода в следующую лигу — ${preview.leftover}★ сгорит`
  }

  return `Не поместилось ${preview.leftover}★`
}

/**
 * Модалка применения жетона повышения уровня.
 * Сначала список сотрудников, по клику — карточка сотрудника с кнопкой «Применить».
 * Кнопка «назад» в карточке возвращает к списку.
 * @returns Promise, который резолвится при закрытии окна
 */
export function openStaffTokenPicker(
  container: HTMLElement,
  tokenId: TokenId,
  options?: StaffTokenPickerOptions,
): Promise<void> {
  const tokenConfig = getTokenConfig(tokenId)
  const stars = tokenConfig.starCount ?? 1

  return new Promise<void>((resolve) => {
    createModal(container, {
      overlayClass: 'staff-token-overlay',
      onClose: resolve,
      renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'staff-token-modal'

      /** Шапка: заголовок и кнопка закрытия либо возврата */
      const buildHeader = (titleText: string, onBack: (() => void) | null): HTMLElement => {
        const header = document.createElement('div')
        header.className = 'staff-token-header'

        const title = document.createElement('h3')
        title.className = 'staff-token-title'
        title.textContent = titleText
        header.appendChild(title)

        const closeBtn = document.createElement('button')
        closeBtn.type = 'button'
        closeBtn.className = 'modal-close-btn staff-token-close'
        closeBtn.textContent = '×'
        closeBtn.title = onBack ? 'Назад к списку' : 'Закрыть'
        closeBtn.addEventListener('click', () => {
          playSound('click')
          if (onBack) {
            onBack()
          } else {
            onClose()
          }
        })
        header.appendChild(closeBtn)

        return header
      }

      /** Список сотрудников */
      const renderList = (): void => {
        modal.replaceChildren()
        modal.appendChild(buildHeader(tokenConfig.label, null))

        const body = document.createElement('div')
        body.className = 'staff-token-body'

        const hint = document.createElement('p')
        hint.className = 'staff-token-hint'
        hint.textContent = 'Выберите сотрудника, чтобы применить жетон'
        body.appendChild(hint)

        const staffList = getAllStaffIds()
          .map((id) => getStaffById(id))
          .filter((staff): staff is Staff => Boolean(staff))

        if (staffList.length === 0) {
          const empty = document.createElement('div')
          empty.className = 'staff-token-empty'
          empty.textContent = 'Нет сотрудников'
          body.appendChild(empty)
          modal.appendChild(body)
          return
        }

        const state = getState()
        const playerLevel = levelFromXp(state.xpMoney)

        const list = document.createElement('div')
        list.className = 'staff-token-list'

        for (const staff of staffList) {
          const progress = getStaffTierProgress(staff, state.staffUpgrades)
          const preview = previewStarUpgrade(staff, state.staffUpgrades, stars, playerLevel)

          const row = document.createElement('button')
          row.type = 'button'
          row.className = 'staff-token-item'
          if (!preview) row.classList.add('staff-token-item-maxed')

          const avatarSrc = getStaffAvatarSrc(staff)
          if (avatarSrc) {
            const avatar = document.createElement('img')
            avatar.className = 'staff-token-item-avatar'
            avatar.src = avatarSrc
            avatar.alt = staff.name
            avatar.draggable = false
            row.appendChild(avatar)
          } else {
            const placeholder = document.createElement('div')
            placeholder.className = 'staff-token-item-avatar staff-token-item-avatar-empty'
            placeholder.textContent = '👤'
            row.appendChild(placeholder)
          }

          const info = document.createElement('div')
          info.className = 'staff-token-item-info'

          const nameEl = document.createElement('div')
          nameEl.className = 'staff-token-item-name'
          nameEl.textContent = staff.name
          info.appendChild(nameEl)

          const positionEl = document.createElement('div')
          positionEl.className = 'staff-token-item-position'
          positionEl.textContent = staff.position
          info.appendChild(positionEl)

          const starsEl = document.createElement('div')
          starsEl.className = 'staff-token-item-stars'
          starsEl.textContent = `${getStaffTierName(staff, state.staffUpgrades)} лига · ${formatStars(progress.level)}`
          info.appendChild(starsEl)

          row.appendChild(info)

          const gainEl = document.createElement('div')
          gainEl.className = 'staff-token-item-gain'
          gainEl.textContent = preview ? `+${preview.spent}★` : 'Максимум'
          row.appendChild(gainEl)

          row.addEventListener('click', () => {
            playSound('click')
            renderCard(staff)
          })

          list.appendChild(row)
        }

        body.appendChild(list)
        modal.appendChild(body)
      }

      /** Карточка сотрудника */
      const renderCard = (staff: Staff): void => {
        const state = getState()
        const playerLevel = levelFromXp(state.xpMoney)
        const progress = getStaffTierProgress(staff, state.staffUpgrades)
        const preview = previewStarUpgrade(staff, state.staffUpgrades, stars, playerLevel)

        modal.replaceChildren()
        modal.appendChild(buildHeader(staff.name, renderList))

        const body = document.createElement('div')
        body.className = 'staff-token-body staff-token-card'

        const tierKey = getStaffTierImageKey(staff, state.staffUpgrades)
        const tierSrc = tierImages[tierKey]
        if (tierSrc) {
          const bookmark = document.createElement('img')
          bookmark.className = 'staff-tier-bookmark'
          bookmark.src = tierSrc
          bookmark.alt = getStaffTierName(staff, state.staffUpgrades)
          bookmark.draggable = false
          body.appendChild(bookmark)
        }

        const avatarSrc = getStaffAvatarSrc(staff)
        if (avatarSrc) {
          const avatar = document.createElement('img')
          avatar.className = 'staff-token-card-avatar'
          avatar.src = avatarSrc
          avatar.alt = staff.name
          avatar.draggable = false
          body.appendChild(avatar)
        } else {
          const placeholder = document.createElement('div')
          placeholder.className = 'staff-token-card-avatar staff-token-card-avatar-empty'
          placeholder.textContent = '👤'
          body.appendChild(placeholder)
        }

        const nameEl = document.createElement('div')
        nameEl.className = 'staff-token-card-name'
        nameEl.textContent = staff.name
        body.appendChild(nameEl)

        const positionEl = document.createElement('div')
        positionEl.className = 'staff-token-card-position'
        positionEl.textContent = staff.position
        body.appendChild(positionEl)

        const params = document.createElement('div')
        params.className = 'staff-token-card-params'

        const tierRow = document.createElement('div')
        tierRow.className = 'staff-token-card-param'
        tierRow.textContent = `Лига: ${getStaffTierName(staff, state.staffUpgrades)}`
        params.appendChild(tierRow)

        const starsRow = document.createElement('div')
        starsRow.className = 'staff-token-card-param'
        starsRow.textContent = formatStars(progress.level)
        params.appendChild(starsRow)

        const speedRow = document.createElement('div')
        speedRow.className = 'staff-token-card-param staff-token-card-speed'
        if (preview) {
          speedRow.textContent = `Скорость: ${preview.speedFrom} → ${preview.speedTo}`
        } else {
          speedRow.textContent = 'Скорость: максимум'
        }
        params.appendChild(speedRow)

        if (preview) {
          const gainRow = document.createElement('div')
          gainRow.className = 'staff-token-card-param staff-token-card-gain'
          if (preview.to.tier !== preview.from.tier) {
            gainRow.textContent = `${getStaffTierName(staff, state.staffUpgrades)} → ${STAFF_TIERS[preview.to.tier - 1].name} лига`
          } else {
            gainRow.textContent = `Уровень: ${preview.from.level}★ → ${preview.to.level}★`
          }
          params.appendChild(gainRow)

          const note = getLeftoverNote(preview, playerLevel)
          if (note) {
            const noteEl = document.createElement('div')
            noteEl.className = 'staff-token-card-note'
            noteEl.textContent = note
            params.appendChild(noteEl)
          }
        }

        body.appendChild(params)

        const applyBtn = document.createElement('button')
        applyBtn.type = 'button'
        applyBtn.className = 'staff-token-apply-btn'

        if (!preview) {
          applyBtn.textContent = 'Максимальный уровень'
          applyBtn.disabled = true
        } else {
          applyBtn.textContent = 'Применить'
          applyBtn.addEventListener('click', () => {
            if (!applyLevelUpTokenToStaff(tokenId, staff.id)) return
            playSound('levelUp')
            options?.onApplied?.()

            if (getTokenCount(tokenId) > 0) {
              // Остались жетоны — возвращаемся к списку, чтобы применить ещё
              renderList()
            } else {
              onClose()
            }
          })
        }

        body.appendChild(applyBtn)
        modal.appendChild(body)
      }

      renderList()
      return modal
      },
    })
  })
}
