"use client";

import React from "react";
import {
  DnaDataTableCard,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import {
  LeadRow,
  SalesOrderRow,
  GroupKey,
  formatRupiah,
  leadStatusVariant,
} from "../_types/client-manager.types";

interface ClientProductionTableProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  productionList: LeadRow[];
  ordersByLead: Map<string, SalesOrderRow[]>;
  onOpenLead: (lead: LeadRow, group: GroupKey) => void;
}

export function ClientProductionTable({
  searchQuery,
  onSearchChange,
  productionList,
  ordersByLead,
  onOpenLead,
}: ClientProductionTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari pelanggan, brand, PIC BusDev...",
      }}
      paginationProps={{
        currentPage: 1,
        totalPages: 1,
        totalEntries: productionList.length,
        pageSize: 10,
        onPageChange: () => {},
      }}
    >
      {productionList.length === 0 ? (
        <div className="p-6">
          <DnaEmptyState
            title="Belum Ada Projek Produksi"
            description="Tidak ada lead pada fase produksi (SPK_SIGNED / PRODUCTION_PLAN / READY_TO_SHIP) di /bussdev/leads/group/production."
          />
        </div>
      ) : (
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
              <DnaTh className="p-3.5 w-10 text-center text-slate-400">#</DnaTh>
              <DnaTh className="p-3.5">PELANGGAN & BRAND</DnaTh>
              <DnaTh className="p-3.5 w-48">SALES ORDER & BUSDEV</DnaTh>
              <DnaTh className="p-3.5 w-44 text-right">NILAI KONTRAK</DnaTh>
              <DnaTh className="p-3.5 w-40 text-center">STATUS PROJEK</DnaTh>
              <DnaTh className="p-3.5 w-24 text-center">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {productionList.map((p, idx) => {
              const orders = ordersByLead.get(p.id) || [];
              return (
                <DnaTableRow
                  key={p.id}
                  onClick={() => onOpenLead(p, "production")}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                  <DnaTd className="p-3.5">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {p.clientName}
                    </div>
                    <div className="text-[11px] text-slate-500">{p.brandName}</div>
                  </DnaTd>
                  <DnaTd className="p-3.5">
                    <div className="tabular-nums font-bold text-blue-600">
                      {orders.length > 0
                        ? orders.map((o) => o.orderNumber).join(", ")
                        : "Belum ada SO"}
                    </div>
                    <div className="text-[11px] text-slate-400">PIC: {p.picName}</div>
                  </DnaTd>
                  <DnaTd className="p-3.5 text-right tabular-nums font-bold text-slate-900">
                    {formatRupiah(p.estimatedValue)}
                  </DnaTd>
                  <DnaTd className="p-3.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${leadStatusVariant(p.status)}`}
                    >
                      {p.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {p.spkFileUrl ? "SPK terunggah" : "SPK belum ada"}
                    </div>
                  </DnaTd>
                  <DnaTd className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onOpenLead(p, "production")}
                      className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Detail
                    </button>
                  </DnaTd>
                </DnaTableRow>
              );
            })}
          </DnaTableBody>
        </DnaTable>
      )}
    </DnaDataTableCard>
  );
}
