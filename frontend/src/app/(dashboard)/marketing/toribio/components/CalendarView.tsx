'use client';

import React from 'react';
import { ContentRow } from '../types/digimar.types';

interface Props {
  rows: ContentRow[];
}

const TYPE_STYLES: Record<string, { badge: string; dot: string }> = {
  Reels:    { badge: 'bg-[#ECFDF5] text-[#059669] border-[#DCFCE7]', dot: 'bg-[#10B981]' },
  Carousel: { badge: 'bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE]', dot: 'bg-[#2563EB]' },
  Video:    { badge: 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]', dot: 'bg-[#0EA5E9]' },
  Story:    { badge: 'bg-[#FFF7ED] text-[#9A3412] border-[#FED7AA]', dot: 'bg-[#F97316]' },
  Static:   { badge: 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]', dot: 'bg-[#9CA3AF]' },
};

export function CalendarView({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Belum ada konten di editorial plan</p>
      </div>
    );
  }

  const byDate = new Map<string, ContentRow[]>();
  rows.forEach(r => {
    if (!r.date) return;
    const existing = byDate.get(r.date) || [];
    existing.push(r);
    byDate.set(r.date, existing);
  });

  const sortedDates = Array.from(byDate.keys()).sort((a, b) => {
    // Handle multiple date formats: "1 Jan 2026" or "2026-01-01" or "1 July"
    const parseDate = (d: string): number => {
      const trimmed = d.trim();
      // ISO format: YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return new Date(trimmed + 'T00:00:00').getTime();
      }
      // DD Month YYYY or DD Month
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1]?.slice(0, 3);
        const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
        const months: Record<string, number> = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };
        const month = months[monthStr?.toLowerCase() ?? ''] ?? 0;
        return new Date(year, month, day).getTime();
      }
      return 0;
    };
    return parseDate(a) - parseDate(b);
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {sortedDates.map(date => {
        const items = byDate.get(date)!;
        return (
          <div
            key={date}
            className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-3">{date}</p>
            <div className="space-y-2">
              {items.map((item, i) => {
                const style = TYPE_STYLES[item.contentType] || TYPE_STYLES.Static;
                return (
                  <div
                    key={`${item.date}-${item.platform}-${item.contentType}-${i}`}
                    className={`rounded-[10px] border px-3 py-2 ${style.badge}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      <span className="text-[10px] font-black uppercase tracking-[0.05em]">{item.contentType || 'Post'}</span>
                      <span className="text-[8px] font-bold uppercase tracking-[0.1em] opacity-60">{item.platform?.slice(0, 3)}</span>
                    </div>
                    {item.objective && (
                      <p className="mt-1 text-[8px] font-semibold truncate opacity-50">{item.objective}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
