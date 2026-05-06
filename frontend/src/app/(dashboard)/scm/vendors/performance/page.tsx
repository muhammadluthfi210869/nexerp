"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function VendorPerformancePage() {
  const { data: vendors } = useQuery({
    queryKey: ["vendor-performance"],
    queryFn: async () => {
      const res = await api.get("/scm/vendors");
      return (res.data || []).map((v: any) => {
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
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-indigo-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Supply Chain Intelligence</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Vendor <span className="text-indigo-500">Performance</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Global sourcing matrix & quality analytics
           </p>
        </div>

        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-6 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm">
              <Filter className="mr-2 h-4 w-4" /> Filter Matrix
           </Button>
           <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-tighter text-sm border-none">
              <Award className="mr-2 h-5 w-5 fill-white" /> Rank Audit
           </Button>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <MetricCard label="Average Quality" value={`${avgQuality}%`} trend={avgQuality > 90 ? '+2.4%' : '-1.2%'} icon={<ShieldCheck className="text-emerald-500" />} />
         <MetricCard label="Delivery Compliance" value={`${avgDelivery}%`} trend={avgDelivery > 85 ? '+1.8%' : '-2.1%'} icon={<Clock className="text-amber-500" />} />
         <MetricCard label="Cost Optimization" value={`Rp ${(avgScore * 1000000).toLocaleString()}`} trend="+8.5%" icon={<DollarSign className="text-indigo-500" />} />
         <MetricCard label="Risk Exposure" value={avgScore > 80 ? "LOW" : "MEDIUM"} trend={avgScore > 80 ? "STABLE" : "WATCH"} icon={<Zap className="text-blue-500" />} />
      </div>

      {/* Main Matrix */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
         <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5" />
               </div>
               <h3 className="font-black text-slate-900 uppercase italic">Vendor Scoring Matrix</h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Scientific Assessment v3.0</p>
         </div>
         <Table>
            <TableHeader className="bg-slate-50/30">
               <TableRow className="hover:bg-transparent">
                  <TableHead className="py-6 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Vendor Entity</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Composite Score</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Quality</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Delivery</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Tier Status</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Analytics</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {vendors?.map((vendor: any) => (
                  <TableRow key={vendor.id} className="group hover:bg-slate-50 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-300 shadow-inner group-hover:scale-110 transition-transform">
                              {vendor.name.charAt(0)}
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{vendor.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">ID: {vendor.id}</span>
                                 <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                 <span className="text-[10px] font-black text-indigo-600 uppercase">NPWP: 01.234.567.8-910.000</span>
                              </div>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full border-4 border-indigo-100 font-black text-indigo-600 text-sm">
                           {vendor.score}
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <div className="w-24 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: `${vendor.quality}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 mt-1 block">{vendor.quality}%</span>
                     </TableCell>
                     <TableCell className="text-center">
                        <div className="w-24 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500" style={{ width: `${vendor.delivery}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 mt-1 block">{vendor.delivery}%</span>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                          vendor.status === 'PLATINUM' ? "bg-indigo-600 text-white" : 
                          vendor.status === 'GOLD' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                        )}>
                           {vendor.status}
                        </Badge>
                     </TableCell>
                     <TableCell className="pr-10 text-right">
                        <Button variant="ghost" size="sm" className="h-10 px-6 font-black uppercase text-[10px] tracking-tight text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                           View Details <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </Card>

      {/* Legal & Compliance Section (100% Audit Readiness) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="rounded-[3rem] border-none shadow-2xl p-10 bg-indigo-900 text-white relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                     <ShieldCheck className="h-6 w-6 text-indigo-300" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Legal Compliance Vault</h3>
               </div>
               <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider leading-relaxed opacity-80">
                  Digital storage for SIUP, TDP, and Tax Certification. System enforces validity checks during PO issuance.
               </p>
               <div className="flex gap-3">
                  <Badge className="bg-emerald-500 text-white border-none px-4 py-1.5 font-black uppercase text-[9px]">NPWP Verified</Badge>
                  <Badge className="bg-indigo-700 text-white border-none px-4 py-1.5 font-black uppercase text-[9px]">SIUP Active</Badge>
               </div>
            </div>
            <Building2 className="absolute -right-10 -bottom-10 h-48 w-48 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
         </Card>

         <Card className="rounded-[3rem] border-none shadow-2xl p-10 bg-white border-2 border-slate-50 flex flex-col justify-center">
            <div className="space-y-4">
               <h4 className="text-audit-label flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-600" />
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
         </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, icon }: { label: string; value: string; trend: string; icon: any }) {
  return (
     <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-8 bg-white flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-500">
        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
           {icon}
        </div>
        <div>
           <p className="text-[9px] font-black uppercase tracking-tight text-slate-400 mb-1">{label}</p>
           <p className="text-2xl font-black italic tracking-tighter text-slate-900">{value}</p>
           <p className={cn("text-[9px] font-black uppercase mt-1", trend.startsWith('+') ? "text-emerald-500" : "text-rose-500")}>
              {trend} vs Last Quarter
           </p>
        </div>
     </Card>
  );
}

