"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowDownCircle, Save, RotateCcw, Building2, User, Package, Hash, FileText, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DnaInput, DnaButton, DnaBadge } from "@/components/dna";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DPPenjualanPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [soId, setSoId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [coaId, setCoaId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [buktiFile, setBuktiFile] = useState<{ name: string; url: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["finance-sales-orders"],
    queryFn: async () => (await api.get("/finance/sales-orders")).data,
  });

  const { data: accounts } = useQuery({
    queryKey: ["coa"],
    queryFn: async () => {
      const res = await api.get("/finance/accounts");
      return res.data;
    },
  });

  const cashAccounts = accounts?.filter((a: any) => a.code?.startsWith('11')) || [];
  const unpaidOrders = orders?.filter((o: any) => {
    const total = Number(o.totalAmount) || 0;
    const paid = Number(o.amountPaid) || 0;
    return paid < total;
  }) || [];

  const selectedSO = orders?.find((o: any) => o.id === soId);
  const selectedSOTotal = selectedSO ? Number(selectedSO.totalAmount) : 0;
  const selectedSOPaid = selectedSO ? Number(selectedSO.amountPaid) || 0 : 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading bukti transfer...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload?module=finance&subFolder=dp_penjualan", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setBuktiFile({ name: file.name, url: res.data.url });
      toast.success("Bukti transfer berhasil diunggah", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunggah bukti transfer", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSoId("");
    setDate(new Date().toISOString().split('T')[0]);
    setCoaId("");
    setAmount("");
    setNotes("");
    setBuktiFile(null);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const attachmentUrls = buktiFile ? [buktiFile.url] : [];
      await api.post("/finance/cash/receive", {
        date,
        cashAccountId: coaId,
        category: "DP_PENJUALAN",
        creditAccountId: coaId,
        amount: Number(amount),
        entityName: selectedSO?.lead?.clientName || "Customer",
        notes: notes || `DP Penjualan ${selectedSO?.orderNumber || ""}`,
        referenceId: soId || undefined,
        attachmentUrls,
      });
    },
    onSuccess: () => {
      toast.success("Down Payment berhasil dicatat!");
      queryClient.invalidateQueries({ queryKey: ["finance-sales-orders"] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan DP Penjualan");
    },
  });

  const handleSubmit = () => {
    if (!soId || !date || !coaId || !amount) return;
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    createMutation.mutate();
  };

  const isReady = soId && date && coaId && Number(amount) > 0 && !!buktiFile;

  return (
    <DashboardShell
      title="DP"
      titleAccent="PENJUALAN"
      subtitle="Uang Muka Penjualan — Sales Down Payment Terminal"
      actions={
        <DnaBadge status="info">Sales DP</DnaBadge>
      }
    >
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-blue-600">
          <ArrowDownCircle size={180} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: SO Selector + Detail */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">No. Penjualan (SO)</Label>
              <Select onValueChange={(v: string | null) => setSoId(v || "")} value={soId}>
                <SelectTrigger className="h-12 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase w-full">
                  <SelectValue placeholder="Pilih SO yang belum lunas..." />
                </SelectTrigger>
                <SelectContent>
                  {ordersLoading && (
                    <div className="px-4 py-3 text-[10px] font-medium text-slate-400 uppercase">Loading...</div>
                  )}
                  {!ordersLoading && unpaidOrders.length === 0 && (
                    <div className="px-4 py-3 text-[10px] font-medium text-slate-400 uppercase">Tidak ada SO yang belum lunas</div>
                  )}
                  {unpaidOrders.map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.orderNumber} — {o.lead?.clientName || "Unknown"} ({formatCurrency(Number(o.totalAmount))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSO && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-5 animate-fade-slide-in">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <p className="text-[10px] font-black uppercase tracking-tight text-blue-600">Order Detail</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Customer</p>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <p className="font-black text-slate-900 text-sm uppercase">{selectedSO.lead?.clientName}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Order Number</p>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <p className="font-black text-slate-900 text-sm font-mono">{selectedSO.orderNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Items</p>
                  <div className="bg-white rounded-xl border border-blue-100 p-3 space-y-2 max-h-28 overflow-y-auto">
                    {selectedSO.items?.length > 0 ? (
                      selectedSO.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-700 uppercase">{item.product?.name || item.name}</span>
                          </div>
                          <span className="font-black text-slate-900 font-mono tabular-nums">{item.quantity} pcs</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No item details available</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-blue-100">
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Total Tagihan</p>
                    <p className="text-lg font-black text-slate-900 font-mono tabular-nums">{formatCurrency(selectedSOTotal)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] font-black uppercase text-green-600 tracking-wider">Sudah Dibayar</p>
                    <p className="text-sm font-black text-green-600 font-mono tabular-nums">{formatCurrency(selectedSOPaid)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] font-black uppercase text-red-600 tracking-wider">Sisa Tagihan</p>
                    <p className="text-sm font-black text-red-600 font-mono tabular-nums">{formatCurrency(selectedSOTotal - selectedSOPaid)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: DP Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="w-4 h-4 text-blue-600" />
              <p className="text-[10px] font-black uppercase tracking-tight text-blue-600">Down Payment Entry</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Tanggal DP</Label>
              <DnaInput
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl bg-slate-50 border-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Kas / Bank <span className="text-red-500">*</span></Label>
              <Select onValueChange={(v: string | null) => setCoaId(v || "")} value={coaId}>
                <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase w-full">
                  <SelectValue placeholder="Pilih Akun Kas/Bank" />
                </SelectTrigger>
                <SelectContent>
                  {cashAccounts.map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} — {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Nominal DP <span className="text-red-500">*</span></Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 pointer-events-none select-none">Rp</div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 font-mono tabular-nums placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Catatan</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-xs resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
                placeholder="Catatan tambahan (opsional)..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                Bukti Transfer <span className="text-rose-600">WAJIB</span>
              </Label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all group">
                <Upload className={cn(
                  "w-10 h-10 transition-all mb-3",
                  isUploading ? "animate-bounce text-blue-600" : "text-slate-300 group-hover:text-blue-500"
                )} />
                <p className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-tight mb-3">
                  {isUploading ? "Sedang Mengunggah..." : "Klik untuk upload bukti transfer"}
                </p>
                <input
                  type="file"
                  className="hidden"
                  id="file-upload-dp-penjualan"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <DnaButton
                  variant="outline"
                  className="rounded-full px-6 border-slate-200 text-slate-600 hover:bg-slate-100"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Processing..." : "Pilih File"}
                </DnaButton>
              </div>
              {buktiFile && (
                <div className="bg-white border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-medium text-slate-600 shadow-sm mt-3">
                  <FileText size={14} className="text-blue-600" />
                  {buktiFile.name}
                  <button onClick={() => setBuktiFile(null)}>
                    <X size={14} className="text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <DnaButton
                variant="primary"
                className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-20"
                disabled={!isReady || createMutation.isPending}
                onClick={handleSubmit}
                icon={<Save className="w-4 h-4" />}
              >
                {createMutation.isPending ? "Memproses..." : "Simpan DP"}
              </DnaButton>
              <DnaButton
                variant="outline"
                className="h-12 w-12 p-0 rounded-xl"
                onClick={resetForm}
                icon={<RotateCcw className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>
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
    </DashboardShell>
  );
}
