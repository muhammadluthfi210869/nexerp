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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      return resp.data.map((inv: any) => ({
        id: inv.invoiceNumber,
        customer: inv.customerName,
        date: new Date().toISOString().split('T')[0], // Assuming creation date is today
        dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
        amount: Number(inv.totalAmount),
        status: inv.status,
        source: "Sales Order"
      }));
    }
  });

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-indigo-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Revenue Recognition Protocol</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Accounts <span className="text-indigo-500">Receivable</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Customer invoicing & collections management
           </p>
        </div>

        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-6 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm">
              <Download className="mr-2 h-4 w-4" /> Export Ledger
           </Button>
           <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-tighter text-sm border-none">
              <Zap className="mr-2 h-5 w-5 fill-white" /> Batch Billing
           </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex justify-between items-center relative overflow-hidden group">
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Total Receivables</p>
               <h3 className="text-4xl font-black italic tracking-tighter mt-2">Rp 170.0M</h3>
               <p className="text-[9px] font-bold text-slate-500 uppercase mt-4 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> Rp 45.0M Overdue for 14 Days
               </p>
            </div>
            <CreditCard className="h-24 w-24 text-white/5 absolute -right-4 -bottom-4 group-hover:rotate-12 transition-transform duration-700" />
         </div>

         <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-100 p-10 bg-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Collected (MTD)</p>
            <h3 className="text-4xl font-black italic tracking-tighter mt-2 text-slate-900">Rp 89.2M</h3>
            <div className="mt-6 h-2 w-full bg-slate-50 rounded-full overflow-hidden">
               <div className="h-full w-[65%] bg-emerald-500" />
            </div>
            <p className="text-[9px] font-black text-emerald-600 uppercase mt-3 tracking-tight">65% Target Completion</p>
         </Card>

         <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-100 p-10 bg-indigo-600 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Pending Approval</p>
            <h3 className="text-4xl font-black italic tracking-tighter mt-2">4 <span className="text-lg font-light">Invoices</span></h3>
            <Button className="mt-6 w-full h-11 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-black uppercase text-[9px] tracking-[0.2em]">
               Execute Review Gate
            </Button>
         </Card>
      </div>

      {/* Invoices Table */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
         <Table>
            <TableHeader className="bg-slate-50/70">
               <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Invoice Identity</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Client / Partner</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Commercial Origin</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Amount Due</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Protocol Status</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {invoices?.map((inv) => (
                  <TableRow key={inv.id} className="group hover:bg-indigo-50/30 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <FileCheck2 className="h-5 w-5" />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{inv.id}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Due: {inv.dueDate}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500 uppercase">
                              {inv.customer.charAt(0)}
                           </div>
                           <p className="font-black text-slate-900 text-sm uppercase italic">{inv.customer}</p>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-tight">
                           {inv.source}
                        </Badge>
                     </TableCell>
                     <TableCell className="text-right font-black text-slate-900 text-base">
                        Rp {inv.amount.toLocaleString()}
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                          inv.status === 'PAID' ? "bg-emerald-100 text-emerald-700" : 
                          inv.status === 'OVERDUE' ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-indigo-100 text-indigo-700"
                        )}>
                           {inv.status}
                        </Badge>
                     </TableCell>
                     <TableCell className="pr-10 text-right">
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" className="rounded-xl border border-slate-50 shadow-sm bg-white hover:bg-slate-900 hover:text-white transition-all">
                              <Printer className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="rounded-xl border border-slate-50 shadow-sm bg-white hover:bg-slate-900 hover:text-white transition-all">
                              <Mail className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="rounded-xl border border-slate-50 shadow-sm bg-white hover:bg-slate-900 hover:text-white transition-all">
                              <MoreHorizontal className="h-4 w-4" />
                           </Button>
                        </div>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </Card>
    </div>
  );
}

