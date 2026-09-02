'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Range } from './useMarketingOverview';

// Ponytail: invalidate overview cache after sync so freshness + data refresh.
export function useSyncMarketing(range: Range) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider?: string) => {
      const url = provider ? `/marketing-command/sync/${provider}` : '/marketing-command/sync';
      return api.post(url, {}, { params: { days: range } }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-command-center'] });
    },
  });
}
