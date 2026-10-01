import React from "react";
import { ShieldAlert, Printer, Plus } from "lucide-react";
import { DnaPageHeader, DnaButton } from "@/components/dna";

interface KarantinaHeaderProps {
  onOpenResolveModal: () => void;
}

export const KarantinaHeader: React.FC<KarantinaHeaderProps> = ({ onOpenResolveModal }) => {
  return (
    <DnaPageHeader
      title="Gudang Karantina & Resolusi Reject"
      description="Pengelolaan isolasi bahan baku, ruahan, dan produk jadi gagal QC. Eksekusi pemusnahan (disposal), olah ulang (rework), atau retur supplier untuk mencegah nilai mati persediaan."
      badge={
        <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Dokumen Input Eksepsi: Resolusi Reject (Role: Head of Manufacture)</span>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Berita Acara
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onOpenResolveModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            + Eksekusi Resolusi Reject
          </DnaButton>
        </div>
      }
    />
  );
};
