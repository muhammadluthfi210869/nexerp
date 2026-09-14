"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock3, ListChecks, MessageSquare, Plus, RefreshCw, Search, Users } from "lucide-react";
import { DnaAuditTimeline, DnaButton, DnaCheckbox, DnaDrawer, DnaInput, DnaKpiGrid, DnaModal, DnaPageContainer, DnaPageHeader, DnaPagination, DnaSelect, DnaTabNav, DnaTextarea } from "@/components/dna";
import { extractApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  CreateTaskInput, MarketingTask, TaskStatus, useChecklistMutation, useCommentMutation,
  useCreateMarketingTask, useMarketingBrands, useMarketingMembers, useMarketingProjects,
  useMarketingTasks, useTaskStatusMutation,
} from "@/hooks/useCanonicalMarketing";

const STATUSES: TaskStatus[] = ["NOT_STARTED", "IN_PROGRESS", "IN_REVIEW", "REVISION", "DONE", "CANCELLED"];
const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus[]>> = {
  NOT_STARTED: ["IN_PROGRESS", "CANCELLED"], IN_PROGRESS: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["DONE", "REVISION", "CANCELLED"], REVISION: ["IN_PROGRESS", "CANCELLED"], DONE: ["IN_PROGRESS"],
};
const LABEL: Record<TaskStatus, string> = {
  NOT_STARTED: "Belum mulai", IN_PROGRESS: "Dikerjakan", IN_REVIEW: "Review", REVISION: "Revisi", DONE: "Selesai", CANCELLED: "Dibatalkan",
};
const STATUS_CLASS: Record<TaskStatus, string> = {
  NOT_STARTED: "border-slate-200 bg-slate-50 text-slate-700", IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  IN_REVIEW: "border-violet-200 bg-violet-50 text-violet-700", REVISION: "border-amber-200 bg-amber-50 text-amber-800",
  DONE: "border-emerald-200 bg-emerald-50 text-emerald-700", CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};

function today() { return new Date().toISOString().slice(0, 10); }
function idDate(value?: string | null) { return value ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—"; }
function slug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export function TaskWorkspace({ memberSlug }: { memberSlug: string }) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const { user, hasRole } = useAuth();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selected, setSelected] = useState<MarketingTask | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const page = Number(searchParams.get("page") || 1); const limit = Number(searchParams.get("limit") || 25);
  const status = searchParams.get("status") ?? "all"; const projectId = searchParams.get("project") ?? "all"; const brandId = searchParams.get("brand") ?? "all";
  const members = useMarketingMembers(); const brands = useMarketingBrands(); const projects = useMarketingProjects();
  const member = members.data?.find((item) => slug(item.name ?? '') === memberSlug);
  const assigneeId = memberSlug === "overview" ? undefined : memberSlug === "my-tasks" ? user?.id : member?.id;
  const filters = { page, limit, q: searchParams.get("q") || undefined, status: status === "all" ? undefined : status, projectId: projectId === "all" ? undefined : projectId, brandId: brandId === "all" ? undefined : brandId, assigneeId, sort: searchParams.get("sort") || "dueDate:asc" };
  const tasks = useMarketingTasks(filters);
  const createTask = useCreateMarketingTask(); const statusMutation = useTaskStatusMutation(); const checklistMutation = useChecklistMutation(); const commentMutation = useCommentMutation();
  const canManage = hasRole("SUPER_ADMIN", "HEAD_OPS", "MARKETING");

  useEffect(() => { if (selected && tasks.data) setSelected(tasks.data.data.find((item) => item.id === selected.id) ?? selected); }, [tasks.data, selected?.id]);
  useEffect(() => { const timer = setTimeout(() => updateUrl({ q: search || null, page: "1" }), 350); return () => clearTimeout(timer); }, [search]);

  function updateUrl(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => value && value !== "all" ? next.set(key, value) : next.delete(key));
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  function mutationError(error: unknown) {
    const parsed = extractApiError(error);
    if (parsed.status === 409) {
      setConflictOpen(true);
      tasks.refetch();
    } else {
      setNotice({ tone: "error", text: parsed.message });
    }
  }
  async function moveTask(task: MarketingTask, next: TaskStatus) {
    const needsReason = next === "CANCELLED" || (task.status === "DONE" && next === "IN_PROGRESS");
    const reason = needsReason ? window.prompt("Alasan perubahan status (wajib):")?.trim() : undefined;
    if (needsReason && !reason) return;
    try { const updated = await statusMutation.mutateAsync({ id: task.id, version: task.version, status: next, reason }); setSelected(updated); setNotice({ tone: "success", text: `Status ${task.taskCode} diperbarui.` }); } catch (error) { mutationError(error); }
  }
  async function toggleChecklist(itemId: string, done: boolean) {
    if (!selected) return;
    try { setSelected(await checklistMutation.mutateAsync({ taskId: selected.id, itemId, version: selected.version, done })); } catch (error) { mutationError(error); }
  }

  const rows = tasks.data?.data ?? [];
  const metrics = useMemo(() => ({ total: tasks.data?.total ?? 0, active: rows.filter((x) => ["IN_PROGRESS", "IN_REVIEW", "REVISION"].includes(x.status)).length, late: rows.filter((x) => !["DONE", "CANCELLED"].includes(x.status) && new Date(x.dueDate) < new Date()).length, done: rows.filter((x) => x.status === "DONE").length }), [rows, tasks.data?.total]);

  return <DnaPageContainer className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
    <DnaPageHeader title="MANAGEMENT TASK" subtitle="Operasional task Digital Marketing berbasis data ERP" breadcrumbs={[{ label: "Marketing", href: "/marketing/dashboard" }, { label: "Management Task" }]} actions={<DnaButton variant="primary" icon={<Plus />} onClick={() => setCreateOpen(true)}>Tambah task</DnaButton>} />
    {notice && <div role="status" aria-live="polite" className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${notice.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}><span>{notice.text}</span><button className="min-h-11 px-3 font-bold" onClick={() => setNotice(null)}>Tutup</button></div>}
    <DnaKpiGrid items={[
      { label: "TOTAL TASK", value: String(metrics.total), subtext: "Sesuai scope akun", icon: ListChecks, variant: "blue" },
      { label: "SEDANG BERJALAN", value: String(metrics.active), subtext: "Dikerjakan, review, revisi", icon: Clock3, variant: "amber" },
      { label: "TERLAMBAT", value: String(metrics.late), subtext: "Melewati due date", icon: AlertCircle, variant: "rose" },
      { label: "SELESAI", value: String(metrics.done), subtext: "Pada halaman ini", icon: CheckCircle2, variant: "emerald" },
    ]} />
    <DnaTabNav activeTab={memberSlug} onChange={(id) => router.push(`/marketing/management-task/${id}`)} tabs={[{ id: "overview", label: "Overview", icon: ListChecks }, { id: "my-tasks", label: "Task Saya", icon: Users }, ...(members.data ?? []).map((item) => ({ id: slug(item.name ?? ''), label: item.name ?? '', icon: Users }))]} />
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <DnaInput aria-label="Cari task" icon={<Search />} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode atau judul..." />
        <Filter value={status} onChange={(v) => updateUrl({ status: v, page: "1" })} label="Semua status" options={STATUSES.map((x) => ({ value: x, label: LABEL[x] }))} />
        <Filter value={projectId} onChange={(v) => updateUrl({ project: v, page: "1" })} label="Semua project" options={(projects.data?.data ?? []).map((x) => ({ value: x.id, label: x.name }))} />
        <Filter value={brandId} onChange={(v) => updateUrl({ brand: v, page: "1" })} label="Semua brand" options={(brands.data ?? []).map((x) => ({ value: x.id, label: x.name }))} />
        <DnaButton variant="outline" icon={<RefreshCw />} onClick={() => { setSearch(""); router.replace(pathname); tasks.refetch(); }}>Reset</DnaButton>
      </div>
      {tasks.isLoading ? <TaskSkeleton /> : tasks.isError ? <ErrorState onRetry={() => tasks.refetch()} /> : rows.length === 0 ? <EmptyState onAdd={() => setCreateOpen(true)} /> : <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr>{["Task", "Brand / Project", "PIC", "Prioritas", "Status", "Due date", "Checklist"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((task) => <tr key={task.id} tabIndex={0} onClick={() => setSelected(task)} onKeyDown={(e) => e.key === "Enter" && setSelected(task)} className="cursor-pointer hover:bg-blue-50/40 focus:bg-blue-50 focus:outline-none"><td className="px-4 py-3"><p className="font-bold text-slate-900">{task.title}</p><p className="text-xs font-mono text-slate-400">{task.taskCode}</p></td><td className="px-4 py-3"><p>{task.brand?.name ?? "—"}</p><p className="text-xs text-slate-400">{task.project?.name ?? task.category}</p></td><td className="px-4 py-3">{task.assignee?.name ?? "—"}</td><td className="px-4 py-3 font-semibold">{task.priority}</td><td className="px-4 py-3"><StatusBadge status={task.status} /></td><td className="px-4 py-3 tabular-nums">{idDate(task.dueDate)}</td><td className="px-4 py-3 tabular-nums">{task.checklistDone}/{task.checklistTotal}</td></tr>)}</tbody></table></div>}
      <DnaPagination currentPage={page} totalPages={Math.max(1, Math.ceil((tasks.data?.total ?? 0) / limit))} totalEntries={tasks.data?.total ?? 0} pageSize={limit} onPageChange={(p) => updateUrl({ page: String(p) })} onPageSizeChange={(size) => updateUrl({ limit: String(size), page: "1" })} />
    </section>
    <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} members={members.data ?? []} brands={brands.data ?? []} projects={projects.data?.data ?? []} defaultAssignee={assigneeId ?? user?.id ?? ""} saving={createTask.isPending} onSubmit={async (input) => { try { await createTask.mutateAsync(input); setCreateOpen(false); setNotice({ tone: "success", text: "Task berhasil dibuat." }); } catch (error) { mutationError(error); } }} />
    <DnaDrawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? "Detail task"} subtitle={selected?.taskCode} badge={selected ? <StatusBadge status={selected.status} /> : undefined} size="3xl" footer={selected && <div className="flex flex-wrap justify-end gap-2">{(NEXT_STATUS[selected.status] ?? []).filter((s) => s !== "CANCELLED" || canManage).map((next) => <DnaButton key={next} variant={next === "CANCELLED" ? "danger" : "primary"} loading={statusMutation.isPending} onClick={() => moveTask(selected, next)}>Ke {LABEL[next]}</DnaButton>)}</div>}>
      {selected && <TaskDetail task={selected} onToggle={toggleChecklist} checklistBusy={checklistMutation.isPending} commentBusy={commentMutation.isPending} onComment={async (body) => { try { setSelected(await commentMutation.mutateAsync({ taskId: selected.id, version: selected.version, body })); } catch (error) { mutationError(error); } }} />}
    </DnaDrawer>
    <DnaModal
      isOpen={conflictOpen}
      onClose={() => setConflictOpen(false)}
      title="Konflik Perubahan Data (409)"
    >
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Data telah diperbarui di sesi lain</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Task yang Anda coba ubah baru saja diperbarui oleh pengguna lain. Daftar task telah dimuat ulang dengan versi terbaru dari database untuk menjaga integritas data.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <DnaButton
            variant="primary"
            onClick={() => {
              setConflictOpen(false);
              tasks.refetch();
            }}
          >
            Muat Ulang Data Terbaru
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  </DnaPageContainer>;
}

function StatusBadge({ status }: { status: TaskStatus }) { return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[status]}`}>{LABEL[status]}</span>; }
function Filter({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: Array<{ value: string; label: string }> }) {
  return (
    <DnaSelect
      aria-label={label}
      value={value}
      onChange={onChange}
      options={[{ value: "all", label }, ...options]}
    />
  );
}
function TaskSkeleton() { return <div aria-label="Memuat task" className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="grid place-items-center gap-3 p-12 text-center"><AlertCircle className="h-8 w-8 text-rose-500"/><div><p className="font-bold text-slate-900">Task gagal dimuat</p><p className="text-sm text-slate-500">Periksa koneksi atau hak akses, lalu coba kembali.</p></div><DnaButton variant="outline" onClick={onRetry}>Coba lagi</DnaButton></div>; }
function EmptyState({ onAdd }: { onAdd: () => void }) { return <div className="grid place-items-center gap-3 p-12 text-center"><ListChecks className="h-9 w-9 text-slate-300"/><div><p className="font-bold text-slate-900">Belum ada task</p><p className="text-sm text-slate-500">Filter ini belum memiliki pekerjaan.</p></div><DnaButton variant="primary" icon={<Plus/>} onClick={onAdd}>Tambah task</DnaButton></div>; }

function TaskDetail({ task, onToggle, checklistBusy, onComment, commentBusy }: { task: MarketingTask; onToggle: (id: string, done: boolean) => void; checklistBusy: boolean; onComment: (body: string) => Promise<void>; commentBusy: boolean }) {
  const [body, setBody] = useState("");
  return <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><div className="space-y-5"><div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"><Info label="PIC" value={task.assignee?.name ?? "—"}/><Info label="Reviewer" value={task.reviewer?.name ?? "—"}/><Info label="Mulai" value={idDate(task.startDate)}/><Info label="Deadline" value={idDate(task.dueDate)}/><Info label="Channel" value={task.channel}/><Info label="Prioritas" value={task.priority}/></div><section><h3 className="mb-2 text-sm font-bold text-slate-900">Brief</h3><p className="whitespace-pre-wrap rounded-xl border border-slate-200 p-4 leading-6 text-slate-600">{task.brief || "Belum ada brief."}</p></section><section><h3 className="mb-2 text-sm font-bold text-slate-900">Checklist</h3><div className="space-y-2">{task.checklist.length ? task.checklist.map((item) => <div key={item.id} className="flex min-h-11 items-center justify-between rounded-xl border border-slate-200 px-3 bg-white"><DnaCheckbox disabled={checklistBusy} checked={item.done} onChange={(e) => onToggle(item.id, e.target.checked)} label={<span className={item.done ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>{item.text}</span>}/><div className="flex items-center gap-2">{item.isRequired && <span className="text-[10px] font-bold uppercase text-rose-500 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">Wajib</span>}</div></div>) : <p className="text-sm text-slate-400">Belum ada checklist.</p>}</div></section><form onSubmit={async (e) => { e.preventDefault(); if (!body.trim()) return; await onComment(body.trim()); setBody(""); }}><DnaTextarea label="Komentar" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tambahkan konteks atau update..."/><DnaButton className="mt-2" type="submit" variant="primary" icon={<MessageSquare/>} loading={commentBusy}>Kirim komentar</DnaButton></form></div><section><h3 className="mb-3 text-sm font-bold text-slate-900">Riwayat aktivitas & audit</h3><DnaAuditTimeline logs={task.history.map((entry) => ({ id: entry.id, entityId: task.id, action: entry.fromStatus ? `${LABEL[entry.fromStatus as TaskStatus] ?? entry.fromStatus} → ${LABEL[entry.toStatus as TaskStatus] ?? entry.toStatus}` : `Status Awal: ${LABEL[entry.toStatus as TaskStatus] ?? entry.toStatus}`, actor: entry.by?.name ?? "Sistem", role: entry.by?.role ?? "Marketing", timestamp: idDate(entry.createdAt), notes: entry.note || undefined, severity: entry.toStatus === "CANCELLED" ? "CRITICAL" : entry.toStatus === "REVISION" ? "WARNING" : "INFO" }))} /></section></div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div>; }

function CreateTaskModal({ open, onClose, members, brands, projects, defaultAssignee, saving, onSubmit }: { open: boolean; onClose: () => void; members: any[]; brands: any[]; projects: any[]; defaultAssignee: string; saving: boolean; onSubmit: (data: CreateTaskInput) => Promise<void> }) {
  const [form, setForm] = useState<any>({ type: "DAILY", title: "", channel: "Instagram", category: "content_operations", assigneeId: defaultAssignee, priority: "MEDIUM", startDate: today(), dueDate: today(), brief: "", brandId: "", projectId: "" });
  useEffect(() => { if (defaultAssignee && !form.assigneeId) setForm((x: any) => ({ ...x, assigneeId: defaultAssignee })); }, [defaultAssignee]);
  const field = (key: string) => ({ value: form[key] ?? "", onChange: (e: any) => setForm((x: any) => ({ ...x, [key]: e.target.value })) });
  async function submit(e: FormEvent) { e.preventDefault(); await onSubmit({ ...form, projectId: form.projectId || undefined, brandId: form.brandId || undefined, brief: form.brief || undefined, startDate: new Date(`${form.startDate}T00:00:00+07:00`).toISOString(), dueDate: new Date(`${form.dueDate}T23:59:59+07:00`).toISOString() }); }
  return <DnaDrawer isOpen={open} onClose={onClose} title="Tambah task" subtitle="Semua identitas menggunakan data ERP" footer={<><DnaButton variant="outline" onClick={onClose}>Batal</DnaButton><DnaButton variant="primary" loading={saving} onClick={() => document.getElementById("canonical-task-form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))}>Simpan task</DnaButton></>}><form id="canonical-task-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><DnaInput required label="Judul task" {...field("title")}/><LabeledSelect label="Jenis" {...field("type")} options={[{value:"DAILY",label:"Daily"},{value:"PROJECT",label:"Project"}]}/><LabeledSelect required label="Assignee" {...field("assigneeId")} options={members.map((x) => ({ value: x.id, label: x.fullName }))}/><LabeledSelect label="Brand" {...field("brandId")} options={brands.map((x) => ({ value: x.id, label: x.name }))} empty="Tanpa brand"/><LabeledSelect label="Project" {...field("projectId")} options={projects.map((x) => ({ value: x.id, label: x.name }))} empty="Tanpa project"/><DnaInput required label="Channel" {...field("channel")}/><DnaInput required label="Kategori" {...field("category")}/><LabeledSelect label="Prioritas" {...field("priority")} options={["LOW","MEDIUM","HIGH","URGENT"].map((x) => ({value:x,label:x}))}/><DnaInput required type="date" label="Mulai" {...field("startDate")}/><DnaInput required type="date" label="Deadline" {...field("dueDate")}/><div className="sm:col-span-2"><DnaTextarea label="Brief" {...field("brief")} rows={5}/></div></form></DnaDrawer>;
}
function LabeledSelect({ label, value, onChange, options, empty, required }: { label: string; value: string; onChange: (e: any) => void; options: Array<{value:string;label:string}>; empty?: string; required?: boolean }) {
  const opts = empty ? [{ value: "", label: empty }, ...options] : options;
  return (
    <DnaSelect
      label={label}
      required={required}
      value={value}
      onChange={(v) => onChange({ target: { value: v } })}
      options={opts}
    />
  );
}
