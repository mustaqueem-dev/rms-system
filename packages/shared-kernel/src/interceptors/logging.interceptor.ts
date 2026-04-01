// packages/shared-kernel/src/interceptors/logging.interceptor.ts
//
// Request/response logging interceptor that:
//   1. Logs incoming method + URL with traceId
//   2. Logs response status + duration on completion
//   3. Masks PII fields (NFR-S08): email, phone, password*, token*, secret*

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { ConsoleLogger } from '../infrastructure/logger';

/** Fields to mask before logging — matched case-insensitively. */
const PII_FIELDS = ['email', 'phone', 'password', 'token', 'secret', 'creditCard', 'ssn'];

function maskPii(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    const isSensitive = PII_FIELDS.some((f) => lower.includes(f));
    result[key] = isSensitive ? '***' : maskPii(value, depth + 1);
  }
  return result;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new ConsoleLogger({ service: 'HTTP' });

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      body: unknown;
      headers: Record<string, string>;
      user?: { sub?: string };
      traceId?: string;
    }>();

    const traceId = req.traceId ?? uuidv4();
    req.traceId = traceId; // attach for downstream use

    const start = Date.now();

    this.logger.info(`→ ${req.method} ${req.url}`, {
      traceId,
      userId: req.user?.sub,
      body: maskPii(req.body),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<{ statusCode: number }>();
          this.logger.info(`← ${req.method} ${req.url} ${res.statusCode} +${Date.now() - start}ms`, {
            traceId,
            userId: req.user?.sub,
            durationMs: Date.now() - start,
          });
        },
        error: (err: Error & { status?: number }) => {
          this.logger.error(
            `← ${req.method} ${req.url} ${err.status ?? 500} +${Date.now() - start}ms`,
            err,
            { traceId, userId: req.user?.sub },
          );
        },
      }),
    );
  }
}
