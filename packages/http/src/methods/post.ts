import { buildCredentials, buildHeaders, buildRequestBody } from '../utils';
import { http, type FetchResult } from '../http';

/**
 * Sends a POST request to the specified path with the given body.
 *
 * @template T - The type of the request body.
 * @template U - The expected response type.
 * @template V - The type of the options object.
 * @param {string} path - The API endpoint path.
 * @param {T} body - The request body.
 */
export async function post<T, U = null>(path: string, body: T, options?: RequestInit): Promise<FetchResult<U>> {
  return http<U>(path, {
    method: 'POST',
    body: buildRequestBody(body),
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders(options?.headers),
    },
    credentials: buildCredentials(options?.credentials),
  });
}
