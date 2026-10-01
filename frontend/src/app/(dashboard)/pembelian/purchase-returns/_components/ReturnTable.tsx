import React from "react";
import { Eye, CheckCircle2 } from "lucide-react";
import {
  DnaDataTableCard,
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
import type { PurchaseReturn } from "../_types/purchase-returns.types";
import { getStatusBadge, getCompensationBadge } from "./ReturnBadges";

interface ReturnTableProps {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  filteredList: PurchaseReturn[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  compensationFilter: string;
  onCompensationFilterChange: (value: string) => void;
  onSelectReturn: (row: PurchaseReturn) => void;
  onApproveVendor: (id: string) => void;
  isApprovePending: boolean;
}

export function ReturnTable({
  isLoading,
  isError,
  refetch,
  filteredList,
  searchQuery,
  onSearchChange,
  compensationFilter,
  onCompensationFilterChange,
  onSelectReturn,
  onApproveVendor,
  isApprovePending,
}: ReturnTableProps) {
  return (
    <>
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Data Retur Pembelian"
            message="Terjadi kesalahan saat menghubungi server. Silakan coba lagi."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : (
        <DnaDataTableCard
          searchValue={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder="Cari No Retur, PO, GRN, supplier..."
          actions={
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter Kompensasi"
                value={compensationFilter}
                onChange={(e) => onCompensationFilterChange(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Jenis Kompensasi</option>
                <option value="POTONG_TAGIHAN">Debit Note (Potong Faktur)</option>
                <option value="GANTI_BARANG">Tukar Barang Baru</option>
                <option value="REFUND_DANA">Refund Dana</option>
              </select>
            </div>
          }
        >
          <div className="w-full">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">TANGGAL RETUR</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[150px]">NO. RETUR</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[170px]">SUPPLIER</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px]">NO. PO REF</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px]">NO. INBOUND (GRN)</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px] text-right">TOTAL QTY</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px] text-center">KOMPENSASI</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px] text-right">NILAI KLAIM</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-center">STATUS</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[80px] text-right">AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={11} className="py-8 text-center">
                      <DnaEmptyState
                        title="Tidak Ada Retur Pembelian"
                        description="Belum ada data retur pembelian atau tidak ada hasil yang sesuai dengan filter."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredList.map((row, idx) => (
                    <DnaTableRow
                      key={row.id}
                      onClick={() => onSelectReturn(row)}
                      className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <DnaTd className="px-4 py-2.5 text-center text-slate-400 tabular-nums text-[11.5px]">
                        {idx + 1}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-slate-700 text-xs tabular-nums">
                        {row.returnDate}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 font-bold text-slate-900 text-xs tabular-nums">
                        {row.returnNumber}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 font-medium text-slate-900 text-xs">
                        {row.vendorName}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-slate-600 text-xs tabular-nums">
                        {row.poNumber || "-"}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-slate-600 text-xs tabular-nums">
                        {row.grnNumber || "-"}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right font-medium text-slate-800 text-xs tabular-nums">
                        {row.totalQty.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        {getCompensationBadge(row.compensationType)}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right">
                        <span className="tabular-nums font-semibold text-slate-900 block text-xs">
                          Rp {row.totalAmount.toLocaleString("id-ID")}
                        </span>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        {getStatusBadge(row.status)}
                      </DnaTd>
                      <DnaTd className="pr-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => onSelectReturn(row)}
                          >
                            Detail
                          </DnaButton>
                          {row.status === "WAITING_APPROVAL" && (
                            <DnaButton
                              variant="primary"
                              size="sm"
                              loading={isApprovePending}
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => onApproveVendor(row.id)}
                            >
                              Setujui
                            </DnaButton>
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
      )}
    </>
  );
}
