"use client";

import React from "react";
import {
  Lock,
  Unlock,
  Printer,
  Calendar,
  CheckCircle2,
  Package,
  Layers,
  Clock,
  ShieldCheck,
  Building2,
  UserCheck,
} from "lucide-react";
import {
  DnaInspectionModal,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { formatRupiah } from "@/lib/utils";
import type { SalesOrderItem } from "../_types/sales-orders.types";

interface OrderDetailDrawerProps {
  selectedDetail: SalesOrderItem | null;
  onClose: () => void;
  onToggleGatekeeper: (so: SalesOrderItem) => void;
  onPrint: (so: SalesOrderItem) => void;
}

export function OrderDetailDrawer({
  selectedDetail,
  onClose,
  onToggleGatekeeper,
  onPrint,
}: OrderDetailDrawerProps) {
  if (!selectedDetail) return null;

  const totalQty = selectedDetail.items.reduce((acc, it) => acc + it.qty, 0);

  return (
    <DnaInspectionModal
      isOpen={!!selectedDetail}
      onClose={onClose}
      title="Sales Order & Kontrak Maklon"
      documentCode={selectedDetail.soCode}
      subtitle={`Pelanggan: ${selectedDetail.customerName} • Brand: ${selectedDetail.brandName} • Tgl Order: ${selectedDetail.orderDate}`}
      statusBadge={
        <div className="flex items-center gap-1.5">
          <DnaBadge
            variant={
              selectedDetail.approvalStatus === "COMPLETED"
                ? "emerald"
                : selectedDetail.approvalStatus === "IN_PRODUCTION"
                ? "purple"
                : selectedDetail.approvalStatus === "APPROVED"
                ? "blue"
                : "amber"
            }
          >
            {selectedDetail.approvalStatus.replace(/_/g, " ")}
          </DnaBadge>
          <DnaBadge
            variant={selectedDetail.gatekeeperStatus === "RELEASED" ? "emerald" : "rose"}
          >
            {selectedDetail.gatekeeperStatus === "RELEASED" ? "DO RELEASED" : "DO HELD"}
          </DnaBadge>
        </div>
      }
      metrics={[
        {
          label: "Grand Total SO",
          value: formatRupiah(selectedDetail.grandTotal),
          variant: "brand",
        },
        {
          label: "Total Pesanan",
          value: `${totalQty.toLocaleString("id-ID")} Pcs`,
          subtext: `${selectedDetail.items.length} Variasi Produk`,
          variant: "neutral",
        },
        {
          label: "Status Gatekeeper",
          value: selectedDetail.gatekeeperStatus === "RELEASED" ? "Bebas Kirim" : "Tahan Kirim (Held)",
          variant: selectedDetail.gatekeeperStatus === "RELEASED" ? "success" : "critical",
        },
        {
          label: "Deadline Final",
          value: selectedDetail.deadlineFinal,
          subtext: `Kategori: ${selectedDetail.category.replace(/_/g, " ")}`,
          variant: "warning",
        },
      ]}
      referenceDocuments={[
        {
          label: "Pelanggan / Klien",
          code: `${selectedDetail.customerName} (${selectedDetail.brandName})`,
          href: `/penjualan/client-manager`,
        },
        {
          label: "Uang Muka (DP)",
          code: "Cek Kwitansi DP",
          href: `/penjualan/down-payment`,
        },
        {
          label: "Faktur Penjualan",
          code: "Invoice Komersial",
          href: `/penjualan/faktur-penjualan`,
        },
        {
          label: "Surat Jalan Gudang",
          code: "Delivery Order",
          href: `/warehouse/release`,
        },
      ]}
      onPrint={() => onPrint(selectedDetail)}
      primaryAction={{
        label: "Cetak Dokumen SO (A4)",
        icon: <Printer className="w-3.5 h-3.5" />,
        onClick: () => onPrint(selectedDetail),
        variant: "primary",
      }}
      tabs={[
        {
          key: "items",
          label: "Rincian Item & Nilai",
          icon: <Package className="w-3.5 h-3.5" />,
          count: selectedDetail.items.length,
          content: (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-[10.5px] font-bold uppercase tracking-wider">
                      <DnaTh className="p-2.5">Produk / Varian</DnaTh>
                      <DnaTh className="p-2.5 text-center">Netto</DnaTh>
                      <DnaTh className="p-2.5 text-right">Kuantitas</DnaTh>
                      <DnaTh className="p-2.5 text-right">Harga Satuan</DnaTh>
                      <DnaTh className="p-2.5 text-right">Diskon</DnaTh>
                      <DnaTh className="p-2.5 text-right">Subtotal</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedDetail.items.map((it, idx) => (
                      <DnaTableRow key={idx} className="hover:bg-slate-50/50">
                        <DnaTd className="p-2.5 font-bold text-slate-800 text-xs">{it.itemName}</DnaTd>
                        <DnaTd className="p-2.5 text-center text-slate-600 text-xs">{it.netto}</DnaTd>
                        <DnaTd className="p-2.5 text-right font-bold text-slate-800 text-xs">
                          {it.qty.toLocaleString("id-ID")} pcs
                        </DnaTd>
                        <DnaTd className="p-2.5 text-right text-slate-700 text-xs">
                          {formatRupiah(it.unitPrice)}
                        </DnaTd>
                        <DnaTd className="p-2.5 text-right text-rose-600 text-xs">
                          {it.discount > 0 ? formatRupiah(it.discount) : "-"}
                        </DnaTd>
                        <DnaTd className="p-2.5 text-right font-bold text-emerald-600 text-xs">
                          {formatRupiah(it.subtotal)}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>

              {/* Grand Total Summary Box */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200 p-4 rounded-xl gap-3">
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-700 block mb-0.5">Catatan Order:</span>
                  {selectedDetail.notes || "Tidak ada catatan khusus pada order ini."}
                </div>
                <div className="text-right sm:min-w-[200px] border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Grand Total Tagihan
                  </span>
                  <span className="text-lg font-black text-emerald-600">
                    {formatRupiah(selectedDetail.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "deadlines",
          label: "Matriks PIC & Deadline",
          icon: <Clock className="w-3.5 h-3.5" />,
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Alokasi Target Deadline per Divisi (SLA)
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    Deadline Akhir: {selectedDetail.deadlineFinal}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">1. DESAIN KEMASAN</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedDetail.deadlinePic.design}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">2. FORMULA R&D</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedDetail.deadlinePic.rnd}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">3. PENGADAAN SCM</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedDetail.deadlinePic.scm}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">4. PRODUKSI PABRIK</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedDetail.deadlinePic.production}</span>
                  </div>
                </div>
              </div>

              {/* Gatekeeper Controller */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">AR Delivery Gatekeeper</h4>
                  <p className="text-[11px] text-slate-500">
                    Kendalikan apakah gudang diizinkan menerbitkan Surat Jalan untuk pesanan ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleGatekeeper(selectedDetail)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                    selectedDetail.gatekeeperStatus === "RELEASED"
                      ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  {selectedDetail.gatekeeperStatus === "RELEASED" ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Kunci Gatekeeper (Tahan DO)
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      Buka Gatekeeper (Siap Kirim DO)
                    </>
                  )}
                </button>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
