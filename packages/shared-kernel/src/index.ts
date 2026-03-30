// packages/shared-kernel/src/index.ts

export { Result }           from './core/result';
export { Guard }            from './core/guard';
export { UniqueEntityId }   from './core/unique-entity-id';
export { ValueObject }      from './core/value-object';
export { BaseEntity }       from './core/base-entity';
export { DomainEvent }      from './core/domain-event';
export type { IDomainEvent } from './core/domain-event';

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

export type {
  PaginationOptions,
  PaginatedResult,
  SortOptions,
} from './types/pagination.types';
export {
  buildPaginatedResult,
  DEFAULT_PAGINATION,
} from './types/pagination.types';