"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Printer,
  Calendar,
  Layers,
  Cpu,
  UserCheck,
  CheckCircle2,
  Clock,
  FlaskConical,
  Zap,
  Package,
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
import {
  ProductionScheduleItem,
  STAGE_CONFIG,
  STATUS_CONFIG,
} from "../_types/schedule.types";

interface ProductionScheduleDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  detailItem: ProductionScheduleItem | null;
  onPrint?: (item: ProductionScheduleItem) => void;
}

export function ProductionScheduleDetailDrawer({
  isOpen,
  onClose,
  detailItem,
  onPrint,
}: ProductionScheduleDetailDrawerProps) {
  if (!detailItem) return null;

  const stageInfo = STAGE_CONFIG[detailItem.stage] || { label: detailItem.stage, badge: "info" };
  const statusInfo = STATUS_CONFIG[detailItem.status] || { label: detailItem.status, badge: "default" };

  return (
    <DnaInspectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Surat Perintah Kerja (SPK) & Jadwal Produksi"
      documentCode={detailItem.spkCode}
      subtitle={`Produk: ${detailItem.productName} • Klien: ${detailItem.customerName} (${detailItem.brandName})`}
      statusBadge={
        <div className="flex items-center gap-1.5">
          <DnaBadge variant={stageInfo.badge || "info"}>
            {stageInfo.label}
          </DnaBadge>
          <DnaBadge
            variant={
              detailItem.status === "COMPLETED"
                ? "emerald"
                : detailItem.status === "IN_PROGRESS"
                ? "amber"
                : detailItem.status === "DELAYED"
                ? "rose"
                : "blue"
            }
          >
            {statusInfo.label}
          </DnaBadge>
        </div>
      }
      metrics={[
        {
          label: "Target Batch Produksi",
          value: `${detailItem.targetQty.toLocaleString("id-ID")} ${detailItem.unit}`,
          subtext: `Progress: ${detailItem.progressPct}%`,
          variant: "brand",
        },
        {
          label: "Mesin & Jalur Produksi",
          value: detailItem.machineName,
          subtext: `Operator: ${detailItem.operator}`,
          variant: "neutral",
        },
        {
          label: "Tahapan Aktif",
          value: stageInfo.label,
          variant: detailItem.stage === "MIXING" ? "brand" : detailItem.stage === "FILLING" ? "warning" : "neutral",
        },
        {
          label: "Jadwal Pelaksanaan",
          value: `${detailItem.startDate} s/d ${detailItem.endDate}`,
          variant: "neutral",
        },
      ]}
      referenceDocuments={[
        {
          label: "Sales Order Terkait",
          code: detailItem.soNumber,
          href: "/penjualan/sales-orders",
        },
        {
          label: "Batch Record (BMR)",
          code: "Catatan Bets Elektronik",
          href: "/production/batch-records",
        },
        {
          label: "Pengujian Lab QC",
          code: "Certificate of Analysis",
          href: "/quality/lab-test",
        },
      ]}
      onPrint={onPrint ? () => onPrint(detailItem) : undefined}
      primaryAction={
        onPrint
          ? {
              label: "Cetak Dokumen SPK (A4)",
              icon: <Printer className="w-3.5 h-3.5" />,
              onClick: () => onPrint(detailItem),
              variant: "primary",
            }
          : undefined
      }
      tabs={[
        {
          key: "summary",
          label: "Ringkasan SPK & Mesin",
          icon: <Cpu className="w-3.5 h-3.5" />,
          content: (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">No. SPK:</span>
                    <span className="font-bold text-slate-900">{detailItem.spkCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kode Jadwal:</span>
                    <span className="font-bold text-blue-600">{detailItem.code}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ref SO:</span>
                    <span className="font-bold text-slate-900">{detailItem.soNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Brand:</span>
                    <span className="font-bold text-slate-900">{detailItem.brandName}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Produk Jadi:</span>
                    <p className="font-black text-slate-900 text-sm">{detailItem.productName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Batch Qty:</span>
                    <p className="font-black text-emerald-600 text-sm">
                      {detailItem.targetQty.toLocaleString("id-ID")} {detailItem.unit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Machine Box */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Progres Realisasi Pengerjaan SPK
                  </span>
                  <span className="font-bold text-indigo-600 tabular-nums">{detailItem.progressPct}% Selesai</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, detailItem.progressPct))}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mesin & Line:</span>
                    <p className="font-bold text-slate-800">{detailItem.machineName}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Operator In-Charge:</span>
                    <p className="font-bold text-slate-800">{detailItem.operator}</p>
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Catatan Khusus Pengerjaan:</span>
                <p className="text-slate-600">{detailItem.notes || "Tidak ada instruksi khusus. Mengikuti SOP CPKB standar."}</p>
              </div>

              {/* Action Quick Link */}
              <div className="flex justify-end gap-2 pt-2">
                <Link
                  href={
                    detailItem.stage === "MIXING"
                      ? "/production/mixing"
                      : detailItem.stage === "FILLING"
                      ? "/production/filling"
                      : "/production/packaging"
                  }
                >
                  <DnaButton variant="primary" size="sm">
                    Buka Eksekusi Lini {stageInfo.label}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </DnaButton>
                </Link>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
