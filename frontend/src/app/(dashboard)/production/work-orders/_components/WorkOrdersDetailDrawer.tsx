"use client";

import React from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { DnaDetailDrawer, DnaBadge, DnaButton } from "@/components/dna";
import { WorkOrderItem, STAGE_LABELS } from "../_types/work-orders.types";

interface WorkOrdersDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  detailItem: WorkOrderItem | null;
}

export function WorkOrdersDetailDrawer({
  isOpen,
  onClose,
  detailItem,
}: WorkOrdersDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={detailItem?.code || "Detail SPK"}
      subtitle={detailItem ? `${detailItem.productName} â€¢ ${detailItem.customerName}` : undefined}
      badge={
        detailItem ? (
          <DnaBadge variant={STAGE_LABELS[detailItem.currentStage]?.badge || "default"}>
            {STAGE_LABELS[detailItem.currentStage]?.label}
          </DnaBadge>
        ) : undefined
      }
      tabs={[
        {
          id: "summary",
          label: "Ringkasan Batch",
          content: detailItem ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="tabular-nums font-bold text-slate-900">{detailItem.code}</span>
                  <span className="tabular-nums text-blue-600 font-semibold">
                    {detailItem.batchNumber}
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{detailItem.productName}</p>
                <p className="text-slate-600">
                  {detailItem.customerName} ({detailItem.brandName})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Target Produksi</span>
                  <p className="tabular-nums font-bold text-slate-900 text-sm">
                    {detailItem.targetQty.toLocaleString()} Pcs
                  </p>
                  <span className="text-[10px] text-slate-400">Netto: {detailItem.netto}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Output Saat Ini</span>
                  <p className="tabular-nums font-bold text-emerald-700 text-sm">
                    {detailItem.goodQty.toLocaleString()} Pcs
                  </p>
                  <span className="text-[10px] text-rose-500">
                    Reject: {detailItem.rejectQty.toLocaleString()} Pcs
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 uppercase">Progress Pengerjaan</span>
                  <span className="tabular-nums font-bold text-blue-600">
                    {detailItem.progressPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      detailItem.progressPct >= 100 ? "bg-emerald-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${detailItem.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null,
        },
        {
          id: "schedule",
          label: "Jadwal & PIC",
          content: detailItem ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Mulai:</span>
                  <span className="tabular-nums font-bold text-slate-800">
                    {detailItem.startDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Selesai:</span>
                  <span className="tabular-nums font-bold text-slate-800">
                    {detailItem.targetDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PIC Operator:</span>
                  <span className="font-semibold text-slate-900">{detailItem.picOperator}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Catatan Khusus:</span>
                <p className="text-slate-600">
                  {detailItem.notes || "Tidak ada catatan instruksi."}
                </p>
              </div>
            </div>
          ) : null,
        },
      ]}
      footerActions={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Tutup
          </DnaButton>
          <Link href="/production/spk">
            <DnaButton variant="primary">
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Dokumen SPK
            </DnaButton>
          </Link>
        </div>
      }
    />
  );
}
