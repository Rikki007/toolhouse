import { showPreloader, hidePreloader } from '../components/preloader.ts'
export { createPreloader, showPreloader, hidePreloader } from '../components/preloader.ts'

/**
 * Показывает прелоадер минимум на указанное время.
 * Полезно для плавных переходов между экранами.
 * @param container - Контейнер для прелоадера
 * @param minDuration - Минимальное время показа в мс (по умолчанию 2000)
 */
export async function showPreloaderWithMinDuration(
  container: HTMLElement,
  minDuration: number = 2000
): Promise<void> {
  const startTime = Date.now()
  const preloader = showPreloader(container)

  await new Promise<void>((resolve) => {
    const checkDuration = () => {
      if (Date.now() - startTime >= minDuration) {
        hidePreloader(preloader)
        resolve()
      } else {
        requestAnimationFrame(checkDuration)
      }
    }
    
    requestAnimationFrame(checkDuration)
  })
}
