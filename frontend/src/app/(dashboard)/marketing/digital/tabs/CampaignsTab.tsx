'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
  DashboardCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";;
import { FreshnessDot } from '../components/FreshnessDot';
import { formatCurrency, formatInteger } from '../lib/format';
import type { Connection, Freshness, MetaCampaign } from '@/types/marketing-overview';

function EmptySource({ connection }: { connection: Connection }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--gray-50)] px-5 py-12 text-center">
      <p className="text-sm font-bold text-[var(--gray-900)]">Data belum tersedia</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">{connection.message}</p>
    </div>
  );
}

export function CampaignsTab({
  campaigns,
  metaConnection,
  freshness,
}: {
  campaigns: MetaCampaign[];
  metaConnection: Connection;
  freshness: Freshness[];
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'spend' | 'leads' | 'clicks'>('spend');
  const metaFresh = freshness.find((f) => f.provider === 'meta_ads');

  const filtered = campaigns
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sort] - a[sort]);

  return (
    <DashboardCard className="overflow-hidden p-0">
      <div className="border-b border-[var(--border-color)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[var(--gray-900)]">Campaign performance</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Read-only dari Meta Ads. Gunakan pencarian untuk menemukan campaign.</p>
          </div>
          <FreshnessDot status={metaFresh?.status ?? 'needs_configuration'} lastSync={metaFresh?.lastSuccessfulSyncAt ?? null} label="Meta Ads" />
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari campaign..."
              className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--gray-50)] py-2 pl-10 pr-4 text-sm text-[var(--gray-900)] outline-none placeholder:text-[var(--gray-400)] focus:border-[var(--status-action)]"
            />
          </div>
          <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-surface)] px-3 text-xs font-bold text-[var(--text-muted)]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Urutkan</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-transparent text-xs font-bold text-[var(--gray-900)] outline-none"
            >
              <option value="spend">Spend</option>
              <option value="leads">Lead</option>
              <option value="clicks">Clicks</option>
            </select>
          </label>
        </div>
      </div>
      {campaigns.length ? (
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="px-6 py-3">Campaign</DnaTh>
                <DnaTh className="px-4 py-3 text-right">Spend</DnaTh>
                <DnaTh className="px-4 py-3 text-right">Impressions</DnaTh>
                <DnaTh className="px-4 py-3 text-right">Reach</DnaTh>
                <DnaTh className="px-4 py-3 text-right">Clicks</DnaTh>
                <DnaTh className="px-6 py-3 text-right">Lead</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filtered.length ? (
                filtered.map((c) => (
                  <DnaTableRow key={c.id} className="border-b border-[var(--gray-100)] transition hover:bg-[var(--gray-50)] last:border-0">
                    <DnaTd className="px-6 py-4 font-bold text-[var(--gray-900)]">{c.name}</DnaTd>
                    <DnaTd className="px-4 py-4 text-right font-semibold text-[var(--gray-900)] tabular-nums">{formatCurrency(c.spend)}</DnaTd>
                    <DnaTd className="px-4 py-4 text-right text-[var(--text-muted)] tabular-nums">{formatInteger(c.impressions)}</DnaTd>
                    <DnaTd className="px-4 py-4 text-right text-[var(--text-muted)] tabular-nums">{formatInteger(c.reach)}</DnaTd>
                    <DnaTd className="px-4 py-4 text-right text-[var(--text-muted)] tabular-nums">{formatInteger(c.clicks)}</DnaTd>
                    <DnaTd className="px-6 py-4 text-right font-extrabold text-[var(--status-action)] tabular-nums">{formatInteger(c.leads)}</DnaTd>
                  </DnaTableRow>
                ))
              ) : (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="px-6 py-14 text-center text-sm text-[var(--text-muted)]">
                    Tidak ada campaign yang sesuai pencarian.
                  </DnaTd>
                </DnaTableRow>
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      ) : (
        <div className="p-6"><EmptySource connection={metaConnection} /></div>
      )}
    </DashboardCard>
  );
}
