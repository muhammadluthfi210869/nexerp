import React from "react";
import {
  DnaDetailDrawer,
  DnaCell,
  DnaButton,
} from "@/components/dna";
import {
  SampleOrder,
  statusBadgeMap,
  statusLabelMap,
} from "../_types/sample-sales.types";

interface SampleDetailDrawerProps {
  detailOrder: SampleOrder | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  isApproving: boolean;
}

export function SampleDetailDrawer({
  detailOrder,
  onClose,
  onApprove,
  isApproving,
}: SampleDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!detailOrder}
      onClose={onClose}
      title={detailOrder?.code || "Spesifikasi & Formulasi Sample"}
      subtitle={detailOrder ? `${detailOrder.customerName} â€¢ ${detailOrder.brandName}` : undefined}
      badge={
        detailOrder ? (
          <DnaCell.Badge
            status={statusBadgeMap[detailOrder.status] || "default"}
            label={statusLabelMap[detailOrder.status] || detailOrder.status}
          />
        ) : undefined
      }
      actions={
        detailOrder ? (
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="primary"
              loading={isApproving}
              onClick={() => {
                if (detailOrder?.id) {
                  onApprove(detailOrder.id);
                }
              }}
            >
              Approve Sample
            </DnaButton>
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        ) : undefined
      }
    >
      {detailOrder && (
        <div className="space-y-4 text-xs">
          {/* Identitas Klien & Target */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Klien Pemesan</span>
              <span className="font-semibold text-slate-800 text-xs">{detailOrder.customerName}</span>
              <p className="text-[10px] text-slate-400">{detailOrder.brandName || "-"}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Selesai Lab</span>
              <span className="tabular-nums font-semibold text-slate-700 text-xs">{detailOrder.targetDate || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Harga Sample Satuan</span>
              <span className="tabular-nums font-bold text-slate-800 text-xs">Rp {detailOrder.unitPrice.toLocaleString("id-ID")}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kompensasi ke PO (Offset)</span>
              <span className="tabular-nums font-bold text-emerald-600 text-xs">
                Rp {detailOrder.sampleFeeOffset?.toLocaleString("id-ID") || "0"}
              </span>
            </div>
          </div>

          {/* Spesifikasi Fisik & Organoleptik */}
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-3">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Spesifikasi Fisik & Organoleptik</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5 text-[10px]">Bentuk Fisik</span>
                <span className="font-semibold text-slate-800">{detailOrder.physicalForm || "Liquid"}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5 text-[10px]">Netto Kemasan</span>
                <span className="font-semibold text-slate-800">{detailOrder.volumeNetto || "30 ml"}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5 text-[10px]">Warna Target</span>
                <span className="font-semibold text-slate-800">{detailOrder.color || "Transparan"}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5 text-[10px]">Aroma Target</span>
                <span className="font-semibold text-slate-800">{detailOrder.fragrance || "Soft"}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Klaim Manfaat & Bahan Aktif
              </label>
              <p className="bg-white p-2.5 rounded-lg font-medium text-slate-700 border border-slate-200/60">
                {detailOrder.benefitClaims || "-"}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Catatan Formulasi R&D
              </label>
              <p className="bg-amber-50/60 p-2.5 rounded-lg text-slate-700 border border-amber-200/60">
                {detailOrder.notes || "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
