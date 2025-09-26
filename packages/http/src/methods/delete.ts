import { buildCredentials, buildHeaders, buildPathWithSearchParams } from '../utils';
import { http, type FetchResult } from '../http';
import { GetOptions } from './get';

/**
 * Sends a DELETE request to the specified path.
 *
 * @template T - The expected response type.
 * @param {string} path - The API endpoint path.
 * @param {GetOptions<U>} [options] - The request options.
 */
export async function remove<T = object, U = object>(path: string, options?: GetOptions<U>): Promise<FetchResult<T>> {
  return http<T>(buildPathWithSearchParams(path, options?.params ? options.params : undefined), {
    method: 'DELETE',
    ...options,
    headers: buildHeaders(options?.headers),
    credentials: buildCredentials(options?.credentials),
  });
}
