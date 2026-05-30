"use client";

import { useState } from "react";
import { Wallet, FileText, CheckCircle2, DollarSign, Eye, Plus, Search, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaBadge, DnaButton } from "@/components/dna";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PayrollStatus = "DRAFT" | "AUTHORIZED" | "PAID";

interface Payroll {
  id: string;
  period: string;
  status: PayrollStatus;
  totalDisbursement: number;
  authorizedBy: string;
  authorizedAt: string;
  employeeCount: number;
}

const PAYROLL_DATA: Payroll[] = [
  { id: "PR-001", period: "Januari 2026", status: "PAID", totalDisbursement: 485_000_000, authorizedBy: "Rina Wijaya", authorizedAt: "2026-02-01", employeeCount: 142 },
  { id: "PR-002", period: "Februari 2026", status: "PAID", totalDisbursement: 492_000_000, authorizedBy: "Rina Wijaya", authorizedAt: "2026-03-01", employeeCount: 144 },
  { id: "PR-003", period: "Maret 2026", status: "AUTHORIZED", totalDisbursement: 478_000_000, authorizedBy: "Rina Wijaya", authorizedAt: "2026-04-01", employeeCount: 140 },
  { id: "PR-004", period: "April 2026", status: "AUTHORIZED", totalDisbursement: 501_000_000, authorizedBy: "Rina Wijaya", authorizedAt: "2026-05-01", employeeCount: 146 },
  { id: "PR-005", period: "Mei 2026", status: "DRAFT", totalDisbursement: 0, authorizedBy: "", authorizedAt: "", employeeCount: 145 },
];

const STATUS_META: Record<PayrollStatus, { label: string; status: "success" | "info" | "warning" | "purple" | "default" }> = {
  DRAFT: { label: "Draft", status: "warning" },
  AUTHORIZED: { label: "Authorized", status: "purple" },
  PAID: { label: "Paid", status: "success" },
};

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredPayroll = activeTab === "all"
    ? PAYROLL_DATA
    : PAYROLL_DATA.filter((p) => p.status.toLowerCase() === activeTab);

  return (
    <DashboardShell
      title="Payroll"
      titleAccent="Worksheet"
      subtitle="Monthly Payroll Processing & Disbursement Control"
      actions={
        <DnaButton variant="primary" icon={<Plus className="stroke-[3px]" />}>
          GENERATE DRAFT
        </DnaButton>
      }
    >
      <div className="space-y-6 animate-fade-slide-in">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Total Payroll (MTD)"
            value="Rp 478 Jt"
            icon={<Wallet className="text-blue-500" />}
          />
          <StatCard
            label="Draft Payrolls"
            value="1"
            icon={<FileText className="text-amber-500" />}
          />
          <StatCard
            label="Authorized"
            value="2"
            icon={<ShieldCheck className="text-purple-500" />}
          />
          <StatCard
            label="Paid"
            value="2"
            icon={<DollarSign className="text-emerald-500" />}
          />
        </div>

        {/* Tabs + Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-12 border border-slate-100">
              <TabsTrigger value="all" className="rounded-xl px-5 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[9px] tracking-widest transition-all">
                Semua
              </TabsTrigger>
              <TabsTrigger value="draft" className="rounded-xl px-5 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[9px] tracking-widest transition-all">
                Draft
              </TabsTrigger>
              <TabsTrigger value="authorized" className="rounded-xl px-5 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[9px] tracking-widest transition-all">
                Authorized
              </TabsTrigger>
              <TabsTrigger value="paid" className="rounded-xl px-5 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[9px] tracking-widest transition-all">
                Paid
              </TabsTrigger>
            </TabsList>
          </div>

          {["all", "draft", "authorized", "paid"].map((tab) => (
            <TabsContent key={tab} value={tab} className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="rounded-[24px] border border-slate-200 shadow-sm overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 border-b border-slate-100">
                        <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Period</TableHead>
                        <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Status</TableHead>
                        <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Total Disbursement</TableHead>
                        <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Employees</TableHead>
                        <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Authorized By</TableHead>
                        <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayroll.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-8">
                            Tidak ada data payroll ditemukan
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayroll.map((row) => (
                          <TableRow key={row.id} className="group hover:bg-slate-50/50 transition-all">
                            <TableCell>
                              <p className="text-[11px] font-black text-slate-900 uppercase">{row.period}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <DnaBadge status={STATUS_META[row.status].status}>
                                {STATUS_META[row.status].label}
                              </DnaBadge>
                            </TableCell>
                            <TableCell className="text-right">
                              <p className="text-[13px] font-black text-slate-900 tracking-tighter tabular-nums">
                                {row.totalDisbursement > 0
                                  ? `Rp ${(row.totalDisbursement / 1_000_000).toFixed(0)} Jt`
                                  : "—"}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <p className="text-[11px] font-bold text-slate-600">{row.employeeCount}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-[11px] font-medium text-slate-700 uppercase">
                                {row.authorizedBy || "—"}
                              </p>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <DnaButton variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                                  DETAIL
                                </DnaButton>
                                {row.status === "DRAFT" && (
                                  <DnaButton variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700">
                                    AUTHORIZE
                                  </DnaButton>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardShell>
  );
}
