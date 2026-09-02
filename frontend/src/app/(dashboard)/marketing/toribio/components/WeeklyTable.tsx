'use client';

import React from 'react';
import { WeeklyRow } from '../types/digimar.types';

interface Props {
  rows: WeeklyRow[];
  platform: 'Instagram' | 'TikTok';
}

export function WeeklyTable({ rows, platform }: Props) {
  const filtered = rows.filter(r => r.platform === platform);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Belum ada data mingguan</p>
      </div>
    );
  }

  const columns = [
    { label: 'Week', key: 'week' as const, align: 'left' as const },
    { label: 'Follow', key: 'follow' as const, align: 'right' as const },
    { label: 'Unfollow', key: 'unfollow' as const, align: 'right' as const },
    { label: 'Viewers', key: 'viewers' as const, align: 'right' as const },
    { label: 'Profile Visit', key: 'profileVisit' as const, align: 'right' as const },
    { label: 'DM', key: 'dm' as const, align: 'right' as const },
    { label: 'Like', key: 'like' as const, align: 'right' as const },
    { label: 'Save', key: 'save' as const, align: 'right' as const },
    { label: 'Share', key: 'share' as const, align: 'right' as const },
    { label: 'Stories', key: 'storiesCount' as const, align: 'right' as const },
    { label: 'Stories Views', key: 'storiesViews' as const, align: 'right' as const },
    ...(platform === 'Instagram' ? [{ label: 'Leads', key: 'leads' as const, align: 'right' as const }] : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#F9FAFB] border-b border-gray-100">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : 'text-left'} text-[10px] font-black uppercase tracking-[0.05em] text-gray-400`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={`${row.week}-${row.platform}`} className="border-b border-gray-50 transition hover:bg-[#F8FAFC]">
              {columns.map(col => {
                const val = row[col.key];
                return (
                  <td
                    key={col.key}
                    className={`px-5 py-3.5 ${col.align === 'right' ? 'text-right' : 'text-left'} text-[11px] font-medium tabular-nums ${col.key === 'week' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                  >
                    {val !== null && val !== undefined ? val.toLocaleString() : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
