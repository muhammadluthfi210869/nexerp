"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Warehouse, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package, 
  ChevronRight, 
  AlertTriangle, 
  Truck, 
  History,
  ClipboardList,
  ArrowLeftRight,
  ShieldCheck,
  MoreVertical,
  X,
  Plus,
  Zap,
  LayoutDashboard,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Static fallback if API is unavailable
const FALLBACK_REQUESTS = [
  { kode: "REQ-001", dari: "Gudang Bahan Baku", ke: "Gudang Produksi Mixing", tanggal: "01/04/2026", status: "PENDING",
    items: [{ kode: "BB-001", nama: "Glycerin 99%", qty_diminta: 120, stok: 1500, satuan: "kg", catatan: "Batch BR-001" }] },
  { kode: "REQ-002", dari: "Gudang Kemasan", ke: "Gudang Produksi Filling", tanggal: "03/04/2026", status: "PENDING",
    items: [{ kode: "KP-001", nama: "Botol PET 100ml", qty_diminta: 2500, stok: 4500, satuan: "pcs", catatan: "" }] },
];

export default function PindahGudangPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const queryClient = useQueryClient();
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [shipmentNotes, setShipmentNotes] = useState("");

  const { data: requisitions, isLoading } = useQuery({
    queryKey: ["warehouse-requisitions"],
    queryFn: async () => {
      const res = await api.get("/warehouse/requisitions");
      return res.data || res;
    },
  });

  const reqList = Array.isArray(requisitions) && requisitions.length > 0
    ? requisitions.map((r: any) => ({
        kode: r.reqNumber,
        dari: r.fromWarehouse,
        ke: r.toWarehouse,
        tanggal: new Date(r.requestDate).toLocaleDateString('id-ID'),
        status: r.status,
        items: r.items?.map((i: any) => ({
          kode: i.materialId?.slice(0, 8),
          nama: i.materialId,
          qty_diminta: Number(i.qty),
          stok: 0,
          satuan: 'pcs',
          catatan: i.notes || '',
          id: i.id,
        })) || [],
      }))
    : FALLBACK_REQUESTS;

  const executeMutation = useMutation({
    mutationFn: async (data: { id: string; items: { itemId: string; qty: number }[]; notes?: string }) => {
      const res = await api.post(`/warehouse/requisitions/${data.id}/execute`, {
        items: data.items,
        notes: data.notes,
      });
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-requisitions"] });
    },
  });

  // Set default selected request
  if (!selectedReq && reqList.length > 0) {
    setSelectedReq(reqList[0]);
  }

  if (!mounted) return <div className="min-h-full bg-white" />;

  const statusVariant: Record<string, "success" | "info" | "warning" | "critical" | "purple" | "default"> = {
    PENDING: "warning",
    APPROVED: "info",
    IN_TRANSIT: "purple",
    RECEIVED: "success",
    REJECTED: "critical",
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <DashboardShell
      title="Pindah"
      titleAccent="Gudang"
      subtitle="Inventory Transfer Operations & Stock Migration Control"
      actions={
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="h-14 px-6 border-2 border-slate-200 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm hover:bg-slate-50 transition-all"
          >
            <History className="mr-2 h-4 w-4 text-amber-500" /> Transfer History
          </Button>
          <Button 
            className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-tighter text-sm border-none transition-all hover:scale-105"
          >
            <Plus className="mr-2 h-5 w-5" /> Manual Transfer
          </Button>
        </div>
      }
    >

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-[calc(100vh-280px)]">
        {/* LEFT: Request List */}
        <Card className="lg:col-span-4 rounded-[24px] border-none shadow-2xl shadow-slate-200/30 overflow-hidden bg-white flex flex-col">
           <div className="p-8 border-b border-slate-50 space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                   <Clock className="h-5 w-5 text-indigo-600" /> Pending <span className="text-indigo-600">Requests</span>
                 </h3>
                   <DnaBadge status="info">5 NEW</DnaBadge>
              </div>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                 <Input placeholder="Search Request Code..." className="h-12 pl-12 bg-slate-50 border-none rounded-2xl font-bold text-xs" />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-100">
               {isLoading ? (
                 <div className="p-8 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
               ) : (
                 reqList.map((req) => (
                <motion.div
                  key={req?.kode}
                  whileHover={{ x: 8 }}
                  onClick={() => setSelectedReq(req)}
                   className={cn(
                    "p-6 rounded-[24px] border-2 transition-all cursor-pointer group relative overflow-hidden",
                    selectedReq?.kode === req?.kode 
                      ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100" 
                      : "border-slate-50 hover:border-slate-200 bg-white"
                  )}
                >
                   <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.tanggal}</span>
                         <span className={cn(
                           "text-lg font-black tracking-tighter uppercase italic transition-colors",
                           selectedReq?.kode === req?.kode ? "text-indigo-600" : "text-slate-900"
                         )}>
                           {req?.kode}
                         </span>
                      </div>
                       <DnaBadge status={statusVariant[req.status] || "default"}>
                          {req.status}
                       </DnaBadge>
                   </div>
                   
                   <div className="space-y-3 relative z-10">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-slate-200" />
                         <span className="text-[11px] font-bold text-slate-500 uppercase truncate">{req.dari}</span>
                      </div>
                      <div className="ml-1 border-l-2 border-dashed border-slate-100 h-4" />
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-indigo-500" />
                         <span className="text-[11px] font-black text-slate-900 uppercase truncate">{req.ke}</span>
                      </div>
                   </div>

                   <ArrowRight className={cn(
                     "absolute -right-8 top-1/2 -translate-y-1/2 h-16 w-16 text-indigo-100 transition-all group-hover:-right-4 opacity-50",
                     selectedReq?.kode === req?.kode && "text-indigo-200 opacity-100"
                   )} />
                  </motion.div>
                )))}
            </div>
        </Card>

        {/* RIGHT: Detail & Execution */}
        <div className="lg:col-span-8 flex flex-col gap-8 h-full">
           <AnimatePresence mode="wait">
              <motion.div
                key={selectedReq?.kode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full gap-8"
              >
                {/* Info Header Card */}
                <Card className="rounded-[24px] border-none shadow-xl p-8 bg-indigo-600 text-white overflow-hidden relative">
                   <div className="relative z-10 flex justify-between items-center">
                      <div className="space-y-4">
                         <div className="flex items-center gap-4">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase">{selectedReq?.kode}</h2>
                            <DnaBadge status="info">
                              {selectedReq.status}
                            </DnaBadge>
                         </div>
                         <div className="flex items-center gap-6 text-slate-400">
                            <div className="flex items-center gap-2">
                               <Clock className="h-4 w-4" />
                               <span className="text-[11px] font-bold uppercase">{selectedReq.tanggal}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="text-[11px] font-black uppercase text-white">{selectedReq.dari}</span>
                               <ArrowRight className="h-4 w-4 text-indigo-400" />
                               <span className="text-[11px] font-black uppercase text-white">{selectedReq.ke}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Valuation</span>
                         <span className="text-3xl font-black italic tracking-tighter text-indigo-400 tabular-nums">Rp 4.5M</span>
                      </div>
                   </div>
                   <Warehouse className="absolute -right-12 -bottom-12 h-64 w-64 text-white/5 rotate-12 pointer-events-none" />
                </Card>

                {/* Items Table Card */}
                <Card className="flex-1 rounded-[24px] border-none shadow-2xl shadow-slate-200/30 overflow-hidden bg-white flex flex-col">
                   <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Transfer <span className="text-indigo-600">Manifest</span></h3>
                      <div className="flex items-center gap-4">
                         <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-bold text-[9px] uppercase">
                           {selectedReq?.items.length} Unique Items
                         </Badge>
                      </div>
                   </div>
                   
                    <TableWrapper className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100">
                       <Table>
                        <TableHeader className="bg-slate-50/50 sticky top-0 z-20">
                          <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="py-6 pl-10 text-table-header text-slate-400">#</TableHead>
                            <TableHead className="text-table-header text-slate-400">Barang</TableHead>
                            <TableHead className="text-table-header text-slate-400 text-right">Diminta</TableHead>
                            <TableHead className="text-table-header text-slate-400 text-right">Stok Tersedia</TableHead>
                            <TableHead className="text-table-header text-slate-400 text-center">Qty Dikirim</TableHead>
                            <TableHead className="pr-10 text-table-header text-slate-400">Catatan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedReq?.items.map((item: any, idx: number) => (
                            <TableRow key={item.kode} className="group hover:bg-indigo-50/30 transition-all duration-300 border-b border-slate-50">
                              <TableCell className="py-8 pl-10 font-bold text-slate-300 text-xs">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                                    <Package className="h-4 w-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{item.nama}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.kode}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-black text-slate-900 text-xs tabular-nums">
                                {item.qty_diminta.toLocaleString()} <span className="text-[9px] text-slate-400">{item.satuan}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                 <div className={cn(
                                   "font-black text-xs tabular-nums flex items-center justify-end gap-2",
                                   item.stok >= item.qty_diminta ? "text-emerald-500" : "text-rose-500"
                                 )}>
                                    {item.stok.toLocaleString()}
                                    {item.stok < item.qty_diminta && <AlertTriangle className="h-3 w-3 animate-pulse" />}
                                 </div>
                              </TableCell>
                              <TableCell className="text-center">
                                 <Input 
                                   type="number" 
                                   defaultValue={item.qty_diminta}
                                   className="w-24 h-10 mx-auto bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl font-black text-center text-xs transition-all"
                                 />
                              </TableCell>
                              <TableCell className="pr-10">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase italic truncate max-w-[150px]">{item.catatan || "No notes"}</p>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableWrapper>

                    {/* Execution Footer */}
                   <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-6">
                         <div className={cn(
                           "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                           selectedReq?.items.every((i: any) => i.stok >= i.qty_diminta) ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                         )}>
                            {selectedReq?.items.every((i: any) => i.stok >= i.qty_diminta) ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6 animate-pulse" />}
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-black text-slate-900 uppercase italic">
                               Stock Validation Status
                            </p>
                            <p className={cn(
                              "text-[10px] font-bold uppercase",
                              selectedReq?.items.every((i: any) => i.stok >= i.qty_diminta) ? "text-emerald-500" : "text-rose-500"
                            )}>
                               {selectedReq?.items.every((i: any) => i.stok >= i.qty_diminta) ? "âœ… Ready for immediate dispatch" : "âš ï¸ Attention: Stock shortage detected"}
                            </p>
                         </div>
                      </div>

                      <div className="flex gap-4">
                         <Button variant="ghost" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                            <XCircle className="mr-2 h-4 w-4" /> Tolak Permintaan
                         </Button>
                         <Button 
                           onClick={() => setIsConfirmModalOpen(true)}
                           disabled={!selectedReq?.items.some((i: any) => i.stok > 0)}
                           className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
                         >
                            <Truck className="mr-3 h-5 w-5" /> Konfirmasi Kirim
                         </Button>
                      </div>
                   </div>
                </Card>
              </motion.div>
           </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsConfirmModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
             />
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden"
             >
                <div className="p-12 space-y-10">
                   <div className="flex justify-between items-start">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-indigo-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Final Validation</span>
                         </div>
                         <h2 className="text-3xl font-black italic tracking-tighter uppercase">Konfirmasi <br/> <span className="text-indigo-600">Pindah Gudang</span></h2>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setIsConfirmModalOpen(false)} className="rounded-full h-12 w-12 bg-slate-50">
                         <X className="h-6 w-6" />
                      </Button>
                   </div>

                   <div className="grid grid-cols-2 gap-8 p-8 bg-slate-50 rounded-[24px] border border-slate-100">
                      <div className="space-y-4">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gudang Asal</span>
                            <span className="text-sm font-black text-slate-900 uppercase italic truncate">{selectedReq.dari}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gudang Tujuan</span>
                            <span className="text-sm font-black text-slate-900 uppercase italic truncate">{selectedReq.ke}</span>
                         </div>
                      </div>
                      <div className="space-y-4 text-right">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Manifest</span>
                            <span className="text-sm font-black text-slate-900 uppercase italic">{selectedReq?.items.length} Items</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Valuation</span>
                            <span className="text-xl font-black text-indigo-600 uppercase italic tabular-nums">Rp 4.500.000</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internal Shipment Notes</label>
                      <textarea 
                        rows={3}
                        placeholder="Add special delivery instructions or pallet tracking IDs..."
                        className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={shipmentNotes}
                        onChange={(e) => setShipmentNotes(e.target.value)}
                      />
                   </div>

                   <div className="flex gap-4 pt-4">
                      <Button 
                        onClick={() => setIsConfirmModalOpen(false)}
                        variant="ghost" 
                        className="flex-1 h-16 rounded-[2rem] font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-slate-50"
                      >
                         Batal
                      </Button>
                       <Button 
                         onClick={() => {
                           const items = selectedReq?.items.map((i: any) => ({ itemId: i.id || i.kode, qty: i.qty_diminta || 0 }));
                           executeMutation.mutate({ id: selectedReq?.kode, items, notes: shipmentNotes });
                           setIsConfirmModalOpen(false);
                         }}
                         disabled={executeMutation.isPending}
                         className="flex-[2] h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] shadow-2xl shadow-indigo-100 font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                       >
                          <ShieldCheck className="mr-3 h-5 w-5" /> {executeMutation.isPending ? "Processing..." : "Konfirmasi & Kirim"}
                       </Button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Insight Panel */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-indigo-50/50 border border-indigo-100 rounded-[24px] p-10 flex gap-8 items-center">
         <div className="h-16 w-16 rounded-3xl bg-white shadow-xl flex items-center justify-center text-indigo-600 shrink-0">
            <LayoutDashboard className="h-8 w-8" />
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 italic">ðŸ’¡ Operator Insight: Supply Chain Velocity</p>
            <p className="text-sm font-semibold text-slate-600 leading-relaxed uppercase">
               "Batch validation for <span className="text-indigo-600 font-bold italic">Gudang Produksi Mixing</span> is critical to maintain the production timeline. 
               Always cross-reference <span className="text-indigo-600 font-bold">Batch BR-001</span> notes with the physical pallet labels before committing the transfer."
            </p>
         </div>
      </motion.div>
    </DashboardShell>
  );
}
