"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 Package,
 UserCircle,
 Calendar,
 FileText,
 Hash,
 DollarSign,
 Send,
 StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from "@/components/ui/dialog";
import { DnaInput, DnaButton } from "@/components/dna";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 OperationalButton,
 OperationalField,
 OperationalPageShell,
 OperationalPanel,
} from "@/components/operational";

export default function SampleSalesInputPage() {
 const queryClient = useQueryClient();
 const router = useRouter();

 const [customerId, setCustomerId] = useState("");
 const [productName, setProductName] = useState("");
 const [description, setDescription] = useState("");
 const [qty, setQty] = useState("");
 const [unitPrice, setUnitPrice] = useState("");
 const [targetDeliveryDate, setTargetDeliveryDate] = useState("");
 const [notes, setNotes] = useState("");
 const [showConfirm, setShowConfirm] = useState(false);

 const { data: customers } = useQuery({
 queryKey: ["master-customers"],
 queryFn: async () => {
 const resp = await api.get("/master/customers");
 return resp.data;
 },
 });

 const mutation = useMutation({
 mutationFn: async (payload: any) => {
 return api.post("/bussdev/samples", payload);
 },
 onSuccess: () => {
 toast.success("Sample order berhasil dibuat!");
 queryClient.invalidateQueries({ queryKey: ["bussdev-samples"] });
 setTimeout(() => {
 router.push("/bussdev/sample-sales");
 }, 1200);
 },
 onError: (err: any) => {
 toast.error("Gagal membuat sample order", {
 description: err?.response?.data?.message || err.message,
 });
 },
 });

 const canSubmit =
 !mutation.isPending &&
 customerId &&
 productName.trim() &&
 qty &&
 Number(qty) > 0;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!canSubmit) return;
 setShowConfirm(true);
 };

 const confirmSubmit = async () => {
 setShowConfirm(false);
 toast.loading("Membuat sample order...", { id: "submit-sample" });

 const payload: any = {
 customerId,
 productName: productName.trim(),
 description: description.trim(),
 qty: Number(qty),
 unitPrice: unitPrice ? Number(unitPrice) : 0,
 targetDeliveryDate: targetDeliveryDate
 ? new Date(targetDeliveryDate).toISOString()
 : null,
 notes: notes.trim(),
 };

 await mutation.mutateAsync(payload);
 };

 return (
 <OperationalPageShell
 title="Buat Sales Sample"
 subtitle="Form input permintaan sample baru untuk BusDev"
 >
 <form onSubmit={handleSubmit}>
 <OperationalPanel>
 <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
 <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-600">
 <Package className="h-4 w-4" />
 </div>
 <h3 className="text-[13px] font-semibold text-slate-900">Detail Sample Order</h3>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <OperationalField label="Customer">
 <Select value={customerId} onValueChange={(v) => setCustomerId(v || "")}>
 <SelectTrigger className="h-9 rounded-md border border-slate-200 bg-white text-[12px] font-medium text-slate-700">
 <SelectValue placeholder="Pilih customer..." />
 </SelectTrigger>
 <SelectContent>
 {customers?.map((c: any) => (
 <SelectItem key={c.id} value={c.id} className="text-xs">
 {c.clientName || c.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </OperationalField>

 <OperationalField label="Nama Produk">
 <DnaInput
 placeholder="Contoh: Serum Brightening 30ml"
 value={productName}
 onChange={(e) => setProductName(e.target.value)}
 className="h-9 rounded-md border-slate-200 text-[12px] font-medium"
 />
 </OperationalField>

 <div className="md:col-span-2">
 <OperationalField label="Deskripsi">
 <textarea
 rows={3}
 placeholder="Deskripsi detail sample..."
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white p-3 text-[12px] font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 </OperationalField>
 </div>

 <OperationalField label="Qty">
 <DnaInput
 type="number"
 min="1"
 placeholder="0"
 value={qty}
 onChange={(e) => setQty(e.target.value)}
 className="h-9 rounded-md border-slate-200 text-[12px] font-medium tabular-nums"
 />
 </OperationalField>

 <OperationalField label="Harga Satuan (IDR)">
 <div className="relative">
 <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
 Rp
 </span>
 <DnaInput
 type="number"
 min="0"
 placeholder="0"
 value={unitPrice}
 onChange={(e) => setUnitPrice(e.target.value)}
 className="h-9 rounded-md border-slate-200 pl-9 text-[12px] font-medium tabular-nums"
 />
 </div>
 </OperationalField>

 <OperationalField label="Target Delivery">
 <DnaInput
 type="date"
 value={targetDeliveryDate}
 onChange={(e) => setTargetDeliveryDate(e.target.value)}
 className="h-9 rounded-md border-slate-200 text-[12px] font-medium"
 />
 </OperationalField>

 <OperationalField label="Catatan">
 <DnaInput
 placeholder="Catatan tambahan..."
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="h-9 rounded-md border-slate-200 text-[12px] font-medium"
 />
 </OperationalField>
 </div>

 <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
 <OperationalButton
 type="submit"
 variant="primary"
 disabled={!canSubmit}
 >
 <Send className="h-4 w-4" />
 {mutation.isPending ? "Memproses..." : "Submit Sample Order"}
 </OperationalButton>
 </div>
 </OperationalPanel>
 </form>

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
 </OperationalPageShell>
 );
}
