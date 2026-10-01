"use client";

import React from "react";
import { Clock } from "lucide-react";
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
import type { SalesCategoryItem } from "../_types/sales-target.types";
import { DEFAULT_TIMELINE_STAGES } from "../_types/sales-target.types";
import type { useSalesTargetOperations } from "../_hooks/useSalesTargetOperations";

interface CategoryDetailModalProps {
  ops?: ReturnType<typeof useSalesTargetOperations>;
  category?: SalesCategoryItem | null;
  onClose?: () => void;
}

export function CategoryDetailModal(props: CategoryDetailModalProps) {
  const category = props.category !== undefined ? props.category : (props.ops?.detailCategory ?? null);
  const onClose = props.onClose ?? (() => props.ops?.setDetailCategory(null));

  return (
    <DnaModal
      isOpen={!!category}
      onClose={onClose}
      title={category ? `Kategori: ${category.name}` : "Detail Kategori Penjualan"}
      subtitle="Alur pipeline tahapan transaksi dan proses bisnis untuk kategori penjualan ini"
      size="lg"
    >
      {category && (
        <div className="space-y-6 py-2 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Deskripsi Kategori
            </span>
            <p className="text-slate-800 text-sm font-semibold">
              {category.description || "Tidak ada deskripsi."}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Timeline Tahapan Transaksi Penjualan Standard:
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable className="w-full text-left border-collapse text-xs">
                <DnaTableHead>
                  <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold">
                    <DnaTh className="w-10 text-slate-400 py-2.5 px-3">#</DnaTh>
                    <DnaTh className="py-2.5 px-3">Tahapan Timeline</DnaTh>
                    <DnaTh className="w-28 py-2.5 px-3">Estimasi Durasi</DnaTh>
                    <DnaTh className="py-2.5 px-3">Aktivitas Utama</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {DEFAULT_TIMELINE_STAGES.map((s) => (
                    <DnaTableRow key={s.step} className="hover:bg-slate-50/60">
                      <DnaTd className="py-2.5 px-3 font-mono text-slate-400">{s.step}</DnaTd>
                      <DnaTd className="py-2.5 px-3 font-semibold text-slate-800">{s.title}</DnaTd>
                      <DnaTd className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {s.duration}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-slate-500">{s.desc}</DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <DnaButton variant="primary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      )}
    </DnaModal>
  );
}
