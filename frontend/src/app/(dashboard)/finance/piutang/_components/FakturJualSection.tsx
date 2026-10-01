"use client";

import React from "react";
import Link from "next/link";
import {
  CreditCard,
  Wallet,
  AlertTriangle,
  FileCheck2,
  Search,
  Printer,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import {
  DnaStatCard,
  DnaDataTableCard,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableRow,
  DnaTh,
  DnaTableBody,
  DnaTd,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import type { Invoice } from "../_types/piutang.types";

interface FakturJualSectionProps {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  totalReceivables: number;
  overdueInvoices: Invoice[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function FakturJualSection({
  invoices,
  filteredInvoices,
  totalReceivables,
  overdueInvoices,
  searchTerm,
  onSearchChange,
}: FakturJualSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DnaStatCard label="Total Receivables" value={`Rp ${totalReceivables.toLocaleString("id-ID")}`} subValue={`${invoices.length} Faktur`} icon={<CreditCard className="text-blue-600" />} />
        <DnaStatCard label="Collected (MTD)" value="â€”" subValue="Dari Ledger Faktur" icon={<Wallet className="text-emerald-500" />} />
        <DnaStatCard label="Overdue" value={`${overdueInvoices.length} Faktur`} subValue="Lewat Jatuh Tempo" icon={<AlertTriangle className="text-amber-500" />} />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Faktur Penjualan</h3>
        <Link href="/finance/invoices" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <FileCheck2 className="h-3 w-3" /> + Tambah Baru
        </Link>
      </div>

      <DnaDataTableCard
        customToolbar={
          <div className="relative w-full max-w-md">
            <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search invoices..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
          </div>
        }
      >
        <DnaTable className="table-dense">
          <DnaTableHead className="bg-slate-50/70">
            <DnaTableRow className="hover:bg-transparent border-slate-100">
              <DnaTh className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Invoice Identity</DnaTh>
              <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Client / Partner</DnaTh>
              <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Commercial Origin</DnaTh>
              <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Amount Due</DnaTh>
              <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Protocol Status</DnaTh>
              <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredInvoices.map((inv) => (
              <DnaTableRow key={inv.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                <DnaTd className="pl-6 text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <FileCheck2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.id}</span>
                      <span className="text-[9px] font-medium text-slate-400 uppercase mt-0.5">Due: {inv.dueDate}</span>
                    </div>
                  </div>
                </DnaTd>
                <DnaTd className="text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-500 uppercase">{inv.customer.charAt(0)}</div>
                    <p className="font-black text-slate-900 text-xs uppercase italic">{inv.customer}</p>
                  </div>
                </DnaTd>
                <DnaTd className="text-center">
                  <DnaBadge variant="default">{inv.source}</DnaBadge>
                </DnaTd>
                <DnaTd className="text-right font-black text-slate-900 text-xs tabular-nums">Rp {inv.amount.toLocaleString("id-ID")}</DnaTd>
                <DnaTd className="text-center">
                  <DnaBadge variant={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "critical" : "info"}>{inv.status}</DnaBadge>
                </DnaTd>
                <DnaTd className="pr-6 text-right">
                  <div className="flex justify-end gap-1.5">
                    <DnaButton variant="outline" size="sm" icon={<Printer className="h-3.5 w-3.5" />} />
                    <DnaButton variant="outline" size="sm" icon={<Mail className="h-3.5 w-3.5" />} />
                    <DnaButton variant="outline" size="sm" icon={<MoreHorizontal className="h-3.5 w-3.5" />} />
                  </div>
                </DnaTd>
              </DnaTableRow>
            ))}
            {filteredInvoices.length === 0 && (
              <DnaTableRow>
                <DnaTd colSpan={6} className="text-center py-10 text-slate-400 italic">No invoices found.</DnaTd>
              </DnaTableRow>
            )}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}
