Manual DOM: `document.createElement`, no virtual DOM and no `innerHTML` with data.

Modals only via `createModal` (src/utils/modalFactory.ts) — a custom overlay
breaks backdrop closing and the modal stack.

Helpers already exist: `domFactory`, `modalFactory`, `shopModalFactory`, `format`,
`itemLookup`, `progressBar`. Look there first; add new ones only after 3+ repeats.

Sound via `playSound` from `state/audioManager.ts`, not `new Audio()`.
Add CSS classes to the existing `src/styles/*.css` files, take color tokens
from `variables.css`.
