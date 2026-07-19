---
name: locale-spa-switch
description: Use when converting apps/web locale switching from the default full-reload (window.location.replace) to SPA soft navigation (next-intl router.replace + useTransition) — hoist <html> and the client Providers into a root app/layout.tsx, slim [locale]/layout.tsx to NextIntlClientProvider + a LocaleDocument lang-sync effect, so switching languages no longer reloads the page and no longer triggers React's "Encountered a script tag while rendering React component" warning from next-themes. FORESIGHT recipe: the starter ships the SSG/reload default; adopt this only when smooth in-place locale switching matters and you accept that /[locale] routes become dynamically rendered. Trigger keywords: "SPA locale switch", "soft navigation", "router.replace", "next-themes script warning", "html lang not updating", "locale switch reload", "ロケール切替 SPA", "ソフトナビ", "リロードなし言語切替", "next-themes 警告".
license: MIT
compatibility: opencode
metadata:
  category: foresight
  package: web
  stack: nextjs-16,react-19,next-intl,next-themes
---

<Goal>

Switch the active locale in place — without a full page reload — while keeping
`<html lang>`, the `NEXT_LOCALE` cookie, translated copy, and the theme all
correct. The document shell and the client Providers (`next-themes`,
`react-redux`) stay mounted across the switch, so `next-themes`' injected
anti-flash `<script>` never re-renders on the client (which is what fires
React 19's "Encountered a script tag while rendering React component" warning).

</Goal>

<Context>

The starter's **default** locale switch is a full reload:
`useLocaleSwitch` calls `window.location.replace(href)` (see
`apps/web/src/i18n/use-locale-switch.ts`), and `<html>` + Providers live inside
`app/[locale]/layout.tsx`. That layout owns the document shell because the
locale is in the URL param, so `[locale]` renders `<html lang>` correctly AND
the pages statically generate (SSG, `● /[locale]`, `● /[locale]/showcase`).

The trade-off of that default: because the Providers sit inside `[locale]`,
any client-side (soft) locale navigation remounts them — `next-themes`
re-renders its init `<script>` on the client (React warns) and the theme
provider churns. The full reload sidesteps this by re-rendering everything on
the server each switch.

**The iron triangle.** You can hold only two of these three at once:

- **SSG** — `/[locale]` pages prerender to static HTML.
- **Correct SSR `<html lang>`** — the server-rendered HTML carries the right
  `lang` for every locale (SEO, no-JS crawlers, screen readers).
- **No provider remount** — Providers stay mounted, so switching is a smooth
  SPA soft-nav with no `next-themes` warning.

| Approach | SSG | Correct SSR lang | No remount (SPA, no warning) |
| --- | :-: | :-: | :-: |
| Default (`window.location.replace`) | ✅ | ✅ | ❌ (reload) |
| **This recipe** (root owns shell) | ❌ (dynamic) | ✅ | ✅ |

This recipe trades **SSG** for the smooth SPA switch. `await getLocale()` in the
root layout reads request state, so `/[locale]` and `/[locale]/showcase` become
`ƒ` (server-rendered on demand) instead of `●` (SSG). Adopt only if that is
acceptable. If SSG is non-negotiable, keep the default and do NOT apply this.

Verified against Next.js 16.2 + next-intl 4 + next-themes 0.4 + React 19. This
mirrors the production topology used in sibling apps (`asp-platform`).

</Context>

<Scope>

- App: `apps/web`
- Files touched:
  - NEW `src/app/layout.tsx` — root document shell + Providers
  - EDIT `src/app/[locale]/layout.tsx` — slim to intl provider + lang sync
  - NEW `src/components/Providers/LocaleDocument.tsx` — client `<html lang>` sync
  - EDIT `src/components/Providers/index.ts` — export `LocaleDocument`
  - EDIT `src/i18n/use-locale-switch.ts` — `router.replace` + `useTransition`
- Do not touch `global-not-found.tsx` — it renders its own self-contained
  `<html>` document and coexists with the root layout unchanged.

</Scope>

<Steps>

1. **Create the root `app/layout.tsx`.** Move the document shell, fonts,
   `viewport`, global CSS, Providers, top-loader, toaster, and site-level
   metadata out of `[locale]/layout.tsx` into a true root layout. `<html lang>`
   resolves from `getLocale()` for the initial server render:

   ```tsx
   // apps/web/src/app/layout.tsx
   import type { Metadata, Viewport } from 'next';
   import { Geist, Geist_Mono } from 'next/font/google';
   import { getLocale, getTranslations } from 'next-intl/server';
   import NextTopLoader from 'nextjs-toploader';
   import type { LayoutProps } from '@workspace/types/web';
   import { Toaster } from '@workspace/ui/components/sonner';
   import '@workspace/ui/globals.css';
   import { ReduxToolProvider, ThemeProvider } from '@/components/Providers';
   import { baseUrl } from '@/i18n/metadata';

   const fontSans = Geist({ subsets: ['latin'], variable: '--font-sans' });
   const fontMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

   export const viewport: Viewport = { viewportFit: 'cover' };

   export async function generateMetadata(): Promise<Metadata> {
     const t = await getTranslations('site');
     return {
       metadataBase: new URL(baseUrl),
       applicationName: t('name'),
       title: { default: t('name'), template: `%s | ${t('name')}` },
       description: t('description'),
       other: { repository: 'https://github.com/craftsamo/turborepo-starter' },
     };
   }

   export default async function RootLayout(props: LayoutProps) {
     const locale = await getLocale();
     return (
       <html lang={locale} suppressHydrationWarning>
         <body
           className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased overflow-hidden`}
         >
           <ReduxToolProvider>
             <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
               {props.children}
               <NextTopLoader color='var(--primary)' height={2} shadow={false} showSpinner={false} />
               <Toaster mobileOffset={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }} />
             </ThemeProvider>
           </ReduxToolProvider>
         </body>
       </html>
     );
   }
   ```

2. **Add `LocaleDocument`** — a tiny client effect that keeps `<html lang>` in
   sync on soft navigation. The root layout is above `[locale]`, so it is NOT
   re-rendered on a soft locale switch; without this, `lang` would go stale
   until the next hard navigation:

   ```tsx
   // apps/web/src/components/Providers/LocaleDocument.tsx
   'use client';

   import { useEffect } from 'react';
   import type { Language } from '@workspace/constants';

   export function LocaleDocument({ locale }: { locale: Language }) {
     useEffect(() => {
       document.documentElement.lang = locale;
     }, [locale]);

     return null;
   }
   ```

   Export it from the Providers barrel:

   ```ts
   // apps/web/src/components/Providers/index.ts
   export * from './LocaleDocument';
   export * from './NextTheme';
   export * from './ReduxTool';
   ```

3. **Slim `app/[locale]/layout.tsx`** to just message-swapping + lang sync.
   Keep `generateStaticParams`, `setRequestLocale`, and the `hasLocale` guard;
   reduce `generateMetadata` to the per-locale `manifest`. `key={locale}`
   remounts only the intl provider so messages swap:

   ```tsx
   // apps/web/src/app/[locale]/layout.tsx
   import { hasLocale, NextIntlClientProvider } from 'next-intl';
   import type { Metadata } from 'next';
   import { setRequestLocale } from 'next-intl/server';
   import { notFound } from 'next/navigation';
   import type { LayoutProps } from '@workspace/types/web';
   import { LocaleDocument } from '@/components/Providers';
   import { routing } from '@/i18n/routing';

   export function generateStaticParams() {
     return routing.locales.map((locale) => ({ locale }));
   }

   export async function generateMetadata({
     params,
   }: LayoutProps<{ locale: string }>): Promise<Metadata> {
     const { locale } = await params;
     if (!hasLocale(routing.locales, locale)) return {};
     return { manifest: `/${locale}/manifest.webmanifest` };
   }

   export default async function LocaleLayout({ children, params }: LayoutProps<{ locale: string }>) {
     const { locale } = await params;
     if (!hasLocale(routing.locales, locale)) {
       notFound();
     }
     setRequestLocale(locale);
     return (
       <NextIntlClientProvider key={locale} locale={locale}>
         <LocaleDocument locale={locale} />
         {children}
       </NextIntlClientProvider>
     );
   }
   ```

4. **Switch `use-locale-switch.ts` to soft navigation** — `router.replace`
   (from `@/i18n/navigation`) inside `useTransition`, instead of
   `window.location.replace`:

   ```tsx
   // apps/web/src/i18n/use-locale-switch.ts
   'use client';

   import { useLocale } from 'next-intl';
   import { useTransition } from 'react';
   import type { Language } from '@workspace/constants';
   import { usePathname, useRouter } from './navigation';
   import { localeOptions } from './routing';

   export function useLocaleSwitch() {
     const locale = useLocale();
     const pathname = usePathname();
     const router = useRouter();
     const [isPending, startTransition] = useTransition();

     const switchLocale = (nextLocale: Language) => {
       if (nextLocale === locale || isPending) return;
       startTransition(() => {
         router.replace(`${pathname}${window.location.search}${window.location.hash}`, {
           locale: nextLocale,
         });
       });
     };

     return { locale, options: localeOptions, isPending, switchLocale };
   }
   ```

   `LanguageSwitcher` needs no change — it already consumes `isPending` /
   `switchLocale`. `useTransition`'s `isPending` now reflects the real
   in-flight soft navigation.

</Steps>

<Verify>

- `nps typecheck.web` + `nps lint.web`.
- `nps build.web` — expect `/[locale]` and `/[locale]/showcase` to move from
  `●` (SSG) to `ƒ` (Dynamic). This is the accepted trade-off, not a regression.
- `nps dev.web`, then drive the language switcher with a browser and confirm:
  - The **"Encountered a script tag while rendering React component"** warning
    from `next-themes` no longer appears on switch (dev-only warning; verify in
    dev, not `next start`).
  - `document.documentElement.lang` flips `en` ↔ `ja` live, with no full reload
    (e.g. a `window.__probe` marker set before the switch survives it).
  - The theme (including `dark`) persists with no flash across the switch.
  - Page copy swaps and the `NEXT_LOCALE` cookie updates.

</Verify>

<AntiPatterns>

- Do NOT keep `<html>` / Providers in `[locale]/layout.tsx` while switching to
  `router.replace`. That is the worst combination: soft nav remounts the
  Providers, so `next-themes` re-renders its `<script>` on the client and React
  warns on every switch. Providers MUST be hoisted to the root layout first.
- Do NOT render `<html>` in two places. Once the root `app/layout.tsx` owns the
  document, `[locale]/layout.tsx` must not render `<html>`/`<body>`.
- Do NOT drop `LocaleDocument`. Without it, `<html lang>` set by the root
  layout goes stale on soft switches, because the root layout is above
  `[locale]` and is not re-rendered on soft navigation.
- Do NOT apply this recipe if you need `/[locale]` to stay statically
  generated — `await getLocale()` in the root layout forces dynamic rendering.
  Keep the default reload-based switch instead.
- Do NOT convert `global-not-found.tsx` — it is a self-contained document and
  must keep rendering its own `<html>`.

Reversal (back to the SSG/reload default): delete `app/layout.tsx` and
`components/Providers/LocaleDocument.tsx`, remove the `LocaleDocument` export
from the Providers barrel, restore `<html>` + Providers + fonts + viewport +
localized metadata into `[locale]/layout.tsx` (wrapping `children` in a bare
`<NextIntlClientProvider>`), and revert `use-locale-switch.ts` to
`window.location.replace`.

</AntiPatterns>
