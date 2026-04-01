// packages/shared-kernel/src/index.ts

// ─── Core DDD primitives ──────────────────────────────────────────────────────
export { Result }           from './core/result';
export { Guard }            from './core/guard';
export type { GuardArgument } from './core/guard';
export { UniqueEntityId }   from './core/unique-entity-id';
export { ValueObject }      from './core/value-object';
export { BaseEntity }       from './core/base-entity';
export { DomainEvent }      from './core/domain-event';
export type { IDomainEvent } from './core/domain-event';

// ─── Errors ───────────────────────────────────────────────────────────────────
export {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BusinessRuleViolationError,
  InternalError,
} from './errors/app-error';
export type { ErrorCode }   from './errors/app-error';

export {
  DomainError,
  InvalidPriceError,
  InvalidQuantityError,
  InvalidStateTransitionError,
  DuplicateEntryError,
} from './errors/domain-error';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  PaginationOptions,
  PaginatedResult,
  SortOptions,
} from './types/pagination.types';
export {
  buildPaginatedResult,
  DEFAULT_PAGINATION,
} from './types/pagination.types';

export type {
  AuditFields,
  CreateAuditFields,
} from './types/audit.types';
export {
  buildCreateAudit,
  buildUpdateAudit,
  buildDeleteAudit,
} from './types/audit.types';

// ─── Infrastructure — Logging ─────────────────────────────────────────────────
export type { ILogger, LogContext }    from './infrastructure/logger';
export { ConsoleLogger }               from './infrastructure/logger';

// ─── Infrastructure — Event publishing ───────────────────────────────────────
export { EVENT_PUBLISHER }             from './infrastructure/event-publisher.interface';
export type { IEventPublisher }        from './infrastructure/event-publisher.interface';
export { InMemoryEventPublisher }      from './infrastructure/in-memory-event-publisher';
export { KafkaEventPublisher }         from './infrastructure/kafka-publisher';

// ─── Infrastructure — Auth / RBAC ────────────────────────────────────────────
export {
  UserRole,
  ROLES_KEY,
  Roles,
  JwtAuthGuard,
  RolesGuard,
  Auth,
} from './infrastructure/jwt-auth.guard';

// ─── Infrastructure — Tenant context ─────────────────────────────────────────
export type { TenantContext }          from './infrastructure/tenant-context';
export { CurrentTenant, CurrentUserId } from './infrastructure/tenant-context';

// ─── Infrastructure — Redis cache ────────────────────────────────────────────
export { RedisCache }                  from './infrastructure/redis-cache';

// ─── Infrastructure — Circuit breaker ────────────────────────────────────────
export { CircuitBreaker }              from './infrastructure/circuit-breaker';
export type { CircuitBreakerOptions }  from './infrastructure/circuit-breaker';

// ─── Interceptors ────────────────────────────────────────────────────────────
export { LoggingInterceptor }          from './interceptors/logging.interceptor';
export { TraceInterceptor }            from './interceptors/trace.interceptor';

// ─── Pipes ───────────────────────────────────────────────────────────────────
export { GlobalValidationPipe }        from './pipes/validation.pipe';

// ─── Response envelope ────────────────────────────────────────────────────────
export type { ApiResponse, ApiError, ApiMeta } from './response/envelope';
export { ok, okPaginated, created, noContent, fail } from './response/envelope';

// ─── Filters ─────────────────────────────────────────────────────────────────
export { AllExceptionsFilter }         from './filters/all-exceptions.filter';