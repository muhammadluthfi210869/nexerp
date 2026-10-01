"use client";

import React from "react";
import { PhoneCall, Eye, Trash2 } from "lucide-react";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { LeadConversion, CRMFilterOptions } from "../_types/crm-leads.types";

interface InboundLeadsTableProps {
  leads: LeadConversion[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  trafficFilter: string;
  setTrafficFilter: (traffic: string) => void;
  filterOptions: CRMFilterOptions;
  onExportCSV: () => void;
  onSelectLead: (lead: LeadConversion) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDeleteLead: (id: string) => void;
  getStatusBadgeStyle: (status: string) => string;
}

export function InboundLeadsTable({
  leads,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  setStatusFilter,
  trafficFilter,
  setTrafficFilter,
  filterOptions,
  onExportCSV,
  onSelectLead,
  onUpdateStatus,
  onDeleteLead,
  getStatusBadgeStyle,
}: InboundLeadsTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery: searchQuery,
        onSearchChange: onSearchChange,
        searchPlaceholder: "Cari lead, nama, brand, no HP...",
        filterColumns: [
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["New", "Contacted", "Qualified", "Lost"],
          },
          {
            key: "traffic",
            label: "Traffic",
            type: "select",
            options: filterOptions.traffics,
          },
        ],
        selectedColumn: statusFilter ? "status" : trafficFilter ? "traffic" : undefined,
        onSelectColumn: (col) => {
          if (!col) {
            setStatusFilter("");
            setTrafficFilter("");
          }
        },
        filterValue: statusFilter || trafficFilter,
        onFilterValueChange: (val) => {
          if (["New", "Contacted", "Qualified", "Lost"].includes(val)) {
            setStatusFilter(val);
          } else {
            setTrafficFilter(val);
          }
        },
        actionButton: {
          label: "Ekspor CSV",
          onClick: onExportCSV,
        },
      }}
      paginationProps={{
        currentPage: 1,
        totalPages: 1,
        totalEntries: leads.length,
        pageSize: 15,
        onPageChange: () => {},
      }}
    >
      <DnaTable>
        <DnaTableHead>
          <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
            <DnaTh className="p-3.5 w-10 text-center text-slate-400">#</DnaTh>
            <DnaTh className="p-3.5 w-36">TANGGAL & WAKTU</DnaTh>
            <DnaTh className="p-3.5">PROSPEK & PERUSAHAAN</DnaTh>
            <DnaTh className="p-3.5 w-36">KONTAK WHATSAPP</DnaTh>
            <DnaTh className="p-3.5 w-44">SUMBER & SALES</DnaTh>
            <DnaTh className="p-3.5 w-32">STATUS</DnaTh>
            <DnaTh className="p-3.5 w-20 text-center">AKSI</DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {leads.map((lead, idx) => {
            const date = new Date(lead.timestamp);
            const formattedDate = date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const formattedTime = date.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <DnaTableRow key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                <DnaTd className="p-3.5">
                  <div className="font-semibold text-slate-800">{formattedDate}</div>
                  <div className="text-[11px] text-slate-400">{formattedTime} WIB</div>
                </DnaTd>
                <DnaTd className="p-3.5 cursor-pointer" onClick={() => onSelectLead(lead)}>
                  <div className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                    {lead.nama || "-"}
                  </div>
                  <div className="text-[11px] text-slate-500">{lead.perusahaan || "Perusahaan Belum Terdaftar"}</div>
                </DnaTd>
                <DnaTd className="p-3.5">
                  {lead.hp ? (
                    <a
                      href={`https://wa.me/${lead.hp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-bold text-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-500" /> {lead.hp}
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </DnaTd>
                <DnaTd className="p-3.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <DnaBadge variant="info">{lead.source || "Dreamlab"}</DnaBadge>
                    <span className="text-[11px] text-slate-500 font-medium">({lead.trafficSource || "Direct"})</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    PIC: {lead.assignedTo || "Unassigned"}
                  </div>
                </DnaTd>
                <DnaTd className="p-3.5">
                  <select
                    value={lead.status}
                    onChange={(e) => onUpdateStatus(lead.id, e.target.value)}
                    className={`text-[11px] font-bold py-1 px-2 border rounded-lg cursor-pointer ${getStatusBadgeStyle(
                      lead.status
                    )} focus:outline-none`}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Lost">Lost</option>
                  </select>
                </DnaTd>
                <DnaTd className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteLead(lead.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus Lead"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </DnaTd>
              </DnaTableRow>
            );
          })}

          {leads.length === 0 && (
            <DnaTableRow>
              <DnaTd colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                {isLoading ? "Memuat data lead..." : "Belum ada lead masuk"}
              </DnaTd>
            </DnaTableRow>
          )}
        </DnaTableBody>
      </DnaTable>
    </DnaDataTableCard>
  );
}
