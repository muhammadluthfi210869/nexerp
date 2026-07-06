"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { trackApiError } from "@/lib/error-tracker";
import { extractApiError } from "@/lib/api";

interface ApiQueryExtra {
  errorMessage: string | null;
  errorCode: string | null;
}

export function useApiQuery<TData = unknown>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">,
) {
  const result = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        const apiError = extractApiError(error);
        trackApiError(
          queryKey.join("/"),
          apiError.status,
          apiError.message,
        );
        throw error;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });

  let errorMessage: string | null = null;
  let errorCode: string | null = null;

  if (result.isError) {
    const apiError = extractApiError(result.error);
    errorMessage = apiError.message;
    errorCode = apiError.code;
  }

  return { ...result, errorMessage, errorCode };
}
