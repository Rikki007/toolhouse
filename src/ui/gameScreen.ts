import type { TabType } from '../types/index.ts'
import { tabs, getTabLabel } from '../types/game.ts'
import { renderShopModal } from '../components/shopScreen.ts'
import { renderSkillsModal } from '../components/skills.ts'
import { startSkillAnalysisWatcher } from '../components/skillAnalysis.ts'
import { renderAchievementsModal } from '../components/achievements.ts'
import { renderGameToolbar } from '../components/minigamesToolbar.ts'
import { createCoinAnimation } from '../effects/coinAnimation.ts'
import { initPixiBackground } from '../effects/pixiBackground.ts'
import { showPreloaderWithMinDuration } from '../utils/preloader.ts'
import { createBackButton, createBackgroundContainer } from '../utils/domFactory.ts'
import { createModal } from '../utils/modalFactory.ts'
import { getState, calculateOfflineIncome, applyOfflineIncome, addNewsItem, markPlayerLevelSeen, subscribe, startPassiveIncomeTracking, stopPassiveIncomeTracking } from '../state/state.ts'
import { formatMoney } from '../utils/format.ts'
import { levelFromXp } from '../data/playerLevels.ts'
import { setupClicker } from '../utils/clicker.ts'
import { startGlobalEventsObserver } from '../utils/globalEvents.ts'
import { startLevelRewardObserver } from '../components/levelRewardModal.ts'
import { startEquipmentUnlockObserver } from '../components/equipmentUnlockModal.ts'
import { startTierUnlockObserver } from '../components/tierUnlockModal.ts'
import { startShiftExpansionObserver } from '../components/shiftExpansionModal.ts'
import { interfaceIconImages } from '../assets/assetLoader.ts'
import { playSound } from '../state/audioManager.ts'

import gameBackUrl from '../assets/backgrounds/gameBack.png'

export async function renderGameScreen(
  container: HTMLElement,
  onBack: () => void,
  _onSettings: () => Promise<void>,
  onRestart?: () => void,
): Promise<() => void> {
  container.innerHTML = ''
  container.className = 'game-screen'

  // Рассчитываем оффлайн-доход
  const offline = calculateOfflineIncome()

  // PixiJS фон (должен быть добавлен первым в container)
  const bgContainer = createBackgroundContainer()
  container.insertBefore(bgContainer, container.firstChild)

  const { cleanup: cleanupPixi } = await initPixiBackground({
    container: bgContainer,
    backgroundUrl: gameBackUrl,
    resizeMode: 'stretch',
  })

  // Верхняя панель
  const topBar = createTopBar(onBack)
  container.appendChild(topBar)

  // Основной контент
  const mainContent = document.createElement('main')
  mainContent.className = 'game-main'
  
  // Область кликера (отдельный элемент, чтобы не блокировать тулбар)
  const clickArea = document.createElement('div')
  clickArea.className = 'game-click-area'
  mainContent.appendChild(clickArea)
  
  container.appendChild(mainContent)

  // Тулбар с мини-играми, лутбоксами и сменами (добавляем в container, а не в mainContent)
  renderGameToolbar(container)

  // Ссылки на элементы UI (они в topBar, не в mainContent)
  const moneyEl = topBar.querySelector('.game-money') as HTMLElement | null
  
  // Настраиваем кликер
  const clicker = setupClicker({ clickArea, moneyEl })

  // Запускаем наблюдатель глобальных событий
  const stopGlobalEvents = startGlobalEventsObserver({ container, moneyEl })

  // Запускаем трекинг оффлайн-дохода
  startPassiveIncomeTracking()

  // Окна анализа по закрытым гейтам разветвлений (11, 19, 27, 35 и 42 уровни).
  // Финальное окно может сбросить прогресс — тогда пересобираем игровой экран.
  const stopSkillAnalysis = startSkillAnalysisWatcher(container, () => {
    onRestart?.()
  })

  // Уведомления о разблокировке новой техники в магазине
  const stopEquipmentUnlocks = startEquipmentUnlockObserver(container)

  // Уведомления о разблокировке новых тиров персонала
  const stopTierUnlocks = startTierUnlockObserver(container)

  // Уведомления о расширении смен
  const stopShiftExpansions = startShiftExpansionObserver(container)

  // Начисляем оффлайн-доход сразу и сообщаем о нём новостью
  if (offline.amount > 0) {
    applyOfflineIncome(offline.amount)
    addNewsItem({
      kind: 'offline',
      title: 'Оффлайн доход',
      description: 'Вы заработали:',
      amount: offline.amount,
    })
    if (moneyEl) moneyEl.textContent = formatMoney(getState().money)
  }

  // Награды за новые уровни.
  // Запускаем после оффлайн-дохода: subscribe дёргается сразу и ловит уровни,
  // полученные за время отсутствия.
  const stopLevelRewards = startLevelRewardObserver(container)

  // Нижняя панель (тулбар)
  const bottomBar = createBottomBar(container)
  container.appendChild(bottomBar.element)

  return () => {
    cleanupPixi()
    clicker.cleanup()
    stopGlobalEvents()
    stopSkillAnalysis()
    stopEquipmentUnlocks()
    stopTierUnlocks()
    stopShiftExpansions()
    stopLevelRewards()
    bottomBar.cleanup()
    stopPassiveIncomeTracking()
  }
}

function createTopBar(onBack: () => void): HTMLElement {
  const topBar = document.createElement('header')
  topBar.className = 'game-top-bar'

  // Кнопка назад
  topBar.appendChild(createBackButton(onBack))

  // Показатели выручки
  const statsContainer = document.createElement('div')
  statsContainer.className = 'game-stats'
  
  // Создаём контейнер для монетки и суммы
  const moneyContainer = document.createElement('div')
  moneyContainer.className = 'game-money-container'
  
  // Добавляем анимацию монетки
  const coinAnimation = createCoinAnimation(28)
  moneyContainer.appendChild(coinAnimation)
  
  const moneyEl = document.createElement('span')
  moneyEl.className = 'game-money'
  moneyEl.textContent = formatMoney(getState().money)
  moneyContainer.appendChild(moneyEl)
  
  statsContainer.appendChild(moneyContainer)
  topBar.appendChild(statsContainer)

  return topBar
}

function createBottomBar(container: HTMLElement): { element: HTMLElement; cleanup: () => void } {
  const bottomBar = document.createElement('nav')
  bottomBar.className = 'game-bottom-bar'

  // Список подписок, которые нужно отменить при выходе
  const unsubscribes: (() => void)[] = []

  for (const tab of tabs) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'game-tab-btn'
    btn.dataset.tab = tab.id
    
    if (tab.iconKey && interfaceIconImages[tab.iconKey]) {
      const iconImg = document.createElement('img')
      iconImg.src = interfaceIconImages[tab.iconKey]
      iconImg.alt = tab.label
      iconImg.style.width = '30px'
      iconImg.style.height = '30px'
      iconImg.style.objectFit = 'contain'
      btn.appendChild(iconImg)
    }

    // Индикатор для вкладки "Отделы" — активен при новом уровне игрока
    if (tab.id === 'skills') {
      const indicator = document.createElement('span')
      indicator.className = 'department-indicator'
      btn.appendChild(indicator)

      // Звук играем только при фактическом повышении уровня, а не при загрузке игры
      let previousLevel = levelFromXp(getState().xpMoney)
      const updateIndicator = () => {
        const state = getState()
        const currentLevel = levelFromXp(state.xpMoney)
        if (currentLevel > previousLevel) {
          playSound('levelUp')
          previousLevel = currentLevel
        }
        indicator.classList.toggle('department-indicator-available', currentLevel > state.seenPlayerLevel)
      }
      updateIndicator()
      unsubscribes.push(subscribe(updateIndicator))
    }
    
    btn.addEventListener('click', () => {
      playSound('click')
      openTab(tab.id, container)
    })
    bottomBar.appendChild(btn)
  }

  return {
    element: bottomBar,
    cleanup: () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe()
      }
    },
  }
}

async function openTab(tabId: TabType, container: HTMLElement): Promise<void> {
  // Показываем прелоадер минимум на 2 секунды
  await showPreloaderWithMinDuration(container, 2000)

  // Отписка от изменений стейта при закрытии
  let skillsCleanup: (() => void) | undefined

  // Создаём модальное окно через универсальный хелпер
  createModal(container, {
    overlayClass: 'game-modal-overlay',
    renderContent: (onClose) => {
      const modal = document.createElement('div')
      modal.className = 'game-modal'

      const modalHeader = document.createElement('div')
      modalHeader.className = 'game-modal-header'

      const title = document.createElement('h2')
      title.className = 'game-modal-title'
      title.textContent = getTabLabel(tabId)
      modalHeader.appendChild(title)

      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.className = 'modal-close-btn game-modal-close'
      closeBtn.innerHTML = '×'
      closeBtn.addEventListener('click', () => {
        playSound('click')
        onClose()
      })
      modalHeader.appendChild(closeBtn)

      modal.appendChild(modalHeader)

      const modalContent = document.createElement('div')
      modalContent.className = 'game-modal-content'
      
      // Рендерим контент в зависимости от вкладки
      if (tabId === 'shop') {
        modalContent.appendChild(renderShopModal(container))
      } else if (tabId === 'skills') {
        const skillsModal = renderSkillsModal()
        skillsCleanup = skillsModal.cleanup
        modalContent.appendChild(skillsModal)
        // Помечаем текущий уровень как «увиденный» — гасим индикатор на кнопке
        markPlayerLevelSeen()
      } else if (tabId === 'achievements') {
        modalContent.appendChild(renderAchievementsModal())
      } else {
        modalContent.textContent = 'Контент в разработке...'
      }
      
      modal.appendChild(modalContent)
      return modal
    },
    onClose: () => {
      skillsCleanup?.()
    },
  })
}
