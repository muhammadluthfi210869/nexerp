"use client";

import React from "react";
import { CircleDollarSign, ShieldCheck } from "lucide-react";
import { DnaButton, DnaInput, DnaSelect, DnaTextarea } from "@/components/dna";
import { motion, AnimatePresence } from "framer-motion";
import type { ArInvoiceRow } from "../_types/piutang.types";

interface ARPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvoice: ArInvoiceRow | null;
}

export function ARPaymentModal({
  isOpen,
  onClose,
  selectedInvoice,
}: ARPaymentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border-none"
          >
            <div className="p-8 bg-blue-600 text-white flex flex-row justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">AR Collection Settlement</h3>
                <p className="text-blue-200 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">Revenue Settlement Protocol v2.1</p>
              </div>
              <CircleDollarSign className="h-12 w-12 text-white/80" />
            </div>
            <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Debtor</p>
                <p className="font-black text-xs uppercase text-slate-900 truncate">{selectedInvoice.pelanggan}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Invoice ID</p>
                <p className="font-black text-xs uppercase text-slate-900">{selectedInvoice.kode_faktur}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Outstanding</p>
                <p className="font-black text-xs text-rose-600">Rp {selectedInvoice.sisa.toLocaleString("id-ID")}</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Payment Date</label>
                  <div className="relative">
                    <DnaInput type="date" className="h-11 bg-slate-50 border-none font-black uppercase text-xs focus:ring-4 focus:ring-blue-500/5 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Target Account</label>
                  <DnaSelect
                    className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs"
                    options={["BCA Main (2640...)", "Mandiri Corporate", "Petty Cash (IDR)"]}
                  >
                    <option>BCA Main (2640...)</option>
                    <option>Mandiri Corporate</option>
                    <option>Petty Cash (IDR)</option>
                  </DnaSelect>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Collection Amount (IDR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                  <DnaInput type="number" defaultValue={selectedInvoice.sisa} className="h-12 pl-12 bg-slate-50 border-none font-black text-lg text-slate-900 tabular-nums focus:ring-4 focus:ring-blue-500/5 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Remarks / Reference</label>
                <DnaTextarea
                  rows={3}
                  placeholder="E.g., Bank transfer reference..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
              </div>
              <div className="pt-4 flex gap-4">
                <DnaButton onClick={onClose} variant="outline" className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50">
                  Abort & Dismiss
                </DnaButton>
                <DnaButton onClick={onClose} variant="primary" className="flex-[2] h-12 rounded-xl tracking-widest text-[10px] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Commit Collection
                </DnaButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
