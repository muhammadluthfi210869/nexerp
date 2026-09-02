'use client';

import { useState } from 'react';
import { Trash2, Plus, Calendar, AlertCircle, Loader2, CircleAlert } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { DashboardCard } from '@/components/dna/DashboardCard';
import {
  useCreateMarketingTask,
  useDeleteMarketingTask,
  useMarketingTasks,
  useUpdateMarketingTask,
  type MarketingTask,
} from '@/hooks/useMarketingTasks';

const STATUSES: MarketingTask['status'][] = ['OPEN', 'IN_PROGRESS', 'DONE', 'BLOCKED'];
const PRIORITIES: MarketingTask['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const statusLabel: Record<MarketingTask['status'], string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

const priorityColor: Record<MarketingTask['priority'], string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-rose-100 text-rose-700',
};

function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: MarketingTask;
  onStatusChange: (s: MarketingTask['status']) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-[var(--gray-900)] leading-tight">{task.title}</p>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-500"
          aria-label={`Hapus ${task.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">{task.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`rounded-lg px-2 py-1 text-[10px] font-extrabold ${priorityColor[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--gray-500)]">
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Status</label>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as MarketingTask['status'])}
          className="min-h-8 flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--gray-50)] px-2 text-xs font-bold text-[var(--gray-900)] outline-none focus:border-[var(--status-action)]"
          aria-label={`Ubah status ${task.title}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function ManagementTaskClient() {
  const { data: tasks = [], isPending, error, refetch } = useMarketingTasks();
  const create = useCreateMarketingTask();
  const update = useUpdateMarketingTask();
  const remove = useDeleteMarketingTask();

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<MarketingTask['priority']>('MEDIUM');

  const grouped = STATUSES.reduce<Record<string, MarketingTask[]>>((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <DashboardShell
      title="Management Task"
      titleAccent="DIGIMAR"
      subtitle="Task board untuk tim digital marketing. Buat task, ubah status, dan kelola prioritas."
    >
      <main className="space-y-[var(--section-gap)] px-4 pb-8 sm:px-6 lg:px-10" id="mgmt-main">
        <DashboardCard className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Task baru</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Siapkan caption untuk IG Reel peluncuran serum"
                className="mt-1 min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--gray-50)] px-4 text-sm outline-none focus:border-[var(--status-action)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim() && !create.isPending) {
                    create.mutate({ title: title.trim(), priority, status: 'OPEN' });
                    setTitle('');
                  }
                }}
              />
            </label>
            <label>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Prioritas</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MarketingTask['priority'])}
                className="mt-1 min-h-11 rounded-xl border border-[var(--border-color)] bg-[var(--gray-50)] px-3 text-sm font-bold outline-none focus:border-[var(--status-action)]"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <button
              type="button"
              disabled={!title.trim() || create.isPending}
              onClick={() => {
                if (!title.trim()) return;
                create.mutate({ title: title.trim(), priority, status: 'OPEN' });
                setTitle('');
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--status-action)] px-5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah
            </button>
          </div>
          {create.error && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-rose-600">
              <AlertCircle className="h-3.5 w-3.5" />Gagal menambah task.
            </p>
          )}
        </DashboardCard>

        {error || isPending ? (
          <DashboardCard className="p-8 text-center">
            {isPending ? (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat task…
              </div>
            ) : (
              <div className="space-y-3" role="alert">
                <CircleAlert className="mx-auto h-7 w-7 text-rose-600" />
                <p className="font-bold text-[var(--gray-900)]">Tidak dapat memuat task board.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white transition hover:opacity-90"
                >
                  Coba lagi
                </button>
              </div>
            )}
          </DashboardCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-4">
            {STATUSES.map((status) => (
              <section
                key={status}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--gray-50)] p-3"
                aria-labelledby={`col-${status}`}
              >
                <div className="flex items-center justify-between border-b border-[var(--border-color)] px-2 pb-3">
                  <h3 id={`col-${status}`} className="text-xs font-extrabold uppercase tracking-wider text-[var(--gray-900)]">
                    {statusLabel[status]}
                  </h3>
                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-extrabold text-[var(--text-muted)]">
                    {grouped[status].length}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {grouped[status].length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[var(--border-color)] bg-white/60 px-3 py-4 text-center text-[10px] font-bold text-[var(--text-muted)]">
                      Belum ada task.
                    </p>
                  ) : (
                    grouped[status].map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={(s) => update.mutate({ id: task.id, status: s })}
                        onDelete={() => remove.mutate(task.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
