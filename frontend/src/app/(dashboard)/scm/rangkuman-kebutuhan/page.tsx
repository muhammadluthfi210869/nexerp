"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { 
  Package, 
  Search, 
  Filter, 
  Download, 
  ArrowLeft, 
  ShoppingCart, 
  MessageSquare, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  Layers, 
  ClipboardList,
  ChevronDown,
  X,
  Save,
  Calendar,
  CreditCard,
  Building2,
  CheckCircle2,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DnaButton, DnaBadge, DnaInput, TableWrapper, StatCard, DataCard } from "@/components/dna";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/empty-state";

const SUPPLIERS = [
  "PT Kimia Farma Tbk", "CV Bahan Kimia Abadi", "PT Global Packaging Solution", "UD Sumber Makmur", "PT Aroma Nusantara"
];

export default function ConsolidatedMRPPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [poQty, setPoQty] = useState(0);
  const [poSupplier, setPoSupplier] = useState("");
  const [poPrice, setPoPrice] = useState(0);

  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ["scm-requirements-summary"],
    queryFn: async () => {
      const res = await api.get("/scm/requirements/summary");
      return unwrapResponse(res);
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: { materialId: string; supplierId: string; qty: number; unitPrice: number }) => {
      const res = await api.post("/scm/purchase-orders/from-requirement", data);
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scm-requirements-summary"] });
      setIsPOModalOpen(false);
    },
  });

  const data = Array.isArray(summaryData) ? summaryData : [];
  const filteredData = data.filter((item: any) => 
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.kode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openPOModal = (item: any) => {
    setSelectedItem(item);
    setIsPOModalOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return "bg-rose-100 text-rose-600 border-rose-200";
      case 'high': return "bg-amber-100 text-amber-600 border-amber-200";
      case 'medium': return "bg-yellow-100 text-yellow-600 border-yellow-200";
      case 'low': return "bg-slate-100 text-slate-500 border-slate-200";
      default: return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  return (
    <DashboardShell
      title="RANGKUMAN"
      titleAccent="KEBUTUHAN"
      subtitle="(Consolidated Material Requirements Planning • Global Operational View)"
      actions={
        <div className="flex gap-3">
          <DnaButton 
            variant="ghost"
            onClick={() => router.back()}
            icon={<ArrowLeft />}
            className="h-11 px-5"
          >
            Kembali
          </DnaButton>
          <DnaButton 
            variant="outline"
            icon={<Download />}
          >
            Export Excel
          </DnaButton>
          <DnaButton 
            variant="primary"
            icon={<ShoppingCart />}
            className="hover:scale-[1.02] active:scale-[0.98]"
          >
            Buat PO Global
          </DnaButton>
        </div>
      }
    >
      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Active Orders" value="12 SO" icon={<ClipboardList />} />
        <StatCard label="Unique SKUs" value="48 Materials" icon={<Layers />} />
        <StatCard label="Total Requirement" value="15,750 units" icon={<TrendingUp />} />
        <StatCard label="Estimated Budget" value="Rp 285.0M" icon={<Coins />} />
      </div>

      {/* Main Table */}
      <TableWrapper
        filters={
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
             <div className="flex gap-4 w-full md:w-auto">
              <div className="w-full md:w-72">
                   <DnaInput 
                    placeholder="Cari bahan..." 
                    icon={<Search />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 h-11 px-4 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-[9px] font-black uppercase text-slate-500">Period: Apr 2026</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </div>
             </div>

             <div className="flex gap-4 shrink-0">
                 <DnaButton variant="ghost" icon={<Filter />}>
                   Filter Advanced
                 </DnaButton>
             </div>
          </div>
        }
      >
         {isLoading ? (
           <div className="p-14 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Loading consolidated requirements...</p>
           </div>
         ) : error ? (
           <div className="p-14 flex flex-col items-center justify-center space-y-4">
             <AlertTriangle className="h-10 w-10 text-rose-500" />
             <p className="text-xs font-black text-rose-600 uppercase">Failed to load data</p>
             <p className="text-[9px] text-slate-400">{(error as any)?.message || "Unknown error"}</p>
           </div>
         ) : (
          <Table className="table-dense">
             <TableHeader className="bg-slate-50/50">
               <TableRow className="bg-slate-50/50">
                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">#</TableHead>
                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">Identitas Bahan</TableHead>
                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Kebutuhan / Stok</TableHead>
                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Selisih</TableHead>
                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Prioritas</TableHead>
                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">SO Breakdown</TableHead>
                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Aksi</TableHead>
               </TableRow>
           </TableHeader>
            <TableBody>
             {filteredData.length === 0 ? (
               <TableRow>
                  <TableCell colSpan={7} className="py-20">
                     <EmptyState
                       icon={<Package className="h-8 w-8 text-slate-300" />}
                       title="Tidak Ada Data"
                       description="Tidak ada data kebutuhan yang sesuai dengan pencarian. Coba ubah kata kunci pencarian."
                     />
                  </TableCell>
               </TableRow>
             ) : filteredData.map((item, idx) => (
               <TableRow key={item.kode} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                 <TableCell className="py-4 px-4 font-black text-slate-300 text-xs">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                 <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-3">
                     <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Package className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{item.nama}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.kode} • {item.kategori}</span>
                    </div>
                  </div>
                </TableCell>
                 <TableCell className="py-4 px-4 text-right">
                   <div className="flex flex-col">
                     <span className="font-black text-slate-900 text-xs tabular-nums">{item.total_kebutuhan.toLocaleString()} <span className="text-[9px] text-slate-400 font-black">{item.satuan}</span></span>
                     <span className="text-[9px] font-black text-slate-400 uppercase mt-0.5">Stok: {item.stok.toLocaleString()} {item.satuan}</span>
                   </div>
                 </TableCell>
                 <TableCell className="py-4 px-4 text-right">
                   <div className={cn(
                     "font-black text-xs tabular-nums inline-flex items-center gap-1",
                     item.selisih < 0 ? "text-rose-600" : "text-emerald-600"
                   )}>
                      {item.selisih > 0 ? "+" : ""}{item.selisih.toLocaleString()}
                      {item.selisih < 0 && <AlertTriangle className="h-3 w-3 animate-pulse" />}
                   </div>
                </TableCell>
                 <TableCell className="py-4 px-4 text-center">
                   <DnaBadge status={
                     item.prioritas?.toLowerCase() === 'critical' ? 'critical' :
                     item.prioritas?.toLowerCase() === 'high' ? 'warning' :
                     item.prioritas?.toLowerCase() === 'medium' ? 'warning' : 'default'
                   }>
                      {item.prioritas}
                   </DnaBadge>
                </TableCell>
                <TableCell className="py-4 px-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-tight line-clamp-2 italic max-w-[150px]">
                    {item.so_list}
                  </p>
                </TableCell>
                <TableCell className="py-4 px-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    {item.selisih < 0 && (
                      <DnaButton 
                        onClick={() => openPOModal(item)}
                        variant="danger"
                        size="sm"
                      >
                         Buat PO
                      </DnaButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}

        {/* Footer Summary */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                 <ClipboardList className="h-5 w-5" />
              </div>
               <div className="space-y-0.5">
                  <p className="text-xs font-black text-slate-900 uppercase italic">
                    📊 Total {data.length} material | {data.reduce((a: number, i: any) => a + (i.total_kebutuhan || 0), 0).toLocaleString()} units | Estimasi berdasarkan kebutuhan
                  </p>
                  <p className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1.5 mt-0.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> {data.filter((i: any) => i.prioritas === 'Critical' || i.prioritas === 'High').length} material dengan status Critical/High perlu pembelian segera
                  </p>
               </div>
           </div>

           <DnaButton variant="danger" size="lg" icon={<AlertTriangle />}>
              PO Massal Critical
           </DnaButton>
        </div>
      </TableWrapper>

      {/* PO Modal */}
      <AnimatePresence>
        {isPOModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsPOModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
             />
                    <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden p-8 space-y-6"
             >
               <button 
                 onClick={() => setIsPOModalOpen(false)}
                 className="absolute right-6 top-6 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all group"
               >
                 <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
               </button>

               <div className="space-y-2">
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">Procurement Protocol</p>
                 <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Buat <span className="text-blue-600">Purchase Order</span></h2>
               </div>

               <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                 <div className="col-span-2 border-b border-slate-200 pb-2">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Material</p>
                   <p className="font-black text-xs uppercase italic text-blue-600">{selectedItem.nama} ({selectedItem.kode})</p>
                 </div>
                 <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase">Kebutuhan</p>
                   <p className="font-black text-xs uppercase italic tabular-nums">{Math.abs(selectedItem.selisih).toLocaleString()} {selectedItem.satuan}</p>
                 </div>
                 <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase">Fulfillment Scope</p>
                   <p className="text-[9px] font-black text-slate-500 uppercase">{selectedItem.so_list.split(',').length} Sales Orders</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase block">Select Supplier</label>
                     <div className="relative">
                       <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <select 
                         className="w-full h-11 pl-10 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs appearance-none focus:ring-2 focus:ring-blue-500 transition-all outline-none italic text-slate-800"
                         value={poSupplier}
                         onChange={(e) => setPoSupplier(e.target.value)}
                       >
                         <option value="">Choose Supplier...</option>
                         {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase block">Target Delivery Date</label>
                     <DnaInput type="date" icon={<Calendar />} className="font-black uppercase text-xs" />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase block">Purchase Quantity</label>
                     <DnaInput 
                       type="number" 
                       value={poQty || Math.abs(selectedItem.selisih)}
                       onChange={(e) => setPoQty(Number(e.target.value))}
                       className="text-sm font-black tabular-nums" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase block">Unit Price (IDR)</label>
                     <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xs">Rp</span>
                       <DnaInput 
                         type="number" 
                         placeholder="0"
                         value={poPrice || ""}
                         onChange={(e) => setPoPrice(Number(e.target.value))}
                         className="pl-10 text-sm font-black tabular-nums"
                       />
                     </div>
                   </div>
                 </div>
               </div>

               <div className="flex gap-4 pt-2">
                 <DnaButton 
                   onClick={() => setIsPOModalOpen(false)}
                   variant="ghost" 
                   className="flex-1 h-11"
                 >
                   Batal
                 </DnaButton>
                 <DnaButton 
                   onClick={() => {
                     if (!selectedItem || !poSupplier || !poQty || !poPrice) return;
                     createPOMutation.mutate({
                       materialId: selectedItem.materialId || selectedItem.kode,
                       supplierId: poSupplier,
                       qty: poQty || Math.abs(selectedItem.selisih),
                       unitPrice: poPrice,
                     });
                   }}
                   disabled={!poSupplier || !poPrice || createPOMutation.isPending}
                   variant="primary"
                   icon={<CheckCircle2 />}
                   className="flex-[2] h-11 hover:scale-[1.02]"
                 >
                   {createPOMutation.isPending ? "Processing..." : "Initialize Purchase Order"}
                 </DnaButton>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Owner Insight Panel */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 flex gap-6 items-center shadow-sm">
         <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-blue-50">
            <Coins className="h-6 w-6" />
         </div>
         <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 italic">💡 Procurement Insight: Liquidity & Inventory Balance</p>
            <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase">
               "Consolidating POs for <span className="text-blue-600 font-black">Critical Materials</span> can reduce logistics costs by up to 15%. 
               Focus on high-volume materials like <span className="font-black text-slate-900 italic">Glycerin</span> and <span className="font-black text-slate-900 italic">Aquades</span> to leverage bulk pricing with our Tier-1 suppliers."
            </p>
         </div>
      </div>
    </DashboardShell>
  );
}
