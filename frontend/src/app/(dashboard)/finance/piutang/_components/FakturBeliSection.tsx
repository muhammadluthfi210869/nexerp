"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CreditCard,
  Package,
  Receipt,
  Search,
  Building2,
  Clock,
  ShieldCheck,
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
import type { Bill } from "../_types/piutang.types";

interface FakturBeliSectionProps {
  bills: Bill[];
  filteredBills: Bill[];
  totalDebt: number;
  paidBillsCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function FakturBeliSection({
  bills,
  filteredBills,
  totalDebt,
  paidBillsCount,
  searchTerm,
  onSearchChange,
}: FakturBeliSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DnaStatCard label="Total Debt (AP)" value={`Rp ${totalDebt.toLocaleString("id-ID")}`} icon={<AlertCircle className="text-rose-600" />} />
        <DnaStatCard label="Jumlah Faktur" value={`${bills.length} Faktur`} icon={<CreditCard className="text-amber-600" />} />
        <DnaStatCard label="Belum Lunas" value={`${bills.length - paidBillsCount} Faktur`} icon={<Package className="text-slate-500" />} />
        <DnaStatCard label="Lunas" value={`${paidBillsCount} Faktur`} icon={<Receipt className="text-emerald-600" />} />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Faktur Pembelian</h3>
        <Link href="/finance/bills" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <Receipt className="h-3 w-3" /> + Tambah Baru
        </Link>
      </div>

      <DnaDataTableCard
        customToolbar={
          <div className="relative w-full max-w-md">
            <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search bills..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
          </div>
        }
      >
        <DnaTable>
          <DnaTableHead className="bg-slate-50/50">
            <DnaTableRow className="hover:bg-transparent border-slate-100">
              <DnaTh className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Bill ID</DnaTh>
              <DnaTh className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Vendor Entity</DnaTh>
              <DnaTh className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Timeline</DnaTh>
              <DnaTh className="py-4 px-4 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Balance</DnaTh>
              <DnaTh className="py-4 px-4 text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Protocol Status</DnaTh>
              <DnaTh className="pr-10 text-right py-4 px-4 font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredBills.map((bill) => (
              <DnaTableRow key={bill.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                <DnaTd className="py-8 pl-10 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{bill.id}</span>
                  </div>
                </DnaTd>
                <DnaTd className="text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="font-black text-slate-900 text-sm uppercase italic">{bill.vendor}</p>
                  </div>
                </DnaTd>
                <DnaTd className="text-left">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Issue: {bill.date}</p>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Due: {bill.dueDate}
                    </p>
                  </div>
                </DnaTd>
                <DnaTd className="text-right font-black text-slate-900 tabular-nums">Rp {bill.total.toLocaleString("id-ID")}</DnaTd>
                <DnaTd className="text-center">
                  <DnaBadge variant={bill.status === "PAID" ? "success" : bill.status === "PARTIAL" ? "warning" : "critical"}>{bill.status}</DnaBadge>
                </DnaTd>
                <DnaTd className="pr-10 text-right">
                  <div className="flex justify-end gap-2">
                    <DnaButton variant="outline" size="sm" icon={<ShieldCheck className="h-4 w-4" />} />
                    <DnaButton variant="outline" size="sm" icon={<MoreHorizontal className="h-4 w-4" />} />
                  </div>
                </DnaTd>
              </DnaTableRow>
            ))}
            {filteredBills.length === 0 && (
              <DnaTableRow>
                <DnaTd colSpan={6} className="text-center py-10 text-slate-400 italic">No bills found.</DnaTd>
              </DnaTableRow>
            )}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}
