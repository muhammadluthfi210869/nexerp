"use client";

import React from "react";
import { Factory, Layers, Eye, ArrowRight } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import { WorkOrderItem, STAGE_LABELS } from "../_types/work-orders.types";

interface WorkOrdersTableProps {
  filteredWorkOrders: WorkOrderItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onViewDetail: (wo: WorkOrderItem) => void;
  onAdvanceStage: (wo: WorkOrderItem) => void;
}

export function WorkOrdersTable({
  filteredWorkOrders,
  isLoading,
  searchQuery,
  onSearchChange,
  onViewDetail,
  onAdvanceStage,
}: WorkOrdersTableProps) {
  return (
    <DnaDataTableCard
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Cari No. SPK, Batch, Klien, Brand, Produk..."
    >
      <div className="w-full">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="py-3 px-4 w-[18%]">No. SPK & Batch</DnaTh>
              <DnaTh className="py-3 px-4 w-[24%]">Klien & Brand</DnaTh>
              <DnaTh className="py-3 px-4 w-[24%]">Produk & Target</DnaTh>
              <DnaTh className="py-3 px-4 w-[14%]">Jadwal & PIC</DnaTh>
              <DnaTh className="py-3 px-4 w-[14%]">Tahap & Progress</DnaTh>
              <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  Memuat data Work Orders...
                </DnaTd>
              </DnaTableRow>
            ) : filteredWorkOrders.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  <Factory className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada data Work Order yang sesuai dengan filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredWorkOrders.map((wo) => {
                const stageInfo = STAGE_LABELS[wo.currentStage] || {
                  label: wo.currentStage,
                  badge: "default",
                };
                return (
                  <DnaTableRow key={wo.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-bold text-slate-900 truncate">
                        {wo.code}
                      </p>
                      <p className="text-[11px] text-blue-600 tabular-nums flex items-center gap-1 truncate">
                        <Layers className="w-3 h-3 shrink-0" /> {wo.batchNumber}
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">
                        {wo.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {wo.brandName}
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">
                        {wo.productName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {wo.targetQty.toLocaleString()} Pcs â€¢ {wo.netto}
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs text-slate-700 truncate">
                        {wo.targetDate}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{wo.picOperator}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <div className="flex items-center gap-1.5">
                        <DnaBadge variant={stageInfo.badge}>{stageInfo.label}</DnaBadge>
                      </div>
                      <p className="text-[10px] text-slate-500 tabular-nums mt-0.5 truncate">
                        {wo.progressPct}% â€¢ G:{wo.goodQty} R:{wo.rejectQty}
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(wo)}
                          title="Lihat Detail SPK"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </DnaButton>
                        {wo.currentStage !== "FINISHED" && (
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onAdvanceStage(wo)}
                            title="Majukan Tahap Produksi"
                          >
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                          </DnaButton>
                        )}
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
