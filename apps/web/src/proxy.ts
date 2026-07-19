import { type NextProxy, NextResponse } from 'next/server';
import { i18n } from './middlewares';

//#############################################################################
// Middleware Configuration                                                   #
//#############################################################################

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|image|.*\\..*).*)'],
};

//#############################################################################
// Middleware execution order control settings                                #
//#############################################################################

export type NextProxyFactory = (proxy: NextProxy) => NextProxy;

/**
 * Chains multiple middleware functions together, ensuring they are executed
 * in the specified order. This function recursively invokes each middleware
 * in the chain and passes control to the next middleware until all are executed.
 *
 * @param functions - An array of middleware factories to be executed in order.
 * @param index - The current index of the middleware being executed (default is 0).
 * @returns A NextMiddleware function to handle the request/response.
 */
export function chain(functions: NextProxyFactory[], index = 0): NextProxy {
  if (!functions[index]) return () => NextResponse.next();
  const next = chain(functions, index + 1);
  return functions[index](next);
}

export default chain([
  // ratelimit,
  // Keep i18n last because it terminates the chain with the routing response.
  i18n,
]);
