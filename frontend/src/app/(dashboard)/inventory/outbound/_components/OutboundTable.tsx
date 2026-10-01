import React from "react";
import { Search, Eye, Printer } from "lucide-react";
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
import { DeliveryOutItem } from "../_types/outbound.types";
import { OutboundStatusBadge } from "./OutboundBadges";

interface OutboundTableProps {
  filteredData: DeliveryOutItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onViewDetail: (item: DeliveryOutItem) => void;
  onPrint: (item: DeliveryOutItem) => void;
}

export function OutboundTable({
  filteredData,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onViewDetail,
  onPrint,
}: OutboundTableProps) {
  return (
    <>
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no DO, sales order, pelanggan, ekspedisi..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="DELIVERED">Diterima</option>
            <option value="SHIPPED">Dalam Perjalanan</option>
            <option value="PACKING">Packing Gudang</option>
          </select>
        </div>
      </div>

      {/* 1:1 Table (Exactly 9 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Pengiriman Barang (Delivery Outbound)">
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-12 text-center">#</DnaTh>
                <DnaTh className="py-3 px-4">Kode Pengiriman</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal</DnaTh>
                <DnaTh className="py-3 px-4">No. Sales</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal Sales</DnaTh>
                <DnaTh className="py-3 px-4">Customer</DnaTh>
                <DnaTh className="py-3 px-4">Pembuat</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Status</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data pengiriman barang ditemukan
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-3 px-4 font-semibold text-blue-600">{item.code}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.date}</DnaTd>
                    <DnaTd className="py-3 px-4 font-medium text-slate-900">{item.soNumber}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.soDate}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-900 font-medium">{item.customer}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.creator}</DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <OutboundStatusBadge status={item.status} />
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                          onClick={() => onViewDetail(item)}
                        >
                          Lihat
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Printer className="h-3.5 w-3.5 text-slate-600" />}
                          onClick={() => onPrint(item)}
                        >
                          Print
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
    </>
  );
}
