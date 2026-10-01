import React from "react";
import { Printer, Lock, Unlock } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { OpnameSession } from "../_types/opname.types";
import { getStatusBadge } from "./WarehouseOpnameStatusBadge";

interface WarehouseOpnameDetailDrawerProps {
  selectedSession: OpnameSession | null;
  onClose: () => void;
  onPrint: (sessionCode?: string) => void;
  onApprove: (id: string) => void;
}

export function WarehouseOpnameDetailDrawer({
  selectedSession,
  onClose,
  onPrint,
  onApprove,
}: WarehouseOpnameDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedSession}
      onClose={onClose}
      title={selectedSession?.sessionCode || "Detail Sesi Opname"}
      subtitle={`Gudang: ${selectedSession?.warehouseName} â€¢ Tgl: ${selectedSession?.sessionDate}`}
      badge={selectedSession && getStatusBadge(selectedSession.status)}
      footerActions={
        <div className="flex items-center gap-2">
          <DnaButton
            variant="outline"
            size="sm"
            onClick={() => onPrint(selectedSession?.sessionCode)}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Form Hitung
          </DnaButton>
          {selectedSession && selectedSession.status !== "RECONCILED_CLOSED" && (
            <DnaButton
              variant="primary"
              size="sm"
              onClick={() => onApprove(selectedSession.id)}
            >
              Tutup Sesi & Rekonsiliasi
            </DnaButton>
          )}
        </div>
      }
    >
      {selectedSession && (
        <div className="space-y-6 text-xs">
          {/* Freeze Notice */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              selectedSession.isInventoryFrozen
                ? "bg-amber-50 border-amber-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <div className="space-y-1">
              <div className="font-semibold text-xs flex items-center gap-1.5">
                {selectedSession.isInventoryFrozen ? (
                  <Lock className="w-4 h-4 text-amber-600" />
                ) : (
                  <Unlock className="w-4 h-4 text-emerald-600" />
                )}
                <span>Status Pembekuan Stok (Inventory Freeze)</span>
              </div>
              <div className="text-[11px] text-slate-600">
                {selectedSession.isInventoryFrozen
                  ? "Transaksi keluar/masuk gudang ini dibekukan sementara agar hasil hitung fisik akurat."
                  : "Sesi opname selesai. Pembekuan transaksi telah dibuka kembali."}
              </div>
            </div>
            <DnaBadge variant={selectedSession.isInventoryFrozen ? "warning" : "success"}>
              {selectedSession.isInventoryFrozen ? "FROZEN" : "UNLOCKED"}
            </DnaBadge>
          </div>

          {/* Audit Team & Progress */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Tim Auditor & Hasil Rekonsiliasi
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Lead Auditor:</span>
                <span className="font-semibold text-slate-800">{selectedSession.auditorLead}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Material Dihitung:</span>
                <span className="tabular-nums font-semibold text-slate-800">
                  {selectedSession.countedSkus} / {selectedSession.totalSkus} SKU
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Jumlah Sesuai (Match):</span>
                <span className="font-semibold text-emerald-700">{selectedSession.matchedSkus} SKU</span>
              </div>
              <div>
                <span className="text-slate-400 block">Material Selisih (Variance):</span>
                <span className="font-semibold text-red-600">{selectedSession.varianceSkus} SKU</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {selectedSession.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Rincian Varians per Material
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable className="w-full text-left text-xs">
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3">Item</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Sistem</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Fisik</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Selisih</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedSession.items.map((it, idx) => (
                      <DnaTableRow key={idx}>
                        <DnaTd className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-800">{it.itemName}</div>
                          <div className="text-[10px] text-slate-400 tabular-nums">
                            {it.itemCode} â€¢ Rak {it.binLocation}
                          </div>
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right text-slate-600">
                          {it.systemQty} {it.unit}
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {it.actualQty !== null ? `${it.actualQty} ${it.unit}` : "-"}
                        </DnaTd>
                        <DnaTd
                          className={`py-2.5 px-3 text-right font-bold ${
                            it.differenceQty < 0
                              ? "text-red-600"
                              : it.differenceQty > 0
                              ? "text-emerald-700"
                              : "text-slate-500"
                          }`}
                        >
                          {it.differenceQty > 0 ? `+${it.differenceQty}` : it.differenceQty}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>
          )}
        </div>
      )}
    </DnaDetailDrawer>
  );
}
