import createMiddleware from 'next-intl/middleware';
import type { NextProxy } from 'next/server';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

/** Terminates the chain after locale negotiation and routing. */
export function i18n(): NextProxy {
  return (request) => handleI18nRouting(request);
}
