"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Pencil,
  Search,
  AlertTriangle,
  Timer,
  Sparkles,
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

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  SALES_ORDER: "Sales Order",
  PURCHASE_ORDER: "Purchase Order",
  INVOICE: "Invoice",
  DELIVERY_ORDER: "Delivery Order",
  JOURNAL_ENTRY: "Jurnal",
  GOODS_REQUIREMENT: "Kebutuhan Barang",
  WORK_ORDER: "Work Order",
  PURCHASE_REQUEST: "Purchase Request",
};

const STATUS_CONFIG: Record<
  string,
  { tone: "warning" | "info" | "success" | "danger" | "neutral"; label: string }
> = {
  DRAFT: { tone: "warning", label: "Draft" },
  REVIEWING: { tone: "info", label: "Reviewing" },
  APPROVED: { tone: "success", label: "Approved" },
  REJECTED: { tone: "danger", label: "Rejected" },
  EXPIRED: { tone: "neutral", label: "Expired" },
};

export default function DocumentCenterPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPayload, setEditPayload] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ["doc-automation-drafts", filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.set("documentType", filterType);
      if (filterStatus) params.set("status", filterStatus);
      const resp = await api.get(`/document-automation/drafts?${params}`);
      return resp.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["doc-automation-stats"],
    queryFn: async () => (await api.get("/document-automation/drafts/stats")).data,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/document-automation/drafts/${id}/approve`, { notes: "Approved manually" }),
    onSuccess: () => {
      toast.success("Dokumen disetujui dan diproses!");
      queryClient.invalidateQueries({ queryKey: ["doc-automation-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["doc-automation-stats"] });
      setIsDetailOpen(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/document-automation/drafts/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Dokumen ditolak.");
      queryClient.invalidateQueries({ queryKey: ["doc-automation-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["doc-automation-stats"] });
      setIsRejectOpen(false);
      setRejectReason("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.patch(`/document-automation/drafts/${id}`, { payload }),
    onSuccess: () => {
      toast.success("Draft berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["doc-automation-drafts"] });
      setIsEditOpen(false);
    },
  });

  const filtered = useMemo(() => {
    return (drafts as any[]).filter((d: any) => {
      const term = searchTerm.toLowerCase();
      return (
        String(d.draftNumber ?? "").toLowerCase().includes(term) ||
        String(DOCUMENT_TYPE_LABELS[d.documentType] ?? "").toLowerCase().includes(term) ||
        String(d.status ?? "").toLowerCase().includes(term)
      );
    });
  }, [drafts, searchTerm]);

  const getTimeRemaining = (autoApproveAt: string) => {
    const target = new Date(autoApproveAt);
    const diff = target.getTime() - Date.now();
    if (Number.isNaN(target.getTime()) || diff <= 0) return "Kedaluwarsa";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}j ${minutes}m`;
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "draftNumber",
        header: "No. Draft",
        cell: ({ getValue }: { getValue: () => string }) => (
          <span className="font-mono text-[13px] text-slate-900">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "documentType",
        header: "Tipe",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const raw = getValue();
          if (raw == null || raw === "") {
            return <span className="text-[11px] text-slate-400">—</span>;
          }
          const value = String(raw);
          return (
            <span className="text-[13px] text-slate-700">
              {DOCUMENT_TYPE_LABELS[value] ?? value.replaceAll("_", " ")}
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
          const cfg = STATUS_CONFIG[value] ?? {
            tone: "neutral" as const,
            label: getOperationalStatusLabel(value),
          };
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
          if (!at) return <span className="text-[11px] text-slate-400">—</span>;
          return (
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <Timer className="h-3 w-3" />
              {getTimeRemaining(at)}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Dibuat",
        cell: ({ getValue }: { getValue: () => string }) => {
          const date = new Date(String(getValue() ?? ""));
          if (Number.isNaN(date.getTime())) return <span className="text-[11px] text-slate-400">—</span>;
          return <span className="text-[11px] text-slate-500">{date.toLocaleDateString("id-ID")}</span>;
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              className="operational-button is-secondary h-8 px-2"
              onClick={() => {
                setSelectedDraft(row.original);
                setIsDetailOpen(true);
              }}
              aria-label="Detail"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            {row.original.status !== "APPROVED" && row.original.status !== "REJECTED" && (
              <>
                <button
                  type="button"
                  className="operational-button is-secondary h-8 px-2"
                  onClick={() => {
                    setSelectedDraft(row.original);
                    setEditPayload(row.original.payload);
                    setIsEditOpen(true);
                  }}
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="operational-button h-8 px-2"
                  style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}
                  onClick={() => approveMutation.mutate(row.original.id)}
                  disabled={approveMutation.isPending}
                  aria-label="Setujui"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="operational-button is-danger h-8 px-2"
                  onClick={() => {
                    setSelectedDraft(row.original);
                    setIsRejectOpen(true);
                  }}
                  aria-label="Tolak"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approveMutation.isPending],
  );

  return (
    <OperationalPageShell
      title="Pusat Dokumen"
      subtitle="Draft dokumen otomatis — tinjau, edit, dan setujui"
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard label="Total" value={Number(stats?.total ?? 0)} icon={<FileText className="h-4 w-4" />} tone="blue" />
          <OperationalMetricCard label="Draft" value={Number(stats?.drafts ?? 0)} icon={<Clock className="h-4 w-4" />} tone="amber" />
          <OperationalMetricCard label="Reviewing" value={Number(stats?.reviewing ?? 0)} icon={<Eye className="h-4 w-4" />} tone="purple" />
          <OperationalMetricCard label="Disetujui" value={Number(stats?.approved ?? 0)} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
          <OperationalMetricCard label="Ditolak" value={Number(stats?.rejected ?? 0)} icon={<XCircle className="h-4 w-4" />} tone="red" />
        </OperationalMetricGrid>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-md border border-slate-200 bg-white p-3">
          <div className="operational-input-wrap flex-1">
            <span className="operational-input-icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Cari draft..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="operational-control h-9"
            aria-label="Filter tipe"
          >
            <option value="">Semua Tipe</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="operational-control h-9"
            aria-label="Filter status"
          >
            <option value="">Semua Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        <OperationalDataTable
          data={filtered as any[]}
          columns={columns as any}
          getRowId={(row: any) => row.id}
          loading={isLoading}
          searchPlaceholder="Cari nomor, tipe, atau status..."
          emptyMessage="Tidak ada draft dokumen ditemukan"
        />
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {selectedDraft?.draftNumber}
            </DialogTitle>
            <DialogDescription>
              {DOCUMENT_TYPE_LABELS[selectedDraft?.documentType ?? ""]} — Draft otomatis
            </DialogDescription>
          </DialogHeader>
          {selectedDraft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400">Status</span>
                  <div>
                    <span className={`operational-status-badge is-${STATUS_CONFIG[selectedDraft.status]?.tone ?? "neutral"}`}>
                      {STATUS_CONFIG[selectedDraft.status]?.label ?? selectedDraft.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400">Auto-Approve</span>
                  <div className="text-[13px] text-slate-700">
                    {selectedDraft.autoApproveAt
                      ? new Date(selectedDraft.autoApproveAt).toLocaleString("id-ID")
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Payload</span>
                <pre className="max-h-64 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-700">
                  {JSON.stringify(selectedDraft.payload, null, 2)}
                </pre>
              </div>
              {selectedDraft.originalPayload && (
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400">Original (sebelum edit)</span>
                  <pre className="max-h-48 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-500">
                    {JSON.stringify(selectedDraft.originalPayload, null, 2)}
                  </pre>
                </div>
              )}
              {selectedDraft.notes && (
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400">Catatan</span>
                  <div className="text-[13px] text-slate-700">{selectedDraft.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button type="button" className="operational-button is-secondary" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </button>
            {selectedDraft?.status !== "APPROVED" && selectedDraft?.status !== "REJECTED" && (
              <button
                type="button"
                className="operational-button is-primary"
                onClick={() => selectedDraft && approveMutation.mutate(selectedDraft.id)}
                disabled={approveMutation.isPending}
              >
                Setujui & Eksekusi
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Draft</DialogTitle>
            <DialogDescription>
              Ubah dokumen otomatis sebelum persetujuan.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={JSON.stringify(editPayload, null, 2)}
            onChange={(e) => {
              try {
                setEditPayload(JSON.parse(e.target.value));
              } catch {
                // ignore parse errors during typing
              }
            }}
            className="operational-textarea font-mono"
            rows={14}
          />
          <DialogFooter>
            <button type="button" className="operational-button is-secondary" onClick={() => setIsEditOpen(false)}>
              Batal
            </button>
            <button
              type="button"
              className="operational-button is-primary"
              onClick={() => {
                if (selectedDraft) {
                  updateMutation.mutate({ id: selectedDraft.id, payload: editPayload });
                }
              }}
              disabled={updateMutation.isPending}
            >
              Simpan Perubahan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Tolak Draft
            </DialogTitle>
            <DialogDescription>Berikan alasan penolakan.</DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Alasan penolakan..."
            className="operational-textarea"
          />
          <DialogFooter>
            <button type="button" className="operational-button is-secondary" onClick={() => setIsRejectOpen(false)}>
              Batal
            </button>
            <button
              type="button"
              className="operational-button is-danger"
              onClick={() => {
                if (selectedDraft && rejectReason) {
                  rejectMutation.mutate({ id: selectedDraft.id, reason: rejectReason });
                }
              }}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              Tolak
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
