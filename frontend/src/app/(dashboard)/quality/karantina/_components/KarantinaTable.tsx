"use client";

import React from "react";
import { Eye, Flame, Loader2, FileText } from "lucide-react";
import { DnaDataTableCard, DnaTable, DnaTableHead, DnaTableBody, DnaTableRow, DnaTh, DnaTd, DnaCell, DnaBadge } from "@/components/dna";
import { QuarantineItem } from "../_types/karantina.types";

interface KarantinaTableProps {
  isLoading: boolean;
  items: QuarantineItem[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  coaFilter: string;
  onCoaFilterChange: (val: string) => void;
  onSelectDetail: (item: QuarantineItem) => void;
  onOpenResolve: (item: QuarantineItem) => void;
}

export const KarantinaTable: React.FC<KarantinaTableProps> = ({
  isLoading,
  items,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  coaFilter,
  onCoaFilterChange,
  onSelectDetail,
  onOpenResolve,
}) => {
  return (
    <DnaDataTableCard
      title="Daftar Antrean & Riwayat Barang Karantina"
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari nomor karantina, GRN, supplier, material, batch...",
        filterColumns: [
          {
            key: "status",
            label: "Status Disposisi",
            type: "select",
            options: ["QUARANTINE", "DISPOSAL", "REWORK", "RETURN_TO_VENDOR", "RELEASED"],
          },
          {
            key: "coa",
            label: "CoA Verifikasi",
            type: "select",
            options: ["TERVERIFIKASI", "MENUNGGU", "TIDAK_SESUAI"],
          },
          {
            key: "category",
            label: "Kategori Cacat",
            type: "select",
            options: ["KEMASAN", "FISIK", "KIMIA", "MIKROBIOLOGI", "LABEL_DOKUMEN"],
          },
        ],
        selectedColumn:
          statusFilter !== "ALL"
            ? "status"
            : coaFilter !== "ALL"
            ? "coa"
            : "category",
        onSelectColumn: () => {},
        filterValue:
          statusFilter !== "ALL"
            ? statusFilter
            : coaFilter !== "ALL"
            ? coaFilter
            : categoryFilter,
        onFilterValueChange: (val) => {
          if (["QUARANTINE", "DISPOSAL", "REWORK", "RETURN_TO_VENDOR", "RELEASED"].includes(val)) {
            onStatusFilterChange(val);
            onCoaFilterChange("ALL");
            onCategoryFilterChange("ALL");
          } else if (["TERVERIFIKASI", "MENUNGGU", "TIDAK_SESUAI"].includes(val)) {
            onCoaFilterChange(val);
            onStatusFilterChange("ALL");
            onCategoryFilterChange("ALL");
          } else if (val === "ALL") {
            onStatusFilterChange("ALL");
            onCoaFilterChange("ALL");
            onCategoryFilterChange("ALL");
          } else {
            onCategoryFilterChange(val);
            onStatusFilterChange("ALL");
            onCoaFilterChange("ALL");
          }
        },
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable className="min-w-[1300px]">
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider h-[40px] select-none">
              <DnaTh className="px-4 py-2.5 w-[50px] text-slate-400 tabular-nums text-center">#</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px] whitespace-nowrap">TANGGAL MASUK</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px] whitespace-nowrap">NO. KARANTINA</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px] whitespace-nowrap">NO. GRN / SJ</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[160px] whitespace-nowrap">SUPPLIER / VENDOR</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[200px]">KODE & NAMA MATERIAL</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[120px] text-right whitespace-nowrap">QTY KARANTINA</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px] whitespace-nowrap">NO. LOT / BATCH</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[130px] text-center whitespace-nowrap">COA VERIFIKASI</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[130px] text-center whitespace-nowrap">STATUS DISPOSISI</DnaTh>
              <DnaTh className="pr-4 py-2.5 text-center w-[90px] whitespace-nowrap">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-16 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memuat data karantina...</span>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : items.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-16 text-center text-slate-400">
                  <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 font-medium text-sm">
                    Tidak ada data barang karantina ditemukan
                  </p>
                </DnaTd>
              </DnaTableRow>
            ) : (
              items.map((item, idx) => (
                <DnaTableRow key={item.id} className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer">
                  <DnaTd className="px-4 py-2.5 text-slate-400 tabular-nums text-xs font-mono text-center">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 whitespace-nowrap">
                    <DnaCell.Date value={item.entryDate} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 whitespace-nowrap">
                    <DnaCell.Code
                      value={item.quarantineNo}
                      onClick={() => onSelectDetail(item)}
                    />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 whitespace-nowrap">
                    <DnaCell.Code value={item.grnNo} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 whitespace-nowrap">
                    <DnaCell.Text primary={item.supplierName} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 min-w-[200px]">
                    <DnaCell.Text primary={`${item.materialCode} - ${item.materialName}`} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right whitespace-nowrap">
                    <DnaCell.Number value={item.qty} suffix={item.unit} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 whitespace-nowrap">
                    <DnaCell.Code value={item.supplierLotBatch} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center whitespace-nowrap">
                    <DnaBadge
                      status={
                        item.coaVerification === "TERVERIFIKASI"
                          ? "success"
                          : item.coaVerification === "MENUNGGU"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {item.coaVerification === "TERVERIFIKASI"
                        ? "TERVERIFIKASI"
                        : item.coaVerification === "MENUNGGU"
                        ? "MENUNGGU"
                        : "TIDAK SESUAI"}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center whitespace-nowrap">
                    <DnaBadge
                      status={
                        item.dispositionStatus === "QUARANTINE"
                          ? "warning"
                          : item.dispositionStatus === "DISPOSAL"
                          ? "critical"
                          : item.dispositionStatus === "REWORK"
                          ? "info"
                          : item.dispositionStatus === "RELEASED"
                          ? "success"
                          : "default"
                      }
                    >
                      {item.dispositionStatus === "QUARANTINE"
                        ? "TERTAHAN"
                        : item.dispositionStatus === "DISPOSAL"
                        ? "SCRAP"
                        : item.dispositionStatus === "REWORK"
                        ? "REWORK"
                        : item.dispositionStatus === "RETURN_TO_VENDOR"
                        ? "RETUR SUPPLIER"
                        : item.dispositionStatus}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectDetail(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
                        title="Lihat Detail Cacat"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {item.dispositionStatus === "QUARANTINE" && (
                        <button
                          type="button"
                          onClick={() => onOpenResolve(item)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors border-none cursor-pointer"
                          title="Eksekusi Resolusi"
                        >
                          <Flame className="w-3 h-3" />
                          Resolusi
                        </button>
                      )}
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
};
