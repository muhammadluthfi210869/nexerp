"use client";
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  OperationalButton,
  OperationalField,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
} from "@/components/operational";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { formatOperationalDate } from "@/lib/operational-formatters";
import Link from "next/link";
import {
  FileBadge,
  FlaskConical,
  History,
  Calendar,
  ShieldAlert,
  Plus,
  ArrowRightCircle,
  Loader2,
  MessageSquare,
  Activity,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DnaBadge, DnaButton, TableWrapper } from "@/components/dna";

const DASH = "—";
const DASH_DAYS = "—";
const DASH_DATE = "—";

const STAGE_LABELS: Record<string, string> = {
  PUBLISHED: "Dipublikasikan",
  EVALUATION: "Evaluasi",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  PENDING: "Menunggu Persetujuan",
  DRAFT: "Draf",
  IN_PROGRESS: "Dalam Proses",
  DONE: "Selesai",
};

/**
 * Presentation-only mapping for legality record stages. The underlying
 * enum value is never changed.
 */
function stageLabel(s?: string | null): string {
  if (!s) return DASH;
  return STAGE_LABELS[s] ?? s;
}

/**
 * Safely read a finite day-count value. Returns "—" for null / undefined /
 * non-finite / negative values. Backend calculations remain unchanged; this
 * is presentation-only guarding against invalid prototype data.
 */
function safeDayCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Safely read a calendar year from an application date string. Returns null
 * when the value is missing, invalid, or NaN.
 */
function safeYear(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

/**
 * Safely read a name string. Returns "—" for null / undefined / non-string.
 */
function safeName(value: unknown): string {
  if (typeof value !== "string") return DASH;
  const trimmed = value.trim();
  return trimmed === "" ? DASH : trimmed;
}

/**
 * Safely read a short initials (2-char) from a name. Returns "—" when the
 * name is missing or non-string.
 */
function safeInitials(value: unknown): string {
  if (typeof value !== "string") return DASH;
  const trimmed = value.trim();
  if (trimmed === "") return DASH;
  return trimmed.substring(0, 2).toUpperCase();
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Dibuat",
  STAGE_UPDATED: "Tahap Diperbarui",
  NOTE_ADDED: "Catatan Ditambahkan",
};

/**
 * Presentation-only mapping for timeline log.action enum. The underlying
 * action value is never changed.
 */
function actionLabel(a?: string | null): string {
  if (!a) return "—";
  return ACTION_LABELS[a] ?? a;
}

/**
 * Safely format a date. Returns "—" for null / undefined / invalid / NaN.
 * Backend calculations remain unchanged; this is presentation-only.
 */
function safeDate(value: unknown, options?: Intl.DateTimeFormatOptions): string {
  if (value === null || value === undefined || value === "") return DASH_DATE;
  const formatted = formatOperationalDate(value, options);
  if (formatted === "—" || formatted === "Invalid Date") return DASH_DATE;
  return formatted;
}

export default function LegalityRecords() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("hki");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: hkiData, isLoading: loadingHki } = useQuery({
    queryKey: ["hki-records"],
    queryFn: async () => {
      const resp = await api.get("/legality/hki");
      return resp.data;
    },
  });

  const { data: bpomData, isLoading: loadingBpom } = useQuery({
    queryKey: ["bpom-records"],
    queryFn: async () => {
      const resp = await api.get("/legality/bpom");
      return resp.data;
    },
  });

  const { data: halalData, isLoading: loadingHalal } = useQuery({
    queryKey: ["halal-records"],
    queryFn: async () => {
      const resp = await api.get("/legality/halal");
      return resp.data;
    },
  });

  const advanceHkiMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/legality/hki/${id}/advance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      toast.success("Tahap HKI berhasil dimajukan");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memajukan tahap HKI");
    },
  });

  const advanceBpomMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/legality/bpom/${id}/advance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      toast.success("Tahap BPOM berhasil dimajukan");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memajukan tahap BPOM");
    },
  });

  const advanceHalalMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/legality/halal/${id}/advance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      toast.success("Tahap Halal berhasil dimajukan");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memajukan tahap Halal");
    },
  });

  return (
    <OperationalPageShell
      title="Registry Audit"
      subtitle="Repositori kepatuhan untuk HKI, BPOM, dan Halal"
      actions={
        <Link href="/legality/input">
          <OperationalButton variant="primary">
            <Plus className="h-4 w-4" /> Tambah Record
          </OperationalButton>
        </Link>
      }
    >
      <OperationalTabs value={activeTab} onValueChange={setActiveTab}>
        <OperationalTabsList>
          <OperationalTabsTrigger value="hki">HKI Branding</OperationalTabsTrigger>
          <OperationalTabsTrigger value="bpom">BPOM Product</OperationalTabsTrigger>
          <OperationalTabsTrigger value="halal">Halal Cert</OperationalTabsTrigger>
        </OperationalTabsList>

        <OperationalTabsContent value="hki" className="mt-3">
          <ComplianceGrid
            data={hkiData}
            type="HKI"
            isLoading={loadingHki}
            onAdvance={(id: string) => advanceHkiMutation.mutate(id)}
            isAdvancing={advanceHkiMutation.isPending}
            onViewTimeline={(r: any) => setSelectedRecord({ ...r, recordType: "HKI" })}
          />
        </OperationalTabsContent>

        <OperationalTabsContent value="bpom" className="mt-3">
          <ComplianceGrid
            data={bpomData}
            type="BPOM"
            isLoading={loadingBpom}
            onAdvance={(id: string) => advanceBpomMutation.mutate(id)}
            isAdvancing={advanceBpomMutation.isPending}
            onViewTimeline={(r: any) => setSelectedRecord({ ...r, recordType: "BPOM" })}
          />
        </OperationalTabsContent>

        <OperationalTabsContent value="halal" className="mt-3">
          <ComplianceGrid
            data={halalData}
            type="HALAL"
            isLoading={loadingHalal}
            onAdvance={(id: string) => advanceHalalMutation.mutate(id)}
            isAdvancing={advanceHalalMutation.isPending}
            onViewTimeline={(r: any) => setSelectedRecord({ ...r, recordType: "HALAL" })}
          />
        </OperationalTabsContent>
      </OperationalTabs>

      {selectedRecord && (
        <TimelineDialog
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </OperationalPageShell>
  );
}

function ComplianceGrid({ data, type, isLoading, onAdvance, isAdvancing, onViewTimeline }: any) {
  if (isLoading) {
    return (
      <OperationalPanel>
        <div className="py-12 text-center text-[12px] text-slate-500">Memuat data...</div>
      </OperationalPanel>
    );
  }

  return (
    <OperationalPanel>
      <TableWrapper>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-2 text-[12px] font-semibold normal-case text-slate-500">Info Aplikasi</th>
              <th className="px-3 py-2 text-[12px] font-semibold normal-case text-slate-500">Status Pipeline</th>
              <th className="px-3 py-2 text-[12px] font-semibold normal-case text-slate-500">Kepemilikan</th>
              <th className="px-3 py-2 text-right text-[12px] font-semibold normal-case text-slate-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.map((record: any) => {
              const elapsed = safeDayCount(record.daysElapsed);
              const left = safeDayCount(record.daysLeft);
              const year = safeYear(record.applicationDate);
              const isDone = record.status === "DONE";
              return (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-[9px] font-semibold leading-none">{year ?? DASH}</span>
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] font-medium text-indigo-600">{record.hkiId || record.bpomId || record.halalId || DASH}</p>
                      <h4 className="text-[13px] font-semibold text-slate-900">{safeName(record.brandName || record.productName || record.manufacturer)}</h4>
                      <p className="mt-0.5 text-[11px] text-slate-500">{safeName(record.type || record.category)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <OperationalStatusBadge
                        status={
                          record.status === "DONE" ? "success" :
                          record.status === "IN_PROGRESS" ? "process" :
                          "pending"
                        }
                      >
                        {stageLabel(record.status)}
                      </OperationalStatusBadge>
                      <ArrowRightCircle className="h-4 w-4 text-slate-300" />
                      <p className="text-[12px] font-semibold text-slate-600">{stageLabel(record.stage)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] font-medium text-slate-500">Hari Berlalu</p>
                        <p className="mt-1 text-[12px] font-semibold text-slate-700 tabular-nums">{elapsed === null ? DASH_DAYS : `${elapsed}d`}</p>
                      </div>
                      {left !== null && (
                        <div>
                          <p className="text-[10px] font-medium text-slate-500">Sisa Hari</p>
                          <p className={`mt-1 text-[12px] font-semibold tabular-nums ${left <= 90 ? "text-amber-600" : "text-slate-700"}`}>{`${left}d`}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-[10px] font-medium text-slate-500">Klien</p>
                      <p className="mt-1 text-[12px] font-semibold text-slate-700">{safeName(record.clientName)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="grid h-5 w-5 place-items-center rounded-full bg-slate-700 text-[9px] font-semibold text-white">
                        {safeInitials(record.pic?.name)}
                      </div>
                      <p className="text-[11px] font-medium text-slate-500">PIC: {safeName(record.pic?.name)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <DnaButton variant="outline" size="sm" onClick={() => onViewTimeline(record)} icon={<History className="h-4 w-4" />} />
                    {!isDone ? (
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onAdvance(record.id)}
                        disabled={isAdvancing}
                        icon={isAdvancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightCircle className="h-3.5 w-3.5" />}
                      >
                        Maju
                      </DnaButton>
                    ) : (
                      <DnaBadge status="success">
                        <ShieldAlert className="h-3.5 w-3.5" /> Aman
                      </DnaBadge>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
            {data?.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <ShieldAlert className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-[13px] font-semibold text-slate-500">Repositori kosong</p>
                    <p className="mt-1 text-[11px] text-slate-500">Tidak ada record {type} ditemukan dalam log audit.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableWrapper>
    </OperationalPanel>
  );
}

function TimelineDialog({ record, onClose }: { record: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["record-logs", record.id],
    queryFn: async () => {
      const resp = await api.get(`/legality/${record.id}/logs`);
      return resp.data;
    },
  });

  const logMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/legality/log", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["record-logs", record.id] });
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      setNote("");
      toast.success("Log progres berhasil disinkronkan");
    },
  });

  const handleAddLog = () => {
    if (!note) return;
    logMutation.mutate({
      recordId: record.id,
      recordType: record.recordType,
      action: "NOTE_ADDED",
      newStage: record.stage,
      notes: note,
      staffName: "Legal Officer",
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-100 bg-slate-50 p-4">
          <div className="mb-1 flex items-center gap-2 text-slate-500">
            <Activity className="h-4 w-4" />
            <span className="text-[10px] font-medium">Auditory Timeline</span>
          </div>
          <DialogTitle className="text-[16px] font-semibold text-slate-900">
            {safeName(record.brandName || record.productName || record.manufacturer)}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[11px] text-slate-500">
            Telusuri siklus hidup lengkap dari record kepatuhan ini.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[500px] flex-col gap-4 p-4">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-[11px] text-slate-400">Menganalisis timeline...</div>
            ) : (
              logs?.map((log: any, idx: number) => (
                <div key={log.id} className="relative flex gap-3">
                  {idx !== logs.length - 1 && (
                    <div className="absolute left-[9px] top-5 bottom-[-24px] w-px bg-slate-100" />
                  )}
                  <div className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-white ${
                    log.action === "CREATED" ? "bg-blue-500" :
                    log.action === "STAGE_UPDATED" ? "bg-amber-500" :
                    "bg-slate-700"
                  }`}>
                    {log.action === "CREATED" ? <Plus className="h-3 w-3 text-white" /> :
                     log.action === "STAGE_UPDATED" ? <ArrowRightCircle className="h-3 w-3 text-white" /> :
                     <MessageSquare className="h-3 w-3 text-white" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-500">{safeDate(log.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                      <DnaBadge status="default">{actionLabel(log.action)}</DnaBadge>
                    </div>
                    <p className="text-[12px] font-semibold text-slate-800">
                      {log.action === "STAGE_UPDATED"
                        ? `${getOperationalStatusLabel(log.previousStage) || DASH} → ${getOperationalStatusLabel(log.newStage) || DASH}`
                        : actionLabel(log.action)}
                    </p>
                    {log.notes && <p className="rounded-md border border-slate-100 bg-slate-50 p-2 text-[12px] italic leading-relaxed text-slate-600">{log.notes}</p>}
                    <p className="text-[10px] text-slate-500">Oleh {safeName(log.staffName)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-3">
            <OperationalField label="Tambah Catatan Audit">
              <Textarea
                placeholder="Catat pembaruan kepatuhan penting..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="rounded-md border border-slate-200 bg-white text-[12px] font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </OperationalField>
            <DnaButton
              onClick={handleAddLog}
              disabled={!note || logMutation.isPending}
              variant="secondary"
              className="w-full"
              icon={logMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightCircle className="h-4 w-4" />}
            >
              Tambahkan ke Timeline
            </DnaButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
