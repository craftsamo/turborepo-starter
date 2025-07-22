import { Request, Response } from 'express';
import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ErrorCode } from '@workspace/constants';
import { type RESTAPIErrorResult } from '@workspace/types/api';

/**
 * Exception filter to handle all uncaught exceptions and format error responses.
 */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
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

    const errorResponse: RESTAPIErrorResult = {
      code: ErrorCode.General,
      message: 'An internal server error occurred',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}
