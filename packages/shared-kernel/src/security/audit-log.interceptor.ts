// packages/shared-kernel/src/security/audit-log.interceptor.ts
//
// NFR-S10: Audit log interceptor for write operations (POST/PATCH/PUT/DELETE).
// Captures who did what, when, from which IP, and what changed.
// Emits structured audit records to console (swap for DB/SIEM in production).

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ConsoleLogger }   from '../infrastructure/logger';

interface AuditRecord {
  event:       'WRITE_OP';
  timestamp:   string;
  traceId:     string;
  userId:      string;
  role:        string;
  branchId:    string;
  franchiseId: string;
  method:      string;
  path:        string;
  statusCode:  number;
  ip:          string;
  [key: string]: unknown;
}

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/** Mask PII from audit payload (reuse same logic as LoggingInterceptor) */
const PII_FIELDS = ['email', 'phone', 'password', 'token', 'secret', 'creditCard'];
function maskPii(obj: unknown, depth = 0): unknown {
  if (depth > 4 || obj === null || typeof obj !== 'object') return obj;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    result[k] = PII_FIELDS.some((f) => k.toLowerCase().includes(f))
      ? '***'
      : maskPii(v, depth + 1);
  }
  return result;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new ConsoleLogger({ service: 'AUDIT' });

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method:   string;
      path:     string;
      traceId?: string;
      ip:       string;
      headers:  Record<string, string>;
      user?:    { sub?: string; role?: string; branchId?: string; franchiseId?: string };
    }>();

    if (!WRITE_METHODS.has(req.method)) return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          const res   = context.switchToHttp().getResponse<{ statusCode: number }>();
          const audit: AuditRecord = {
            event:       'WRITE_OP',
            timestamp:   new Date().toISOString(),
            traceId:     req.traceId ?? 'n/a',
            userId:      req.user?.sub       ?? req.headers['x-user-id']       ?? 'anonymous',
            role:        req.user?.role      ?? req.headers['x-user-role']     ?? 'UNKNOWN',
            branchId:    req.user?.branchId  ?? req.headers['x-branch-id']     ?? 'n/a',
            franchiseId: req.user?.franchiseId ?? req.headers['x-franchise-id'] ?? 'n/a',
            method:      req.method,
            path:        req.path,
            statusCode:  res.statusCode,
            ip:          (req.headers['x-forwarded-for'] ?? req.ip ?? 'unknown').split(',')[0].trim(),
          };
          this.logger.info('AUDIT', audit);
        },
      }),
    );
  }
}
