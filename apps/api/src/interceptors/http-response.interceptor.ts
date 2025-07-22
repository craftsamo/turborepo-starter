import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from '@nestjs/common';
import type { RESTAPISuccessResult } from '@workspace/types/api';

@Injectable()
export class HttpResponseInterceptor<T> implements NestInterceptor<T, RESTAPISuccessResult<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<RESTAPISuccessResult<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        return { data, status, message: 'Success', timestamp: new Date().toISOString(), path: request.url };
      }),
    );
  }
}
