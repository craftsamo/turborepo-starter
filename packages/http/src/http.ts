import type { RESTAPISuccessResult, RESTAPIErrorResult } from '@workspace/types/api';
import { FetcherError } from './errors';

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
export type FetchResult<T> = FetchSuccessResult<T> | FetchErrorResult;

/**
 * Makes an HTTP request to the specified path with the given configuration.
 *
 * @template T - The expected response type.
 * @param {string} url - The API endpoint path.
 * @param {RequestInit} config - The request configuration.
 */
export async function http<T>(url: string, config: RequestInit): Promise<FetchResult<T>> {
  if (!url) {
    throw new FetcherError('MISSING_URL');
  }
  if (typeof url !== 'string') {
    throw new FetcherError('URL_NOT_STRING', {
      baseUrl: url,
    });
  }

  try {
    const response = await fetch(new Request(url, config));
    const data = await response.json();

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
        baseUrl: url,
      });
    }
    throw new FetcherError('FETCH_ERROR', 'Unknown error occurred.', {
      baseUrl: url,
    });
  }
}
