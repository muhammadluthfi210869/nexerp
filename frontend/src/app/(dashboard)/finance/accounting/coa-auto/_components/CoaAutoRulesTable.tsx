import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaCell,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
} from "@/components/dna";
import { CoaAutoRule, STANDARD_TRANSACTION_TYPES } from "../_types/coa-auto.types";

interface CoaAutoRulesTableProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDocFilter: string;
  onFilterValueChange: (value: string) => void;
  rules: CoaAutoRule[];
  onOpenEdit: (rule: CoaAutoRule) => void;
  onSelectDelete: (rule: CoaAutoRule) => void;
}

export function CoaAutoRulesTable({
  searchQuery,
  onSearchChange,
  selectedDocFilter,
  onFilterValueChange,
  rules,
  onOpenEdit,
  onSelectDelete,
}: CoaAutoRulesTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari nama aturan, kode transaksi, akun debit, akun kredit...",
        filterColumns: [
          {
            key: "docType",
            label: "Tipe Transaksi",
            type: "select",
            options: STANDARD_TRANSACTION_TYPES.map((t) => t.value),
          },
        ],
        selectedColumn: "docType",
        onSelectColumn: () => {},
        filterValue: selectedDocFilter,
        onFilterValueChange,
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable className="w-full text-left border-collapse text-xs">
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="w-12 text-slate-400">#</DnaTh>
              <DnaTh className="w-[28%]">Nama Aturan & Pemicu</DnaTh>
              <DnaTh className="w-[18%]">Kode Transaksi</DnaTh>
              <DnaTh className="w-[20%]">Akun Debit (Dr)</DnaTh>
              <DnaTh className="w-[20%]">Akun Kredit (Cr)</DnaTh>
              <DnaTh align="center" className="w-[8%]">Status</DnaTh>
              <DnaTh align="right" className="w-[6%]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {rules.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  Belum ada aturan posting jurnal otomatis. Klik &quot;Inisialisasi 12 Standar G-SERP&quot; atau &quot;Tambah Aturan Posting&quot;.
                </DnaTd>
              </DnaTableRow>
            ) : (
              rules.map((rule, idx) => (
                <DnaTableRow key={rule.id}>
                  <DnaTd className="text-slate-400 tabular-nums text-[11px]">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Text
                      primary={rule.ruleName}
                      secondary={rule.notes || rule.condition}
                    />
                  </DnaTd>
                  <DnaTd>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {rule.transactionType}
                    </span>
                  </DnaTd>
                  <DnaTd>
                    <span className="font-semibold text-blue-700">{rule.debitAccount}</span>
                  </DnaTd>
                  <DnaTd>
                    <span className="font-semibold text-emerald-700">{rule.creditAccount}</span>
                  </DnaTd>
                  <DnaTd align="center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      AKTIF
                    </span>
                  </DnaTd>
                  <DnaTd align="right">
                    <div className="flex items-center justify-end gap-1">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenEdit(rule)}
                        title="Sunting Aturan"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      </DnaButton>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectDelete(rule)}
                        title="Hapus Aturan"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </DnaButton>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
