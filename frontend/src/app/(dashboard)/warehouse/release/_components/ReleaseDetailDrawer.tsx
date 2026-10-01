import React from "react";
import { Printer, Lock, CheckCircle2, Truck, Package, ShieldCheck, Check } from "lucide-react";
import {
  DnaInspectionModal,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { DeliveryOrder } from "../_types/release.types";
import { ReleaseStatusBadge, FinancialGateBadge } from "./ReleaseBadges";

interface ReleaseDetailDrawerProps {
  selectedDelivery: DeliveryOrder | null;
  onClose: () => void;
  onPrint: (deliveryNumber?: string) => void;
  onConfirmDelivered: (orderId: string) => void;
}

export function ReleaseDetailDrawer({
  selectedDelivery,
  onClose,
  onPrint,
  onConfirmDelivered,
}: ReleaseDetailDrawerProps) {
  return (
    <DnaInspectionModal
      isOpen={!!selectedDelivery}
      onClose={onClose}
      title="Surat Jalan Pengiriman"
      documentCode={selectedDelivery?.deliveryNumber || ""}
      subtitle={
        selectedDelivery
          ? `Sales Order: ${selectedDelivery.soNumber} • Pelanggan: ${selectedDelivery.clientName} (${selectedDelivery.brandName})`
          : undefined
      }
      statusBadge={
        selectedDelivery ? (
          <div className="flex items-center gap-1.5">
            <ReleaseStatusBadge status={selectedDelivery.deliveryStatus} />
            <FinancialGateBadge status={selectedDelivery.financialGateStatus} />
          </div>
        ) : undefined
      }
      metrics={
        selectedDelivery
          ? [
              {
                label: "Total Kuantitas Kirim",
                value: `${selectedDelivery.totalUnits.toLocaleString("id-ID")} Pcs`,
                variant: "brand",
              },
              {
                label: "Kemasan Karton",
                value: `${selectedDelivery.totalBoxes} Box`,
                variant: "neutral",
              },
              {
                label: "Financial Gate",
                value:
                  selectedDelivery.financialGateStatus === "LUNAS"
                    ? "Lunas (Pass)"
                    : selectedDelivery.financialGateStatus === "DP_APPROVED"
                    ? "DP Approved"
                    : "Hold (Belum Lunas)",
                variant:
                  selectedDelivery.financialGateStatus === "LUNAS"
                    ? "success"
                    : selectedDelivery.financialGateStatus === "DP_APPROVED"
                    ? "warning"
                    : "critical",
              },
              {
                label: "Tgl Pengiriman",
                value: selectedDelivery.shipDate,
                variant: "neutral",
              },
            ]
          : []
      }
      referenceDocuments={
        selectedDelivery
          ? [
              {
                label: "Sales Order",
                code: selectedDelivery.soNumber,
                href: `/penjualan/sales-orders`,
              },
              {
                label: "Pelanggan / Brand",
                code: `${selectedDelivery.clientName} (${selectedDelivery.brandName})`,
                href: `/penjualan/client-manager`,
              },
            ]
          : []
      }
      onPrint={() => onPrint(selectedDelivery?.deliveryNumber)}
      primaryAction={
        selectedDelivery && selectedDelivery.deliveryStatus === "IN_TRANSIT"
          ? {
              label: "Konfirmasi Sampai (POD)",
              icon: <Check className="w-4 h-4" />,
              onClick: () => onConfirmDelivered(selectedDelivery.id),
              variant: "primary",
            }
          : undefined
      }
    >
      {selectedDelivery && (
        <div className="space-y-5 text-xs">
          {/* Financial Gate Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              selectedDelivery.financialGateStatus === "LUNAS"
                ? "bg-emerald-50 border-emerald-200"
                : selectedDelivery.financialGateStatus === "DP_APPROVED"
                ? "bg-blue-50 border-blue-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="space-y-1">
              <div className="font-semibold text-xs flex items-center gap-1.5">
                {selectedDelivery.financialGateStatus === "ON_HOLD" ? (
                  <Lock className="w-4 h-4 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span>Status Financial Gate Operasional</span>
              </div>
              <div className="text-[11px] text-slate-600">
                {selectedDelivery.financialGateStatus === "ON_HOLD"
                  ? "Surat jalan terkunci otomatis: Menunggu pelunasan / verifikasi dari Divisi Finance."
                  : "Lolos verifikasi finansial. Barang diizinkan untuk dikeluarkan dan dikirim ke klien."}
              </div>
            </div>
            <div>
              <FinancialGateBadge status={selectedDelivery.financialGateStatus} />
            </div>
          </div>

          {/* Destination & Logistics Details */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Informasi Ekspedisi & Logistik Pengiriman
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Pelanggan / Klien:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedDelivery.clientName}</span>
                <span className="text-slate-500 text-[11px] block">Brand: {selectedDelivery.brandName}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Ekspedisi / Driver:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedDelivery.courierName}</span>
                <span className="text-slate-500 text-[11px] block font-mono">No. Plat / Resi: {selectedDelivery.vehicleOrTrackingNo}</span>
              </div>
              <div className="md:col-span-2 pt-2 border-t border-slate-200">
                <span className="text-slate-400 block mb-0.5">Alamat Tujuan Gudang / Toko:</span>
                <span className="text-slate-700 font-medium">{selectedDelivery.destinationAddress}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Daftar Muatan Barang Jadi ({selectedDelivery.items.length} Item)
              </span>
              <span className="text-slate-500 text-[11px]">
                Dispatched by: <strong className="text-slate-700">{selectedDelivery.dispatchedBy}</strong>
              </span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-600">
                    <DnaTh className="px-3 py-2.5">Barang Jadi & Spesifikasi</DnaTh>
                    <DnaTh className="px-3 py-2.5">Batch / Lot</DnaTh>
                    <DnaTh className="px-3 py-2.5 text-right">Kemasan Box</DnaTh>
                    <DnaTh className="px-3 py-2.5 text-right">Qty Kirim</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedDelivery.items.map((it) => (
                    <DnaTableRow key={it.id} className="text-xs hover:bg-slate-50/60">
                      <DnaTd className="px-3 py-2.5">
                        <div className="font-semibold text-slate-800">{it.itemName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{it.itemCode}</div>
                      </DnaTd>
                      <DnaTd className="px-3 py-2.5 font-mono text-slate-600 font-medium">{it.batchNumber}</DnaTd>
                      <DnaTd className="px-3 py-2.5 text-right tabular-nums text-slate-700">{it.boxCount} Box</DnaTd>
                      <DnaTd className="px-3 py-2.5 text-right font-bold text-slate-900 tabular-nums">
                        {it.qtyShipped.toLocaleString("id-ID")} {it.unit}
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>
        </div>
      )}
    </DnaInspectionModal>
  );
}

