import React from "react";
import { Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaLoadingSkeleton,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import { Receipt } from "../_types/receiving.types";

interface ReceivingTableProps {
  receipts: Receipt[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectReceipt: (receipt: Receipt) => void;
}

export function ReceivingTable({
  receipts,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelectReceipt,
}: ReceivingTableProps) {
  if (isLoading) {
    return <DnaLoadingSkeleton rows={5} />;
  }

  return (
    <DnaDataTableCard
      toolbarProps={{
        searchProps: {
          value: searchQuery,
          onChange: onSearchChange,
          placeholder: "Cari ID GRN, PO, Pemasok...",
        },
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-4 py-2.5 w-[160px]">No. GRN</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[150px]">No. Purchase Order</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px]">Tgl Terima</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[180px]">Supplier / Vendor</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[120px] text-right">Qty Bagus</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px] text-right">Qty Reject</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[120px] text-center">Status QC</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[120px] text-center">Status Siklus</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {receipts.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={9} className="py-8 text-center">
                  <DnaEmptyState
                    title="Belum Ada Penerimaan Barang"
                    description="Belum ada barang yang diterima pada filter ini."
                  />
                </DnaTd>
              </DnaTableRow>
            ) : (
              receipts.map((row) => (
                <DnaTableRow
                  key={row.id}
                  onClick={() => onSelectReceipt(row)}
                  className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Code code={row.id} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Code code={row.poId} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Text text={row.date} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{row.vendor}</span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right tabular-nums tabular-nums">
                    <span className="text-[12px] font-semibold text-emerald-700">
                      {row.qtyBagus.toLocaleString("id-ID")}
                    </span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right tabular-nums tabular-nums">
                    <span className={`text-[12px] font-semibold ${row.qtyReject > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {row.qtyReject.toLocaleString("id-ID")}
                    </span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        row.qc === "PASSED"
                          ? "success"
                          : row.qc === "WAITING"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {row.qc === "PASSED" ? "Lolos QC" : row.qc === "WAITING" ? "Menunggu QC" : "Gagal QC"}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    <DnaBadge variant={row.status === "VERIFIED" ? "info" : "neutral"}>
                      {row.status === "VERIFIED" ? "Terverifikasi" : "Pending"}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right">
                    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        onClick={() => onSelectReceipt(row)}
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
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
