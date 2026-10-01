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
import { ChecklistItem, UNKNOWN, formatDate } from "../_types";

interface ChecklistManageTableProps {
  checklists: ChecklistItem[];
  onManage: (item: ChecklistItem) => void;
}

export function ChecklistManageTable({ checklists, onManage }: ChecklistManageTableProps) {
  return (
    <div className="space-y-4">
      <DnaDataTableCard
        title="MANAJEMEN KELOLA CHECKLIST PROTOKOL"
        count={checklists.length}
        badge={<DnaBadge variant="neutral">EKSEKUSI OPERASIONAL</DnaBadge>}
      >
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "w-12 text-center")}>#</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Judul & Sales Order</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Pembuat</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Dibuat</DnaTh>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status</DnaTh>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center w-28")}>Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {checklists.map((item, idx) => (
              <DnaTableRow key={item.id} className={DNA_TABLE_CLASSES.tr}>
                <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center tabular-nums text-slate-400")}>{idx + 1}</DnaTd>
                <DnaTd className={DNA_TABLE_CLASSES.td}>
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">{item.title}</p>
                    {item.salesOrderId ? (
                      <DnaCell.Code value={item.salesOrderId.slice(0, 8)} />
                    ) : (
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5">{UNKNOWN}</p>
                    )}
                  </div>
                </DnaTd>
                <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-xs text-slate-600")}>
                  {item.creator?.fullName || UNKNOWN}
                </DnaTd>
                <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-xs tabular-nums text-slate-700")}>
                  {formatDate(item.createdAt)}
                </DnaTd>
                <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                  <DnaBadge status={item.status === "COMPLETED" ? "SUCCESS" : "INFO"}>{item.status}</DnaBadge>
                </DnaTd>
                <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                  <button
                    type="button"
                    onClick={() => onManage(item)}
                    className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer border border-blue-200/60"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Kelola</span>
                  </button>
                </DnaTd>
              </DnaTableRow>
            ))}
            {checklists.length === 0 && (
              <DnaTableRow className="hover:bg-transparent">
                <DnaTd colSpan={6} className="py-12 text-center">
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
