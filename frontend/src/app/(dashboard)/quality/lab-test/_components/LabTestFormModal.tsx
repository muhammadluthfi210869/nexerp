import React from "react";
import { DnaModal, DnaButton, DnaInput, DnaSelect } from "@/components/dna";
import type { LabTestFormData } from "../_types/lab-test.types";

interface LabTestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: LabTestFormData;
  setForm: React.Dispatch<React.SetStateAction<LabTestFormData>>;
  onSubmit: () => void;
  isPending: boolean;
}

export function LabTestFormModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  isPending,
}: LabTestFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pencatatan Hasil Pengujian Laboratorium QC"
      description="Evaluasi parameter fisika-kimia, mikrobiologi, organoleptik, dan ketahanan stabilitas sampel."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onSubmit}
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : "Simpan Hasil Uji Lab"}
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Identifikasi Produk & Batch */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Nama Produk / Formula</label>
            <DnaInput
              value={form.productName || ""}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              placeholder="mis. Gentle Cleansing Gel"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">No. Batch / Ref Formula</label>
            <DnaInput
              value={form.batchNumber || ""}
              onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
              placeholder="mis. BATCH-2026-09-001"
            />
          </div>
        </div>

        {/* 1. Evaluasi Parameter Fisika-Kimia (pH, Viscosity, Density) */}
        <div>
          <h4 className="font-bold text-slate-800 uppercase tracking-tight mb-2">
            1. Evaluasi Fisika-Kimia
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">pH Aktual (25°C)</label>
              <DnaInput
                value={form.actualPh}
                onChange={(e) => setForm({ ...form, actualPh: e.target.value })}
                placeholder="mis. 5.50"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Viskositas (cps)
              </label>
              <DnaInput
                value={form.actualViscosity}
                onChange={(e) =>
                  setForm({ ...form, actualViscosity: e.target.value })
                }
                placeholder="mis. 4200"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Densitas (g/ml)
              </label>
              <DnaInput
                value={form.actualDensity}
                onChange={(e) =>
                  setForm({ ...form, actualDensity: e.target.value })
                }
                placeholder="mis. 1.02"
              />
            </div>
          </div>
        </div>

        {/* 2. Evaluasi Organoleptik (Warna, Aroma, Tekstur) */}
        <div>
          <h4 className="font-bold text-slate-800 uppercase tracking-tight mb-2">
            2. Pemeriksaan Organoleptik
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Warna Temuan</label>
              <DnaInput
                value={form.colorResult}
                onChange={(e) =>
                  setForm({ ...form, colorResult: e.target.value })
                }
                placeholder="mis. Bening kekuningan"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Aroma</label>
              <DnaInput
                value={form.aromaResult}
                onChange={(e) =>
                  setForm({ ...form, aromaResult: e.target.value })
                }
                placeholder="mis. Khas chamomile"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Tekstur / Sensori</label>
              <DnaInput
                value={form.textureResult}
                onChange={(e) =>
                  setForm({ ...form, textureResult: e.target.value })
                }
                placeholder="mis. Ringan, cepat meresap"
              />
            </div>
          </div>
        </div>

        {/* 3. Evaluasi Mikrobiologi & Standar Baku Mutu */}
        <div>
          <h4 className="font-bold text-slate-800 uppercase tracking-tight mb-2">
            3. Evaluasi Mikrobiologi & Baku Mutu
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Hasil Uji Mikrobiologi (ALT / Patogen)
              </label>
              <DnaInput
                value={form.microbiologyResult}
                onChange={(e) =>
                  setForm({ ...form, microbiologyResult: e.target.value })
                }
                placeholder="mis. ALT < 10 CFU/g (Negatif Patogen)"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Standar Baku Mutu CPKB
              </label>
              <DnaInput
                value={form.standardSpec}
                onChange={(e) =>
                  setForm({ ...form, standardSpec: e.target.value })
                }
                placeholder="mis. pH 5.0 - 6.5 | 3500 - 5000 cps | ALT < 100"
              />
            </div>
          </div>
        </div>

        {/* 4. Ketahanan Stabilitas Dipercepat */}
        <div>
          <h4 className="font-bold text-slate-800 uppercase tracking-tight mb-2">
            4. Ketahanan Stabilitas Dipercepat
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Oven 40°C / 75% RH
              </label>
              <select
                value={form.stability40C}
                onChange={(e) =>
                  setForm({ ...form, stability40C: e.target.value })
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="STABLE">STABLE (Lolos)</option>
                <option value="UNSTABLE">UNSTABLE (Pemisahan)</option>
                <option value="CHANGE">CHANGE (Perubahan Minor)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Suhu Ruang (RT ~25°C)
              </label>
              <select
                value={form.stabilityRT}
                onChange={(e) =>
                  setForm({ ...form, stabilityRT: e.target.value })
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="STABLE">STABLE (Lolos)</option>
                <option value="UNSTABLE">UNSTABLE (Pemisahan)</option>
                <option value="CHANGE">CHANGE (Perubahan Minor)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Chiller (4°C)
              </label>
              <select
                value={form.stability4C}
                onChange={(e) =>
                  setForm({ ...form, stability4C: e.target.value })
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="STABLE">STABLE (Lolos)</option>
                <option value="UNSTABLE">UNSTABLE (Kristalisasi)</option>
                <option value="CHANGE">CHANGE (Perubahan Minor)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Catatan & Kesimpulan Analis */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 uppercase">
            Catatan & Kesimpulan Analis Lab
          </label>
          <DnaInput
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Catatan perubahan bau, endapan, atau rekomendasi perbaikan..."
          />
        </div>
      </div>
    </DnaModal>
  );
}
