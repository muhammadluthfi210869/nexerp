"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { EmptyState } from "@/components/empty-state";

export default function ReceivingPage() {
 const queryClient = useQueryClient();
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedPO, setSelectedPO] = useState("");
 const [doRef, setDoRef] = useState("");
 const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>({});
 
 const { data: purchaseOrders } = useQuery({
 queryKey: ["approved-po"],
 queryFn: async () => {
 const res = await api.get("/scm/purchase-orders");
 return (unwrapResponse(res) || [])
 .filter((po: any) => po.status === 'ORDERED' || po.status === 'SHIPPED')
 .map((po: any) => ({
 id: po.id,
 number: po.poNumber || po.id,
 vendor: po.supplier?.name || '-',
 items: (po.items || []).map((i: any) => ({
 materialId: i.materialId,
 name: i.material?.name || '-',
 qty: Number(i.quantity || 0),
 receivedQty: Number(i.receivedQty || 0),
 unit: i.material?.unit || 'PCS',
 })),
 }));
 }
 });

 const { data: warehouses = [] } = useQuery({
 queryKey: ["receiving-warehouses"],
 queryFn: async () => unwrapResponse(await api.get("/warehouse/warehouses")) || [],
 });

 const { data: receipts, isLoading } = useQuery({
 queryKey: ["goods-receipts"],
 queryFn: async () => {
 const res = await api.get("/scm/inbounds");
 return (unwrapResponse(res) || []).map((grn: any) => ({
 receiptId: grn.id,
 id: grn.inboundNumber || grn.id,
 poId: grn.po?.poNumber || grn.poId || '-',
 vendor: grn.po?.supplier?.name || '-',
 date: grn.receivedAt ? new Date(grn.receivedAt).toISOString().split('T')[0] : '-',
 status: grn.status === 'APPROVED' ? 'POSTED' : grn.status,
 qc: grn.items?.every((item: any) => item.qcStatus === 'GOOD') ? 'PASSED' : grn.status === 'APPROVED' ? 'QUARANTINE' : 'WAITING',
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
 const postGRNMutation = useMutation({
 mutationFn: (id: string) => api.patch(`/scm/inbounds/${id}/status`, { status: "APPROVED" }),
 onSuccess: () => { toast.success("Goods Receipt posted. Stock tercatat sebagai QUARANTINE."); queryClient.invalidateQueries({ queryKey: ["goods-receipts"] }); queryClient.invalidateQueries({ queryKey: ["approved-po"] }); },
 onError: (err: any) => toast.error(err.response?.data?.message || "Posting GRN gagal."),
 });

 const arrivalsToday = receipts?.filter((r: any) => r.date === new Date().toISOString().split('T')[0]).length || 0;
 const awaitingQc = receipts?.filter((r: any) => r.qc === 'WAITING').length || 0;
 const verifiedMtd = receipts?.filter((r: any) => r.status === 'VERIFIED').length || 0;
 const rejected = receipts?.filter((r: any) => r.status === 'REJECTED' || r.qc === 'FAILED').length || 0;

 return (
 <OperationalMigrationShell
 title="Penerimaan Barang"
 subtitle="Verifikasi logistik masuk & serah terima QC"
 actions={
 <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
 <DialogTrigger asChild>
 <DnaButton variant="primary" icon={<Plus className="h-4 w-4" />}>
 Daftarkan Kedatangan
 </DnaButton>
 </DialogTrigger>
 <DialogContent className="sm:max-w-2xl bg-white rounded-[24px] border border-slate-100 p-0 overflow-hidden">
 <div className="bg-white p-8 text-slate-900 flex justify-between items-center border-b border-slate-200">
 <div>
 <h2 className="text-lg font-semibold">Penerimaan Barang Baru (GRN)</h2>
 <p className="text-slate-500 text-xs mt-1">Catat kedatangan barang untuk proses QC.</p>
 </div>
 <PackageCheck className="h-12 w-12 text-blue-500 opacity-50 pointer-events-none" />
 </div>

 <div className="p-10 space-y-8">
 <div className="space-y-6">
 <div className="space-y-3">
 <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Hubungkan ke PO</label>
 <Select value={selectedPO} onValueChange={(val: string | null) => setSelectedPO(val || "")}>
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
 <SelectValue placeholder="Cari PO Aktif..." />
 </SelectTrigger>
 <SelectContent className="bg-white border-none shadow-sm rounded-2xl p-2">
 {purchaseOrders?.map((po: any) => (
 <SelectItem key={po.id} value={po.id} className="font-black py-3 rounded-xl">
 {po.number} <span className="text-[10px] text-slate-400 ml-2">Vendor: {po.vendor}</span>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">No. DO / Referensi</label>
 <DnaInput placeholder="No. Pengiriman Vendor" value={doRef} onChange={(e) => setDoRef(e.target.value)} />
 </div>

 {selectedPO && (
 <div className="space-y-3 rounded-2xl border border-slate-200 p-4 bg-slate-50/60">
 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jumlah fisik diterima</p>
 {purchaseOrders?.find((po: any) => po.id === selectedPO)?.items?.map((item: any) => (
 <div key={item.materialId} className="grid grid-cols-[1fr_120px] gap-3 items-center">
 <p className="text-xs font-bold text-slate-700">{item.name} <span className="text-slate-400">· pesan {item.qty} {item.unit} · sisa {item.qty - item.receivedQty} {item.unit}</span></p>
 <DnaInput aria-label={`Jumlah diterima ${item.name}`} type="number" min="0" max={item.qty - item.receivedQty} placeholder="0" value={receivedQtys[item.materialId] || ""} onChange={(e) => setReceivedQtys((old) => ({ ...old, [item.materialId]: e.target.value }))} />
 </div>
 ))}
 </div>
 )}

 <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
 <ShieldCheck className="h-5 w-5" />
 </div>
 <div>
 <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight">Perlu Serah Terima QC</p>
 <p className="text-xs font-black text-blue-700 mt-0.5">Verifikasi akan diteruskan ke Lab QC.</p>
 </div>
 </div>
 <DnaBadge status="info" className="bg-white">
 Gate 1: Registry
 </DnaBadge>
 </div>
 </div>

 <div className="pt-6 flex gap-4">
 <DnaButton variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</DnaButton>
 <DnaButton variant="primary" size="lg" className="flex-1" disabled={createGRNMutation.isPending} onClick={() => {
 const selectedPo = purchaseOrders?.find((po: any) => po.id === selectedPO);
 const items = (selectedPo?.items || []).map((i: any) => ({ materialId: i.materialId, qtyActual: Number(receivedQtys[i.materialId] || 0) })).filter((i: any) => i.qtyActual > 0);
 if (!selectedPO || !warehouses[0]?.id || !items.length) { toast.error("Pilih PO, gudang aktif, dan masukkan jumlah fisik yang diterima."); return; }
 createGRNMutation.mutate({
 poId: selectedPO,
 warehouseId: warehouses[0].id,
 supplierReference: doRef || undefined,
 idempotencyKey: crypto.randomUUID(),
 items,
 });
 }}>
 {createGRNMutation.isPending ? 'MENGIRIM...' : 'Simpan Kedatangan'}
 </DnaButton>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 }
 >
 {/* KPI Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <StatCard label="Kedatangan Hari Ini" value={arrivalsToday} icon={<Truck className="text-blue-600" />} />
 <StatCard label="Menunggu QC" value={awaitingQc} icon={<FileSearch className="text-amber-600" />} />
 <StatCard label="Terverifikasi (MTD)" value={verifiedMtd} icon={<ShieldCheck className="text-emerald-600" />} />
 <StatCard label="Ditolak" value={rejected} icon={<AlertTriangle className="text-rose-600" />} />
 </div>

 {/* Receipts Table */}
 <TableWrapper>
 <Table>
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-7 pl-10">ID GRN</TableHead>
 <TableHead>PO Asal</TableHead>
 <TableHead>Pemasok</TableHead>
 <TableHead className="text-center">Status QC</TableHead>
 <TableHead className="text-center">Status</TableHead>
 <TableHead className="pr-10 text-right">Verifikasi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {!isLoading && (!receipts || receipts.length === 0) ? (
 <TableRow>
 <TableCell colSpan={6} className="py-20">
 <EmptyState
 icon={<PackageCheck className="h-8 w-8 text-slate-300" />}
 title="Belum Ada Penerimaan"
 description="Belum ada barang yang diterima. Daftarkan kedatangan baru untuk memulai."
 action={
 <DnaButton variant="primary" onClick={() => setIsModalOpen(true)}>
 Daftarkan Kedatangan
 </DnaButton>
 }
 />
 </TableCell>
 </TableRow>
 ) : receipts?.map((receipt: any) => (
 <TableRow key={receipt.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
 <TableCell className="py-8 pl-10">
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform border border-slate-200">
 <ClipboardCheck className="h-5 w-5 text-blue-500" />
 </div>
 <div className="flex flex-col">
 <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{receipt.id}</span>
 <span className="text-[10px] font-black text-slate-400 uppercase">{receipt.date}</span>
 </div>
 </div>
 </TableCell>
 <TableCell>
 <DnaBadge status="default">
 {receipt.poId}
 </DnaBadge>
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
 <DnaBadge status={
 receipt.qc === 'PASSED' ? 'success' :
 receipt.qc === 'WAITING' ? 'warning' : 'critical'
 }>
 {getOperationalStatusLabel(receipt.qc)}
 </DnaBadge>
 </TableCell>
 <TableCell className="text-center">
 <DnaBadge status={receipt.status === 'POSTED' ? 'info' : 'default'}>
 {getOperationalStatusLabel(receipt.status)}
 </DnaBadge>
 </TableCell>
 <TableCell className="pr-10 text-right">
 <div className="flex justify-end gap-2">
 <Button variant="ghost" size="sm" disabled={receipt.status !== 'PENDING' || postGRNMutation.isPending} onClick={() => postGRNMutation.mutate(receipt.receiptId)} className="rounded-xl font-black uppercase text-[9px] text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2">
 <FileSearch className="h-3 w-3" /> {receipt.status === 'PENDING' ? 'Post GRN' : 'Inspeksi'}
 </Button>
 <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200 shadow-sm bg-white hover:bg-slate-100 hover:text-slate-900 transition-all">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableWrapper>
 </OperationalMigrationShell>
 );
}
