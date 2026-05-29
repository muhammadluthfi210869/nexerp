"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { 
  Plus, 
  Search, 
  RotateCcw,
  Truck,
  PackageX,
  ChevronRight,
  ClipboardList,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Filter,
  BadgeCheck,
  XCircle,
  Ban,
  User
} from "lucide-react";
import { DnaInput, DnaBadge, DnaButton, TableWrapper } from "@/components/dna";
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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function PurchaseReturnsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInbound, setSelectedInbound] = useState<string | null>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [approveDialog, setApproveDialog] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: returns, isLoading } = useQuery({
    queryKey: ["purchase-returns"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-returns");
      return unwrapResponse(res) || [];
    }
  });

  const { data: inbounds } = useQuery({
    queryKey: ["inbounds-approved"],
    queryFn: async () => {
      const res = await api.get("/scm/inbounds");
      const inboundsData = unwrapResponse(res) || [];
      return inboundsData.filter((i: any) => i.status === "APPROVED");
    }
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/master/suppliers");
      return unwrapResponse(res);
    }
  });

  const handleSelectInbound = (id: string) => {
    setSelectedInbound(id);
    const inbound = inbounds?.find((i: any) => i.id === id);
    if (inbound) {
      setReturnItems(inbound.items.map((item: any) => ({
        materialId: item.materialId,
        name: item.material.name,
        qtyReceived: item.quantity,
        qtyReturn: 0,
        unitPrice: item.unitPrice,
      })));
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post("/scm/purchase-returns", data);
    },
    onSuccess: () => {
      toast.success("Retur pembelian berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      setIsModalOpen(false);
      setReturnItems([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal membuat retur.");
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/scm/purchase-returns/${id}/status`, { status: "COMPLETED" });
    },
    onSuccess: () => {
      toast.success("Retur selesai. Stok diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
    }
  });

  const approveReturnMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/scm/purchase-returns/${id}/status`, { status: "COMPLETED" });
    },
    onSuccess: () => {
      toast.success("Retur pembelian disetujui.");
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      setApproveDialog(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui retur.");
    }
  });

  const rejectReturnMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return api.patch(`/scm/purchase-returns/${id}/status`, { status: "CANCELLED" });
    },
    onSuccess: () => {
      toast.success("Retur pembelian ditolak.");
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      setRejectDialog(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menolak retur.");
    }
  });

  const handleSubmit = () => {
    const validItems = returnItems.filter(i => i.qtyReturn > 0);
    if (validItems.length === 0) {
        toast.error("Pilih minimal satu item untuk diretur.");
        return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    const validItems = returnItems.filter(i => i.qtyReturn > 0);
    const inbound = inbounds?.find((i: any) => i.id === selectedInbound);
    createMutation.mutate({
      supplierId: inbound.po.supplierId,
      warehouseId: inbound.warehouseId,
      inboundId: selectedInbound,
      items: validItems.map(i => ({
        materialId: i.materialId,
        quantity: i.qtyReturn,
        unitPrice: i.unitPrice
      }))
    });
  };

  return (
    <DashboardShell
      title="RETUR"
      titleAccent="PEMBELIAN"
      subtitle="Kelola debit pemasok, penolakan material, dan pembalikan stok."
      actions={
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <DnaButton variant="primary" size="lg" icon={<Plus />} className="bg-rose-600 hover:bg-rose-700 shadow-sm h-16 px-10 rounded-2xl">
              Buat Retur
            </DnaButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-white rounded-[24px] border border-slate-100 shadow-2xl p-0 overflow-hidden">
            <div className="bg-rose-900 p-8 text-white flex justify-between items-center">
               <div>
                   <h2 className="text-xl font-black tracking-tight text-white">Transaksi Retur SCM</h2>
                   <p className="text-rose-200 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Inventory Correction Protocol v4.0</p>
               </div>
               <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0 pointer-events-none">
                  <PackageX className="h-6 w-6 text-rose-300" />
               </div>
            </div>

            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto">
               <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">Referensi Penerimaan Barang</label>
                  <Select onValueChange={(val: string | null) => val && handleSelectInbound(val)}>
                     <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                        <SelectValue placeholder="Pilih GR untuk Retur..." />
                     </SelectTrigger>
                     <SelectContent className="bg-white border-slate-200 shadow-sm rounded-2xl p-2">
                        {inbounds?.map((i: any) => (
                           <SelectItem key={i.id} value={i.id} className="font-black py-3 rounded-lg">
                              {i.inboundNumber} <span className="text-slate-400 ml-2">({i.po?.poNumber} - {i.po?.supplier?.name})</span>
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               {selectedInbound && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Daftar Material Ditolak</h4>
                       <DnaBadge status="critical">Perlu Verifikasi</DnaBadge>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                        <Table>
                           <TableHeader className="bg-slate-50/50">
                              <TableRow className="hover:bg-transparent border-slate-100">
                                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">Nama Material</TableHead>
                                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Qty GR</TableHead>
                                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Qty Retur</TableHead>
                                 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Harga Satuan</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody className="divide-y divide-slate-100">
                              {returnItems.map((item, idx) => (
                                 <TableRow key={idx} className="group hover:bg-slate-50 transition-all border-none">
                                    <TableCell className="py-4 px-4">
                                       <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                                             <ClipboardList className="h-5 w-5" />
                                          </div>
                                          <p className="font-black text-slate-900 text-sm">{item.name}</p>
                                       </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-4 text-center font-black text-slate-500">{item.qtyReceived}</TableCell>
                                    <TableCell className="py-4 px-4 text-center">
                                       <DnaInput 
                                          type="number" 
                                          value={item.qtyReturn} 
                                          onChange={(e) => {
                                             const val = Number(e.target.value);
                                             if (val > item.qtyReceived) return toast.error("Return qty cannot exceed GR qty");
                                             const newItems = [...returnItems];
                                             newItems[idx].qtyReturn = val;
                                             setReturnItems(newItems);
                                          }}
                                          className="w-24 mx-auto h-12 text-center" 
                                       />
                                    </TableCell>
                                    <TableCell className="py-4 px-4 text-right">
                                       <p className="font-black text-slate-900 text-sm">Rp {item.unitPrice.toLocaleString()}</p>
                                    </TableCell>
                                 </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                    </div>
                 </div>
               )}

               <div className="pt-6 flex gap-4">
                  <DnaButton variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</DnaButton>
                  <DnaButton 
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!selectedInbound || createMutation.isPending}
                    className="flex-1 bg-rose-900 hover:bg-rose-950 shadow-sm"
                  >
                    Konfirmasi Retur
                  </DnaButton>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Engine Badge */}
      <div className="flex items-center gap-3 mb-8">
        <RotateCcw className="h-5 w-5 text-rose-500 animate-spin-slow" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">Reverse Logistics Engine</span>
      </div>

      {/* Registry */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-8 bg-rose-500 rounded-full" />
           <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar Retur</h3>
        </div>

        <TableWrapper>
           <Table>
                   <TableHeader className="bg-slate-50/50">
                  <TableRow className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">No. Retur</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">Pemasok</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">Pembuat</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right tabular-nums">Nilai</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                     <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Verifikasi</TableHead>
                  </TableRow>
               </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                  {returns?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-20 text-center">
                         <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400 font-medium">Belum ada transaksi retur pada periode ini.</p>
                      </TableCell>
                    </TableRow>
                  ) : returns?.map((ret: any) => (
                     <TableRow key={ret.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                        <TableCell className="py-4 px-4">
                           <div className="flex items-center gap-4">
                              <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                                 <RotateCcw className="h-5 w-5" />
                              </div>
                              <div>
                                 <span className="font-black text-slate-900 text-base">{ret.returnNumber}</span>
                                 <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{new Date(ret.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 font-black text-slate-700 text-sm">{ret.supplier?.name}</TableCell>
                        <TableCell className="py-4 px-4">
                           <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-[10px] font-medium text-slate-600">{ret.creator?.fullName || '-'}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right tabular-nums font-black text-rose-600 text-base">Rp {Number(ret.totalValue).toLocaleString()}</TableCell>
                        <TableCell className="py-4 px-4 text-center">
                           <DnaBadge status={ret.status === 'COMPLETED' ? 'success' : ret.status === 'CANCELLED' || ret.status === 'REJECTED' ? 'default' : ret.status === 'WAITING_APPROVAL' ? 'warning' : 'info'}>
                              {ret.status?.replace('_', ' ') || 'DRAFT'}
                           </DnaBadge>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                           <div className="flex justify-end gap-1.5">
                              {ret.status === 'DRAFT' && (
                                 <DnaButton 
                                   variant="primary"
                                   size="sm"
                                   onClick={() => completeMutation.mutate(ret.id)}
                                   className="bg-emerald-600 hover:bg-emerald-700"
                                 >
                                     Finalisasi & Balik Stok
                                 </DnaButton>
                              )}
                              {ret.status === 'WAITING_APPROVAL' && (
                                 <>
                                    <DnaButton variant="primary" size="sm" onClick={() => setApproveDialog(ret.id)} className="bg-emerald-600 hover:bg-emerald-700">
                                       <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Setuju
                                    </DnaButton>
                                    <DnaButton variant="outline" size="sm" onClick={() => setRejectDialog(ret.id)} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                                       <XCircle className="h-3.5 w-3.5 mr-1" /> Tolak
                                    </DnaButton>
                                 </>
                              )}
                              {ret.status === 'COMPLETED' && (
                                 <div className="flex items-center justify-end gap-2 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase">Stok Dikembalikan</span>
                                 </div>
                              )}
                           </div>
                        </TableCell>
                     </TableRow>
                  ))}
              </TableBody>
           </Table>
        </TableWrapper>
      </div>
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

      {/* Approve Confirmation */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => { if (!open) setApproveDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-500" />
              Konfirmasi Persetujuan Retur
            </DialogTitle>
            <DialogDescription>
              Setujui retur pembelian ini? Stok akan dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DnaButton variant="ghost" onClick={() => setApproveDialog(null)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={() => approveDialog && approveReturnMutation.mutate(approveDialog)} className="bg-emerald-600 hover:bg-emerald-700">
              Ya, Setujui
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(null); setRejectReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-rose-500" />
              Konfirmasi Penolakan Retur
            </DialogTitle>
            <DialogDescription>
              Tolak retur pembelian ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label className="text-[9px] font-black text-slate-400 uppercase">Alasan Penolakan</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan mengapa ditolak..."
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium resize-none"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <DnaButton variant="ghost" onClick={() => { setRejectDialog(null); setRejectReason(""); }}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={() => rejectDialog && rejectReturnMutation.mutate({ id: rejectDialog, reason: rejectReason })} className="bg-rose-600 hover:bg-rose-700">
              Ya, Tolak
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
