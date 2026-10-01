import React from "react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaCell,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import { LostProspectItem, ChurnedClientItem, REASON_LABELS } from "../_types/lost.types";

interface LostTableProps {
  activeTab: string;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredProspects: LostProspectItem[];
  filteredChurn: ChurnedClientItem[];
  totalLostCount: number;
  totalChurnCount: number;
  onSelectProspect: (item: LostProspectItem) => void;
  onSelectChurn: (item: ChurnedClientItem) => void;
}

export function LostTable({
  activeTab,
  loading,
  searchQuery,
  onSearchChange,
  filteredProspects,
  filteredChurn,
  totalLostCount,
  totalChurnCount,
  onSelectProspect,
  onSelectChurn,
}: LostTableProps) {
  return (
    <DnaDataTableCard
      count={activeTab === "prospects" ? filteredProspects.length : filteredChurn.length}
      totalItems={activeTab === "prospects" ? totalLostCount : totalChurnCount}
      toolbarProps={{
        searchPlaceholder: "Cari brand, nama klien, atau produk...",
        searchValue: searchQuery,
        onSearchChange: onSearchChange,
      }}
    >
      <div className="w-full">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Memuat data analisis pembatalan...
          </div>
        ) : activeTab === "prospects" ? (
          filteredProspects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Belum ada data prospek batal tercatat di sistem.
            </div>
          ) : (
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <DnaTh className="py-3 px-3 w-[24%]">Brand & Produk</DnaTh>
                  <DnaTh className="py-3 px-3 w-[22%]">Pelanggan & Kontak</DnaTh>
                  <DnaTh className="py-3 px-3 w-[18%]">PIC BD & Tgl Sample</DnaTh>
                  <DnaTh className="py-3 px-3 w-[16%] text-right">Est. Value Deal</DnaTh>
                  <DnaTh className="py-3 px-3 w-[10%] text-center">Alasan Lost</DnaTh>
                  <DnaTh className="py-3 px-3 w-[10%] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredProspects.map((item) => {
                  const reason = REASON_LABELS[item.lostReason] || {
                    label: item.lostReason,
                    status: "neutral",
                  };
                  return (
                    <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <DnaTd className="py-3 px-3">
                        <p className="font-semibold text-slate-900 truncate">{item.brandName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.productName}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-3">
                        <p className="font-medium text-slate-800 truncate">{item.clientName}</p>
                        <p className="tabular-nums text-[11px] text-slate-400 truncate">{item.phoneNo || "â€”"}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-3">
                        <p className="text-slate-800 truncate">{item.bdName}</p>
                        <p className="tabular-nums text-[10px] text-slate-400">Sample: {item.sampleDate}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-right">
                        <p className="tabular-nums font-bold text-slate-900">{formatCurrency(item.estimatedValue)}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.sampleStatus}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-center">
                        <DnaCell.Badge label={reason.label} status={reason.status} />
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <DnaButton variant="ghost" size="sm" onClick={() => onSelectProspect(item)}>
                            Detail
                          </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  );
                })}
              </DnaTableBody>
            </DnaTable>
          )
        ) : filteredChurn.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Belum ada data klien dormant tercatat di sistem.
          </div>
        ) : (
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <DnaTh className="py-3 px-3 w-[25%]">Pelanggan & Brand</DnaTh>
                <DnaTh className="py-3 px-3 w-[20%]">Total Order & Jeda</DnaTh>
                <DnaTh className="py-3 px-3 w-[22%]">Order Terakhir & Produk</DnaTh>
                <DnaTh className="py-3 px-3 w-[15%] text-right">Lifetime Value</DnaTh>
                <DnaTh className="py-3 px-3 w-[8%] text-center">Status</DnaTh>
                <DnaTh className="py-3 px-3 w-[10%] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredChurn.map((item) => (
                <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <DnaTd className="py-3 px-3">
                    <p className="font-semibold text-slate-900 truncate">{item.clientName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{item.brandName} â€¢ {item.phoneNo}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-3">
                    <p className="font-semibold text-slate-800">{item.totalOrders}x Order</p>
                    <p className="text-[10px] text-rose-600 font-bold">{item.inactivityMonths} Bulan Dormant</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-3">
                    <p className="tabular-nums text-slate-700">{item.lastOrderDate}</p>
                    <p className="text-[11px] text-slate-400 truncate">{item.lastProductOrdered}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-3 text-right">
                    <p className="tabular-nums font-bold text-emerald-600">{formatCurrency(item.lifetimeValue)}</p>
                    <p className="text-[10px] text-slate-400">Total Omset</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-3 text-center">
                    <DnaCell.Badge label="Dormant" status="critical" />
                  </DnaTd>
                  <DnaTd className="py-3 px-3 text-right">
                    <div className="flex justify-end gap-1">
                      <DnaButton variant="ghost" size="sm" onClick={() => onSelectChurn(item)}>
                        Detail
                      </DnaButton>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        )}
      </div>
    </DnaDataTableCard>
  );
}
