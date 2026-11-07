/**
 * Генерирует CSS @keyframes для покадровой анимации.
 * @param animationName — имя анимации (уникальное в рамках документа)
 * @param frames — массив URL кадров
 * @param percentages — опциональный массив процентов для каждого кадра.
 *                      Если не передан — кадры распределяются равномерно.
 * @returns CSS-строка с keyframes
 */
export function generateKeyframes(
  animationName: string,
  frames: string[],
  percentages?: number[]
): string {
  const totalFrames = frames.length
  let css = `@keyframes ${animationName} {\n`

  const percents = percentages ?? frames.map((_, i) => (i / totalFrames) * 100)

  for (let i = 0; i < totalFrames; i++) {
    css += `  ${percents[i]}% { background-image: url('${frames[i]}'); }\n`
  }

  // Зацикливаем: 100% совпадает с последним кадром
  css += `  100% { background-image: url('${frames[totalFrames - 1]}'); }\n`
  css += '}'
  return css
}

/**
 * Вставляет CSS с @keyframes в <head>, если style с таким id ещё нет.
 */
export function injectKeyframes(css: string, id: string): void {
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = css
    document.head.appendChild(style)
  }
}
