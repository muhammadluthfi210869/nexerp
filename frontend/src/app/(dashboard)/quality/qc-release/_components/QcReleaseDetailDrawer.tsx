import React from "react";
import { ShieldCheck } from "lucide-react";
import { DnaDetailDrawer, DnaBadge, DnaButton } from "@/components/dna";
import { QcReleaseBatchItem, STATUS_CONFIG } from "../_types/qc-release.types";

interface QcReleaseDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  detailModalItem: QcReleaseBatchItem | null;
  onOpenRelease: (item: QcReleaseBatchItem) => void;
}

export function QcReleaseDetailDrawer({
  isOpen,
  onClose,
  detailModalItem,
  onOpenRelease,
}: QcReleaseDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={detailModalItem?.batchNumber || "Detail Rilis QC"}
      subtitle={detailModalItem ? `${detailModalItem.productName} â€¢ ${detailModalItem.customerName}` : undefined}
      badge={detailModalItem ? <DnaBadge variant={STATUS_CONFIG[detailModalItem.status]?.badge || "default"}>{STATUS_CONFIG[detailModalItem.status]?.label}</DnaBadge> : undefined}
      tabs={[
        {
          id: "params",
          label: "Parameter Fisika-Kimia",
          content: detailModalItem ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="tabular-nums font-bold text-blue-700">{detailModalItem.batchNumber}</span>
                  <span className="tabular-nums text-slate-500">{detailModalItem.spkCode}</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{detailModalItem.productName}</p>
                <p className="text-slate-600">{detailModalItem.customerName} ({detailModalItem.brandName})</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">pH Terukur</span>
                  <p className="tabular-nums font-bold text-slate-900 text-sm">{detailModalItem.phValue}</p>
                  <span className="text-[10px] text-slate-400">Spec: {detailModalItem.phRange}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Viskositas</span>
                  <p className="tabular-nums font-bold text-slate-900 text-sm">{detailModalItem.viscosityCps} cPs</p>
                  <span className="text-[10px] text-slate-400">Spindle 4 @30 RPM</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Specific Gravity</span>
                  <p className="tabular-nums font-bold text-slate-900 text-sm">{detailModalItem.specificGravity}</p>
                  <span className="text-[10px] text-slate-400">Piknometer</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Pemeriksaan Organoleptik:</span>
                <p className="text-slate-600">
                  {detailModalItem.organolepticPass ? "Warna, aroma, dan homogenitas memenuhi standar master sampel." : "Tidak memenuhi kriteria organoleptik."}
                </p>
              </div>
            </div>
          ) : null
        },
        {
          id: "microbiology",
          label: "Mikrobiologi & APJ",
          content: detailModalItem ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-emerald-950">Uji Mikrobiologi (ALT & Patogen)</p>
                  <p className="text-[11px] text-emerald-800">{detailModalItem.microbiologyResult}</p>
                </div>
                <DnaBadge variant={detailModalItem.microbiologyPass ? "success" : "warning"}>
                  {detailModalItem.microbiologyPass ? "LOLOS" : "INKUBASI"}
                </DnaBadge>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <p className="font-bold text-slate-700 uppercase">Otorisasi Apoteker Penanggung Jawab:</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">APJ:</span>
                  <span className="font-semibold text-slate-900">{detailModalItem.apjName || "Belum ditandatangani"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. SIPA:</span>
                  <span className="tabular-nums text-slate-700">{detailModalItem.apjSipa || "â€”"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Sertifikat CoA:</span>
                  <span className="tabular-nums font-bold text-emerald-700">{detailModalItem.coaNumber || "â€”"}</span>
                </div>
              </div>
            </div>
          ) : null
        }
      ]}
      footerActions={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Tutup
          </DnaButton>
          {detailModalItem?.status === "QUARANTINE" && (
            <DnaButton
              variant="primary"
              onClick={() => onOpenRelease(detailModalItem)}
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Rilis APJ Sekarang
            </DnaButton>
          )}
        </div>
      }
    />
  );
}
