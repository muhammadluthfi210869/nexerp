"use client";

import React from "react";
import { FileText, Calendar, User, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { DnaBadge } from "@/components/dna";
import { cn } from "@/lib/utils";

interface DocumentPreviewProps {
  draft: {
    id: string;
    draftNumber: string;
    documentType: string;
    status: string;
    payload: Record<string, any>;
    autoApproveAt?: string;
    createdAt: string;
    notes?: string;
  };
}

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
  SALES_ORDER: "Sales Order",
  PURCHASE_ORDER: "Purchase Order",
};

export function DocumentPreview({ draft }: DocumentPreviewProps) {
  const statusConfig = STATUS_CONFIG[draft.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusConfig.icon;
  const payload = draft.payload as Record<string, any>;
  const items = payload.items || [];

  const subtotal = items.reduce(
    (sum: number, item: any) =>
      sum + (item.subtotal || (item.quantity || 0) * (item.unitPrice || 0) || 0),
    0
  );
  const tax = payload.taxRate ? subtotal * (payload.taxRate / 100) : 0;
  const total = subtotal + tax;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase tracking-tight">
                {TYPE_LABELS[draft.documentType] || draft.documentType}
              </h3>
              <p className="text-blue-200 text-xs font-medium">{draft.draftNumber}</p>
            </div>
          </div>
          <DnaBadge status={statusConfig.color as any}>
            <StatusIcon className="h-3 w-3 inline mr-1" />
            {statusConfig.label}
          </DnaBadge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Client Info */}
        {(payload.clientName || payload.brandName) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</p>
              <p className="text-sm font-semibold text-slate-900">{payload.clientName || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand</p>
              <p className="text-sm font-semibold text-slate-900">{payload.brandName || "-"}</p>
            </div>
          </div>
        )}

        {/* Items Table */}
        {items.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Items</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 font-bold text-slate-500">#</th>
                  <th className="text-left py-2 font-bold text-slate-500">Deskripsi</th>
                  <th className="text-center py-2 font-bold text-slate-500">Qty</th>
                  <th className="text-right py-2 font-bold text-slate-500">Harga</th>
                  <th className="text-right py-2 font-bold text-slate-500">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="py-2 text-slate-400">{idx + 1}</td>
                    <td className="py-2 font-medium text-slate-700">
                      {item.productName || item.name || item.materialName || "-"}
                    </td>
                    <td className="py-2 text-center text-slate-600">
                      {item.quantity || item.qty || 0}
                    </td>
                    <td className="py-2 text-right text-slate-600">
                      Rp {Number(item.unitPrice || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      Rp {Number(item.subtotal || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">PPN 11%</span>
                  <span className="font-medium">Rp {tax.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL</span>
                <span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Journal Lines */}
        {payload.lines && payload.lines.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Journal Lines
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 font-bold text-slate-500">Akun</th>
                  <th className="text-right py-2 font-bold text-slate-500">Debit</th>
                  <th className="text-right py-2 font-bold text-slate-500">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {payload.lines.map((line: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="py-2">
                      <span className="font-mono text-slate-500">{line.accountCode}</span>{" "}
                      <span className="text-slate-700">{line.accountName}</span>
                    </td>
                    <td className="py-2 text-right text-slate-600">
                      {line.debit ? `Rp ${Number(line.debit).toLocaleString("id-ID")}` : ""}
                    </td>
                    <td className="py-2 text-right text-slate-600">
                      {line.credit ? `Rp ${Number(line.credit).toLocaleString("id-ID")}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        {payload.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-amber-700 uppercase">Catatan</p>
            <p className="text-xs text-amber-800 mt-1">{payload.notes}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(draft.createdAt).toLocaleDateString("id-ID")}
          </span>
          {draft.autoApproveAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Auto-approve: {new Date(draft.autoApproveAt).toLocaleString("id-ID")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
