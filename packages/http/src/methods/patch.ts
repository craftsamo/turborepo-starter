import { buildCredentials, buildHeaders, buildRequestBody } from '../utils';
import { http, type FetchResult } from '../http';

/**
 * Sends a PATCH request to the specified path with the given body.
 *
 * @template T - The type of the request body.
 * @template U - The expected response type.
 * @param {string} path - The API endpoint path.
 * @param {T} body - The request body.
 */
export async function patch<T, U = null>(path: string, body: T, options?: RequestInit): Promise<FetchResult<U>> {
  return http<U>(path, {
    method: 'PATCH',
    body: buildRequestBody(body),
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders(options?.headers),
    },
    credentials: buildCredentials(options?.credentials),
  });
}
