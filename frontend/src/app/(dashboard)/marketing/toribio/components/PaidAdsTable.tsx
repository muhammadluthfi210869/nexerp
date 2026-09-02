'use client';

import React from 'react';
import { PaidAdsRow } from '../types/digimar.types';

interface Props {
  rows: PaidAdsRow[];
}

export function PaidAdsTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Belum ada data paid ads</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="bg-[#F9FAFB] border-b border-gray-100">
            <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Channel</th>
            <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Budget</th>
            <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Spend</th>
            <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Traffic</th>
            <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Leads</th>
            <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Prosp.</th>
            <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Samples</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.month}-${row.channel}`} className="border-b border-gray-50 transition hover:bg-[#F8FAFC]">
              <td className="px-3 py-2.5 text-[10px] font-semibold text-gray-900">{row.channel}</td>
              <td className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.budget?.toLocaleString() ?? '-'}</td>
              <td className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.spend?.toLocaleString() ?? '-'}</td>
              <td className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.traffic?.toLocaleString() ?? '-'}</td>
              <td className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.leads?.toLocaleString() ?? '-'}</td>
              <td className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.prospecting?.toLocaleString() ?? '-'}</td>
              <td className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.samples?.toLocaleString() ?? '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-[#F9FAFB] border-t-2 border-gray-200">
            <td className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.05em] text-gray-900">Total</td>
            <td className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.budget || 0), 0).toLocaleString()}
            </td>
            <td className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.spend || 0), 0).toLocaleString()}
            </td>
            <td className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.traffic || 0), 0).toLocaleString()}
            </td>
            <td className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.leads || 0), 0).toLocaleString()}
            </td>
            <td className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.prospecting || 0), 0).toLocaleString()}
            </td>
            <td className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.samples || 0), 0).toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
