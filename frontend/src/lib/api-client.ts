import { api } from "./api";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { UseQueryOptions } from "@tanstack/react-query";

/**
 * Standardized typed API Response envelope.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Normalizes raw responses whether wrapped in `{ data: T }` or returned directly as `T`.
 */
export function unwrapData<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

/**
 * Strongly-typed HTTP client wrapping the existing Axios instance with auth
 * and 401 interceptors. Returns unwrapped response payload.
 */
export const apiClient = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    const res = await api.get<T>(url, { params });
    return res.data;
  },
  post: async <T, TBody = unknown>(url: string, data?: TBody): Promise<T> => {
    const res = await api.post<T>(url, data);
    return res.data;
  },
  patch: async <T, TBody = unknown>(url: string, data?: TBody): Promise<T> => {
    const res = await api.patch<T>(url, data);
    return res.data;
  },
  put: async <T, TBody = unknown>(url: string, data?: TBody): Promise<T> => {
    const res = await api.put<T>(url, data);
    return res.data;
  },
  delete: async <T>(url: string): Promise<T> => {
    const res = await api.delete<T>(url);
    return res.data;
  },
};

/**
 * Factory for creating strongly-typed query hooks backed by `useApiQuery`
 * (with automatic retry, exponential backoff, and error tracking).
 */
export function createApiQueryHook<TData, TParams = void>(
  baseKey: string[],
  fetcher: (params: TParams) => Promise<TData>,
) {
  return (params: TParams, options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">) => {
    const queryKey = params ? [...baseKey, JSON.stringify(params)] : baseKey;
    return useApiQuery<TData>(queryKey, () => fetcher(params), options);
  };
}
