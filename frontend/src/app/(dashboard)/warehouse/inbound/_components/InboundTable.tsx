import React from "react";
import { Truck, Eye, Printer } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
} from "@/components/dna";
import type { GoodsReceiptNote } from "../_types/inbound.types";
import { InboundStatusBadge } from "./InboundStatusBadge";

interface InboundTableProps {
  filteredList: GoodsReceiptNote[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: any;
  onDateModeChange: (mode: any) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  vendorOptions: string[];
  warehouseOptions: string[];
  onResetAll: () => void;
  onSelectGrn: (grn: GoodsReceiptNote) => void;
  onPrint?: (grn: GoodsReceiptNote) => void;
}

export function InboundTable({
  filteredList,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onSelectStatus,
  selectedColumn,
  onSelectColumn,
  filterValue,
  onFilterValueChange,
  dateMode,
  onDateModeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  vendorOptions,
  warehouseOptions,
  onResetAll,
  onSelectGrn,
  onPrint,
}: InboundTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari No. GRN, PO Ref, Surat Jalan, Supplier...",
        statusOptions: [
          { value: "APPROVED", label: "Lulus QC (Approved)", dotColor: "bg-emerald-500" },
          { value: "PENDING_QC", label: "Menunggu Uji QC", dotColor: "bg-amber-500" },
          { value: "HAS_REJECT", label: "Ada Barang Reject", dotColor: "bg-orange-500" },
          { value: "REJECTED", label: "Ditolak Total", dotColor: "bg-rose-500" },
        ],
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Semua Status QC / GRN",
        filterColumns: [
          {
            key: "vendorName",
            label: "Supplier / Vendor",
            type: "select",
            options: vendorOptions,
          },
          {
            key: "warehouseName",
            label: "Gudang Penerima",
            type: "select",
            options: warehouseOptions,
          },
        ],
        selectedColumn,
        onSelectColumn,
        filterValue,
        onFilterValueChange,
        enableDateFilter: true,
        dateMode,
        onDateModeChange,
        startDate,
        onStartDateChange,
        endDate,
        onEndDateChange,
        onResetAll,
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[45px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. GRN</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Tanggal Penerimaan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[180px]">Supplier / Vendor</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. PO Ref</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. Surat Jalan (SJ)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[160px]">Gudang Penerima</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[130px]">Qty Bagus (Real Stok)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[100px]">Qty Reject</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Qty Free (Bonus)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Status QC</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[65px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={12} className="py-12 text-center text-slate-400">
                  <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada dokumen penerimaan barang masuk (GRN) yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredList.map((row, idx) => (
                <DnaTableRow
                  key={row.id}
                  onClick={() => onSelectGrn(row)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                >
                  {/* 1: # Index */}
                  <DnaTd className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </DnaTd>

                  {/* 2: No. GRN */}
                  <DnaTd className="px-3 py-2 font-mono font-bold text-xs text-blue-700">
                    {row.grnNumber}
                  </DnaTd>

                  {/* 3: Tanggal Penerimaan */}
                  <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">
                    {row.receiveDate}
                  </DnaTd>

                  {/* 4: Supplier / Vendor */}
                  <DnaTd className="px-3 py-2 text-slate-800 font-medium truncate max-w-[200px]">
                    {row.vendorName}
                  </DnaTd>

                  {/* 5: No. PO Ref */}
                  <DnaTd className="px-3 py-2 font-mono text-xs text-slate-700">
                    {row.poNumber}
                  </DnaTd>

                  {/* 6: No. Surat Jalan (SJ) */}
                  <DnaTd className="px-3 py-2 font-mono text-xs text-slate-700">
                    {row.deliveryOrderNo}
                  </DnaTd>

                  {/* 7: Gudang Penerima */}
                  <DnaTd className="px-3 py-2 text-slate-700 truncate max-w-[170px]">
                    {row.warehouseName.split("(")[0]}
                  </DnaTd>

                  {/* 8: Qty Bagus (Real Stok) */}
                  <DnaTd className="px-3 py-2 text-right font-bold text-emerald-700 tabular-nums">
                    {row.totalQtyGood.toLocaleString("id-ID")}
                  </DnaTd>

                  {/* 9: Qty Reject */}
                  <DnaTd className="px-3 py-2 text-right font-medium tabular-nums">
                    {row.totalQtyReject > 0 ? (
                      <span className="text-red-600 font-bold">
                        {row.totalQtyReject.toLocaleString("id-ID")}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </DnaTd>

                  {/* 10: Qty Free (Bonus) */}
                  <DnaTd className="px-3 py-2 text-right font-medium tabular-nums">
                    {row.totalQtyFree > 0 ? (
                      <span className="text-purple-700 font-bold">
                        +{row.totalQtyFree.toLocaleString("id-ID")}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </DnaTd>

                  {/* 11: Status QC */}
                  <DnaTd className="px-3 py-2 text-center">
                    <InboundStatusBadge status={row.status} />
                  </DnaTd>

                  {/* 12: Aksi */}
                  <DnaTd
                    className="px-3 py-2 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {onPrint && (
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onPrint(row)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                          title="Cetak Dokumen LPB (A4)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </DnaButton>
                      )}
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectGrn(row)}
                        className="text-slate-400 hover:text-slate-700 h-7 w-7 p-0"
                        title="Lihat Detail LPB & QC"
                      >
                        <Eye className="w-4 h-4" />
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
