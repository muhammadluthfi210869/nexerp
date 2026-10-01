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
  formatDate,
  leadStatusVariant,
} from "../_types/client-manager.types";

interface ClientRoTableProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roList: LeadRow[];
  ordersByLead: Map<string, SalesOrderRow[]>;
  onOpenLead: (lead: LeadRow, group: GroupKey) => void;
}

export function ClientRoTable({
  searchQuery,
  onSearchChange,
  roList,
  ordersByLead,
  onOpenLead,
}: ClientRoTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari pelanggan WON_DEAL, brand, PIC...",
      }}
      paginationProps={{
        currentPage: 1,
        totalPages: 1,
        totalEntries: roList.length,
        pageSize: 10,
        onPageChange: () => {},
      }}
    >
      {roList.length === 0 ? (
        <div className="p-6">
          <DnaEmptyState
            title="Belum Ada Klien WON_DEAL"
            description="Tidak ada lead berstatus WON_DEAL pada /bussdev/leads/group/ro."
          />
        </div>
      ) : (
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
              <DnaTh className="p-3.5 w-10 text-center text-slate-400">#</DnaTh>
              <DnaTh className="p-3.5">PELANGGAN & BRAND</DnaTh>
              <DnaTh className="p-3.5 w-48">ORDER & BATCH</DnaTh>
              <DnaTh className="p-3.5 w-44 text-right">NILAI ESTIMASI</DnaTh>
              <DnaTh className="p-3.5 w-40 text-center">PIC & MENANG</DnaTh>
              <DnaTh className="p-3.5 w-24 text-center">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {roList.map((r, idx) => {
              const orders = ordersByLead.get(r.id) || [];
              return (
                <DnaTableRow
                  key={r.id}
                  onClick={() => onOpenLead(r, "ro")}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                  <DnaTd className="p-3.5">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {r.clientName}
                    </div>
                    <div className="text-[11px] text-slate-500">{r.brandName}</div>
                  </DnaTd>
                  <DnaTd className="p-3.5">
                    <div className="tabular-nums font-bold text-blue-600">
                      {orders.length > 0 ? orders.map((o) => o.orderNumber).join(", ") : "Belum ada SO"}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        Batch #{r.orderCount || 1}
                      </span>{" "}
                      â€¢ PIC: {r.picName}
                    </div>
                  </DnaTd>
                  <DnaTd className="p-3.5 text-right tabular-nums font-bold text-slate-900">
                    {formatRupiah(r.estimatedValue)}
                  </DnaTd>
                  <DnaTd className="p-3.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${leadStatusVariant(r.status)}`}
                    >
                      {r.status}
                    </span>
                    <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                      {formatDate(r.wonAt)}
                    </div>
                  </DnaTd>
                  <DnaTd className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onOpenLead(r, "ro")}
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
