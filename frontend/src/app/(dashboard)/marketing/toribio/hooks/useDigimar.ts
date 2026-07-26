'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SummaryData, WeeklyData, PaidAdsData, ContentData, AllData } from '../types/digimar.types';

// ── Keys ──
const KEYS = {
  all: ['digimar'] as const,
  summary: ['digimar', 'summary'] as const,
  weekly: (month?: string, platform?: string) => ['digimar', 'weekly', month, platform] as const,
  paidAds: (month?: string) => ['digimar', 'paidAds', month] as const,
  content: (month?: string) => ['digimar', 'content', month] as const,
  months: ['digimar', 'months'] as const,
  allInOne: (month?: string) => ['digimar', 'all', month] as const,
};

// ── Hooks ──

export function useDigimarAll(month?: string) {
  return useQuery<AllData>({
    queryKey: KEYS.allInOne(month),
    queryFn: async () => {
      const params = month ? { month } : {};
      const res = await api.get('/digimar/all', { params });
      return res.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useDigimarSummary() {
  return useQuery<SummaryData>({
    queryKey: KEYS.summary,
    queryFn: async () => {
      const res = await api.get('/digimar/summary');
      return res.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useDigimarWeekly(month?: string, platform?: string) {
  return useQuery<WeeklyData>({
    queryKey: KEYS.weekly(month, platform),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (month) params.month = month;
      if (platform) params.platform = platform;
      const res = await api.get('/digimar/weekly', { params });
      return res.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useDigimarPaidAds(month?: string) {
  return useQuery<PaidAdsData>({
    queryKey: KEYS.paidAds(month),
    queryFn: async () => {
      const params = month ? { month } : {};
      const res = await api.get('/digimar/paid-ads', { params });
      return res.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useDigimarContent(month?: string) {
  return useQuery<ContentData>({
    queryKey: KEYS.content(month),
    queryFn: async () => {
      const params = month ? { month } : {};
      const res = await api.get('/digimar/content', { params });
      return res.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useDigimarMonths() {
  return useQuery<string[]>({
    queryKey: KEYS.months,
    queryFn: async () => {
      const res = await api.get('/digimar/months');
      return res.data;
    },
    staleTime: 120_000,
  });
}

// ── WebSocket updater hook ──
// Call this once in the root client component
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export function useDigimarSocket(month?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socket: Socket = isLocal
      ? io('http://localhost:3002/digimar', { transports: ['websocket', 'polling'] })
      : io(window.location.origin + '/digimar', {
          path: '/api/socket.io',
          transports: ['websocket', 'polling'],
        });

    socket.on('connect', () => {
      console.log('[DigimarSocket] connected');
      socket.emit('subscribe', { month });
    });

    socket.on('digimar:update', (data: AllData) => {
      queryClient.setQueryData(KEYS.allInOne(month), data);
      queryClient.setQueryData(KEYS.summary, data.summary);
    });

    socket.on('digimar:error', (err) => {
      console.error('[DigimarSocket] error:', err);
    });

    socket.on('disconnect', () => {
      console.log('[DigimarSocket] disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [month, queryClient]);
}
