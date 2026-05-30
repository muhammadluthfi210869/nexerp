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
import { DnaInput, DnaButton, DnaBadge, StatCard, TableWrapper } from "@/components/dna";
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
import { DashboardShell } from "@/components/layout/DashboardShell";

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
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredBills = bills?.filter(b => 
    b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardShell
      title="Vendor"
      titleAccent="Bills"
      subtitle="Debt obligation management & vendor reconciliation"
      actions={
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <DnaButton variant="primary" icon={<Plus className="h-4 w-4" />}>
              Register Bill
            </DnaButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-slate-900 text-white flex flex-row justify-between items-center">
               <div>
                  <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Register New Bill</DialogTitle>
                  <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">Payable Registration Protocol v2.1</p>
               </div>
               <Receipt className="h-12 w-12 text-rose-500/80" />
            </DialogHeader>

            <div className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Vendor Entity</label>
                        <Select
                          value={billForm.vendorId}
                          onValueChange={(val) => setBillForm({ ...billForm, vendorId: val || "" })}
                        >
                            <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                              <SelectValue placeholder="Select Vendor..." />
                           </SelectTrigger>
                           <SelectContent>
                              {vendors?.map((v: any) => (
                                 <SelectItem key={v.id} value={v.id || ""}>{v.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Bill Reference ID</label>
                        <DnaInput 
                          placeholder="INV/2024/..." 
                          value={billForm.billRef}
                          onChange={(e) => setBillForm({ ...billForm, billRef: e.target.value })}
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Issue Date</label>
                        <DnaInput 
                          type="date" 
                          value={billForm.issueDate}
                          onChange={(e) => setBillForm({ ...billForm, issueDate: e.target.value })}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Due Date</label>
                        <DnaInput 
                          type="date" 
                          value={billForm.dueDate}
                          onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Total Bill Amount (IDR)</label>
                     <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                        <DnaInput 
                          type="number" 
                          placeholder="0.00" 
                          className="h-14 bg-slate-50 border-slate-200 font-black text-2xl text-slate-900 pl-16" 
                          value={billForm.amount || ""}
                          onChange={(e) => setBillForm({ ...billForm, amount: Number(e.target.value) })}
                        />
                     </div>
                  </div>
               </div>

               <div className="pt-6 flex justify-end gap-4 border-t border-slate-50">
                    <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>
                      Discard
                    </DnaButton>
                    <DnaButton 
                      variant="primary" 
                      onClick={() => createBillMutation.mutate()} 
                      disabled={createBillMutation.isPending}
                    >
                      {createBillMutation.isPending ? "REGISTERING..." : "Commit to Ledger"}
                    </DnaButton>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCard 
           label="Total Debt (AP)" 
           value={`Rp ${stats?.apTotal?.toLocaleString("id-ID") || 0}`} 
           icon={<AlertCircle className="text-rose-600" />} 
         />
         <StatCard 
           label="Monthly Expense" 
           value={`Rp ${stats?.expense?.toLocaleString("id-ID") || 0}`} 
           icon={<CreditCard className="text-amber-600" />} 
         />
         <StatCard 
           label="Uncollected AR" 
           value={`Rp ${stats?.uncollected?.toLocaleString("id-ID") || 0}`} 
           icon={<Truck className="text-slate-500" />} 
         />
         <StatCard 
           label="Cash In (MTD)" 
           value={`Rp ${stats?.cashIn?.toLocaleString("id-ID") || 0}`} 
           icon={<Receipt className="text-emerald-600" />} 
         />
      </div>

      {/* Bills Table */}
      <TableWrapper
        filters={
          <div className="relative w-full max-w-md">
            <DnaInput 
              icon={<Search className="h-4 w-4" />}
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        }
      >
        <Table>
          <TableHeader className="bg-slate-50/50">
             <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Bill ID</TableHead>
                <TableHead className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Vendor Entity</TableHead>
                <TableHead className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Timeline</TableHead>
                <TableHead className="py-4 px-4 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Balance</TableHead>
                <TableHead className="py-4 px-4 text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Protocol Status</TableHead>
                <TableHead className="pr-10 text-right py-4 px-4 font-black text-slate-400 uppercase tracking-tight text-[9px]">Verification</TableHead>
            </TableRow>
         </TableHeader>
         <TableBody>
            {filteredBills.map((bill) => (
               <TableRow key={bill.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                  <TableCell className="py-8 pl-10 text-left">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                           <Receipt className="h-4 w-4" />
                        </div>
                        <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{bill.id}</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-left">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                           <Building2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="font-black text-slate-900 text-sm uppercase italic">{bill.vendor}</p>
                     </div>
                  </TableCell>
                  <TableCell className="text-left">
                     <div className="space-y-1">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Issue: {bill.date}</p>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight flex items-center gap-1">
                           <Clock className="h-2.5 w-2.5" /> Due: {bill.dueDate}
                        </p>
                     </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900 font-mono tabular-nums">
                     Rp {bill.total.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-center">
                     <DnaBadge status={bill.status === 'PAID' ? 'success' : bill.status === 'PARTIAL' ? 'warning' : 'critical'}>
                        {bill.status}
                     </DnaBadge>
                  </TableCell>
                  <TableCell className="pr-10 text-right">
                     <div className="flex justify-end gap-2">
                        <DnaButton variant="outline" size="sm" icon={<ShieldCheck className="h-4 w-4" />} />
                        <DnaButton variant="outline" size="sm" icon={<MoreVertical className="h-4 w-4" />} />
                     </div>
                  </TableCell>
               </TableRow>
            ))}
            {filteredBills.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">
                  No bills found.
                </TableCell>
              </TableRow>
            )}
         </TableBody>
        </Table>
      </TableWrapper>
    </DashboardShell>
  );
}
