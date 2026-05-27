"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  CircleDollarSign,
  Upload,
  Calendar,
  Wallet,
  FileCheck2,
  Clock,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Landmark,
  UploadCloud,
} from "lucide-react";
import { DnaInput, DnaButton, DnaBadge, StatCard, TableWrapper } from "@/components/dna";
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
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";

interface SamplePayment {
  id: string;
  code: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
}

export default function BayarSamplePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SamplePayment | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: samples, isLoading, isError } = useQuery<SamplePayment[]>({
    queryKey: ["bussdev-samples-payment"],
    queryFn: async () => {
      const resp = await api.get("/bussdev/samples");
      return resp.data
        .filter((s: any) => s.status !== "CANCELLED")
        .map((s: any) => ({
          id: s.id,
          code: s.code,
          customerName: s.customerName,
          totalAmount: Number(s.totalAmount || s.unitPrice * s.qty),
          paidAmount: Number(s.paidAmount || 0),
          remainingAmount: Number(s.remainingAmount || s.unitPrice * s.qty),
          paymentStatus: s.paymentStatus || "UNPAID",
        }));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ sampleId, formData }: { sampleId: string; formData: FormData }) => {
      const resp = await api.post("/finance/verify-payment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return resp.data;
    },
    onSuccess: () => {
      toast.success("Pembayaran sample berhasil diverifikasi!");
      queryClient.invalidateQueries({ queryKey: ["bussdev-samples-payment"] });
      setIsModalOpen(false);
      setSelectedSample(null);
      setPaymentFile(null);
    },
    onError: (err: any) => {
      toast.error("Verifikasi gagal", {
        description: err?.response?.data?.message || err.message,
      });
    },
  });

  const filteredSamples =
    samples?.filter(
      (s) =>
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const totalOutstanding =
    samples?.reduce((sum, s) => sum + s.remainingAmount, 0) || 0;
  const totalPaid =
    samples?.reduce((sum, s) => sum + s.paidAmount, 0) || 0;
  const awaitingPayment =
    samples?.filter((s) => s.remainingAmount > 0).length || 0;

  return (
    <DashboardShell
      title="BAYAR"
      titleAccent="SAMPLE"
      subtitle="Pembayaran Sample Sales — Sample Payment Terminal"
    >
      {isLoading ? (
        <QueryLoading message="Memuat data pembayaran sample..." />
      ) : isError ? (
        <QueryError
          error="Gagal memuat data sample"
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["bussdev-samples-payment"] })}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Total Outstanding"
              value={`Rp ${totalOutstanding.toLocaleString("id-ID")}`}
              icon={<Wallet className="text-rose-500" />}
            />
            <StatCard
              label="Telah Dibayar"
              value={`Rp ${totalPaid.toLocaleString("id-ID")}`}
              icon={<CheckCircle2 className="text-emerald-600" />}
            />
            <StatCard
              label="Menunggu Bayar"
              value={awaitingPayment.toString()}
              subValue="Sample pending"
              icon={<Clock className="text-amber-500" />}
            />
            <StatCard
              label="Total Samples"
              value={`${filteredSamples.length} Order`}
              icon={<FileCheck2 className="text-blue-600" />}
            />
          </div>

          <TableWrapper
            filters={
              <div className="relative w-full max-w-md">
                <DnaInput
                  icon={<Search className="h-4 w-4" />}
                  placeholder="Cari kode sample atau customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            }
          >
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/70">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Kode Sample
                  </TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Customer
                  </TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Total
                  </TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Sudah Bayar
                  </TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Sisa
                  </TableHead>
                  <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Status Bayar
                  </TableHead>
                  <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.map((sample) => (
                  <TableRow
                    key={sample.id}
                    className="group hover:bg-emerald-50/30 transition-all duration-300 border-b border-slate-50"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <FileCheck2 className="h-4 w-4" />
                        </div>
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">
                          {sample.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="font-black text-slate-900 text-xs uppercase italic">
                        {sample.customerName}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">
                      Rp {sample.totalAmount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-4 font-black text-emerald-600 text-xs">
                      Rp {sample.paidAmount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-4 font-black text-rose-600 text-xs">
                      Rp {sample.remainingAmount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <DnaBadge
                        status={
                          sample.paymentStatus === "PAID"
                            ? "success"
                            : sample.paymentStatus === "PARTIAL"
                              ? "warning"
                              : "critical"
                        }
                      >
                        {sample.paymentStatus === "PAID"
                          ? "Lunas"
                          : sample.paymentStatus === "PARTIAL"
                            ? "Partial"
                            : "Belum Bayar"}
                      </DnaBadge>
                    </TableCell>
                    <TableCell className="pr-6 text-right py-4">
                      {sample.remainingAmount > 0 && (
                        <DnaButton
                          onClick={() => {
                            setSelectedSample(sample);
                            setPaymentFile(null);
                            setIsModalOpen(true);
                          }}
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-[8px]"
                          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                        >
                          Bayar
                        </DnaButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSamples.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-slate-400 italic"
                    >
                      Tidak ada sample payment ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          {selectedSample && (
            <PaymentForm
              sample={selectedSample}
              file={paymentFile}
              onFileChange={setPaymentFile}
              onConfirm={(formData) =>
                verifyMutation.mutate({
                  sampleId: selectedSample.id,
                  formData,
                })
              }
              onCancel={() => {
                setIsModalOpen(false);
                setSelectedSample(null);
                setPaymentFile(null);
              }}
              isSubmitting={verifyMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function PaymentForm({
  sample,
  file,
  onFileChange,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  sample: SamplePayment;
  file: File | null;
  onFileChange: (f: File | null) => void;
  onConfirm: (formData: FormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState(String(sample.remainingAmount));
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = !isSubmitting && method && Number(amount) > 0 && file;

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("sampleId", sample.id);
    formData.append("amount", amount);
    formData.append("paymentDate", paymentDate);
    formData.append("method", method);
    formData.append("notes", notes);
    formData.append("proof", file!);
    onConfirm(formData);
  };

  return (
    <>
      <div className="p-8 bg-emerald-600 text-white relative overflow-hidden">
        <div className="relative z-10">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Bayar Sample
          </DialogTitle>
          <DialogDescription className="text-emerald-100 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">
            Sample Payment Settlement — {sample.code}
          </DialogDescription>
        </div>
        <CircleDollarSign className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 text-white/20" />
      </div>

      <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Customer</p>
          <p className="font-black text-xs uppercase text-slate-900 mt-1">{sample.customerName}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Total</p>
          <p className="font-black text-xs uppercase text-slate-900 mt-1 tabular-nums">
            Rp {sample.totalAmount.toLocaleString("id-ID")}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Sisa Tagihan</p>
          <p className="font-black text-sm text-rose-600 mt-1 tabular-nums">
            Rp {sample.remainingAmount.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Tanggal Pembayaran
            </Label>
            <DnaInput
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="h-11 bg-slate-50 border-none font-black uppercase text-xs focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5" /> Metode Pembayaran
            </Label>
            <Select value={method} onValueChange={(v) => setMethod(v || "")}>
              <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs focus:ring-4 focus:ring-emerald-500/5 transition-all">
                <SelectValue placeholder="Pilih metode..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSFER_BANK" className="font-medium text-xs">
                  Transfer Bank
                </SelectItem>
                <SelectItem value="CASH" className="font-medium text-xs">
                  Tunai
                </SelectItem>
                <SelectItem value="E_WALLET" className="font-medium text-xs">
                  E-Wallet
                </SelectItem>
                <SelectItem value="CHECK" className="font-medium text-xs">
                  Cek
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Jumlah Bayar (IDR)
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
              Rp
            </span>
            <DnaInput
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 pl-12 bg-slate-50 border-none font-black text-lg text-slate-900 tabular-nums focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
            <UploadCloud className="h-3.5 w-3.5" /> Bukti Pembayaran
          </Label>
          <div className="relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              className="hidden"
              id="proof-upload"
            />
            <label
              htmlFor="proof-upload"
              className={cn(
                "flex items-center gap-4 w-full p-4 bg-slate-50 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                file
                  ? "border-emerald-300 bg-emerald-50/30"
                  : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/10"
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  file ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}
              >
                <Upload className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  {file ? file.name : "Upload bukti transfer / pembayaran"}
                </p>
                <p className="text-[9px] font-medium text-slate-400 uppercase mt-0.5">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : "Format: JPG, PNG, PDF — Max 5MB"}
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">
            Catatan
          </Label>
          <textarea
            rows={3}
            placeholder="Contoh: Transfer BCA No. Ref: TRX123..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none"
          />
        </div>

        <div className="pt-4 flex gap-4 border-t border-slate-100">
          <DnaButton
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50"
          >
            Batal
          </DnaButton>
          <DnaButton
            onClick={handleSubmit}
            disabled={!canSubmit}
            variant="primary"
            className={cn(
              "flex-[2] h-12 rounded-xl tracking-widest text-[10px] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]",
              "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {isSubmitting ? (
              "Memproses..."
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" /> Verifikasi & Catat
                Pembayaran
              </>
            )}
          </DnaButton>
        </div>
      </div>
    </>
  );
}
