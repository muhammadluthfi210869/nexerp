"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import {
  ArrowDownCircle,
  Plus,
  Trash2,
  Save,
  Upload,
  X,
  FileText,
  User,
  Hash,
  Calculator,
  Landmark
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DnaInput, DnaButton, DnaBadge } from "@/components/dna";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface CartEntry {
  accountId: string;
  amount: number;
  keterangan: string;
}

export default function CashOutPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashAccountId, setCashAccountId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([
    { accountId: "", amount: 0, keterangan: "" }
  ]);
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    api.get("/finance/accounts")
      .then(res => setAccounts(res.data))
      .catch(err => console.error("Failed to fetch accounts", err));
  }, []);

  const cashAccounts = accounts.filter(a => a.code.startsWith('11'));
  const expenseAssetAccounts = accounts.filter(a => ['EXPENSE', 'ASSET'].includes(a.type));

  const totalAmount = cart.reduce((sum, e) => sum + Number(e.amount), 0);
  const hasValidEntries = cart.some(e => e.accountId && Number(e.amount) > 0);

  const addCartEntry = () => {
    setCart([...cart, { accountId: "", amount: 0, keterangan: "" }]);
  };

  const removeCartEntry = (idx: number) => {
    if (cart.length <= 1) return;
    setCart(cart.filter((_, i) => i !== idx));
  };

  const updateCartEntry = (idx: number, field: keyof CartEntry, value: string | number) => {
    const newCart = cart.map((entry, i) => {
      if (i !== idx) return entry;
      return { ...entry, [field]: value };
    });
    setCart(newCart);
  };

  const isSaveDisabled = !cashAccountId || !recipient.trim() || !hasValidEntries || attachments.length === 0 || isUploading || isSubmitting;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading files...");

    try {
      const newAttachments = [...attachments];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post(`/upload?module=finance&subFolder=cash_out`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        newAttachments.push({ name: file.name, url: res.data.url });
      }
      setAttachments(newAttachments);
      toast.success("Files uploaded successfully", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload files", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (isSaveDisabled) return;
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    const toastId = toast.loading("Posting cash disbursement...");

    try {
      const validEntries = cart.filter(e => e.accountId && Number(e.amount) > 0);

      const lines = [
        ...validEntries.map(e => ({
          accountId: e.accountId,
          debit: Number(e.amount),
          credit: 0,
        })),
        {
          accountId: cashAccountId,
          debit: 0,
          credit: totalAmount,
        },
      ];

      const notes = cart.filter(e => e.keterangan).map(e => e.keterangan).join("; ");

      const payload = {
        date,
        reference: invoiceRef || undefined,
        description: `Kas Keluar kepada ${recipient}${notes ? `: ${notes}` : ""}`,
        attachmentUrls: attachments.map(a => a.url),
        lines,
      };

      await api.post("/finance/journals", payload);
      toast.success("Kas Keluar berhasil dicatat!", { id: toastId });

      setDate(new Date().toISOString().split('T')[0]);
      setCashAccountId("");
      setRecipient("");
      setInvoiceRef("");
      setCart([{ accountId: "", amount: 0, keterangan: "" }]);
      setAttachments([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record cash disbursement", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell
      title="KAS"
      titleAccent="KELUAR"
      subtitle="Pengeluaran Dana — Multi-Line Cash Disbursement Terminal"
      actions={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <ArrowDownCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-tight">CASH OUT</p>
            <p className="text-[8px] text-slate-400 font-medium">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-rose-500">
            <ArrowDownCircle size={200} />
          </div>

          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm">
              <ArrowDownCircle size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                Form Kas Keluar
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight italic">
                Multi-line journal entry untuk pengeluaran kas/bank
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Tanggal Transaksi</Label>
              <DnaInput
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                <div className="flex items-center gap-1">
                  <User size={12} /> Kepada <span className="text-rose-500">*</span>
                </div>
              </Label>
              <DnaInput
                placeholder="Nama penerima dana..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-11 rounded-xl bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                <div className="flex items-center gap-1">
                  <Hash size={12} /> No. Tagihan
                </div>
              </Label>
              <DnaInput
                placeholder="Opsional, misal INV-001..."
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                className="h-11 rounded-xl bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                <div className="flex items-center gap-1">
                  <Landmark size={12} /> Akun Kas/Bank <span className="text-rose-500">*</span>
                </div>
              </Label>
              <Select onValueChange={(val: string | null) => val && setCashAccountId(val)} value={cashAccountId}>
                <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-rose-500/5 transition-all outline-none">
                  <SelectValue placeholder="Pilih Akun Kas/Bank" />
                </SelectTrigger>
                <SelectContent>
                  {cashAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id || ""}>{acc.code} - {acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                <div className="flex items-center gap-1">
                  <Calculator size={12} /> Alokasi Debit (Biaya/Aset) <span className="text-red-500">*</span>
                </div>
              </Label>
              <DnaButton variant="outline" onClick={addCartEntry} icon={<Plus className="w-3.5 h-3.5" />} className="rounded-full">
                Tambah Baris
              </DnaButton>
            </div>

            <div className="grid grid-cols-12 gap-4 px-4 mb-3">
              <div className="col-span-5 text-[10px] font-black uppercase tracking-tight text-slate-300">Akun (CoA)</div>
              <div className="col-span-2 text-[10px] font-black uppercase tracking-tight text-slate-300">Nominal (Rp)</div>
              <div className="col-span-4 text-[10px] font-black uppercase tracking-tight text-slate-300">Keterangan</div>
              <div className="col-span-1"></div>
            </div>

            <AnimatePresence>
              {cart.map((entry, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-12 gap-4 items-center mb-2 group bg-slate-50/50 p-2 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <div className="col-span-5">
                    <Select
                      onValueChange={(val: string | null) => val && updateCartEntry(idx, "accountId", val)}
                      value={entry.accountId}
                    >
                      <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-rose-500/5 transition-all outline-none">
                        <SelectValue placeholder="Pilih Akun" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseAssetAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id || ""}>{acc.code} - {acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <DnaInput
                      type="number"
                      placeholder="0"
                      value={entry.amount || ""}
                      onChange={(e) => updateCartEntry(idx, "amount", Number(e.target.value))}
                      className="h-11 rounded-xl bg-white border-slate-100 text-rose-600 font-mono tabular-nums"
                    />
                  </div>
                  <div className="col-span-4">
                    <DnaInput
                      placeholder="Catatan (opsional)"
                      value={entry.keterangan}
                      onChange={(e) => updateCartEntry(idx, "keterangan", e.target.value)}
                      className="h-11 rounded-xl bg-white border-slate-100"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <DnaButton
                      variant="outline"
                      className={cn(
                        "h-8 w-8 p-0 rounded-lg transition-colors",
                        cart.length <= 1 ? "text-slate-200 cursor-not-allowed" : "text-slate-300 hover:text-rose-500"
                      )}
                      onClick={() => removeCartEntry(idx)}
                      disabled={cart.length <= 1}
                    >
                      <Trash2 size={16} />
                    </DnaButton>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mb-10">
            <Label className="text-[10px] font-black uppercase tracking-tight text-rose-500 flex items-center gap-2 mb-4">
              <Upload size={14} /> Bukti Pembayaran <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">WAJIB</span>
            </Label>
            <div className="border-4 border-dashed border-rose-100 rounded-2xl p-8 flex flex-col items-center justify-center bg-rose-50/20 hover:bg-rose-50 transition-all group">
              <Upload className={cn(
                "w-12 h-12 transition-all mb-4",
                isUploading ? "animate-bounce text-rose-600" : "text-rose-300 group-hover:text-rose-500"
              )} />
              <p className="text-xs font-black text-rose-400 group-hover:text-rose-600 uppercase tracking-tight mb-4">
                {isUploading ? "Sedang Mengunggah..." : "Drag & drop atau klik untuk upload bukti pembayaran"}
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload-cash-out"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <DnaButton
                variant="outline"
                className="rounded-full px-8 border-rose-200 text-rose-600 hover:bg-rose-100"
                onClick={() => document.getElementById('file-upload-cash-out')?.click()}
                disabled={isUploading}
              >
                {isUploading ? "Processing..." : "Pilih File"}
              </DnaButton>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {attachments.map((att, i) => (
                  <div key={i} className="bg-white border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-medium text-slate-600 shadow-sm">
                    <FileText size={14} className="text-rose-600" />
                    {att.name}
                    <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                      <X size={14} className="text-rose-400 hover:text-rose-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-br from-rose-50 to-white rounded-2xl p-8 border border-rose-100 shadow-sm">
            <div className="flex items-center gap-6 mb-6 md:mb-0">
              <div className="text-center md:text-left">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Pengeluaran</p>
                <p className="text-3xl font-black tracking-tighter text-rose-600 font-mono tabular-nums">
                  Rp {(totalAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-px bg-rose-200 hidden md:block" />
              <div className="text-center md:text-left">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Jumlah Baris</p>
                <p className="text-2xl font-black tracking-tighter text-slate-700 font-mono tabular-nums">
                  {cart.filter(e => e.accountId && Number(e.amount) > 0).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!cashAccountId && (
                <DnaBadge className="text-rose-500 bg-rose-50 border-rose-100">Pilih akun kas</DnaBadge>
              )}
              {!hasValidEntries && (
                <DnaBadge className="text-rose-500 bg-rose-50 border-rose-100">Tambah item</DnaBadge>
              )}
              {attachments.length === 0 && (
                <DnaBadge className="text-rose-500 bg-rose-50 border-rose-100">Bukti WAJIB</DnaBadge>
              )}
              <DnaButton
                variant="primary"
                disabled={isSaveDisabled}
                className="bg-rose-600 hover:bg-rose-700 text-white h-14 px-10 rounded-2xl disabled:opacity-20 shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-200"
                onClick={handleSubmit}
                icon={<Save className="w-4 h-4" />}
              >
                {isSubmitting ? "Memproses..." : "Posting Kas Keluar"}
              </DnaButton>
            </div>
          </div>
        </div>
      </motion.div>
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
