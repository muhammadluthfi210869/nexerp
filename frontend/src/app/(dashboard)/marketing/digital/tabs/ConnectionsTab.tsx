'use client';

import { DollarSign, Eye, Search } from 'lucide-react';
import { DashboardCard } from '@/components/dna/DashboardCard';
import { FreshnessDot } from '../components/FreshnessDot';
import { formatDate } from '../lib/format';
import type { Connection, Freshness } from '@/types/marketing-overview';

function freshnessFor(list: Freshness[], provider: string): Freshness {
  return (
    list.find((f) => f.provider === provider) ?? {
      provider,
      status: 'needs_configuration',
      lastSuccessfulSyncAt: null,
    }
  );
}

export function ConnectionsTab({
  metaAds,
  instagram,
  googleOrganic,
  freshness,
}: {
  metaAds: { connection: Connection };
  instagram: { connection: Connection };
  googleOrganic: { connection: Connection };
  freshness: Freshness[];
}) {
  const items = [
    { name: 'Meta Ads', detail: 'Campaign dan paid performance', connection: metaAds.connection, icon: DollarSign, provider: 'meta_ads' },
    { name: 'Instagram', detail: 'Akun professional dan top content', connection: instagram.connection, icon: Eye, provider: 'instagram' },
    { name: 'Google Search Console', detail: 'Organic search Dreamlab.id', connection: googleOrganic.connection, icon: Search, provider: 'google_search_console' },
  ];
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {items.map(({ name, detail, connection, icon: Icon, provider }) => {
        const fresh = freshnessFor(freshness, provider);
        return (
          <DashboardCard key={name} className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--gray-50)] text-[var(--gray-900)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <FreshnessDot status={fresh.status} lastSync={fresh.lastSuccessfulSyncAt ?? null} label={name} />
            </div>
            <h2 className="mt-5 text-base font-extrabold text-[var(--gray-900)]">{name}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{detail}</p>
            <div className="mt-6 border-t border-[var(--gray-100)] pt-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">Terakhir diperbarui</p>
              <p className="mt-1 text-sm font-semibold text-[var(--gray-900)]">{formatDate(connection.refreshedAt, true)}</p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">{connection.message}</p>
            </div>
          </DashboardCard>
        );
      })}
    </div>
  );
}
