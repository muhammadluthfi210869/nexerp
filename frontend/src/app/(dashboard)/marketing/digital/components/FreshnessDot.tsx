'use client';

import type { ConnectionStatus } from '@/types/marketing-overview';
import { formatDate } from '../lib/format';

const TONE: Record<ConnectionStatus, string> = {
  connected: 'bg-[var(--status-stable-bg)] text-[var(--status-stable-text)]',
  needs_configuration: 'bg-[var(--alert-warning-bg)] text-[var(--status-warning)]',
  error: 'bg-[var(--alert-critical-bg)] text-[var(--status-critical)]',
};

const LABEL: Record<ConnectionStatus, string> = {
  connected: 'Tersambung',
  needs_configuration: 'Belum terhubung',
  error: 'Butuh perhatian',
};

export function FreshnessDot({
  status,
  lastSync,
  label,
}: {
  status: ConnectionStatus;
  lastSync: string | null;
  label: string;
}) {
  return (
    <span
      title={`${label} • ${LABEL[status]} • ${formatDate(lastSync, true)}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] ${TONE[status]}`}
      aria-label={`${label} ${LABEL[status]}, terakhir sinkron ${formatDate(lastSync, true)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
