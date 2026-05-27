"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  History, 
  Eye, 
  Search, 
  Calendar, 
  Warehouse, 
  Package, 
  Trash2, 
  ChevronLeft, 
  Save, 
  ShoppingCart, 
  Info,
  ArrowRightLeft,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowDownToLine,
  Layers,
  MoreVertical,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DnaInput, DnaBadge, DnaButton, StatCard, TableWrapper } from "@/components/dna";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { toast } from "sonner";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

const statusLabel = (status: string) => {
  switch (status) {
    case "APPROVED": return "Diterima";
    case "REJECTED": return "Ditolak";
    case "PENDING":
    case "PROCESSING": return "Proses";
    default: return status;
  }
};

export default function MaterialRequisitionPrototype() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "form">("list");
  const [cart, setCart] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState<number>(1);
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [notes, setNotes] = useState("");

  const { data: requisitions, isLoading: reqLoading } = useQuery({
    queryKey: ["warehouse-requisitions"],
    queryFn: async () => {
      const res = await api.get("/warehouse/requisitions");
      return res.data;
    },
  });

  const { data: materials } = useQuery({
    queryKey: ["master-materials"],
    queryFn: async () => {
      const res = await api.get("/master/materials");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      fromWarehouse: string;
      toWarehouse: string;
      notes?: string;
      items: { materialId: string; qty: number; notes?: string }[];
    }) => {
      const res = await api.post("/warehouse/requisitions", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-requisitions"] });
      toast.success("Requisition created successfully");
      setView("list");
      setCart([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create requisition");
    },
  });

  const reqList = Array.isArray(requisitions) ? requisitions : [];
  const materialList = Array.isArray(materials) ? materials : [];

  const addToCart = () => {
    if (!selectedProduct) return;
    setCart([...cart, { ...selectedProduct, qty, note: "" }]);
    setSelectedProduct(null);
    setQty(1);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!fromWarehouse || !toWarehouse || cart.length === 0) {
      toast.error("Please select warehouses and add at least one item");
      return;
    }
    createMutation.mutate({
      fromWarehouse,
      toWarehouse,
      notes: notes || undefined,
      items: cart.map((item) => ({
        materialId: item.id,
        qty: item.qty,
        notes: item.note || undefined,
      })),
    });
  };

  return (
    <DashboardShell
      title={view === "list" ? "PERMINTAAN" : "BUAT PERMINTAAN"}
      titleAccent="BARANG"
      subtitle={
        view === "list" 
          ? "(Internal Material Requisition & Intra-Warehouse Stock Allocation)" 
          : "(Drafting Phase • Protocol 05-PR)"
      }
      actions={
        view === "list" ? (
          <div className="flex gap-3">
            <DnaButton variant="outline" size="md" icon={<History className="text-amber-500" />}>
              Riwayat
            </DnaButton>
            <DnaButton variant="primary" size="md" icon={<Plus />} onClick={() => setView("form")} className="hover:scale-[1.02] active:scale-[0.98]">
              Buat
            </DnaButton>
          </div>
        ) : (
          <div className="flex gap-3">
            <DnaButton variant="ghost" icon={<ChevronLeft />} onClick={() => setView("list")} className="text-rose-500 hover:bg-rose-50 hover:text-rose-500">
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" icon={<Save />} onClick={handleSave} disabled={createMutation.isPending} className="hover:scale-[1.02] active:scale-[0.98]">
              {createMutation.isPending ? "Processing..." : "Simpan Permintaan"}
            </DnaButton>
          </div>
        )
      }
    >
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-[var(--section-gap)]"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard label="Active Requests" value="12" icon={<Clock className="text-amber-500" />} />
              <StatCard label="Fulfilled Today" value="45" icon={<CheckCircle2 className="text-emerald-500" />} />
              <StatCard label="Stock In Transit" value="8" icon={<ArrowRightLeft className="text-blue-600" />} />
              <StatCard label="Priority Items" value="3" icon={<Layers className="text-rose-600" />} />
            </div>

            {/* List Table */}
            <TableWrapper
              filters={
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div className="w-72">
                    <DnaInput icon={<Search className="h-3.5 w-3.5 text-slate-400" />} placeholder="Search Requisition ID..." className="h-10 bg-slate-50 border-none rounded-lg text-xs font-black" />
                  </div>
                  <div className="flex gap-4">
                    <DnaButton variant="ghost" className="h-10 px-5 rounded-lg text-[9px] text-slate-500 hover:bg-slate-50 hover:text-slate-500">
                      Filter: All Status
                    </DnaButton>
                  </div>
                </div>
              }
            >
              <Table className="table-dense">
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="py-4 px-4 text-table-header text-slate-400">Request Identity</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400">Origin / Destination</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400">Requisitioner / Remarks</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reqLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                        <p className="text-[10px] font-black uppercase mt-4 text-slate-400">Loading requisitions...</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {!reqLoading && reqList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <p className="text-[10px] font-black uppercase text-slate-300">No requisitions found</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {!reqLoading && reqList.map((req: any) => (
                    <TableRow key={req.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                            <ClipboardList className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{req.reqNumber}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">{formatDate(req.requestDate)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                             <Warehouse className="h-3 w-3 text-slate-400" />
                             <span className="text-[10px] font-black text-slate-600 uppercase">{req.fromWh?.name || req.fromWarehouse || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <Warehouse className="h-3 w-3 text-blue-600" />
                             <span className="text-[10px] font-black text-blue-600 uppercase italic">{req.toWh?.name || req.toWarehouse || "-"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex flex-col">
                          <DnaBadge status="default" className="rounded-md text-[8px] px-1.5 py-0.5">
                            {req.requester?.fullName || req.createdById || "-"}
                          </DnaBadge>
                          <p className="text-[9px] font-medium text-slate-400 uppercase truncate mt-1 max-w-[200px]">{req.notes || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center">
                        <DnaBadge status={req.status === "APPROVED" || req.status === "Diterima" ? "success" : "warning"} className="text-[8px]">
                          {statusLabel(req.status)}
                        </DnaBadge>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-[var(--section-gap)] pb-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               {/* Left: Configuration */}
               <div className="lg:col-span-4 space-y-6">
                   <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8 relative overflow-hidden">
                      <div className="relative z-10 space-y-6">
                         <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Logistical Path</p>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase">Warehouse <br/> <span className="text-blue-500 text-3xl">Routing</span></h3>
                         </div>

                         <div className="space-y-5">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase block">
                                  <ArrowDownToLine className="h-3 w-3" /> Gudang Peminta
                               </label>
                               <select
                                 value={fromWarehouse}
                                 onChange={(e) => setFromWarehouse(e.target.value)}
                                 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase appearance-none"
                               >
                                   <option value="" className="bg-white">-- Pilih Gudang --</option>
                                   <option value="00000000-0000-0000-0000-000000000001" className="bg-white">Gudang Produksi Mixing</option>
                                   <option value="00000000-0000-0000-0000-000000000002" className="bg-white">Gudang Produksi Filling</option>
                               </select>
                            </div>

                            <div className="flex justify-center">
                               <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                                  <ArrowRight className="h-4.5 w-4.5 rotate-90" />
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase block">
                                  <Warehouse className="h-3 w-3" /> Gudang Penyedia
                               </label>
                               <select
                                 value={toWarehouse}
                                 onChange={(e) => setToWarehouse(e.target.value)}
                                 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase appearance-none"
                               >
                                   <option value="" className="bg-white">-- Pilih Gudang --</option>
                                   <option value="00000000-0000-0000-0000-000000000003" className="bg-white">Gudang Bahan Baku</option>
                                   <option value="00000000-0000-0000-0000-000000000004" className="bg-white">Gudang Kemasan</option>
                                   <option value="00000000-0000-0000-0000-000000000005" className="bg-white">Gudang Jadi</option>
                               </select>
                            </div>
                         </div>

                         <div className="pt-6 border-t border-slate-200 space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase block">Commercial Notes</label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                              rows={3}
                              placeholder="Production batch ref..."
                            />
                         </div>
                      </div>
                      <Warehouse className="h-40 w-40 text-slate-200 absolute -right-10 -bottom-10 rotate-12" />
                   </div>
               </div>

               {/* Right: Item Selection & Cart */}
               <div className="lg:col-span-8 space-y-6">
                  {/* Item Picker */}
                   <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tighter italic">Resource <span className="text-blue-600">Allocation</span></h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select materials to be requisitioned</p>
                         </div>
                         <DnaBadge status="info">
                            Real-time Stock Enabled
                         </DnaBadge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                         <div className="md:col-span-5 space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase block">Search Material</label>
                            <select 
                              onChange={(e) => setSelectedProduct(materialList.find((p: any) => p.id === e.target.value))}
                              className="w-full h-11 px-4 bg-slate-50 border-none rounded-xl font-black text-xs italic uppercase appearance-none"
                            >
                               <option value="">— CHOOSE MATERIAL —</option>
                               {materialList.map((p: any) => (
                                 <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                               ))}
                            </select>
                         </div>
                         <div className="md:col-span-3 space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase block">Request Qty</label>
                            <DnaInput 
                              type="number" 
                              value={qty}
                              onChange={(e) => setQty(Number(e.target.value))}
                              className="h-11 bg-slate-50 border-none rounded-xl font-black text-center text-xs" 
                            />
                         </div>
                         <div className="md:col-span-4 h-11">
                            <DnaButton variant="primary" icon={<Plus />} onClick={addToCart} className="w-full h-full text-[9px]">
                              Add to Allocation
                            </DnaButton>
                         </div>
                      </div>

                     {/* Stock Feedback (Only if product selected) */}
                     <AnimatePresence>
                        {selectedProduct && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="grid grid-cols-2 gap-4"
                          >
                             <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between group overflow-hidden relative">
                                <div>
                                   <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Requesting Stock</p>
                                   <p className="text-lg font-black text-slate-900 tabular-nums">{selectedProduct.stockQty || 0} <span className="text-[9px] text-slate-400 font-black">{selectedProduct.unit || "pcs"}</span></p>
                                </div>
                                <ArrowDownToLine className="h-8 w-8 text-slate-200 transition-colors" />
                             </div>
                             <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between group overflow-hidden relative">
                                <div>
                                   <p className="text-[8px] font-black uppercase text-blue-600 tracking-widest">Available Stock</p>
                                   <p className="text-lg font-black text-blue-700 tabular-nums">{selectedProduct.stockQty || 0} <span className="text-[9px] text-slate-400 font-black">{selectedProduct.unit || "pcs"}</span></p>
                                </div>
                       <Warehouse className="h-8 w-8 text-blue-200" />
                              </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>

                   {/* Cart Table */}
                   <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-2">
                             <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                                <ShoppingCart className="h-4.5 w-4.5" />
                            </div>
                            <h3 className="text-base font-black uppercase italic tracking-tighter">Allocation <span className="text-blue-600">Manifest</span></h3>
                         </div>
                         {cart.length > 0 && (
                           <DnaButton variant="ghost" icon={<Trash2 />} onClick={() => setCart([])} className="text-[9px] text-rose-500 hover:bg-rose-50 hover:text-rose-500 rounded-lg h-9">
                             Clear Cart
                           </DnaButton>
                         )}
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                         <Table className="table-dense">
                            <TableHeader>
                               <TableRow className="bg-slate-50/50">
                                  <TableHead className="py-4 px-4 text-[9px] font-black uppercase text-slate-400">#</TableHead>
                                  <TableHead className="py-4 px-4 text-[9px] font-black uppercase text-slate-400">Barang</TableHead>
                                  <TableHead className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Qty</TableHead>
                                  <TableHead className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Info Stok</TableHead>
                                  <TableHead className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Catatan</TableHead>
                                  <TableHead className="py-4 px-4 text-right text-[9px] font-black uppercase text-slate-400">Aksi</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {cart.length === 0 ? (
                                 <TableRow>
                                    <TableCell colSpan={6} className="py-14 text-center">
                                       <div className="flex flex-col items-center gap-3">
                                          <Layers className="h-10 w-10 text-slate-200" />
                                          <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">No materials added to manifest</p>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                               ) : (
                                 cart.map((item, i) => (
                                   <TableRow key={i} className="group hover:bg-slate-50 transition-all border-b border-slate-50">
                                      <TableCell className="py-4 px-4 font-black text-slate-400 text-xs">{i + 1}</TableCell>
                                      <TableCell className="py-4 px-4">
                                          <div className="flex flex-col">
                                             <span className="font-black text-slate-900 text-xs uppercase">{item.name}</span>
                                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kode: {item.code || item.id}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell className="py-4 px-4 text-center font-black text-slate-900 text-xs tabular-nums">
                                          {item.qty} <span className="text-[9px] text-slate-400 font-medium">{item.unit || "pcs"}</span>
                                      </TableCell>
                                      <TableCell className="py-4 px-4 text-center">
                                          <DnaBadge status="info" className="rounded-md text-[8px] px-1.5 py-0.5">
                                             {item.stockQty || 0} Available
                                          </DnaBadge>
                                      </TableCell>
                                      <TableCell className="py-4 px-4 text-center min-w-[150px]">
                                          <DnaInput 
                                            className="h-8 text-[9px] bg-slate-50 border-none rounded-lg font-medium" 
                                            placeholder="Catatan item..."
                                            value={item.note || ""}
                                            onChange={(e) => {
                                              const newCart = [...cart];
                                              newCart[i].note = e.target.value;
                                              setCart(newCart);
                                            }}
                                          />
                                      </TableCell>
                                      <TableCell className="py-4 px-4 text-right">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeFromCart(i)}
                                            className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all"
                                          >
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </TableCell>
                                   </TableRow>
                                 ))
                               )}
                            </TableBody>
                         </Table>
                      </div>
                   </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
