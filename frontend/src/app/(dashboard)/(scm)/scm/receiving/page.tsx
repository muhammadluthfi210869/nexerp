"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Search, 
  PackageCheck, 
  Truck,
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  ShieldCheck,
  Scale,
  Calendar,
  Layers,
  History as HistoryIcon,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Loader2
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

export default function ReceivingPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState("");
  const [doRef, setDoRef] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [taxTreatment, setTaxTreatment] = useState("PPN_11");
  
  const { data: purchaseOrders } = useQuery({
    queryKey: ["approved-po"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return (res.data || [])
        .filter((po: any) => po.status === 'ORDERED' || po.status === 'PARTIAL')
        .map((po: any) => ({
          id: po.poNumber || po.id,
          vendor: po.supplier?.name || '-',
          items: (po.items || []).map((i: any) => ({
            name: i.material?.name || '-',
            qty: Number(i.quantity || 0),
            unit: i.material?.unit || 'PCS',
          })),
        }));
    }
  });

  const { data: receipts, isLoading } = useQuery({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/scm/inbounds");
      return (res.data || []).map((grn: any) => ({
        id: grn.inboundNumber || grn.id,
        poId: grn.po?.poNumber || grn.poId || '-',
        vendor: grn.po?.supplier?.name || '-',
        date: grn.receivedAt ? new Date(grn.receivedAt).toISOString().split('T')[0] : '-',
        status: grn.status === 'APPROVED' ? 'VERIFIED' : 'PENDING',
        qc: grn.status === 'APPROVED' ? 'PASSED' : 'WAITING',
      }));
    }
  });

  const createGRNMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/inbounds", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("GRN registered. Waiting for QC Lab verification.");
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["approved-po"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to register GRN.");
    }
  });

  const arrivalsToday = receipts?.filter((r: any) => r.date === new Date().toISOString().split('T')[0]).length || 0;
  const awaitingQc = receipts?.filter((r: any) => r.qc === 'WAITING').length || 0;
  const verifiedMtd = receipts?.filter((r: any) => r.status === 'VERIFIED').length || 0;
  const rejected = receipts?.filter((r: any) => r.status === 'REJECTED' || r.qc === 'FAILED').length || 0;

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Inventory Entry Protocol</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Goods <span className="text-blue-500">Receipt</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Incoming logistics verification & QC handshake
           </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-100 font-black uppercase tracking-tighter text-sm border-none">
              <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> Register Arrival
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] bg-white rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
               <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">New Goods Receipt (GRN)</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Inventory Integrity Protocol v2.4</p>
               </div>
               <PackageCheck className="h-12 w-12 text-blue-500 opacity-50" />
            </div>

            <div className="p-10 space-y-8">
               <div className="space-y-6">
                  <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Link to Purchase Order</label>
                      <Select value={selectedPO} onValueChange={(val: string | null) => setSelectedPO(val || "")}>
                         <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6">
                            <SelectValue placeholder="Search Active PO ID..." />
                         </SelectTrigger>
                        <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                           {purchaseOrders?.map((po: any) => (
                              <SelectItem key={po.id} value={po.id} className="font-bold py-3 rounded-xl">
                                 {po.id} <span className="text-[10px] text-slate-400 ml-2">Vendor: {po.vendor}</span>
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">DO / Reference No.</label>
                         <Input placeholder="Vendor Delivery No." className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6" value={doRef} onChange={(e) => setDoRef(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Invoice No. (No Faktur)</label>
                         <Input placeholder="F-2400-XXXXX" className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Arrival Timestamp</label>
                         <Input type="datetime-local" className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Tax Treatment (Pajak)</label>
                         <Select value={taxTreatment} onValueChange={(val: string | null) => setTaxTreatment(val || "PPN_11")}>
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6">
                               <SelectValue />
                            </SelectTrigger>
                           <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2">
                              <SelectItem value="NON_TAX" className="font-bold">NON TAXABLE</SelectItem>
                              <SelectItem value="PPN_11" className="font-bold">PPN 11%</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                           <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight">QC Handshake Required</p>
                           <p className="text-xs font-bold text-blue-700 mt-0.5">Verification will be routed to QC Lab.</p>
                        </div>
                     </div>
                     <Badge className="bg-white text-blue-600 font-black text-[10px] tracking-tight uppercase border-none px-4 py-1.5 shadow-sm">
                        Gate 1: Registry
                     </Badge>
                  </div>
               </div>

               <div className="pt-6 flex gap-4">
                  <Button variant="ghost" className="h-14 px-8 font-black uppercase text-[10px] tracking-tight text-slate-400" onClick={() => setIsModalOpen(false)}>Abort Protocol</Button>
                   <Button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tight rounded-2xl shadow-xl shadow-blue-100" disabled={createGRNMutation.isPending} onClick={() => {
                     const selectedPo = purchaseOrders?.find((po: any) => po.id === selectedPO);
                     createGRNMutation.mutate({
                       poId: selectedPO,
                       warehouseId: undefined,
                       items: (selectedPo?.items || []).map((i: any) => ({
                         materialId: i.id || i.name,
                         qtyActual: Number(i.qty || 0),
                       })),
                     });
                   }}>
                     {createGRNMutation.isPending ? 'SUBMITTING...' : 'Commit Arrival Data'}
                   </Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatMiniCard label="Arrivals Today" value={arrivalsToday} color="text-blue-600" />
         <StatMiniCard label="Awaiting QC" value={awaitingQc} color="text-amber-600" />
         <StatMiniCard label="Verified (MTD)" value={verifiedMtd} color="text-emerald-600" />
         <StatMiniCard label="Rejected" value={rejected} color="text-rose-600" />
      </div>

      {/* Receipts Table */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
         <Table>
            <TableHeader className="bg-slate-50/70">
               <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">GRN Identity</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Source PO</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Vendor / Partner</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">QC Status</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Lifecycle</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Verification</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {receipts?.map((receipt: any) => (
                  <TableRow key={receipt.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                              <ClipboardCheck className="h-5 w-5 text-blue-500" />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{receipt.id}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{receipt.date}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-tight">
                           {receipt.poId}
                        </Badge>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500 uppercase">
                              {receipt.vendor.charAt(0)}
                           </div>
                           <p className="font-black text-slate-900 text-sm uppercase italic">{receipt.vendor}</p>
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                          receipt.qc === 'PASSED' ? "bg-emerald-100 text-emerald-700" : 
                          receipt.qc === 'WAITING' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                        )}>
                           {receipt.qc}
                        </Badge>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                          receipt.status === 'VERIFIED' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                        )}>
                           {receipt.status}
                        </Badge>
                     </TableCell>
                     <TableCell className="pr-10 text-right">
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="sm" className="rounded-xl font-black uppercase text-[9px] text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2">
                              <FileSearch className="h-3 w-3" /> Inspection
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

function StatMiniCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
     <Card className="rounded-3xl border-none shadow-xl shadow-slate-100 p-6 bg-white flex flex-col justify-center">
        <p className="text-[9px] font-black uppercase tracking-tight text-slate-400 mb-1">{label}</p>
        <p className={cn("text-xl font-black italic tracking-tighter", color)}>{value}</p>
     </Card>
  );
}

