import React from "react";
import { CheckCircle2, ShieldCheck, XCircle, Loader2 } from "lucide-react";
import {
  DnaCard,
  DnaInput,
  DnaBadge,
  DnaSelect,
  DnaTextarea,
  DnaButton,
} from "@/components/dna";
import {
  ReleaseForm,
  JENIS_DOKUMEN,
  DOC_STATUS,
  KEPUTUSAN_OPTIONS,
} from "../_types/apj-release.types";

export interface ApjReleaseFormProps {
  form: ReleaseForm;
  setForm: React.Dispatch<React.SetStateAction<ReleaseForm>>;
  onToggleDokumen: (dokumen: string) => void;
  onUpdateDocStatus: (nama: string, field: "status" | "catatan", value: string) => void;
  canSubmit: boolean;
  isPending: boolean;
  onSubmitClick: () => void;
}

export const ApjReleaseForm: React.FC<ApjReleaseFormProps> = ({
  form,
  setForm,
  onToggleDokumen,
  onUpdateDocStatus,
  canSubmit,
  isPending,
  onSubmitClick,
}) => {
  return (
    <div className="space-y-6">
      <DnaCard>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            DATA BATCH & DOKUMEN
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DnaInput
            label="Batch Record *"
            value={form.batchRecord}
            onChange={(e) => setForm((prev) => ({ ...prev, batchRecord: e.target.value }))}
            placeholder="Masukkan ID Batch Record"
          />
          <DnaInput
            label="NIE (Nomor Izin Edar)"
            value={form.nie}
            onChange={(e) => setForm((prev) => ({ ...prev, nie: e.target.value }))}
            placeholder="Opsional untuk HOLD/REJECT"
          />
        </div>

        <div className="space-y-3 pt-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Jenis Dokumen <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {JENIS_DOKUMEN.map((dok) => {
              const checked = form.jenisDokumen.includes(dok);
              return (
                <button
                  key={dok}
                  type="button"
                  onClick={() => onToggleDokumen(dok)}
                  className={`inline-flex items-center gap-2 h-11 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                    checked
                      ? "bg-amber-50 border-amber-300 text-amber-700"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      checked ? "bg-amber-500 border-amber-500" : "border-slate-300"
                    }`}
                  >
                    {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  {dok}
                </button>
              );
            })}
          </div>
        </div>
      </DnaCard>

      {form.docStatuses.length > 0 && (
        <DnaCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              STATUS DOKUMEN
            </h3>
          </div>
          <div className="space-y-4">
            {form.docStatuses.map((doc) => (
              <div
                key={doc.nama}
                className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {doc.nama}
                  </span>
                  <DnaBadge
                    status={
                      doc.status === "APPROVED"
                        ? "success"
                        : doc.status === "REVISION_NEEDED"
                        ? "critical"
                        : "default"
                    }
                  >
                    {doc.status}
                  </DnaBadge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DnaSelect
                    label="Status"
                    value={doc.status}
                    onChange={(val) => onUpdateDocStatus(doc.nama, "status", val || "")}
                    options={DOC_STATUS.map((s) => ({ label: s, value: s }))}
                  />
                  <DnaTextarea
                    label="Catatan"
                    value={doc.catatan}
                    onChange={(e) => onUpdateDocStatus(doc.nama, "catatan", e.target.value)}
                    placeholder="Catatan dokumen..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </DnaCard>
      )}

      <DnaCard>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            KEPUTUSAN & VERIFIKASI
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DnaSelect
            label="Keputusan *"
            placeholder="Pilih Keputusan"
            value={form.keputusan}
            onChange={(val) => setForm((prev) => ({ ...prev, keputusan: val || "" }))}
            options={KEPUTUSAN_OPTIONS.map((k) => ({ label: k, value: k }))}
          />
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              TTD Digital <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, ttdDigital: !prev.ttdDigital }))}
              className={`w-full h-11 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                form.ttdDigital
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {form.ttdDigital ? "SUDAH TANDA TANGAN" : "KLIK UNTUK TANDA TANGAN"}
            </button>
          </div>
        </div>
        {form.keputusan === "RELEASE" && !form.nie && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl mt-2">
            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-[10px] font-bold text-rose-600 uppercase">
              NIE wajib diisi untuk keputusan RELEASE
            </span>
          </div>
        )}
      </DnaCard>

      <div className="flex justify-end">
        <DnaButton
          variant="primary"
          size="lg"
          disabled={!canSubmit || isPending}
          icon={isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={onSubmitClick}
        >
          SUBMIT RELEASE
        </DnaButton>
      </div>
    </div>
  );
};
