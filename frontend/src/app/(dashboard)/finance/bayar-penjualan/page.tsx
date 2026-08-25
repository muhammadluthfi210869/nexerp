"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  CircleDollarSign,
  Wallet,
  FileCheck2,
  Calendar,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Landmark,
} from "lucide-react";
import { DnaInput, DnaButton } from "@/components/dna";
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
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalMigrationShell,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalCurrency } from "@/lib/operational-formatters";
import { QueryLoading, QueryError } from "@/components/query-states";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  dueDate: string;
}

export default function BayarPenjualanPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const queryClient = useQueryClient();

  const { data: invoices, isLoading, isError } = useQuery<Invoice[]>({
    queryKey: ["invoices-receivable"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      return resp.data
        .filter((inv: any) => inv.type === "RECEIVABLE" || !inv.type)
        .map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          totalAmount: Number(inv.totalAmount),
          paidAmount: Number(inv.paidAmount || 0),
          remainingAmount: Number(inv.remainingAmount || inv.totalAmount),
          status: inv.status,
          dueDate: new Date(inv.dueDate).toISOString().split("T")[0],
        }));
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const resp = await api.post(`/finance/invoices/${invoiceId}/validate`, {
        invoiceId,
      });
      return resp.data;
    },
    onSuccess: () => {
      toast.success("Pembayaran berhasil divalidasi!");
      queryClient.invalidateQueries({ queryKey: ["invoices-receivable"] });
      setIsModalOpen(false);
      setSelectedInvoice(null);
    },
    onError: (err: any) => {
      toast.error("Validasi gagal", {
        description: err?.response?.data?.message || err.message,
      });
    },
  });

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const filteredInvoices =
    (invoices || []).filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const totalReceivable =
    (invoices || []).reduce((sum, inv) => sum + inv.remainingAmount, 0);
  const totalCollected =
    (invoices || []).reduce((sum, inv) => sum + inv.paidAmount, 0);
  const overdueCount =
    (invoices || []).filter((inv) => inv.status === "OVERDUE").length;

  const columns = useMemo(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice Number",
        cell: ({ row }: any) => {
          const inv = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.invoiceNumber}</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase mt-0.5">Due: {inv.dueDate}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ getValue }: any) => (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-500 uppercase">
              {String(getValue()).charAt(0)}
            </div>
            <p className="font-black text-slate-900 text-xs uppercase italic">{String(getValue())}</p>
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "paidAmount",
        header: () => <div className="text-right">Paid</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums py-4 font-black text-emerald-600 text-xs">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "remainingAmount",
        header: () => <div className="text-right">Remaining</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums py-4 font-black text-rose-600 text-xs">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ getValue }: any) => {
          const status = getValue() as string;
          const tone = status === "PAID" ? "success" : status === "OVERDUE" ? "danger" : "pending";
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status={tone}>{getOperationalStatusLabel(status)}</OperationalStatusBadge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }: any) => {
          const inv = row.original;
          return (
            <div className="flex justify-end gap-1.5">
              {inv.remainingAmount > 0 && (
                <DnaButton
                  onClick={() => openPaymentModal(inv)}
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-[8px]"
                  icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                >
                  Terima Pembayaran
                </DnaButton>
              )}
              <DnaButton
                variant="outline"
                size="sm"
                icon={<MoreHorizontal className="h-3.5 w-3.5" />}
              />
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <OperationalMigrationShell
      title="BAYAR"
      titleAccent="PENJUALAN"
      subtitle="Penerimaan Pembayaran Piutang — Customer Payment Terminal"
      actions={
        <div className="flex gap-3">
          <DnaButton
            variant="outline"
            className="h-11 px-5 rounded-xl text-[10px]"
            icon={<MoreHorizontal className="h-4 w-4" />}
          >
            Riwayat
          </DnaButton>
        </div>
      }
    >
      {isLoading ? (
        <QueryLoading message="Memuat faktur piutang..." />
      ) : isError ? (
        <QueryError
          error="Gagal memuat data faktur"
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["invoices-receivable"] })}
        />
      ) : (
        <>
          <OperationalMetricGrid>
            <OperationalMetricCard
              label="Total Piutang"
              value={formatOperationalCurrency(totalReceivable)}
              icon={<Wallet className="h-4 w-4" />}
              tone="green"
            />
            <OperationalMetricCard
              label="Telah Ditagih"
              value={formatOperationalCurrency(totalCollected)}
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="blue"
            />
            <OperationalMetricCard
              label="Overdue"
              value={overdueCount}
              helper="Faktur jatuh tempo"
              icon={<Clock className="h-4 w-4" />}
              tone="red"
            />
            <OperationalMetricCard
              label="Outstanding"
              value={`${filteredInvoices.length} Faktur`}
              icon={<FileCheck2 className="h-4 w-4" />}
              tone="amber"
            />
          </OperationalMetricGrid>

          <DnaInput
            icon={<Search className="h-4 w-4" />}
            placeholder="Cari invoice / pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <OperationalDataTable
            data={filteredInvoices}
            columns={columns as any}
            getRowId={(row: any) => row.id}
            searchPlaceholder="Cari invoice / pelanggan..."
          />

          <div className="bg-emerald-50/30 border border-emerald-100/20 rounded-2xl p-6 flex gap-6 items-center shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0 border border-slate-100">
              <CircleDollarSign className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 italic">
                Payment Terminal Ready
              </p>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Klik <span className="text-emerald-600 font-black">&quot;Terima Pembayaran&quot;</span> pada baris faktur untuk mencatat penerimaan pembayaran piutang. Sistem akan membuat jurnal otomatis.
              </p>
            </div>
          </div>
        </>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          {selectedInvoice && (
            <PaymentForm
              invoice={selectedInvoice}
              onConfirm={() => validateMutation.mutate(selectedInvoice.id)}
              onCancel={() => {
                setIsModalOpen(false);
                setSelectedInvoice(null);
              }}
              isSubmitting={validateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </OperationalMigrationShell>
  );
}

function PaymentForm({
  invoice,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  invoice: Invoice;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [cashAccountId, setCashAccountId] = useState("");
  const [amountReceived, setAmountReceived] = useState(
    String(invoice.remainingAmount)
  );
  const [notes, setNotes] = useState("");

  const { data: coa } = useQuery({
    queryKey: ["coa-cash"],
    queryFn: async () => {
      const res = await api.get("/finance/accounts");
      return res.data.filter(
        (a: any) => a.code?.startsWith("11") || a.type === "CASH"
      );
    },
  });

  const canSubmit =
    !isSubmitting && cashAccountId && Number(amountReceived) > 0;

  return (
    <>
      <div className="p-8 bg-emerald-600 text-white relative overflow-hidden">
        <div className="relative z-10">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Terima Pembayaran
          </DialogTitle>
          <DialogDescription className="text-emerald-100 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">
            AR Collection Settlement — Payment Terminal
          </DialogDescription>
        </div>
        <CircleDollarSign className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 text-white/20" />
      </div>

      <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">
            Customer
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <p className="font-black text-xs uppercase text-slate-900 truncate">
              {invoice.customerName}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">
            Invoice
          </p>
          <p className="font-black text-xs uppercase text-slate-900 mt-1">
            {invoice.invoiceNumber}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">
            Sisa Tagihan
          </p>
          <p className="font-black text-sm text-rose-600 mt-1">
            {formatOperationalCurrency(invoice.remainingAmount)}
          </p>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">
              Tanggal Pembayaran
            </Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <DnaInput
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-11 pl-12 bg-slate-50 border-none font-black uppercase text-xs focus:ring-4 focus:ring-emerald-500/5 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">
              Akun Kas / Bank
            </Label>
            <div className="relative">
              <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Select
                value={cashAccountId}
                onValueChange={(v) => setCashAccountId(v || "")}
              >
                <SelectTrigger className="h-11 pl-12 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs focus:ring-4 focus:ring-emerald-500/5 transition-all">
                  <SelectValue placeholder="Pilih akun kas/bank..." />
                </SelectTrigger>
                <SelectContent>
                  {coa?.map((a: any) => (
                    <SelectItem
                      key={a.id}
                      value={a.id || ""}
                      className="font-medium text-xs"
                    >
                      {a.code} — {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">
            Jumlah Diterima (IDR)
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
              Rp
            </span>
            <DnaInput
              type="number"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="h-12 pl-12 bg-slate-50 border-none font-black text-lg text-slate-900 tabular-nums focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
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
            onClick={onConfirm}
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
                <ShieldCheck className="mr-2 h-4 w-4" /> Validasi & Catat
                Pembayaran
              </>
            )}
          </DnaButton>
        </div>
      </div>
    </>
  );
}
