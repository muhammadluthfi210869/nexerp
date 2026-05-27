"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { 
  Plus, 
  Search, 
  FileEdit, 
  Truck,
  PackageCheck,
  ChevronRight,
  User,
  Package,
  Calendar,
  Trash2,
  ShieldAlert,
  ClipboardList,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Send,
  Droplets,
  Zap,
  Filter,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DnaButton, DnaBadge, DnaInput, StatCard, TableWrapper } from "@/components/dna";
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
  DialogContent 
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
import { QueryLoading, QueryError } from "@/components/query-states";

export default function PurchasingPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState("NET 30");
  const [downPayment, setDownPayment] = useState("0");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/scm/vendors");
      return unwrapResponse(res) || [];
    }
  });

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: async () => {
      const res = await api.get("/scm/materials");
      return (unwrapResponse(res) || []).filter((m: any) => m.type === "RAW_MATERIAL");
    }
  });

  const { data: warehouses, isLoading: whLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/master/warehouses/active");
      return unwrapResponse(res) || [];
    }
  });

  const { data: prs, isLoading: prsLoading } = useQuery({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-requests");
      return unwrapResponse(res);
    }
  });

  const { data: purchaseOrders, isLoading: poLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return (unwrapResponse(res) || []).map((po: any) => ({
        id: po.poNumber || po.id,
        vendor: po.supplier?.name || '-',
        date: po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-',
        total: Number(po.totalValue || 0),
        status: po.status === 'RECEIVED' ? 'CLOSED' : po.status === 'ORDERED' ? 'APPROVED' : po.status === 'CANCELLED' ? 'CLOSED' : 'DRAFT',
        type: 'PURCHASE_ORDER',
      }));
    }
  });

  const createPRMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/purchase-request", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Purchase Requisition submitted for approval.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setIsModalOpen(false);
      setItems([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit requisition.");
    }
  });

  const pendingPrCount = String(prs?.filter((r: any) => r.status === 'DRAFT').length || 0).padStart(2, '0');
  const activePoCount = String(purchaseOrders?.length || 0).padStart(2, '0');
  const awaitingGrnCount = String(purchaseOrders?.filter((po: any) => po.status === 'APPROVED').length || 0).padStart(2, '0');
  const criticalShortageCount = String(materials?.filter((m: any) => Number(m.stockQty || 0) < Number(m.reorderPoint || 0)).length || 0).padStart(2, '0');

  const addItem = (materialId: string) => {
    const material = materials?.find((m: any) => m.id === materialId);
    if (!material) return;
    setItems([...items, { id: material.id, name: material.name, qty: 1, unit: material.unit, price: material.unitPrice || 0 }]);
  };

  return (
    <DashboardShell
      title="PENGADAAN"
      titleAccent="& REQUISISI"
      subtitle="Pengisian stok, koordinasi pemasok, dan analitik pengadaan"
      actions={
        <DnaButton variant="primary" size="lg" onClick={() => setIsModalOpen(true)} icon={<Plus className="group-hover:rotate-90 transition-transform duration-300" />}>
          Buat Requisisi
        </DnaButton>
      }
    >
      {vendorsLoading || materialsLoading || whLoading || prsLoading || poLoading ? (
        <QueryLoading message="Memuat data pengadaan..." />
      ) : (
      <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-[24px] border border-slate-100 shadow-2xl p-0 overflow-hidden">
            <div className="bg-white p-8 text-slate-900 border-b border-slate-200 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-xl font-black tracking-tight">Requisisi Baru</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Strategic Sourcing Protocol v4.0</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                   <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
            </div>

            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase block">Pemasok Tujuan</label>
                      <Select value={selectedVendor} onValueChange={(val: string | null) => setSelectedVendor(val || "")}>
                         <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                            <SelectValue placeholder="Pilih Pemasok" />
                         </SelectTrigger>
                         <SelectContent className="bg-white border-slate-200 shadow-sm rounded-2xl p-2">
                            {vendors?.map((v: any) => (
                               <SelectItem key={v.id} value={v.id} className="font-medium py-3 rounded-lg">
                                  {v.name}
                               </SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase block">Gudang Penerima</label>
                      <Select value={selectedWarehouse} onValueChange={(val: string | null) => setSelectedWarehouse(val || "")}>
                         <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                            <SelectValue placeholder="Pilih Gudang" />
                         </SelectTrigger>
                         <SelectContent className="bg-white border-slate-200 shadow-sm rounded-2xl p-2">
                            {warehouses?.map((w: any) => (
                               <SelectItem key={w.id} value={w.id} className="font-medium py-3 rounded-lg">
                                  {w.name}
                               </SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase block">Syarat Pembayaran</label>
                      <Select value={paymentTerms} onValueChange={(val: string | null) => setPaymentTerms(val || "")}>
                         <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                            <SelectValue placeholder="Terms" />
                         </SelectTrigger>
                         <SelectContent className="bg-white border-slate-200 shadow-sm rounded-2xl p-2">
                            <SelectItem value="CASH" className="font-medium py-3 rounded-lg">CASH ON DELIVERY</SelectItem>
                            <SelectItem value="NET 7" className="font-medium py-3 rounded-lg">NET 7 DAYS</SelectItem>
                            <SelectItem value="NET 30" className="font-medium py-3 rounded-lg">NET 30 DAYS</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>
 
                 <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase block">Tingkat Urgensi</label>
                      <Select value={urgency} onValueChange={(val: string | null) => setUrgency(val || "NORMAL")}>
                         <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="bg-white border-slate-200 shadow-sm rounded-2xl p-2">
                            <SelectItem value="NORMAL" className="font-medium py-3 rounded-lg">Normal Operation</SelectItem>
                            <SelectItem value="URGENT" className="font-medium py-3 rounded-lg text-amber-600">Urgent Priority</SelectItem>
                            <SelectItem value="CRITICAL" className="font-medium py-3 rounded-lg text-rose-600">Critical Halt</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase block">Uang Muka (DP)</label>
                      <DnaInput 
                          type="number" 
                          value={downPayment}
                          onChange={(e) => setDownPayment(e.target.value)}
                          icon={<span className="font-black text-[10px]">RP</span>}
                       />
                   </div>
                </div>

               <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase block">Pilih Material</label>
                  <Select onValueChange={(val: string | null) => val && addItem(val)}>
                     <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                        <SelectValue placeholder="+ Tambah Material ke Requisisi" />
                     </SelectTrigger>
                     <SelectContent className="bg-white border-slate-200 shadow-sm rounded-2xl p-2">
                        {materials?.map((m: any) => (
                           <SelectItem key={m.id} value={m.id} className="font-medium py-3 rounded-lg transition-all">
                              {m.name} <span className="text-[10px] text-slate-400 ml-3">Unit: {m.unit}</span>
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                   <Table>
                      <TableHeader className="bg-slate-50/50">
                         <TableRow className="bg-slate-50/50">
                           <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">Material</TableHead>
                           <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Jumlah</TableHead>
                           <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Harga Satuan</TableHead>
                           <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Pajak</TableHead>
                           <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Subtotal</TableHead>
                            <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right"></TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                         {items.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={6} className="py-16 text-center">
                               <p className="text-slate-300 font-medium text-sm">Menunggu konfigurasi pasokan...</p>
                             </TableCell>
                           </TableRow>
                         ) : items.map((item) => (
                            <TableRow key={item.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                               <TableCell className="py-4 px-4">
                                 <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-600/10">
                                        <Package className="h-5 w-5" />
                                     </div>
                                     <div>
                                        <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                                        <p className="text-[10px] font-medium text-slate-400">Pasokan Domestik</p>
                                     </div>
                                  </div>
                               </TableCell>
                               <TableCell className="py-4 px-4 text-center">
                                  <DnaInput type="number" defaultValue={1} className="w-20 mx-auto text-center" />
                               </TableCell>
                               <TableCell className="py-4 px-4 text-right">
                                  <p className="font-medium text-slate-900 text-sm">Rp {item.price.toLocaleString()}</p>
                              </TableCell>
                               <TableCell className="py-4 px-4 text-center">
                                  <Select defaultValue="PPN">
                                    <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="PPN">PPN 11%</SelectItem>
                                       <SelectItem value="NON">NON-PPN</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </TableCell>
                               <TableCell className="py-4 px-4 text-right">
                                  <p className="font-black text-blue-600 text-sm">Rp {(item.price * 1.11).toLocaleString()}</p>
                               </TableCell>
                               <TableCell className="py-4 px-4 text-right">
                                  <Button variant="ghost" size="icon" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="h-9 w-9 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                                     <Trash2 className="h-4.5 w-4.5" />
                                  </Button>
                               </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </div>

               <div className="pt-6 flex gap-4">
                   <DnaButton variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 px-8">Batal</DnaButton>
                     <DnaButton variant="primary" className="flex-1" disabled={createPRMutation.isPending} onClick={() => {
                       createPRMutation.mutate({
                         warehouseId: selectedWarehouse || undefined,
                         priority: urgency === 'NORMAL' ? 'MEDIUM' : urgency,
                         notes: `Vendor: ${selectedVendor}`,
                         items: items.map((i) => ({ materialId: i.id, qtyRequired: 1, estimatedPrice: i.price })),
                       });
                     }}>
                       {createPRMutation.isPending ? 'MENGIRIM...' : 'Kirim Requisisi'}
                     </DnaButton>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      
      {/* KPI Stats Engine */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="PR Tertunda" value={pendingPrCount} icon={<FileEdit className="text-blue-600" />} />
            <StatCard label="PO Aktif" value={activePoCount} icon={<Truck className="text-blue-600" />} />
           <StatCard label="Menunggu GRN" value={awaitingGrnCount} icon={<PackageCheck className="text-emerald-600" />} />
           <StatCard label="Kekurangan Kritis" value={criticalShortageCount} icon={<ShieldAlert className="text-rose-600" />} />
        </div>

      {/* Registry Database */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar Requisisi</h3>
          </div>
          <div className="flex items-center gap-3">
              <DnaInput placeholder="Cari registry..." icon={<Search />} className="w-72" />
             <DnaButton variant="outline" icon={<Filter />}>
                Filter
             </DnaButton>
          </div>
        </div>

        <TableWrapper>
           <Table className="table-dense">
              <TableHeader className="bg-slate-50/50">
                  <TableRow className="bg-slate-50/50">
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">ID Registry</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">Pemasok</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">Tipe</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Nilai</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Aksi</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                 {purchaseOrders?.map((po: any) => (
                     <TableRow key={po.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                        <TableCell className="py-4 px-4">
                           <div className="flex items-center gap-3">
                               <div className="h-9 w-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 border border-slate-200">
                                 <ClipboardList className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                 <span className="font-black text-slate-900 text-xs uppercase italic leading-none">{po.id}</span>
                                 <p className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-wider">{po.date}</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                           <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                 <Truck className="h-3.5 w-3.5 text-slate-500" />
                              </div>
                              <p className="font-medium text-slate-700 text-xs">{po.vendor}</p>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                            <DnaBadge status="info">
                               {po.type.replace('_', ' ')}
                            </DnaBadge>
                        </TableCell>
                         <TableCell className="py-4 px-4 text-right font-black text-slate-900 text-xs tabular-nums">
                           Rp {po.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center">
                            <DnaBadge status={po.status === 'APPROVED' ? 'success' : po.status === 'CLOSED' ? 'default' : 'warning'}>
                               {po.status}
                            </DnaBadge>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                           <div className="flex justify-end gap-2">
                              {po.status === 'APPROVED' && (
                               <DnaButton variant="primary" size="sm" icon={<Send />}>
                                     SEND PO
                                  </DnaButton>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                 <MoreVertical className="h-4.5 w-4.5" />
                              </Button>
                           </div>
                        </TableCell>
                     </TableRow>
                 ))}
              </TableBody>
           </Table>
        </TableWrapper>
      </div>
      </>)}
    </DashboardShell>
  );
}
