---
name: nextjs-server-action
description: Use when implementing a Next.js Server Action in apps/web with React 19 useActionState and Sonner toast feedback. Covers the two-tier 'use server' architecture (route action.ts + src/lib/api SDK), the ActionResult<T> shape, inline toast wrapper with stable id + mutation lock, optimistic-on-success derived render, direct-await pattern for non-form actions, revalidateTag(tag, 'max') cache invalidation, and the notice/log error split. FORESIGHT recipe: the starter does not currently use server actions; adopt when a form or button needs to mutate server state with progressive feedback. Trigger keywords: "server action", "use server", "useActionState", "ActionResult", "Sonner", "toast", "revalidateTag", "form mutation", "logout action".
license: MIT
compatibility: opencode
metadata:
  category: foresight
  package: web
  stack: nextjs-16,react-19,server-actions,sonner,use-action-state
---

<Goal>

Add a Next.js Server Action that mutates server state from a client form (or
button/menu), surface progressive feedback via Sonner toasts, and invalidate the
relevant cache — using the proven, repo-accurate pattern below.

</Goal>

<Context>

This skill is a **foresight recipe**. The starter (`apps/web`) does not
currently use Server Actions — its state is client-side Redux Toolkit, and
`rg "use server"` returns zero hits. Adopt this pattern when a form or button
needs to submit data to the server (e.g. settings save, logout) with
progressive, toast-based feedback.

The Sonner toaster is already mounted in `app/layout.tsx` via `<Toaster />`
(`@workspace/ui/components/sonner`), so no new provider is needed.

This recipe is adapted from a production Next 16 + React 19 codebase. The
patterns below are proven, not theoretical.

</Context>

<Architecture>

Two `'use server'` tiers — this is the backbone of the pattern:

<Tier1>

**Route-local action** — `app/<route>/action.ts` (singular) or
`app/<route>/actions.ts` (plural), placed **next to `page.tsx`**, NOT under
`components/`. Thin entry point invoked from the client:
- validates `formData` by hand
- calls into Tier 2 (the SDK)
- calls `revalidateTag(tag, 'max')` on success
- returns `ActionResult<T>`

</Tier1>

<Tier2>

**Server-only SDK** — `src/lib/api/**/*.ts`, the whole module marked
`'use server'`. The backend boundary. Wraps a fetch client (or your own API
client). Also called directly from server components for reads.

Why `'use server'` on the whole module (instead of the `server-only` package)?
Because the SDK needs `cookies()` / `headers()` / `revalidateTag()` —
`'use server'` is the boundary marker that makes none of it importable into a
client component. That's a hard boundary, enforced by the compiler.

</Tier2>

</Architecture>

<ResultType>

Define a single shared generic union in `src/lib/api/types.ts`. **No `ok`
field, no `fieldErrors`** — errors are one client-safe `message` + `code`:

```ts
// src/lib/api/types.ts
import type { ErrorCode } from '@workspace/constants';

export type ActionSuccessResult<T> = {
  success: true;
  isError: false;
  data: T;
};

export type ActionErrorResult = {
  success: false;
  isError: true;
  code: ErrorCode | 'UNKNOWN';
  message: string; // client-safe — from ErrorMessage.notice / NodeErrorMessage.notice
};

export type ActionResult<T> = ActionSuccessResult<T> | ActionErrorResult;
```

The route action's `prev` parameter is typed **`null`** and is always invoked
with `null` from the client (not a union with the result):

```ts
// app/<route>/actions.ts
'use server';

export async function saveThing(
  _: null,
  formData: FormData,
): Promise<ActionResult<Thing>> { /* ... */ }
```

</ResultType>

<ErrorNormalization>

Enforce the "don't leak `log` to the client" rule structurally, not just by
convention. Put a normalizer in `src/lib/api/utils/toActionErrorResult.ts`:

```ts
import type { ActionErrorResult } from '../types';
import { NodeErrorMessage, type ErrorCode } from '@workspace/constants';

export function toActionErrorResult(e: unknown): ActionErrorResult {
  const base = { success: false, isError: true } as const;
  // If you adopt a custom API client with notice/log split (like SDKError),
  // branch on it here and return e.noticeMessage — keep e.logMessage server-side.
  if (e instanceof Error) {
    return { ...base, code: 'UNKNOWN' as const, message: NodeErrorMessage.NodeError.notice };
  }
  return { ...base, code: 'UNKNOWN' as const, message: NodeErrorMessage.UnknownError.notice };
}
```

Rule: **the action/SDK returns `ErrorMessage.notice` / `NodeErrorMessage.notice`
to the client; `.log` stays server-side** (pass it to your logger only). This is
the structural enforcement — a future custom error class with separate
`noticeMessage` / `logMessage` fields slots in naturally.

</ErrorNormalization>

<Scope>

- App: `apps/web`
- Tier 1: `app/<route>/action.ts` or `app/<route>/actions.ts`
- Tier 2: `src/lib/api/**/*.ts` (`types.ts`, per-domain modules,
  `utils/toActionErrorResult.ts`, `utils/cacheTags.ts`, `utils/revalidate.ts`)
- Client consumers: `'use client'` components under `app/<route>/components/`
- Toasts: `import { toast } from 'sonner'` (transitive via `@workspace/ui`)

</Scope>

<Steps>

### 1. Write the shared result types + normalizer

Create `src/lib/api/types.ts` (see `<ResultType>`) and
`src/lib/api/utils/toActionErrorResult.ts` (see `<ErrorNormalization>`). Add
barrels (`src/lib/api/index.ts`, `src/lib/api/utils/index.ts`) as you add
modules.

### 2. Write the Tier 2 SDK module

`src/lib/api/<domain>.ts`, marked `'use server'` at the top. Each function
resolves the session (when you add auth), calls the backend, returns
`ActionResult<T>`, and normalizes throws via `toActionErrorResult`:

```ts
'use server';

import type { ActionResult } from './types';
import { toActionErrorResult } from './utils';

export async function getThing(id: string): Promise<ActionResult<Thing>> {
  try {
    const res = await fetch(`${process.env.API_URL}/things/${id}`, {
      cache: 'force-cache',
      next: { tags: [thingTag(id)], revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Thing;
    return { success: true, isError: false, data };
  } catch (e: unknown) {
    return toActionErrorResult(e);
  }
}

export async function updateThing(id: string, input: Partial<Thing>): Promise<ActionResult<Thing>> {
  try {
    const res = await fetch(`${process.env.API_URL}/things/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Thing;
    return { success: true, isError: false, data };
  } catch (e: unknown) {
    return toActionErrorResult(e);
  }
}
```

When you add auth, gate mutations with a `requireSession` helper that returns
`{ success: false, isError: true, code: ErrorCode.Unauthorized, message: ErrorMessage[ErrorCode.Unauthorized].notice }`.

### 3. Centralize cache tags + revalidate helpers

`src/lib/api/utils/cacheTags.ts` — `as const` tag builders:

```ts
export const thingTag = (id: string) => `Thing:${id}` as const;
```

`src/lib/api/utils/revalidate.ts` — `'use server'`; one helper per tag, using
the Next 16 `'max'` revalidateType:

```ts
'use server';
import { revalidateTag } from 'next/cache';
import { thingTag } from './cacheTags';

export async function revalidateThing(id: string) {
  revalidateTag(thingTag(id), 'max');
}
```

**Use `revalidateTag(tag, 'max')` only — not `revalidatePath`.** Reads opt
into caching via `next: { tags: [...], revalidate: 0 }` on the fetch call.

### 4. Write the Tier 1 route action

`app/<route>/actions.ts`, `'use server'`. Thin: validate `formData` by hand,
call Tier 2, `revalidateTag` on success, return `ActionResult<T>`:

```ts
'use server';

import { updateThing, revalidateThing } from '@/lib/api';
import type { ActionResult, Thing } from '@/lib/api/types';
import { NodeErrorMessage } from '@workspace/constants';

function validateName(v: FormDataEntryValue | null): { isError: boolean; message: string } {
  if (typeof v !== 'string' || !v.trim()) return { isError: true, message: 'Name is required.' };
  return { isError: false, message: '' };
}

export async function saveThing(
  _: null,
  formData: FormData,
): Promise<ActionResult<Thing>> {
  const id = String(formData.get('id') ?? '');
  const nameCheck = validateName(formData.get('name'));
  if (nameCheck.isError) {
    return { success: false, isError: true, code: 'UNKNOWN', message: nameCheck.message };
  }
  const result = await updateThing(id, { name: nameCheck.message === '' ? String(formData.get('name')) : '' });
  if (result.success) {
    await revalidateThing(id);
  }
  return result;
}
```

Hand-rolled validation is the convention here. `zod` is available via
`@workspace/ui` but is **not** used for action validation in the reference
codebase — keep it hand-rolled unless a form has complex rules.

**Do NOT call `redirect()` inside the action.** Post-action navigation is
client-side `router.push(...)` in the consumer (see step 6).

### 5. Client consumer — form action via `useActionState` + inline toast wrapper

This is the core pattern. The function passed to `useActionState` is **a
wrapper you write**, not the action itself. Toasts fire **inline inside the
wrapper**, NOT in a `useEffect`. Pending comes from `useActionState`'s third
element — **do not use `useTransition`**. Guard double-submit with a `useRef`
mutation lock:

```tsx
'use client';
import { useActionState, useRef, useState, use } from 'react';
import { toast } from 'sonner';
import { saveThing } from '../actions';
import type { ActionResult, Thing } from '@/lib/api/types';

type State = Awaited<ReturnType<typeof saveThing> | null>;

export function ThingForm({ thingPromise }: { thingPromise: Promise<Thing> }) {
  const baseThing = use(thingPromise); // RSC → client Promise hand-off for the read path
  const [lastMutation, setLastMutation] = useState<'save' | null>(null);
  const mutationLockRef = useRef(false);
  const [isMutating, setIsMutating] = useState(false);

  const [saveState, saveAction, isSavePending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      if (mutationLockRef.current) return _prev;            // 1. mutation lock
      mutationLockRef.current = true;
      setIsMutating(true);
      try {
        toast.loading('Saving…', { id: 'thing-save' });     // 2. loading toast w/ stable id
        formData.append('id', baseThing.id);               // 3. enrich formData
        const result = await saveThing(null, formData);    // 4. call action w/ null prev
        if (!result.success) {                             // 5. branch on success
          toast.error('Save failed', { id: 'thing-save', description: result.message });
        } else {
          toast.success('Saved', { id: 'thing-save' });    //    same id replaces loading
          setLastMutation('save');
        }
        return result;                                     // 6. store as state
      } finally {
        mutationLockRef.current = false;
        setIsMutating(false);
      }
    },
    null,
  );

  // Optimistic-on-success: show the just-saved value immediately while
  // revalidateTag refreshes the cache in the background.
  const effectiveThing =
    lastMutation === 'save' && saveState?.success ? saveState.data : baseThing;

  const disabled = isMutating || isSavePending;

  return (
    <form action={saveAction}>
      <input name='name' defaultValue={effectiveThing.name} disabled={disabled} />
      <button type='submit' disabled={disabled}>
        {isSavePending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
```

Key rules:
- **Toasts fire inside the wrapper**, before/after `await action(...)`, never
  in a `useEffect`.
- The stable string `id` (`'thing-save'`) lets `toast.loading` →
  `toast.success`/`toast.error` replace the same toast in place.
- React to the resolved state by **derived render** (the `effectiveThing`
  line), NOT `useEffect`. This is optimistic-on-success: the user sees the new
  value immediately while `revalidateTag` refreshes the cache.
- The read path uses the RSC→client Promise hand-off: the server `page.tsx`
  builds `thingPromise = getThing(id)` and passes it to the client component,
  which `use()`s it. The write path is the route action.

### 6. Client consumer — non-form action via direct await

For actions triggered from a button/menu (logout, icon delete) — **no `<form>`**
and **no `useActionState`**. Direct `await action()` in an async handler with
`useState` pending and client-side `router.push`:

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logoutAction } from './action';

export function LogoutMenuItem() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      toast.loading('Logging out…', { id: 'logout' });
      const result = await logoutAction();          // no formData, no prev
      if (result.isError) {                         // note: isError flag, not !success
        toast.error('Logout failed', { id: 'logout', description: result.message });
        return;
      }
      toast.success('Logged out', { id: 'logout' });
      router.push('/login');                        // client-side nav, no redirect()
    } finally {
      setIsPending(false);
    }
  };

  return <button onClick={handleLogout} disabled={isPending}>Log out</button>;
}
```

### 7. Confirm-dialog-as-form-host (optional, for destructive mutations)

When a mutation needs confirmation, render `<form action={action}>` **inside a
Radix Dialog** (via `@workspace/ui/components/dialog`). Disable Escape /
outside-click while pending so the dialog can't be dismissed mid-submit:

```tsx
'use client';
import type { ComponentProps } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';

export function ConfirmDeleteDialog({
  action,
  isPending,
  open,
  onOpenChange,
}: {
  action: ComponentProps<'form'>['action'];
  isPending: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        onEscapeKeyDown={(e) => { if (isPending) e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (isPending) e.preventDefault(); }}
      >
        <DialogTitle>Delete this?</DialogTitle>
        <DialogFooter>
          <form action={action}>
            <Button type='submit' variant='destructive' disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

The `useActionState` action reference is passed down as
`ComponentProps<'form'>['action']` and wired onto the inner `<form>` here.

### 8. Inline field errors (recommended, not always needed)

The reference codebase has no text-input forms (wallet addresses come from
wallet adapters), so it renders only a `text-destructive` line for fetch
failures:

```tsx
{!fetchResult.success && (
  <div className='text-xs text-destructive'>{fetchResult.message}</div>
)}
```

For forms with **user-typed inputs**, adding `aria-describedby` / `aria-invalid`
+ `role='alert'` is a recommended a11y improvement — but it is NOT part of the
proven baseline. Add it only if your form actually has typed fields.

</Steps>

<Verify>

- `nps lint.web` + `nps typecheck.web`
- `nps build.web`
- `nps test.web` — mock the action module and assert the wrapper flow:
  ```tsx
  vi.mock('../actions', async () => {
    const actual = await vi.importActual<typeof import('../actions')>();
    return {
      ...actual,
      saveThing: vi.fn(async (_: null, fd: FormData) => {
        // assert the wrapper enriched formData
        expect(fd.get('id')).toBe('thing-1');
        return { success: true, isError: false, data: { id: 'thing-1', name: 'new' } };
      }),
    };
  });
  // then: act(() => saveButton.click()) and assert the rendered value updates
  ```
  See the `add-web-test` skill for `customRender` (Router + Redux + Theme
  providers are already wired).
- `nps dev.web` — submit the form and confirm: loading toast → success/error
  toast (same id, replaces in place), pending disables the button, the
  optimistic value shows immediately, and `revalidateTag` refreshes in the
  background.

</Verify>

<AntiPatterns>

- Do NOT return `{ ok: true } | { ok: false; fieldErrors }` — the canonical
  shape is `ActionResult<T>` with `success` / `isError` / `data?` / `code` /
  `message`. No per-field errors.
- Do NOT fire toasts in a `useEffect` reacting to `state` — fire them **inline
  inside the `useActionState` wrapper** (before/after `await action(...)`).
- Do NOT use `useTransition` for pending — use `useActionState`'s third element
  `isPending` (+ the `useRef` mutation lock).
- Do NOT call `redirect()` inside the action — post-action navigation is
  client-side `router.push(...)`.
- Do NOT use `revalidatePath` — use `revalidateTag(tag, 'max')` via centralized
  `cacheTags.ts` + `revalidate*.ts` helpers.
- Do NOT leak `ErrorMessage.log` / `NodeErrorMessage.log` to the client —
  return only `.notice`. Enforce it in `toActionErrorResult`.
- Do NOT put real backend work in the route action — delegate to the Tier 2 SDK
  in `src/lib/api/**` (also `'use server'`).
- Do NOT reach for `useFormState` — it's deprecated in React 19; use
  `useActionState`.
- Do NOT reach for zod / react-hook-form unless the form has complex rules —
  hand-rolled validation is the convention.
- Do NOT put the route action under `components/` — it sits next to `page.tsx`
  as `action.ts` / `actions.ts`.

</AntiPatterns>
