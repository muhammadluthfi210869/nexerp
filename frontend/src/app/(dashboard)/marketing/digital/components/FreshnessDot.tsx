'use client';

import type { ConnectionStatus } from '@/types/marketing-overview';
import { formatDate } from '../lib/format';

const TONE: Partial<Record<ConnectionStatus, string>> = {
  CONNECTED: 'bg-[var(--status-stable-bg)] text-[var(--status-stable-text)]',
  connected: 'bg-[var(--status-stable-bg)] text-[var(--status-stable-text)]',
  needs_configuration: 'bg-[var(--alert-warning-bg)] text-[var(--status-warning)]',
  NOT_CONFIGURED: 'bg-[var(--alert-warning-bg)] text-[var(--status-warning)]',
  error: 'bg-[var(--alert-critical-bg)] text-[var(--status-critical)]',
  DISCONNECTED: 'bg-[var(--alert-critical-bg)] text-[var(--status-critical)]',
};

const LABEL: Partial<Record<ConnectionStatus, string>> = {
  CONNECTED: 'Tersambung',
  connected: 'Tersambung',
  needs_configuration: 'Belum terhubung',
  NOT_CONFIGURED: 'Belum terhubung',
  error: 'Butuh perhatian',
  DISCONNECTED: 'Butuh perhatian',
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
  const labelText = LABEL[status] || String(status);
  const toneClass = TONE[status] || 'bg-slate-100 text-slate-700';

  return (
    <span
      title={`${label} • ${labelText} • ${formatDate(lastSync, true)}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] ${toneClass}`}
      aria-label={`${label} ${labelText}, terakhir sinkron ${formatDate(lastSync, true)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {labelText}
    </span>
  );
}
