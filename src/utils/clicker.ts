import { getState, updateState } from '../state/state.ts'
import { createCoinAnimation } from '../effects/coinAnimation.ts'
import { formatMoney } from './format.ts'
import { playSound } from '../state/audioManager.ts'

export interface ClickerDeps {
  clickArea: HTMLElement
  moneyEl: HTMLElement | null
}

export function setupClicker(deps: ClickerDeps): { cleanup: () => void } {
  const { clickArea, moneyEl } = deps

  // Начисление пассивного дохода каждую секунду.
  // Значение берём из стейта: его обновляет updateStateWithIncome при каждой
  // покупке, а локальный пересчёт легко теряет один из источников дохода.
  const passiveIntervalId = setInterval(() => {
    const state = getState()
    const passiveIncome = state.passiveIncomePerSecond
    if (passiveIncome > 0) {
      const newMoney = state.money + passiveIncome
      updateState({ money: newMoney })
      if (moneyEl) moneyEl.textContent = formatMoney(newMoney)
    }
  }, 1000)

  // Обработчик кликов
  clickArea.addEventListener('pointerdown', (e: PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, select, textarea, .minigame-btn, .lootbox-btn, .shifts-btn')) return

    // За один клик начисляем столько же, сколько приносит пассивный доход в секунду
    const incomePerClick = getState().passiveIncomePerSecond
    const newMoney = getState().money + incomePerClick
    updateState({ money: newMoney, clicks: getState().clicks + 1 })
    if (moneyEl) moneyEl.textContent = formatMoney(newMoney)

    // Звук добычи монетки
    playSound('minig')

    // Анимация монетки
    const coin = createCoinAnimation(32)
    coin.style.position = 'absolute'
    coin.style.left = `${e.clientX}px`
    coin.style.top = `${e.clientY}px`
    coin.style.transform = 'translate(-50%, -50%)'
    coin.style.pointerEvents = 'none'
    coin.style.zIndex = '1000'
    document.body.appendChild(coin)

    // Анимация всплытия монетки
    const floatSvg = document.createElement('div')
    floatSvg.style.cssText = `
      position: absolute;
      left: ${e.clientX}px;
      top: ${e.clientY - 20}px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1001;
      transition: all 0.8s ease-out;
    `
    floatSvg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 22 22" fill="none"><g clip-path="url(#clip0_4207_34948)"><circle cx="11" cy="11" r="11" fill="#5680E9"/><circle cx="11.0003" cy="11.0003" r="9.68" fill="#4A6AB8"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.12793 6.16016V7.44028H10.1983V9.96633H9.06324V11.0663H10.1983V16.0161H11.6805V11.0663H12.9352V9.96633H11.6805V7.44028H14.7558V6.16016H7.12793Z" fill="#3D3D43"/></g><defs><clipPath id="clip0_4207_34948"><rect width="22" height="22" fill="white"/></clipPath></defs></svg>`
    document.body.appendChild(floatSvg)

    requestAnimationFrame(() => {
      coin.style.opacity = '0'
      coin.style.transform = 'translate(-50%, -50%) scale(0.5)'
      floatSvg.style.top = `${e.clientY - 80}px`
      floatSvg.style.opacity = '0'
    })

    setTimeout(() => {
      coin.remove()
      floatSvg.remove()
    }, 900)
  })

  return {
    cleanup: () => {
      clearInterval(passiveIntervalId)
    }
  }
}
