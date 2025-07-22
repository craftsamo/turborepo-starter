import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErrorCode } from '@workspace/constants';
import type { RESTErrorData, RESTAPIErrorResult } from '@workspace/types/api';
import { APIException, type APIExceptionDetails } from '../exceptions';

type HttpExceptionGetResponse = {
  message: string | object | object[];
  error: string;
  statusCode: number;
};

/**
 * Exception filter to handle HTTP exceptions and format error responses.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<APIException> {
  /**
   * Creates a JSON response object for an API error.
   *
   * @param {APIExceptionDetails} details - The details of the API exception.
   * @param {number} status - The HTTP status code.
   * @param {string} requestUrl - The URL of the request that caused the error.
   * @returns {RESTAPIErrorResult} - The JSON response object.
   */
  createErrorResponseJson(details: APIExceptionDetails, status: number, requestUrl: string): RESTAPIErrorResult {
    return {
      ...details,
      status,
      timestamp: new Date().toISOString(),
      path: requestUrl,
    };
  }

  /**
   * Converts the given exception response to a REST API error data format.
   * @param exceptionResponse - The exception response object to convert.
   * @returns The converted REST API error data.
   */
  private convertToRESTAPIErrorData(exceptionResponse: object): RESTErrorData {
    // array of errors
    if (Array.isArray(exceptionResponse)) {
      return {
        _errors: exceptionResponse.map((item) => {
          const [code, message] = Object.values(item);
          return {
            code: String(code) || 'UNKNOWN_ERROR',
            message: String(message) || 'Unknown error',
          };
        }),
      };
    }
    // object of errors
    else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const response = exceptionResponse as Record<string, unknown>;

      // Handle array in message property
      if (Array.isArray(response.message)) {
        return {
          _errors: response.message.map((item) => {
            const [code, message] = Object.values(item);
            return {
              code: String(code) || 'UNKNOWN_ERROR',
              message: String(message) || 'Unknown error',
            };
          }),
        };
      }

      return {
        code: 'UNKNOWN_ERROR',
        message: String(response.message || 'Unknown error'),
      };
    }
    // fallback
    return {
      code: 'UNKNOWN_ERROR',
      message: String(exceptionResponse),
    };
  }

  /**
   * Method to catch and handle HTTP exceptions.
   * @param exception - The caught HttpException.
   * @param host - The ArgumentsHost containing request and response objects.
   */
  catch(exception: APIException | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const errorDetails =
      exception instanceof APIException
        ? (exceptionResponse as APIExceptionDetails)
        : typeof exceptionResponse === 'string'
          ? { code: ErrorCode.General, message: exceptionResponse }
          : {
              code: ErrorCode.General,
              message: 'An error occurred.',
              errors: this.convertToRESTAPIErrorData(exceptionResponse as HttpExceptionGetResponse),
            };

    const responseJson = this.createErrorResponseJson(errorDetails, status, request.url);
    response.status(status).json(responseJson);
  }
}
