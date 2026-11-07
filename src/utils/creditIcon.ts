/**
 * Значок игровой валюты (кредиты).
 * SVG отдаётся как data URI и вставляется через <img>, а не инлайном:
 * разметка содержит <clipPath id="...">, и несколько инлайновых копий
 * создали бы дубли id внутри одного документа.
 */
const CREDIT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none"><g clip-path="url(#credit-icon-clip)"><circle cx="11" cy="11" r="11" fill="#5680E9"/><circle cx="11.0003" cy="11.0003" r="9.68" fill="#4A6AB8"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.12793 6.16016V7.44028H10.1983V9.96633H9.06324V11.0663H10.1983V16.0161H11.6805V11.0663H12.9352V9.96633H11.6805V7.44028H14.7558V6.16016H7.12793Z" fill="#3D3D43"/></g><defs><clipPath id="credit-icon-clip"><rect width="22" height="22" fill="white"/></clipPath></defs></svg>`

/** data URI значка кредита — для <img> и CSS background-image */
export const CREDIT_ICON_URI = `data:image/svg+xml,${encodeURIComponent(CREDIT_ICON_SVG)}`

/**
 * Значок кредита для встраивания в текст цены.
 * @param size — сторона значка в пикселях
 */
export function createCreditIcon(size = 11): HTMLImageElement {
  const icon = document.createElement('img')
  icon.className = 'credit-icon'
  icon.src = CREDIT_ICON_URI
  icon.width = size
  icon.height = size
  icon.alt = ''
  icon.draggable = false
  return icon
}
