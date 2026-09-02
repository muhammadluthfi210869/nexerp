'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrackerRow, StoriesKpiRow, WeeklyRow, ContentRow } from '../types/digimar.types';
import { WeeklyTable } from './WeeklyTable';

interface Props {
  tracker: TrackerRow[];
  storiesKpi: StoriesKpiRow[];
  weekly: WeeklyRow[];
  bestContent: ContentRow[];
}

export function InstagramSection({ tracker, storiesKpi, weekly, bestContent }: Props) {
  if (!tracker || tracker.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Belum ada data Instagram</p>
      </div>
    );
  }

  const latest = tracker[tracker.length - 1] || tracker[0];
  const latestStories = storiesKpi.length > 0 ? storiesKpi[storiesKpi.length - 1] : null;

  const followersChart = tracker.map(r => ({
    month: r.month.slice(0, 3),
    Followers: r.totalFollowers || 0,
    Unfollow: r.unfollow || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics — 3 Macro Cards */}
      <div className="grid grid-cols-3 gap-5">
        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Followers</p>
          <p className="mt-2 text-[32px] font-black tracking-[-0.02em] tabular-nums leading-none text-gray-900">
            {latest.totalFollowers?.toLocaleString() ?? '-'}
          </p>
          <p className="mt-2 text-[9px] font-black uppercase tracking-[0.1em] text-gray-500">
            Growth: {latest.followersGrowth ?? 0}
          </p>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Total Posts</p>
          <p className="mt-2 text-[32px] font-black tracking-[-0.02em] tabular-nums leading-none text-gray-900">
            {latest.totalPost?.toLocaleString() ?? '-'}
          </p>
          <p className="mt-2 text-[9px] font-black uppercase tracking-[0.1em] text-gray-500">
            Feed: {latest.feedCreate ?? 0}
          </p>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Stories Bulan Ini</p>
          <p className="mt-2 text-[32px] font-black tracking-[-0.02em] tabular-nums leading-none text-gray-900">
            {latestStories?.storiesCreate ?? '-'}
          </p>
          <p className="mt-2 text-[9px] font-black uppercase tracking-[0.1em] text-gray-500">
            Avg View: {latestStories?.averageView?.toLocaleString() ?? '-'}
          </p>
        </div>
      </div>

      {/* Followers vs Unfollow Chart */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Followers vs Unfollow</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={followersChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--popover)', boxShadow: '0 16px 30px -22px rgba(15,23,42,0.28)', fontSize: '12px', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} iconType="circle" iconSize={8} />
              <Bar dataKey="Followers" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Unfollow" fill="var(--warning)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Table */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">Weekly Performance</p>
        <WeeklyTable rows={weekly} platform="Instagram" />
      </div>
    </div>
  );
}
