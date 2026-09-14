"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useMarketingPrototypeBundle() {
  const { user } = useAuth();
  const hasToken = typeof window !== "undefined" ? !!localStorage.getItem("token") : false;

  return useQuery({
    // Bundle contents are permission-scoped. Including the authenticated user
    // prevents React Query from briefly reusing another account's manager data
    // after an in-app logout/login or session refresh.
    queryKey: ["marketing-prototype-bundle", user?.id ?? "anonymous"],
    queryFn: () => api.get("/marketing/prototype/bundle").then((response) => response.data),
    staleTime: 30 * 1000,
    enabled: hasToken || !!user?.id,
    refetchOnWindowFocus: false,
  });
}
