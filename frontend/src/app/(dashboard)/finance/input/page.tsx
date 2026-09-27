"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { ArrowUpCircle, ArrowDownCircle, Wallet, AlertCircle } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaBadge } from "@/components/dna";

export default function FinanceInputPage() {
  // Live cash position — finance advances / fund requests that are still open.
  const { data: fundRequests, isError } = useQuery<any[]>({
    queryKey: ["finance-input-fund-requests"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/fund-requests");
        const body = unwrapResponse<any>(res);
        return Array.isArray(body) ? body : (body?.data ?? []);
      } catch {
        return [];
      }
    },
  });

  const pendingAdvances = useMemo(() => {
    const open = ["PENDING", "APPROVED", "DISBURSED", "WAITING_DIRECTOR"];
    return (fundRequests ?? []).filter((f) => open.includes(String(f.status)));
  }, [fundRequests]);

  const inputs = [
    {
      title: "Kas Masuk",
      subtitle: "Pencatatan penerimaan dana masuk",
      icon: ArrowUpCircle,
      href: "/finance/cash-in",
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200 hover:border-emerald-400",
    },
    {
      title: "Kas Keluar",
      subtitle: "Pencatatan pengeluaran dana",
      icon: ArrowDownCircle,
      href: "/finance/cash-out",
      iconColor: "text-rose-500",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200 hover:border-rose-400",
    },
  ];

  return (
    <DashboardShell
      title="FINANCE"
      titleAccent="INPUT"
      subtitle="Pencatatan transaksi kas masuk dan kas keluar"
      actions={<DnaBadge status="info">Input Terminal</DnaBadge>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inputs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative overflow-hidden rounded-2xl border ${item.borderColor} bg-white p-8 text-left transition-all duration-300 hover:shadow-lg cursor-pointer`}
          >
            <div className={`absolute top-0 right-0 p-6 opacity-5 pointer-events-none ${item.iconColor}`}>
              <item.icon size={120} />
            </div>
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${item.bgColor} mb-4`}>
              <item.icon className={`h-7 w-7 ${item.iconColor}`} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
              {item.title}
            </h3>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              {item.subtitle}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-blue-600" />
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Pengajuan Dana Aktif
            </p>
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {isError ? "—" : pendingAdvances.length}
          </p>
          <p className="text-[10px] font-medium text-slate-400 uppercase mt-1">
            Status pending / approved / disbursed
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Catatan
            </p>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {isError
              ? "Data pengajuan dana tidak dapat dimuat dari server. Terminal input tetap dapat digunakan."
              : "Terminal ini hanya mencatat pergerakan kas. Sumber angka di atas adalah pengajuan dana (fund request) yang belum selesai diproses."}
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
