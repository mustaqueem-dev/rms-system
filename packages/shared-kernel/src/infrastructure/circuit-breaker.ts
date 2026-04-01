// packages/shared-kernel/src/infrastructure/circuit-breaker.ts
//
// Lightweight circuit-breaker wrapper to satisfy NFR-A06.
// Wraps any async function and opens the circuit after consecutive failures,
// preventing cascading failures between microservices.
//
// States:
//   CLOSED   — normal operation, calls pass through
//   OPEN     — circuit tripped; calls fail fast without hitting the target
//   HALF_OPEN — after cooldown; one probe call is allowed through

import { ConsoleLogger } from './logger';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before the circuit opens. Default: 5 */
  failureThreshold?: number;
  /** Milliseconds to wait in OPEN state before probing again. Default: 30_000 */
  cooldownMs?: number;
  /** Descriptive name for observability logs. Default: 'CircuitBreaker' */
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private nextAttemptAt = 0;

  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly name: string;
  private readonly logger: ConsoleLogger;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30_000;
    this.name = options.name ?? 'CircuitBreaker';
    this.logger = new ConsoleLogger({ service: this.name });
  }

  /**
   * Execute `fn`. If the circuit is OPEN and the cooldown has not elapsed,
   * the call is rejected immediately without reaching the actual dependency.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptAt) {
        throw new Error(`[${this.name}] Circuit OPEN — fast-failing request`);
      }
      this.logger.info(`[${this.name}] Transitioning to HALF_OPEN for probe call`);
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err as Error);
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state !== 'CLOSED') {
      this.logger.info(`[${this.name}] Probe succeeded — circuit CLOSED`);
    }
    this.state = 'CLOSED';
    this.failureCount = 0;
  }

  private onFailure(err: Error): void {
    this.failureCount += 1;

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptAt = Date.now() + this.cooldownMs;
      this.logger.warn(`[${this.name}] Circuit OPEN after ${this.failureCount} failures`, {
        error: err.message,
        nextAttemptAt: new Date(this.nextAttemptAt).toISOString(),
      });
    }
  }

  /** Observable state for health checks / dashboards. */
  getState(): CircuitState {
    return this.state;
  }

  /** Force-reset (useful in tests). */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.nextAttemptAt = 0;
  }
}
