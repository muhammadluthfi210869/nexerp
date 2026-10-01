import React from "react";
import { CreditCard } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import { ApBill } from "../_types/bayar-pembelian.types";

interface PaymentTableProps {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filteredList: ApBill[];
  onOpenPayDrawer: (bill: ApBill) => void;
}

export function PaymentTable({
  isLoading,
  isError,
  refetch,
  searchQuery,
  onSearchChange,
  filteredList,
  onOpenPayDrawer,
}: PaymentTableProps) {
  return (
    <>
      {/* Main Table Card */}
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Data Tagihan AP"
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
          searchPlaceholder="Cari No Faktur, PO, supplier..."
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Tgl Faktur</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">No. Faktur</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[150px]">No. PO Ref</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[170px]">Supplier / Vendor</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Jatuh Tempo</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px] text-center">Status Aging</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Nilai Tagihan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px] text-right">Debit Note</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Sisa Hutang</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-center">Status</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[90px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={12} className="py-8 text-center">
                      <DnaEmptyState
                        title="Tidak Ada Tagihan"
                        description="Tidak ada faktur pembelian yang perlu dibayar pada kategori filter ini."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredList.map((row, idx) => (
                    <DnaTableRow
                      key={row.id}
                      onClick={() => onOpenPayDrawer(row)}
                      className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <DnaTd className="px-4 py-2.5 text-center text-slate-400 tabular-nums text-xs font-mono">
                        {idx + 1}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Text text={row.invoiceDate || row.dueDate} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Code code={row.billNumber} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Code code={row.poNumber} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{row.vendorName}</span>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Text text={row.dueDate} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        {row.daysToDue < 0 ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            Overdue {Math.abs(row.daysToDue)} Hari
                          </span>
                        ) : row.daysToDue <= 3 ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            H-{row.daysToDue} Kritis
                          </span>
                        ) : row.daysToDue <= 7 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                            H-{row.daysToDue} Siaga
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">
                            H-{row.daysToDue}
                          </span>
                        )}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right">
                        <DnaCell.Numeric value={row.totalAmount} prefix="Rp " />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right">
                        {row.availableDebitNote > 0 ? (
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            - Rp {row.availableDebitNote.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">â€”</span>
                        )}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right">
                        <DnaCell.Numeric value={row.remainingAmount} prefix="Rp " className="text-rose-600 font-bold" />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        <DnaBadge variant={row.status === "PARTIAL" ? "warning" : "critical"}>
                          {row.status === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="pr-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="primary"
                            size="sm"
                            icon={<CreditCard className="w-3.5 h-3.5" />}
                            onClick={() => onOpenPayDrawer(row)}
                            title="Eksekusi Pembayaran"
                          >
                            Bayar
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
      )}
    </>
  );
}
