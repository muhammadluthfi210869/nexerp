"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DnaButton, DnaBadge, DnaInput, StatCard, TableWrapper } from "@/components/dna";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Search, 
  FileText, 
  ShoppingCart, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Package
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";

interface PRItem {
  materialId: string;
  materialName: string;
  qtyRequired: number;
  estimatedPrice?: number;
}

interface PurchaseRequest {
  id: string;
  requestDate: string;
  warehouseId: string;
  warehouse: { name: string };
  priority: 'LOW' | 'MEDIUM' | 'URGENT';
  status: 'DRAFT' | 'APPROVED' | 'ORDERED';
  notes?: string;
  items: Array<{
    id: string;
    material: { name: string };
    qtyRequired: number;
    estimatedPrice: number;
  }>;
}

export default function PurchaseRequestsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [requiredDate, setRequiredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PRItem[]>([]);
  
  // New Item State
  const [newItemMaterialId, setNewItemMaterialId] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch PRs
  const { data: requests, isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-requests");
      return unwrapResponse(res);
    },
  });

  // Fetch Warehouses
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/master/warehouses");
      return unwrapResponse(res) || [];
    },
  });

  // Fetch Materials
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await api.get("/master/materials");
      return unwrapResponse(res) || [];
    },
  });

  const filteredRequests = useMemo(() => {
    if (!searchTerm || !requests) return requests || [];
    const term = searchTerm.toLowerCase();
    return requests.filter((pr: any) =>
      pr.warehouse?.name?.toLowerCase().includes(term) ||
      pr.priority?.toLowerCase().includes(term) ||
      pr.status?.toLowerCase().includes(term) ||
      pr.notes?.toLowerCase().includes(term)
    );
  }, [requests, searchTerm]);

  const createPRMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/purchase-request", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Purchase Request successfully broadcasted to SCM.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Protocol Error: Failed to commit request.");
    }
  });

  const resetForm = () => {
    setSelectedWarehouse("");
    setPriority("MEDIUM");
    setNotes("");
    setItems([]);
  };

  const addItem = () => {
    if (!newItemMaterialId || !newItemQty) return;
    const material = materials.find((m: any) => m.id === newItemMaterialId);
    if (!material) return;

    setItems([...items, {
      materialId: newItemMaterialId,
      materialName: material.name,
      qtyRequired: Number(newItemQty),
      estimatedPrice: material.lastPurchasePrice || 0
    }]);
    setNewItemMaterialId("");
    setNewItemQty("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Payload Empty: Add at least one material.");
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    createPRMutation.mutate({
      warehouseId: selectedWarehouse,
      priority,
      requiredDate,
      notes,
      items: items.map(i => ({
        materialId: i.materialId,
        qtyRequired: i.qtyRequired,
        estimatedPrice: i.estimatedPrice
      }))
    });
  };

  return (
    <DashboardShell
      title="PERMINTAAN"
      titleAccent="PEMBELIAN"
      subtitle="(Internal Procurement & Supply Chain Demand Logic • Protocol v1.0)"
      actions={
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <DnaButton variant="primary" icon={<Plus className="h-4 w-4 stroke-[3px]" />}>
              Buat PR
            </DnaButton>
          </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-white rounded-[24px] border border-slate-100 shadow-2xl p-0 overflow-hidden">
            <div className="bg-blue-600 p-8 text-white relative">
               <DialogTitle className="text-xl font-black uppercase tracking-tighter leading-none italic">Kebutuhan Material</DialogTitle>
                <DialogDescription className="text-blue-100 font-black uppercase text-[9px] tracking-tight mt-2">Permintaan formal ke SCM untuk pengadaan</DialogDescription>
               <FileText className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 text-blue-500 opacity-30 pointer-events-none" />
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase block pl-1">Gudang Tujuan <span className="text-red-500">*</span></Label>
                  <Select value={selectedWarehouse} onValueChange={(val) => { if (typeof val === 'string') setSelectedWarehouse(val); }} required>
                    <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                      <SelectValue placeholder="Pilih Gudang" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((w: any) => (
                        <SelectItem key={w.id} value={w.id} className="font-black text-xs">{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase block pl-1">Tingkat Prioritas <span className="text-red-500">*</span></Label>
                  <Select value={priority} onValueChange={(val) => { if (typeof val === 'string') setPriority(val); }} required>
                    <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW" className="font-black text-blue-600 text-xs">LOW</SelectItem>
                      <SelectItem value="MEDIUM" className="font-black text-amber-600 text-xs">MEDIUM</SelectItem>
                      <SelectItem value="URGENT" className="font-black text-rose-600 text-xs">URGENT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase block pl-1">Tgl Dibutuhkan <span className="text-red-500">*</span></Label>
                   <DnaInput 
                     type="date" 
                     value={requiredDate}
                     onChange={(e) => setRequiredDate(e.target.value)}
                     required
                   />
                </div>
              </div>

              {/* ITEM BUILDER */}
              <div className="space-y-4">
                 <Label className="text-[9px] font-black text-slate-900 uppercase block pl-1">Item Material</Label>
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3">
                    <Select value={newItemMaterialId} onValueChange={(val) => { if (typeof val === 'string') setNewItemMaterialId(val); }}>
                    <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                       <SelectValue placeholder="Cari Material..." />
                    </SelectTrigger>
                      <SelectContent>
                        {materials?.map((m: any) => (
                          <SelectItem key={m.id} value={m.id} className="font-black text-xs">{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DnaInput 
                    type="number" 
                    placeholder="Jml" 
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                  />
                    <DnaButton variant="primary" type="button" onClick={addItem}>
                    TAMBAH
                  </DnaButton>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <Table className="table-dense">
                    <TableHeader className="bg-slate-100/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-[9px] font-black uppercase">Material</TableHead>
                        <TableHead className="h-9 text-[9px] font-black uppercase">Jml</TableHead>
                        <TableHead className="h-9 text-[9px] font-black uppercase text-right">Estimasi Harga</TableHead>
                        <TableHead className="h-9 text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-16 text-center text-[9px] font-black text-slate-300 italic uppercase">Belum ada item</TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, idx) => (
                          <TableRow key={idx} className="bg-white hover:bg-slate-50/50 border-b border-slate-50">
                            <TableCell className="font-black text-xs">{item.materialName}</TableCell>
                            <TableCell className="font-black text-xs text-blue-600">{item.qtyRequired}</TableCell>
                            <TableCell className="text-right font-black text-xs">{formatCurrency(item.estimatedPrice || 0)}</TableCell>
                            <TableCell className="text-right">
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-rose-500 hover:bg-rose-50 h-8 w-8 p-0">
                                <Trash2 size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black text-slate-400 uppercase block pl-1">Catatan</Label>
                <Textarea 
                  placeholder="Alasan permintaan (contoh: Untuk Batch 502, Skincare Line)" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <DnaButton 
                variant="primary"
                type="submit" 
                className="w-full"
                disabled={createPRMutation.isPending}
              >
                {createPRMutation.isPending ? <Loader2 className="animate-spin" /> : "Kirim Permintaan"}
              </DnaButton>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<FileText className="text-blue-600" />} label="Total Permintaan" value={requests?.length || 0} />
        <StatCard icon={<Clock className="text-amber-600" />} label="Menunggu Approve" value={requests?.filter(r => r.status === 'DRAFT').length || 0} />
        <StatCard icon={<AlertTriangle className="text-rose-600" />} label="Mendesak" value={requests?.filter(r => r.priority === 'URGENT').length || 0} />
        <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Sudah Dipesan" value={requests?.filter(r => r.status === 'ORDERED').length || 0} />
      </div>

      {/* DATA TABLE */}
      <TableWrapper>
        <Table className="table-dense">
           <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                 <TableHead className="py-3 pl-8 font-black text-slate-400 uppercase tracking-tight text-[9px]">Data Permintaan</TableHead>
                 <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Gudang</TableHead>
                 <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Jml Item</TableHead>
                 <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
                 <TableHead className="pr-8 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Aksi</TableHead>
              </TableRow>
           </TableHeader>
           <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-blue-600" /></TableCell></TableRow>
               )                : filteredRequests?.length === 0 ? (
                 <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400 font-black uppercase tracking-tight text-xs">Belum ada permintaan.</TableCell></TableRow>
               ) : (
                  filteredRequests?.map((pr: any) => (
                    <TableRow key={pr.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
                       <TableCell className="py-2.5 px-3 pl-8">
                          <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[10px] italic">
                                PR
                             </div>
                             <div>
                                <p className="font-black text-slate-900 tracking-tight text-xs leading-tight uppercase italic">#{pr.id.split('-')[0]}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5 italic">{new Date(pr.requestDate).toLocaleDateString()}</p>
                             </div>
                          </div>
                       </TableCell>
                       <TableCell className="py-2.5 px-3">
                          <div className="space-y-1">
                              <p className="text-slate-700 font-black text-xs tracking-tight flex items-center gap-1.5 uppercase italic">
                                <Package size={12} className="text-blue-600" /> {pr.warehouse.name}
                             </p>
                              <DnaBadge status={
                                pr.priority === 'URGENT' ? 'critical' :
                                pr.priority === 'MEDIUM' ? 'warning' : 'info'
                              }>
                                 {pr.priority} Priority
                              </DnaBadge>
                          </div>
                       </TableCell>
                       <TableCell className="py-2.5 px-3">
                          <div className="space-y-0.5">
                             <p className="font-black text-slate-900 text-xs">{pr.items.length} Materials</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight italic truncate max-w-[180px]">{pr.notes || "Tidak ada catatan"}</p>
                          </div>
                       </TableCell>
                       <TableCell className="py-2.5 px-3 text-center">
                           <DnaBadge status={
                              pr.status === 'ORDERED' ? 'success' :
                              pr.status === 'APPROVED' ? 'info' : 'default'
                           }>
                              {pr.status}
                           </DnaBadge>
                       </TableCell>
                       <TableCell className="py-2.5 px-3 pr-8 text-right">
                           <DnaButton variant="primary" size="sm">
                              Review <ArrowRight className="h-3 w-3" />
                           </DnaButton>
                       </TableCell>
                    </TableRow>
                 ))
              )}
           </TableBody>
        </Table>
      </TableWrapper>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menyimpan data ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

