"use client";

import React from "react";
import {
  FlaskConical,
  Eye,
  MessageSquare,
} from "lucide-react";
import {
  DnaDataTableCard,
  DnaErrorState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaCell,
} from "@/components/dna";
import { extractApiError } from "@/lib/api";
import {
  NpfSampleRow,
  STAGE_LABEL,
  STAGE_VARIANT,
  fmtDate,
} from "../_types/npf.types";

interface NpfTableProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalNpfs: number;
  labTrialCount: number;
  shippedCount: number;
  approvedCount: number;
  isError: boolean;
  error: unknown;
  isLoading: boolean;
  onRetry: () => void;
  filteredNpfs: NpfSampleRow[];
  onViewDetail: (row: NpfSampleRow) => void;
  onInputFeedback: (row: NpfSampleRow) => void;
}

export function NpfTable({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  totalNpfs,
  labTrialCount,
  shippedCount,
  approvedCount,
  isError,
  error,
  isLoading,
  onRetry,
  filteredNpfs,
  onViewDetail,
  onInputFeedback,
}: NpfTableProps) {
  const getStatusBadge = (stage: string) => (
    <DnaBadge variant={STAGE_VARIANT[stage] ?? "neutral"}>
      {STAGE_LABEL[stage] ?? stage}
    </DnaBadge>
  );

  return (
    <DnaDataTableCard
      title="Daftar Permintaan Sample & Formulasi NPF"
      description="Pelacakan lifecycle sample mulai dari trial lab, pengiriman kurir resi, hingga approval deal."
      count={filteredNpfs.length}
      totalItems={totalNpfs}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari Kode Sample, Klien, Brand, Produk, Formulator...",
        statusOptions: [
          { value: "all", label: `Semua NPF (${totalNpfs})` },
          { value: "lab", label: `Formulasi Lab (${labTrialCount})` },
          { value: "shipped", label: `Sample Terkirim (${shippedCount})` },
          { value: "approved", label: `Approved Deal (${approvedCount})` },
        ],
        selectedStatus: activeTab,
        onSelectStatus: onTabChange,
        statusPlaceholder: "Filter Tahap NPF",
        onResetAll: () => {
          onSearchChange("");
          onTabChange("all");
        },
        hasActiveFilters: searchQuery !== "" || activeTab !== "all",
      }}
    >
      {isError && (
        <div className="px-4 pt-4">
          <DnaErrorState
            title="Gagal Memuat Data Sample"
            message={extractApiError(error).message}
            onRetry={onRetry}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="p-3.5 w-12 text-center whitespace-nowrap">#</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[130px] whitespace-nowrap">NO. NPF / REQUEST</DnaTh>
              <DnaTh className="p-3.5 w-32 min-w-[110px] whitespace-nowrap">TANGGAL PENGAJUAN</DnaTh>
              <DnaTh className="p-3.5 min-w-[180px]">KLIEN / BRAND</DnaTh>
              <DnaTh className="p-3.5 min-w-[200px]">NAMA KONSEP PRODUK</DnaTh>
              <DnaTh className="p-3.5 min-w-[180px]">BENTUK SEDIAAN &amp; TEKSTUR</DnaTh>
              <DnaTh className="p-3.5 min-w-[180px]">TARGET KLAIM &amp; MANFAAT</DnaTh>
              <DnaTh className="p-3.5 w-40 min-w-[140px] whitespace-nowrap">FORMULATOR PIC</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[120px] text-center whitespace-nowrap">TARGET SELESAI SAMPLE</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[120px] text-center whitespace-nowrap">STATUS NPF</DnaTh>
              <DnaTh className="p-3.5 text-center w-24 whitespace-nowrap">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredNpfs.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                  <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  {isError
                    ? "Daftar sample tidak dapat dimuat."
                    : isLoading
                    ? "Memuat daftar sample..."
                    : "Tidak ada permintaan sample NPF yang sesuai."}
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredNpfs.map((row, idx) => (
                <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* 1. # */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap text-slate-400 font-mono text-xs">
                    {idx + 1}
                  </DnaTd>

                  {/* 2. No. NPF / Request */}
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaCell.Code value={row.sampleCode} onClick={() => onViewDetail(row)} />
                  </DnaTd>

                  {/* 3. Tanggal Pengajuan */}
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaCell.Date value={row.entryDate} />
                  </DnaTd>

                  {/* 4. Klien / Brand */}
                  <DnaTd className="p-3.5 text-xs">
                    <span className="font-semibold text-slate-900 block">{row.clientName}</span>
                    {row.brandName && row.brandName !== "—" && (
                      <span className="text-[10px] text-indigo-600 font-bold">{row.brandName}</span>
                    )}
                  </DnaTd>

                  {/* 5. Nama Konsep Produk */}
                  <DnaTd className="p-3.5 text-xs">
                    <span className="font-semibold text-slate-900">{row.productName}</span>
                  </DnaTd>

                  {/* 6. Bentuk Sediaan & Tekstur */}
                  <DnaTd className="p-3.5 text-xs text-slate-700">
                    <span>{row.textureReq || "—"}</span>
                  </DnaTd>

                  {/* 7. Target Klaim & Manfaat */}
                  <DnaTd className="p-3.5 text-xs">
                    <span className="font-medium text-indigo-700">{row.targetFunction || "—"}</span>
                  </DnaTd>

                  {/* 8. Formulator PIC */}
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaCell.Avatar name={row.formulatorPic} />
                  </DnaTd>

                  {/* 9. Target Selesai Sample */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap text-xs text-slate-700">
                    <span className="tabular-nums">{fmtDate(row.targetDeadline)}</span>
                  </DnaTd>

                  {/* 10. Status NPF */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap">
                    {getStatusBadge(row.stage)}
                  </DnaTd>

                  {/* 11. Aksi */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(row)}
                        title="Lihat Detail NPF"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onInputFeedback(row)}
                        title="Input Feedback Klien"
                      >
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
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
