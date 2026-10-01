"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";
import {
  DnaButton,
  DnaBadge,
  DnaDataTableCard,
  DnaCell,
  DnaTable,
} from "@/components/dna";
import { PurchaseApprovalRecord } from "../_types/purchase-approval.types";

interface PurchaseApprovalTableProps {
  isLoading: boolean;
  records: PurchaseApprovalRecord[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  docTypeFilter: string;
  onDocTypeFilterChange: (val: string) => void;
  docTypes: string[];
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (val: string) => void;
  departments: string[];
  onOpenDetail: (record: PurchaseApprovalRecord) => void;
  onOpenApprove: (id: string) => void;
  onOpenReject: (id: string) => void;
}

export function PurchaseApprovalTable({
  isLoading,
  records,
  searchQuery,
  onSearchChange,
  docTypeFilter,
  onDocTypeFilterChange,
  docTypes,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  departments,
  onOpenDetail,
  onOpenApprove,
  onOpenReject,
}: PurchaseApprovalTableProps) {
  return (
    <DnaDataTableCard
      title="Daftar Antrean & Riwayat Persetujuan"
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari nomor pengajuan, dokumen ref, pemohon, departemen...",
        filterColumns: [
          {
            key: "docType",
            label: "Jenis Dokumen / Modul",
            type: "select",
            options: docTypes.length > 0 ? docTypes : ["Purchase Order (PO)", "Purchase Request (PR)", "Sample Purchase", "Pengajuan Dana"],
          },
          {
            key: "status",
            label: "Status Persetujuan",
            type: "select",
            options: ["PENDING_APPROVAL", "APPROVED", "REJECTED", "DRAFT", "SUBMITTED"],
          },
          {
            key: "department",
            label: "Departemen",
            type: "select",
            options: departments.length > 0 ? departments : ["SCM / Purchasing", "Produksi", "R&D", "Finance"],
          },
        ],
        selectedColumn:
          docTypeFilter !== "ALL"
            ? "docType"
            : statusFilter !== "ALL"
            ? "status"
            : "department",
        onSelectColumn: () => {},
        filterValue:
          docTypeFilter !== "ALL"
            ? docTypeFilter
            : statusFilter !== "ALL"
            ? statusFilter
            : departmentFilter,
        onFilterValueChange: (val) => {
          if (docTypes.includes(val) || val === "Purchase Order (PO)" || val === "Purchase Request (PR)") {
            onDocTypeFilterChange(val);
            onStatusFilterChange("ALL");
            onDepartmentFilterChange("ALL");
          } else if (["PENDING_APPROVAL", "APPROVED", "REJECTED", "DRAFT", "SUBMITTED"].includes(val)) {
            onStatusFilterChange(val);
            onDocTypeFilterChange("ALL");
            onDepartmentFilterChange("ALL");
          } else if (val === "ALL") {
            onDocTypeFilterChange("ALL");
            onStatusFilterChange("ALL");
            onDepartmentFilterChange("ALL");
          } else {
            onDepartmentFilterChange(val);
            onDocTypeFilterChange("ALL");
            onStatusFilterChange("ALL");
          }
        },
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable className="min-w-[1300px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <th className="p-3.5 w-10 text-slate-400 tabular-nums text-center">#</th>
              <th className="p-3.5 w-36 whitespace-nowrap">NO. PENGAJUAN</th>
              <th className="p-3.5 w-28 whitespace-nowrap">TANGGAL PENGAJUAN</th>
              <th className="p-3.5 w-44 whitespace-nowrap">JENIS DOKUMEN / MODUL</th>
              <th className="p-3.5 w-36 whitespace-nowrap">NO. DOKUMEN REF</th>
              <th className="p-3.5 min-w-[160px] whitespace-nowrap">PEMOHON (REQUESTER)</th>
              <th className="p-3.5 w-36 whitespace-nowrap">DEPARTEMEN</th>
              <th className="p-3.5 w-36 text-right whitespace-nowrap">TOTAL NILAI (RP)</th>
              <th className="p-3.5 w-36 text-center whitespace-nowrap">TIER LEVEL SAAT INI</th>
              <th className="p-3.5 w-32 text-center whitespace-nowrap">STATUS PERSETUJUAN</th>
              <th className="p-3.5 text-center w-28 whitespace-nowrap">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memuat data persetujuan...</span>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 font-medium text-sm">
                    Tidak ada data pengajuan persetujuan ditemukan.
                  </p>
                </td>
              </tr>
            ) : (
              records.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 text-slate-400 tabular-nums text-[11px] text-center">
                    {idx + 1}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <DnaCell.Code
                      value={item.submissionNo}
                      onClick={() => onOpenDetail(item)}
                    />
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <DnaCell.Date value={item.submissionDate} />
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <DnaBadge status="info">
                      {item.docType}
                    </DnaBadge>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <DnaCell.Code value={item.refDocNo} />
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <DnaCell.Text primary={item.requester} />
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <DnaCell.Text primary={item.department} />
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <DnaCell.Currency value={item.totalAmount} />
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <DnaBadge
                      status={
                        item.currentTier.includes("Tier 3")
                          ? "purple"
                          : item.currentTier.includes("Tier 2")
                          ? "info"
                          : "default"
                      }
                    >
                      {item.currentTier}
                    </DnaBadge>
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <DnaBadge
                      status={
                        item.status === "APPROVED"
                          ? "success"
                          : item.status === "PENDING_APPROVAL" ||
                            item.status === "SUBMITTED"
                          ? "warning"
                          : item.status === "REJECTED"
                          ? "critical"
                          : "default"
                      }
                    >
                      {item.status === "PENDING_APPROVAL"
                        ? "MENUNGGU"
                        : item.status === "APPROVED"
                        ? "DISETUJUI"
                        : item.status === "REJECTED"
                        ? "DITOLAK"
                        : item.status}
                    </DnaBadge>
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {(item.status === "PENDING_APPROVAL" ||
                        item.status === "DRAFT" ||
                        item.status === "SUBMITTED") && (
                        <>
                          <DnaButton
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenApprove(item.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7 px-2"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            title="Setujui Pengajuan"
                          >
                            Setuju
                          </DnaButton>
                          <DnaButton
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenReject(item.id)}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-7 px-2"
                            icon={<XCircle className="w-3.5 h-3.5" />}
                            title="Tolak Pengajuan"
                          >
                            Tolak
                          </DnaButton>
                        </>
                      )}
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => onOpenDetail(item)}
                        title="Lihat Detail Pengajuan"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
