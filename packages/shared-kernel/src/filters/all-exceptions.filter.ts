// packages/shared-kernel/src/filters/all-exceptions.filter.ts
//
// Global exception filter that maps all errors to the SRS §10.1 response
// envelope. Handles both NestJS HttpExceptions and unexpected errors.

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

import { fail } from '../response/envelope';

interface HttpExceptionBody {
  message?: string | string[];
  details?: string[];
  error?: string;
  code?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { traceId?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as HttpExceptionBody;

      message =
        typeof body.message === 'string'
          ? body.message
          : Array.isArray(body.message)
            ? body.message[0]
            : message;

      code = body.code ?? body.error ?? HttpStatus[status] ?? 'HTTP_ERROR';
      details = body.details ?? (Array.isArray(body.message) ? body.message : undefined);
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error('Unknown exception type', JSON.stringify(exception));
    }

    const envelope = fail(code, message, details, req.traceId);
    res.status(status).json(envelope);
  }
}
