import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from 'next/server';
import { getSession } from '@/lib/getSession';

export function auth(middleware: NextMiddleware): NextMiddleware {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const sessionUser = await getSession().catch(() => null);
    if (!sessionUser) return middleware(request, event);

    if (sessionUser && request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return middleware(request, event);
  };
}
