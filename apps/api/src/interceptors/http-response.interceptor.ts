import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler, Logger } from '@nestjs/common';
import type { RESTAPISuccessResult } from '@workspace/types/api';
import { formatUserAgent } from '../utils';

@Injectable()
export class HttpResponseInterceptor<T> implements NestInterceptor<T, RESTAPISuccessResult<T>> {
  private logger = new Logger(HttpResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<RESTAPISuccessResult<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = response.statusCode;
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((data) => {
        this.logger.log(
          `${timestamp} ${request.method} ${status} ${formatUserAgent(request.header('user-agent'))} ${request.url} ${response.statusMessage || ''}`,
        );
        return { data, status, message: 'Success', timestamp, path: request.url };
      }),
    );
  }
}
