import type { ApiResponse, PaginationMeta } from "@todo-app/shared";

/**
 * Builds a successful response envelope.
 */
export function successResponse<T>(
  data: T,
  meta?: PaginationMeta,
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
}

/**
 * Builds an error response envelope.
 */
export function errorResponse(
  message: string,
  errors?: unknown,
): ApiResponse<never> {
  return {
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  };
}

/**
 * Computes pagination metadata from raw counts.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}
