Vite + vanilla TS, без фреймворков. Не предлагать React/Vue.
Проверка изменений: `npx tsc --noEmit` (тестов и линтера нет).

Импорты: всегда с расширением `.ts` (`from '../state/state.ts'`).
Типы: `import type` и импортировать из `src/types/index.ts`.
`enum` запрещён (`erasableSyntaxOnly`) — используй union literal.
Имена файлов: camelCase.ts, для компонентов тоже.
Комментарии и пользовательский текст — на русском.
