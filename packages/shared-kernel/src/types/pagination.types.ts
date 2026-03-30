// packages/shared-kernel/src/types/pagination.types.ts

export interface PaginationOptions {
  limit:  number;
  offset: number;
}

export interface PaginatedResult<T> {
  data:       T[];
  total:      number;
  limit:      number;
  offset:     number;
  hasMore:    boolean;
}

export interface SortOptions {
  field:     string;
  direction: 'asc' | 'desc';
}

export function buildPaginatedResult<T>(
  data:    T[],
  total:   number,
  options: PaginationOptions
): PaginatedResult<T> {
  return {
    data,
    total,
    limit:   options.limit,
    offset:  options.offset,
    hasMore: options.offset + data.length < total,
  };
}

export const DEFAULT_PAGINATION: PaginationOptions = {
  limit:  50,
  offset: 0,
};