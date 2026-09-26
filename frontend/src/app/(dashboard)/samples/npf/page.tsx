"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FlaskConical,
  Plus,
  FileSpreadsheet,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
  Truck,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaTabNav,
  DnaErrorState,
  CustomerSelect,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

/**
 * Rows are `SampleRequest` records from `GET /rnd/samples` — the sample
 * lifecycle, which is what this page's columns and tabs actually describe.
 * `NewProductForm` (`/rnd/npf`) is the intake document only; it carries no
 * stage, revision, PIC or courier, so it cannot drive this table.
 */
interface NpfSampleRow {
  id: string;
  sampleCode: string;
  entryDate: string;
  clientName: string;
  brandName: string;
  productName: string;
  targetFunction: string;
  textureReq: string;
  aromaReq: string;
  colorReq: string;
  targetHppPrice: number;
  targetDeadline: string | null;
  formulatorPic: string;
  busdevPic: string;
  currentRevision: string;
  stage: string;
  stageLabel: string;
  courier: string;
  trackingAwb: string;
  clientFeedback: string;
}

/** Mirrors the canonical `SampleStage` enum (11 values) — do not invent stages. */
const STAGE_LABEL: Record<string, string> = {
  WAITING_FINANCE: "Menunggu Verifikasi Finance",
  QUEUE: "Antrean Lab",
  FORMULATING: "Proses Formulasi Lab",
  LAB_TEST: "Uji Lab",
  READY_TO_SHIP: "Siap Dikirim",
  SHIPPED: "Sample Terkirim",
  RECEIVED: "Diterima Klien",
  CLIENT_REVIEW: "Review Klien",
  APPROVED: "Approved (Deal)",
  REJECTED: "Ditolak / Perlu Revisi",
  CANCELLED: "Dibatalkan",
};

const STAGE_VARIANT: Record<string, string> = {
  WAITING_FINANCE: "warning",
  QUEUE: "neutral",
  FORMULATING: "indigo",
  LAB_TEST: "indigo",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  RECEIVED: "purple",
  CLIENT_REVIEW: "purple",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

/** `CLIENT_REVIEW` is the only stage whose canonical transitions accept a client decision. */
const DECISION_STAGE = "CLIENT_REVIEW";

const str = (v: unknown, fallback = "—") =>
  v === null || v === undefined || v === "" ? fallback : String(v);

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const num = (v: unknown) => Number(v ?? 0);

export default function NpfSamplePage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNpf, setSelectedNpf] = useState<NpfSampleRow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Form state — exactly the fields `POST /rnd/npf` accepts. Anything else the
  // form collects but the endpoint does not persist would be a silent lie.
  const [createForm, setCreateForm] = useState({
    leadId: "",
    clientLabel: "",
    productName: "",
    targetPrice: 0,
    conceptNotes: "",
  });

  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackDecision, setFeedbackDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");

  const samplesQuery = useQuery<NpfSampleRow[]>({
    queryKey: ["rnd-npf-samples"],
    queryFn: async () => {
      const res = await api.get("/rnd/samples");
      const body = unwrapResponse<any>(res.data);
      const list: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return list.map((s: any): NpfSampleRow => {
        const stage = str(s.stage, "QUEUE");
        const version = num(s.version) || 1;
        const revisionCount = num(s.revisionCount);
        return {
          id: String(s.id),
          sampleCode: str(s.sampleCode),
          entryDate: fmtDate(s.requestedAt ?? s.createdAt),
          clientName: str(s.lead?.clientName, "Pelanggan tidak diketahui"),
          brandName: str(s.lead?.brandName, "—"),
          productName: str(s.productName),
          targetFunction: str(s.targetFunction),
          textureReq: str(s.textureReq),
          aromaReq: str(s.aromaReq),
          colorReq: str(s.colorReq),
          targetHppPrice: num(s.targetHpp),
          targetDeadline: s.targetDeadline ?? null,
          formulatorPic: str(s.pic?.name ?? s.rnd?.fullName, "Belum ditugaskan"),
          busdevPic: str(s.lead?.pic?.name, "—"),
          currentRevision:
            revisionCount > 0 ? `Rev ${version} (${revisionCount}x revisi)` : `Rev ${version}`,
          stage,
          stageLabel: STAGE_LABEL[stage] ?? stage,
          courier: str(s.courierName, ""),
          trackingAwb: str(s.trackingNumber, ""),
          clientFeedback: str(s.clientFeedback ?? s.feedback, ""),
        };
      });
    },
  });

  const samples = samplesQuery.data ?? [];

  const filteredNpfs = useMemo(() => {
    return samples.filter((n) => {
      if (activeTab === "lab" && n.stage !== "FORMULATING" && n.stage !== "LAB_TEST") return false;
      if (activeTab === "shipped" && n.stage !== "READY_TO_SHIP" && n.stage !== "SHIPPED" && n.stage !== "RECEIVED") return false;
      if (activeTab === "approved" && n.stage !== "APPROVED") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          n.sampleCode.toLowerCase().includes(q) ||
          n.clientName.toLowerCase().includes(q) ||
          n.brandName.toLowerCase().includes(q) ||
          n.productName.toLowerCase().includes(q) ||
          n.formulatorPic.toLowerCase().includes(q) ||
          n.textureReq.toLowerCase().includes(q) ||
          n.aromaReq.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [samples, activeTab, searchQuery]);

  const totalNpfs = samples.length;
  const labTrialCount = samples.filter((n) => n.stage === "FORMULATING" || n.stage === "LAB_TEST").length;
  const shippedCount = samples.filter((n) => n.stage === "READY_TO_SHIP" || n.stage === "SHIPPED" || n.stage === "RECEIVED").length;
  const approvedCount = samples.filter((n) => n.stage === "APPROVED").length;

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/rnd/npf", {
        leadId: createForm.leadId,
        productName: createForm.productName.trim(),
        targetPrice: num(createForm.targetPrice),
        conceptNotes: createForm.conceptNotes.trim() || undefined,
      });
      return unwrapResponse(res.data);
    },
    onSuccess: () => {
      toast.success(
        "Dokumen NPF Disimpan",
        "Dokumen formulasi produk baru berhasil didaftarkan ke tim R&D."
      );
      queryClient.invalidateQueries({ queryKey: ["rnd-npf-samples"] });
      setIsCreateModalOpen(false);
      setCreateForm({ leadId: "", clientLabel: "", productName: "", targetPrice: 0, conceptNotes: "" });
    },
    onError: (error) => {
      toast.error("Gagal Menyimpan NPF", extractApiError(error).message);
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/rnd/sample/${selectedNpf?.id}/advance`, {
        newStage: feedbackDecision,
        feedback: feedbackNotes.trim() || undefined,
      });
      return unwrapResponse(res.data);
    },
    onSuccess: () => {
      toast.success(
        feedbackDecision === "APPROVED" ? "Sample Disetujui (Approved)" : "Sample Ditolak — Revisi Diajukan",
        feedbackDecision === "APPROVED"
          ? "Sample telah disetujui klien. Project dapat dilanjutkan ke tahap HPP & SPK Pra-Produksi."
          : "Keputusan penolakan tercatat; formulator dapat memulai revisi formula."
      );
      queryClient.invalidateQueries({ queryKey: ["rnd-npf-samples"] });
      setIsFeedbackModalOpen(false);
      setFeedbackNotes("");
    },
    onError: (error) => {
      toast.error("Gagal Menyimpan Keputusan", extractApiError(error).message);
    },
  });

  const handleCreateNpf = () => {
    if (!createForm.leadId) {
      toast.warning("Form Belum Lengkap", "Pelanggan harus dipilih dari daftar master pelanggan.");
      return;
    }
    if (!createForm.productName.trim()) {
      toast.warning("Form Belum Lengkap", "Nama Produk wajib diisi.");
      return;
    }
    createMutation.mutate();
  };

  const handleSaveFeedback = () => {
    if (!selectedNpf || selectedNpf.stage !== DECISION_STAGE) return;
    feedbackMutation.mutate();
  };

  const handleExport = () => {
    const header = [
      "Kode Sample", "Tanggal", "Klien", "Brand", "Produk", "Fungsi", "Tahap",
      "Revisi", "Formulator", "Kurir", "Resi", "Feedback Klien",
    ];
    const body = filteredNpfs.map((r) => [
      r.sampleCode, r.entryDate, r.clientName, r.brandName, r.productName,
      r.targetFunction, r.stageLabel, r.currentRevision, r.formulatorPic,
      r.courier, r.trackingAwb, r.clientFeedback,
    ]);
    const csv = [header, ...body]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "daftar-sample-npf.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export Berhasil", `${filteredNpfs.length} baris diunduh sebagai CSV.`);
  };

  const getStatusBadge = (stage: string) => (
    <DnaBadge variant={STAGE_VARIANT[stage] ?? "neutral"}>{STAGE_LABEL[stage] ?? stage}</DnaBadge>
  );

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="NPF & Manajemen Sample Klien (New Product Formulation)"
        description="Intake spesifikasi produk baru, formulasi sample lab, pelacakan pengiriman sample, hingga konfirmasi feedback klien."
        badge={<DnaBadge variant="neutral">SCR-017 & SCR-121</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/samples/rnd-dashboard" },
          { label: "NPF & Sample", href: "/samples/npf" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" onClick={handleExport} disabled={filteredNpfs.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat NPF Baru (SCR-123)
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL DOKUMEN NPF"
          value={`${totalNpfs} Dokumen`}
          subValue="Permintaan Formulasi Masuk"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="FORMULASI LAB"
          value={`${labTrialCount} Trial`}
          subValue="Dalam Pengerjaan Formulator"
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="SAMPLE TERKIRIM"
          value={`${shippedCount} Klien`}
          subValue="Menunggu Review Feedback"
          icon={<Send className="w-5 h-5 text-cyan-600" />}
        />
        <DnaStatCard
          label="SAMPLE APPROVED (DEAL)"
          value={`${approvedCount} Disetujui`}
          subValue="Siap Masuk Pra-Produksi"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua NPF (${totalNpfs})` },
          { id: "lab", label: `Formulasi Lab (${labTrialCount})` },
          { id: "shipped", label: `Sample Terkirim (${shippedCount})` },
          { id: "approved", label: `Approved Deal (${approvedCount})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. DataTable Card (SCR-121) */}
      <DnaDataTableCard
        title="Daftar Permintaan Sample & Formulasi NPF"
        description="Pelacakan lifecycle sample mulai dari trial lab, pengiriman kurir resi, hingga approval deal."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Kode Sample, Klien, Brand, Produk, Formulator..."
      >
        {samplesQuery.isError && (
          <div className="px-4 pt-4">
            <DnaErrorState
              title="Gagal Memuat Data Sample"
              message={extractApiError(samplesQuery.error).message}
              onRetry={() => samplesQuery.refetch()}
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4">Kode & Tanggal</DnaTh>
                <DnaTh className="py-3 px-4">Klien & Brand</DnaTh>
                <DnaTh className="py-3 px-4">Produk & Fungsi</DnaTh>
                <DnaTh className="py-3 px-4">Target HPP & Deadline</DnaTh>
                <DnaTh className="py-3 px-4">Spesifikasi (Tekstur / Warna / Aroma)</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Revisi</DnaTh>
                <DnaTh className="py-3 px-4">PIC Formulator</DnaTh>
                <DnaTh className="py-3 px-4">Status Sample</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredNpfs.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    {samplesQuery.isError
                      ? "Daftar sample tidak dapat dimuat."
                      : samplesQuery.isLoading
                        ? "Memuat daftar sample..."
                        : "Tidak ada permintaan sample NPF yang sesuai."}
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredNpfs.map((row) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4">
                      <p className="tabular-nums text-xs font-bold text-slate-900">{row.sampleCode}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{row.entryDate}</span>
                      </div>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-800">{row.clientName}</p>
                      <span className="tabular-nums text-[10px] text-indigo-600 font-bold">{row.brandName}</span>
                    </DnaTd>
                    <DnaTd className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{row.productName}</p>
                      <span className="text-[11px] text-slate-500">{row.targetFunction}</span>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs">
                      <p className="tabular-nums font-semibold text-slate-800">
                        {row.targetHppPrice > 0 ? `Rp ${row.targetHppPrice.toLocaleString("id-ID")}` : "—"}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Deadline: {fmtDate(row.targetDeadline)}
                      </span>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs text-slate-700 max-w-[240px]">
                      <p className="truncate" title={row.textureReq}>Tekstur: {row.textureReq}</p>
                      <p className="truncate text-[10px] text-slate-500" title={row.colorReq}>Warna: {row.colorReq}</p>
                      <p className="truncate text-[10px] text-slate-500" title={row.aromaReq}>Aroma: {row.aromaReq}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <span className="inline-block tabular-nums text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {row.currentRevision}
                      </span>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-800">{row.formulatorPic}</p>
                      <p className="text-[10px] text-slate-400">BusDev: {row.busdevPic}</p>
                      {(row.courier || row.trackingAwb) && (
                        <p className="text-[10px] text-cyan-700 flex items-center gap-1 mt-0.5">
                          <Truck className="w-3 h-3" />
                          {row.courier || "Kurir"} {row.trackingAwb && `• ${row.trackingAwb}`}
                        </p>
                      )}
                    </DnaTd>
                    <DnaTd className="py-3 px-4">
                      {getStatusBadge(row.stage)}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNpf(row);
                            setIsDetailModalOpen(true);
                          }}
                          title="Lihat Detail NPF"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNpf(row);
                            setFeedbackNotes(row.clientFeedback);
                            setFeedbackDecision("APPROVED");
                            setIsFeedbackModalOpen(true);
                          }}
                          title="Input Feedback Klien"
                        >
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* 5. Modal Buat NPF Baru (SCR-123) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Dokumen NPF Baru (SCR-123)"
        description="Formulir intake spesifikasi dan acuan produk maklon kosmetik baru."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateNpf} loading={createMutation.isPending}>
              Simpan & Daftarkan NPF
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <CustomerSelect
              label="Nama Pelanggan / Klien *"
              value={createForm.leadId}
              onChange={(id, customer) =>
                setCreateForm((prev) => ({
                  ...prev,
                  leadId: id,
                  clientLabel: customer?.clientName ?? "",
                }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Produk NPF *</label>
              <input
                type="text"
                placeholder="Brightening Serum Niacinamide 10%"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.productName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, productName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Target Harga Produk (Rp)</label>
              <input
                type="number"
                min={0}
                placeholder="15000"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 tabular-nums"
                value={createForm.targetPrice}
                onChange={(e) => setCreateForm(prev => ({ ...prev, targetPrice: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">
              Catatan Konsep (benchmark, tekstur, aroma, warna, bahan aktif)
            </label>
            <textarea
              rows={4}
              placeholder="Contoh: benchmark Skintific 5X Ceramide; tekstur watery gel; aroma fresh floral; aktif Niacinamide 10%..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={createForm.conceptNotes}
              onChange={(e) => setCreateForm(prev => ({ ...prev, conceptNotes: e.target.value }))}
            />
            <p className="text-[10px] text-slate-500">
              Spesifikasi formulasi lengkap (fungsi, tekstur, warna, aroma) diisi tim R&D saat membuat sample request.
            </p>
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Input Feedback & Keputusan Sample */}
      <DnaModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Input Feedback & Keputusan Sample Klien"
        description="Pencatatan respon klien setelah menguji sample kosmetik di lapangan."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsFeedbackModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={handleSaveFeedback}
              disabled={selectedNpf?.stage !== DECISION_STAGE}
              loading={feedbackMutation.isPending}
            >
              Simpan Keputusan
            </DnaButton>
          </div>
        }
      >
        {selectedNpf && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">{selectedNpf.productName}</p>
              <p className="text-slate-500">
                {selectedNpf.clientName} ({selectedNpf.brandName}) • {selectedNpf.currentRevision}
              </p>
            </div>

            {selectedNpf.stage !== DECISION_STAGE && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                Keputusan klien hanya dapat dicatat saat sample berada di tahap{" "}
                <strong>{STAGE_LABEL[DECISION_STAGE]}</strong>. Tahap saat ini:{" "}
                <strong>{selectedNpf.stageLabel}</strong>.
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Keputusan Klien *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
                value={feedbackDecision}
                onChange={(e) => setFeedbackDecision(e.target.value as "APPROVED" | "REJECTED")}
                disabled={selectedNpf.stage !== DECISION_STAGE}
              >
                <option value="APPROVED">✅ Sample Disetujui (Approved Deal - Siap Produksi)</option>
                <option value="REJECTED">🔄 Sample Ditolak (Perlu Revisi Formula)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Rincian Feedback / Catatan Revisi</label>
              <textarea
                rows={3}
                placeholder="Berikan catatan detail terkait tekstur, aroma, warna, rasa di kulit, atau request perubahan..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                disabled={selectedNpf.stage !== DECISION_STAGE}
              />
            </div>
          </div>
        )}
      </DnaModal>

      {/* 7. Modal Detail NPF */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Rincian Dokumen NPF & Spesifikasi Sample"
        description="Detail parameter intake formulasi dan riwayat review."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedNpf && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Kode Sample</span>
                  <p className="tabular-nums text-base font-bold text-slate-900">{selectedNpf.sampleCode}</p>
                </div>
                <div>{getStatusBadge(selectedNpf.stage)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Klien & Brand:</span>
                  <p className="font-semibold text-slate-800">{selectedNpf.clientName} ({selectedNpf.brandName})</p>
                </div>
                <div>
                  <span className="text-slate-500">Formulator PIC:</span>
                  <p className="font-semibold text-slate-800">{selectedNpf.formulatorPic}</p>
                </div>
                <div>
                  <span className="text-slate-500">Fungsi Target:</span>
                  <p className="font-bold text-indigo-700">{selectedNpf.targetFunction}</p>
                </div>
                <div>
                  <span className="text-slate-500">Target HPP:</span>
                  <p className="tabular-nums font-bold text-slate-800">
                    {selectedNpf.targetHppPrice > 0
                      ? `Rp ${selectedNpf.targetHppPrice.toLocaleString("id-ID")}`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Tanggal Permintaan:</span>
                  <p className="font-semibold text-slate-800">{selectedNpf.entryDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Target Deadline:</span>
                  <p className="font-semibold text-slate-800">{fmtDate(selectedNpf.targetDeadline)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[11px]">Spesifikasi Tekstur, Warna & Aroma</span>
                <p className="text-slate-600"><strong className="text-slate-800">Tekstur:</strong> {selectedNpf.textureReq}</p>
                <p className="text-slate-600"><strong className="text-slate-800">Warna:</strong> {selectedNpf.colorReq}</p>
                <p className="text-slate-600"><strong className="text-slate-800">Aroma:</strong> {selectedNpf.aromaReq}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[11px]">Pengiriman & Revisi</span>
                <p className="text-slate-600"><strong className="text-slate-800">Kurir:</strong> {selectedNpf.courier || "—"}</p>
                <p className="text-slate-600"><strong className="text-slate-800">No. Resi:</strong> {selectedNpf.trackingAwb || "—"}</p>
                <p className="text-slate-600"><strong className="text-slate-800">Revisi:</strong> {selectedNpf.currentRevision}</p>
              </div>
            </div>

            {selectedNpf.clientFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-emerald-900">Feedback Resmi Klien:</span>
                <p className="text-emerald-800">{selectedNpf.clientFeedback}</p>
              </div>
            )}
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}