import React from "react";
import { Eye, CheckCircle2 } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
  DnaEmptyState,
  DnaButton,
} from "@/components/dna";
import type { PurchaseDp } from "../_types/dp-pembelian.types";
import { getStatusBadge } from "./getStatusBadge";

interface DpTableProps {
  filteredList: PurchaseDp[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectDp: (dp: PurchaseDp) => void;
  onApprovePayment: (id: string) => void;
}

export function DpTable({
  filteredList,
  searchQuery,
  onSearchChange,
  onSelectDp,
  onApprovePayment,
}: DpTableProps) {
  return (
    <DnaDataTableCard
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Cari No DP, No PO, vendor, akun sumber..."
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px]">Tanggal DP</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[160px]">No. DP</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[180px]">Supplier / Vendor</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[160px]">No. PO Ref</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px] text-right">Total Nilai PO</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[90px] text-center">% DP</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px] text-right">Nominal DP</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[160px]">Akun Kas/Bank</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[130px] text-center">Status</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[100px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-8 text-center">
                  <DnaEmptyState
                    title="Tidak Ada DP Pembelian"
                    description="Belum ada data uang muka pembelian atau tidak ada hasil yang sesuai dengan filter."
                  />
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredList.map((row, idx) => (
                <DnaTableRow
                  key={row.id}
                  onClick={() => onSelectDp(row)}
                  className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <DnaTd className="px-4 py-2.5 text-center text-slate-400 tabular-nums text-xs font-mono">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Text text={row.dpDate} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Code code={row.dpNumber} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{row.vendorName}</span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Code code={row.poNumber} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right">
                    <DnaCell.Numeric value={row.totalPoAmount} prefix="Rp " />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {row.dpPercentage}%
                    </span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right">
                    <DnaCell.Numeric value={row.dpAmount} prefix="Rp " className="text-emerald-600 font-bold" />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <span className="text-[12px] text-slate-600 line-clamp-1">{row.paymentAccount}</span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    {getStatusBadge(row.status)}
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => onSelectDp(row)}
                        title="Lihat Detail"
                      >
                        Detail
                      </DnaButton>
                      {row.status === "PENDING_APPROVAL" && (
                        <DnaButton
                          variant="primary"
                          size="sm"
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => onApprovePayment(row.id)}
                          title="Setujui Pembayaran DP"
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
  );
}
