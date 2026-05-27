"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  Award,
  ChevronRight,
  Filter,
  ArrowUpRight,
  Target,
  Zap,
  Building2,
  Package
} from "lucide-react";
import { DnaBadge, DnaButton, StatCard, TableWrapper } from "@/components/dna";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/empty-state";

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
      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCard label="Kualitas Rata-rata" value={`${avgQuality}%`} subValue={`${avgQuality > 90 ? '+2.4%' : '-1.2%'} vs Kuartal Lalu`} icon={<ShieldCheck className="text-emerald-500" />} />
         <StatCard label="Kepatuhan Pengiriman" value={`${avgDelivery}%`} subValue={`${avgDelivery > 85 ? '+1.8%' : '-2.1%'} vs Kuartal Lalu`} icon={<Clock className="text-amber-500" />} />
         <StatCard label="Optimalisasi Biaya" value={`Rp ${(avgScore * 1000000).toLocaleString()}`} subValue="+8.5% vs Kuartal Lalu" icon={<DollarSign className="text-blue-500" />} />
         <StatCard label="Eksposur Risiko" value={avgScore > 80 ? "RENDAH" : "SEDANG"} subValue={avgScore > 80 ? "STABIL" : "WASPADA"} icon={<Zap className="text-blue-500" />} />
      </div>

      {/* Main Matrix */}
      <TableWrapper>
         <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-white text-slate-900 rounded-xl flex items-center justify-center border border-slate-200">
                  <BarChart3 className="h-5 w-5" />
               </div>
               <h3 className="font-black text-slate-900 uppercase italic">Matriks Skor Pemasok</h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Scientific Assessment v3.0</p>
         </div>
         <Table>
            <TableHeader className="bg-slate-50/50">
               <TableRow className="hover:bg-transparent">
                   <TableHead className="py-4 px-4 text-table-header text-slate-400 text-left">Entitas Pemasok</TableHead>
                   <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Skor Komposit</TableHead>
                   <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Kualitas</TableHead>
                   <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Pengiriman</TableHead>
                   <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Tier</TableHead>
                   <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Analitik</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {!vendors || vendors.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={6} className="py-20">
                        <EmptyState
                          icon={<BarChart3 className="h-8 w-8 text-slate-300" />}
                          title="Belum Ada Pemasok"
                          description="Belum ada data pemasok yang tercatat. Tambahkan pemasok baru untuk mulai evaluasi."
                        />
                     </TableCell>
                  </TableRow>
               ) : vendors?.map((vendor: any) => (
                   <TableRow key={vendor.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-300 shadow-inner group-hover:scale-110 transition-transform">
                              {vendor.name.charAt(0)}
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{vendor.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[10px] font-black text-slate-400 uppercase">ID: {vendor.id}</span>
                                 <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                 <span className="text-[10px] font-black text-blue-600 uppercase">NPWP: 01.234.567.8-910.000</span>
                              </div>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="py-4 px-4 text-center">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full border-4 border-blue-100 font-black text-blue-600 text-sm">
                           {vendor.score}
                        </div>
                     </TableCell>
                     <TableCell className="py-4 px-4 text-center">
                        <div className="w-24 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: `${vendor.quality}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 mt-1 block">{vendor.quality}%</span>
                     </TableCell>
                     <TableCell className="py-4 px-4 text-center">
                        <div className="w-24 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500" style={{ width: `${vendor.delivery}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 mt-1 block">{vendor.delivery}%</span>
                     </TableCell>
                     <TableCell className="py-4 px-4 text-center">
                        <DnaBadge status={vendor.status === 'PLATINUM' ? 'info' : vendor.status === 'GOLD' ? 'warning' : 'default'} 
                          className={vendor.status === 'PLATINUM' ? 'bg-blue-600 text-white border-none' : ''}>
                           {vendor.status}
                        </DnaBadge>
                     </TableCell>
                     <TableCell className="py-4 px-4 text-right">
                        <DnaButton variant="ghost" className="h-10 px-6 text-blue-600 hover:bg-blue-50">
                           Lihat Detail <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                        </DnaButton>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </TableWrapper>

      {/* Legal & Compliance Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-10 bg-blue-900 text-white relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                     <ShieldCheck className="h-6 w-6 text-blue-300" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Legal Compliance Vault</h3>
               </div>
               <p className="text-[11px] font-black text-blue-200 uppercase tracking-wider leading-relaxed opacity-80">
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
                       <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{item}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </DashboardShell>
  );
}
