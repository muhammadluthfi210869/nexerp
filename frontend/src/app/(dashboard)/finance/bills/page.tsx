"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Search, 
  FileStack, 
  ArrowDownLeft,
  Truck,
  CreditCard,
  Trash2,
  AlertCircle,
  Calendar,
  Building2,
  ChevronRight,
  Receipt,
  ShieldCheck,
  MoreVertical,
  Clock
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Bill {
  id: string;
  vendor: string;
  date: string;
  dueDate: string;
  total: number;
  status: string;
}

export default function VendorBillsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const [billForm, setBillForm] = useState({ vendorId: "", billRef: "", issueDate: "", dueDate: "", amount: 0 });

  const createBillMutation = useMutation({
    mutationFn: async () => api.post("/finance/bills", billForm),
    onSuccess: () => {
      toast.success("Bill registered to ledger.");
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      setIsModalOpen(false);
      setBillForm({ vendorId: "", billRef: "", issueDate: "", dueDate: "", amount: 0 });
    },
    onError: (err: any) => toast.error("Failed to register bill", { description: err.response?.data?.message || err.message }),
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/scm/vendors");
      return res.data;
    }
  });

  const { data: bills, isLoading } = useQuery<Bill[]>({
    queryKey: ["vendor-bills"],
    queryFn: async () => {
      const resp = await api.get("/finance/bills");
      return resp.data.map((b: any) => ({
        id: b.billNumber,
        vendor: b.vendorName,
        date: new Date(b.createdAt).toISOString().split('T')[0],
        dueDate: new Date(b.dueDate).toISOString().split('T')[0],
        total: Number(b.totalAmount),
        status: b.status
      }));
    }
  });

  const { data: stats } = useQuery({
    queryKey: ["finance-stats"],
    queryFn: async () => {
       const resp = await api.get("/finance/dashboard/advanced");
       return resp.data.metrics;
    }
  });

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-rose-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">Accounts Payable Protocol</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Vendor <span className="text-rose-500">Bills</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Debt obligation management & vendor reconciliation
           </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-100 font-black uppercase tracking-tighter text-sm border-none">
              <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> Register Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-white rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
               <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Register New Bill</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Payable Registration Protocol v2.1</p>
               </div>
               <Receipt className="h-12 w-12 text-rose-500 opacity-50" />
            </div>

            <div className="p-10 space-y-6">
               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Vendor Entity</label>
                        <Select>
                           <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6">
                              <SelectValue placeholder="Select Vendor..." />
                           </SelectTrigger>
                           <SelectContent>
                              {vendors?.map((v: any) => (
                                 <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Bill Reference ID</label>
                        <Input placeholder="INV/2024/..." className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Issue Date</label>
                        <Input type="date" className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Due Date</label>
                        <Input type="date" className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Total Bill Amount (IDR)</label>
                     <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                        <Input type="number" placeholder="0.00" className="h-20 bg-slate-900 border-none rounded-2xl font-black text-3xl text-rose-500 pl-16 pr-6" />
                     </div>
                  </div>
               </div>

               <div className="pt-6 flex gap-4">
                  <Button variant="ghost" className="h-14 px-8 font-black uppercase text-[10px] tracking-tight text-slate-400" onClick={() => setIsModalOpen(false)}>Discard</Button>
                   <Button className="flex-1 h-14 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-tight rounded-2xl" onClick={() => createBillMutation.mutate()} disabled={createBillMutation.isPending}>
                    Commit to Ledger
                  </Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatMiniCard label="Total Debt (AP)" value={`Rp ${stats?.apTotal?.toLocaleString() || 0}`} color="text-rose-600" />
         <StatMiniCard label="Monthly Expense" value={`Rp ${stats?.expense?.toLocaleString() || 0}`} color="text-amber-600" />
         <StatMiniCard label="Uncollected AR" value={`Rp ${stats?.uncollected?.toLocaleString() || 0}`} color="text-slate-300" />
         <StatMiniCard label="Cash In (MTD)" value={`Rp ${stats?.cashIn?.toLocaleString() || 0}`} color="text-emerald-600" />
      </div>

      {/* Bills Table */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
         <Table>
            <TableHeader className="bg-slate-50/70">
               <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Bill ID</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Vendor Entity</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Timeline</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Balance</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Protocol Status</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Verification</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {bills?.map((bill) => (
                  <TableRow key={bill.id} className="group hover:bg-rose-50/30 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                              <Receipt className="h-5 w-5 text-rose-500" />
                           </div>
                           <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{bill.id}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-slate-400" />
                           </div>
                           <p className="font-black text-slate-900 text-sm uppercase italic">{bill.vendor}</p>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Issue: {bill.date}</p>
                           <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" /> Due: {bill.dueDate}
                           </p>
                        </div>
                     </TableCell>
                     <TableCell className="text-right font-black text-slate-900">
                        Rp {bill.total.toLocaleString()}
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                          bill.status === 'PAID' ? "bg-emerald-100 text-emerald-700" : 
                          bill.status === 'PARTIAL' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                        )}>
                           {bill.status}
                        </Badge>
                     </TableCell>
                     <TableCell className="pr-10 text-right">
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" className="rounded-xl border border-slate-50 shadow-sm bg-white hover:bg-slate-900 hover:text-white transition-all">
                              <ShieldCheck className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="rounded-xl border border-slate-50 shadow-sm bg-white hover:bg-slate-900 hover:text-white transition-all">
                              <MoreVertical className="h-4 w-4" />
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

function StatMiniCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
     <Card className="rounded-3xl border-none shadow-xl shadow-slate-100 p-6 bg-white flex flex-col justify-center">
        <p className="text-[9px] font-black uppercase tracking-tight text-slate-400 mb-1">{label}</p>
        <p className={cn("text-xl font-black italic tracking-tighter", color)}>{value}</p>
     </Card>
  );
}

