'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PostItem, SocialPlatform, PostStatus, ContentPillar } from '@/app/(dashboard)/marketing/social-tracker/types';

export interface PostFilterParams {
  platform?: SocialPlatform | 'all';
  status?: PostStatus | 'all';
  pillar?: ContentPillar | 'all';
  search?: string;
}

function toPostPayload(post: Partial<PostItem>) {
  const payload = { ...post };
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.checklist;
  delete payload.author;
  const { checklist, author } = post;
  return {
    ...payload,
    ...(author ? { author: { name: author.name, avatar: author.avatar, role: author.role } } : {}),
    ...(checklist ? { checklist: checklist.map(({ text, done }) => ({ text, done })) } : {}),
  };
}

export function useSocialPosts(filter?: PostFilterParams) {
  return useQuery({
    queryKey: ['marketing', 'social', 'posts', filter],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filter?.platform && filter.platform !== 'all') queryParams.set('platform', filter.platform);
      if (filter?.status && filter.status !== 'all') queryParams.set('status', filter.status);
      if (filter?.pillar && filter.pillar !== 'all') queryParams.set('pillar', filter.pillar);
      if (filter?.search) queryParams.set('search', filter.search);

      const qs = queryParams.toString();
      const url = `/marketing/social/posts${qs ? `?${qs}` : ''}`;
      const res = await api.get<{ success: boolean; posts: PostItem[] }>(url);
      return res.data.posts;
    },
    staleTime: 1000 * 60 * 2, // 2 mins
  });
}

export function useCreateSocialPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postData: Partial<PostItem>) => {
      const res = await api.post<{ success: boolean; post: PostItem }>('/marketing/social/posts', toPostPayload(postData));
      return res.data.post;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing', 'social', 'posts'] });
    },
  });
}

export function useUpdateSocialPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PostItem> }) => {
      const res = await api.patch<{ success: boolean; post: PostItem }>(`/marketing/social/posts/${id}`, toPostPayload(data));
      return res.data.post;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing', 'social', 'posts'] });
    },
  });
}

export function useDeleteSocialPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<{ success: boolean; deletedId: string }>(`/marketing/social/posts/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing', 'social', 'posts'] });
    },
  });
}

export function useTestMetaConnection() {
  return useMutation({
    mutationFn: async (payload: { accessToken?: string; pageId?: string; igAccountId?: string }) => {
      const res = await api.post<Record<string, unknown>>('/marketing/social/meta/test-connection', payload);
      return res.data;
    },
  });
}

export function useAiCopywriter() {
  return useMutation({
    mutationFn: async (payload: {
      action: string;
      topic?: string;
      platform?: string;
      pillar?: string;
      audience?: string;
      existingCaption?: string;
    }) => {
      const res = await api.post<{ success: boolean; result: unknown }>('/marketing/social/ai/generate', payload);
      return res.data;
    },
  });
}

export function useFetchMetaInsights() {
  return useMutation({
    mutationFn: async (payload: { accessToken: string; pageId?: string; igAccountId?: string; period?: string }) => {
      const res = await api.post<{
        success: boolean;
        insights?: import('@/app/(dashboard)/marketing/social-tracker/types').MetaInsightsSummary;
        dailyTrends?: import('@/app/(dashboard)/marketing/social-tracker/types').MetaDailyTrend[];
        demographics?: import('@/app/(dashboard)/marketing/social-tracker/types').DemographicData;
        data?: unknown;
      }>('/marketing/social/meta/fetch-insights', payload);
      return res.data;
    },
  });
}
