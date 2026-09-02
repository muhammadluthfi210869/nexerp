'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MarketingOverview } from '@/types/marketing-overview';

export type Range = 7 | 30 | 90;

export function useMarketingOverview(range: Range, enabled = true) {
  return useQuery<MarketingOverview>({
    queryKey: ['marketing-command-center', range],
    queryFn: () => api.get('/marketing-command/overview', { params: { days: range } }).then((r) => r.data),
    refetchInterval: 30_000,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    enabled,
  });
}
