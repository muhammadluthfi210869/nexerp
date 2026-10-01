"use client";

import React from "react";
import { Wallet } from "lucide-react";
import { BankBalance } from "../_types/bayar-pembelian.types";

interface PaymentBankOverviewProps {
  totalLiquidCash: number;
  bankBalances: BankBalance[];
}

export function PaymentBankOverview({ totalLiquidCash, bankBalances }: PaymentBankOverviewProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs mb-6 space-y-4">
      {/* Top Banner: Total Dana Likuid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Dana Likuid Tersedia (Kas & Rekening Operasional)
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 mt-0.5 tabular-nums">
              Rp {totalLiquidCash.toLocaleString("id-ID")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Kas & Bank Siap Alokasi ({bankBalances.length} Rekening)
          </span>
        </div>
      </div>

      {/* Grid: Pembagian Saldo Rekening Bank & Kas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {bankBalances.map((acc) => {
          const sharePct = totalLiquidCash > 0 ? ((acc.balance / totalLiquidCash) * 100).toFixed(1) : "0";
          return (
            <div
              key={acc.accountCode}
              className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate" title={acc.accountName}>
                    {acc.accountName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 tabular-nums">
                    {acc.accountNumber}
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 tabular-nums shrink-0">
                  {sharePct}%
                </span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/50">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Saldo Tersedia</div>
                <div className="text-sm font-black text-slate-900 tabular-nums mt-0.5">
                  Rp {acc.balance.toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
