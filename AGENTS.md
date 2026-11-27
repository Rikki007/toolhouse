Vite + vanilla TS, no frameworks. Do not suggest React/Vue.
Verify changes with `npx tsc --noEmit` (no tests, no linter).

Imports: always with the `.ts` extension (`from '../state/state.ts'`).
Types: `import type`, and import from `src/types/index.ts`.
`enum` is forbidden (`erasableSyntaxOnly`) — use union literal types.
File names: camelCase.ts, components included.
Comments and user-facing text: Russian.
