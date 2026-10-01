"use client";

import React from "react";
import Link from "next/link";
import { Warehouse } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import {
  MR_STATUS_CONFIG,
  type MaterialRequisitionItem,
} from "../_types/material-requisition.types";

interface MaterialRequisitionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: MaterialRequisitionItem | null;
}

export function MaterialRequisitionDetailDrawer({
  isOpen,
  onClose,
  item,
}: MaterialRequisitionDetailDrawerProps) {
  if (!item) return null;

  const statusInfo = MR_STATUS_CONFIG[item.status] || {
    label: item.status,
    badge: "default",
  };

  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={item.requisitionCode}
      subtitle={`${item.targetProduct} • ${item.spkRef}`}
      badge={
        <DnaBadge variant={statusInfo.badge as any}>
          {statusInfo.label}
        </DnaBadge>
      }
      tabs={[
        {
          id: "summary",
          label: "Ringkasan Permintaan (MR)",
          content: (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{item.requisitionCode}</span>
                  <span className="text-slate-500">{item.requestDate}</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{item.targetProduct}</p>
                <p className="text-slate-600">
                  {item.customerName || "PT Cantika Glow Nusantara"} {item.brandName ? `(${item.brandName})` : ""}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Gudang Pengeluaran</span>
                  <p className="font-semibold text-slate-900">{item.sourceWarehouse}</p>
                  <span className="text-[10px] text-slate-400">
                    Total: {item.totalMaterialTypes} Macam Bahan
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">PIC Pemohon</span>
                  <p className="font-semibold text-slate-900">{item.requesterPic}</p>
                  <span className="text-[10px] text-slate-400">Tim Produksi Manufaktur</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1">Total Kuantitas Diambil</span>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  {item.totalQty.toLocaleString("id-ID")} {item.qtyUnit}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Catatan Pengeluaran:</span>
                <p className="text-slate-600">
                  {item.notes || "Pengambilan material batch produksi sesuai formula CPKB."}
                </p>
              </div>
            </div>
          ),
        },
      ]}
      footerActions={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Tutup
          </DnaButton>
          <Link href="/warehouse/stok">
            <DnaButton variant="primary">
              <Warehouse className="w-4 h-4 mr-1.5" />
              Cek Gudang
            </DnaButton>
          </Link>
        </div>
      }
    />
  );
}
