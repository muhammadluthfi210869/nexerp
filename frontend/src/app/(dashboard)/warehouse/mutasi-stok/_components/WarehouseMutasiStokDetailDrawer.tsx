"use client";

import React from "react";
import { Printer, CheckCircle2 } from "lucide-react";
import { DnaDetailDrawer, DnaButton, DnaBadge } from "@/components/dna";
import type { MutationItem, MutationType } from "../_types/mutasi-stok.types";

interface WarehouseMutasiStokDetailDrawerProps {
  selectedMutation: MutationItem | null;
  onClose: () => void;
  onPrint: (docRef?: string) => void;
}

export function WarehouseMutasiStokDetailDrawer({
  selectedMutation,
  onClose,
  onPrint,
}: WarehouseMutasiStokDetailDrawerProps) {
  const getMutationTypeBadge = (type: MutationType) => {
    switch (type) {
      case "INBOUND":
        return <DnaBadge variant="success">INBOUND (Masuk)</DnaBadge>;
      case "OUTBOUND":
        return <DnaBadge variant="warning">OUTBOUND (Keluar)</DnaBadge>;
      case "TRANSFER":
        return <DnaBadge variant="info">TRANSFER</DnaBadge>;
      case "ADJUSTMENT":
        return <DnaBadge variant="purple">ADJUSTMENT</DnaBadge>;
      case "OPNAME":
        return <DnaBadge variant="purple">OPNAME</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{type}</DnaBadge>;
    }
  };

  return (
    <DnaDetailDrawer
      isOpen={!!selectedMutation}
      onClose={onClose}
      title={selectedMutation?.docRef || "Detail Log Mutasi"}
      subtitle={`SKU: ${selectedMutation?.itemCode} • ${selectedMutation?.itemName}`}
      badge={selectedMutation && getMutationTypeBadge(selectedMutation.mutationType)}
      footerActions={
        <div className="flex items-center gap-2">
          <DnaButton
            variant="outline"
            size="sm"
            onClick={() => onPrint(selectedMutation?.docRef)}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Bukti Mutasi
          </DnaButton>
        </div>
      }
    >
      {selectedMutation && (
        <div className="space-y-6 text-xs">
          {/* Movement Quantity Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Volume Transaksi Mutasi
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold tabular-nums">
                {selectedMutation.qtyIn > 0 ? (
                  <span className="text-emerald-600">
                    +{selectedMutation.qtyIn.toLocaleString("id-ID")}{" "}
                    {selectedMutation.unit}
                  </span>
                ) : (
                  <span className="text-amber-600">
                    -{selectedMutation.qtyOut.toLocaleString("id-ID")}{" "}
                    {selectedMutation.unit}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                Saldo Sesudah Transaksi:{" "}
                <b className="text-slate-900 tabular-nums">
                  {selectedMutation.balance.toLocaleString("id-ID")}{" "}
                  {selectedMutation.unit}
                </b>
              </div>
            </div>
          </div>

          {/* Logistics Route Information */}
          <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Jalur Aliran Barang
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Sumber / Asal:</span>
                <span className="font-semibold text-slate-800">
                  {selectedMutation.sourceWarehouse}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Tujuan Alokasi:</span>
                <span className="font-semibold text-blue-700">
                  {selectedMutation.destWarehouse}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Waktu Pencatatan:</span>
                <span className="tabular-nums text-slate-800">
                  {selectedMutation.datetime}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Operator / PIC:</span>
                <span className="font-semibold text-slate-800">
                  {selectedMutation.pic}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Notes */}
          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1">
            <div className="font-semibold text-blue-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Catatan Transaksi & Audit Log
            </div>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              {selectedMutation.notes}
            </p>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
