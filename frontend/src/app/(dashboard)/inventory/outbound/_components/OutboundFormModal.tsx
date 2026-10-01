import React from "react";
import {
  DnaModal,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { OutboundFormData } from "../_types/outbound.types";

interface OutboundFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: OutboundFormData;
  setFormData: React.Dispatch<React.SetStateAction<OutboundFormData>>;
  rawSalesOrders: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export function OutboundFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  rawSalesOrders,
  onSubmit,
}: OutboundFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Surat Jalan Pengiriman Barang"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Kode Pengiriman (DO) *
            </label>
            <input
              type="text"
              required
              readOnly
              value={formData.code}
              className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 bg-zinc-100 font-semibold text-zinc-600 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Tanggal Pengiriman *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Pilih Sales Order Ref *
            </label>
            <select
              value={formData.soId}
              onChange={(e) => {
                const targetSo = rawSalesOrders.find((so: any) => so.id === e.target.value);
                setFormData({
                  ...formData,
                  soId: e.target.value,
                  soNumber: targetSo?.orderNumber || e.target.value,
                  customer: targetSo?.lead?.clientName || "Pelanggan",
                });
              }}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              {rawSalesOrders.length === 0 ? (
                <option value="">Tidak ada Sales Order aktif</option>
              ) : (
                rawSalesOrders.map((so: any) => (
                  <option key={so.id} value={so.id}>
                    {so.orderNumber || so.id.slice(0, 8)} - {so.lead?.clientName || "Klien"} ({so.status})
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Customer / Brand Klien
            </label>
            <input
              type="text"
              readOnly
              value={formData.customer}
              className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 bg-zinc-100 text-zinc-600 font-semibold cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Ekspedisi / Kurir Pengantar *
            </label>
            <input
              type="text"
              required
              value={formData.courier}
              onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              No. Resi Pelacakan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: JNE-99210219"
              value={formData.trackingNo}
              onChange={(e) => setFormData({ ...formData, trackingNo: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        {/* Sub-table Keranjang Pengiriman */}
        <div>
          <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide mb-2">
            Daftar Barang yang Dikirim
          </h4>
          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                  <DnaTh className="py-2.5 px-3">Barang</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Qty Sales</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Qty Tersedia</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Qty Kirim *</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {formData.items.map((it, idx) => (
                  <DnaTableRow key={idx}>
                    <DnaTd className="py-2.5 px-3 text-center text-zinc-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-2.5 px-3 font-medium text-zinc-900">{it.name}</DnaTd>
                    <DnaTd className="py-2.5 px-3 text-center text-zinc-600">{it.unit}</DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-zinc-600">{it.qtySales.toLocaleString()}</DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-emerald-700 font-semibold">{it.qtyAvailable.toLocaleString()}</DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="1"
                        max={it.qtyAvailable}
                        value={it.qtyShip}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = [...formData.items];
                          updated[idx].qtyShip = val;
                          setFormData({ ...formData, items: updated });
                        }}
                        className="w-24 text-right p-1.5 border border-zinc-300 rounded font-semibold text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Catatan Pengiriman (Opsional)
          </label>
          <textarea
            rows={2}
            placeholder="Instruksi packing, nomor segel, driver..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
          <DnaButton
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Batal
          </DnaButton>
          <DnaButton type="submit" variant="primary">
            Simpan & Cetak Surat Jalan
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
