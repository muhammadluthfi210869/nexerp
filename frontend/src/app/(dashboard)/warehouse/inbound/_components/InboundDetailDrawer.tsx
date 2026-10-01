"use client";

import React from "react";
import {
  Printer,
  PackageCheck,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Gift,
  Boxes,
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
import type { GoodsReceiptNote } from "../_types/inbound.types";
import { InboundStatusBadge } from "./InboundStatusBadge";

interface InboundDetailDrawerProps {
  selectedGrn: GoodsReceiptNote | null;
  onClose: () => void;
  onPrint?: (grn: GoodsReceiptNote) => void;
  onApproveQc?: (grn: GoodsReceiptNote) => void;
}

export function InboundDetailDrawer({
  selectedGrn,
  onClose,
  onPrint,
  onApproveQc,
}: InboundDetailDrawerProps) {
  if (!selectedGrn) return null;

  const totalItems = selectedGrn.items.length;

  return (
    <DnaInspectionModal
      isOpen={!!selectedGrn}
      onClose={onClose}
      title="Laporan Penerimaan Barang (LPB / GRN)"
      documentCode={selectedGrn.grnNumber}
      subtitle={`Supplier: ${selectedGrn.vendorName} (${selectedGrn.vendorCode}) • No PO: ${selectedGrn.poNumber} • No Surat Jalan: ${selectedGrn.deliveryOrderNo}`}
      statusBadge={<InboundStatusBadge status={selectedGrn.status} />}
      metrics={[
        {
          label: "Qty Bagus (Masuk Stok)",
          value: `${selectedGrn.totalQtyGood.toLocaleString("id-ID")} Pcs`,
          subtext: "Diverifikasi & Siap Bayar",
          variant: "success",
        },
        {
          label: "Qty Reject (Retur / DN)",
          value: `${selectedGrn.totalQtyReject.toLocaleString("id-ID")} Pcs`,
          subtext: "Klaim Nota Debit",
          variant: selectedGrn.totalQtyReject > 0 ? "critical" : "neutral",
        },
        {
          label: "Qty Free Bonus",
          value: `${selectedGrn.totalQtyFree.toLocaleString("id-ID")} Pcs`,
          subtext: "HPP Rp 0",
          variant: "neutral",
        },
        {
          label: "Gudang Penampung",
          value: selectedGrn.warehouseName,
          subtext: `Tgl: ${selectedGrn.receiveDate}`,
          variant: "brand",
        },
      ]}
      referenceDocuments={[
        {
          label: "Purchase Order (PO)",
          code: selectedGrn.poNumber,
          href: "/pembelian/scm-pembelian",
        },
        {
          label: "Vendor / Supplier",
          code: `${selectedGrn.vendorName} (${selectedGrn.vendorCode})`,
          href: "/pembelian/supplier-price",
        },
        {
          label: "Master Gudang",
          code: selectedGrn.warehouseName,
          href: "/warehouse/gudang",
        },
      ]}
      onPrint={onPrint ? () => onPrint(selectedGrn) : undefined}
      primaryAction={
        selectedGrn.status === "PENDING_QC" && onApproveQc
          ? {
              label: "Approve QC & Masuk Real Stok",
              icon: <ShieldCheck className="w-3.5 h-3.5" />,
              onClick: () => onApproveQc(selectedGrn),
              variant: "success",
            }
          : onPrint
          ? {
              label: "Cetak Dokumen LPB (A4)",
              icon: <Printer className="w-3.5 h-3.5" />,
              onClick: () => onPrint(selectedGrn),
              variant: "primary",
            }
          : undefined
      }
      tabs={[
        {
          key: "items",
          label: "Rincian Item & Lot Batch",
          icon: <Boxes className="w-3.5 h-3.5" />,
          count: totalItems,
          content: (
            <div className="space-y-4 text-xs">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-[10.5px] font-bold uppercase tracking-wider">
                      <DnaTh className="p-2.5">Item Material</DnaTh>
                      <DnaTh className="p-2.5 text-right">Datang Fisik</DnaTh>
                      <DnaTh className="p-2.5 text-right text-emerald-700">Qty Bagus</DnaTh>
                      <DnaTh className="p-2.5 text-right text-rose-600">Qty Reject</DnaTh>
                      <DnaTh className="p-2.5 text-right text-blue-600">Qty Bonus</DnaTh>
                      <DnaTh className="p-2.5">No. Bets / Expire</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedGrn.items.map((it) => (
                      <DnaTableRow key={it.id} className="hover:bg-slate-50/50">
                        <DnaTd className="p-2.5 font-bold text-slate-800">
                          <div>{it.itemName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{it.itemCode}</div>
                        </DnaTd>
                        <DnaTd className="p-2.5 text-right font-medium text-slate-700">
                          {it.qtyReceived.toLocaleString("id-ID")} {it.unit}
                        </DnaTd>
                        <DnaTd className="p-2.5 text-right font-bold text-emerald-700">
                          {it.qtyGood.toLocaleString("id-ID")} {it.unit}
                        </DnaTd>
                        <DnaTd className="p-2.5 text-right font-bold text-rose-600">
                          {it.qtyReject > 0 ? `${it.qtyReject.toLocaleString("id-ID")} ${it.unit}` : "-"}
                        </DnaTd>
                        <DnaTd className="p-2.5 text-right font-bold text-blue-600">
                          {it.qtyFree > 0 ? `${it.qtyFree.toLocaleString("id-ID")} ${it.unit}` : "-"}
                        </DnaTd>
                        <DnaTd className="p-2.5 text-slate-700">
                          <span className="font-mono text-xs font-semibold">{it.batchNumber}</span>
                          {it.expiryDate && (
                            <div className="text-[10px] text-slate-400">Exp: {it.expiryDate}</div>
                          )}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>

              {/* Catatan Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-700">Catatan Penerimaan:</span>
                <p className="text-slate-600">
                  {selectedGrn.notes || "Barang diterima dalam kondisi segel utuh dan telah diperiksa oleh QC Raw Material."}
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "metadata",
          label: "Informasi Petugas & Alur",
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          content: (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Petugas Penerima Gudang:</span>
                  <p className="font-bold text-slate-800">{selectedGrn.receivedBy}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspektur QC Incoming:</span>
                  <p className="font-bold text-slate-800">{selectedGrn.qcInspector}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600">Status Validasi Fisik:</span>
                <InboundStatusBadge status={selectedGrn.status} />
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
