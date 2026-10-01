"use client";

import React from "react";
import { Eye } from "lucide-react";
import {
  DnaBadge,
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DNA_TABLE_CLASSES,
  DnaCell,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { cn } from "@/lib/utils";
import { ChecklistItem, UNKNOWN, formatDate, percent } from "../_types";

interface ChecklistTableProps {
  checklists: ChecklistItem[];
  onViewDetail: (item: ChecklistItem) => void;
}

export function ChecklistTable({ checklists, onViewDetail }: ChecklistTableProps) {
  return (
    <div className="space-y-4">
      <DnaDataTableCard
        title="DAFTAR CHECKLIST SALES ORDER AKTIF"
        count={checklists.length}
        badge={<DnaBadge variant="neutral">OPERASIONAL SO</DnaBadge>}
      >
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "w-12 text-center")}>#</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Judul Checklist</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Sales Order</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Periode Pengerjaan</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Progres Milestone</DnaTh>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status</DnaTh>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center w-28")}>Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {checklists.map((item, idx) => {
              const total = item.items.length;
              const done = item.completedItems.length;
              const pct = percent(done, total);
              return (
                <DnaTableRow key={item.id} className={DNA_TABLE_CLASSES.tr}>
                  <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center tabular-nums text-slate-400")}>{idx + 1}</DnaTd>
                  <DnaTd className={DNA_TABLE_CLASSES.td}>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.notes || UNKNOWN}</p>
                    </div>
                  </DnaTd>
                  <DnaTd className={DNA_TABLE_CLASSES.td}>
                    {item.salesOrderId ? (
                      <DnaCell.Code value={item.salesOrderId.slice(0, 8)} />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{UNKNOWN}</span>
                    )}
                  </DnaTd>
                  <DnaTd className={DNA_TABLE_CLASSES.td}>
                    <div className="text-xs">
                      <p className="text-slate-700 font-medium">Mulai: {formatDate(item.createdAt)}</p>
                      <p className="text-slate-500">Diubah: {formatDate(item.updatedAt)}</p>
                    </div>
                  </DnaTd>
                  <DnaTd className={DNA_TABLE_CLASSES.td}>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{done} / {total} Selesai</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            item.status === "COMPLETED" ? "bg-emerald-500" : "bg-blue-500",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </DnaTd>
                  <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                    <DnaBadge status={item.status === "COMPLETED" ? "SUCCESS" : "INFO"}>{item.status}</DnaBadge>
                  </DnaTd>
                  <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                    <button
                      type="button"
                      onClick={() => onViewDetail(item)}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer border border-blue-200/60"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Rincian</span>
                    </button>
                  </DnaTd>
                </DnaTableRow>
              );
            })}
            {checklists.length === 0 && (
              <DnaTableRow className="hover:bg-transparent">
                <DnaTd colSpan={7} className="py-12 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                    Belum ada checklist yang terdaftar.
                  </p>
                </DnaTd>
              </DnaTableRow>
            )}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}
