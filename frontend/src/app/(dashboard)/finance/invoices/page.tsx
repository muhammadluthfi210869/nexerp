"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Search, 
  FileCheck2, 
  ArrowUpRight,
  UserCheck,
  CreditCard,
  Printer,
  Mail,
  MoreHorizontal,
  ChevronRight,
  Download,
  AlertTriangle,
  Zap
} from "lucide-react";
import { DnaButton, DnaBadge, DnaInput, StatCard, TableWrapper } from "@/components/dna";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";

interface Invoice {
  id: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
  source: string;
}

export default function InvoicingPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      return resp.data.map((inv: any) => ({
        id: inv.invoiceNumber,
        customer: inv.customerName,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
        amount: Number(inv.totalAmount),
        status: inv.status,
        source: "Sales Order"
      }));
    }
  });

  const filteredInvoices = invoices?.filter(inv => 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardShell
      title="ACCOUNTS"
      titleAccent="RECEIVABLE"
      subtitle="Customer invoicing & collections management"
      actions={
        <div className="flex gap-2">
           <DnaButton variant="outline" icon={<Download />}>
               Export Ledger
           </DnaButton>
           <DnaButton variant="primary" icon={<Zap />}>
               Batch Billing
           </DnaButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Receivables"
            value="Rp 170.0M"
            subValue="Rp 45.0M Overdue for 14 Days"
            icon={<CreditCard className="text-blue-600" />}
          />
          <StatCard
            label="Collected (MTD)"
            value="Rp 89.2M"
            subValue="65% Target Completion"
            icon={<UserCheck className="text-emerald-500" />}
          />
          <StatCard
            label="Pending Approval"
            value="4 Invoices"
            subValue="Execute Review Gate"
            icon={<AlertTriangle className="text-amber-500" />}
          />
        </div>

        {/* Invoices Table */}
        <TableWrapper
          filters={
            <div className="relative w-full max-w-md">
              <DnaInput 
                icon={<Search className="h-4 w-4" />}
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
        >
          <Table className="table-dense">
            <TableHeader className="bg-slate-50/70">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Invoice Identity</TableHead>
                <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Client / Partner</TableHead>
                <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Commercial Origin</TableHead>
                <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Amount Due</TableHead>
                <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Protocol Status</TableHead>
                <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                  <TableCell className="pl-6 text-left">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FileCheck2 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.id}</span>
                        <span className="text-[9px] font-medium text-slate-400 uppercase mt-0.5">Due: {inv.dueDate}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-500 uppercase">
                        {inv.customer.charAt(0)}
                      </div>
                      <p className="font-black text-slate-900 text-xs uppercase italic">{inv.customer}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="rounded-lg border border-slate-200 text-slate-500 font-medium uppercase text-[8px] tracking-tight px-1.5 py-0.5">
                      {inv.source}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900 text-xs font-mono tabular-nums">
                    Rp {inv.amount.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-center">
                    <DnaBadge status={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'critical' : 'info'}>
                      {inv.status}
                    </DnaBadge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-1.5">
                      <DnaButton variant="outline" size="sm" icon={<Printer className="h-3.5 w-3.5" />} />
                      <DnaButton variant="outline" size="sm" icon={<Mail className="h-3.5 w-3.5" />} />
                      <DnaButton variant="outline" size="sm" icon={<MoreHorizontal className="h-3.5 w-3.5" />} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>
    </DashboardShell>
  );
}
