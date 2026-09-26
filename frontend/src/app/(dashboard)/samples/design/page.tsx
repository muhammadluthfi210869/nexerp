"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Palette,
  Plus,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  X,
  Camera,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaErrorState,
  DnaLoadingSkeleton,
  DnaEmptyState,
} from "@/components/dna";
import { DnaTextarea } from "@/components/dna";
import { api, extractApiError } from "@/lib/api";

/** GET /creative/tasks — DesignTask + lead + latest version only. */
interface DesignTaskVersion {
  id: string;
  versionNumber: number;
  artworkUrl: string | null;
  mockupUrl: string | null;
}

interface DesignTask {
  id: string;
  brief: string;
  taskType: string | null;
  kanbanState: string;
  revisionCount: number;
  isLocked: boolean;
  isFinal: boolean;
  slaDeadline: string | null;
  finalArtworkUrl: string | null;
  finalMockupUrl: string | null;
  createdAt: string;
  updatedAt: string;
  lead: {
    id: string;
    clientName: string;
    brandName: string | null;
    productInterest: string | null;
  } | null;
  versions: DesignTaskVersion[];
}

interface AvailableSalesOrder {
  id: string;
  orderNumber: string;
  leadId: string;
  brandName: string | null;
  lead: { clientName: string; brandName: string | null } | null;
}

const KANBAN_STATES = [
  "INBOX",
  "IN_PROGRESS",
  "WAITING_APJ",
  "WAITING_CLIENT",
  "REVISION",
  "LOCKED",
] as const;

const STATE_LABEL: Record<string, string> = {
  INBOX: "Inbox",
  IN_PROGRESS: "Dikerjakan",
  WAITING_APJ: "Menunggu APJ",
  WAITING_CLIENT: "Menunggu Klien",
  REVISION: "Revisi",
  LOCKED: "Locked / Siap Cetak",
};

const STATE_VARIANT: Record<string, "neutral" | "info" | "warning" | "critical" | "success" | "purple"> = {
  INBOX: "neutral",
  IN_PROGRESS: "info",
  WAITING_APJ: "purple",
  WAITING_CLIENT: "warning",
  REVISION: "critical",
  LOCKED: "success",
};

const TASK_TYPES = ["PACKAGING", "PRINTING", "LABEL", "OTHER"] as const;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}

function DesignManageContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<DesignTask | null>(null);
  const toast = useDnaToast();

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<DesignTask[]>({
    queryKey: ["creative-tasks"],
    queryFn: async () => {
      try {
        const res = await api.get("/creative/tasks");
        return unwrapList(res.data).map(
          (item: any): DesignTask => ({
            id: item.id,
            brief: item.brief || "—",
            taskType: item.taskType || null,
            kanbanState: item.kanbanState || "INBOX",
            revisionCount: Number(item.revisionCount ?? 0),
            isLocked: Boolean(item.isLocked),
            isFinal: Boolean(item.isFinal),
            slaDeadline: item.slaDeadline || null,
            finalArtworkUrl: item.finalArtworkUrl || null,
            finalMockupUrl: item.finalMockupUrl || null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            lead: item.lead
              ? {
                  id: item.lead.id,
                  clientName: item.lead.clientName || "—",
                  brandName: item.lead.brandName || null,
                  productInterest: item.lead.productInterest || null,
                }
              : null,
            versions: Array.isArray(item.versions)
              ? item.versions.map((v: any) => ({
                  id: v.id,
                  versionNumber: Number(v.versionNumber ?? 0),
                  artworkUrl: v.artworkUrl || null,
                  mockupUrl: v.mockupUrl || null,
                }))
              : [],
          })
        );
      } catch {
        return [];
      }
    },
  });

  // Sales order picker for the create form (drives leadId server-side).
  const { data: salesOrders = [] } = useQuery<AvailableSalesOrder[]>({
    queryKey: ["creative-available-sales-orders"],
    enabled: isCreateModalOpen,
    queryFn: async () => {
      try {
        const res = await api.get("/creative/available-sales-orders");
        return unwrapList(res.data).map(
          (so: any): AvailableSalesOrder => ({
            id: so.id,
            orderNumber: so.orderNumber || "—",
            leadId: so.leadId,
            brandName: so.brandName || null,
            lead: so.lead
              ? { clientName: so.lead.clientName || "—", brandName: so.lead.brandName || null }
              : null,
          })
        );
      } catch {
        return [];
      }
    },
  });

  const [formData, setFormData] = useState({
    soId: "",
    brief: "",
    taskType: "PACKAGING" as (typeof TASK_TYPES)[number],
  });

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const so = salesOrders.find((s) => s.id === formData.soId);
      if (!so) throw new Error("Pilih Sales Order terlebih dahulu.");
      const res = await api.post("/creative/task", {
        leadId: so.leadId,
        soId: so.id,
        brief: formData.brief,
        taskType: formData.taskType,
      });
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creative-tasks"] });
      setIsCreateModalOpen(false);
      setFormData({ soId: "", brief: "", taskType: "PACKAGING" });
      toast.success("Desain Berhasil Dibuat", "Task desain masuk ke papan Creative.");
    },
    onError: (error) => {
      const { message } = extractApiError(error);
      toast.error("Gagal Membuat Desain", message || "Task desain tidak dapat dibuat.");
    },
  });

  const handleSaveDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.soId) {
      toast.warning("Lengkapi Data", "Sales Order wajib dipilih.");
      return;
    }
    if (formData.brief.trim().length < 3) {
      toast.warning("Lengkapi Data", "Brief desain wajib diisi.");
      return;
    }
    createMutation.mutate();
  };

  const filteredDesigns = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.brief.toLowerCase().includes(q) ||
        (d.lead?.clientName || "").toLowerCase().includes(q) ||
        (d.lead?.brandName || "").toLowerCase().includes(q) ||
        (d.lead?.productInterest || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "REVISION"
          ? d.kanbanState === "REVISION" || d.revisionCount > 0
          : d.kanbanState === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter]);

  const totalBerjalan = data.length;
  const menungguApproval = data.filter(
    (d) => d.kanbanState === "WAITING_APJ" || d.kanbanState === "WAITING_CLIENT"
  ).length;
  const disetujui = data.filter((d) => d.isLocked || d.isFinal).length;
  const perluRevisi = data.filter((d) => d.kanbanState === "REVISION" || d.revisionCount > 0).length;

  if (isLoading) {
    return (
      <DnaPageContainer>
        <DnaPageHeader
          title="Kelola Desain & Kemasan"
          description="Memuat task desain dari modul Creative."
        />
        <DnaLoadingSkeleton rows={6} />
      </DnaPageContainer>
    );
  }

  if (isError) {
    return (
      <DnaPageContainer>
        <DnaPageHeader title="Kelola Desain & Kemasan" description="Task desain kemasan maklon." />
        <DnaErrorState
          title="Gagal Memuat Desain"
          message="Tidak dapat mengambil data dari /creative/tasks."
          onRetry={() => refetch()}
        />
      </DnaPageContainer>
    );
  }

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Kelola Desain & Kemasan"
        description="Task desain kemasan dari modul Creative: status papan kanban, revisi, dan versi artwork terakhir. Persetujuan APJ/klien dilakukan di papan Creative."
        breadcrumbs={[
          { label: "Operasional", href: "/dashboard-rnd" },
          { label: "Pra Produksi", href: "/samples/design" },
          { label: "Kelola Desain", href: "/samples/design" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Muat Ulang
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Desain Baru
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL TASK DESAIN"
          value={`${totalBerjalan} Task`}
          subValue="Seluruh task pada papan Creative"
          icon={<Palette className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="MENUNGGU PERSETUJUAN"
          value={`${menungguApproval} Task`}
          subValue="Status WAITING_APJ & WAITING_CLIENT"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="DESAIN FINAL / LOCKED"
          value={`${disetujui} Siap Cetak`}
          subValue="Approved oleh klien (isFinal / isLocked)"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="PERNAH DIREVISI"
          value={`${perluRevisi} Task`}
          subValue="revisionCount > 0 atau status REVISION"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Task Desain Kemasan"
        description="Brief, klien/brand, versi artwork terakhir, dan batas SLA dari modul Creative."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari brief, klien, brand, atau produk..."
        actions={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            {KANBAN_STATES.map((s) => (
              <option key={s} value={s}>
                {STATE_LABEL[s]}
              </option>
            ))}
            <option value="REVISION">Revisi (rev &gt; 0)</option>
          </select>
        }
      >
        {data.length === 0 ? (
          <DnaEmptyState
            title="Belum Ada Task Desain"
            description="Belum ada task desain pada modul Creative. Gunakan tombol Buat Desain Baru untuk membuat task dari Sales Order."
          />
        ) : (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-3 px-3 text-center w-10">#</DnaTh>
                  <DnaTh className="py-3 px-3">Brief / Produk</DnaTh>
                  <DnaTh className="py-3 px-3 w-44">Klien / Brand</DnaTh>
                  <DnaTh className="py-3 px-3 w-32">Tipe Task</DnaTh>
                  <DnaTh className="py-3 px-3 text-center w-32">Status Papan</DnaTh>
                  <DnaTh className="py-3 px-3 text-center w-24">Versi</DnaTh>
                  <DnaTh className="py-3 px-3 text-center w-24">Revisi</DnaTh>
                  <DnaTh className="py-3 px-3 w-28">Batas SLA</DnaTh>
                  <DnaTh className="py-3 px-3 text-center w-20">Artwork</DnaTh>
                  <DnaTh className="py-3 px-3 text-center w-16">#</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredDesigns.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada task desain yang sesuai filter.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredDesigns.map((row, idx) => (
                    <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <DnaTd className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</DnaTd>
                      <DnaTd className="py-3 px-3">
                        <span className="font-semibold text-slate-900 block truncate max-w-sm">{row.brief}</span>
                        <span className="text-[11px] text-slate-500">
                          {row.lead?.productInterest || "Produk belum ditentukan"}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-3">
                        <span className="font-semibold text-slate-800 block">{row.lead?.clientName || "—"}</span>
                        <span className="text-[11px] text-slate-500">{row.lead?.brandName || "—"}</span>
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-slate-700 font-medium">{row.taskType || "—"}</DnaTd>
                      <DnaTd className="py-3 px-3 text-center">
                        <DnaBadge variant={STATE_VARIANT[row.kanbanState] || "neutral"}>
                          {STATE_LABEL[row.kanbanState] || row.kanbanState}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-center tabular-nums font-bold text-slate-800">
                        {row.versions[0]?.versionNumber ? `V${row.versions[0].versionNumber}` : "—"}
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-center tabular-nums font-bold text-slate-700">
                        {row.revisionCount}
                      </DnaTd>
                      <DnaTd className="py-3 px-3 tabular-nums text-slate-600">
                        {formatDate(row.slaDeadline)}
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedDesign(row)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 inline-flex items-center justify-center"
                          title="Lihat artwork & detail"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedDesign(row)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Detail task desain"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </DnaDataTableCard>

      {/* Modal Buat Desain Baru (POST /creative/task) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Buat Task Desain Kemasan</h3>
                <p className="text-xs text-slate-500">
                  Task dibuat dari Sales Order aktif; leadId dan batas SLA ditetapkan server.
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDesign} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Sales Order <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.soId}
                  onChange={(e) => setFormData({ ...formData, soId: e.target.value })}
                  className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 font-medium"
                >
                  <option value="">— Pilih Sales Order —</option>
                  {salesOrders.map((so) => (
                    <option key={so.id} value={so.id}>
                      {so.orderNumber} • {so.lead?.clientName || "—"} ({so.brandName || so.lead?.brandName || "—"})
                    </option>
                  ))}
                </select>
                {salesOrders.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Tidak ada Sales Order aktif (PENDING_DP / ACTIVE) yang dapat dipilih, atau Anda tidak
                    memiliki akses ke daftar ini.
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Tipe Task <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.taskType}
                  onChange={(e) =>
                    setFormData({ ...formData, taskType: e.target.value as (typeof TASK_TYPES)[number] })
                  }
                  className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 font-medium"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Brief Desain <span className="text-rose-500">*</span>
                </label>
                <DnaTextarea
                  required
                  rows={4}
                  placeholder="Contoh: Label 85x35mm, inner box foil emas, klaim dermatologis sesuai arahan regulasi..."
                  value={formData.brief}
                  onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <DnaButton type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Kembali
                </DnaButton>
                <DnaButton type="submit" variant="primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Menyimpan..." : "Simpan Task Desain"}
                </DnaButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Task Desain */}
      {selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {selectedDesign.lead?.brandName || selectedDesign.lead?.clientName || "Task Desain"}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDesign.lead?.clientName || "—"} • {selectedDesign.taskType || "—"}
                </p>
              </div>
              <button onClick={() => setSelectedDesign(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block">Status Papan:</span>
                <DnaBadge variant={STATE_VARIANT[selectedDesign.kanbanState] || "neutral"}>
                  {STATE_LABEL[selectedDesign.kanbanState] || selectedDesign.kanbanState}
                </DnaBadge>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Versi Artwork Terakhir:</span>
                <span className="tabular-nums font-bold text-slate-900">
                  {selectedDesign.versions[0]?.versionNumber
                    ? `V${selectedDesign.versions[0].versionNumber}`
                    : "Belum ada versi"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Jumlah Revisi:</span>
                <span className="tabular-nums font-bold text-slate-900">{selectedDesign.revisionCount}x</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Batas SLA:</span>
                <span className="tabular-nums text-slate-800 inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(selectedDesign.slaDeadline)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-bold block">Produk Diminati:</span>
                <span className="text-slate-800">{selectedDesign.lead?.productInterest || "—"}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Brief Desain
              </span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedDesign.brief}</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Berkas Artwork
              </span>
              {selectedDesign.finalArtworkUrl || selectedDesign.versions[0]?.artworkUrl ? (
                <a
                  href={selectedDesign.finalArtworkUrl || selectedDesign.versions[0]?.artworkUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                >
                  Buka master artwork
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-slate-400 italic">Belum ada berkas artwork diunggah.</p>
              )}
              {selectedDesign.finalMockupUrl || selectedDesign.versions[0]?.mockupUrl ? (
                <a
                  href={selectedDesign.finalMockupUrl || selectedDesign.versions[0]?.mockupUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                >
                  Buka mockup preview
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Catatan: nomor notifikasi BPOM, nomor batch, tanggal kedaluwarsa, dan dual-approval
              BusDev/Purchase tidak tersimpan pada modul Creative (<code className="font-mono">DesignTask</code>),
              sehingga tidak ditampilkan. Persetujuan APJ dan klien dilakukan melalui papan Creative
              (endpoint <code className="font-mono">/creative/task/:id/apj-review</code> dan
              <code className="font-mono"> /client-review</code>) dan tercatat pada riwayat desain.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <DnaButton variant="outline" onClick={() => setSelectedDesign(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        </div>
      )}
    </DnaPageContainer>
  );
}

export default function DesignManagePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Memuat Kelola Desain...</div>}>
      <DesignManageContent />
    </Suspense>
  );
}