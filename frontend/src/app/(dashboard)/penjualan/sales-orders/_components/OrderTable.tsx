"use client";

import React from "react";
import { Lock, Unlock, Eye, Printer } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
  DnaButton,
  DnaBadge,
} from "@/components/dna";
import type { SalesOrderItem } from "../_types/sales-orders.types";

interface OrderTableProps {
  filteredOrders: SalesOrderItem[];
  totalOrders: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusOptions: any[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  filterColumns: any[];
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: "ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM";
  onDateModeChange: (mode: any) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onResetAll: () => void;
  onOpenCreate: () => void;
  onSelectDetail: (so: SalesOrderItem) => void;
  onToggleGatekeeper: (so: SalesOrderItem) => void;
  onPrint?: (so: SalesOrderItem) => void;
}

export function OrderTable({
  filteredOrders,
  totalOrders,
  searchQuery,
  onSearchChange,
  statusOptions,
  selectedStatus,
  onSelectStatus,
  filterColumns,
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
  onResetAll,
  onOpenCreate,
  onSelectDetail,
  onToggleGatekeeper,
  onPrint,
}: OrderTableProps) {
  return (
    <DnaDataTableCard
      count={filteredOrders.length}
      totalItems={totalOrders}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari no SO, nama customer, brand...",
        statusOptions,
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Status Order",
        filterColumns,
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
      <div className="overflow-x-auto w-full">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold uppercase tracking-wider select-none">
              <DnaTh className="px-3 py-2.5 w-[45px] text-center text-slate-400">#</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[110px]">Tanggal SO</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[150px]">No. Sales Order</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[160px]">Pelanggan / Customer</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[130px]">Nama Brand</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[130px]">Kategori Order</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[110px]">Deadline Final</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[130px] text-right">Total Nilai (Rp)</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[120px] text-center">Gatekeeper DO</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[120px] text-center">Status Order</DnaTh>
              <DnaTh className="pr-3 py-2.5 w-[65px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredOrders.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada transaksi sales order yang sesuai dengan filter atau pencarian Anda.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredOrders.map((so, idx) => (
                <DnaTableRow
                  key={so.id}
                  onClick={() => onSelectDetail(so)}
                  className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                >
                  <DnaTd className="px-3 py-2.5 text-center text-slate-400 tabular-nums text-[12px]">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="tabular-nums text-[12px] text-slate-700 font-mono">{so.orderDate}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <DnaCell.Code code={so.soCode} />
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="text-[12px] font-semibold text-slate-900 block truncate">{so.customerName}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="text-[12px] text-slate-700 block truncate">{so.brandName}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <DnaBadge variant="neutral">
                      {so.category.replace(/_/g, " ")}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="tabular-nums text-[11.5px] text-slate-700">{so.deadlineFinal}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5 text-right">
                    <DnaCell.Numeric value={so.grandTotal} prefix="Rp " />
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleGatekeeper(so)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                        so.gatekeeperStatus === "RELEASED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                      title="Klik untuk ubah gatekeeper logistik"
                    >
                      {so.gatekeeperStatus === "RELEASED" ? (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          RELEASED
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-slate-500" />
                          HELD
                        </>
                      )}
                    </button>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        so.approvalStatus === "COMPLETED"
                          ? "success"
                          : so.approvalStatus === "IN_PRODUCTION"
                          ? "info"
                          : so.approvalStatus === "APPROVED"
                          ? "info"
                          : "warning"
                      }
                    >
                      {so.approvalStatus.replace(/_/g, " ")}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="pr-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center gap-1">
                      {onPrint && (
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                          onClick={() => onPrint(so)}
                          title="Cetak Sales Order (A4)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </DnaButton>
                      )}
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        onClick={() => onSelectDetail(so)}
                        title="Lihat Detail & SLA"
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
