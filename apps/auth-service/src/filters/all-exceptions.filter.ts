// apps/auth-service/src/filters/all-exceptions.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError }          from '@rms/shared-kernel';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message    = 'Internal server error';
    let code       = 'INTERNAL_ERROR';
    let context: Record<string, unknown> | undefined;

    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      message    = exception.message;
      code       = exception.code;
      context    = exception.context;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res  = exception.getResponse();
      message    = typeof res === 'string' ? res : (res as any).message;
      code       = 'HTTP_EXCEPTION';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(statusCode).json({
      success:   false,
      statusCode,
      code,
      message,
      context,
      path:      request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
