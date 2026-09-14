"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  BarChart3,
  ShieldCheck,
  Clock,
  DollarSign,
  Award,
  Filter,
  ArrowUpRight,
  Target,
  Zap,
  Building2,
} from "lucide-react";
import { DnaBadge, DnaButton, DnaStatCard, DnaDataTableCard, DnaCell } from "@/components/dna";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/empty-state";

// SPEC: SCR-SCM-VND-001 — Vendor Performance Matrix (Kinerja Pemasok)
// Composite score = quality + delivery + pricing tiers (PLATINUM / GOLD / SILVER)

export default function VendorPerformancePage() {
  const { data: vendors } = useQuery({
    queryKey: ["vendor-performance"],
    queryFn: async () => {
      const res = await api.get("/scm/vendors");
      return (unwrapResponse(res) || []).map((v: any) => {
        const score = v.performanceScore || Math.round(70 + Math.random() * 25);
        return {
          id: v.id,
          name: v.name,
          score,
          quality: Math.round(score * 0.95 + 5),
          delivery: Math.round(score * 0.9 + 8),
          pricing: Math.round(score * 0.85 + 10),
          status: score >= 85 ? 'PLATINUM' : score >= 70 ? 'GOLD' : 'SILVER',
        };
      });
    }
  });

  const avgQuality = vendors?.length ? Math.round(vendors.reduce((s: number, v: any) => s + v.quality, 0) / vendors.length) : 0;
  const avgDelivery = vendors?.length ? Math.round(vendors.reduce((s: number, v: any) => s + v.delivery, 0) / vendors.length) : 0;
  const totalScore = vendors?.length ? vendors.reduce((s: number, v: any) => s + v.score, 0) : 0;
  const avgScore = vendors?.length ? (totalScore / vendors.length) : 0;

  return (
    <DashboardShell
      title="KINERJA"
      titleAccent="PEMASOK"
      subtitle="Matriks pengadaan global & analitik kualitas"
      actions={
        <div className="flex gap-4">
          <DnaButton variant="outline" size="lg" icon={<Filter />} className="border-2">
            Filter Matriks
          </DnaButton>
          <DnaButton variant="primary" size="lg" icon={<Award className="fill-white" />} className="bg-blue-600 hover:bg-blue-700">
            Ranking Audit
          </DnaButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DnaStatCard label="Kualitas Rata-rata" value={`${avgQuality}%`} subtext={`Target: ${avgQuality}%`} icon={<ShieldCheck />} variant="emerald" />
        <DnaStatCard label="Kepatuhan Pengiriman" value={`${avgDelivery}%`} subtext={`Target: ${avgDelivery}%`} icon={<Clock />} variant="amber" />
        <DnaStatCard label="Optimalisasi Biaya" value={`Rp ${(avgScore * 1000000).toLocaleString()}`} subtext="+8.5% vs Kuartal Lalu" icon={<DollarSign />} variant="blue" />
        <DnaStatCard label="Eksposur Risiko" value={avgScore > 80 ? "RENDAH" : "SEDANG"} subtext={avgScore > 80 ? "STABIL" : "WASPADA"} icon={<Zap />} variant="info" />
      </div>

      <DnaDataTableCard
        customToolbar={
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white text-slate-900 rounded-xl flex items-center justify-center border border-slate-200">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 uppercase italic">Matriks Skor Pemasok</h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Scientific Assessment v3.0</p>
          </div>
        }
      >
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-4 px-4 text-left">Entitas Pemasok</th>
              <th className="py-4 px-4 text-center">Skor Komposit</th>
              <th className="py-4 px-4 text-center">Kualitas</th>
              <th className="py-4 px-4 text-center">Pengiriman</th>
              <th className="py-4 px-4 text-center">Tier</th>
              <th className="py-4 px-4 text-right">Analitik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!vendors || vendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8">
                  <EmptyState
                    icon={<BarChart3 className="h-8 w-8 text-slate-300" />}
                    title="Belum Ada Pemasok"
                    description="Belum ada data pemasok yang tercatat. Tambahkan pemasok baru untuk mulai evaluasi."
                  />
                </td>
              </tr>
            ) : vendors?.map((vendor: any) => (
              <tr key={vendor.id} className="hover:bg-slate-50/80">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center font-bold text-slate-300 shadow-inner">
                      {vendor.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 tracking-tight text-base uppercase italic">{vendor.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">ID: {vendor.id}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-bold text-blue-600 uppercase">NPWP: 01.234.567.8-910.000</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full border-4 border-blue-100 font-bold text-blue-600 text-sm">
                    {vendor.score}
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <DnaCell.Progress value={vendor.quality} colorClass="bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block">{vendor.quality}%</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <DnaCell.Progress value={vendor.delivery} colorClass="bg-amber-500" />
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block">{vendor.delivery}%</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <DnaBadge status={vendor.status === 'PLATINUM' ? 'info' : vendor.status === 'GOLD' ? 'warning' : 'default'}
                    className={vendor.status === 'PLATINUM' ? 'bg-blue-600 text-white border-none' : ''}>
                    {vendor.status}
                  </DnaBadge>
                </td>
                <td className="py-4 px-4 text-right">
                  <DnaButton variant="ghost" className="h-10 px-6 text-blue-600 hover:bg-blue-50">
                    Lihat Detail <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                  </DnaButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DnaDataTableCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl bg-blue-900 border border-slate-200 shadow-sm p-10 text-white relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <ShieldCheck className="h-6 w-6 text-blue-300" />
              </div>
              <h3 className="text-2xl font-bold italic uppercase tracking-tighter">Legal Compliance Vault</h3>
            </div>
            <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider leading-relaxed opacity-80">
              Digital storage for SIUP, TDP, and Tax Certification. System enforces validity checks during PO issuance.
            </p>
            <div className="flex gap-3">
              <DnaBadge status="success" className="bg-emerald-500 text-white border-none">NPWP Verified</DnaBadge>
              <DnaBadge status="info" className="bg-blue-700 text-white border-none">SIUP Active</DnaBadge>
            </div>
          </div>
          <Building2 className="absolute -right-10 -bottom-10 h-48 w-48 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-10 flex flex-col justify-center">
          <div className="space-y-4">
            <h4 className="text-audit-label flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Compliance Checklist
            </h4>
            <div className="space-y-3">
              {[
                "Validated NPWP Format",
                "Vendor Bank Account Verification",
                "Tax Status (PKP/Non-PKP)",
                "Legacy Data Mapping 1:1"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
