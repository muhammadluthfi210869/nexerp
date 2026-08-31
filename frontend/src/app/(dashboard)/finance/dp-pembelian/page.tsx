"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 FileText,
 Building2,
 CreditCard,
 Save,
 Loader2,
 AlertCircle,
 ArrowDownCircle,
} from "lucide-react";
import { DnaInput, DnaButton, DnaBadge } from "@/components/dna";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
 OperationalMigrationShell,
 OperationalPanel,
 OperationalStatusBadge,
 getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalCurrency } from "@/lib/operational-formatters";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from "@/components/ui/dialog";

interface PurchaseOrder {
 id: string;
 poNumber: string;
 supplier?: { id: string; name: string };
 supplierName?: string;
 orderDate: string;
 items?: Array<{
 id: string;
 itemName: string;
 qty: number;
 unitPrice: number;
 totalPrice: number;
 }>;
 totalAmount: number;
 status: string;
}

interface Account {
 id: string;
 code: string;
 name: string;
}

export default function DpPembelianPage() {
 const queryClient = useQueryClient();
 const [selectedPoId, setSelectedPoId] = useState("");
 const [manualPoId, setManualPoId] = useState("");
 const [useManualInput, setUseManualInput] = useState(false);
 const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
 const [coaId, setCoaId] = useState("");
 const [amount, setAmount] = useState<number>(0);
 const [notes, setNotes] = useState("");
 const [showConfirm, setShowConfirm] = useState(false);

 const { data: purchaseOrders, isError: poError } = useQuery<PurchaseOrder[]>({
 queryKey: ["purchase-orders"],
 queryFn: async () => {
 const res = await api.get("/scm/purchase-orders");
 return res.data;
 },
 retry: false,
 });

 useEffect(() => {
 if (poError) setUseManualInput(true);
 }, [poError]);

 const { data: accounts } = useQuery<Account[]>({
 queryKey: ["finance-accounts"],
 queryFn: async () => {
 const res = await api.get("/finance/accounts");
 return res.data;
 },
 });

 const cashAccounts = (accounts || []).filter((a) => a.code.startsWith("11"));

 const selectedPo = useManualInput
 ? null
 : (purchaseOrders || []).find((po) => po.id === selectedPoId);

 const submitMutation = useMutation({
 mutationFn: async () => {
 const payload = {
 poId: useManualInput ? manualPoId : selectedPoId,
 date,
 coaId,
 amount: Number(amount),
 notes: notes || undefined,
 };
 await api.post("/finance/purchase-dp", payload);
 },
 onSuccess: () => {
 toast.success("DP Pembelian berhasil dicatat!");
 queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
 if (!useManualInput) setSelectedPoId("");
 else setManualPoId("");
 setDate(new Date().toISOString().split("T")[0]);
 setCoaId("");
 setAmount(0);
 setNotes("");
 },
 onError: (err: any) =>
 toast.error("Gagal mencatat DP Pembelian", {
 description: err.response?.data?.message || err.message,
 }),
 });

 const isSaveDisabled = useManualInput ? !manualPoId : !selectedPoId;
 const submitDisabled = isSaveDisabled || !date || !coaId || amount <= 0 || submitMutation.isPending;

 return (
 <OperationalMigrationShell
 title="DP"
 titleAccent="PEMBELIAN"
 subtitle="Uang Muka Pembelian — Purchase Down Payment Terminal"
 actions={
 <DnaBadge status="info">
 {submitMutation.isPending ? "PROCESSING..." : "TERMINAL SIAP"}
 </DnaBadge>
 }
 >
 {/* PO Selector */}
 <OperationalPanel>
 <div className="flex items-center gap-4 mb-6">
 <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
 <FileText className="h-5 w-5" />
 </div>
 <div>
 <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">
 Purchase Order Reference
 </h2>
 <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
 {useManualInput
 ? "Manual Entry Mode — PO endpoint unavailable"
 : "Select the purchase order to associate with this down payment"}
 </p>
 </div>
 </div>

 {!useManualInput ? (
 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
 Select Purchase Order
 </Label>
 <Select
 value={selectedPoId}
 onValueChange={(val) => setSelectedPoId(val || "")}
 >
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all outline-none w-full">
 <SelectValue placeholder="Choose PO..." />
 </SelectTrigger>
 <SelectContent>
 {purchaseOrders?.map((po) => (
 <SelectItem key={po.id} value={po.id}>
 {po.poNumber} — {po.supplier?.name || po.supplierName || "Unknown Supplier"}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {purchaseOrders && purchaseOrders.length === 0 && (
 <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-2">
 <AlertCircle className="h-3 w-3" /> No purchase orders available
 </p>
 )}
 </div>
 ) : (
 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
 PO ID / Number
 </Label>
 <DnaInput
 placeholder="Enter PO ID manually..."
 value={manualPoId}
 onChange={(e) => setManualPoId(e.target.value)}
 />
 <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
 <AlertCircle className="h-3 w-3 text-amber-500" /> Manual mode — enter the PO identifier
 </p>
 </div>
 )}
 </OperationalPanel>

 {/* PO Details Panel */}
 {selectedPo && (
 <OperationalPanel>
 <div className="flex items-center gap-4 mb-6">
 <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
 <Building2 className="h-5 w-5" />
 </div>
 <div>
 <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">
 {selectedPo.poNumber}
 </h2>
 <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
 {selectedPo.supplier?.name || selectedPo.supplierName} •{" "}
 {new Date(selectedPo.orderDate).toLocaleDateString("id-ID", {
 year: "numeric",
 month: "long",
 day: "numeric",
 })}
 </p>
 </div>
 <div className="ml-auto">
 <OperationalStatusBadge
 status={selectedPo.status === "APPROVED" ? "success" : selectedPo.status === "PENDING" ? "pending" : "neutral"}
 >
 {selectedPo.status.replace("_", " ")}
 </OperationalStatusBadge>
 </div>
 </div>

 {selectedPo.items && selectedPo.items.length > 0 && (
 <Table>
 <TableHeader className="bg-slate-50/50">
 <TableRow className="border-slate-100">
 <TableHead className="py-3 px-4 font-black text-slate-400 uppercase tracking-tight text-[9px]">
 Item
 </TableHead>
 <TableHead className="py-3 px-4 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
 Qty
 </TableHead>
 <TableHead className="py-3 px-4 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
 Unit Price
 </TableHead>
 <TableHead className="py-3 px-4 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
 Total
 </TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {selectedPo.items.map((item) => (
 <TableRow
 key={item.id}
 className="border-b border-slate-50 hover:bg-slate-50/30 transition-all"
 >
 <TableCell className="py-3 px-4 font-medium text-slate-900 text-sm">
 {item.itemName}
 </TableCell>
 <TableCell className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
 {item.qty.toLocaleString()}
 </TableCell>
 <TableCell className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
 {formatOperationalCurrency(item.unitPrice)}
 </TableCell>
 <TableCell className="py-3 px-4 text-right font-black text-slate-900 font-mono tabular-nums">
 {formatOperationalCurrency(item.totalPrice)}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 )}

 <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
 <div className="text-right">
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
 Total Pesanan
 </p>
 <p className="text-2xl font-black text-slate-900 tracking-tighter font-mono tabular-nums">
 {formatOperationalCurrency(selectedPo.totalAmount)}
 </p>
 </div>
 </div>
 </OperationalPanel>
 )}

 {/* DP Form */}
 <OperationalPanel>
 <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-rose-600">
 <ArrowDownCircle size={160} />
 </div>

 <div className="flex items-center gap-4 mb-8">
 <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
 <CreditCard className="h-5 w-5" />
 </div>
 <div>
 <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">
 Down Payment Detail
 </h2>
 <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
 Enter the down payment amount and assign to a cash/bank account
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
 Tanggal DP
 </Label>
 <DnaInput
 type="date"
 value={date}
 onChange={(e) => setDate(e.target.value)}
 className="h-11 rounded-xl bg-slate-50 border-slate-200"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
 Kas / Bank Account
 </Label>
 <Select
 value={coaId}
 onValueChange={(val) => setCoaId(val || "")}
 >
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all outline-none w-full">
 <SelectValue placeholder="Pilih Akun Kas/Bank" />
 </SelectTrigger>
 <SelectContent>
 {cashAccounts.map((acc) => (
 <SelectItem key={acc.id} value={acc.id}>
 {acc.code} — {acc.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="space-y-2 mb-8">
 <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
 Nominal DP (IDR)
 </Label>
 <div className="relative">
 <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">
 Rp
 </span>
 <DnaInput
 type="number"
 placeholder="0.00"
 className="h-14 bg-slate-50 border-slate-200 font-black text-2xl text-slate-900 pl-16"
 value={amount || ""}
 onChange={(e) => setAmount(Number(e.target.value))}
 />
 </div>
 </div>

 <div className="space-y-2 mb-8">
 <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
 Catatan (Opsional)
 </Label>
 <Textarea
 placeholder="Tambahkan keterangan untuk DP ini..."
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="rounded-2xl bg-slate-50 border border-slate-200 font-medium p-6 min-h-[120px] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-slate-900"
 />
 </div>

 <div className="flex justify-end gap-4 items-center pt-6 border-t border-slate-50">
 {submitDisabled && (isSaveDisabled || !coaId || amount <= 0) && (
 <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight animate-pulse">
 Lengkapi semua field terlebih dahulu
 </p>
 )}
 <DnaButton
 variant="primary"
 className="h-14 px-10 rounded-2xl disabled:opacity-20"
 disabled={submitDisabled}
 onClick={() => setShowConfirm(true)}
 icon={
 submitMutation.isPending ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Save className="h-4 w-4" />
 )
 }
 >
 {submitMutation.isPending
 ? "Processing..."
 : "Simpan DP Pembelian"}
 </DnaButton>
 </div>
 </OperationalPanel>
 <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Konfirmasi</DialogTitle>
 </DialogHeader>
 <p>Apakah Anda yakin ingin menyimpan data ini?</p>
 <DialogFooter>
 <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
 <DnaButton variant="primary" onClick={() => { setShowConfirm(false); submitMutation.mutate(); }}>Ya, Simpan</DnaButton>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </OperationalMigrationShell>
 );
}
