Ручной DOM: `document.createElement`, без виртуального DOM и `innerHTML` с данными.

Модальные окна только через `createModal` (src/utils/modalFactory.ts) —
свой оверлей ломает закрытие по фону и стек модалок.

Хелперы уже есть: `domFactory`, `modalFactory`, `shopModalFactory`, `format`,
`itemLookup`, `progressBar`. Сначала искать там, новое — только при повторе 3+.

Звук через `playSound` из `state/audioManager.ts`, не `new Audio()`.
CSS-классы добавлять в существующие файлы `src/styles/*.css`, токены цвета
брать из `variables.css`.
