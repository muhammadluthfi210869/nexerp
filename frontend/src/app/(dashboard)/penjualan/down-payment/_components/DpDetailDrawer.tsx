"use client";

import React from "react";
import {
  Wallet,
  Building2,
  Calendar,
  CreditCard,
  Printer,
  FileCheck2,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  Receipt,
  Layers,
} from "lucide-react";
import {
  DnaInspectionModal,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { formatRupiah } from "@/lib/utils";
import { statusBadgeConfig, type DpRecord } from "../_types/down-payment.types";

interface DpDetailDrawerProps {
  selectedRecord: DpRecord | null;
  onClose: () => void;
  onAllocate: (record: DpRecord) => void;
  onPrint?: (record: DpRecord) => void;
}

export function DpDetailDrawer({
  selectedRecord,
  onClose,
  onAllocate,
  onPrint,
}: DpDetailDrawerProps) {
  if (!selectedRecord) return null;

  const categoryLabel =
    selectedRecord.category === "sample"
      ? "Sample R&D"
      : selectedRecord.category === "legalitas"
      ? "Legalitas BPOM"
      : "Produksi Massal (PO)";

  return (
    <DnaInspectionModal
      isOpen={!!selectedRecord}
      onClose={onClose}
      title="Bukti Uang Muka (Down Payment)"
      documentCode={selectedRecord.code}
      subtitle={`Pelanggan: ${selectedRecord.customerName} (${selectedRecord.brandName}) • Kategori: ${categoryLabel}`}
      statusBadge={
        <DnaBadge
          variant={
            selectedRecord.status === "FULL"
              ? "emerald"
              : selectedRecord.status === "PARTIAL"
              ? "amber"
              : "blue"
          }
        >
          {statusBadgeConfig[selectedRecord.status]?.label || selectedRecord.status}
        </DnaBadge>
      }
      metrics={[
        {
          label: "Total DP Diterima",
          value: formatRupiah(selectedRecord.amount),
          variant: "brand",
        },
        {
          label: "Sisa Saldo Unused",
          value: formatRupiah(selectedRecord.remainingAmount),
          variant: selectedRecord.remainingAmount > 0 ? "success" : "neutral",
        },
        {
          label: "Telah Dialokasikan",
          value: formatRupiah(selectedRecord.usedAmount),
          variant: "neutral",
        },
        {
          label: "Status Pemakaian",
          value: statusBadgeConfig[selectedRecord.status]?.label || selectedRecord.status,
          variant: selectedRecord.status === "FULL" ? "success" : "warning",
        },
      ]}
      referenceDocuments={[
        {
          label: "No. Referensi Pesanan",
          code: selectedRecord.refNumber || "—",
          href: selectedRecord.refNumber.startsWith("SO") ? "/penjualan/sales-orders" : undefined,
        },
        {
          label: "Klien / Pemesan",
          code: `${selectedRecord.customerName} (${selectedRecord.brandName})`,
          href: "/penjualan/client-manager",
        },
        {
          label: "Kas & Bank Penerima",
          code: selectedRecord.bankAccount,
          href: "/finance/cash-in",
        },
      ]}
      onPrint={onPrint ? () => onPrint(selectedRecord) : undefined}
      primaryAction={
        selectedRecord.remainingAmount > 0
          ? {
              label: "Alokasikan ke Tagihan",
              icon: <ArrowUpRight className="w-3.5 h-3.5" />,
              onClick: () => onAllocate(selectedRecord),
              variant: "primary",
            }
          : undefined
      }
      tabs={[
        {
          key: "summary",
          label: "Rincian & Bank Penerima",
          icon: <Receipt className="w-3.5 h-3.5" />,
          content: (
            <div className="space-y-4">
              {/* Bank & Reference Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tanggal Terima:</span>
                  <p className="font-bold text-slate-800">{selectedRecord.date}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">No. Referensi:</span>
                  <p className="font-bold text-blue-600">{selectedRecord.refNumber || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kategori:</span>
                  <p className="font-bold text-slate-800">{categoryLabel}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kas / Bank Penerima:</span>
                  <p className="font-bold text-slate-800">{selectedRecord.bankAccount}</p>
                </div>
              </div>

              {/* Saldo Breakdown */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Rekapitulasi Mutasi Saldo Uang Muka
                </span>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Total Pembayaran Uang Muka Awal:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(selectedRecord.amount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Total Terpakai (Dialokasikan ke Invoice):</span>
                  <span className="font-bold text-rose-600">-{formatRupiah(selectedRecord.usedAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 font-bold">Sisa Saldo Uang Muka Tersedia:</span>
                  <span className="text-sm font-black text-emerald-700">
                    {formatRupiah(selectedRecord.remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="font-bold text-slate-600 block mb-1">Catatan Transaksi:</span>
                <p className="text-slate-700">{selectedRecord.notes || "Tidak ada catatan khusus pada uang muka ini."}</p>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
