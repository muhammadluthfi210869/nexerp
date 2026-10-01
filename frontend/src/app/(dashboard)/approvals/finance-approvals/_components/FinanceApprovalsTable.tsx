"use client";

import React from "react";
import { CheckCircle2, Building2, ArrowRightCircle, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaTable,
  DnaTableBody,
  DnaTd,
  DnaTh,
  DnaTableHead,
  DnaTableRow,
} from "@/components/dna";
import { FundRequest } from "../_types/finance-approvals.types";
import { FinanceApprovalsStatusBadge } from "./FinanceApprovalsStatusBadge";

export interface FinanceApprovalsTableProps {
  requests: FundRequest[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onApprove: (id: string) => void;
  onDisburse: (id: string) => void;
  isApproving: boolean;
  isDisbursing: boolean;
}

export function FinanceApprovalsTable({
  requests,
  searchTerm,
  onSearchChange,
  onApprove,
  onDisburse,
  isApproving,
  isDisbursing,
}: FinanceApprovalsTableProps) {
  return (
    <DnaDataTableCard
      customToolbar={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="status-dot bg-blue-500 animate-pulse" />
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                DAFTAR PENGAJUAN DANA
              </h3>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                Memerlukan Verifikasi & Validasi Keuangan â€¢ {requests.length} Item
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <DnaInput
                icon={<Search className="w-4 h-4" />}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="CARI PENGAJUAN..."
                className="bg-slate-50 border-none rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      }
    >
      <DnaTable className="table-dense">
        <DnaTableHead className="bg-slate-50/50">
          <DnaTableRow className="hover:bg-transparent border-slate-100">
            <DnaTh className="py-4 pl-6 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">
              ID / TANGGAL
            </DnaTh>
            <DnaTh className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">
              DEPARTEMEN
            </DnaTh>
            <DnaTh className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">
              DESKRIPSI / KEPERLUAN
            </DnaTh>
            <DnaTh className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">
              DIAJUKAN OLEH
            </DnaTh>
            <DnaTh className="text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">
              NOMINAL
            </DnaTh>
            <DnaTh className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
              STATUS
            </DnaTh>
            <DnaTh className="pr-6 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
              AKSI
            </DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {requests.length === 0 ? (
            <DnaTableRow>
              <DnaTd
                colSpan={7}
                className="px-4 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider"
              >
                Tidak ada pengajuan dana yang ditemukan
              </DnaTd>
            </DnaTableRow>
          ) : (
            requests.map((req) => (
              <DnaTableRow
                key={req.id}
                className="group hover:bg-slate-50/50 transition-all cursor-default border-slate-50"
              >
                <DnaTd className="py-3 pl-6">
                  <p className="font-black text-slate-900 uppercase tracking-tight">
                    #{req.id}
                  </p>
                  <p className="text-[8px] font-medium text-slate-300 uppercase leading-none mt-0.5">
                    {new Date(req.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </DnaTd>
                <DnaTd className="py-3">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-700 bg-slate-100 rounded px-2 py-0.5 uppercase">
                    <Building2 className="w-3 h-3 text-slate-400" /> {req.departmentId}
                  </span>
                </DnaTd>
                <DnaTd className="py-3">
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                    {req.reason}
                  </p>
                </DnaTd>
                <DnaTd className="py-3">
                  <p className="text-[10px] font-medium text-slate-600 italic">
                    {req.user?.fullName}
                  </p>
                </DnaTd>
                <DnaTd className="py-3 text-right font-sans tabular-nums text-xs font-semibold text-slate-900">
                  {formatCurrency(req.amount)}
                </DnaTd>
                <DnaTd className="py-3 text-center">
                  <FinanceApprovalsStatusBadge status={req.status} />
                </DnaTd>
                <DnaTd className="py-3 pr-6 text-center">
                  <div className="flex justify-center gap-2">
                    {req.status === "PENDING_APPROVAL_MGR" && (
                      <DnaButton
                        variant="primary"
                        size="sm"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => onApprove(req.id)}
                        disabled={isApproving}
                      >
                        SETUJUI
                      </DnaButton>
                    )}
                    {req.status === "APPROVED_BY_MGR" && (
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        icon={<ArrowRightCircle className="w-3.5 h-3.5" />}
                        onClick={() => onDisburse(req.id)}
                        disabled={isDisbursing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        CAIRKAN
                      </DnaButton>
                    )}
                    {req.status === "PAID" && (
                      <DnaBadge variant="success">SELESAI</DnaBadge>
                    )}
                  </div>
                </DnaTd>
              </DnaTableRow>
            ))
          )}
        </DnaTableBody>
      </DnaTable>
    </DnaDataTableCard>
  );
}
