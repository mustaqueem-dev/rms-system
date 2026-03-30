// packages/shared-kernel/src/infrastructure/logger.ts

export interface LogContext {
  service?:     string;
  traceId?:     string;
  userId?:      string;
  branchId?:    string;
  [key: string]: unknown;
}

export interface ILogger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

export class ConsoleLogger implements ILogger {
  private readonly baseContext: Partial<LogContext>;

  constructor(baseContext: Partial<LogContext> = {}) {
    this.baseContext = baseContext;
  }

  private format(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.baseContext,
      ...context,
    });
  }

  info(message: string, context?: LogContext): void {
    console.log(this.format('INFO', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.format('WARN', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    console.error(
      this.format('ERROR', message, {
        ...context,
        errorName:    error?.name,
        errorMessage: error?.message,
        stack:        error?.stack,
      } as LogContext)
    );
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.format('DEBUG', message, context));
    }
  }
}