import React from "react";
import { Package, Eye, CheckCircle2, Send } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { MaterialRequisition } from "../_types/requisition.types";
import { getStatusBadge } from "./RequisitionStatusBadge";

interface RequisitionTableProps {
  dataList: MaterialRequisition[];
  filteredList: MaterialRequisition[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  warehouseFilter: string;
  setWarehouseFilter: (filter: string) => void;
  onViewDetail: (req: MaterialRequisition) => void;
  onApprove: (id: string) => void;
  onHandoverComplete: (id: string) => void;
}

export const RequisitionTable: React.FC<RequisitionTableProps> = ({
  dataList,
  filteredList,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  warehouseFilter,
  setWarehouseFilter,
  onViewDetail,
  onApprove,
  onHandoverComplete,
}) => {
  return (
    <DnaDataTableCard
      title="Daftar Bon Permintaan Barang (Material Requisitions)"
        description="Semua pengeluaran stok harus melalui verifikasi ketersediaan dan serah terima resmi."
        count={filteredList.length}
        totalItems={dataList.length}
        toolbarProps={{
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari No Req, SPK, keperluan, pemohon...",
          statusOptions: [
            { value: "ALL", label: `Semua (${dataList.length})` },
            {
              value: "PENDING",
              label: `Menunggu (${dataList.filter((d) => d.status === "PENDING").length})`,
            },
            {
              value: "APPROVED",
              label: `Siap Serah (${dataList.filter((d) => d.status === "APPROVED").length})`,
            },
            {
              value: "COMPLETED",
              label: `Selesai (${dataList.filter((d) => d.status === "COMPLETED").length})`,
            },
            {
              value: "REJECTED",
              label: `Ditolak (${dataList.filter((d) => d.status === "REJECTED").length})`,
            },
          ],
          selectedStatus: activeTab,
          onSelectStatus: setActiveTab,
          statusPlaceholder: "Filter Status Bon",
          onResetAll: () => {
            setSearchQuery("");
            setActiveTab("ALL");
            setWarehouseFilter("ALL");
          },
          hasActiveFilters: searchQuery !== "" || activeTab !== "ALL" || warehouseFilter !== "ALL",
        }}
        actions={
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter Gudang"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Gudang Asal</option>
              <option value="WH-01">Gudang Bahan Baku (WH-01)</option>
              <option value="WH-02">Gudang Kemas (WH-02)</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-sm text-slate-600">
            <DnaTableHead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <DnaTableRow>
                <DnaTh className="py-3 px-4">No. Permintaan</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal</DnaTh>
                <DnaTh className="py-3 px-4">Gudang Asal</DnaTh>
                <DnaTh className="py-3 px-4">Tujuan / Divisi</DnaTh>
                <DnaTh className="py-3 px-4">No. SPK</DnaTh>
                <DnaTh className="py-3 px-4">Keperluan</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Item</DnaTh>
                <DnaTh className="py-3 px-4">Pemohon</DnaTh>
                <DnaTh className="py-3 px-4">Status</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={10} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada dokumen permintaan barang yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredList.map((row) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 font-bold text-indigo-600 text-xs whitespace-nowrap tabular-nums">
                      {row.requisitionNumber}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs whitespace-nowrap tabular-nums">
                      {row.requestDate}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                      {row.fromWarehouse}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {row.toDivision}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-medium text-slate-900 whitespace-nowrap tabular-nums">
                      {row.spkNumber}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs text-slate-700 max-w-xs truncate">
                      {row.purpose}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center text-xs font-semibold text-slate-800 tabular-nums">
                      {row.totalItems} Material
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs text-slate-600">
                      {row.requestedBy}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => onViewDetail(row)}
                        >
                          Detail
                        </DnaButton>
                        {row.status === "PENDING" && (
                          <DnaButton
                            variant="primary"
                            size="sm"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => onApprove(row.id)}
                          >
                            Setujui
                          </DnaButton>
                        )}
                        {row.status === "APPROVED" && (
                          <DnaButton
                            variant="secondary"
                            size="sm"
                            icon={<Send className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={() => onHandoverComplete(row.id)}
                          >
                            Serah Terima
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
};
