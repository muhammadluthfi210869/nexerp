'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MarketingTask {
  id: string;
  ownerId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useMarketingTasks(status?: string) {
  return useQuery({
    queryKey: ['marketing', 'tasks', status ?? 'all'],
    queryFn: async () => {
      const res = await api.get<MarketingTask[]>('/marketing/tasks', { params: status ? { status } : {} });
      return res.data;
    },
  });
}

export function useCreateMarketingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<MarketingTask>) => {
      const res = await api.post<MarketingTask>('/marketing/tasks', input);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'tasks'] }),
  });
}

export function useUpdateMarketingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<MarketingTask> & { id: string }) => {
      const res = await api.patch<MarketingTask>(`/marketing/tasks/${id}`, patch);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'tasks'] }),
  });
}

export function useDeleteMarketingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/marketing/tasks/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'tasks'] }),
  });
}
