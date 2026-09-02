'use client';

import { Database } from 'lucide-react';
import { DashboardCard } from '@/components/dna/DashboardCard';
import { formatInteger, formatPercent } from '../lib/format';
import type { Attribution, SourceBreakdown } from '@/types/marketing-overview';

export function AttributionPanel({ attribution, sources }: { attribution: Attribution; sources: SourceBreakdown[] }) {
  const max = Math.max(...sources.map((s) => s.leads), 1);
  return (
    <DashboardCard className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[var(--gray-900)]">Attribution source</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Berdasarkan UTM dan stage attribution CRM.</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--insight-action-bg)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--status-action)]"
            title={`${attribution.attributedLeads ?? 0} attributed / ${(attribution.attributedLeads ?? 0) + (attribution.unattributedLeads ?? 0)} total`}
          >
            <Database className="h-3 w-3" aria-hidden="true" />
            Coverage {formatPercent(attribution.coverage)}
          </span>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {sources.length ? (
          sources.slice(0, 6).map((source) => (
            <div key={source.source}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold text-[var(--text-muted)]">{source.source}</span>
                <span className="font-extrabold text-[var(--gray-900)]">{formatInteger(source.leads)}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--gray-100)]">
                <div className="h-full rounded-full bg-[var(--dark-accent)]" style={{ width: `${(source.leads / max) * 100}%` }} />
              </div>
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">Belum ada lead pada periode ini.</p>
        )}
      </div>
    </DashboardCard>
  );
}
