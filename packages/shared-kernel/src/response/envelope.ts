// packages/shared-kernel/src/response/envelope.ts
//
// Standard API response envelope matching the SRS §10.1 specification:
//   { success, data, error, meta, traceId }

import { PaginatedResult } from '../types/pagination.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: string[];
}

export interface ApiMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta | null;
  traceId?: string;
}

// ── Success builders ──────────────────────────────────────────────────────────

/**
 * Wrap a single resource or void result in the success envelope.
 */
export function ok<T>(data: T, traceId?: string): ApiResponse<T> {
  return { success: true, data, error: null, meta: null, traceId };
}

/**
 * Wrap a paginated result-set in the success envelope with meta.
 * Uses `result.data` (the PaginatedResult<T> shape from pagination.types.ts).
 */
export function okPaginated<T>(
  result: PaginatedResult<T>,
  traceId?: string,
): ApiResponse<T[]> {
  return {
    success: true,
    data: result.data,
    error: null,
    meta: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    },
    traceId,
  };
}

/**
 * Envelope for 201 Created responses (data = created resource).
 */
export function created<T>(data: T, traceId?: string): ApiResponse<T> {
  return { success: true, data, error: null, meta: null, traceId };
}

/**
 * Envelope for 204 No Content responses (data = null).
 */
export function noContent(traceId?: string): ApiResponse<null> {
  return { success: true, data: null, error: null, meta: null, traceId };
}

// ── Error builders ────────────────────────────────────────────────────────────

/**
 * Wrap an error in the failure envelope.
 */
export function fail(
  code: string,
  message: string,
  details?: string[],
  traceId?: string,
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: { code, message, details },
    meta: null,
    traceId,
  };
}
