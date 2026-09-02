'use client';

import { CalendarDays, Columns3, GalleryVerticalEnd, List, Search, TableProperties } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardCard } from '@/components/dna/DashboardCard';
import { api } from '@/lib/api';

type PlannerView = 'table' | 'board' | 'calendar' | 'gallery' | 'list';
type ContentRow = {
  month: string;
  date: string;
  day: string;
  platform: string;
  contentType: string;
  category: string;
  objective: string;
  pic: string;
  postUrl: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  copywriting: string;
  hashtag: string;
  contentBrief: string;
  published: string;
};

const VIEWS: Array<{ id: PlannerView; label: string; icon: typeof TableProperties }> = [
  { id: 'table', label: 'Table', icon: TableProperties },
  { id: 'board', label: 'Board', icon: Columns3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'gallery', label: 'Gallery', icon: GalleryVerticalEnd },
  { id: 'list', label: 'List', icon: List },
];

function isPublished(row: ContentRow) {
  return /published|sudah|yes|done|live/i.test(row.published || '');
}

function ContentSummary({ row }: { row: ContentRow }) {
  return <>
    <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">{row.platform || 'Platform belum tercatat'} · {row.contentType || 'Content'}</p>
    <p className="mt-1 font-bold text-[var(--gray-900)]">{row.contentBrief || row.objective || 'Konten tanpa brief'}</p>
    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">{row.copywriting || 'Copy belum tersedia dari sumber data.'}</p>
  </>;
}

export function PlannerTab() {
  const [view, setView] = useState<PlannerView>('table');
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const { data, isPending, error } = useQuery<{ rows?: ContentRow[] }>({
    queryKey: ['digimar-content-readonly'],
    queryFn: () => api.get('/digimar/content').then((response) => response.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const platforms = Array.from(new Set(rows.map((row) => row.platform).filter(Boolean)));
  const filtered = useMemo(() => rows.filter((row) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || [row.contentBrief, row.objective, row.copywriting, row.pic, row.category].some((value) => value?.toLowerCase().includes(needle));
    return matchesSearch && (platform === 'all' || row.platform === platform);
  }), [platform, rows, search]);
  const groups = ['Scheduled', 'Published'].map((label) => ({ label, rows: filtered.filter((row) => label === 'Published' ? isPublished(row) : !isPublished(row)) }));

  return <div className="space-y-5" data-marketing-page="digital">
    <DashboardCard className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[var(--gray-900)]">Content planner</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Database konten read-only dari sumber operasional. Tidak ada campaign atau post yang dibuat dari dashboard.</p>
        </div>
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--gray-50)] p-1" role="tablist" aria-label="Tampilan content planner">
          {VIEWS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)} className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-[var(--status-action)] ${view === id ? 'bg-white text-[var(--gray-900)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--gray-900)]'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" /><span className="sr-only">Cari content</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari brief, objective, PIC, atau category..." className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--gray-50)] py-2 pl-10 pr-4 text-sm text-[var(--gray-900)] outline-none focus:border-[var(--status-action)]" /></label>
        <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-3 text-xs font-bold text-[var(--text-muted)]"><span>Platform</span><select value={platform} onChange={(event) => setPlatform(event.target.value)} className="bg-transparent text-xs font-bold text-[var(--gray-900)] outline-none"><option value="all">Semua</option>{platforms.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
    </DashboardCard>

    {isPending ? <DashboardCard className="min-h-72 animate-pulse bg-[var(--gray-50)]"><span className="sr-only">Memuat content planner</span></DashboardCard> : error ? <DashboardCard className="p-8 text-center"><p className="font-bold text-[var(--gray-900)]">Content planner tidak dapat dimuat.</p><p className="mt-1 text-xs text-[var(--text-muted)]">Periksa koneksi sumber data marketing.</p></DashboardCard> : !filtered.length ? <DashboardCard className="p-10 text-center"><p className="font-bold text-[var(--gray-900)]">Belum ada konten yang sesuai.</p><p className="mt-1 text-xs text-[var(--text-muted)]">Konten akan muncul otomatis saat sumber operasional tersedia.</p></DashboardCard> : <PlannerViewContent view={view} rows={filtered} groups={groups} />}
  </div>;
}

function PlannerViewContent({ view, rows, groups }: { view: PlannerView; rows: ContentRow[]; groups: Array<{ label: string; rows: ContentRow[] }> }) {
  if (view === 'board') return <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">{groups.map((group) => <DashboardCard key={group.label} className="p-4"><div className="flex items-center justify-between border-b border-[var(--gray-100)] pb-3"><h3 className="text-sm font-extrabold text-[var(--gray-900)]">{group.label}</h3><span className="rounded-lg bg-[var(--gray-100)] px-2 py-1 text-[10px] font-extrabold text-[var(--text-muted)]">{group.rows.length}</span></div><div className="mt-3 space-y-3">{group.rows.map((row, index) => <div key={`${row.date}-${row.contentBrief}-${index}`} className="rounded-2xl border border-[var(--border-color)] bg-white p-4 shadow-sm"><ContentSummary row={row} /><p className="mt-3 text-[10px] font-bold text-[var(--gray-500)]">{row.date || 'Tanggal belum tercatat'} · PIC {row.pic || '—'}</p></div>)}</div></DashboardCard>)}</div>;
  if (view === 'gallery') return <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{rows.map((row, index) => <DashboardCard key={`${row.date}-${row.contentBrief}-${index}`} className="min-h-56 p-5"><ContentSummary row={row} /><div className="mt-5 flex items-center justify-between border-t border-[var(--gray-100)] pt-3 text-[10px] font-bold text-[var(--gray-500)]"><span>{row.date || 'Tanggal —'}</span><span>{isPublished(row) ? 'Published' : 'Scheduled'}</span></div></DashboardCard>)}</div>;
  if (view === 'calendar') return <DashboardCard className="overflow-hidden p-0"><div className="grid grid-cols-7 border-b border-[var(--gray-100)] bg-[var(--gray-50)]">{['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((day) => <p key={day} className="px-3 py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">{day}</p>)}</div><div className="grid min-h-96 grid-cols-7">{rows.map((row, index) => <div key={`${row.date}-${row.contentBrief}-${index}`} className="min-h-28 border-b border-r border-[var(--gray-100)] p-2.5"><p className="text-[10px] font-extrabold text-[var(--gray-500)]">{row.date || '—'}</p><p className="mt-2 line-clamp-3 text-[11px] font-bold leading-relaxed text-[var(--gray-900)]">{row.contentBrief || row.objective || 'Konten'}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{row.platform}</p></div>)}</div></DashboardCard>;
  if (view === 'list') return <DashboardCard className="p-0">{rows.map((row, index) => <div key={`${row.date}-${row.contentBrief}-${index}`} className="flex items-start gap-4 border-b border-[var(--gray-100)] px-5 py-4 last:border-0"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--insight-action-bg)] text-[10px] font-extrabold text-[var(--status-action)]">{index + 1}</span><div className="min-w-0 flex-1"><ContentSummary row={row} /></div><span className="shrink-0 text-[10px] font-bold text-[var(--gray-500)]">{row.date || '—'}</span></div>)}</DashboardCard>;
  return <DashboardCard className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[var(--gray-50)] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]"><tr><th className="px-6 py-3">Tanggal</th><th className="px-4 py-3">Konten</th><th className="px-4 py-3">Platform</th><th className="px-4 py-3">PIC</th><th className="px-6 py-3 text-right">Status</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.date}-${row.contentBrief}-${index}`} className="border-t border-[var(--gray-100)] transition hover:bg-[var(--gray-50)]"><td className="px-6 py-4 font-semibold text-[var(--text-muted)]">{row.date || '—'}</td><td className="max-w-lg px-4 py-4"><p className="font-bold text-[var(--gray-900)]">{row.contentBrief || row.objective || 'Konten tanpa brief'}</p><p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">{row.category || '—'}</p></td><td className="px-4 py-4 text-[var(--text-muted)]">{row.platform || '—'}</td><td className="px-4 py-4 text-[var(--text-muted)]">{row.pic || '—'}</td><td className="px-6 py-4 text-right"><span className="rounded-lg bg-[var(--gray-100)] px-2 py-1 text-[10px] font-extrabold text-[var(--text-muted)]">{isPublished(row) ? 'Published' : 'Scheduled'}</span></td></tr>)}</tbody></table></div></DashboardCard>;
}
