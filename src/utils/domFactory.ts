import { playSound } from '../state/audioManager.ts'

/**
 * Создаёт кнопку «назад» со стрелкой влево.
 */
export function createBackButton(onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'back-btn'
  btn.textContent = '←'
  btn.addEventListener('click', () => {
    playSound('click')
    onClick()
  })
  return btn
}

/**
 * Создаёт ссылку-иконку.
 */
export function createIconLink(
  href: string,
  imgSrc: string,
  alt: string,
  target?: string
): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = href
  link.className = 'about-link'
  if (target) link.target = target

  const img = document.createElement('img')
  img.src = imgSrc
  img.alt = alt
  link.appendChild(img)

  link.addEventListener('click', () => playSound('click'))

  return link
}

/**
 * Создаёт группу поля ввода с лейблом.
 */
export function createInputField(
  label: string,
  inputType: string,
  inputId: string,
  placeholder: string,
  required = true
): { group: HTMLDivElement; input: HTMLInputElement } {
  const group = document.createElement('div')
  group.className = 'auth-field'

  const labelEl = document.createElement('label')
  labelEl.className = 'auth-label'
  labelEl.textContent = label

  const input = document.createElement('input')
  input.type = inputType
  input.className = 'auth-input'
  input.id = inputId
  input.placeholder = placeholder
  input.required = required

  group.appendChild(labelEl)
  group.appendChild(input)

  return { group, input }
}

/**
 * Создаёт кнопку отправки формы.
 */
export function createSubmitButton(text: string, className = 'auth-button'): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'submit'
  btn.className = className
  btn.textContent = text
  return btn
}

/**
 * Создаёт контейнер для фона с z-index: -1.
 */
export function createBackgroundContainer(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.position = 'absolute'
  el.style.top = '0'
  el.style.left = '0'
  el.style.width = '100%'
  el.style.height = '100%'
  el.style.zIndex = '-1'
  el.style.overflow = 'hidden'
  return el
}

/**
 * Создаёт строку настроек с переключателем (toggle).
 */
export function createToggleRow(
  label: string,
  initialChecked: boolean,
  onChange: (value: boolean) => Promise<void>
): HTMLDivElement {
  const row = document.createElement('div')
  row.className = 'settings-row'

  const labelEl = document.createElement('span')
  labelEl.className = 'settings-label'
  labelEl.textContent = label

  let checked = initialChecked

  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'toggle-button'
  toggle.setAttribute('aria-pressed', String(checked))
  toggle.textContent = checked ? 'Вкл' : 'Выкл'

  toggle.addEventListener('click', async () => {
    checked = !checked
    toggle.setAttribute('aria-pressed', String(checked))
    toggle.textContent = checked ? 'Вкл' : 'Выкл'
    await onChange(checked)
  })

  row.appendChild(labelEl)
  row.appendChild(toggle)
  return row
}

/**
 * Создаёт строку настроек с выпадающим списком (select).
 */
export function createSelectRow<T extends string>(
  label: string,
  options: { value: T; label: string }[],
  currentValue: T,
  onChange: (value: T) => Promise<void>
): HTMLDivElement {
  const row = document.createElement('div')
  row.className = 'settings-row settings-select-row'

  const labelEl = document.createElement('span')
  labelEl.className = 'settings-label'
  labelEl.textContent = label

  const select = document.createElement('select')
  select.className = 'settings-select'

  for (const option of options) {
    const opt = document.createElement('option')
    opt.value = option.value
    opt.textContent = option.label
    opt.selected = option.value === currentValue
    select.appendChild(opt)
  }

  select.addEventListener('change', async () => {
    const value = select.value as T
    await onChange(value)
  })

  row.appendChild(labelEl)
  row.appendChild(select)
  return row
}
