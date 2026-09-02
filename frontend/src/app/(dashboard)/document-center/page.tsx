"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Pencil,
  Filter,
  Search,
  AlertTriangle,
  Timer,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { TableShell } from "@/components/layout/TableShell";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, DnaBadge, DnaButton, DnaInput } from "@/components/dna";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT: { color: "warning", label: "Draft" },
  REVIEWING: { color: "info", label: "Reviewing" },
  APPROVED: { color: "success", label: "Approved" },
  REJECTED: { color: "danger", label: "Rejected" },
  EXPIRED: { color: "default", label: "Expired" },
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
      toast.success("Draft berhasil diupdate.");
      queryClient.invalidateQueries({ queryKey: ["doc-automation-drafts"] });
      setIsEditOpen(false);
    },
  });

  const filtered = drafts.filter((d: any) => {
    const term = searchTerm.toLowerCase();
    return (
      d.draftNumber?.toLowerCase().includes(term) ||
      DOCUMENT_TYPE_LABELS[d.documentType]?.toLowerCase().includes(term) ||
      d.status?.toLowerCase().includes(term)
    );
  });

  const getTimeRemaining = (autoApproveAt: string) => {
    const now = new Date();
    const target = new Date(autoApproveAt);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}j ${minutes}m`;
  };

  return (
    <DashboardShell
      title="Document Center"
      subtitle="Auto-generated document drafts — review, edit, and approve"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total", value: stats?.total || 0, icon: FileText, color: "text-blue-400" },
          { label: "Draft", value: stats?.drafts || 0, icon: Clock, color: "text-amber-400" },
          { label: "Reviewing", value: stats?.reviewing || 0, icon: Eye, color: "text-cyan-400" },
          { label: "Approved", value: stats?.approved || 0, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Rejected", value: stats?.rejected || 0, icon: XCircle, color: "text-rose-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <DnaInput
            placeholder="Search drafts..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 text-white px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 text-white px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <TableShell title="Document" titleAccent="Center">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-white/60">Draft #</TableHead>
              <TableHead className="text-white/60">Type</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
              <TableHead className="text-white/60">Auto-Approve</TableHead>
              <TableHead className="text-white/60">Created</TableHead>
              <TableHead className="text-white/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-white/40 py-8">
                  {isLoading ? "Loading..." : "No document drafts found"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((draft: any) => {
                const cfg = STATUS_CONFIG[draft.status] || STATUS_CONFIG.DRAFT;
                return (
                  <TableRow key={draft.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white font-mono text-sm">
                      {draft.draftNumber}
                    </TableCell>
                    <TableCell className="text-white/80">
                      {DOCUMENT_TYPE_LABELS[draft.documentType] || draft.documentType}
                    </TableCell>
                    <TableCell>
                      <DnaBadge status={cfg.color as any}>{cfg.label}</DnaBadge>
                    </TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {draft.autoApproveAt ? (
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {getTimeRemaining(draft.autoApproveAt)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {new Date(draft.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DnaButton
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedDraft(draft);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </DnaButton>
                        {draft.status !== "APPROVED" && draft.status !== "REJECTED" && (
                          <>
                            <DnaButton
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedDraft(draft);
                                setEditPayload(draft.payload);
                                setIsEditOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </DnaButton>
                            <DnaButton
                              size="sm"
                              variant="primary"
                              onClick={() => approveMutation.mutate(draft.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </DnaButton>
                            <DnaButton
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setSelectedDraft(draft);
                                setIsRejectOpen(true);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </DnaButton>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableShell>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-gray-900 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {selectedDraft?.draftNumber}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {DOCUMENT_TYPE_LABELS[selectedDraft?.documentType]} — Auto-generated draft
            </DialogDescription>
          </DialogHeader>
          {selectedDraft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-white/40 uppercase">Status</span>
                  <div>
                    <DnaBadge
                      status={(STATUS_CONFIG[selectedDraft.status]?.color as any) || "default"}
                    >
                      {STATUS_CONFIG[selectedDraft.status]?.label || selectedDraft.status}
                    </DnaBadge>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-white/40 uppercase">Auto-Approve</span>
                  <div className="text-white text-sm">
                    {selectedDraft.autoApproveAt
                      ? new Date(selectedDraft.autoApproveAt).toLocaleString("id-ID")
                      : "N/A"}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-xs text-white/40 uppercase">Payload</span>
                <pre className="mt-1 p-3 rounded-lg bg-black/30 text-white/80 text-xs overflow-auto max-h-64">
                  {JSON.stringify(selectedDraft.payload, null, 2)}
                </pre>
              </div>
              {selectedDraft.originalPayload && (
                <div>
                  <span className="text-xs text-white/40 uppercase">Original (before edit)</span>
                  <pre className="mt-1 p-3 rounded-lg bg-black/30 text-white/60 text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedDraft.originalPayload, null, 2)}
                  </pre>
                </div>
              )}
              {selectedDraft.notes && (
                <div>
                  <span className="text-xs text-white/40 uppercase">Notes</span>
                  <div className="text-white text-sm mt-1">{selectedDraft.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DnaButton variant="ghost" onClick={() => setIsDetailOpen(false)}>
              Close
            </DnaButton>
            {selectedDraft?.status !== "APPROVED" && selectedDraft?.status !== "REJECTED" && (
              <DnaButton
                variant="primary"
                onClick={() => {
                  approveMutation.mutate(selectedDraft.id);
                }}
                disabled={approveMutation.isPending}
              >
                Approve & Execute
              </DnaButton>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-gray-900 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Draft</DialogTitle>
            <DialogDescription className="text-white/50">
              Modify the auto-generated document before approval
            </DialogDescription>
          </DialogHeader>
          <div>
            <textarea
              value={JSON.stringify(editPayload, null, 2)}
              onChange={(e) => {
                try {
                  setEditPayload(JSON.parse(e.target.value));
                } catch {}
              }}
              className="w-full h-64 p-3 rounded-lg bg-black/30 text-white/80 text-xs font-mono border border-white/10 focus:border-white/30 focus:outline-none"
            />
          </div>
          <DialogFooter>
            <DnaButton variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => {
                if (selectedDraft) {
                  updateMutation.mutate({
                    id: selectedDraft.id,
                    payload: editPayload,
                  });
                }
              }}
              disabled={updateMutation.isPending}
            >
              Save Changes
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Reject Draft
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason..."
            className="w-full h-24 p-3 rounded-lg bg-black/30 text-white/80 text-sm border border-white/10 focus:border-white/30 focus:outline-none"
          />
          <DialogFooter>
            <DnaButton variant="ghost" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </DnaButton>
            <DnaButton
              variant="danger"
              onClick={() => {
                if (selectedDraft && rejectReason) {
                  rejectMutation.mutate({
                    id: selectedDraft.id,
                    reason: rejectReason,
                  });
                }
              }}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              Reject
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
