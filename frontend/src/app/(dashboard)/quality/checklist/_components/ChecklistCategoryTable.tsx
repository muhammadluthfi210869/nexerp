"use client";

import React from "react";
import {
  DnaBadge,
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DNA_TABLE_CLASSES,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { cn } from "@/lib/utils";
import { ChecklistCategory } from "../_types";

interface ChecklistCategoryTableProps {
  categories: ChecklistCategory[];
}

export function ChecklistCategoryTable({ categories }: ChecklistCategoryTableProps) {
  return (
    <div className="space-y-4">
      <DnaDataTableCard
        title="MASTER SEQUENCE KATEGORI CHECKLIST"
        count={categories.length}
        badge={<DnaBadge variant="neutral">STANDARDISASI PROTOKOL</DnaBadge>}
      >
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className={cn(DNA_TABLE_CLASSES.th, "w-16 text-center")}>Urutan</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Nama Kategori / Milestone</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Gate</DnaTh>
              <DnaTh className={DNA_TABLE_CLASSES.th}>Kode</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {categories.map((cat) => (
              <DnaTableRow key={cat.id} className={DNA_TABLE_CLASSES.tr}>
                <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center tabular-nums font-bold text-blue-600")}>#{cat.order}</DnaTd>
                <DnaTd className={cn(DNA_TABLE_CLASSES.td, "font-semibold text-slate-800 text-xs")}>{cat.label}</DnaTd>
                <DnaTd className={DNA_TABLE_CLASSES.td}>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-purple-50 text-purple-700 border-purple-200">
                    {cat.gate}
                  </span>
                </DnaTd>
                <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-xs font-medium text-slate-500")}>{cat.id}</DnaTd>
              </DnaTableRow>
            ))}
            {categories.length === 0 && (
              <DnaTableRow className="hover:bg-transparent">
                <DnaTd colSpan={4} className="py-12 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                    Belum ada kategori checklist yang terdaftar.
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
