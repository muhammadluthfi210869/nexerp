import {
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
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
      <DnaTable>
        <DnaTableHead>
          <DnaTableRow className="bg-[#F9FAFB] border-b border-gray-100">
            <DnaTh className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Channel</DnaTh>
            <DnaTh className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Budget</DnaTh>
            <DnaTh className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Spend</DnaTh>
            <DnaTh className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Traffic</DnaTh>
            <DnaTh className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Leads</DnaTh>
            <DnaTh className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Prosp.</DnaTh>
            <DnaTh className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.05em] text-gray-400">Samples</DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {rows.map((row, i) => (
            <DnaTableRow key={`${row.month}-${row.channel}`} className="border-b border-gray-50 transition hover:bg-[#F8FAFC]">
              <DnaTd className="px-3 py-2.5 text-[10px] font-semibold text-gray-900">{row.channel}</DnaTd>
              <DnaTd className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.budget?.toLocaleString() ?? '-'}</DnaTd>
              <DnaTd className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.spend?.toLocaleString() ?? '-'}</DnaTd>
              <DnaTd className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.traffic?.toLocaleString() ?? '-'}</DnaTd>
              <DnaTd className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.leads?.toLocaleString() ?? '-'}</DnaTd>
              <DnaTd className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.prospecting?.toLocaleString() ?? '-'}</DnaTd>
              <DnaTd className="px-3 py-2.5 text-right text-[10px] font-medium text-gray-600 tabular-nums">{row.samples?.toLocaleString() ?? '-'}</DnaTd>
            </DnaTableRow>
          ))}
        </DnaTableBody>
        <tfoot>
          <DnaTableRow className="bg-[#F9FAFB] border-t-2 border-gray-200">
            <DnaTd className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.05em] text-gray-900">Total</DnaTd>
            <DnaTd className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.budget || 0), 0).toLocaleString()}
            </DnaTd>
            <DnaTd className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.spend || 0), 0).toLocaleString()}
            </DnaTd>
            <DnaTd className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.traffic || 0), 0).toLocaleString()}
            </DnaTd>
            <DnaTd className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.leads || 0), 0).toLocaleString()}
            </DnaTd>
            <DnaTd className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.prospecting || 0), 0).toLocaleString()}
            </DnaTd>
            <DnaTd className="px-3 py-3 text-right text-[10px] font-black text-gray-900 tabular-nums">
              {rows.reduce((s, r) => s + (r.samples || 0), 0).toLocaleString()}
            </DnaTd>
          </DnaTableRow>
        </tfoot>
      </DnaTable>
    </div>
  );
}
