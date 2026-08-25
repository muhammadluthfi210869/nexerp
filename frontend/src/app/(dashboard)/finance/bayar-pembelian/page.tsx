"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  Wallet,
  Building2,
  Receipt,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { DnaInput, DnaButton } from "@/components/dna";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  OperationalDataTable,
  OperationalMigrationShell,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalCurrency } from "@/lib/operational-formatters";

interface Bill {
  id: string;
  billNumber: string;
  vendorName: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  status: string;
}

interface CoaAccount {
  id: string;
  code: string;
  name: string;
}

interface PaymentForm {
  date: string;
  coaId: string;
  amount: number;
  notes: string;
}

function getTodayDate() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const statusBadgeTone: Record<string, "success" | "pending" | "danger"> = {
  PAID: "success",
  PARTIAL: "pending",
  UNPAID: "danger",
};

export default function BayarPembelianPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    date: getTodayDate(),
    coaId: "",
    amount: 0,
    notes: "",
  });
  const [validationError, setValidationError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { data: bills, isLoading } = useQuery<Bill[]>({
    queryKey: ["vendor-bills"],
    queryFn: async () => {
      const resp = await api.get("/finance/bills");
      return resp.data.map((b: any) => ({
        id: b.id || b.billNumber,
        billNumber: b.billNumber,
        vendorName: b.vendorName,
        totalAmount: Number(b.totalAmount),
        paidAmount: Number(b.paidAmount || 0),
        remaining: Number(b.remaining || b.totalAmount),
        status: b.status,
      }));
    },
  });

  const { data: coaAccounts } = useQuery<CoaAccount[]>({
    queryKey: ["coa-cash-bank"],
    queryFn: async () => {
      const resp = await api.get("/finance/coa", { params: { codePrefix: "11" } });
      return resp.data.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }));
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBill) return;
      const payload = {
        amount: paymentForm.amount,
        date: paymentForm.date,
        coaId: paymentForm.coaId,
        notes: paymentForm.notes,
      };
      return api.post(`/finance/bills/${selectedBill.id}/pay`, payload);
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully.");
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      handleCloseModal();
    },
    onError: (err: any) => {
      toast.error("Payment failed", { description: err.response?.data?.message || err.message });
    },
  });

  function handleOpenModal(bill: Bill) {
    setSelectedBill(bill);
    setPaymentForm({
      date: getTodayDate(),
      coaId: "",
      amount: 0,
      notes: "",
    });
    setValidationError("");
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedBill(null);
    setValidationError("");
  }

  function handleAmountChange(value: string) {
    const num = Number(value);
    setPaymentForm({ ...paymentForm, amount: num });
    if (selectedBill && num > selectedBill.remaining) {
      setValidationError(`Amount cannot exceed remaining balance of ${formatOperationalCurrency(selectedBill.remaining)}`);
    } else {
      setValidationError("");
    }
  }

  function handleSubmit() {
    if (!selectedBill) return;
    if (!paymentForm.coaId) {
      toast.error("Please select a cash/bank account.");
      return;
    }
    if (paymentForm.amount <= 0) {
      toast.error("Payment amount must be greater than zero.");
      return;
    }
    if (paymentForm.amount > selectedBill.remaining) {
      toast.error("Amount exceeds remaining balance.");
      return;
    }
    if (!paymentForm.date) {
      toast.error("Please select a payment date.");
      return;
    }
    setShowConfirm(true);
  }

  function confirmSubmit() {
    setShowConfirm(false);
    payMutation.mutate();
  }

  const filteredBills = (bills || []).filter(b =>
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "billNumber",
        header: "Invoice Number",
        cell: ({ getValue }: any) => (
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="font-black text-slate-900 tracking-tight text-sm uppercase italic">{String(getValue() || "—")}</span>
          </div>
        ),
      },
      {
        accessorKey: "vendorName",
        header: "Supplier",
        cell: ({ getValue }: any) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-slate-400" />
            </div>
            <p className="font-black text-slate-900 text-xs uppercase italic">{String(getValue() || "—")}</p>
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ getValue }: any) => <div className="text-right font-black text-slate-900 text-xs font-mono tabular-nums">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "paidAmount",
        header: () => <div className="text-right">Paid</div>,
        cell: ({ getValue }: any) => <div className="text-right font-black text-emerald-600 text-xs font-mono tabular-nums">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "remaining",
        header: () => <div className="text-right">Remaining</div>,
        cell: ({ getValue }: any) => <div className="text-right font-black text-slate-900 text-xs font-mono tabular-nums">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ getValue }: any) => {
          const status = getValue() as string;
          const tone = statusBadgeTone[status] || "neutral";
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status={tone}>{getOperationalStatusLabel(status)}</OperationalStatusBadge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }: any) => (
          <div className="flex justify-end">
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Wallet className="h-3.5 w-3.5" />}
              onClick={() => handleOpenModal(row.original)}
            >
              Bayar
            </DnaButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalMigrationShell
      title="BAYAR"
      titleAccent="PEMBELIAN"
      subtitle="Pembayaran Faktur Pembelian — Vendor Payment Terminal"
    >
      <DnaInput
        icon={<Search className="h-4 w-4" />}
        placeholder="Search by invoice or supplier..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <OperationalDataTable
        data={filteredBills}
        columns={columns as any}
        getRowId={(row: any) => row.id}
        searchPlaceholder="Cari invoice atau supplier..."
      />

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-slate-900 text-white flex flex-row justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Payment Terminal</DialogTitle>
              <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">Purchase Payment Gateway v1.0</p>
            </div>
            <CreditCard className="h-12 w-12 text-emerald-500/80" />
          </DialogHeader>

          <div className="p-8 space-y-6">
            {selectedBill && (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Invoice</span>
                  <OperationalStatusBadge status={statusBadgeTone[selectedBill.status] || "neutral"}>
                    {getOperationalStatusLabel(selectedBill.status)}
                  </OperationalStatusBadge>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <span className="font-black text-slate-900 text-lg uppercase italic">{selectedBill.billNumber ?? "—"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200/50">
                  <div>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Supplier</p>
                    <p className="font-black text-slate-900 text-xs uppercase italic">{selectedBill.vendorName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Total</p>
                    <p className="font-black text-slate-900 text-xs font-mono">{formatOperationalCurrency(selectedBill.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Remaining</p>
                    <p className="font-black text-emerald-600 text-xs font-mono">{formatOperationalCurrency(selectedBill.remaining)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Payment Date <span className="text-red-500">*</span></label>
                  <DnaInput
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Cash / Bank Account <span className="text-red-500">*</span></label>
                  <Select
                    value={paymentForm.coaId}
                    onValueChange={(val: string | null) => setPaymentForm({ ...paymentForm, coaId: val ?? "" })}
                  >
                    <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                      <SelectValue placeholder="Select account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {coaAccounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Payment Amount (IDR) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                  <DnaInput
                    type="number"
                    placeholder="0.00"
                    className={cn(
                      "h-14 bg-slate-50 border-slate-200 font-black text-2xl text-slate-900 pl-16",
                      validationError && "border-rose-300 bg-rose-50/30"
                    )}
                    value={paymentForm.amount || ""}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    max={selectedBill?.remaining}
                  />
                </div>
                {validationError && (
                  <p className="flex items-center gap-1.5 text-[10px] font-medium text-rose-500 mt-1 ml-1">
                    <AlertTriangle className="h-3 w-3" />
                    {validationError}
                  </p>
                )}
                {selectedBill && paymentForm.amount > 0 && !validationError && (
                  <p className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 mt-1 ml-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Remaining after payment: {formatOperationalCurrency(selectedBill.remaining - paymentForm.amount)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Notes (Optional)</label>
                <DnaInput
                  placeholder="Payment reference notes..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-4 border-t border-slate-50">
              <DnaButton variant="outline" onClick={handleCloseModal}>
                Cancel
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={handleSubmit}
                disabled={payMutation.isPending}
                icon={<ArrowRight className="h-4 w-4" />}
              >
                {payMutation.isPending ? "PROCESSING..." : "Confirm Payment"}
              </DnaButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
    </OperationalMigrationShell>
  );
}
