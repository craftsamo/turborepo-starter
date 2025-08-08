import { Injectable } from '@nestjs/common';
import { type DiscordErrorData } from 'discord.js';
import { DiscordAPIErrorException, MaximumRetryAttemptsExceededException } from '../../../exceptions';

/**
 * Discord Service Class
 * Provides utility methods for communication with the Discord API.
 */
@Injectable()
export class DiscordService {
  constructor() {}

  /**
   * Waits for the specified milliseconds.
   * @param ms Time to wait (milliseconds)
   */
  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Sends an HTTP request and processes the response.
   * @template T Type of response data
   * @param url Request URL
   * @param options Request options
   * @param retryCount Current retry count
   * @returns Response data
   * @throws MaximumRetryAttemptsExceededException When retry count exceeds the maximum value
   * @throws DiscordAPIErrorException When a Discord API error occurs
   */
  async http<T>(url: string, options?: RequestInit, retryCount = 0): Promise<T> {
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 1000; // 1 second

    const response = await fetch(url, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        ...options?.headers,
      },
      ...options,
    });

    // No Content (204) cannot use `json()`
    if (response.ok && response.status === 204) {
      return null as T;
    }

    // For other responses, return using `json()`
    if (response.ok) {
      return (await response.json()) as T;
    }

    // Retry if rate limited
    if (response.status === 429) {
      const errors = (await response.json()) as { retry_after: number; message: string; global: boolean };

      if (retryCount >= MAX_RETRIES) {
        throw new MaximumRetryAttemptsExceededException(url, retryCount);
      }

      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : errors.retry_after;

      // Calculate wait time (exponential backoff + wait time from rate limit)
      const backoffDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      const waitTime = retryAfter * 1000 + backoffDelay;

      await this.wait(waitTime);
      return this.http<T>(url, options, retryCount + 1);
    }

    // Handle error response with Filter
    const { code, message, errors } = (await response.json()) as DiscordErrorData;
    throw new DiscordAPIErrorException(code, message, response.status, errors);
  }

  /**
   * Sends a GET request.
   * @template T Type of response data
   * @param url Request URL
   * @returns Response data
   */
  get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.http<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Sends a POST request.
   * @template T Type of request body
   * @template R Type of response data
   * @param url Request URL
   * @param body Request body
   * @returns Response data
   */
  post<T, R>(url: string, body: T, options?: RequestInit): Promise<R> {
    return this.http<R>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Sends a PUT request.
   * @template T Type of request body
   * @template R Type of response data
   * @param url Request URL
   * @param body Request body
   */
  put<T, R>(url: string, body: T, options?: RequestInit): Promise<R> {
    return this.http<R>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Sends a PATCH request.
   * @template T Type of request body
   * @template R Type of response data
   * @param url Request URL
   * @param body Request body
   */
  patch<T, R>(url: string, body: T, options?: RequestInit): Promise<R> {
    return this.http<R>(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Sends a DELETE request.
   * @template T Type of response data
   * @param url Request URL
   */
  delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.http<T>(url, {
      ...options,
      method: 'DELETE',
      ...options?.headers,
    });
  }
}
