"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Activity,
  DollarSign,
  Trophy,
  Database,
  Search,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface ScmDashboardData {
  cards: {
    inventory: {
      accuracy: number;
      totalSku: number;
      criticalStock: number;
      insight: string;
    };
    procurement: {
      leadTime: number;
      supplierPerf: number;
      savingPercent: number;
      insight: string;
    };
    warehouse: {
      putawaySpeed: string;
      fulfillment: number;
      returnRate: number;
      insight: string;
    };
    logistics: {
      shippingPerUnit: number;
      damageRate: string;
      otd: number;
      insight: string;
    };
  };
  tables: {
    reconciliation: Array<{
      sku: string;
      name: string;
      systemStock: number;
      actualStock: number;
      variance: number;
      lastAudit: string;
      status: string;
    }>;
    procurementTracker: Array<{
      poId: string;
      vendor: string;
      item: string;
      poDate: string;
      recvDate: string;
      leadTime: number;
      quality: string;
    }>;
    expirationWatch: Array<{
      sku: string;
      batch: string;
      expDate: string;
      daysRemaining: number;
      value: number;
      action: string;
    }>;
  };
}

export default function ScmDashboardPage() {
  const { data: dashboard, isLoading } = useQuery<ScmDashboardData>({
    queryKey: ["scm-executive-dashboard"],
    queryFn: async () => {
      const res = await api.get("/scm/dashboard");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-[#fafafa]">
        <div className="h-16 w-16 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] animate-pulse">Syncing SCM Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 bg-[#fafafa] min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex items-baseline gap-3 mb-8">
        <h1 className="text-[32px] font-black text-brand-black uppercase tracking-tighter italic">
          SUPPLY CHAIN MANAGEMENT (SCM)
        </h1>
        <span className="text-slate-400 font-bold text-sm tracking-tight italic">
          (Command Center & Performance Audit)
        </span>
      </div>

      {/* I. SCM STRATEGIC OVERVIEW (Executive Command) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* A. STOCK HEALTH */}
        <Card className="rounded-[2.2rem] p-7 border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[220px]">
           <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <p className="text-[11px] font-black text-brand-black uppercase tracking-widest italic">A. STOCK HEALTH</p>
           </div>
           
           <div className="flex justify-between items-end">
              <div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">TOTAL STOCK VALUE</p>
                 <h2 className="text-4xl font-black text-brand-black tracking-tighter italic">Rp 6.8 M</h2>
              </div>
              <div className="text-right space-y-1.5 pb-1">
                 <div className="flex items-center justify-end gap-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">EXCESS STOCK</span>
                    <span className="text-[12px] font-black text-rose-500 tabular tracking-tighter">Rp 450 Jt</span>
                 </div>
                 <div className="flex items-center justify-end gap-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">DEAD STOCK</span>
                    <span className="text-[12px] font-black text-brand-black tabular tracking-tighter">Rp 120 Jt</span>
                 </div>
              </div>
           </div>

           <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-3">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">TURNOVER AVG</span>
              <span className="text-[12px] font-black text-blue-600 tabular">18 DAYS</span>
           </div>
        </Card>

        {/* B. MATERIAL READINESS */}
        <Card className="rounded-[2.2rem] p-7 border border-emerald-100 shadow-sm bg-[#f1fdf6]/70 flex flex-col justify-between min-h-[220px]">
           <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest italic">B. MATERIAL READINESS</p>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center -mt-2">
              <h2 className="text-5xl font-black text-brand-black tracking-tighter leading-none italic">92%</h2>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">READY TO PRODUCE</p>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white p-3 rounded-2xl border border-emerald-100 flex flex-col items-center shadow-sm">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">SHORTAGE</p>
                 <p className="text-2xl font-black text-rose-500 tabular leading-none">5</p>
              </div>
              <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100 flex flex-col items-center shadow-sm">
                 <p className="text-[8px] font-black text-rose-800 uppercase tracking-widest mb-1">MUST BUY</p>
                 <p className="text-2xl font-black text-rose-600 tabular leading-none">12</p>
              </div>
           </div>
        </Card>

        {/* C. COST EFFICIENCY */}
        <Card className="rounded-[2.2rem] p-7 border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[220px]">
           <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <p className="text-[11px] font-black text-brand-black uppercase tracking-widest italic">C. COST EFFICIENCY</p>
           </div>
           
           <div className="space-y-4 px-1">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG VARIANCE</span>
                 <span className="text-[13px] font-black text-amber-600 tabular tracking-tighter">+2.4%</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">COST SAVING</span>
                 <span className="text-[13px] font-black text-emerald-600 tabular tracking-tighter">Rp 85 Jt</span>
              </div>
           </div>

           <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100 flex justify-between items-center mt-6">
              <p className="text-[9px] font-black text-rose-800 uppercase tracking-widest">OVERPAYING MATERIALS</p>
              <p className="text-[13px] font-black text-brand-black tabular">8 <span className="text-[9px] font-bold text-slate-400">ITEMS</span></p>
           </div>
        </Card>

        {/* D. PURCHASE PERFORMANCE */}
        <Card className="rounded-[2.2rem] p-7 border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[220px]">
           <div className="flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-blue-500" />
              <p className="text-[11px] font-black text-brand-black uppercase tracking-widest italic">D. PURCHASE PERFORMANCE</p>
           </div>
           
           <div className="space-y-5 px-1">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ON-TIME PURCHASE</span>
                 <span className="text-[13px] font-black text-blue-700 tabular tracking-tighter">88.5%</span>
              </div>
              <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                 <div className="h-full bg-blue-500" style={{ width: '88.5%' }} />
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG LEAD TIME</span>
                 <span className="text-[13px] font-black text-brand-black tabular tracking-tighter">8.2d</span>
              </div>
           </div>
        </Card>

        {/* E. COST SAVINGS */}
        <Card className="rounded-[2.2rem] p-7 border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[220px]">
           <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <p className="text-[11px] font-black text-brand-black uppercase tracking-widest italic">E. COST SAVINGS</p>
           </div>
           
           <div className="flex-1 flex flex-col justify-center -mt-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL SAVINGS (MTD)</p>
              <h2 className="text-4xl font-black text-purple-600 tracking-tighter italic">Rp 215 Jt</h2>
           </div>

           <div className="space-y-2.5 pt-3 border-t border-slate-50 mt-3">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NEGOTIATION WIN</span>
                 <span className="text-[13px] font-black text-emerald-600 tabular tracking-tighter">12.4%</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LOSS AVOIDED</span>
                 <span className="text-[13px] font-black text-brand-black tabular tracking-tighter">Rp 340 Jt</span>
              </div>
           </div>
        </Card>

        {/* F. PERFORMANCE SCORECARD */}
        <Card className="rounded-[2.2rem] p-7 border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[220px]">
           <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-brand-black" />
              <p className="text-[11px] font-black text-brand-black uppercase tracking-widest italic">F. PERFORMANCE SCORECARD</p>
           </div>
           
           <div className="space-y-2.5 px-0.5">
             {[
               { label: 'SCM GENERAL', val: '94%', color: 'text-brand-black' },
               { label: 'BAHAN BAKU (RAW)', val: '90%', color: 'text-rose-500' },
               { label: 'BAHAN KEMAS (PACK)', val: '96%', color: 'text-emerald-500' },
               { label: 'BOX AUDIT', val: '98%', color: 'text-amber-800' },
               { label: 'LABEL ACCURACY', val: '88%', color: 'text-purple-500' },
             ].map((item, i) => (
               <div key={i} className={cn("flex justify-between items-center", i < 4 && "border-b border-slate-50 pb-1.5")}>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                 <span className={cn("text-[12px] font-black tabular tracking-tighter", item.color)}>{item.val}</span>
               </div>
             ))}
           </div>
        </Card>
      </div>

      {/* 🤝 II. SCM-PRODUCTION BRIDGE (COMMUNICATION PROTOCOL) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-primary rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">II. SCM-PRODUCTION BRIDGE (COMMUNICATION PROTOCOL)</h3>
        </div>
        
        {/* EXECUTIVE CATEGORY VELOCITY CLOUD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: '1. BAHAN BAKU (RAW)', score: '92', status: 'STABLE', pulse: 'bg-emerald-500',
              stats: { fast: 3, ontime: 12, late: 1, pending: 4 },
              arrival: '85% READY', theme: 'bg-rose-500' 
            },
            { 
              label: '2. BAHAN KEMAS (PACK)', score: '78', status: 'DELAYED', pulse: 'bg-rose-500',
              stats: { fast: 0, ontime: 8, late: 5, pending: 2 },
              arrival: '62% READY', theme: 'bg-amber-500' 
            },
            { 
              label: '3. LABEL AUDIT', score: '88', status: 'STABLE', pulse: 'bg-emerald-500',
              stats: { fast: 2, ontime: 18, late: 2, pending: 5 },
              arrival: '92% READY', theme: 'bg-purple-500' 
            },
            { 
              label: '4. BOX & CARDBOARD', score: '98', status: 'FAST', pulse: 'bg-emerald-500',
              stats: { fast: 8, ontime: 15, late: 0, pending: 1 },
              arrival: '98% READY', theme: 'bg-amber-900' 
            }
          ].map((cat, i) => (
            <Card key={i} className="bento-card p-5 bento-card-hover relative overflow-hidden">
              <div className={cn("absolute top-0 left-0 w-1 h-full", cat.theme)} />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">{cat.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.1)]", cat.pulse)} />
                    <span className="text-[10px] font-black text-brand-black">{cat.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-black text-slate-400 uppercase">SCORE</p>
                  <p className={cn("text-lg font-black tabular", cat.score < '85' ? 'text-rose-500' : 'text-emerald-500')}>{cat.score}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {[
                  { l: 'FAST', v: cat.stats.fast, c: 'text-emerald-500' },
                  { l: 'REG', v: cat.stats.ontime, c: 'text-blue-500' },
                  { l: 'LATE', v: cat.stats.late, c: 'text-rose-500' },
                  { l: 'OUT', v: cat.stats.pending, c: 'text-slate-400' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-1.5 rounded-lg text-center border border-slate-100">
                    <p className="text-[6px] font-black text-slate-400 uppercase">{s.l}</p>
                    <p className={cn("text-[10px] font-black tabular", s.c)}>{s.v}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                 <div className="flex items-center gap-1.5">
                    <Database className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-[9px] font-black text-brand-black uppercase">{cat.arrival}</span>
                 </div>
                 <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                   <div className={cn("h-full", cat.theme)} style={{ width: cat.arrival.split('%')[0] + '%' }} />
                 </div>
              </div>
            </Card>
          ))}
        </div>

        {/* MASSIVE WO TRACKING TABLE */}
        <Card className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase">WORK ORDER / PRODUCT</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase">TARGET QTY</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase">BO STATUS (NEEDS / WH / GAP)</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase">PO TRACKING (QTY / STATUS)</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase">EST. ARRIVAL</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase">IMPACT / ANOMALY</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase">SUPPLIER SCORE</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { wo: 'WO-2024-001', prod: 'Serum Brightening X', target: '50,000 Pcs', needs: '500 Kg', wh: '320 Kg', gap: '180 Kg', poQty: '200 Kg', poStatus: 'IN TRANSIT', eta: '2024-04-05', impact: 'READY', score: '4.8/5' },
                  { wo: 'WO-2024-005', prod: 'Acne Cream Night', target: '25,000 Pcs', needs: '125 Kg', wh: '20 Kg', gap: '105 Kg', poQty: '105 Kg', poStatus: 'WAITING DP', eta: '2024-04-12', impact: 'DELAYED', reason: 'Nego Pending', score: '4.2/5' },
                  { wo: 'WO-2024-008', prod: 'Body Lotion Ultra', target: '10,000 Pcs', needs: '400 Kg', wh: '450 Kg', gap: '0', poQty: '-', poStatus: 'COMPLETE', eta: '-', impact: 'READY', score: '5.0/5' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-brand-black">{row.wo}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{row.prod}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black tabular">{row.target}</td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-xs font-black tabular">{row.needs} / {row.wh} / <span className={row.gap !== '0' ? 'text-rose-500' : 'text-emerald-500'}>{row.gap}</span></p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-xs font-black text-blue-600 tabular">{row.poQty}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase">{row.poStatus}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-[10px] font-bold tabular text-slate-500">{row.eta}</td>
                    <td className="px-6 py-4 text-center">
                       <span className={cn(
                         "px-2.5 py-1 rounded-md text-[8px] font-black text-white",
                         row.impact === 'READY' ? "bg-emerald-500" : "bg-rose-500"
                       )}>{row.impact}</span>
                       {row.reason && <p className="text-[8px] text-rose-500 mt-1 font-bold italic">{row.reason}</p>}
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black text-brand-black tabular">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 🔴 III. MATERIAL MASTER & STOCK AUDIT (UNIFIED REPOSITORY) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-rose-500 rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">III. MATERIAL MASTER & STOCK AUDIT (UNIFIED REPOSITORY)</h3>
        </div>
        <Card className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase">MATERIAL NAME / TYPE</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">STOCK (CURR / RES / AVAIL)</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase">UNIT PRICE / TOTAL</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">LEVELS (MIN / MAX / ROP)</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">USAGE / LEAD TIME</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">STATUS AUDIT</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Niacinamide Alpha', type: 'RAW', cat: 'Chemical', u: 'Kg', curr: '120', res: '80', avail: '40', price: '12.5k', total: '1.5M', levels: '50 / 500 / 100', usage: '5 Kg/d', lt: '14d', status: 'SHORTAGE' },
                  { name: 'Retinol Kapsul', type: 'RAW', cat: 'Active', u: 'Kg', curr: '450', res: '50', avail: '400', price: '110k', total: '49.5M', levels: '50 / 800 / 150', usage: '2 Kg/d', lt: '30d', status: 'HEALTHY' },
                  { name: 'Botol Serum 30ml', type: 'PACKAGING', cat: 'Glass', u: 'Pcs', curr: '15k', res: '12k', avail: '3k', price: '2.5k', total: '37.5M', levels: '5k / 50k / 10k', usage: '500 Pcs/d', lt: '7d', status: 'SHORTAGE' },
                  { name: 'Box Acne Serum', type: 'BOX', cat: 'Printing', u: 'Pcs', curr: '45k', res: '5k', avail: '40k', price: '1.2k', total: '54M', levels: '5k / 40k / 10k', usage: '500 Pcs/d', lt: '5d', status: 'EXCESS' },
                  { name: 'Dead Sample Kemasan', type: 'PACKAGING', cat: 'N/A', u: 'Pcs', curr: '120', res: '0', avail: '120', price: '5k', total: '0.6M', levels: '0 / 0 / 0', usage: '0', lt: '-', status: 'DEAD STOCK' },
                ].map((row, i) => (
                  <tr key={i} className={cn("border-b border-slate-50 hover:bg-slate-50/30 transition-colors", row.status === 'SHORTAGE' && 'bg-rose-50/30')}>
                    <td className="px-6 py-5">
                       <p className="text-[13px] font-black text-brand-black">{row.name}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">{row.type} | {row.cat}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <p className="text-[13px] font-black text-brand-black tabular">{row.curr} / {row.res} / <span className={row.status === 'SHORTAGE' ? 'text-rose-500' : 'text-emerald-500'}>{row.avail}</span></p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">UNIT: {row.u}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <p className="text-xs font-black text-brand-black tabular">Rp {row.total}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">@{row.price} / {row.u}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <p className="text-xs font-black text-brand-black tabular">{row.levels}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <p className="text-[11px] font-black text-brand-black tabular">{row.usage}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Lead: {row.lt}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={cn(
                         "px-3 py-1 rounded-md text-[9px] font-black text-white",
                         row.status === 'SHORTAGE' ? 'bg-rose-500' : (row.status === 'EXCESS' ? 'bg-amber-500' : (row.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-slate-500'))
                       )}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* IV. CATEGORY-SPECIFIC PERFORMANCE AUDIT */}
      <div className="space-y-12 py-8">
        <h3 className="text-lg font-black text-brand-black border-b-2 border-brand-black inline-block pb-1 uppercase tracking-tighter italic">
          CATEGORY-SPECIFIC PERFORMANCE AUDIT
        </h3>

        {/* A. RAW MATERIAL PERFORMANCE */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded-sm" />
              <h4 className="text-[13px] font-black uppercase tracking-widest text-brand-black">A. RAW MATERIAL PERFORMANCE (QUALITY & CONTINUITY)</h4>
           </div>
           <Card className="bento-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1600px]">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                         <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase">SUPPLIER / MATERIAL</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">PERIOD</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">VOLUME (QTY/CNT)</th>
                         <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase">COST (PRICE/VAR/TOTAL)</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">TIMELINESS (OTD/DELY)</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">QUALITY (REJ/SCR)</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">BATCH REJ RATE</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">RISK AUDIT</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[
                        { name: 'PT Surya Kimia', mat: 'Niacinamide Alpha', p: 'Monthly', qty: '500 Kg', cnt: '5', price: '12.5k', var: '+2.1%', spend: '125M', otd: '85%', dly: '1', rej: '5Kg', score: '90', brr: '0.5%', risk: 'LOW', critical: true },
                        { name: 'Indo Chemical', mat: 'Retinol Kapsul', p: 'Monthly', qty: '100 Kg', cnt: '2', price: '110k', var: '+5.4%', spend: '11M', otd: '72%', dly: '1', rej: '2Kg', score: '78', brr: '2.0%', risk: 'MEDIUM', critical: true },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                           <td className="px-5 py-4">
                              <p className="text-[13px] font-black text-brand-black">{row.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{row.mat} {row.critical && <span className="text-rose-500 font-black italic">(CRITICAL)</span>}</p>
                           </td>
                           <td className="px-5 py-4 text-center text-[11px] font-black tabular text-slate-600">{row.p}</td>
                           <td className="px-5 py-4 text-center">
                              <p className="text-xs font-black tabular">{row.qty}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{row.cnt} ORDERS</p>
                           </td>
                           <td className="px-5 py-4 text-right">
                              <p className="text-xs font-black tabular">Rp {row.spend}</p>
                              <p className={cn("text-[9px] font-bold uppercase", row.var.includes('+') ? 'text-rose-500' : 'text-emerald-500')}>{row.var} @{row.price}</p>
                           </td>
                           <td className="px-5 py-4 text-center">
                              <p className="text-xs font-black tabular text-brand-black">{row.otd}</p>
                              <p className="text-[9px] font-bold text-rose-500 uppercase">{row.dly} DELAYED</p>
                           </td>
                           <td className="px-5 py-4 text-center">
                              <p className="text-xs font-black tabular text-brand-black">{row.score}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">REJ: {row.rej}</p>
                           </td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular text-amber-600">{row.brr}</td>
                           <td className="px-5 py-4 text-center">
                              <span className={cn(
                                "px-2.5 py-1 rounded-md text-[9px] font-black text-white",
                                row.risk === 'LOW' ? 'bg-emerald-500' : 'bg-amber-500'
                              )}>{row.risk}</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </Card>
        </div>

        {/* B. PACKAGING PERFORMANCE */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-sm" />
              <h4 className="text-[13px] font-black uppercase tracking-widest text-brand-black">B. PACKAGING PERFORMANCE (MOQ & OVERSTOCK FOCUS)</h4>
           </div>
           <Card className="bento-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1600px]">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                         <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase">SUPPLIER / MATERIAL</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">VOLUME</th>
                         <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase">COST AUDIT</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">OTD %</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">MOQ EXCESS</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">USAGE MISMATCH</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">RISK</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[
                        { name: 'Global Kemasindo', mat: 'Botol Serum 30ml', qty: '10,000 Pcs', spend: '25M', otd: '100%', excess: '1,000', mismatch: '1.2%', risk: 'LOW' },
                        { name: 'Putra Pack', mat: 'Cap Pump White', qty: '15,000 Pcs', spend: '15M', otd: '92%', excess: '2,500', mismatch: '4.8%', risk: 'MEDIUM' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                           <td className="px-5 py-4">
                              <p className="text-[13px] font-black text-brand-black">{row.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{row.mat}</p>
                           </td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular">{row.qty}</td>
                           <td className="px-5 py-4 text-right text-xs font-black tabular">Rp {row.spend}</td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular text-emerald-500">{row.otd}</td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular text-rose-500">{row.excess}</td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular text-amber-600">{row.mismatch}</td>
                           <td className="px-5 py-4 text-center">
                              <span className={cn(
                                "px-2.5 py-1 rounded-md text-[9px] font-black text-white",
                                row.risk === 'LOW' ? 'bg-emerald-500' : 'bg-amber-500'
                              )}>{row.risk}</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </Card>
        </div>

        {/* C. BOX PERFORMANCE */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-900 rounded-sm" />
              <h4 className="text-[13px] font-black uppercase tracking-widest text-brand-black">C. BOX PERFORMANCE (VOLUME & COST EFFICIENCY)</h4>
           </div>
           <Card className="bento-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1600px]">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                         <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase">SUPPLIER / MATERIAL</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">VOLUME</th>
                         <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase">COST PER UNIT</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">SPEND (TOTAL)</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">VOL UTIL %</th>
                         <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase">RISK FLAG</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[
                        { name: 'Sinar Printing', mat: 'Box Acne Serum', qty: '5,000 Pcs', unit: '1.2k', spend: '6M', util: '98%', risk: 'LOW' },
                        { name: 'Berkat Alam', mat: 'Box Master Carton', qty: '1,000 Pcs', unit: '8.5k', spend: '8.5M', util: '95%', risk: 'LOW' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                           <td className="px-5 py-4">
                              <p className="text-[13px] font-black text-brand-black">{row.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{row.mat}</p>
                           </td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular">{row.qty}</td>
                           <td className="px-5 py-4 text-right text-xs font-black tabular">Rp {row.unit}</td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular">Rp {row.spend}</td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular text-blue-600">{row.util}</td>
                           <td className="px-5 py-4 text-right">
                              <span className="px-2.5 py-1 rounded-md text-[9px] font-black text-white bg-emerald-500">{row.risk}</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </Card>
        </div>

        {/* D. LABEL PERFORMANCE */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-sm" />
              <h4 className="text-[13px] font-black uppercase tracking-widest text-brand-black">D. LABEL PERFORMANCE (ACCURACY & REVISION FOCUS)</h4>
           </div>
           <Card className="bento-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1600px]">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                         <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase">SUPPLIER / MATERIAL</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">REVISIONS</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">MISPRINT RATE</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">OTD RATE</th>
                         <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase">SCORE</th>
                         <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase">RISK</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[
                        { name: 'Sinar Print', mat: 'Label Glow-Up', rev: '2', mis: '2.5%', otd: '80%', score: '75', risk: 'MEDIUM' },
                        { name: 'Labelindo', mat: 'Label Aqua Pure', rev: '0', mis: '0.1%', otd: '100%', score: '98', risk: 'LOW' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                           <td className="px-5 py-4">
                              <p className="text-[13px] font-black text-brand-black">{row.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{row.mat}</p>
                           </td>
                           <td className={cn("px-5 py-4 text-center text-sm font-black tabular", row.rev !== '0' ? 'text-rose-500' : 'text-emerald-500')}>{row.rev}</td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular text-amber-600">{row.mis}</td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular">{row.otd}</td>
                           <td className="px-5 py-4 text-center text-xs font-black tabular text-brand-black">{row.score}</td>
                           <td className="px-5 py-4 text-right">
                              <span className={cn(
                                "px-2.5 py-1 rounded-md text-[9px] font-black text-white",
                                row.risk === 'LOW' ? 'bg-emerald-500' : 'bg-amber-500'
                              )}>{row.risk}</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </Card>
        </div>
      </div>

      {/* V. VELOCITY & DEMAND AUDIT */}
      <div className="space-y-6 pb-20">
        <h3 className="text-lg font-black text-brand-black border-b-2 border-brand-black inline-block pb-1 uppercase tracking-tighter italic">
          VELOCITY & DEMAND AUDIT (TOP 10 HIGH-FREQUENCY)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* TOP 10 RAW MATERIAL */}
           <Card className="bento-card p-6">
              <div className="flex items-center gap-2 mb-6">
                 <TrendingUp className="w-4 h-4 text-rose-500" />
                 <p className="text-xs font-black text-brand-black uppercase">TOP 10 HIGH-FREQUENCY: RAW MATERIAL</p>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase">MATERIAL NAME</th>
                          <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase">PURCHASE FREQ</th>
                          <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase">AVG CONSUMPTION</th>
                          <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase">TURNOVER</th>
                       </tr>
                    </thead>
                    <tbody>
                       {[
                         { name: 'Niacinamide Alpha', f: '12x/yr', c: '150kg/mo', t: '14d' },
                         { name: 'Hyaluronic Acid 1%', f: '10x/yr', c: '80kg/mo', t: '18d' },
                         { name: 'Retinol K5', f: '8x/yr', c: '12kg/mo', t: '22d' },
                         { name: 'Salicylic Acid', f: '8x/yr', c: '45kg/mo', t: '20d' },
                         { name: 'Glycerin 99%', f: '24x/yr', c: '800kg/mo', t: '7d' },
                       ].map((row, i) => (
                         <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                            <td className="px-4 py-3 text-[11px] font-black text-brand-black">{row.name}</td>
                            <td className="px-4 py-3 text-center text-[11px] font-black text-blue-600 tabular">{row.f}</td>
                            <td className="px-4 py-3 text-right text-[11px] font-black text-brand-black tabular">{row.c}</td>
                            <td className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 tabular">{row.t}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>

           {/* TOP 10 PACKAGING */}
           <Card className="bento-card p-6">
              <div className="flex items-center gap-2 mb-6">
                 <Package className="w-4 h-4 text-amber-500" />
                 <p className="text-xs font-black text-brand-black uppercase">TOP 10 HIGH-FREQUENCY: PACKAGING</p>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase">MATERIAL NAME</th>
                          <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase">PURCHASE FREQ</th>
                          <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase">AVG CONSUMPTION</th>
                          <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase">TURNOVER</th>
                       </tr>
                    </thead>
                    <tbody>
                       {[
                         { name: 'Botol Serum 30ml', f: '12x/yr', c: '15,000 Pcs/mo', t: '15d' },
                         { name: 'Pump Black 20/410', f: '12x/yr', c: '15,000 Pcs/mo', t: '15d' },
                         { name: 'Cap Silver 30ml', f: '6x/yr', c: '10,000 Pcs/mo', t: '30d' },
                         { name: 'Bottle Airless 15ml', f: '4x/yr', c: '5,000 Pcs/mo', t: '45d' },
                         { name: 'Tube 50ml Glossy', f: '8x/yr', c: '8,000 Pcs/mo', t: '25d' },
                       ].map((row, i) => (
                         <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                            <td className="px-4 py-3 text-[11px] font-black text-brand-black">{row.name}</td>
                            <td className="px-4 py-3 text-center text-[11px] font-black text-blue-600 tabular">{row.f}</td>
                            <td className="px-4 py-3 text-right text-[11px] font-black text-brand-black tabular">{row.c}</td>
                            <td className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 tabular">{row.t}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

