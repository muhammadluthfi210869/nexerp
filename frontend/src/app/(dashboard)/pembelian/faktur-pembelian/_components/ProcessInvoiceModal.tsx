"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, FileText, Building2, Package, Calendar, Clock, DollarSign, ShieldCheck } from "lucide-react";
import { DnaModal, DnaButton, DnaBadge, formatRupiah } from "@/components/dna";
import { PendingInbound } from "../_types/faktur-pembelian.types";

interface ProcessInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInbound: PendingInbound | null;
  availableInbounds: PendingInbound[];
  onSelectInbound: (inbound: PendingInbound) => void;
  isSubmitting: boolean;
  onSubmit: (payload: {
    inboundId: string;
    poId?: string;
    vendorId?: string;
    vendorInvoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    notes?: string;
  }) => void;
}

export function ProcessInvoiceModal({
  isOpen,
  onClose,
  selectedInbound,
  availableInbounds,
  onSelectInbound,
  isSubmitting,
  onSubmit,
}: ProcessInvoiceModalProps) {
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setVendorInvoiceNumber("");
      setInvoiceDate(new Date().toISOString().split("T")[0]);
      setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
      setNotes("");
      setValidationError("");
    }
  }, [isOpen, selectedInbound]);

  const handleSubmit = () => {
    if (!selectedInbound) {
      setValidationError("Silakan pilih Penerimaan Barang (GR) terlebih dahulu.");
      return;
    }
    if (!vendorInvoiceNumber.trim()) {
      setValidationError("Nomor Faktur Vendor wajib diisi untuk 3-way matching akuntansi.");
      return;
    }
    setValidationError("");
    onSubmit({
      inboundId: selectedInbound.id,
      poId: selectedInbound.poId,
      vendorId: selectedInbound.vendorId,
      vendorInvoiceNumber: vendorInvoiceNumber.trim(),
      invoiceDate,
      dueDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Proses Faktur Pembelian (Dari Penerimaan Barang / GR)"
      description="Konversi data penerimaan fisik gudang & PO menjadi faktur tagihan supplier tanpa input manual barang."
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>3-Way Matching Otomatis (PO vs GR vs Invoice)</span>
          </div>
          <div className="flex items-center gap-2">
            <DnaButton variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4" />}
              loading={isSubmitting}
              onClick={handleSubmit}
              disabled={!selectedInbound || isSubmitting}
            >
              Proses & Terbitkan Faktur
            </DnaButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            ⚠️ {validationError}
          </div>
        )}

        {/* Pilih Penerimaan Barang jika belum dipilih */}
        <div>
          <label className="block text-slate-800 font-bold mb-1.5">
            Pilih Penerimaan Barang (Goods Receipt / GR)
          </label>
          <select
            value={selectedInbound?.id || ""}
            onChange={(e) => {
              const found = availableInbounds.find((ib) => ib.id === e.target.value);
              if (found) onSelectInbound(found);
            }}
            className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">-- Pilih Antrean Penerimaan Gudang --</option>
            {availableInbounds.map((ib) => (
              <option key={ib.id} value={ib.id}>
                {ib.inboundNumber} | {ib.poNumber} — {ib.vendorName} ({formatRupiah(ib.totalEstimated)})
              </option>
            ))}
          </select>
        </div>

        {selectedInbound && (
          <>
            {/* Header Informasi GR & PO */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Kode GR</span>
                <span className="font-mono font-bold text-slate-900">{selectedInbound.inboundNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">No. Purchase Order</span>
                <span className="font-mono font-bold text-indigo-700">{selectedInbound.poNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Supplier / Vendor</span>
                <span className="font-medium text-slate-900 truncate block">{selectedInbound.vendorName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Estimasi Total</span>
                <span className="font-bold text-emerald-700">{formatRupiah(selectedInbound.totalEstimated)}</span>
              </div>
            </div>

            {/* Rincian Barang yang Diterima (Auto-populated, Read Only) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100/75 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-[11px] text-slate-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  Rincian Barang Diterima Gudang (Auto-Populate dari GR & PO)
                </span>
                <DnaBadge variant="success">
                  {selectedInbound.items.length} Item Terverifikasi
                </DnaBadge>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-2">Nama Barang</th>
                      <th className="p-2 text-right">Qty Diterima</th>
                      <th className="p-2">Satuan</th>
                      <th className="p-2 text-right">Harga PO</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInbound.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 font-medium text-slate-800">{item.materialName}</td>
                        <td className="p-2 text-right font-mono font-bold text-indigo-700">
                          {item.qtyReceived.toLocaleString("id-ID")}
                        </td>
                        <td className="p-2 text-slate-500">{item.unit}</td>
                        <td className="p-2 text-right font-mono text-slate-700">{formatRupiah(item.unitPrice)}</td>
                        <td className="p-2 text-right font-mono font-semibold text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Input Data Fisik Faktur Vendor (HANYA 3 Field Sederhana) */}
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Data Faktur Fisik dari Vendor
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    No. Faktur Vendor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: INV/VEND/2026/089"
                    value={vendorInvoiceNumber}
                    onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Nomor tercetak pada kertas faktur vendor</p>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal Faktur Vendor</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Tidak boleh melebihi hari ini</p>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jatuh Tempo Pembayaran</label>
                  <input
                    type="date"
                    value={dueDate}
                    min={invoiceDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Term of Payment (TOP)</p>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Verifikasi (Opsional)</label>
                <input
                  type="text"
                  placeholder="Catatan pelunasan, diskon khusus, atau nomor surat jalan kurir..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </DnaModal>
  );
}
