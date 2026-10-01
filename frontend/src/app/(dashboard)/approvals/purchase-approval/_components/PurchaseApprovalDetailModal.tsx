"use client";

import React from "react";
import { DnaButton, DnaInput, DnaModal, DnaSelect } from "@/components/dna";
import {
  PurchaseApprovalRecord,
  LineSourcesState,
} from "../_types/purchase-approval.types";

interface PurchaseApprovalDetailModalProps {
  selectedRecord: PurchaseApprovalRecord | null;
  poDiscount: number;
  onDiscountChange: (val: number) => void;
  poShippingCost: number;
  onShippingCostChange: (val: number) => void;
  lineSources: LineSourcesState;
  onLineSourceChange: (key: string, val: "PO" | "STOCK") => void;
  onClose: () => void;
}

export function PurchaseApprovalDetailModal({
  selectedRecord,
  poDiscount,
  onDiscountChange,
  poShippingCost,
  onShippingCostChange,
  lineSources,
  onLineSourceChange,
  onClose,
}: PurchaseApprovalDetailModalProps) {
  return (
    <DnaModal
      isOpen={!!selectedRecord}
      onClose={onClose}
      title={`Detail Pengajuan: ${selectedRecord?.submissionNo || ""}`}
      subtitle={`Dokumen Ref: ${selectedRecord?.refDocNo || "-"} • Pemohon: ${selectedRecord?.requester || "-"}`}
      size="3xl"
      footer={
        <DnaButton variant="outline" onClick={onClose}>
          Tutup
        </DnaButton>
      }
    >
      {selectedRecord && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <DnaInput
              label="Diskon (Rp)"
              type="number"
              min="0"
              value={poDiscount}
              onChange={(e) => onDiscountChange(Number(e.target.value))}
              className="h-9 text-xs font-bold"
            />
            <DnaInput
              label="Ongkos Kirim (Rp)"
              type="number"
              min="0"
              value={poShippingCost}
              onChange={(e) => onShippingCostChange(Number(e.target.value))}
              className="h-9 text-xs font-bold"
            />
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Item Pengajuan & Sumber Persediaan
            </div>
            {(selectedRecord.items || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Tidak ada rincian item baris.</p>
            ) : (
              (selectedRecord.items || []).map((it: any, idx: number) => {
                const key = it.id || it.materialId || `item-${idx}`;
                const defaultSource =
                  Number(it.currentStock || 0) >=
                  Number(it.quantity || it.qty || 0)
                    ? "STOCK"
                    : "PO";
                const sourceOptions = [
                  { label: "PO (Beli)", value: "PO" },
                  { label: "STOCK (Ambil dari Gudang)", value: "STOCK" },
                ];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {it.itemName || it.name || "Material / Barang"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Qty: {Number(it.quantity || it.qty || 0)} {it.unit || "PCS"}
                      </p>
                    </div>
                    <DnaSelect
                      label="Sumber"
                      value={lineSources[key] || defaultSource}
                      onChange={(val) =>
                        onLineSourceChange(
                          key,
                          (val || "PO") as "PO" | "STOCK"
                        )
                      }
                      options={sourceOptions}
                      className="h-8 text-[10px]"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </DnaModal>
  );
}
