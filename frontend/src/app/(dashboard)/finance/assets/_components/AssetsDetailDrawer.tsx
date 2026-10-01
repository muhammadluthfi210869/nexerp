import React from "react";
import { Printer, Wrench } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaTable,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import type { AssetRegisterItem } from "../_types/assets.types";

interface AssetsDetailDrawerProps {
  selectedAsset: AssetRegisterItem | null;
  onClose: () => void;
  onPrintBarcode: () => void;
  onRecordUpgrade: () => void;
}

export function AssetsDetailDrawer({
  selectedAsset,
  onClose,
  onPrintBarcode,
  onRecordUpgrade,
}: AssetsDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedAsset}
      onClose={onClose}
      title={selectedAsset?.name || "Detail Aset Tetap"}
      subtitle={selectedAsset?.assetCode}
      badge={
        selectedAsset ? (
          <DnaBadge variant="info">
            {selectedAsset.category} &bull; {selectedAsset.usefulLifeYears} Tahun
          </DnaBadge>
        ) : undefined
      }
      tabs={[
        {
          id: "spec",
          label: "Spesifikasi & Nilai Buku",
          content: selectedAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal Perolehan</span>
                  <span className="font-semibold text-slate-900">{selectedAsset.acquisitionDate || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Metode Penyusutan</span>
                  <span className="font-semibold text-slate-900">Garis Lurus (Straight Line)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Harga Perolehan (Cost)</span>
                  <span className="font-bold text-slate-900">{formatRupiah(selectedAsset.acquisitionCost)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Akumulasi Penyusutan</span>
                  <span className="font-bold text-amber-700">{formatRupiah(selectedAsset.accumDepreciation)}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Nilai Buku Bersih (Net Book Value):</span>
                  <span className="font-extrabold text-base text-emerald-700">{formatRupiah(selectedAsset.bookValue)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">Alokasi & Tanggung Jawab Operasional</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Lokasi Fisik:</span>
                    <span className="font-medium">{selectedAsset.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Departemen PIC:</span>
                    <span className="font-medium">{selectedAsset.department}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "history",
          label: "Riwayat Pembelian & Upgrade",
          content: selectedAsset && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 mb-2">
                Catatan mutasi kapitalisasi, penggantian suku cadang besar, dan overhaul mesin.
              </div>
              {selectedAsset.purchaseHistory && selectedAsset.purchaseHistory.length > 0 ? (
                <DnaTable className="w-full text-left text-xs table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2 px-2 w-[25%]">Tanggal & Ref</th>
                      <th className="py-2 px-2 w-[35%]">Jenis & Keterangan</th>
                      <th className="py-2 px-2 text-right w-[40%]">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedAsset.purchaseHistory.map((ph, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-slate-800">{ph.date}</div>
                          <div className="tabular-nums text-[10px] text-blue-700">{ph.invoiceRef}</div>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-semibold text-slate-900">{ph.type}</div>
                          <div className="text-[10px] text-slate-500">{ph.notes}</div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-700">
                          {formatRupiah(ph.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DnaTable>
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  Belum ada riwayat kapitalisasi tambahan untuk aset ini.
                </div>
              )}
            </div>
          )
        }
      ]}
      footerActions={
        <div className="flex items-center justify-between w-full">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Tutup
          </DnaButton>
          <div className="flex gap-2">
            <DnaButton variant="secondary" size="md" onClick={onPrintBarcode}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Barcode
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={onRecordUpgrade}>
              <Wrench className="w-4 h-4 mr-1.5" />
              Catat Upgrade
            </DnaButton>
          </div>
        </div>
      }
    />
  );
}
