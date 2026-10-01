import React from "react";
import { Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaCell,
  DnaButton,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { SalesReturn, statusBadgeConfig } from "../_types/retur-penjualan.types";

interface ReturTableProps {
  returns: SalesReturn[];
  filteredReturns: SalesReturn[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectDetail: (returnItem: SalesReturn) => void;
  onCreateNew: () => void;
}

export function ReturTable({
  returns,
  filteredReturns,
  isLoading,
  isError,
  error,
  refetch,
  searchTerm,
  onSearchChange,
  onSelectDetail,
  onCreateNew,
}: ReturTableProps) {
  return (
    <DnaDataTableCard
      count={filteredReturns.length}
      totalItems={returns.length}
      toolbarProps={{
        searchPlaceholder: "Cari kode retur, SO, pelanggan, atau produk...",
        searchValue: searchTerm,
        onSearchChange,
      }}
    >
      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : isError ? (
        <DnaErrorState
          title="Gagal Memuat Data Retur"
          message={(error as any)?.message || "Terjadi kesalahan saat memuat data retur penjualan."}
          onRetry={() => refetch()}
        />
      ) : filteredReturns.length === 0 ? (
        <DnaEmptyState
          title="Tidak Ada Klaim Retur"
          description="Belum ada transaksi retur penjualan yang tercatat."
          actionButton={
            <DnaButton variant="primary" size="sm" onClick={onCreateNew}>
              Buat Retur Baru
            </DnaButton>
          }
        />
      ) : (
        <div className="overflow-x-auto w-full">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                <DnaTh className="px-3.5 py-2.5 w-[45px] text-center text-slate-400">#</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[160px]">No. Retur Penjualan</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[150px]">No. Sales Order (SO)</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[110px]">Tanggal Retur</DnaTh>
                <DnaTh className="px-3.5 py-2.5 min-w-[170px]">Pelanggan / Klien</DnaTh>
                <DnaTh className="px-3.5 py-2.5 min-w-[160px]">Nama Produk Jadi</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[140px]">Gudang Penerima</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[120px] text-right">Qty Retur (Pcs)</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[140px] text-right">Nilai Retur (Rp)</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[140px] text-center">Jenis Kompensasi</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[120px] text-center">Status</DnaTh>
                <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredReturns.map((ret, idx) => (
                <DnaTableRow
                  key={ret.id}
                  onClick={() => onSelectDetail(ret)}
                  className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                >
                  <DnaTd className="px-3.5 py-2.5 text-center text-slate-400 tabular-nums text-[12px]">{idx + 1}</DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Code code={ret.returnCode} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Code code={ret.soNumber} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Text text={ret.returnDate} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <span className="font-semibold text-slate-900 text-[12px] line-clamp-1">{ret.customerName}</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <span className="text-slate-700 text-[12px] line-clamp-1">{ret.productName}</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <span className="text-slate-600 text-[12px] line-clamp-1">{ret.warehouseName}</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-right tabular-nums">
                    <span className="text-[12px] text-slate-800 font-medium">{ret.qtyReturned.toLocaleString("id-ID")} pcs</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-right">
                    <DnaCell.Numeric value={ret.totalValue} prefix="Rp " />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {ret.returnType === "POTONG_TAGIHAN"
                        ? "Nota Kredit (Offset)"
                        : ret.returnType === "GANTI_BARANG"
                        ? "Ganti Barang"
                        : "Refund Kas"}
                    </span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <DnaCell.Badge
                      status={statusBadgeConfig[ret.status]?.status || "default"}
                      label={statusBadgeConfig[ret.status]?.label || ret.status}
                    />
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <DnaButton
                      variant="ghost"
                      className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      onClick={() => onSelectDetail(ret)}
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        </div>
      )}
    </DnaDataTableCard>
  );
}
