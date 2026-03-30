// packages/shared-kernel/src/errors/app-error.ts

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'BUSINESS_RULE_VIOLATION'
  | 'EXTERNAL_SERVICE_ERROR';

export class AppError extends Error {
  readonly code:       ErrorCode;
  readonly statusCode: number;
  readonly context?:   Record<string, unknown>;

  constructor(
    message:    string,
    code:       ErrorCode,
    statusCode: number,
    context?:   Record<string, unknown>
  ) {
    super(message);
    this.name       = this.constructor.name;
    this.code       = code;
    this.statusCode = statusCode;
    this.context    = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name:       this.name,
      message:    this.message,
      code:       this.code,
      statusCode: this.statusCode,
      context:    this.context,
    };
  }
}

// ─── Concrete error types ────────────────────────────────────────────────────

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 422, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, 'NOT_FOUND', 404, { resource, id });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class BusinessRuleViolationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422, context);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', context?: Record<string, unknown>) {
    super(message, 'INTERNAL_ERROR', 500, context);
  }
}