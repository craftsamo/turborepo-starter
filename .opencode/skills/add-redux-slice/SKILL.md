---
name: add-redux-slice
description: Use when adding a new Redux Toolkit slice to apps/web (e.g. a counter, cart, or feature state). Covers createSlice in store/slices, default-exporting the reducer, named-exporting actions, registering in store/index.ts, and using the typed hooks useAppDispatch/useAppSelector. Trigger keywords: "Redux slice", "createSlice", "useAppDispatch", "useAppSelector", "store reducer".
license: MIT
compatibility: opencode
metadata:
  category: implementation
  package: web
  stack: redux-toolkit,react-redux,react19
---

<Goal>

Add a new Redux Toolkit slice to `apps/web` for client-side state, wire it into
the store, and consume it through the project's typed hooks — never raw
`useDispatch`/`useSelector`.

</Goal>

<Scope>

- App: `apps/web`
- Files:
  - `src/store/slices/<name>.ts` — new slice (create this)
  - `src/store/index.ts` — register reducer + (already exports typed hooks)
- Full conventions: see `apps/web/AGENTS.md` (always loaded).
- Reference: `src/store/slices/counter.ts` is the canonical example.

</Scope>

<Steps>

1. **Create the slice** in `src/store/slices/<name>.ts`, mirroring
   `counter.ts`:
   ```ts
   import { createSlice } from '@reduxjs/toolkit';

   type <Name>State = { /* ... */ };

   const initialState = { /* ... */ } as <Name>State;

   const <name> = createSlice({
     name: '<name>',
     initialState,
     reducers: {
       reset: () => initialState,
       // mutative drafts are fine — Immer is in use
       someAction: (state, action) => { state.x = action.payload; },
     },
   });

   export const { someAction, reset } = <name>.actions;
   export default <name>.reducer;
   ```
2. **Default-export the reducer**, **named-export the actions** (matches
   `counter.ts:25-27`).
3. **Register the reducer** in `src/store/index.ts`:
   ```ts
   import <name>Reducer from './slices/<name>';

   export const store = configureStore({
     reducer: {
       counter: counterReducer,
       <name>: <name>Reducer,
     },
   });
   ```
4. **Typed hooks already exist** in `src/store/index.ts` — do NOT recreate
   them:
   - `useAppDispatch` (typed `AppDispatch`)
   - `useAppSelector` (typed `RootState`)
   Import them from `@/store`, never raw `useDispatch`/`useSelector` from
   `react-redux`.
5. **Consume in a client component** (`'use client'`):
   ```tsx
   'use client';
   import { useAppDispatch, useAppSelector } from '@/store';
   import { someAction } from '@/store/slices/<name>';
   ```
6. Slices are client-side only — the store is provided via
   `ReduxToolProvider` in `src/components/Providers/ReduxTool.tsx`, which is
   mounted in `app/layout.tsx`. Server components cannot read the store.

</Steps>

<Verify>

- `nps lint.web` — ESLint `--max-warnings 0`
- `nps typecheck.web` — `tsc --noEmit`
- `nps build.web` — `next build`
- `nps test.web` — Vitest run (add a test if the slice has non-trivial logic;
  see the `add-web-test` skill)

</Verify>

<AntiPatterns>

- Do NOT use raw `useDispatch` / `useSelector` — they lose type safety. Use
  `useAppDispatch` / `useAppSelector` from `@/store`.
- Do NOT export the reducer as a named export — default-export it (matches
  `counter.ts` and the `import <name>Reducer from './slices/<name>'` pattern).
- Do NOT try to access the store from a server component — Redux is
  client-side only in this setup.
- Do NOT recreate `configureStore` or the typed hooks — they live in
  `src/store/index.ts` only.

</AntiPatterns>
