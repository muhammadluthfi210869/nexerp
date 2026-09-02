'use client';

import { CircleAlert, Clock3, MousePointerClick, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { Client, MarketingOverview } from '@/types/marketing-overview';
import { CampaignsTab } from './tabs/CampaignsTab';
import { ClientsTab } from './tabs/ClientsTab';
import { ConnectionsTab } from './tabs/ConnectionsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { PipelineTab } from './tabs/PipelineTab';
import { PlannerTab } from './tabs/PlannerTab';
import { ClientDrawer } from './components/ClientTable';
import { ControlBar, type RangeKey, type ViewKey } from './components/ControlBar';
import { useMarketingOverview } from './hooks/useMarketingOverview';
import { useSyncMarketing } from './hooks/useSyncMarketing';
import { formatDate } from './lib/format';

export function MarketingDigitalClient() {
  const [view, setView] = useState<ViewKey>('overview');
  const [range, setRange] = useState<RangeKey>(30);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selected, setSelected] = useState<Client | null>(null);

  const liveOverview = useMarketingOverview(range);
  const { isPending, isFetching, error, refetch } = liveOverview;
  const data = liveOverview.data;
  const sync = useSyncMarketing(range);

  // Ponytail: ClientsTab manages its own search state. The orchestrator filter
  // is only the sourceFilter, applied to the overview's client preview.
  const filteredClients = useMemo(() => {
    if (!data) return [];
    return data.crm.recentClients.filter((c: any) => sourceFilter === 'all' || c.source === sourceFilter);
  }, [data, sourceFilter]);

  if (isPending) {
    return (
      <div className="space-y-5 px-4 py-6 sm:px-6 lg:px-10" aria-busy="true" aria-label="Memuat dashboard digital marketing">
        <div className="h-20 animate-pulse rounded-3xl bg-[var(--gray-100)]" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-3xl bg-[var(--gray-100)]" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="m-4 rounded-3xl border border-[var(--alert-critical-border)] bg-[var(--alert-critical-bg)] p-8 text-center sm:m-6 lg:m-10" role="alert">
        <CircleAlert className="mx-auto h-7 w-7 text-[var(--status-critical)]" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-extrabold text-[var(--gray-900)]">Command Center tidak dapat dimuat</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Pastikan sesi login dan backend ERP aktif, lalu coba kembali.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--status-critical)] px-4 text-xs font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-critical)]"
        >
          <RefreshCw className="h-4 w-4" />Muat ulang
        </button>
      </div>
    );
  }

  // Type guard: preview always has data; live mode returned above on failure.
  if (!data) return null;

  const latest = formatDate(data.refreshedAt || null, true);

  return (
    <DashboardShell
      title="Marketing Command Center"
      titleAccent="DIGITAL"
      subtitle="Executive scan: bandingkan kualitas funnel antar channel, temukan bottleneck, lalu putuskan prioritas."
      actions={<span className="hidden items-center gap-2 text-xs font-medium text-[var(--text-muted)] lg:inline-flex"><Clock3 className="h-4 w-4" />Diperbarui {latest}</span>}
    >
      <a href="#marketing-main" className="sr-only focus:not-sr-only focus:absolute focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold">
        Lewati navigasi ke konten
      </a>
      <main id="marketing-main" className="space-y-[var(--section-gap)] px-4 pb-8 sm:px-6 lg:px-10" tabIndex={-1}>
        <ControlBar
          activeView={view}
          onView={setView}
          range={range}
          onRange={setRange}
          sourceFilter={sourceFilter}
          onSourceFilter={setSourceFilter}
          sources={data.crm.sourceBreakdown}
          onRefresh={() => refetch()}
          isFetching={isFetching}
          onSync={() => sync.mutate(undefined)}
          isSyncing={sync.isPending}
        />
        <section id={`${view}-panel`} role="tabpanel" aria-labelledby={`${view}-tab`}>
          {view === 'overview' && <OverviewTab data={data} />}
          {view === 'planner' && <PlannerTab />}
          {view === 'campaigns' && (
            <CampaignsTab
              campaigns={data.metaAds.campaigns as MarketingOverview['metaAds']['campaigns']}
              metaConnection={data.metaAds.connection}
              freshness={data.freshness}
            />
          )}
          {view === 'pipeline' && <PipelineTab clients={filteredClients} onSelect={setSelected} />}
          {view === 'clients' && (
            <ClientsTab clients={filteredClients} onSelect={setSelected} />
          )}
          {view === 'connections' && (
            <ConnectionsTab
              metaAds={{ connection: data.metaAds.connection }}
              instagram={{ connection: data.instagram.connection }}
              googleOrganic={{ connection: data.googleOrganic.connection }}
              freshness={data.freshness}
            />
          )}
        </section>
        <footer className="flex flex-col gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--card-surface)] px-5 py-4 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-[var(--status-action)]" />
            Read-only: campaign tidak dapat diinput dari dashboard.
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[var(--status-success)]" />
            Refresh otomatis setiap 30 detik.
          </span>
        </footer>
      </main>
      <ClientDrawer client={selected} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}
