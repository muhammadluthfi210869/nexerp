'use client';

import { Activity, CheckCircle2, DollarSign, TrendingUp, Users } from 'lucide-react';
import { DashboardCard } from '@/components/dna/DashboardCard';
import { formatCurrency, formatInteger, formatPercent } from '../lib/format';
import type { MarketingOverview } from '@/types/marketing-overview';

type Kpis = MarketingOverview['kpis'];

const TONE: Record<'action' | 'purple' | 'success' | 'warning', string> = {
  action: 'bg-[var(--insight-action-bg)] text-[var(--status-action)]',
  purple: 'bg-violet-50 text-[var(--accent-purple)]',
  success: 'bg-[var(--insight-success-bg)] text-[var(--status-success)]',
  warning: 'bg-[var(--alert-warning-bg)] text-[var(--status-warning)]',
};

// Ponytail: ROAS shown only when supported (plan §8.2).
// When kpis.roas is non-null we render it as the 5th card; otherwise hide.
export function KpiStrip({ kpis }: { kpis: Kpis }) {
  const roasSupported = kpis.roas !== null && kpis.roas !== undefined;
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan KPI">
      <DashboardCard className="min-h-[168px] p-5 sm:p-6" label="Lead masuk">
        <div className="flex items-start justify-between gap-3">
          <p className="text-2xl font-extrabold tracking-tight text-[var(--gray-900)] tabular-nums sm:text-3xl">
            {formatInteger(kpis.leads)}
          </p>
          <span className={`grid h-10 w-10 place-items-center rounded-2xl ${TONE.action}`}>
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">Dari CRM internal pada periode ini.</p>
      </DashboardCard>

      <DashboardCard className="min-h-[168px] p-5 sm:p-6" label="Qualified pipeline">
        <div className="flex items-start justify-between gap-3">
          <p className="text-2xl font-extrabold tracking-tight text-[var(--gray-900)] tabular-nums sm:text-3xl">
            {formatInteger(kpis.qualified)}
          </p>
          <span className={`grid h-10 w-10 place-items-center rounded-2xl ${TONE.purple}`}>
            <Activity className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
          {kpis.leads ? `${Math.round((kpis.qualified / kpis.leads) * 100)}% dari lead pada periode ini` : 'Belum ada lead'}
        </p>
      </DashboardCard>

      <DashboardCard className="min-h-[168px] p-5 sm:p-6" label="Deal selesai">
        <div className="flex items-start justify-between gap-3">
          <p className="text-2xl font-extrabold tracking-tight text-[var(--gray-900)] tabular-nums sm:text-3xl">
            {formatInteger(kpis.won)}
          </p>
          <span className={`grid h-10 w-10 place-items-center rounded-2xl ${TONE.success}`}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
          Conversion {formatPercent(kpis.leads ? kpis.won / kpis.leads : 0)}
        </p>
      </DashboardCard>

      <DashboardCard className="min-h-[168px] p-5 sm:p-6" label="Meta Ad Spend">
        <div className="flex items-start justify-between gap-3">
          <p className="text-2xl font-extrabold tracking-tight text-[var(--gray-900)] tabular-nums sm:text-3xl">
            {formatCurrency(kpis.spend)}
          </p>
          <span className={`grid h-10 w-10 place-items-center rounded-2xl ${TONE.warning}`}>
            <DollarSign className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
          {kpis.cpl ? `CPL ${formatCurrency(kpis.cpl)}` : 'Belum ada lead tercatat'}
        </p>
      </DashboardCard>

      {roasSupported && (
        <DashboardCard className="min-h-[168px] p-5 sm:p-6 sm:col-span-2 xl:col-span-4" label="ROAS">
          <div className="flex items-start justify-between gap-3">
            <p className="text-2xl font-extrabold tracking-tight text-[var(--gray-900)] tabular-nums sm:text-3xl">
              {formatPercent(kpis.roas)}
            </p>
            <span className={`grid h-10 w-10 place-items-center rounded-2xl ${TONE.success}`}>
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
            Return on Ad Spend berdasarkan revenue attributed ke paid campaigns.
          </p>
        </DashboardCard>
      )}
    </section>
  );
}
