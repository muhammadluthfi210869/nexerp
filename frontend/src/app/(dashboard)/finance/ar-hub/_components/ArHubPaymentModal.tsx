"use client";

import React from "react";
import { CreditCard, Calendar, ShieldCheck } from "lucide-react";
import {
  DnaModal,
  DnaSelect,
  DnaInput,
  DnaTextarea,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import type { SelectedTarget, AccountOption } from "../_types/ar-hub.types";

interface ArHubPaymentModalProps {
  selected: SelectedTarget | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  receivingAccountId: string;
  setReceivingAccountId: (val: string) => void;
  actualAmount: string;
  setActualAmount: (val: string) => void;
  bankAdminFee: string;
  setBankAdminFee: (val: string) => void;
  taxAmount: string;
  setTaxAmount: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  accountOptions: AccountOption[];
  isAccountsLoading: boolean;
}

export function ArHubPaymentModal({
  selected,
  onClose,
  onSubmit,
  isSubmitting,
  receivingAccountId,
  setReceivingAccountId,
  actualAmount,
  setActualAmount,
  bankAdminFee,
  setBankAdminFee,
  taxAmount,
  setTaxAmount,
  notes,
  setNotes,
  accountOptions,
  isAccountsLoading,
}: ArHubPaymentModalProps) {
  return (
    <DnaModal
      isOpen={!!selected}
      onClose={onClose}
      title="Validasi Pembayaran Masuk"
      subtitle={
        selected?.kind === "order"
          ? `Faktur ${selected.row.invoiceNumber} â€” ${selected.row.customerName}`
          : selected
          ? `${selected.row.activityType} â€” ${selected.row.clientName}`
          : undefined
      }
      size="lg"
    >
      {selected && (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Nilai Tercatat</p>
              <p className="font-black text-xs text-slate-900 tabular-nums">
                {formatRupiah(selected.kind === "order" ? selected.row.outstanding : selected.row.amount)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Jenis</p>
              <p className="font-black text-xs uppercase text-slate-900">
                {selected.kind === "order" ? selected.row.invoiceType : selected.row.activityType}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Status</p>
              <p className="font-black text-xs uppercase text-slate-900">
                {selected.kind === "order" ? selected.row.status : "BELUM DIVALIDASI"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Akun Penerima *</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                <DnaSelect
                  value={receivingAccountId}
                  onChange={setReceivingAccountId}
                  placeholder={isAccountsLoading ? "Memuat akun..." : "Pilih akun..."}
                  options={accountOptions}
                  className="h-11 pl-12"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Tanggal Validasi</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <DnaInput
                  type="date"
                  value={new Date().toISOString().slice(0, 10)}
                  readOnly
                  className="h-11 pl-12 bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Nominal Aktual *</label>
              <DnaInput
                type="number"
                min={1}
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                className="h-11 tabular-nums"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Biaya Bank</label>
              <DnaInput
                type="number"
                min={0}
                value={bankAdminFee}
                onChange={(e) => setBankAdminFee(e.target.value)}
                className="h-11 tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Pajak</label>
              <DnaInput
                type="number"
                min={0}
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                className="h-11 tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Catatan / Referensi</label>
            <DnaTextarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., referensi transfer bank..."
              className="w-full"
            />
          </div>

          <div className="pt-3 flex gap-3 border-t border-slate-100">
            <DnaButton type="button" onClick={onClose} variant="outline" className="flex-1">
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary" className="flex-[2]" disabled={isSubmitting}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {isSubmitting ? "Memvalidasi..." : "Commit Validation"}
            </DnaButton>
          </div>
        </form>
      )}
    </DnaModal>
  );
}
