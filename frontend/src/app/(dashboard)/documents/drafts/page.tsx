"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
  Download,
  ChevronRight,
  Loader2,
  Zap,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { DnaButton, DnaBadge, DnaInput, StatCard, TableWrapper } from "@/components/dna";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DocumentPdfButton } from "@/components/documents/DocumentPdfButton";
import { DocumentPreview } from "@/components/documents/DocumentPreview";

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  DRAFT: { color: "warning", label: "DRAFT", icon: Clock },
  REVIEWING: { color: "info", label: "REVIEWING", icon: AlertCircle },
  APPROVED: { color: "success", label: "APPROVED", icon: CheckCircle2 },
  REJECTED: { color: "critical", label: "REJECTED", icon: XCircle },
  CONVERTED: { color: "success", label: "CONVERTED", icon: CheckCircle2 },
  EXPIRED: { color: "default", label: "EXPIRED", icon: Clock },
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

  const { data: stats, isLoading: statsLoading } = useQuery({
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
      toast.success("Draft approved! Document generated.");
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
      toast.success("Draft rejected.");
      queryClient.invalidateQueries({ queryKey: ["document-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["document-draft-stats"] });
      setIsRejectModalOpen(false);
      setIsPreviewOpen(false);
      setRejectReason("");
    },
  });

  const filteredDrafts = drafts?.filter((d: any) =>
    d.draftNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <DashboardShell
      title="DOCUMENTS"
      titleAccent="DRAFT HUB"
      subtitle="Auto-generated document drafts awaiting review & approval"
      actions={
        <DnaButton
          variant="primary"
          icon={<Zap className="h-4 w-4" />}
          onClick={async () => {
            await api.post("/document-automation/process-auto-approvals");
            toast.success("Auto-approval check triggered");
            queryClient.invalidateQueries({ queryKey: ["document-drafts"] });
          }}
        >
          Process Auto-Approvals
        </DnaButton>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total Drafts"
          value={String(stats?.total || 0)}
          icon={<FileText className="text-blue-600" />}
        />
        <StatCard
          label="Pending Review"
          value={String(stats?.drafts || 0)}
          subValue={`${stats?.reviewing || 0} reviewing`}
          icon={<Clock className="text-amber-500" />}
        />
        <StatCard
          label="Approved"
          value={String(stats?.approved || 0)}
          icon={<CheckCircle2 className="text-emerald-500" />}
        />
        <StatCard
          label="Rejected"
          value={String(stats?.rejected || 0)}
          icon={<XCircle className="text-rose-500" />}
        />
        <StatCard
          label="Converted"
          value={String(stats?.converted || 0)}
          subValue="To final documents"
          icon={<ArrowUpRight className="text-purple-500" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <DnaInput
            icon={<Search className="h-4 w-4" />}
            placeholder="Search by document number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase appearance-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CONVERTED">Converted</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase appearance-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Drafts Table */}
      <TableWrapper>
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow>
              <TableHead className="py-3 pl-6 text-[10px] font-black text-slate-400 uppercase">
                Document
              </TableHead>
              <TableHead className="py-3 text-[10px] font-black text-slate-400 uppercase">
                Type
              </TableHead>
              <TableHead className="py-3 text-[10px] font-black text-slate-400 uppercase text-center">
                Status
              </TableHead>
              <TableHead className="py-3 text-[10px] font-black text-slate-400 uppercase">
                Auto-Approve
              </TableHead>
              <TableHead className="py-3 text-[10px] font-black text-slate-400 uppercase">
                Created
              </TableHead>
              <TableHead className="py-3 pr-6 text-[10px] font-black text-slate-400 uppercase text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrafts?.map((draft: any) => {
              const statusConfig = STATUS_CONFIG[draft.status] || STATUS_CONFIG.DRAFT;
              const StatusIcon = statusConfig.icon;
              const payload = draft.payload as Record<string, any>;
              const subtotal = (payload.items || []).reduce(
                (sum: number, item: any) =>
                  sum + (item.subtotal || (item.quantity || 0) * (item.unitPrice || 0) || 0),
                0
              );

              return (
                <TableRow
                  key={draft.id}
                  className="group hover:bg-blue-50/30 cursor-pointer transition-all"
                  onClick={() => {
                    setSelectedDraft(draft);
                    setIsPreviewOpen(true);
                  }}
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm uppercase">
                          {draft.draftNumber}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {payload.clientName || payload.description || payload.orderNumber || "-"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-lg border border-slate-200 text-slate-600 font-bold uppercase text-[9px] px-2 py-1">
                      {TYPE_LABELS[draft.documentType] || draft.documentType}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <DnaBadge status={statusConfig.color as any}>
                      <StatusIcon className="h-3 w-3 inline mr-1" />
                      {statusConfig.label}
                    </DnaBadge>
                  </TableCell>
                  <TableCell>
                    {draft.autoApproveAt ? (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        {new Date(draft.autoApproveAt) > new Date()
                          ? `In ${Math.round(
                              (new Date(draft.autoApproveAt).getTime() - Date.now()) /
                                (1000 * 60 * 60)
                            )}h`
                          : "Expired"}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300">Manual</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] text-slate-400">
                      {new Date(draft.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div
                      className="flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DocumentPdfButton draftId={draft.id} draftNumber={draft.draftNumber} />
                      {draft.status === "DRAFT" && (
                        <>
                          <DnaButton
                            variant="primary"
                            size="sm"
                            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            onClick={() => approveMutation.mutate(draft.id)}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </DnaButton>
                          <DnaButton
                            variant="outline"
                            size="sm"
                            icon={<XCircle className="h-3.5 w-3.5" />}
                            onClick={() => {
                              setSelectedDraft(draft);
                              setIsRejectModalOpen(true);
                            }}
                          >
                            Reject
                          </DnaButton>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredDrafts?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="italic">No document drafts found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Document Preview
            </DialogTitle>
          </DialogHeader>
          {selectedDraft && <DocumentPreview draft={selectedDraft} />}
          <DialogFooter className="flex gap-2">
            {selectedDraft?.status === "DRAFT" && (
              <>
                <DnaButton
                  variant="outline"
                  onClick={() => {
                    setIsRejectModalOpen(true);
                  }}
                  icon={<XCircle className="h-4 w-4" />}
                >
                  Reject
                </DnaButton>
                <DnaButton
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => approveMutation.mutate(selectedDraft.id)}
                  disabled={approveMutation.isPending}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  {approveMutation.isPending ? "Approving..." : "Approve & Generate"}
                </DnaButton>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Rejecting <strong>{selectedDraft?.draftNumber}</strong>. Please provide a reason:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </DnaButton>
            <DnaButton
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast.error("Please provide a reason");
                  return;
                }
                rejectMutation.mutate({
                  draftId: selectedDraft.id,
                  reason: rejectReason,
                });
              }}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Draft"}
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
