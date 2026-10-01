import { Send } from "lucide-react";
import {
  DnaModal,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
} from "@/components/dna";
import type { GrnItemDetail } from "../_types/inbound.types";

interface InboundFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  openPOs: any[];
  selectedPoNumber: string;
  onSelectPo: (poNo: string) => void;
  deliveryOrderNo: string;
  onDeliveryOrderNoChange: (val: string) => void;
  receiveDate: string;
  onReceiveDateChange: (val: string) => void;
  warehouseName: string;
  onWarehouseNameChange: (val: string) => void;
  formItems: GrnItemDetail[];
  onUpdateItem: (idx: number, field: keyof GrnItemDetail, val: any) => void;
  formNotes: string;
  onFormNotesChange: (val: string) => void;
  onSubmit: () => void;
}

export function InboundFormModal({
  isOpen,
  onClose,
  openPOs,
  selectedPoNumber,
  onSelectPo,
  deliveryOrderNo,
  onDeliveryOrderNoChange,
  receiveDate,
  onReceiveDateChange,
  warehouseName,
  onWarehouseNameChange,
  formItems,
  onUpdateItem,
  formNotes,
  onFormNotesChange,
  onSubmit,
}: InboundFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Input Penerimaan Barang Masuk (GRN)"
      description="Verifikasi kuantitas fisik dari supplier dengan pemisahan barang bagus, reject, dan free bonus."
      size="2xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<Send className="w-4 h-4" />}
            onClick={onSubmit}
          >
            Simpan Penerimaan Barang
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Pilih Purchase Order (PO) *</label>
            <DnaSelect
              aria-label="Pilih PO"
              value={selectedPoNumber}
              onChange={onSelectPo}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 font-medium"
            >
              <option value="">-- Pilih Dokumen PO --</option>
              {openPOs.map((po: any) => (
                <option key={po.poNumber || po.id} value={po.poNumber || po.id}>
                  {po.poNumber || po.id} - {po.supplier?.name || po.vendorName || "Supplier"}
                </option>
              ))}
            </DnaSelect>
          </div>
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">No. Surat Jalan Supplier *</label>
            <DnaInput
              type="text"
              placeholder="Contoh: SJ/2026/09/1109"
              value={deliveryOrderNo}
              onChange={(e) => onDeliveryOrderNoChange(e.target.value)}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2 tabular-nums"
            />
          </div>
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Tanggal Terima Fisik *</label>
            <DnaInput
              type="date"
              value={receiveDate}
              onChange={(e) => onReceiveDateChange(e.target.value)}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2 tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-zinc-700 font-semibold mb-1">Gudang Alokasi Masuk *</label>
          <DnaSelect
            aria-label="Gudang Alokasi"
            value={warehouseName}
            onChange={onWarehouseNameChange}
            className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white focus:outline-none focus:border-zinc-900 font-medium"
          >
            <option value="Gudang Bahan Baku Utama (WH-01)">Gudang Bahan Baku Utama (WH-01)</option>
            <option value="Gudang Kemas & Box (WH-02)">Gudang Kemas & Box (WH-02)</option>
            <option value="Gudang Karantina & QC (WH-04)">Gudang Karantina & QC (WH-04)</option>
          </DnaSelect>
        </div>

        {/* Breakdown 3 Pilar Fisik per Item */}
        {formItems.length > 0 && (
          <div className="border border-zinc-200 rounded-xl p-3.5 bg-zinc-50 space-y-3">
            <h4 className="font-semibold text-zinc-900 text-xs">Pemisahan 3 Pilar Kuantitas Fisik</h4>
            {formItems.map((item, idx) => (
              <div key={item.itemCode} className="bg-white p-3 rounded-lg border border-zinc-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-zinc-900">{item.itemName}</span>
                    <span className="text-[11px] tabular-nums font-mono text-zinc-500 ml-2">[{item.itemCode}]</span>
                  </div>
                  <span className="text-xs text-zinc-500">Order PO: <b className="text-zinc-900">{item.qtyOrdered} {item.unit}</b></span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-emerald-800 font-semibold mb-0.5">Qty Bagus (Stok & Bayar)</label>
                    <DnaInput
                      type="number"
                      min="0"
                      value={item.qtyGood}
                      onChange={(e) => onUpdateItem(idx, "qtyGood", parseFloat(e.target.value) || 0)}
                      className="w-full text-xs tabular-nums font-semibold text-emerald-800 border border-emerald-200/80 bg-emerald-50/50 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-rose-800 font-semibold mb-0.5">Qty Reject (Klaim Retur)</label>
                    <DnaInput
                      type="number"
                      min="0"
                      value={item.qtyReject}
                      onChange={(e) => onUpdateItem(idx, "qtyReject", parseFloat(e.target.value) || 0)}
                      className="w-full text-xs tabular-nums font-semibold text-rose-800 border border-rose-200/80 bg-rose-50/50 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-800 font-semibold mb-0.5">Qty Free (Bonus HPP 0)</label>
                    <DnaInput
                      type="number"
                      min="0"
                      value={item.qtyFree}
                      onChange={(e) => onUpdateItem(idx, "qtyFree", parseFloat(e.target.value) || 0)}
                      className="w-full text-xs tabular-nums font-semibold text-zinc-900 border border-zinc-200 bg-zinc-50 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-600 font-semibold mb-0.5">No. Batch / Lot</label>
                    <DnaInput
                      type="text"
                      value={item.batchNumber}
                      onChange={(e) => onUpdateItem(idx, "batchNumber", e.target.value)}
                      className="w-full text-xs tabular-nums border border-zinc-200 rounded p-1.5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-zinc-700 font-semibold mb-1">Catatan Penerimaan Gudang</label>
          <DnaTextarea
            rows={2}
            placeholder="Contoh: Kondisi fisik luar kardus aman, sampling QC diambil 100ml."
            value={formNotes}
            onChange={(e) => onFormNotesChange(e.target.value)}
            className="w-full text-xs border border-zinc-300 rounded-lg p-2"
          />
        </div>
      </div>
    </DnaModal>
  );
}
