"use client";

import React from "react";
import { Printer } from "lucide-react";
import { DnaDetailDrawer, DnaBadge, DnaButton } from "@/components/dna";
import { SpkItem, SPK_STATUS_CONFIG } from "../_types/spk.types";

interface SpkDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: SpkItem | null;
  onPrint: (item: SpkItem) => void;
}

export function SpkDetailDrawer({
  isOpen,
  onClose,
  item,
  onPrint,
}: SpkDetailDrawerProps) {
  if (!item) return null;

  const statusInfo = SPK_STATUS_CONFIG[item.status] || {
    label: item.status,
    badge: "default",
  };

  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={item.spkCode}
      subtitle={`${item.productName} • ${item.brandName}`}
      badge={
        <DnaBadge variant={statusInfo.badge as any}>
          {statusInfo.label}
        </DnaBadge>
      }
      tabs={[
        {
          id: "general",
          label: "Informasi SPK",
          content: (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{item.spkCode}</span>
                  <span className="text-slate-500 font-mono">{item.soNumber}</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                <p className="text-slate-600">
                  {item.customerName} ({item.brandName})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Target Pesanan</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">
                    {item.orderQty.toLocaleString()} {item.unit}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Kategori: {item.category}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Alokasi Line</span>
                  <p className="font-bold text-indigo-700">{item.machineLine}</p>
                  <span className="text-[10px] text-slate-400">
                    Supervisor: {item.supervisor}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Tanggal Terbit</span>
                  <p className="font-medium text-slate-800">{item.issueDate}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Target Selesai</span>
                  <p className="font-medium text-slate-800">{item.targetDate}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Catatan Produksi:</span>
                <p className="text-slate-600">
                  {item.notes || "Tidak ada catatan instruksi khusus."}
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
          <DnaButton
            variant="primary"
            onClick={() => {
              onClose();
              onPrint(item);
            }}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak SPK
          </DnaButton>
        </div>
      }
    />
  );
}
