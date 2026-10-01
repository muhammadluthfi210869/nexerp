"use client";

import React from "react";
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
import { cn } from "@/lib/utils";
import { ChecklistItem, UNKNOWN, formatDate } from "../_types";

interface ChecklistDetailModalProps {
  item: ChecklistItem | null;
  onClose: () => void;
  onToggleItem: (item: ChecklistItem, label: string) => void;
  isPending: boolean;
}

export function ChecklistDetailModal({
  item,
  onClose,
  onToggleItem,
  isPending,
}: ChecklistDetailModalProps) {
  return (
    <DnaModal
      isOpen={!!item}
      onClose={onClose}
      title={`Rincian Sub-Checklist: ${item?.title ?? ""}`}
      subtitle={`Status: ${item?.status ?? UNKNOWN} â€¢ Dibuat: ${formatDate(item?.createdAt)}`}
      size="lg"
    >
      {item && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="px-3 py-2 text-center w-10">#</DnaTh>
                  <DnaTh className="px-3 py-2">Kategori Milestone</DnaTh>
                  <DnaTh className="px-3 py-2 text-center">Wajib</DnaTh>
                  <DnaTh className="px-3 py-2 text-center">Status</DnaTh>
                  <DnaTh className="px-3 py-2 text-center">Aksi Status</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {item.items.map((sub, i) => {
                  const done = item.completedItems.includes(sub.label);
                  return (
                    <DnaTableRow key={`${sub.label}-${i}`} className="hover:bg-slate-50/60">
                      <DnaTd className="px-3 py-2 text-center tabular-nums text-slate-400">{i + 1}</DnaTd>
                      <DnaTd className="px-3 py-2 font-semibold text-slate-800">{sub.label}</DnaTd>
                      <DnaTd className="px-3 py-2 text-center text-xs text-slate-500">
                        {sub.isRequired ? "Ya" : "Tidak"}
                      </DnaTd>
                      <DnaTd className="px-3 py-2 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs",
                            done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200",
                          )}
                        >
                          {done ? "DONE" : "PENDING"}
                        </span>
                      </DnaTd>
                      <DnaTd className="px-3 py-2 text-center">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onToggleItem(item, sub.label)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border disabled:opacity-50",
                            done ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300" : "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700",
                          )}
                        >
                          {done ? "Set Pending" : "Set Done âœ“"}
                        </button>
                      </DnaTd>
                    </DnaTableRow>
                  );
                })}
                {item.items.length === 0 && (
                  <DnaTableRow className="hover:bg-transparent">
                    <DnaTd colSpan={5} className="py-10 text-center text-[11px] font-bold text-slate-400 uppercase">
                      Checklist ini belum memiliki item milestone.
                    </DnaTd>
                  </DnaTableRow>
                )}
              </DnaTableBody>
            </DnaTable>
          </div>

          {item.notes && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <p className="text-[11px] text-slate-400 font-medium">Catatan:</p>
              <p className="text-xs font-medium text-slate-800">{item.notes}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <DnaButton variant="secondary" onClick={onClose}>Tutup Rincian</DnaButton>
          </div>
        </div>
      )}
    </DnaModal>
  );
}
