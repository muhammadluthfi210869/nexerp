"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Zap,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  getOperationalStatusLabel,
} from "@/components/operational";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentPdfButton } from "@/components/documents/DocumentPdfButton";
import { DocumentPreview } from "@/components/documents/DocumentPreview";

const STATUS_CONFIG: Record<string, { color: string; label: string; tone: "warning" | "info" | "success" | "danger" | "neutral" }> = {
  DRAFT: { color: "warning", label: "Draft", tone: "warning" },
  REVIEWING: { color: "info", label: "Reviewing", tone: "info" },
  APPROVED: { color: "success", label: "Approved", tone: "success" },
  REJECTED: { color: "critical", label: "Rejected", tone: "danger" },
  CONVERTED: { color: "success", label: "Converted", tone: "success" },
  EXPIRED: { color: "default", label: "Expired", tone: "neutral" },
};

const TYPE_LABELS: Record<string, string> = {
  QUOTATION: "Quotation",
  INVOICE_DP: "Invoice DP",
  INVOICE_FINAL: "Invoice Pelunasan",
  DELIVERY_ORDER: "Delivery Order",
  SURAT_JALAN: "Surat Jalan",
  PURCHASE_REQUEST: "Purchase Request",
  GOODS_REQUIREMENT: "Goods Requirement",
  JOURNAL_ENTRY: "Jurnal Entry",
};

export default function DocumentDraftsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["document-draft-stats"],
    queryFn: async () => (await api.get("/document-automation/drafts/stats")).data,
  });

  const { data: drafts, isLoading } = useQuery({
    queryKey: ["document-drafts", filterStatus, filterType],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.documentType = filterType;
      return (await api.get("/document-automation/drafts", { params })).data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (draftId: string) => {
      await api.post(`/document-automation/drafts/${draftId}/approve`, {});
    },
    onSuccess: () => {
      toast.success("Draft berhasil disetujui. Dokumen dihasilkan.");
      queryClient.invalidateQueries({ queryKey: ["document-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["document-draft-stats"] });
      setIsPreviewOpen(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ draftId, reason }: { draftId: string; reason: string }) => {
      await api.post(`/document-automation/drafts/${draftId}/reject`, { reason });
    },
    onSuccess: () => {
      toast.success("Draft berhasil ditolak.");
      queryClient.invalidateQueries({ queryKey: ["document-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["document-draft-stats"] });
      setIsRejectModalOpen(false);
      setIsPreviewOpen(false);
      setRejectReason("");
    },
  });

  const filteredDrafts = useMemo(() => {
    if (!drafts) return [];
    return drafts.filter((d: any) =>
      String(d.draftNumber ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [drafts, searchQuery]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "draftNumber",
        header: "Dokumen",
        cell: ({ row }: { row: { original: any } }) => {
          const payload = row.original.payload ?? {};
          return (
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-slate-900">{row.original.draftNumber}</p>
                <p className="truncate text-[11px] text-slate-500 max-w-[200px]">
                  {payload.clientName ?? payload.description ?? payload.orderNumber ?? "—"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "documentType",
        header: "Tipe",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const raw = getValue();
          const value = raw == null || raw === "" ? null : String(raw);
          if (!value) {
            return (
              <span className="text-[11px] text-slate-400">—</span>
            );
          }
          return (
            <span className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              {TYPE_LABELS[value] ?? value.replaceAll("_", " ")}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const value = getValue() == null ? "" : String(getValue());
          if (!value) {
            return (
              <div className="flex justify-center">
                <span className="operational-status-badge is-neutral">—</span>
              </div>
            );
          }
          const cfg = STATUS_CONFIG[value] ?? { tone: "neutral" as const, label: getOperationalStatusLabel(value) };
          return (
            <div className="flex justify-center">
              <span className={`operational-status-badge is-${cfg.tone}`}>{cfg.label}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "autoApproveAt",
        header: "Auto-Approve",
        cell: ({ row }: { row: { original: any } }) => {
          const at = row.original.autoApproveAt;
          if (!at) return <span className="text-[11px] text-slate-400">Manual</span>;
          const target = new Date(at);
          if (Number.isNaN(target.getTime())) return <span className="text-[11px] text-slate-400">—</span>;
          const diff = target.getTime() - Date.now();
          if (diff <= 0) return <span className="text-[11px] text-slate-400">Kedaluwarsa</span>;
          const hours = Math.round(diff / (1000 * 60 * 60));
          return (
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <Clock className="h-3 w-3" />
              <span>Dalam {hours}j</span>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Dibuat",
        cell: ({ row }: { row: { original: any } }) => {
          const raw = row.original.createdAt;
          if (!raw) return <span className="text-[11px] text-slate-400">—</span>;
          const date = new Date(String(raw));
          if (Number.isNaN(date.getTime())) return <span className="text-[11px] text-slate-400">—</span>;
          return <span className="text-[11px] text-slate-500">{date.toLocaleDateString("id-ID")}</span>;
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <DocumentPdfButton draftId={row.original.id} draftNumber={row.original.draftNumber} />
            {row.original.status === "DRAFT" && (
              <>
                <button
                  type="button"
                  className="operational-button h-8 px-3 text-[11px]"
                  style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}
                  onClick={() => approveMutation.mutate(row.original.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Setujui</span>
                </button>
                <button
                  type="button"
                  className="operational-button is-danger h-8 px-3 text-[11px]"
                  onClick={() => {
                    setSelectedDraft(row.original);
                    setIsRejectModalOpen(true);
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Tolak</span>
                </button>
              </>
            )}
            <button
              type="button"
              className="operational-button is-secondary h-8 px-3 text-[11px]"
              onClick={() => {
                setSelectedDraft(row.original);
                setIsPreviewOpen(true);
              }}
              aria-label="Pratinjau"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approveMutation.isPending],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <OperationalPageShell
      title="Draft Dokumen"
      subtitle="Draft dokumen otomatis menunggu tinjauan & persetujuan"
      actions={
        <button
          type="button"
          className="operational-button is-primary"
          onClick={async () => {
            await api.post("/document-automation/process-auto-approvals");
            toast.success("Pemeriksaan auto-approval dipicu");
            queryClient.invalidateQueries({ queryKey: ["document-drafts"] });
          }}
        >
          <Zap className="h-4 w-4" />
          <span>Proses Auto-Approval</span>
        </button>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total Draft"
            value={String(Number(stats?.total ?? 0))}
            icon={<FileText className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Menunggu Review"
            value={String(Number(stats?.drafts ?? 0))}
            helper={`${Number(stats?.reviewing ?? 0)} sedang ditinjau`}
            icon={<Clock className="h-4 w-4" />}
            tone="amber"
          />
          <OperationalMetricCard
            label="Disetujui"
            value={String(Number(stats?.approved ?? 0))}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="green"
          />
          <OperationalMetricCard
            label="Ditolak"
            value={String(Number(stats?.rejected ?? 0))}
            icon={<XCircle className="h-4 w-4" />}
            tone="red"
          />
          <OperationalMetricCard
            label="Terkonversi"
            value={String(Number(stats?.converted ?? 0))}
            helper="Menjadi dokumen final"
            icon={<ArrowUpRight className="h-4 w-4" />}
            tone="purple"
          />
        </OperationalMetricGrid>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-md border border-slate-200 bg-white p-3">
          <div className="operational-input-wrap flex-1">
            <span className="operational-input-icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Cari nomor dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="operational-control h-9"
            aria-label="Filter status"
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CONVERTED">Converted</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="operational-control h-9"
            aria-label="Filter tipe"
          >
            <option value="">Semua Tipe</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <OperationalDataTable
          data={filteredDrafts as any[]}
          columns={columns as any}
          getRowId={(row: any) => row.id}
          searchPlaceholder="Cari nomor dokumen di tabel..."
          emptyMessage="Tidak ada draft dokumen ditemukan"
        />
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Pratinjau Dokumen
            </DialogTitle>
            <DialogDescription>Tinjau detail dokumen sebelum menyetujui.</DialogDescription>
          </DialogHeader>
          {selectedDraft && <DocumentPreview draft={selectedDraft} />}
          {selectedDraft?.status === "DRAFT" && (
            <DialogFooter className="flex gap-2">
              <button
                type="button"
                className="operational-button is-secondary"
                onClick={() => {
                  setIsRejectModalOpen(true);
                }}
              >
                <XCircle className="h-4 w-4" />
                <span>Tolak</span>
              </button>
              <button
                type="button"
                className="operational-button"
                style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}
                onClick={() => selectedDraft && approveMutation.mutate(selectedDraft.id)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{approveMutation.isPending ? "Menyetujui..." : "Setujui & Hasilkan"}</span>
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Draft</DialogTitle>
            <DialogDescription>
              Menolak <strong>{selectedDraft?.draftNumber}</strong>. Berikan alasan penolakan:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan..."
              className="operational-textarea"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              className="operational-button is-secondary"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="button"
              className="operational-button is-danger"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast.error("Berikan alasan penolakan");
                  return;
                }
                rejectMutation.mutate({
                  draftId: selectedDraft?.id,
                  reason: rejectReason,
                });
              }}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? "Menolak..." : "Tolak Draft"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
