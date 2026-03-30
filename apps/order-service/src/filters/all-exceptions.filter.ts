// apps/order-service/src/filters/all-exceptions.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError }          from '@rms/shared-kernel';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR, message = 'Internal server error', code = 'INTERNAL_ERROR';
    let context: Record<string, unknown> | undefined;
    if (exception instanceof AppError) { status = exception.statusCode; message = exception.message; code = exception.code; context = exception.context; }
    else if (exception instanceof HttpException) { status = exception.getStatus(); const r = exception.getResponse(); message = typeof r === 'string' ? r : (r as any).message; code = 'HTTP_EXCEPTION'; }
    else if (exception instanceof Error) { message = exception.message; }
    res.status(status).json({ success: false, statusCode: status, code, message, context, path: req.url, timestamp: new Date().toISOString() });
  }
}
