import React from "react";
import { Boxes, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
  DnaBadge,
} from "@/components/dna";
import type { PackagingProductionItem, PackagingStatus } from "../_types/packaging.types";

export function getPackagingStatusBadge(status: PackagingStatus) {
  switch (status) {
    case "SELESAI":
      return <DnaBadge variant="success">SELESAI</DnaBadge>;
    case "PROSES":
      return <DnaBadge variant="info">PROSES</DnaBadge>;
    case "PENDING":
      return <DnaBadge variant="warning">PENDING</DnaBadge>;
    case "DIBATALKAN":
      return <DnaBadge variant="danger">BATAL</DnaBadge>;
    default:
      return <DnaBadge variant="neutral">{status}</DnaBadge>;
  }
}

interface PackagingTableProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  filteredData: PackagingProductionItem[];
  onOpenDetail: (item: PackagingProductionItem) => void;
}

export function PackagingTable({
  searchTerm,
  onSearchChange,
  isLoading,
  filteredData,
  onOpenDetail,
}: PackagingTableProps) {
  return (
    <DnaDataTableCard
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Cari jadwal, batch record, produk, pelanggan..."
    >
      <div className="w-full">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="py-3 px-4 w-[16%]">Kode & Tanggal</DnaTh>
              <DnaTh className="py-3 px-4 w-[24%]">Batch & Mesin</DnaTh>
              <DnaTh className="py-3 px-4 w-[26%]">Produk & Pelanggan</DnaTh>
              <DnaTh className="py-3 px-4 w-[18%]">Target & Output</DnaTh>
              <DnaTh className="py-3 px-4 w-[10%]">Status</DnaTh>
              <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  Memuat antrian produksi packaging...
                </DnaTd>
              </DnaTableRow>
            ) : filteredData.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada jadwal produksi packaging yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredData.map((item) => (
                <DnaTableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="tabular-nums text-xs font-bold text-slate-900 truncate">{item.code}</p>
                    <p className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">{item.date}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="tabular-nums text-xs font-semibold text-blue-700 truncate">{item.batchRecord}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.machine}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="font-semibold text-slate-900 text-xs truncate">{item.product}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.customer}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="tabular-nums font-bold text-slate-900 text-xs truncate">
                      Target: {item.targetPcs.toLocaleString()} Pcs
                    </p>
                    <p className="text-[11px] text-amber-700 tabular-nums truncate">
                      {item.actualPcs ? `Aktual: ${item.actualPcs.toLocaleString()} Pcs` : "Menunggu kemas"}
                    </p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4">
                    {getPackagingStatusBadge(item.status)}
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-right">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDetail(item)}
                      title="Lihat Detail Packaging"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                    </DnaButton>
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
