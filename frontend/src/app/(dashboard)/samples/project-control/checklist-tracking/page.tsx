"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Clock,
  ArrowLeft,
  AlertCircle,
  Package,
  Layers,
  TrendingUp,
  CheckSquare,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaStatCard,
  DnaBadge,
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DNA_TABLE_CLASSES,
  DnaCell,
  DnaPagination,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
} from "@/components/dna";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Checklist tracking project SLA.
 *
 * There is no milestone/checklist table in the backend for the project-control model.
 * The real, stored timeline for a maklon SO is the R&D sample request and its stage log
 * (`/rnd/samples`, `/rnd/samples/:id` → `stageLogs` with enteredAt/leftAt/durationDays).
 * Every row, KPI, and timeline bar below comes from that data. Nothing is fabricated.
 */
type DerivedStatus = "ON_TRACK" | "PENDING_APPROVAL" | "OVERDUE" | "COMPLETED";

interface StageLog {
  id: string;
  stage: string;
  enteredAt: string;
  leftAt: string | null;
  durationDays: number | null;
  notes: string | null;
  rejectionReason: string | null;
}

interface FormulaPhaseItem {
  id: string;
  dosagePercentage: number | string;
  materialName: string;
}

interface FormulaPhase {
  id: string;
  prefix: string;
  customName: string | null;
  instructions: string | null;
  items: FormulaPhaseItem[];
}

interface SampleFormula {
  id: string;
  formulaCode: string;
  version: number;
  phases: FormulaPhase[];
}

interface SampleTrackingItem {
  id: string;
  sampleCode: string;
  customer: string;
  brand: string;
  product: string;
  packagingType: string;
  difficultyLevel: number;
  busdev: string;
  picPo: string;
  requestedAt: string;
  targetDeadline: string | null;
  stage: string;
  status: DerivedStatus;
  latestStageNotes: string | null;
}

interface SampleTimelineDetail {
  id: string;
  formula: SampleFormula | null;
  stageLogs: StageLog[];
}

const STAGE_LABEL: Record<string, string> = {
  WAITING_FINANCE: "Menunggu Pembayaran",
  QUEUE: "Dalam Antrian R&D",
  FORMULATING: "Perumusan Formula",
  LAB_TEST: "Uji Laboratorium",
  READY_TO_SHIP: "Siap Kirim Sampel",
  SHIPPED: "Sampel Dikirim",
  RECEIVED: "Sampel Diterima",
  CLIENT_REVIEW: "Review Klien",
  APPROVED: "Disetujui Klien",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

const STAGE_VARIANT: Record<string, "neutral" | "info" | "warning" | "critical" | "success" | "purple"> = {
  WAITING_FINANCE: "warning",
  QUEUE: "neutral",
  FORMULATING: "info",
  LAB_TEST: "info",
  READY_TO_SHIP: "purple",
  SHIPPED: "purple",
  RECEIVED: "purple",
  CLIENT_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "critical",
  CANCELLED: "critical",
};

const STATUS_VARIANT: Record<DerivedStatus, "success" | "info" | "warning" | "critical"> = {
  ON_TRACK: "success",
  PENDING_APPROVAL: "warning",
  OVERDUE: "critical",
  COMPLETED: "info",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function formatDateTime(value?: string | null) {
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

/** Status derived ONLY from stored stage + deadline, never invented. */
function deriveStatus(stage: string, targetDeadline: string | null): DerivedStatus {
  if (stage === "APPROVED") return "COMPLETED";
  if (stage === "REJECTED" || stage === "CANCELLED") return "OVERDUE";
  if (stage === "CLIENT_REVIEW" || stage === "WAITING_FINANCE") return "PENDING_APPROVAL";
  if (targetDeadline) {
    const due = new Date(targetDeadline);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) return "OVERDUE";
  }
  return "ON_TRACK";
}

export default function ChecklistTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState<"ALL" | DerivedStatus>("ALL");
  const [picFilter, setPicFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [viewingTimelineId, setViewingTimelineId] = useState<string | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<SampleTrackingItem[]>({
    queryKey: ["rnd-samples-tracking"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/samples");
        return unwrapList(res.data).map((item: any): SampleTrackingItem => {
          const latestLog = Array.isArray(item.stageLogs) ? item.stageLogs[0] : null;
          return {
            id: item.id,
            sampleCode: item.sampleCode || "—",
            customer: item.lead?.clientName || "—",
            brand: item.lead?.brandName || "—",
            product: item.productName || "—",
            packagingType: item.suggestPackaging || "Belum ditentukan",
            difficultyLevel: Number(item.difficultyLevel ?? 1),
            busdev: item.lead?.pic?.fullName || "—",
            picPo: item.pic?.fullName || "Belum ditugaskan",
            requestedAt: formatDate(item.requestedAt),
            targetDeadline: item.targetDeadline || null,
            stage: item.stage || "QUEUE",
            status: deriveStatus(item.stage, item.targetDeadline),
            latestStageNotes: latestLog?.notes || null,
          };
        });
      } catch {
        return [];
      }
    },
  });

  // Full stage history for the open timeline (GET /rnd/samples/:id).
  const { data: timelineDetail, isLoading: isTimelineLoading } = useQuery<SampleTimelineDetail | null>({
    queryKey: ["rnd-sample-timeline", viewingTimelineId],
    enabled: !!viewingTimelineId,
    queryFn: async () => {
      try {
        const res = await api.get(`/rnd/samples/${viewingTimelineId}`);
        const sample = res.data?.data || res.data;
        if (!sample) return null;
        return {
          id: sample.id,
          formula: Array.isArray(sample.formulas) && sample.formulas[0]
            ? {
                id: sample.formulas[0].id,
                formulaCode: sample.formulas[0].formulaCode || "—",
                version: Number(sample.formulas[0].version ?? 0),
                phases: Array.isArray(sample.formulas[0].phases)
                  ? sample.formulas[0].phases.map((ph: any): FormulaPhase => ({
                      id: ph.id,
                      prefix: ph.prefix || "—",
                      customName: ph.customName || null,
                      instructions: ph.instructions || null,
                      items: Array.isArray(ph.items)
                        ? ph.items.map((it: any): FormulaPhaseItem => ({
                            id: it.id,
                            dosagePercentage: it.dosagePercentage ?? 0,
                            materialName: it.material?.name || it.material?.code || "—",
                          }))
                        : [],
                    }))
                  : [],
              }
            : null,
          stageLogs: Array.isArray(sample.stageLogs)
            ? sample.stageLogs
                .map((log: any): StageLog => ({
                  id: log.id,
                  stage: log.stage || "—",
                  enteredAt: log.enteredAt,
                  leftAt: log.leftAt || null,
                  durationDays: log.durationDays ?? null,
                  notes: log.notes || null,
                  rejectionReason: log.rejectionReason || null,
                }))
                .sort(
                  (a: StageLog, b: StageLog) =>
                    new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime()
                )
            : [],
        };
      } catch {
        return null;
      }
    },
  });

  const picOptions = useMemo(() => {
    const list = new Set<string>();
    data.forEach((proj) => {
      if (proj.busdev && proj.busdev !== "—") list.add(proj.busdev);
      if (proj.picPo && proj.picPo !== "Belum ditugaskan") list.add(proj.picPo);
    });
    return Array.from(list).sort();
  }, [data]);

  const toggleRowExpansion = (id: string) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const filteredProjects = useMemo(() => {
    return data.filter((item) => {
      if (tabFilter !== "ALL" && item.status !== tabFilter) return false;

      if (picFilter !== "ALL") {
        const matchPicPo = item.picPo.toLowerCase().includes(picFilter.toLowerCase());
        const matchBusdev = item.busdev.toLowerCase().includes(picFilter.toLowerCase());
        if (!matchPicPo && !matchBusdev) return false;
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          item.sampleCode.toLowerCase().includes(q) ||
          item.customer.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.product.toLowerCase().includes(q) ||
          item.packagingType.toLowerCase().includes(q) ||
          item.picPo.toLowerCase().includes(q) ||
          item.busdev.toLowerCase().includes(q) ||
          item.stage.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [data, tabFilter, picFilter, searchQuery]);

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;

  const counts = useMemo(
    () => ({
      all: data.length,
      onTrack: data.filter((p) => p.status === "ON_TRACK").length,
      pending: data.filter((p) => p.status === "PENDING_APPROVAL").length,
      overdue: data.filter((p) => p.status === "OVERDUE").length,
    }),
    [data]
  );

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 bg-[#F8FAFC] min-h-screen px-6 py-6">
        <DnaLoadingSkeleton rows={8} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 pb-20 bg-[#F8FAFC] min-h-screen px-6 py-6">
        <DnaErrorState
          title="Gagal Memuat Checklist Tracking"
          message="Tidak dapat mengambil data dari /rnd/samples."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // TIMELINE VIEW (stage history of one sample request)
  // ════════════════════════════════════════════════════════════════
  if (viewingTimelineId) {
    const item = data.find((p) => p.id === viewingTimelineId) || null;
    const logs = timelineDetail?.stageLogs ?? [];
    const totalDays = logs.reduce((acc, log) => acc + (log.durationDays ?? 0), 0);

    return (
      <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen px-6 py-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <p className="text-xs text-slate-500 font-medium">Beranda / Timeline Checklist</p>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Timeline Stage Sampel</h1>
          </div>
          <button
            type="button"
            onClick={() => setViewingTimelineId(null)}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
        </div>

        {item && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span>Informasi Sampel</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Kode Sampel :</span>
                <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded tabular-nums font-bold text-[11px]">
                  {item.sampleCode}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Customer :</span>
                <span className="font-bold text-slate-800">{item.customer}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Brand/Produk :</span>
                <span className="font-semibold text-slate-800">
                  {item.brand} <span className="text-slate-500 font-normal">({item.product})</span>
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Stage Terakhir :</span>
                <DnaBadge variant={STAGE_VARIANT[item.stage] || "neutral"}>
                  {STAGE_LABEL[item.stage] || item.stage}
                </DnaBadge>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Tanggal Mulai :</span>
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded tabular-nums font-bold text-[11px]">
                  {item.requestedAt}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Target Deadline :</span>
                <span className="px-2.5 py-0.5 bg-amber-600 text-white rounded tabular-nums font-bold text-[11px]">
                  {formatDate(item.targetDeadline)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Ringkasan Waktu Stage</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Jumlah Stage Tercatat :</span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded font-bold text-[11px]">
                {logs.length} stage
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Akumulasi Durasi Stage :</span>
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded font-bold text-[11px] tabular-nums">
                {totalDays.toFixed(1)} hari
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Stage Aktif :</span>
              <span className="tabular-nums text-slate-800 font-semibold">
                {STAGE_LABEL[item?.stage || ""] || item?.stage || "—"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Versi Formula Terakhir :</span>
              <span className="tabular-nums text-slate-800 font-semibold">
                {timelineDetail?.formula ? `V${timelineDetail.formula.version} (${timelineDetail.formula.formulaCode})` : "Belum ada formula"}
              </span>
            </div>
          </div>
        </div>

        {isTimelineLoading ? (
          <DnaLoadingSkeleton rows={5} />
        ) : logs.length === 0 ? (
          <DnaEmptyState
            title="Belum Ada Riwayat Stage"
            description="Sample request ini belum memiliki catatan stage log pada /rnd/samples/:id."
          />
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Visualisasi Timeline Stage (Durasi Relatif)</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <div className="min-w-[700px]">
                  {logs.map((log) => {
                    const maxDuration = Math.max(...logs.map((l) => l.durationDays ?? 1), 1);
                    const widthPercent = Math.max(4, ((log.durationDays ?? 0) / maxDuration) * 100);
                    return (
                      <div key={log.id} className="grid grid-cols-12 items-center py-1.5 text-xs">
                        <div className="col-span-4 text-[11px] font-semibold text-slate-700 truncate pl-2">
                          {STAGE_LABEL[log.stage] || log.stage}
                        </div>
                        <div className="col-span-8 relative h-5 flex items-center bg-slate-50/50 rounded">
                          <div
                            className="absolute h-3.5 left-0 bg-amber-500 rounded text-[9px] font-bold text-amber-950 flex items-center justify-center shadow-2xs"
                            style={{ width: `${widthPercent}%`, minWidth: "16px" }}
                            title={`${STAGE_LABEL[log.stage] || log.stage}: ${formatDateTime(log.enteredAt)} → ${formatDateTime(log.leftAt)}`}
                          >
                            {log.durationDays ? <span className="px-1">{log.durationDays}d</span> : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="bg-amber-400 text-slate-950 font-bold border-b border-amber-500">
                    <DnaTh className="py-2.5 px-3 text-center w-10">#</DnaTh>
                    <DnaTh className="py-2.5 px-3">Stage</DnaTh>
                    <DnaTh className="py-2.5 px-3">Masuk</DnaTh>
                    <DnaTh className="py-2.5 px-3">Keluar</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-center">Durasi</DnaTh>
                    <DnaTh className="py-2.5 px-3">Catatan</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {logs.map((log, idx) => (
                    <DnaTableRow key={log.id} className="hover:bg-slate-50/80">
                      <DnaTd className="py-2 px-3 text-center tabular-nums text-slate-500">{idx + 1}</DnaTd>
                      <DnaTd className="py-2 px-3">
                        <DnaBadge variant={STAGE_VARIANT[log.stage] || "neutral"}>
                          {STAGE_LABEL[log.stage] || log.stage}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="py-2 px-3 tabular-nums text-slate-700">{formatDateTime(log.enteredAt)}</DnaTd>
                      <DnaTd className="py-2 px-3 tabular-nums text-slate-700">
                        {log.leftAt ? formatDateTime(log.leftAt) : <span className="text-blue-600 font-bold">Masih berjalan</span>}
                      </DnaTd>
                      <DnaTd className="py-2 px-3 text-center tabular-nums font-bold text-slate-800">
                        {log.durationDays != null ? `${log.durationDays} hari` : "—"}
                      </DnaTd>
                      <DnaTd className="py-2 px-3 text-[11px] text-slate-500 max-w-xs">
                        {log.notes || log.rejectionReason || "—"}
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
                <tfoot>
                  <DnaTableRow className="bg-slate-50 font-bold border-t border-slate-200">
                    <DnaTd colSpan={4} className="py-2.5 px-3 text-right text-slate-700">Akumulasi Durasi:</DnaTd>
                    <DnaTd className="py-2.5 px-3 text-center">
                      <span className="px-3 py-1 bg-blue-600 text-white rounded font-bold text-xs tabular-nums">
                        {totalDays.toFixed(1)} hari
                      </span>
                    </DnaTd>
                    <DnaTd />
                  </DnaTableRow>
                </tfoot>
              </DnaTable>
            </div>
          </>
        )}

        {timelineDetail?.formula && timelineDetail.formula.phases.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Fase Formula V{timelineDetail.formula.version}</span>
            </div>
            <div className="p-4 space-y-3">
              {timelineDetail.formula.phases.map((phase) => (
                <div key={phase.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700">
                    {phase.prefix} {phase.customName ? `— ${phase.customName}` : ""}
                  </div>
                  <DnaTable>
                    <DnaTableBody>
                      {phase.items.map((it) => (
                        <DnaTableRow key={it.id}>
                          <DnaTd className="py-1.5 px-3 text-[11.5px] text-slate-700">{it.materialName}</DnaTd>
                          <DnaTd className="py-1.5 px-3 text-right tabular-nums text-[11.5px] font-bold text-slate-800">
                            {Number(it.dosagePercentage).toFixed(3)}%
                          </DnaTd>
                        </DnaTableRow>
                      ))}
                    </DnaTableBody>
                  </DnaTable>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // MAIN VIEW
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen px-6 py-6">
      <DnaPageHeader
        title="CHECKLIST TRACKING PROJEK SLA"
        badge={<DnaBadge variant="info">SLA MONITORING</DnaBadge>}
        subtitle="Tracking stage sampel maklon dari R&D: stage berjalan, durasi per stage, pic R&D, dan target deadline sample request."
        breadcrumbItems={[
          { label: "Dashboard", href: "/executive/dashboard" },
          { label: "Umum & Kendali", href: "/samples/project-control/checklist-tracking" },
          { label: "Checklist Tracking" },
        ]}
        />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DnaStatCard
          label="Total Sample Request"
          value={counts.all}
          subtext="Seluruh sample request R&D terdaftar"
          variant="default"
        />
        <DnaStatCard
          label="On Track"
          value={counts.onTrack}
          subtext="Stage berjalan, belum lewat target deadline"
          variant="success"
        />
        <DnaStatCard
          label="Menunggu Approval"
          value={counts.pending}
          subtext="Stage WAITING_FINANCE / CLIENT_REVIEW"
          variant="warning"
        />
        <DnaStatCard
          label="Lewat Deadline / Ditolak"
          value={counts.overdue}
          subtext="targetDeadline lewat atau stage REJECTED/CANCELLED"
          variant="danger"
        />
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
          {[
            { key: "ALL" as const, label: `Semua (${counts.all})` },
            { key: "ON_TRACK" as const, label: `On Track (${counts.onTrack})` },
            { key: "PENDING_APPROVAL" as const, label: `Menunggu Approval (${counts.pending})` },
            { key: "OVERDUE" as const, label: `Lewat Deadline (${counts.overdue})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setTabFilter(tab.key);
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                tabFilter === tab.key
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Filter PIC:</span>
            <select
              value={picFilter}
              onChange={(e) => {
                setPicFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua PIC</option>
              {picOptions.map((pic) => (
                <option key={pic} value={pic}>
                  {pic}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setTabFilter("ALL");
              setPicFilter("ALL");
              setSearchQuery("");
              setPage(1);
            }}
            className="h-8 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <DnaDataTableCard
        title="MATRIKS CHECKLIST TRACKING PROJEK"
        count={filteredProjects.length}
        badge={<DnaBadge variant="neutral">TRACKING MATRIX</DnaBadge>}
        actions={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode sampel, klien, produk, PIC..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 w-64 placeholder:text-slate-400 font-medium"
            />
          </div>
        }
      >
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "w-10 text-center")}>#</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Kode Sampel & Klien</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Brand / Produk</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Kemasan Disarankan</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Sales PIC & R&D PIC</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Target Deadline</DnaTh>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status Projek</DnaTh>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center w-36")}>Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {paginatedProjects.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={8} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tidak ada sample request ditemukan</p>
                  <p className="text-xs text-slate-400">
                    {data.length === 0
                      ? "Belum ada sample request tercatat pada /rnd/samples."
                      : "Sesuaikan kata kunci pencarian atau filter PIC."}
                  </p>
                </DnaTd>
              </DnaTableRow>
            ) : (
              paginatedProjects.map((item, idx) => {
                const isExpanded = expandedRowIds.includes(item.id);

                return (
                  <React.Fragment key={item.id}>
                    <DnaTableRow className={cn(DNA_TABLE_CLASSES.tr, isExpanded && "bg-blue-50/40")}>
                      <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center tabular-nums text-slate-400 text-xs")}>
                        {(page - 1) * pageSize + idx + 1}
                      </DnaTd>

                      <DnaTd className={DNA_TABLE_CLASSES.td}>
                        <div>
                          <DnaCell.Code value={item.sampleCode} />
                          <p className="text-xs font-semibold text-slate-800 mt-0.5">{item.customer}</p>
                        </div>
                      </DnaTd>

                      <DnaTd className={DNA_TABLE_CLASSES.td}>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">
                            {item.brand}
                          </p>
                          <p className="text-[11.5px] text-slate-600 font-medium">{item.product}</p>
                        </div>
                      </DnaTd>

                      <DnaTd className={DNA_TABLE_CLASSES.td}>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{item.packagingType}</span>
                        </div>
                        <span className="text-[10.5px] text-slate-400">Tingkat kesulitan: {item.difficultyLevel}</span>
                      </DnaTd>

                      <DnaTd className={DNA_TABLE_CLASSES.td}>
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">{item.busdev}</p>
                          <p className="text-[11px] text-slate-500">R&D: {item.picPo}</p>
                        </div>
                      </DnaTd>

                      <DnaTd className={DNA_TABLE_CLASSES.td}>
                        <div className="text-xs">
                          <p className="font-bold text-slate-800 tabular-nums">{formatDate(item.targetDeadline)}</p>
                          <p className="text-[10.5px] text-slate-400 tabular-nums">Mulai: {item.requestedAt}</p>
                        </div>
                      </DnaTd>

                      <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                        <DnaBadge variant={STATUS_VARIANT[item.status]}>
                          {item.status.replace(/_/g, " ")}
                        </DnaBadge>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {STAGE_LABEL[item.stage] || item.stage}
                        </span>
                      </DnaTd>

                      <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleRowExpansion(item.id)}
                            className={cn(
                              "px-2 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border shadow-2xs",
                              isExpanded
                                ? "bg-slate-800 text-white border-slate-900"
                                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                            )}
                            title="Rincian data sample request"
                          >
                            <span>Detail</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewingTimelineId(item.id)}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Buka timeline stage sampel"
                          >
                            <span>Timeline</span>
                          </button>
                        </div>
                      </DnaTd>
                    </DnaTableRow>

                    {isExpanded && (
                      <DnaTableRow className="bg-slate-50/90 border-b border-blue-200">
                        <DnaTd colSpan={8} className="p-4 pl-12">
                          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                            <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-800">
                                Rincian Sample Request: {item.sampleCode} ({item.brand})
                              </span>
                              <DnaBadge variant={STAGE_VARIANT[item.stage] || "neutral"}>
                                {STAGE_LABEL[item.stage] || item.stage}
                              </DnaBadge>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-xs">
                              <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Fungsi Target :</span>
                                <span className="font-semibold text-slate-800">{item.product}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Tingkat Kesulitan :</span>
                                <span className="font-semibold text-slate-800 tabular-nums">{item.difficultyLevel}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Sales PIC :</span>
                                <span className="font-semibold text-slate-800">{item.busdev}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">R&D PIC :</span>
                                <span className="font-semibold text-slate-800">{item.picPo}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-2 md:col-span-2">
                                <span className="text-slate-500">Catatan Stage Terakhir :</span>
                                <span className="font-medium text-slate-700 text-right">
                                  {item.latestStageNotes || "—"}
                                </span>
                              </div>
                            </div>
                            <div className="px-4 pb-4">
                              <button
                                type="button"
                                onClick={() => setViewingTimelineId(item.id)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Calendar className="w-3 h-3" />
                                Buka riwayat stage lengkap
                              </button>
                            </div>
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>

        <DnaPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredProjects.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </DnaDataTableCard>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-900">
        <strong className="block mb-1">Catatan cakupan data</strong>
        Baris, KPI, dan timeline di halaman ini dibaca dari sample request R&D
        (<code className="font-mono">/rnd/samples</code> dan{" "}
        <code className="font-mono">/rnd/samples/:id</code> → <code className="font-mono">stageLogs</code>).
        Kolom &quot;Status Projek&quot; adalah turunan dari stage tersimpan + target deadline
        (bukan status tersimpan terpisah). Daftar 26 tahapan checklist maklon, chart Gantt
        jadwal, dan aksi ubah status milestone yang sebelumnya tampil sebagai contoh tidak
        memiliki penyimpanan di backend sehingga tidak lagi ditampilkan.
      </div>
    </div>
  );
}