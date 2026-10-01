import React from "react";
import { DnaModal, DnaSelect, DnaInput, DnaTextarea, DnaButton } from "@/components/dna";
import { QuarantineItem, ResolveFormState } from "../_types/karantina.types";

interface KarantinaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  resolveForm: ResolveFormState;
  setResolveForm: React.Dispatch<React.SetStateAction<ResolveFormState>>;
  quarantineItems: QuarantineItem[];
  onExecute: () => void;
}

export const KarantinaFormModal: React.FC<KarantinaFormModalProps> = ({
  isOpen,
  onClose,
  resolveForm,
  setResolveForm,
  quarantineItems,
  onExecute,
}) => {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Resolusi Karantina / Reject (Role: Head of Manufacture)"
      size="lg"
    >
      <div className="space-y-3.5 text-xs">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 leading-relaxed">
          <strong>Protokol Eksepsi Karantina:</strong> Eksekusi barang reject wajib mencatat akun beban kerugian scrap agar saldo persediaan di neraca tetap akurat dan tidak menumpuk nilai aset mati.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">No. Ref QC / Batch Karantina *</label>
            <DnaSelect
              value={resolveForm.refCode}
              onChange={(val) => {
                const match = quarantineItems.find((q) => q.quarantineNo === val || q.code === val);
                if (match) {
                  setResolveForm((prev) => ({
                    ...prev,
                    refCode: match.quarantineNo || match.code || "",
                    materialName: `${match.materialCode} - ${match.materialName}`,
                    qty: match.qty,
                    unit: match.unit,
                  }));
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white tabular-nums font-bold"
            >
              {quarantineItems
                .filter((q) => q.dispositionStatus === "QUARANTINE" || q.status === "QUARANTINE")
                .map((q) => (
                  <option key={q.id} value={q.quarantineNo || q.code}>
                    {q.quarantineNo || q.code} — {q.supplierLotBatch || q.batchNo} ({q.materialName})
                  </option>
                ))}
            </DnaSelect>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tindakan Eksekusi *</label>
            <DnaSelect
              value={resolveForm.action}
              onChange={(val) => setResolveForm((prev) => ({ ...prev, action: val }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-rose-800"
            >
              <option value="Pemusnahan (Disposal)">Pemusnahan (Disposal) — Masuk Akun Beban Kerugian</option>
              <option value="Olah Ulang (Rework)">Olah Ulang (Rework) — Formulasi Ulang di Mixing</option>
              <option value="Retur ke Supplier">Retur ke Supplier — Pengembalian via SCM</option>
            </DnaSelect>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">Nama Barang / Material (Readonly)</label>
            <DnaInput
              type="text"
              value={resolveForm.materialName}
              readOnly
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Qty Tertahan (Readonly)</label>
            <DnaInput
              type="text"
              value={`${resolveForm.qty} ${resolveForm.unit}`}
              readOnly
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Akun Kerugian (CoA) *</label>
            <DnaSelect
              value={resolveForm.lossAccount}
              onChange={(val) => setResolveForm((prev) => ({ ...prev, lossAccount: val }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="5190 - Biaya Kerugian Produksi & Scrap">5190 - Biaya Kerugian Produksi & Scrap</option>
              <option value="5110 - Beban Pokok Bahan Baku">5110 - Beban Pokok Bahan Baku</option>
              <option value="6190 - Beban Operasional Lainnya">6190 - Beban Operasional Lainnya</option>
            </DnaSelect>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">No. Berita Acara / Bukti Eksekusi</label>
            <DnaInput
              type="text"
              placeholder="e.g. BA-DISP-2609-001"
              value={resolveForm.evidenceNote}
              onChange={(e) => setResolveForm((prev) => ({ ...prev, evidenceNote: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Alasan Justifikasi & Catatan Lapangan *</label>
          <DnaTextarea
            rows={2}
            placeholder="Jelaskan alasan pemusnahan atau tindakan yang diambil..."
            value={resolveForm.justification}
            onChange={(e) => setResolveForm((prev) => ({ ...prev, justification: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onExecute}>
            Simpan & Eksekusi Scrap
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
};
