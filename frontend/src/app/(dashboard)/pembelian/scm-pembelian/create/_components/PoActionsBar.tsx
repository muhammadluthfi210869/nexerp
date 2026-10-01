import React from "react";
import { Save } from "lucide-react";
import { DnaButton } from "@/components/dna";

interface PoActionsBarProps {
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PoActionsBar({ onCancel, isSubmitting = false }: PoActionsBarProps) {
  return (
    <div className="pt-4 flex justify-end gap-2">
      <DnaButton type="button" variant="secondary" onClick={onCancel}>
        Batal
      </DnaButton>
      <DnaButton
        type="submit"
        variant="primary"
        icon={<Save className="w-4 h-4" />}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Menerbitkan..." : "Terbitkan Purchase Order"}
      </DnaButton>
    </div>
  );
}
