'use client';

import React from 'react';
import { ContentRow } from '../types/digimar.types';

interface Props {
  rows: ContentRow[];
}

const typeColors: Record<string, string> = {
  Reels: 'bg-[#ECFDF5] text-[#059669]',
  Carousel: 'bg-[#EFF6FF] text-[#1E40AF]',
  Video: 'bg-[#F0F9FF] text-[#0369A1]',
  Story: 'bg-[#FFF7ED] text-[#9A3412]',
  Static: 'bg-[#F9FAFB] text-[#6B7280]',
};

export function BestContentTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Belum ada data konten</p>
      </div>
    );
  }

  const sorted = [...rows]
    .map(r => ({
      ...r,
      engagement: (r.likes || 0) + (r.comments || 0) + (r.saves || 0),
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#F9FAFB] border-b border-gray-100">
            <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.05em] text-gray-400">#</th>
            <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.05em] text-gray-400">Content</th>
            <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.05em] text-gray-400">Type</th>
            <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.05em] text-gray-400">Views</th>
            <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.05em] text-gray-400">Likes</th>
            <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.05em] text-gray-400">Comments</th>
            <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.05em] text-gray-400">Saves</th>
            <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.05em] text-gray-400">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={`${row.date}-${row.platform}-${i}`} className="border-b border-gray-50 transition hover:bg-[#F8FAFC]">
              <td className="px-5 py-4 text-[11px] font-black text-gray-400 tabular-nums">#{i + 1}</td>
              <td className="px-5 py-4 max-w-[200px] truncate text-[11px] font-medium text-gray-900" title={row.copywriting || row.contentBrief}>
                {row.copywriting || row.contentBrief || '-'}
              </td>
              <td className="px-5 py-4">
                <span className={`inline-block rounded-[8px] px-3 py-1 text-[10px] font-black uppercase tracking-[0.05em] ${typeColors[row.contentType] || 'bg-[#F9FAFB] text-[#6B7280]'}`}>
                  {row.contentType || '-'}
                </span>
              </td>
              <td className="px-5 py-4 text-right text-[11px] font-medium text-gray-600 tabular-nums">{row.views?.toLocaleString() ?? '-'}</td>
              <td className="px-5 py-4 text-right text-[11px] font-medium text-gray-600 tabular-nums">{row.likes ?? '-'}</td>
              <td className="px-5 py-4 text-right text-[11px] font-medium text-gray-600 tabular-nums">{row.comments ?? '-'}</td>
              <td className="px-5 py-4 text-right text-[11px] font-medium text-gray-600 tabular-nums">{row.saves ?? '-'}</td>
              <td className="px-5 py-4 text-right text-[11px] font-black text-blue-700 tabular-nums">{row.engagement.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
