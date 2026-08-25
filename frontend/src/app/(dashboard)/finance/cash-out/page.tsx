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
  Landmark,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DnaInput, DnaButton, DnaBadge } from "@/components/dna";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  OperationalButton,
  OperationalField,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
} from "@/components/operational";
import { formatOperationalCurrency } from "@/lib/operational-formatters";

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
    <OperationalPageShell
      title="Kas Keluar"
      subtitle="Pengeluaran dana — jurnal multi-line dengan bukti wajib"
      actions={<OperationalStatusBadge status="danger">Cash Out</OperationalStatusBadge>}
    >
      <OperationalPanel>
        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-rose-50 text-rose-600">
            <ArrowDownCircle className="h-4 w-4" />
          </div>
          <h3 className="text-[13px] font-semibold text-slate-900">Header Transaksi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <OperationalField label="Tanggal Transaksi">
            <DnaInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 rounded-md border-slate-200 text-[12px] font-medium"
            />
          </OperationalField>
          <OperationalField label="Kepada">
            <DnaInput
              placeholder="Nama penerima dana..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="h-9 rounded-md border-slate-200 text-[12px] font-medium"
            />
          </OperationalField>
          <OperationalField label="No. Tagihan">
            <DnaInput
              placeholder="Opsional, misal INV-001..."
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              className="h-9 rounded-md border-slate-200 text-[12px] font-medium"
            />
          </OperationalField>
          <OperationalField label="Akun Kas / Bank">
            <Select onValueChange={(val: string | null) => val && setCashAccountId(val)} value={cashAccountId}>
              <SelectTrigger className="h-9 rounded-md border border-slate-200 bg-white text-[12px] font-medium text-slate-700">
                <SelectValue placeholder="Pilih akun kas/bank" />
              </SelectTrigger>
              <SelectContent>
                {cashAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id || ""}>{acc.code} - {acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OperationalField>
        </div>
      </OperationalPanel>

      <OperationalPanel>
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-rose-600" />
            <h3 className="text-[13px] font-semibold text-slate-900">Alokasi Debit (Biaya/Aset)</h3>
          </div>
          <OperationalButton variant="secondary" onClick={addCartEntry}>
            <Plus className="h-4 w-4" /> Tambah Baris
          </OperationalButton>
        </div>

        <div className="grid grid-cols-12 gap-3 px-1 mb-2">
          <div className="col-span-5 text-[11px] font-medium text-slate-500">Akun (CoA)</div>
          <div className="col-span-2 text-[11px] font-medium text-slate-500">Nominal (Rp)</div>
          <div className="col-span-4 text-[11px] font-medium text-slate-500">Keterangan</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-2">
          {cart.map((entry, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center rounded-md border border-slate-100 bg-slate-50/50 p-2 transition-colors hover:bg-slate-50">
              <div className="col-span-5">
                <Select
                  onValueChange={(val: string | null) => val && updateCartEntry(idx, "accountId", val)}
                  value={entry.accountId}
                >
                  <SelectTrigger className="h-9 rounded-md border border-slate-200 bg-white text-[12px] font-medium text-slate-700">
                    <SelectValue placeholder="Pilih akun" />
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
                  className="h-9 rounded-md border-slate-200 text-[12px] font-semibold text-rose-700 tabular-nums"
                />
              </div>
              <div className="col-span-4">
                <DnaInput
                  placeholder="Catatan (opsional)"
                  value={entry.keterangan}
                  onChange={(e) => updateCartEntry(idx, "keterangan", e.target.value)}
                  className="h-9 rounded-md border-slate-200 text-[12px] font-medium"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <DnaButton
                  variant="outline"
                  className={cn(
                    "h-8 w-8 p-0 rounded-md",
                    cart.length <= 1 ? "text-slate-200" : "text-slate-400 hover:text-rose-600"
                  )}
                  onClick={() => removeCartEntry(idx)}
                  disabled={cart.length <= 1}
                >
                  <Trash2 size={16} />
                </DnaButton>
              </div>
            </div>
          ))}
        </div>
      </OperationalPanel>

      <OperationalPanel>
        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Upload className="h-4 w-4 text-rose-600" />
          <h3 className="text-[13px] font-semibold text-slate-900">Bukti Pembayaran</h3>
          <DnaBadge status="critical">Wajib</DnaBadge>
        </div>
        <div className="rounded-md border-2 border-dashed border-rose-100 bg-rose-50/20 p-6 flex flex-col items-center justify-center transition-colors hover:bg-rose-50/40">
          <Upload className={cn(
            "mb-3 h-10 w-10 transition-all",
            isUploading ? "animate-bounce text-rose-600" : "text-rose-300"
          )} />
          <p className="mb-3 text-[12px] font-medium text-rose-600">
            {isUploading ? "Sedang mengunggah..." : "Drag & drop atau klik untuk upload bukti pembayaran"}
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
            className="rounded-md border-rose-200 text-rose-600 hover:bg-rose-100"
            onClick={() => document.getElementById('file-upload-cash-out')?.click()}
            disabled={isUploading}
          >
            {isUploading ? "Memproses..." : "Pilih File"}
          </DnaButton>
        </div>
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600">
                <FileText size={14} className="text-rose-600" />
                {att.name}
                <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                  <X size={14} className="text-rose-400 hover:text-rose-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </OperationalPanel>

      <OperationalPanel>
        <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Pengeluaran</p>
              <p className="text-[18px] font-semibold text-rose-700 tabular-nums">
                {formatOperationalCurrency(totalAmount)}
              </p>
            </div>
            <div className="hidden h-10 w-px bg-rose-200 md:block" />
            <div>
              <p className="text-[11px] font-medium text-slate-500">Jumlah Baris</p>
              <p className="text-[16px] font-semibold tabular-nums text-slate-700">
                {cart.filter(e => e.accountId && Number(e.amount) > 0).length}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!cashAccountId && <DnaBadge className="border-rose-100 bg-rose-50 text-rose-600">Pilih akun kas</DnaBadge>}
              {!hasValidEntries && <DnaBadge className="border-rose-100 bg-rose-50 text-rose-600">Tambah item</DnaBadge>}
              {attachments.length === 0 && <DnaBadge className="border-rose-100 bg-rose-50 text-rose-600">Bukti wajib</DnaBadge>}
            </div>
          </div>
          <OperationalButton
            variant="primary"
            disabled={isSaveDisabled}
            onClick={handleSubmit}
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Memproses..." : "Posting Kas Keluar"}
          </OperationalButton>
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
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
