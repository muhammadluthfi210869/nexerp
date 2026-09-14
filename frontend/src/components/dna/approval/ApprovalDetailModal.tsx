"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  Package,
} from "lucide-react";
import {
  DnaModal,
  DnaBadge,
  DnaButton,
  DnaAuditTimeline,
  DnaTable,
  DnaTableHead,
  DNA_TABLE_CLASSES,
  DnaTextarea,
  DnaConfirmDialog,
} from "@/components/dna";
import { cn, formatRupiah } from "@/lib/utils";

export interface ApprovalLineItem {
  id?: string;
  itemCode?: string;
  itemName: string;
  qty: number;
  unit?: string;
  unitPrice?: number;
  discount?: number;
  tax?: number;
  total?: number;
  notes?: string;
  extraInfo?: Record<string, any>;
}

export interface ApprovalTimelineEntry {
  id: string;
  action: string;
  actor: string;
  role?: string;
  timestamp: string;
  status: "completed" | "current" | "pending" | "failed";
  notes?: string;
}

export interface ApprovalDetailData {
  id: string;
  code: string;
  title: string;
  category: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  date: string;
  dueDate?: string;
  creatorName: string;
  creatorRole?: string;
  requesterName?: string;
  partnerName?: string; // Supplier, Customer, Warehouse
  partnerLabel?: string;
  warehouseName?: string;
  totalAmount?: number;
  notes?: string;
  lineItems?: ApprovalLineItem[];
  timeline?: ApprovalTimelineEntry[];
  rawMeta?: Record<string, any>;
}

export interface ApprovalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ApprovalDetailData | null;
  onApprove?: (id: string, notes?: string) => Promise<void> | void;
  onReject?: (id: string, reason: string) => Promise<void> | void;
  isActionLoading?: boolean;
}

export function ApprovalDetailModal({
  isOpen,
  onClose,
  data,
  onApprove,
  onReject,
  isActionLoading = false,
}: ApprovalDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "timeline">("detail");
  const [isConfirmApproveOpen, setIsConfirmApproveOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  if (!data) return null;

  const handleOpenReject = () => {
    setRejectReason("");
    setRejectError("");
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Alasan penolakan wajib diisi.");
      return;
    }
    if (onReject) {
      await onReject(data.id, rejectReason.trim());
    }
    setIsRejectDialogOpen(false);
  };

  const handleConfirmApprove = async () => {
    if (onApprove) {
      await onApprove(data.id);
    }
    setIsConfirmApproveOpen(false);
  };

  const isPending = data.status === "PENDING" || data.status === "MENUNGGU_APPROVAL";

  return (
    <>
      <DnaModal
        isOpen={isOpen}
        onClose={onClose}
        title={`DETAIL PERSETUJUAN: ${data.code}`}
        subtitle={`${data.category} • Dibuat oleh ${data.creatorName} pada ${data.date}`}
        size="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <DnaBadge
                status={
                  data.status === "APPROVED"
                    ? "success"
                    : data.status === "REJECTED"
                    ? "danger"
                    : "warning"
                }
              >
                {data.status}
              </DnaBadge>
              <span className="text-[11px] text-slate-500">
                Mode Tinjauan (Read-Only)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <DnaButton variant="ghost" onClick={onClose} disabled={isActionLoading}>
                Tutup
              </DnaButton>

              {isPending && (
                <>
                  <DnaButton
                    variant="danger"
                    onClick={handleOpenReject}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak Dokumen
                  </DnaButton>

                  <DnaButton
                    variant="primary"
                    onClick={() => setIsConfirmApproveOpen(true)}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Setujui Dokumen
                  </DnaButton>
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Sub Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("detail")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer border-none",
                activeTab === "detail"
                  ? "bg-blue-50 text-blue-700 shadow-2xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              Rincian Informasi & Item
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer border-none flex items-center gap-1.5",
                activeTab === "timeline"
                  ? "bg-blue-50 text-blue-700 shadow-2xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Riwayat Persetujuan</span>
            </button>
          </div>

          {activeTab === "detail" ? (
            <div className="space-y-4">
              {/* Header Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    {data.partnerLabel || "Pihak Terkait"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 truncate">
                      {data.partnerName || "—"}
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Pemohon / Pembuat
                  </span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 truncate">
                      {data.requesterName || data.creatorName || "—"}
                    </span>
                  </div>
                </div>

                {data.totalAmount !== undefined && (
                  <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/30">
                    <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider block mb-1">
                      Total Nilai Pengajuan
                    </span>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-[14px] font-black text-slate-900 tabular-nums">
                        {formatRupiah(data.totalAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Catatan Khusus Pengajuan jika ada */}
              {data.notes && (
                <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3 text-[12px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Catatan Pengaju:</span>
                    <p className="mt-0.5 text-amber-800">{data.notes}</p>
                  </div>
                </div>
              )}

              {/* Rincian Line Items */}
              {data.lineItems && data.lineItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-slate-500" />
                      Rincian Barang / Komponen ({data.lineItems.length} Item)
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                        <tr>
                          <th className="px-3 py-2 text-center w-10">#</th>
                          <th className="px-3 py-2">Nama Barang / Spesifikasi</th>
                          <th className="px-3 py-2 text-right">Kuantitas</th>
                          {data.lineItems[0].unitPrice !== undefined && (
                            <th className="px-3 py-2 text-right">Harga Satuan</th>
                          )}
                          {data.lineItems[0].total !== undefined && (
                            <th className="px-3 py-2 text-right">Subtotal</th>
                          )}
                          {data.lineItems[0].notes && (
                            <th className="px-3 py-2">Catatan</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.lineItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-semibold text-slate-800">
                                {item.itemName}
                              </div>
                              {item.itemCode && (
                                <span className="font-mono text-[10.5px] text-slate-400">
                                  {item.itemCode}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-slate-700 tabular-nums">
                              {item.qty.toLocaleString("id-ID")} {item.unit || ""}
                            </td>
                            {item.unitPrice !== undefined && (
                              <td className="px-3 py-2 text-right font-mono text-slate-700 tabular-nums">
                                {formatRupiah(item.unitPrice)}
                              </td>
                            )}
                            {item.total !== undefined && (
                              <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono tabular-nums">
                                {formatRupiah(item.total)}
                              </td>
                            )}
                            {item.notes && (
                              <td className="px-3 py-2 text-slate-500 text-[11px]">
                                {item.notes}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Riwayat Timeline */
            <div className="py-2">
              <DnaAuditTimeline
                events={
                  data.timeline && data.timeline.length > 0
                    ? data.timeline.map((t) => ({
                        id: t.id,
                        action: t.action,
                        actor: t.actor,
                        timestamp: t.timestamp,
                        note: t.notes,
                        badge: t.role,
                      }))
                    : [
                        {
                          id: "t-1",
                          action: "Dokumen Dibuat & Diajukan",
                          actor: data.creatorName,
                          badge: data.creatorRole || "Staff",
                          timestamp: data.date,
                          note: "Pengajuan masuk ke antrean persetujuan.",
                        },
                        {
                          id: "t-2",
                          action: "Verifikasi Kelayakan & Anggaran",
                          actor: "Sistem Otomasi",
                          badge: "System Check",
                          timestamp: data.date,
                          note: "Pengecekan limit otorisasi selesai.",
                        },
                        {
                          id: "t-3",
                          action:
                            data.status === "APPROVED"
                              ? "Disetujui oleh Direksi / Otorisator"
                              : data.status === "REJECTED"
                              ? "Ditolak oleh Otorisator"
                              : "Menunggu Persetujuan Final",
                          actor: "Otorisator Berwenang",
                          badge: "Direktur / Kepala Divisi",
                          timestamp: data.status !== "PENDING" ? data.date : "Menunggu",
                          note:
                            data.status === "PENDING"
                              ? "Menunggu peninjauan manual dari pimpinan."
                              : undefined,
                        },
                      ]
                }
              />
            </div>
          )}
        </div>
      </DnaModal>

      {/* Confirm Approve Dialog */}
      <DnaConfirmDialog
        isOpen={isConfirmApproveOpen}
        onClose={() => setIsConfirmApproveOpen(false)}
        onConfirm={handleConfirmApprove}
        title="Konfirmasi Persetujuan Dokumen"
        description={`Apakah Anda yakin ingin MENYETUJUI dokumen ${data.code}? Dokumen yang telah disetujui akan diproses ke tahap operasional berikutnya.`}
        confirmText="Ya, Setujui Dokumen"
        variant="primary"
        isProcessing={isActionLoading}
      />

      {/* Reject Modal with Mandatory Reason */}
      <DnaModal
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        title="Tolak Pengajuan Dokumen"
        subtitle={`Dokumen ${data.code} akan ditolak dan dikembalikan ke pembuat.`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton
              variant="ghost"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isActionLoading}
            >
              Batal
            </DnaButton>
            <DnaButton
              variant="danger"
              onClick={handleConfirmReject}
              disabled={isActionLoading}
            >
              Konfirmasi Penolakan
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="text-[12px] font-semibold text-slate-800 block">
            Alasan Penolakan <span className="text-rose-500">*</span>
          </label>
          <DnaTextarea
            placeholder="Tuliskan catatan atau instruksi perbaikan mengapa dokumen ini ditolak..."
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              if (e.target.value.trim()) setRejectError("");
            }}
            rows={4}
            error={rejectError}
          />
          <p className="text-[11px] text-slate-400">
            Catatan ini akan dikirimkan kepada pengaju dan tercatat di riwayat audit permanen.
          </p>
        </div>
      </DnaModal>
    </>
  );
}
