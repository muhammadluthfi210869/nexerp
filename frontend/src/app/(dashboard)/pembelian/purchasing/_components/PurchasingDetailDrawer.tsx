"use client";

import React from "react";
import { Package, User, Building2, Calendar, FileText, BadgeCheck } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import { PurchaseOrder, STATUS_BADGE_MAP } from "../_types/purchasing.types";

interface PurchasingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPo: PurchaseOrder | null;
}

export function PurchasingDetailDrawer({
  isOpen,
  onClose,
  selectedPo,
}: PurchasingDetailDrawerProps) {
  if (!selectedPo) return null;

  const items = selectedPo.items || [];
  const totalVal = Number(selectedPo.totalValue || selectedPo.totalAmount || 0);

  return (
    <DnaDetailDrawer
      isOpen={isOpen && !!selectedPo}
      onClose={onClose}
      title={selectedPo.poNumber || "Detail Purchase Order"}
      subtitle={selectedPo.supplier?.name || selectedPo.supplierName || "Supplier"}
      badge={
        <DnaBadge status={STATUS_BADGE_MAP[selectedPo.status] || "default"}>
          {selectedPo.status?.replace("_", " ") || "DRAFT"}
        </DnaBadge>
      }
      tabs={[
        {
          id: "details",
          label: "Informasi & Barang",
          content: (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Nomor PO:</span>
                    <span className="tabular-nums font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                      {selectedPo.poNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Supplier:</span>
                    <strong className="text-zinc-900">
                      {selectedPo.supplier?.name || selectedPo.supplierName || "-"}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Estimasi Kedatangan / Tgl:</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-zinc-800 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{selectedPo.estArrival || selectedPo.orderDate || "-"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Pembuat (SCM):</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-zinc-800 font-medium">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{selectedPo.scm?.fullName || "-"}</span>
                    </div>
                  </div>
                </div>

                {selectedPo.notes && (
                  <div className="border-t border-zinc-200 pt-2">
                    <span className="text-zinc-500 block text-[11px]">Catatan:</span>
                    <p className="text-zinc-700 mt-0.5 italic">{selectedPo.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-zinc-900 mb-2 uppercase text-[11px] tracking-wider">
                  Daftar Barang ({items.length} item)
                </h4>
                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                  <DnaTable>
                    <DnaTableHead>
                      <DnaTableRow className="border-b border-zinc-200 bg-zinc-50 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                        <DnaTh className="py-2 px-3">Barang</DnaTh>
                        <DnaTh className="py-2 px-3 text-center">Qty</DnaTh>
                        <DnaTh className="py-2 px-3 text-right">Harga</DnaTh>
                        <DnaTh className="py-2 px-3 text-right">Subtotal</DnaTh>
                      </DnaTableRow>
                    </DnaTableHead>
                    <DnaTableBody>
                      {items.length === 0 ? (
                        <DnaTableRow>
                          <DnaTd colSpan={4} className="py-6 text-center text-zinc-400">
                            Tidak ada item rincian
                          </DnaTd>
                        </DnaTableRow>
                      ) : (
                        items.map((item, idx) => {
                          const q = Number(item.quantity || item.qty || 0);
                          const p = Number(item.unitPrice || item.price || 0);
                          return (
                            <DnaTableRow key={idx}>
                              <DnaTd className="py-2.5 px-3">
                                <span className="font-medium text-zinc-900">
                                  {item.itemName || item.name || "-"}
                                </span>
                              </DnaTd>
                              <DnaTd className="py-2.5 px-3 text-center font-semibold">
                                {q}
                              </DnaTd>
                              <DnaTd className="py-2.5 px-3 text-right">
                                <DnaCell.Currency value={p} />
                              </DnaTd>
                              <DnaTd className="py-2.5 px-3 text-right font-semibold text-zinc-900">
                                <DnaCell.Currency value={q * p} />
                              </DnaTd>
                            </DnaTableRow>
                          );
                        })
                      )}
                    </DnaTableBody>
                  </DnaTable>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex justify-between items-center">
                <span className="font-semibold text-zinc-900">Total Nilai PO</span>
                <span className="font-bold text-zinc-900 text-base">
                  <DnaCell.Currency value={totalVal} />
                </span>
              </div>
            </div>
          ),
        },
        {
          id: "signature",
          label: "Otorisasi & Keamanan",
          content: (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">
                      Tanda Tangan Digital Terenkripsi
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Dokumen disahkan dengan protokol pengadaan digital SCM
                    </p>
                  </div>
                </div>
                <DnaBadge variant="success">TERVALIDASI</DnaBadge>
              </div>
            </div>
          ),
        },
      ]}
      footerActions={
        <div className="flex justify-end gap-2">
          <DnaButton variant="ghost" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      }
    />
  );
}
