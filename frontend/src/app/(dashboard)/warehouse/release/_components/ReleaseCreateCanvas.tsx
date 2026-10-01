"use client";

import React, { useMemo } from "react";
import {
  Truck,
  Building2,
  Package,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Receipt,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaSelect,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
} from "@/components/dna";

interface ReleaseCreateCanvasProps {
  onClose: () => void;
  readyOrders: any[];
  selectedSoNumber: string;
  onSelectSoNumber: (val: string) => void;
  shipDate: string;
  onShipDateChange: (val: string) => void;
  courierName: string;
  onCourierNameChange: (val: string) => void;
  vehicleOrTrackingNo: string;
  onVehicleOrTrackingNoChange: (val: string) => void;
  destinationAddress: string;
  onDestinationAddressChange: (val: string) => void;
  onSubmit: () => void;
}

export function ReleaseCreateCanvas({
  onClose,
  readyOrders,
  selectedSoNumber,
  onSelectSoNumber,
  shipDate,
  onShipDateChange,
  courierName,
  onCourierNameChange,
  vehicleOrTrackingNo,
  onVehicleOrTrackingNoChange,
  destinationAddress,
  onDestinationAddressChange,
  onSubmit,
}: ReleaseCreateCanvasProps) {
  const selectedSo = useMemo(() => {
    return readyOrders.find((so) => so.soNumber === selectedSoNumber || so.id === selectedSoNumber) || null;
  }, [readyOrders, selectedSoNumber]);

  return (
    <div className="space-y-6">
      {/* Header Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Truck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-semibold text-zinc-900">Buat Surat Jalan Pengiriman (Delivery Order)</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
              SJ-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Penerbitan surat jalan pengeluaran barang jadi dari gudang ekspedisi dengan validasi otomatis status Financial Gate.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={onSubmit}
            disabled={!selectedSoNumber}
          >
            Terbitkan Surat Jalan
          </DnaButton>
        </div>
      </div>

      {/* 2-Column Upper Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Sumber SO & Klien */}
        <DnaCard className="p-5 space-y-4 border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Building2 className="w-4 h-4 text-zinc-900" />
              1. Dokumen Sumber Sales Order (SO)
            </div>
            {selectedSo && (
              <DnaBadge
                variant={
                  selectedSo.financialStatus === "PAID"
                    ? "success"
                    : selectedSo.financialStatus === "DP_APPROVED"
                    ? "warning"
                    : "critical"
                }
              >
                Financial Gate: {selectedSo.financialStatus || "LUNAS"}
              </DnaBadge>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Pilih Sales Order Siap Kirim *
            </label>
            <DnaSelect
              placeholder="-- Pilih Sales Order --"
              value={selectedSoNumber}
              onChange={onSelectSoNumber}
              options={readyOrders.map((so: any) => ({
                label: `${so.soNumber} — ${so.clientName} (${so.brandName || "Brand"})`,
                value: so.soNumber || so.id,
              }))}
            />
          </div>

          {selectedSo ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Nama Klien / Perusahaan</span>
                  <span className="font-semibold text-zinc-900 block mt-0.5">{selectedSo.clientName}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">{selectedSo.brandName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Nomor SO Terpilih</span>
                  <span className="font-mono font-semibold text-zinc-900 block mt-0.5">{selectedSo.soNumber}</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-800 block">Validasi Financial Gate</span>
                  <span className="text-[11px] text-zinc-500">
                    Otorisasi status pembayaran sebelum barang dirilis keluar gudang.
                  </span>
                </div>
                <DnaBadge variant="success">PASS (Disetujui)</DnaBadge>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs">
              Pilih Sales Order di atas untuk memuat data pengiriman otomatis.
            </div>
          )}
        </DnaCard>

        {/* Right Column: Ekspedisi & Logistik */}
        <DnaCard className="p-5 space-y-4 border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Truck className="w-4 h-4 text-zinc-900" />
              2. Informasi Ekspedisi & Alamat Tujuan
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Tanggal Pengiriman *
              </label>
              <DnaInput
                type="date"
                value={shipDate}
                onChange={(e) => onShipDateChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Nama Ekspedisi / Kurir *
              </label>
              <DnaInput
                placeholder="Contoh: JNE Trucking / Armada Internal"
                value={courierName}
                onChange={(e) => onCourierNameChange(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              No. Kendaraan / Resi Ekspedisi
            </label>
            <DnaInput
              placeholder="Contoh: B 9821 TBC / TRACK-88129"
              value={vehicleOrTrackingNo}
              onChange={(e) => onVehicleOrTrackingNoChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Alamat Lengkap Tujuan Pengiriman
            </label>
            <DnaInput
              placeholder="Masukkan alamat gudang customer..."
              value={destinationAddress}
              onChange={(e) => onDestinationAddressChange(e.target.value)}
            />
          </div>
        </DnaCard>
      </div>

      {/* Bottom Full-Width Table */}
      {selectedSo && (
        <DnaCard className="p-5 space-y-4 border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Package className="w-4 h-4 text-zinc-900" />
              3. Rincian Barang Jadi yang Siap Dirilis Sesuai SO
            </div>
          </div>

          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-2.5 px-3 w-[50px] text-center">No</DnaTh>
                  <DnaTh className="py-2.5 px-3 min-w-[200px]">Nama Produk Jadi</DnaTh>
                  <DnaTh className="py-2.5 px-3 w-[150px]">No. Batch Produksi</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[140px]">Qty Pesanan SO</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[140px]">Qty Siap Kirim</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center w-[100px]">Satuan</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center w-[120px]">Status QC Lab</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {(selectedSo.items || [
                  {
                    itemName: "Glow Radiance Serum 30ml",
                    batchNumber: "LOT-FG-2026-001",
                    qtyShipped: 5000,
                    unit: "Pcs",
                  },
                ]).map((it: any, idx: number) => (
                  <DnaTableRow key={idx} className="hover:bg-zinc-50/60">
                    <DnaTd className="py-2.5 px-3 text-center font-mono text-xs text-zinc-400">
                      {idx + 1}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 font-semibold text-xs text-zinc-900">
                      {it.itemName || it.name || "Produk Jadi Maklon"}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 font-mono text-xs text-zinc-600">
                      {it.batchNumber || "LOT-FG-2026-001"}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-xs tabular-nums text-zinc-600">
                      {(it.qtyShipped || it.qty || 5000).toLocaleString("id-ID")} {it.unit || "Pcs"}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-xs tabular-nums font-semibold text-zinc-900">
                      {(it.qtyShipped || it.qty || 5000).toLocaleString("id-ID")} {it.unit || "Pcs"}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-center text-xs text-zinc-600">
                      {it.unit || "Pcs"}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-center">
                      <DnaBadge variant="success">PASSED</DnaBadge>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaCard>
      )}
    </div>
  );
}
