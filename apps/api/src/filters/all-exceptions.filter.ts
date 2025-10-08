import { Request, Response } from 'express';
import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ErrorCode } from '@workspace/constants';
import { type RESTAPIErrorResult } from '@workspace/types/api';
import { formatUserAgent } from '../utils';

/**
 * Exception filter to handle all uncaught exceptions and format error responses.
 */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private logger = new Logger(AllExceptionsFilter.name);

  /**
   * Method to catch and handle all uncaught exceptions.
   * @param exception - The caught exception.
   * @param host - The ArgumentsHost containing request and response objects.
   */
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      return super.catch(exception, host);
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const timestamp = new Date().toISOString();

    const errorResponse: RESTAPIErrorResult = {
      code: ErrorCode.General,
      message: 'An internal server error occurred',
      status,
      timestamp,
      path: request.url,
    };

    this.logger.error(
      `${request.method} ${status} ${formatUserAgent(request.header('user-agent'))} ${request.url} ${response.statusMessage || ''} ${exception}`,
      { ...errorResponse, error: exception },
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}
