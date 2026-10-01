import React from "react";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { DnaModal, DnaButton } from "@/components/dna";
import { ReleaseForm } from "../_types/apj-release.types";

export interface ApjReleaseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ReleaseForm;
  onConfirm: () => void;
  isPending: boolean;
}

export const ApjReleaseConfirmModal: React.FC<ApjReleaseConfirmModalProps> = ({
  isOpen,
  onClose,
  form,
  onConfirm,
  isPending,
}) => {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Submit Release"
      subtitle="Pastikan seluruh data release sudah benar sebelum dikirimkan."
      size="md"
      badge={<ShieldCheck className="w-3 h-3 text-amber-500" />}
      footer={
        <>
          <DnaButton variant="ghost" onClick={onClose}>
            BATAL
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onConfirm}
            disabled={isPending}
            icon={isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            YA, SUBMIT
          </DnaButton>
        </>
      }
    >
      <div className="space-y-2 text-[10px] font-bold text-slate-600 uppercase">
        <p>
          Batch Record: <span className="text-slate-900">{form.batchRecord || "â€”"}</span>
        </p>
        <p>
          Keputusan: <span className="text-slate-900">{form.keputusan || "â€”"}</span>
        </p>
        <p>
          NIE: <span className="text-slate-900">{form.nie || "â€”"}</span>
        </p>
        <p>
          Dokumen: <span className="text-slate-900">{form.jenisDokumen.length} item</span>
        </p>
        <p>
          TTD Digital:{" "}
          <span className="text-slate-900">
            {form.ttdDigital ? "Terkonfirmasi" : "Belum"}
          </span>
        </p>
      </div>
    </DnaModal>
  );
};
