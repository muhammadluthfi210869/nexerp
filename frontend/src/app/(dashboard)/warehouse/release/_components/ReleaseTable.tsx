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
import type { DeliveryOrder } from "../_types/release.types";
import { ReleaseStatusBadge, FinancialGateBadge } from "./ReleaseBadges";

interface ReleaseTableProps {
  filteredList: DeliveryOrder[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
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
  clientOptions: string[];
  courierOptions: string[];
  onResetAll: () => void;
  onSelectDelivery: (delivery: DeliveryOrder) => void;
  onPrintDelivery?: (delivery: DeliveryOrder) => void;
}

export function ReleaseTable({
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
  clientOptions,
  courierOptions,
  onResetAll,
  onSelectDelivery,
  onPrintDelivery,
}: ReleaseTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari No. Surat Jalan, SO, Klien, Brand, Ekspedisi, Resi...",
        statusOptions: [
          { value: "READY", label: "Siap Kirim", dotColor: "bg-blue-500" },
          { value: "IN_TRANSIT", label: "Dalam Pengiriman", dotColor: "bg-amber-500" },
          { value: "DELIVERED", label: "Terkirim (POD Diterima)", dotColor: "bg-emerald-500" },
          { value: "ON_HOLD", label: "Tertahan (Financial Hold)", dotColor: "bg-rose-500" },
        ],
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Semua Status Kirim",
        filterColumns: [
          {
            key: "financialGate",
            label: "Financial Gate",
            type: "select",
            options: ["LUNAS", "DP_APPROVED", "ON_HOLD"],
          },
          {
            key: "clientName",
            label: "Pelanggan / Klien",
            type: "select",
            options: clientOptions,
          },
          {
            key: "courierName",
            label: "Ekspedisi / Kurir",
            type: "select",
            options: courierOptions,
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
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. Surat Jalan (SJ)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[105px]">Tanggal Kirim</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[170px]">Pelanggan / Klien</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">Nama Brand</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[120px]">No. Sales Order (SO)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[140px]">Ekspedisi / Driver</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[120px]">No. Resi / Plat</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Total Unit (Pcs)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[95px]">Box Karton</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Financial Gate</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Status Kirim</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[65px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={13} className="py-12 text-center text-slate-400">
                  <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada data surat jalan pengiriman yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredList.map((row, idx) => (
                <DnaTableRow
                  key={row.id}
                  onClick={() => onSelectDelivery(row)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                >
                  {/* 1: # Index */}
                  <DnaTd className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </DnaTd>

                  {/* 2: No. Surat Jalan (SJ) */}
                  <DnaTd className="px-3 py-2 font-mono font-bold text-xs text-blue-700">
                    {row.deliveryNumber}
                  </DnaTd>

                  {/* 3: Tanggal Kirim */}
                  <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">
                    {row.shipDate}
                  </DnaTd>

                  {/* 4: Pelanggan / Klien */}
                  <DnaTd className="px-3 py-2 text-slate-800 font-medium truncate max-w-[190px]">
                    {row.clientName}
                  </DnaTd>

                  {/* 5: Nama Brand */}
                  <DnaTd className="px-3 py-2 text-slate-700 font-medium truncate max-w-[140px]">
                    {row.brandName}
                  </DnaTd>

                  {/* 6: No. Sales Order (SO) */}
                  <DnaTd className="px-3 py-2 font-mono text-xs text-slate-700">
                    {row.soNumber}
                  </DnaTd>

                  {/* 7: Ekspedisi / Driver */}
                  <DnaTd className="px-3 py-2 text-slate-700 truncate max-w-[150px]">
                    {row.courierName}
                  </DnaTd>

                  {/* 8: No. Resi / Plat */}
                  <DnaTd className="px-3 py-2 font-mono text-xs text-slate-600">
                    {row.vehicleOrTrackingNo}
                  </DnaTd>

                  {/* 9: Total Unit (Pcs) */}
                  <DnaTd className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                    {row.totalUnits.toLocaleString("id-ID")}
                  </DnaTd>

                  {/* 10: Box Karton */}
                  <DnaTd className="px-3 py-2 text-right text-slate-600 font-medium tabular-nums">
                    {row.totalBoxes} Box
                  </DnaTd>

                  {/* 11: Financial Gate */}
                  <DnaTd className="px-3 py-2 text-center">
                    <FinancialGateBadge status={row.financialGateStatus} />
                  </DnaTd>

                  {/* 12: Status Kirim */}
                  <DnaTd className="px-3 py-2 text-center">
                    <ReleaseStatusBadge status={row.deliveryStatus} />
                  </DnaTd>

                  {/* 13: Aksi */}
                  <DnaTd
                    className="px-3 py-2 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {onPrintDelivery && (
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onPrintDelivery(row)}
                          className="text-slate-400 hover:text-blue-600 h-7 w-7 p-0"
                          title="Cetak Surat Jalan (DO)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </DnaButton>
                      )}
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectDelivery(row)}
                        className="text-slate-400 hover:text-slate-600 h-7 w-7 p-0"
                        title="Inspeksi & Detail"
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
