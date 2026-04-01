// packages/shared-kernel/src/interceptors/trace.interceptor.ts
//
// Injects a unique traceId into every response envelope and response header
// (X-Trace-Id) to enable distributed log correlation across microservices.

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      traceId?: string;
    }>();
    const res = context.switchToHttp().getResponse<{
      setHeader: (name: string, value: string) => void;
    }>();

    // Reuse traceId if LoggingInterceptor already set it, otherwise generate
    const traceId = req.traceId ?? uuidv4();
    req.traceId = traceId;

    // Expose traceId in response header for client-side correlation
    res.setHeader('X-Trace-Id', traceId);

    // Inject traceId into response body if it is already a structured envelope
    return next.handle().pipe(
      map((data: unknown) => {
        if (data && typeof data === 'object' && 'success' in (data as object)) {
          return { ...(data as Record<string, unknown>), traceId };
        }
        return data;
      }),
    );
  }
}
