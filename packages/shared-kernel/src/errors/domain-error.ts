// packages/shared-kernel/src/errors/domain-error.ts

/**
 * DomainError — the base class for all domain-layer violations.
 *
 * Domain errors are NOT AppErrors (infrastructure/HTTP); they represent
 * broken business invariants discovered inside domain entities or services.
 * Use-case handlers catch DomainErrors and convert them into AppErrors
 * (typically BusinessRuleViolationError) before returning to the caller.
 */
export class DomainError extends Error {
  /** Machine-readable code identifying the violated invariant */
  readonly domainCode: string;

  /** Optional structured context for debugging */
  readonly context?: Record<string, unknown>;

  constructor(
    message:    string,
    domainCode: string,
    context?:   Record<string, unknown>
  ) {
    super(message);
    this.name       = this.constructor.name;
    this.domainCode = domainCode;
    this.context    = context;
    // Maintains correct prototype chain in transpiled JS
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name:       this.name,
      message:    this.message,
      domainCode: this.domainCode,
      context:    this.context,
    };
  }
}

// ─── Concrete domain errors ──────────────────────────────────────────────────

export class InvalidPriceError extends DomainError {
  constructor(amount: number) {
    super(`Price amount must be positive, got: ${amount}`, 'INVALID_PRICE', { amount });
  }
}

export class InvalidQuantityError extends DomainError {
  constructor(quantity: number, context?: Record<string, unknown>) {
    super(`Quantity must be non-negative, got: ${quantity}`, 'INVALID_QUANTITY', { quantity, ...context });
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(from: string, to: string, entity: string) {
    super(
      `Cannot transition ${entity} from '${from}' to '${to}'`,
      'INVALID_STATE_TRANSITION',
      { from, to, entity }
    );
  }
}

export class DuplicateEntryError extends DomainError {
  constructor(entity: string, field: string, value: unknown) {
    super(
      `${entity} with ${field} '${value}' already exists`,
      'DUPLICATE_ENTRY',
      { entity, field, value }
    );
  }
}
