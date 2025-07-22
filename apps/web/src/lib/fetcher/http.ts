import { type RESTAPISuccessResult, type RESTAPIErrorResult } from '@workspace/types/api';
import { buildFullPath } from './utils';
import { FetcherError } from './errors';

const BASE_URL = process.env.BASE_URL as string;

/**
 * Interface representing a successful fetch result.
 * @template T - The type of the data returned in the success result.
 */
export interface FetchSuccessResult<T> extends RESTAPISuccessResult<T> {
  ok: true;
  headers: Headers;
}

/**
 * Interface representing an error fetch result.
 */
export interface FetchErrorResult extends RESTAPIErrorResult {
  ok: false;
  headers: Headers;
}

/**
 * Represents the result of a fetch operation.
 * If the generic type T is void, it returns a FetchSuccessResult with void.
 * Otherwise, it returns either a FetchSuccessResult with T or a FetchErrorResult.
 */
export type FetchResult<T> = T extends void ? FetchSuccessResult<void> : FetchSuccessResult<T> | FetchErrorResult;

/**
 * Options for HTTP requests.
 */
export interface HttpOptions {
  next?: NextFetchRequestConfig;
}

/**
 * Makes an HTTP request to the specified path with the given configuration.
 *
 * @template T - The expected response type.
 * @param {string} path - The API endpoint path.
 * @param {RequestInit} config - The request configuration.
 */
export async function http<T>(path: string, config: RequestInit, options?: HttpOptions): Promise<FetchResult<T>> {
  if (!BASE_URL) {
    throw new FetcherError('MISSING_BASE_URL');
  }
  if (typeof BASE_URL !== 'string') {
    throw new FetcherError('BASE_URL_NOT_STRING', {
      baseUrl: BASE_URL,
    });
  }

  const fullPath = buildFullPath(BASE_URL, path);

  const url = new URL(fullPath);
  if (url.origin !== new URL(BASE_URL).origin) {
    throw new FetcherError('INVALID_URL', {
      baseUrl: BASE_URL,
      fullPath: fullPath,
      origin: url.origin,
    });
  }

  try {
    const response = await fetch(new Request(fullPath, config), options);
    const data = await response.json().catch(() => null);

    // 2xx
    if (response.ok) {
      return { ...data, ok: true, headers: response.headers } as FetchResult<T>;
    }

    // 4xx, 5xx
    return { ...data, ok: false, headers: response.headers } as FetchResult<T>;
  } catch (e: unknown) {
    if (e instanceof FetcherError) {
      throw e;
    }
    if (e instanceof Error) {
      throw new FetcherError('FETCH_ERROR', e.message, {
        baseUrl: BASE_URL,
        fullPath: fullPath,
      });
    }
    throw new FetcherError('FETCH_ERROR', 'Unknown error occurred.', {
      baseUrl: BASE_URL,
      fullPath: fullPath,
    });
  }
}
