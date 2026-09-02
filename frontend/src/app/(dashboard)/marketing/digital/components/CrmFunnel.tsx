'use client';

import { Users } from 'lucide-react';
import { DashboardCard } from '@/components/dna/DashboardCard';
import { formatInteger } from '../lib/format';

export function CrmFunnel({ funnel }: { funnel: Array<{ key: string; label: string; value: number }> }) {
  const max = Math.max(...funnel.map((s) => s.value), 1);
  return (
    <DashboardCard className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[var(--gray-900)]">Funnel client</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Tahap existing dari pipeline CRM.</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-[var(--accent-purple)]">
          <Users className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {funnel.map((step, index) => (
          <div key={step.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-muted)]">{step.label}</span>
              <span className="font-extrabold text-[var(--gray-900)] tabular-nums">{formatInteger(step.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--gray-100)]">
              <div
                className="h-full rounded-full bg-[var(--status-action)]"
                style={{ width: `${Math.max((step.value / max) * 100, step.value ? 3 : 0)}%`, opacity: 1 - index * 0.09 }}
              />
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
