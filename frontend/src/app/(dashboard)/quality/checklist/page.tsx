"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { ListTodo, Layers, Settings, Plus, Search, Eye } from "lucide-react";
import {
  DnaPageHeader,
  DnaBadge,
  DnaButton,
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DNA_TABLE_CLASSES,
  DnaCell,
  DnaModal,
  DnaInput,
  useDnaToast,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { QueryLoading, QueryError } from "@/components/query-states";
import { cn } from "@/lib/utils";

/** A field the backend does not send is shown as unknown, never guessed. */
const UNKNOWN = "—";

// ── Backend contracts ──
// GET /qc/checklists → QCChecklist + { progress, creator }. `salesOrderId` is a
// bare scalar (qc.prisma declares no `salesOrder` relation and findAll includes
// only `creator`), so there is NO SO number, client name or brand in the payload.
interface ChecklistItem {
  id: string;
  title: string;
  salesOrderId: string | null;
  workOrderId: string | null;
  status: string;
  items: { label: string; isRequired?: boolean }[];
  completedItems: string[];
  notes: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  creator?: { id?: string; fullName?: string };
}

// GET /qc/checklists/categories → { id, label, order, gate }. Read-only: the
// controller exposes no POST/PATCH/DELETE for categories.
interface ChecklistCategory {
  id: string;
  label: string;
  order: number;
  gate: string;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return UNKNOWN;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return UNKNOWN;
  return d.toLocaleDateString("id-ID");
}

function percent(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export default function ChecklistHubPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Modul Checklist...</div>}>
      <ChecklistHubContent />
    </Suspense>
  );
}

function ChecklistHubContent() {
  const searchParams = useSearchParams();
  const { showToast } = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"checklist" | "category" | "manage">("checklist");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateChecklistOpen, setIsCreateChecklistOpen] = useState(false);
  const [selectedManageItem, setSelectedManageItem] = useState<ChecklistItem | null>(null);

  // ── TAB 1 + 3: live checklists (no literal fallback anywhere) ──
  const {
    data: checklists = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ChecklistItem[]>({
    queryKey: ["qc-checklists"],
    queryFn: async () => {
      const res = await api.get("/qc/checklists");
      const raw = res.data?.data || res.data || [];
      if (!Array.isArray(raw)) return [];
      return raw.map(
        (c: any): ChecklistItem => ({
          id: c.id,
          title: c.title || UNKNOWN,
          salesOrderId: c.salesOrderId ?? null,
          workOrderId: c.workOrderId ?? null,
          status: c.status || "PENDING",
          items: Array.isArray(c.items) ? c.items : [],
          completedItems: Array.isArray(c.completedItems) ? c.completedItems : [],
          notes: c.notes ?? null,
          progress: Number(c.progress ?? 0),
          createdAt: c.createdAt ?? "",
          updatedAt: c.updatedAt ?? "",
          creator: c.creator ?? undefined,
        }),
      );
    },
  });

  // ── TAB 2: live categories, read-only ──
  const {
    data: categories = [],
    isLoading: catLoading,
    isError: catError,
    refetch: refetchCategories,
  } = useQuery<ChecklistCategory[]>({
    queryKey: ["qc-checklist-categories"],
    queryFn: async () => {
      const res = await api.get("/qc/checklists/categories");
      const raw = res.data?.data || res.data || [];
      if (!Array.isArray(raw)) return [];
      return raw.map(
        (c: any): ChecklistCategory => ({
          id: c.id,
          label: c.label || c.id || UNKNOWN,
          order: Number(c.order ?? 0),
          gate: c.gate || UNKNOWN,
        }),
      );
    },
  });

  useEffect(() => {
    if (searchParams.get("action") === "create") setIsCreateChecklistOpen(true);
    const tab = searchParams.get("tab");
    if (tab === "manage" || tab === "category" || tab === "checklist") setActiveTab(tab as any);
  }, [searchParams]);

  // POST /qc/checklists takes { title, workOrderId?, items[] } — nothing else.
  const [newChecklistForm, setNewChecklistForm] = useState({ title: "", workOrderId: "" });

  const createChecklist = useMutation({
    mutationFn: async () => {
      const res = await api.post("/qc/checklists", {
        title: newChecklistForm.title.trim(),
        workOrderId: newChecklistForm.workOrderId.trim() || undefined,
        items: [],
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-checklists"] });
      setIsCreateChecklistOpen(false);
      setNewChecklistForm({ title: "", workOrderId: "" });
      showToast({ type: "success", title: "Checklist Dibuat", message: "Checklist berhasil didaftarkan." });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        title: "Gagal Membuat Checklist",
        message: err?.response?.data?.message || err?.message || "Server menolak permintaan.",
      });
    },
  });

  // PATCH /qc/checklists/:id { completedItems } is the real milestone write.
  const toggleMilestone = useMutation({
    mutationFn: async ({ id, completedItems }: { id: string; completedItems: string[] }) => {
      const res = await api.patch(`/qc/checklists/${id}`, { completedItems });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-checklists"] });
      showToast({ type: "success", title: "Status Milestone Diperbarui", message: "Progres tahapan berhasil disimpan." });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        title: "Gagal Menyimpan Milestone",
        message: err?.response?.data?.message || err?.message || "Server menolak permintaan.",
      });
    },
  });

  const handleToggleSubItemStatus = (item: ChecklistItem, label: string) => {
    const done = item.completedItems.includes(label);
    const next = done
      ? item.completedItems.filter((l) => l !== label)
      : [...item.completedItems, label];
    toggleMilestone.mutate({ id: item.id, completedItems: next });
  };

  const q = searchQuery.toLowerCase();
  const filteredChecklists = checklists.filter(
    (c) => c.title.toLowerCase().includes(q) || (c.salesOrderId || "").toLowerCase().includes(q),
  );

  const handleSaveChecklist = () => {
    if (!newChecklistForm.title.trim()) {
      showToast({ type: "error", title: "Validasi Gagal", message: "Judul checklist wajib diisi." });
      return;
    }
    createChecklist.mutate();
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      <DnaPageHeader
        title="PUSAT KENDALI CHECKLIST OPERASIONAL"
        badge={<DnaBadge variant="info">SISTEM KENDALI</DnaBadge>}
        subtitle="Manajemen alur checklist maklon, standardisasi sequence tahapan kronologis, dan monitoring pelaksanaan SO."
        breadcrumbItems={[
          { label: "Dashboard", href: "/executive/dashboard" },
          { label: "Umum & Kendali", href: "/checklist" },
          { label: "Checklist" },
        ]}
        actions={
          activeTab === "checklist" ? (
            <DnaButton
              variant="primary"
              onClick={() => setIsCreateChecklistOpen(true)}
              className="flex items-center gap-1.5 shadow-2xs text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Checklist Baru</span>
            </DnaButton>
          ) : undefined
        }
      />

      {/* ── 3-TAB NAVBAR ── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === "checklist" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900",
            )}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Checklist Operasional</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 tabular-nums">{checklists.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("category")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === "category" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Kategori Checklist</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 tabular-nums">{categories.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manage")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === "manage" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kelola Checklist SO</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 tabular-nums">{checklists.length}</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari dalam tab aktif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-60 placeholder:text-slate-400"
          />
        </div>
      </div>

      {(isLoading || catLoading) && (
        <QueryLoading message="Memuat data checklist..." />
      )}
      {(isError || catError) && (
        <QueryError
          error="Gagal memuat data checklist dari server"
          onRetry={() => {
            refetch();
            refetchCategories();
          }}
        />
      )}

      {/* ── TAB 1: CHECKLIST OPERASIONAL ── */}
      {!isLoading && !isError && activeTab === "checklist" && (
        <div className="space-y-4">
          <DnaDataTableCard
            title="DAFTAR CHECKLIST SALES ORDER AKTIF"
            count={filteredChecklists.length}
            badge={<DnaBadge variant="neutral">OPERASIONAL SO</DnaBadge>}
          >
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className={cn(DNA_TABLE_CLASSES.th, "w-12 text-center")}>#</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Judul Checklist</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Sales Order</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Periode Pengerjaan</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Progres Milestone</DnaTh>
                  <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status</DnaTh>
                  <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center w-28")}>Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredChecklists.map((item, idx) => {
                  const total = item.items.length;
                  const done = item.completedItems.length;
                  const pct = percent(done, total);
                  return (
                    <DnaTableRow key={item.id} className={DNA_TABLE_CLASSES.tr}>
                      <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center tabular-nums text-slate-400")}>{idx + 1}</DnaTd>
                      <DnaTd className={DNA_TABLE_CLASSES.td}>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{item.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.notes || UNKNOWN}</p>
                        </div>
                      </DnaTd>
                      <DnaTd className={DNA_TABLE_CLASSES.td}>
                        {item.salesOrderId ? (
                          <DnaCell.Code value={item.salesOrderId.slice(0, 8)} />
                        ) : (
                          <span className="text-xs font-bold text-slate-400">{UNKNOWN}</span>
                        )}
                      </DnaTd>
                      <DnaTd className={DNA_TABLE_CLASSES.td}>
                        <div className="text-xs">
                          <p className="text-slate-700 font-medium">Mulai: {formatDate(item.createdAt)}</p>
                          <p className="text-slate-500">Diubah: {formatDate(item.updatedAt)}</p>
                        </div>
                      </DnaTd>
                      <DnaTd className={DNA_TABLE_CLASSES.td}>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>{done} / {total} Selesai</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                item.status === "COMPLETED" ? "bg-emerald-500" : "bg-blue-500",
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </DnaTd>
                      <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                        <DnaBadge status={item.status === "COMPLETED" ? "SUCCESS" : "INFO"}>{item.status}</DnaBadge>
                      </DnaTd>
                      <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedManageItem(item);
                            setActiveTab("manage");
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer border border-blue-200/60"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Rincian</span>
                        </button>
                      </DnaTd>
                    </DnaTableRow>
                  );
                })}
                {filteredChecklists.length === 0 && (
                  <DnaTableRow className="hover:bg-transparent">
                    <DnaTd colSpan={7} className="py-12 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                        Belum ada checklist yang terdaftar.
                      </p>
                    </DnaTd>
                  </DnaTableRow>
                )}
              </DnaTableBody>
            </DnaTable>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── TAB 2: KATEGORI CHECKLIST (read-only — no write route exists) ── */}
      {!catLoading && !catError && activeTab === "category" && (
        <div className="space-y-4">
          <DnaDataTableCard
            title="MASTER SEQUENCE KATEGORI CHECKLIST"
            count={categories.length}
            badge={<DnaBadge variant="neutral">STANDARDISASI PROTOKOL</DnaBadge>}
          >
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className={cn(DNA_TABLE_CLASSES.th, "w-16 text-center")}>Urutan</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Nama Kategori / Milestone</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Gate</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Kode</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {categories.map((cat) => (
                  <DnaTableRow key={cat.id} className={DNA_TABLE_CLASSES.tr}>
                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center tabular-nums font-bold text-blue-600")}>#{cat.order}</DnaTd>
                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "font-semibold text-slate-800 text-xs")}>{cat.label}</DnaTd>
                    <DnaTd className={DNA_TABLE_CLASSES.td}>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-purple-50 text-purple-700 border-purple-200">
                        {cat.gate}
                      </span>
                    </DnaTd>
                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-xs font-medium text-slate-500")}>{cat.id}</DnaTd>
                  </DnaTableRow>
                ))}
                {categories.length === 0 && (
                  <DnaTableRow className="hover:bg-transparent">
                    <DnaTd colSpan={4} className="py-12 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                        Belum ada kategori checklist yang terdaftar.
                      </p>
                    </DnaTd>
                  </DnaTableRow>
                )}
              </DnaTableBody>
            </DnaTable>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── TAB 3: KELOLA CHECKLIST SO ── */}
      {!isLoading && !isError && activeTab === "manage" && (
        <div className="space-y-4">
          <DnaDataTableCard
            title="MANAJEMEN KELOLA CHECKLIST PROTOKOL"
            count={filteredChecklists.length}
            badge={<DnaBadge variant="neutral">EKSEKUSI OPERASIONAL</DnaBadge>}
          >
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className={cn(DNA_TABLE_CLASSES.th, "w-12 text-center")}>#</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Judul & Sales Order</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Pembuat</DnaTh>
                  <DnaTh className={DNA_TABLE_CLASSES.th}>Dibuat</DnaTh>
                  <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status</DnaTh>
                  <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center w-28")}>Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredChecklists.map((item, idx) => (
                  <DnaTableRow key={item.id} className={DNA_TABLE_CLASSES.tr}>
                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center tabular-nums text-slate-400")}>{idx + 1}</DnaTd>
                    <DnaTd className={DNA_TABLE_CLASSES.td}>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">{item.title}</p>
                        {item.salesOrderId ? (
                          <DnaCell.Code value={item.salesOrderId.slice(0, 8)} />
                        ) : (
                          <p className="text-[11px] text-slate-400 font-bold mt-0.5">{UNKNOWN}</p>
                        )}
                      </div>
                    </DnaTd>
                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-xs text-slate-600")}>
                      {item.creator?.fullName || UNKNOWN}
                    </DnaTd>
                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-xs tabular-nums text-slate-700")}>
                      {formatDate(item.createdAt)}
                    </DnaTd>
                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <DnaBadge status={item.status === "COMPLETED" ? "SUCCESS" : "INFO"}>{item.status}</DnaBadge>
                    </DnaTd>
                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <button
                        type="button"
                        onClick={() => setSelectedManageItem(item)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer border border-blue-200/60"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Kelola</span>
                      </button>
                    </DnaTd>
                  </DnaTableRow>
                ))}
                {filteredChecklists.length === 0 && (
                  <DnaTableRow className="hover:bg-transparent">
                    <DnaTd colSpan={6} className="py-12 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                        Belum ada checklist yang terdaftar.
                      </p>
                    </DnaTd>
                  </DnaTableRow>
                )}
              </DnaTableBody>
            </DnaTable>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── MODAL: BUAT CHECKLIST BARU ── */}
      <DnaModal
        isOpen={isCreateChecklistOpen}
        onClose={() => setIsCreateChecklistOpen(false)}
        title="Buat Checklist Operasional Sales Order Baru"
        subtitle="Daftarkan sales order maklon ke dalam sistem tracking checklist."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Checklist *</label>
            <DnaInput
              value={newChecklistForm.title}
              onChange={(e) => setNewChecklistForm({ ...newChecklistForm, title: e.target.value })}
              placeholder="Contoh: Checklist Batch SO-2026-0525"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Order ID <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <DnaInput
              value={newChecklistForm.workOrderId}
              onChange={(e) => setNewChecklistForm({ ...newChecklistForm, workOrderId: e.target.value })}
              placeholder="UUID work order"
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Endpoint <span className="font-mono">POST /qc/checklists</span> hanya menerima judul, work order,
            dan daftar item. Tanpa daftar item, backend memakai 9 kategori kronologis baku.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={() => setIsCreateChecklistOpen(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={handleSaveChecklist} disabled={createChecklist.isPending}>
              {createChecklist.isPending ? "Menyimpan..." : "Simpan & Daftarkan Checklist"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* ── MODAL: RINCIAN SUB-CHECKLIST (milestone toggle → PATCH) ── */}
      <DnaModal
        isOpen={!!selectedManageItem}
        onClose={() => setSelectedManageItem(null)}
        title={`Rincian Sub-Checklist: ${selectedManageItem?.title ?? ""}`}
        subtitle={`Status: ${selectedManageItem?.status ?? UNKNOWN} • Dibuat: ${formatDate(selectedManageItem?.createdAt)}`}
        size="lg"
      >
        {selectedManageItem && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="px-3 py-2 text-center w-10">#</DnaTh>
                    <DnaTh className="px-3 py-2">Kategori Milestone</DnaTh>
                    <DnaTh className="px-3 py-2 text-center">Wajib</DnaTh>
                    <DnaTh className="px-3 py-2 text-center">Status</DnaTh>
                    <DnaTh className="px-3 py-2 text-center">Aksi Status</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedManageItem.items.map((sub, i) => {
                    const done = selectedManageItem.completedItems.includes(sub.label);
                    return (
                      <DnaTableRow key={`${sub.label}-${i}`} className="hover:bg-slate-50/60">
                        <DnaTd className="px-3 py-2 text-center tabular-nums text-slate-400">{i + 1}</DnaTd>
                        <DnaTd className="px-3 py-2 font-semibold text-slate-800">{sub.label}</DnaTd>
                        <DnaTd className="px-3 py-2 text-center text-xs text-slate-500">
                          {sub.isRequired ? "Ya" : "Tidak"}
                        </DnaTd>
                        <DnaTd className="px-3 py-2 text-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs",
                              done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200",
                            )}
                          >
                            {done ? "DONE" : "PENDING"}
                          </span>
                        </DnaTd>
                        <DnaTd className="px-3 py-2 text-center">
                          <button
                            type="button"
                            disabled={toggleMilestone.isPending}
                            onClick={() => handleToggleSubItemStatus(selectedManageItem, sub.label)}
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border disabled:opacity-50",
                              done ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300" : "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700",
                            )}
                          >
                            {done ? "Set Pending" : "Set Done ✓"}
                          </button>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })}
                  {selectedManageItem.items.length === 0 && (
                    <DnaTableRow className="hover:bg-transparent">
                      <DnaTd colSpan={5} className="py-10 text-center text-[11px] font-bold text-slate-400 uppercase">
                        Checklist ini belum memiliki item milestone.
                      </DnaTd>
                    </DnaTableRow>
                  )}
                </DnaTableBody>
              </DnaTable>
            </div>

            {selectedManageItem.notes && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <p className="text-[11px] text-slate-400 font-medium">Catatan:</p>
                <p className="text-xs font-medium text-slate-800">{selectedManageItem.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <DnaButton variant="secondary" onClick={() => setSelectedManageItem(null)}>Tutup Rincian</DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </div>
  );
}