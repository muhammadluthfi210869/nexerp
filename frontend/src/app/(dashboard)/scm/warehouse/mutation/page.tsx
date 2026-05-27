"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  ArrowRightLeft, 
  History, 
  Plus, 
  Search, 
  Calendar, 
  Warehouse, 
  Package, 
  Trash2, 
  ChevronLeft, 
  Save, 
  Eye, 
  CheckCircle2,
  Clock,
  ArrowRight,
  ClipboardList,
  Layers,
  ArrowDownToLine,
  ShieldCheck,
  TrendingUp,
  Boxes,
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

export default function InventoryMutationPrototype() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "form">("list");
  const [cart, setCart] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState<number>(1);
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [destWarehouse, setDestWarehouse] = useState("");
  const [notes, setNotes] = useState("");

  const { data: transfers, isLoading: transferLoading } = useQuery({
    queryKey: ["warehouse-transfers"],
    queryFn: async () => {
      const res = await api.get("/warehouse/transfers");
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
      sourceWarehouseId: string;
      destWarehouseId: string;
      notes?: string;
      items: { materialId: string; qty: number }[];
    }) => {
      const res = await api.post("/warehouse/transfers", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      toast.success("Transfer created successfully");
      setView("list");
      setCart([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create transfer");
    },
  });

  const transferList = Array.isArray(transfers) ? transfers : [];
  const materialList = Array.isArray(materials) ? materials : [];

  const addToCart = () => {
    if (!selectedProduct) return;
    setCart([...cart, { ...selectedProduct, qty }]);
    setSelectedProduct(null);
    setQty(1);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleFinalize = () => {
    if (!sourceWarehouse || !destWarehouse || cart.length === 0) {
      toast.error("Please select warehouses and add at least one item");
      return;
    }
    createMutation.mutate({
      sourceWarehouseId: sourceWarehouse,
      destWarehouseId: destWarehouse,
      notes: notes || undefined,
      items: cart.map((item) => ({
        materialId: item.id,
        qty: item.qty,
      })),
    });
  };

  return (
    <DashboardShell
      title={view === "list" ? "MUTASI" : "BUAT MUTASI"}
      titleAccent="BARANG"
      subtitle={
        view === "list" 
          ? "(Stock Transfer Protocol & Inter-Warehouse Asset Movement)" 
          : "(Drafting Phase • Protocol 09-MT)"
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
            <DnaButton variant="primary" size="md" icon={<Save />} onClick={handleFinalize} disabled={createMutation.isPending} className="hover:scale-[1.02] active:scale-[0.98]">
              {createMutation.isPending ? "Processing..." : "Finalize Transfer"}
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
              <StatCard label="Pending Transfers" value="5" icon={<Clock className="text-amber-500" />} />
              <StatCard label="Successful Moves" value="128" icon={<CheckCircle2 className="text-emerald-500" />} />
              <StatCard label="Transfer Frequency" value="12/day" icon={<ArrowRightLeft className="text-blue-600" />} />
              <StatCard label="Critical Stock Alerts" value="3" icon={<Layers className="text-rose-600" />} />
            </div>

            {/* List Table */}
            <TableWrapper
              filters={
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div className="w-72">
                    <DnaInput icon={<Search className="h-3.5 w-3.5 text-slate-400" />} placeholder="Search Mutation ID..." className="h-10 bg-slate-50 border-none rounded-lg text-xs font-black" />
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
                    <TableHead className="py-4 px-4 text-table-header text-slate-400">Transfer Identity</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400">Source / Target</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400">Authorized By</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                        <p className="text-[10px] font-black uppercase mt-4 text-slate-400">Loading transfers...</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {!transferLoading && transferList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <p className="text-[10px] font-black uppercase text-slate-300">No transfers found</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {!transferLoading && transferList.map((mut: any) => (
                    <TableRow key={mut.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                            <ClipboardList className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{mut.transferNumber || mut.kode}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">{formatDate(mut.date || mut.createdAt)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                             <Warehouse className="h-3 w-3 text-slate-400" />
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{mut.sourceWarehouse?.name || mut.dari || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <Warehouse className="h-3 w-3 text-blue-600" />
                             <span className="text-[10px] font-black text-blue-600 uppercase italic tracking-tighter">{mut.destWarehouse?.name || mut.ke || "-"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <DnaBadge status="default" className="rounded-md text-[8px] px-1.5 py-0.5">
                          {mut.createdBy || mut.pembuat || "-"}
                        </DnaBadge>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center">
                        <DnaBadge status={mut.status === "COMPLETED" || mut.status === "Selesai" ? "success" : "warning"} className="text-[8px]">
                          {mut.status === "COMPLETED" ? "Selesai" : mut.status === "PENDING" ? "Proses" : mut.status || "-"}
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
               {/* Left: Routing */}
               <div className="lg:col-span-4 space-y-6">
                   <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8 relative overflow-hidden">
                      <div className="relative z-10 space-y-6">
                         <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Transfer Path</p>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase">Warehouse <br/> <span className="text-blue-500 text-3xl">Migration</span></h3>
                         </div>

                         <div className="space-y-5">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase block">
                                  <ArrowDownToLine className="h-3 w-3" /> Gudang Asal
                               </label>
                               <select
                                 value={sourceWarehouse}
                                 onChange={(e) => setSourceWarehouse(e.target.value)}
                                 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase appearance-none"
                               >
                                   <option value="" className="bg-white">-- Pilih Gudang --</option>
                                   <option value="00000000-0000-0000-0000-000000000001" className="bg-white">Gudang Utama</option>
                                   <option value="00000000-0000-0000-0000-000000000002" className="bg-white">Gudang Bahan Baku</option>
                               </select>
                            </div>

                            <div className="flex justify-center">
                               <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                                  <ArrowRight className="h-4.5 w-4.5 rotate-90" />
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase block">
                                  <Warehouse className="h-3 w-3" /> Gudang Tujuan
                               </label>
                               <select
                                 value={destWarehouse}
                                 onChange={(e) => setDestWarehouse(e.target.value)}
                                 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase appearance-none"
                               >
                                   <option value="" className="bg-white">-- Pilih Gudang --</option>
                                   <option value="00000000-0000-0000-0000-000000000003" className="bg-white">Gudang Produksi</option>
                                   <option value="00000000-0000-0000-0000-000000000004" className="bg-white">Gudang Mixing</option>
                                   <option value="00000000-0000-0000-0000-000000000005" className="bg-white">Gudang Jadi</option>
                               </select>
                            </div>
                         </div>

                         <div className="pt-6 border-t border-slate-200 space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase block">Logistics Notes</label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                              rows={3}
                              placeholder="Provide reason for mutation..."
                            />
                         </div>
                      </div>
                      <Warehouse className="h-40 w-40 text-slate-200 absolute -right-10 -bottom-10 rotate-12" />
                   </div>
               </div>

               {/* Right: Asset Picker & Manifest */}
               <div className="lg:col-span-8 space-y-6">
                   <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tighter italic">Resource <span className="text-blue-600">Selection</span></h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select assets for logical migration</p>
                         </div>
                         <DnaBadge status="info">
                            Asset Integrity Verified
                         </DnaBadge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                         <div className="md:col-span-6 space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase block">Search Asset</label>
                            <select 
                              onChange={(e) => setSelectedProduct(materialList.find((p: any) => p.id === e.target.value))}
                              className="w-full h-11 px-4 bg-slate-50 border-none rounded-xl font-black text-xs italic uppercase appearance-none"
                            >
                               <option value="">— CHOOSE ASSET —</option>
                               {materialList.map((p: any) => (
                                 <option key={p.id} value={p.id}>{p.name} | {Number(p.stockQty || 0).toLocaleString()} {p.unit || "pcs"} Available</option>
                               ))}
                            </select>
                         </div>
                         <div className="md:col-span-3 space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase block">Transfer Qty</label>
                            <DnaInput 
                              type="number" 
                              value={qty}
                              onChange={(e) => setQty(Number(e.target.value))}
                              className="h-11 bg-slate-50 border-none rounded-xl font-black text-center text-xs" 
                            />
                         </div>
                         <div className="md:col-span-3 h-11">
                            <DnaButton variant="primary" icon={<Plus />} onClick={addToCart} className="w-full h-full text-[9px]">
                              Add to Transfer
                            </DnaButton>
                         </div>
                      </div>
                   </div>

                  {/* Manifest Table */}
                   <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-2">
                             <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                                <Layers className="h-4.5 w-4.5" />
                            </div>
                            <h3 className="text-base font-black uppercase italic tracking-tighter">Migration <span className="text-blue-600">Manifest</span></h3>
                         </div>
                         {cart.length > 0 && (
                           <DnaButton variant="ghost" icon={<Trash2 />} onClick={() => setCart([])} className="text-[9px] text-rose-500 hover:bg-rose-50 hover:text-rose-500 rounded-lg h-9">
                             Clear Manifest
                           </DnaButton>
                         )}
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                         <Table className="table-dense">
                            <TableHeader>
                               <TableRow className="bg-slate-50/50">
                                  <TableHead className="py-4 px-4 text-[9px] font-black uppercase text-slate-400">Barang</TableHead>
                                  <TableHead className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Kode</TableHead>
                                  <TableHead className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Satuan</TableHead>
                                  <TableHead className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Qty Mutasi</TableHead>
                                  <TableHead className="py-4 px-4 text-right text-[9px] font-black uppercase text-slate-400">Aksi</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {cart.length === 0 ? (
                                 <TableRow>
                                    <TableCell colSpan={5} className="py-14 text-center">
                                       <div className="flex flex-col items-center gap-3">
                                          <ArrowRightLeft className="h-10 w-10 text-slate-200" />
                                          <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">No assets staged for migration</p>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                               ) : (
                                 cart.map((item, i) => (
                                   <TableRow key={i} className="group hover:bg-slate-50 transition-all border-b border-slate-50">
                                      <TableCell className="py-4 px-4">
                                         <span className="font-black text-slate-900 text-xs uppercase">{item.name}</span>
                                      </TableCell>
                                      <TableCell className="py-4 px-4 text-center">
                                         <DnaBadge status="default" className="rounded-md text-[8px] px-1.5 py-0.5">{item.code || item.id}</DnaBadge>
                                      </TableCell>
                                      <TableCell className="py-4 px-4 text-center font-black text-slate-400 text-xs uppercase">{item.unit || "pcs"}</TableCell>
                                      <TableCell className="py-4 px-4 text-center font-black text-slate-900 text-xs tabular-nums">
                                         {item.qty}
                                      </TableCell>
                                      <TableCell className="py-4 px-4 text-right">
                                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(i)} className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all">
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
