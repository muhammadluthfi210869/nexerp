'use client';

import { ArrowUpRight, ChevronRight, Search } from 'lucide-react';
import { useEffect } from 'react';
import { DashboardCard } from '@/components/dna/DashboardCard';
import { formatDate } from '../lib/format';
import type { Client } from '@/types/marketing-overview';

export function ClientTable({
  clients,
  onSelect,
  compact = false,
  search,
  onSearchChange,
  crmHref,
}: {
  clients: Client[];
  onSelect: (c: Client) => void;
  compact?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  crmHref?: string;
}) {
  return (
    <DashboardCard className="overflow-hidden p-0">
      {onSearchChange && (
        <div className="border-b border-[var(--border-color)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[var(--gray-900)]">Client tracker</h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Klik client untuk melihat attribution dan tahap CRM.</p>
            </div>
            {crmHref && (
              <a href={crmHref} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 text-xs font-bold text-[var(--text-muted)] transition hover:bg-[var(--gray-50)]">
                Buka tracker<ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" aria-hidden="true" />
            <input
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama, company, campaign, PIC, atau stage..."
              className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--gray-50)] py-2 pl-10 pr-4 text-sm text-[var(--gray-900)] outline-none placeholder:text-[var(--gray-400)] focus:border-[var(--status-action)]"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="border-y border-[var(--gray-100)] bg-[var(--gray-50)] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">
            <tr>
              <th className="px-6 py-3">Client</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">PIC</th>
              <th className="px-6 py-3 text-right"><span className="sr-only">Detail</span></th>
            </tr>
          </thead>
          <tbody>
            {clients.length ? (
              clients.map((client) => (
                <tr key={client.id} className="border-b border-[var(--gray-100)] transition hover:bg-[var(--gray-50)] last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[var(--gray-900)]">{client.name}</p>
                    <p className="mt-0.5 text-[var(--gray-500)]">{client.company || '—'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-lg bg-[var(--gray-100)] px-2 py-1 font-semibold text-[var(--text-muted)]">{client.source}</span>
                  </td>
                  <td className="max-w-48 truncate px-4 py-4 text-[var(--text-muted)]">{client.campaign || 'Belum teratribusi'}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-lg bg-[var(--insight-action-bg)] px-2 py-1 font-semibold text-[var(--status-action)]">{client.stage}</span>
                  </td>
                  <td className="px-4 py-4 text-[var(--text-muted)]">{client.owner}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(client)}
                      className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-bold text-[var(--status-action)] transition hover:bg-[var(--insight-action-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-action)]"
                    >
                      Detail<ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={`px-6 text-center text-sm text-[var(--text-muted)] ${compact ? 'py-10' : 'py-16'}`}>
                  Tidak ada client yang sesuai filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}

export function ClientDrawer({ client, onClose }: { client: Client | null; onClose: () => void }) {
  useEffect(() => {
    if (!client) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [client, onClose]);
  if (!client) return null;
  const items: Array<[string, string]> = [
    ['Perusahaan', client.company || '—'],
    ['Source', client.source],
    ['Campaign', client.campaign || 'Belum teratribusi'],
    ['Tahap CRM', client.stage],
    ['PIC', client.owner],
    ['Lead masuk', formatDate(client.createdAt, true)],
    ['Terakhir diperbarui', formatDate(client.updatedAt, true)],
  ];
  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="client-drawer-title">
      <button type="button" onClick={onClose} aria-label="Tutup detail client" className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-[1px]" />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[var(--border-color)] bg-[var(--card-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--border-color)] p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--gray-500)]">Client CRM</p>
            <h2 id="client-drawer-title" className="mt-1 truncate text-xl font-extrabold text-[var(--gray-900)]">{client.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-action)]"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-2xl border border-[var(--insight-action-border)] bg-[var(--insight-action-bg)] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--status-action)]">Attribution saat ini</p>
            <p className="mt-1 text-sm font-bold text-[var(--gray-900)]">{client.campaign || 'Belum ada campaign yang dapat dipastikan'}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Sumber: {client.source}</p>
          </div>
          <dl className="mt-6 divide-y divide-[var(--gray-100)]">
            {items.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[124px_1fr] gap-4 py-3.5 text-sm">
                <dt className="text-[var(--gray-500)]">{label}</dt>
                <dd className="break-words text-right font-semibold text-[var(--gray-900)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="border-t border-[var(--border-color)] p-4">
          <a href="/marketing/crm-leads" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dark-accent)] px-4 text-xs font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-action)]">
            Buka CRM leads<ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </aside>
    </div>
  );
}
