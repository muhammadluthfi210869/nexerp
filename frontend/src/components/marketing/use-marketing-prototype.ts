"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useMarketingPrototypeBundle() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["marketing-prototype-bundle", user?.id ?? "anonymous"],
    queryFn: () => api.get("/marketing/prototype/bundle").then((response) => response.data),
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });
}
