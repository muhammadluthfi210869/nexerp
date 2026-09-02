'use client';

import { BarChart3, CalendarDays, Columns3, Filter, LayoutDashboard, RefreshCw, Users, Wifi } from 'lucide-react';
import { useState } from 'react';
import type { SourceBreakdown } from '@/types/marketing-overview';

export type ViewKey = 'overview' | 'planner' | 'campaigns' | 'pipeline' | 'clients' | 'connections';
export type RangeKey = 7 | 30 | 90;

const TABS: Array<{ id: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'planner', label: 'Content planner', icon: CalendarDays },
  { id: 'campaigns', label: 'Campaigns', icon: BarChart3 },
  { id: 'pipeline', label: 'Pipeline', icon: Columns3 },
  { id: 'clients', label: 'Client tracker', icon: Users },
  { id: 'connections', label: 'Connections', icon: Wifi },
];

export function ControlBar({
  activeView,
  onView,
  range,
  onRange,
  sourceFilter,
  onSourceFilter,
  sources,
  onRefresh,
  isFetching,
  onSync,
  isSyncing,
}: {
  activeView: ViewKey;
  onView: (v: ViewKey) => void;
  range: RangeKey;
  onRange: (r: RangeKey) => void;
  sourceFilter: string;
  onSourceFilter: (s: string) => void;
  sources: SourceBreakdown[];
  onRefresh: () => void;
  isFetching: boolean;
  onSync: () => void;
  isSyncing: boolean;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterActive = sourceFilter !== 'all';

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-surface)] p-1"
        role="tablist"
        aria-label="Tampilan marketing"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`${id}-tab`}
            type="button"
            role="tab"
            aria-selected={activeView === id}
            aria-controls={`${id}-panel`}
            onClick={() => onView(id)}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-action)] ${activeView === id ? 'bg-[var(--dark-accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)]'}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--card-surface)] p-1" aria-label="Pilih periode">
          {([7, 30, 90] as RangeKey[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onRange(d)}
              className={`min-h-9 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-action)] ${range === d ? 'bg-[var(--gray-100)] text-[var(--gray-900)]' : 'text-[var(--gray-500)] hover:text-[var(--gray-900)]'}`}
            >
              {d} hari
            </button>
          ))}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-action)] ${filterActive ? 'border-[var(--insight-action-border)] bg-[var(--insight-action-bg)] text-[var(--status-action)]' : 'border-[var(--border-color)] bg-[var(--card-surface)] text-[var(--text-muted)] hover:bg-[var(--gray-50)]'}`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter{filterActive && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-2xl border border-[var(--border-color)] bg-[var(--card-surface)] p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--gray-100)] pb-3">
                <p className="text-xs font-extrabold text-[var(--gray-900)]">Filter client</p>
                {filterActive && (
                  <button type="button" onClick={() => onSourceFilter('all')} className="text-xs font-bold text-[var(--status-action)] hover:underline">
                    Reset
                  </button>
                )}
              </div>
              <label className="mt-3 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => onSourceFilter(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--gray-50)] px-3 text-sm text-[var(--gray-900)] outline-none focus:border-[var(--status-action)]"
              >
                <option value="all">Semua source</option>
                {sources.map((s) => (
                  <option key={s.source} value={s.source}>{s.source}</option>
                ))}
              </select>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">Filter diterapkan ke Client tracker dan overview attribution.</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-surface)] px-3 text-xs font-bold text-[var(--text-muted)] transition hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-action)]"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Memperbarui' : 'Refresh'}
        </button>
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          aria-label="Sinkronisasi ulang semua provider"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--dark-accent)] px-3 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-action)]"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sinkron...' : 'Sinkron'}
        </button>
      </div>
    </div>
  );
}
