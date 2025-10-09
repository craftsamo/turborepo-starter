import { type NextFetchEvent, type NextMiddleware, type NextRequest, NextResponse } from 'next/server';

function isCloudRun(): boolean {
  return Boolean(process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.CLOUD_RUN_SERVICE_NAME);
}

type CacheEntry = { token: string; expMs: number };
const cache = new Map<string, CacheEntry>();

function getCache(audience: string): string | undefined {
  const v = cache.get(audience);
  if (!v) return undefined;
  if (v.expMs <= Date.now()) {
    cache.delete(audience);
    return undefined;
  }
  return v.token;
}

function setCache(audience: string, token: string): void {
  const parts = token.split('.');
  if (parts.length < 2) return;
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padLen = b64.length % 4;
  const pad = padLen ? '===='.slice(padLen) : '';
  const json = atob(b64 + pad);
  const payload = JSON.parse(json) as { exp?: number };
  const exp = payload.exp;
  if (!exp) return;
  const skew = 30_000;
  const expMs = exp * 1000 - skew;
  cache.set(audience, { token, expMs });
}

async function fetchIdToken(audience: string): Promise<string> {
  const cached = getCache(audience);
  if (cached) return cached;
  const base = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=';
  const url = base + encodeURIComponent(audience);
  const res = await fetch(url, { headers: { 'Metadata-Flavor': 'Google' } });
  const txt = await res.text();
  if (txt) setCache(audience, txt);
  return txt;
}

export function gcpApiProxy(middleware: NextMiddleware): NextMiddleware {
  return async (req: NextRequest, ev: NextFetchEvent) => {
    const base = (process.env.CLOUD_RUN_API_SERVICE_URL || '').replace(/\/$/, '');
    const path = req.nextUrl.pathname;
    const isApi = path === '/api' || path.startsWith('/api/');
    const canProxy = isApi && base && isCloudRun();
    if (!canProxy) return middleware(req, ev);

    const upstreamPath = path === '/api' ? '' : path.replace(/^\/api/, '');
    const dst = new URL(base + upstreamPath);
    dst.search = req.nextUrl.search;

    const token = await fetchIdToken(base);

    const headers = new Headers(req.headers);
    headers.set('Authorization', `Bearer ${token}`);
    const baseUrl = new URL(base);
    headers.set('host', baseUrl.host);

    return NextResponse.rewrite(dst, { request: { headers } });
  };
}
