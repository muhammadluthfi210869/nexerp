"use client";

import React from "react";
import {
   TrendingUp,
   ShieldAlert,
   Activity,
   Warehouse,
   AlertTriangle,
   Box,
   DollarSign,
   ChevronRight,
   Zap,
   BarChart3,
   Clock,
   Beaker
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WarehouseDashboardClientProps {
   initialStats?: {
      capacity?: { utility?: string; accuracy?: number; fifoScore?: number };
      valuation?: { total?: string; raw?: string; pack?: string; box?: string; label?: string };
      turnover?: { ratio?: number; health?: number };
      risk?: { deadStock?: number; criticalItems?: number; agingKarantina?: number };
   } | null;
   initialAudit?: {
      jalurA?: { inbound?: number; karantina?: number; velocity?: number };
      jalurB?: { reqProd?: number; picking?: number; handover?: number; velocity?: number };
      jalurC?: { orderProc?: number; shipping?: number; delivered?: number; velocity?: number };
      sensitiveMaterials?: Array<{ name: string; date: string; status: string; qty: string }>;
      packagingStocks?: Array<{ name: string; qty: string; status: string }>;
      soFulfillment?: Array<{ client: string; so: string; qty: string; status: string; progress: number; var: number }>;
      riskLoss?: Array<{ item: string; source: string; detail: string; impact: string; action: string }>;
      topRaw?: Array<{ name: string; usage: string; value: string }>;
      topPack?: Array<{ name: string; usage: string; value: string }>;
      productivity?: Array<{ rank?: number; name: string; batch: string; points: number }>;
   } | null;
}

export default function WarehouseDashboardClient({ initialStats, initialAudit }: WarehouseDashboardClientProps) {
   const stats = initialStats || {};
   const audit = initialAudit || {};
   return (
      <div className="p-6 bg-[#fafafa] min-h-screen space-y-6">
         {/* HEADER SECTION */}
         <div className="flex justify-between items-center mb-1">
            <div>
               <h1 className="text-[28px] font-black tracking-tighter uppercase leading-none">
                  <span className="text-brand-black">WHAREHOUSE</span>
                  <span className="text-blue-600 italic ml-2">AUDIT COMMAND</span>
               </h1>
               <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">
                  Zero-Scroll Geometric Audit Protocol v7.0
               </p>
            </div>
            <div className="flex gap-2">
               <Badge className="bg-slate-100 text-brand-black border-none font-black text-[8px] px-3 py-1 rounded-full uppercase tracking-tight shadow-sm">
                  AUTO-SYNC: ACTIVE
               </Badge>
               <Badge className="bg-brand-black text-white border-none font-black text-[8px] px-3 py-1 rounded-full uppercase tracking-tight shadow-lg shadow-black/10">
                  LEVEL: EXECUTIVE
               </Badge>
            </div>
         </div>

         {/* I. EXECUTIVE CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* 1. CAPACITY & ACCURACY */}
            <Card className="rounded-[1.5rem] p-5 border border-slate-100 shadow-sm bg-white flex flex-col justify-between h-[185px]">
               <div className="flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-[8px] font-black text-brand-black uppercase tracking-widest">CAPACITY & ACCURACY</p>
               </div>

               <div className="flex justify-between items-end">
                  <div>
                     <h2 className="text-[28px] font-black text-brand-black tracking-tighter tabular leading-none">{stats.capacity?.utility || '88.4'}%</h2>
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">UTILITAS KAPASITAS</p>
                  </div>
                  <div className="text-right">
                     <h2 className="text-[14px] font-black text-emerald-500 tracking-tighter tabular leading-none">{typeof stats.capacity?.accuracy === 'number' ? stats.capacity.accuracy.toFixed(1) : '99.8'}%</h2>
                     <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">ACCURACY</p>
                  </div>
               </div>

               <div className="mt-auto bg-slate-50/80 p-2 rounded-xl border border-slate-100 flex justify-between items-center text-[8px] font-black tabular">
                  <span className="text-slate-400 uppercase tracking-tighter text-[6.5px]">SKOR FIFO/FEFO</span>
                  <span className="text-blue-600">{stats.capacity?.fifoScore || '9.8'} / 10.0</span>
               </div>
            </Card>

            {/* 2. VALUATION AUDIT (DARK) */}
            <Card className="rounded-[1.5rem] p-5 bg-[#1e293b] text-white flex flex-col justify-between h-[185px] relative overflow-hidden">
               <div className="flex items-center gap-1.5 relative z-10">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">VALUATION AUDIT</p>
               </div>

               <div className="relative z-10 mt-1">
                  <h2 className="text-[28px] font-black text-white tracking-tighter tabular leading-none">Rp {(Number(stats.valuation?.total || '12.50') >= 1000 ? (Number(stats.valuation?.total || '12.50') / 1000).toFixed(2) + ' T' : Number(stats.valuation?.total || '12.50').toFixed(2) + ' B').replace('.', ',')}</h2>
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">TOTAL INVENTORY VALUE</p>
               </div>

               <div className="grid grid-cols-2 gap-x-4 gap-y-1 relative z-10 text-[8px] font-black tabular mt-auto pt-3 border-t border-white/5">
                  <div className="flex justify-between items-center">
                     <span className="text-slate-500 uppercase text-[6px]">RAW</span>
                     <span className="text-white">Rp {(Number(stats.valuation?.raw || '8.5')).toFixed(1)}B</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-500 uppercase text-[6px]">PACK</span>
                     <span className="text-white">Rp {(Number(stats.valuation?.pack || '2.5')).toFixed(1)}B</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-500 uppercase text-[6px]">BOX</span>
                     <span className="text-white">Rp {(Number(stats.valuation?.box || '1.0')).toFixed(1)}B</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-500 uppercase text-[6px]">LABEL</span>
                     <span className="text-white">Rp {(Number(stats.valuation?.label || '0.5')).toFixed(1)}B</span>
                  </div>
               </div>
            </Card>

            {/* 3. TURNOVER & HEALTH */}
            <Card className="rounded-[1.5rem] p-5 border border-slate-100 shadow-sm bg-white flex flex-col justify-between h-[185px]">
               <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  <p className="text-[8px] font-black text-brand-black uppercase tracking-widest">TURNOVER & HEALTH</p>
               </div>

               <div className="flex justify-between items-end mt-1">
                  <div>
                     <h2 className="text-[28px] font-black text-brand-black tracking-tighter tabular leading-none">{stats.turnover?.ratio || '14.2'}<span className="text-[14px]">x</span></h2>
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">TURNOVER RATIO</p>
                  </div>
                  <div className="text-right">
                     <h2 className="text-[22px] font-black text-indigo-600 tracking-tighter tabular leading-none">{stats.turnover?.health || '95'}%</h2>
                     <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mt-1">HEALTH SCORE</p>
                  </div>
               </div>

               <div className="mt-auto space-y-1">
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden flex border border-slate-100">
                     <div className="h-full bg-emerald-500 w-[70%]" />
                     <div className="h-full bg-amber-400 w-[20%]" />
                     <div className="h-full bg-rose-500 w-[10%]" />
                  </div>
                  <div className="flex justify-between text-[6px] font-black text-slate-400 uppercase tracking-widest">
                     <span>70% SEHAT</span>
                     <span>20% MOD</span>
                     <span>10% STAG</span>
                  </div>
               </div>
            </Card>

            {/* 4. RISK ANALYTICS */}
            <Card className="rounded-[1.5rem] p-5 border border-rose-50 shadow-sm bg-rose-50/10 flex flex-col justify-between h-[185px]">
               <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <p className="text-[8px] font-black text-brand-black uppercase tracking-widest">RISK ANALYTICS</p>
               </div>

               <div className="flex justify-between items-start mt-1">
                  <div>
                     <h2 className="text-[20px] font-black text-rose-600 tracking-tighter tabular leading-none">Rp {(stats.risk?.deadStock || 142000000).toLocaleString().replace(/,/g, '.')}</h2>
                     <p className="text-[7px] font-black text-rose-500/60 uppercase tracking-widest mt-1">DEAD STOCK</p>
                  </div>
                  <div className="text-right">
                     <h2 className="text-[20px] font-black text-amber-600 tracking-tighter tabular leading-none">{stats.risk?.criticalItems || '12'} ITEMS</h2>
                     <p className="text-[7px] font-black text-amber-500/60 uppercase tracking-widest mt-1">STOK KRITIS</p>
                  </div>
               </div>

               <div className="mt-auto bg-rose-50 p-2.5 rounded-xl flex justify-between items-center border border-rose-100">
                  <span className="text-[7.5px] font-black text-rose-500 uppercase tracking-widest">AGING KARANTINA (AVG)</span>
                  <span className="text-[12px] font-black text-rose-600 tabular tracking-tighter">{stats.risk?.agingKarantina || '4.2'} HARI</span>
               </div>
            </Card>
         </div>

         {/* II. AUDIT COMMAND MATRIX */}
         <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center px-1">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">II. AUDIT COMMAND MATRIX (TRI-FLOW VELOCITY)</h3>
               <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-emerald-500" />
                     <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">OPTIMAL</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-rose-500" />
                     <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">BOTTLENECK</span>
                  </div>
               </div>
            </div>

            <div className="space-y-2 text-nowrap">
               {/* JALUR A */}
               <div className="flex items-center bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[75px] relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  <div className="pl-6 pr-4 min-w-[160px]">
                     <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-tight leading-none">JALUR MASUK (A)</h4>
                     <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">SUPPLIER & MATS</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-12 px-8">
                     <div className="text-center">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-50">PENERIMAAN</p>
                        <p className="text-[18px] font-black text-brand-black tabular leading-none">{audit.jalurA?.inbound ?? 2}</p>
                     </div>
                     <ChevronRight className="w-3.5 h-3.5 text-slate-100" />
                     <div className="text-center bg-rose-50 px-8 py-2.5 rounded-xl border border-rose-100">
                        <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest mb-1">KARANTINA / QC</p>
                        <p className="text-[18px] font-black text-rose-600 tabular leading-none">{audit.jalurA?.karantina ?? 0}</p>
                     </div>
                  </div>
                  <div className="px-6 text-right min-w-[100px] border-l border-slate-50 flex flex-col justify-center">
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">VELOCITY</p>
                     <p className="text-[18px] font-black text-blue-600 tabular leading-none tracking-tighter">{audit.jalurA?.velocity ?? '8.4'}<span className="text-[9px] text-slate-300 ml-0.5">/10</span></p>
                  </div>
               </div>

               {/* JALUR B */}
               <div className="flex items-center bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[75px] relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                  <div className="pl-6 pr-4 min-w-[160px]">
                     <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-tight leading-none">JALUR INTERNAL (B)</h4>
                     <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">PROD CONSUMPTION</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-10 px-8">
                     <div className="text-center">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-50">REQ PROD</p>
                        <p className="text-[18px] font-black text-brand-black tabular leading-none">{audit.jalurB?.reqProd ?? 0}</p>
                     </div>
                     <ChevronRight className="w-3.5 h-3.5 text-slate-100" />
                     <div className="text-center bg-rose-50 px-8 py-2.5 rounded-xl border border-rose-100">
                        <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest mb-1">PICKING</p>
                        <p className="text-[18px] font-black text-rose-600 tabular leading-none">{audit.jalurB?.picking ?? 4}</p>
                     </div>
                     <ChevronRight className="w-3.5 h-3.5 text-slate-100" />
                     <div className="text-center">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-50">HANDOVER</p>
                        <p className="text-[18px] font-black text-brand-black tabular leading-none">{audit.jalurB?.handover ?? 0}</p>
                     </div>
                  </div>
                  <div className="px-6 text-right min-w-[100px] border-l border-slate-50 flex flex-col justify-center">
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">VELOCITY</p>
                     <p className="text-[18px] font-black text-amber-600 tabular leading-none tracking-tighter">{audit.jalurB?.velocity ?? '4.2'}<span className="text-[9px] text-slate-300 ml-0.5">/10</span></p>
                  </div>
               </div>

               {/* JALUR C */}
               <div className="flex items-center bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[75px] relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                  <div className="pl-6 pr-4 min-w-[160px]">
                     <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-tight leading-none">JALUR KELUAR (C)</h4>
                     <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">SO FULFILLMENT</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-10 px-8">
                     <div className="text-center">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-50">ORDER PROC</p>
                        <p className="text-[18px] font-black text-brand-black tabular leading-none">{audit.jalurC?.orderProc ?? 10}</p>
                     </div>
                     <ChevronRight className="w-3.5 h-3.5 text-slate-100" />
                     <div className="text-center">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-50">SHIPPING</p>
                        <p className="text-[18px] font-black text-brand-black tabular leading-none">{audit.jalurC?.shipping ?? 0}</p>
                     </div>
                     <ChevronRight className="w-3.5 h-3.5 text-slate-100" />
                     <div className="text-center">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-50">DELIVERED</p>
                        <p className="text-[18px] font-black text-brand-black tabular leading-none">{audit.jalurC?.delivered ?? 0}</p>
                     </div>
                  </div>
                  <div className="px-6 text-right min-w-[100px] border-l border-slate-50 flex flex-col justify-center">
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">VELOCITY</p>
                     <p className="text-[18px] font-black text-emerald-600 tabular leading-none tracking-tighter">{audit.jalurC?.velocity ?? '9.1'}<span className="text-[9px] text-slate-300 ml-0.5">/10</span></p>
                  </div>
               </div>
            </div>
         </div>

         {/* III. GRANULAR AUDIT TABLES (QUAD-GRID) */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8">

            {/* III.A AUDIT GRANULAR BAHAN BAKU */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <Beaker className="w-3 h-3 text-indigo-500" />
                  <h3 className="text-[9px] font-black uppercase tracking-tighter text-brand-black italic">III.A AUDIT GRANULAR BAHAN BAKU</h3>
               </div>
               <Card className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                  <div className="overflow-x-auto overflow-y-hidden">
                     <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50/50">
                           <tr>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest">NAMA / MASUK</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">SIMPAN</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">FIS/BK/AV</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {(audit.sensitiveMaterials?.length ? audit.sensitiveMaterials : [
                              { name: 'NIACINAMIDE 99%', date: '12/01/24', status: 'NEEDS_QC', qty: '500' },
                              { name: 'HYALURONIC ACID', date: '12/01/24', status: 'FEFO_OK', qty: '550' },
                              { name: 'VITAMIN C 10%', date: '12/01/24', status: 'FEFO_OK', qty: '600' },
                           ]).map((row: any, i: number) => (
                              <tr key={i}>
                                 <td className="px-4 py-2 text-[9px] font-black">
                                    {row.name} <span className="text-[7px] text-slate-300 font-bold ml-1 italic">{row.date}</span>
                                 </td>
                                 <td className="px-4 py-2 text-[9px] font-black text-center tabular">{row.qty}</td>
                                 <td className="px-4 py-2 text-center">
                                    <span className={cn("px-2 py-0.5 rounded text-[6.5px] font-black uppercase text-white", row.status === 'FEFO_OK' ? "bg-emerald-500" : "bg-amber-500")}>{row.status}</span>
                                 </td>
                                 <td className="px-4 py-2 text-right text-[9px] font-black tabular pr-4">{row.qty}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </div>

            {/* III.B AUDIT GRANULAR BAHAN KEMAS */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <Box className="w-3 h-3 text-orange-500" />
                  <h3 className="text-[9px] font-black uppercase tracking-tighter text-brand-black italic">III.B AUDIT GRANULAR BAHAN KEMAS</h3>
               </div>
               <Card className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                  <div className="overflow-x-auto overflow-y-hidden">
                     <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50/50">
                           <tr>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest">NAMA / MASUK</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">SIMPAN</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">FIS/BK/AV</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {(audit.packagingStocks?.length ? audit.packagingStocks : [
                              { name: 'AIRLESS BOTTLE 30ML', qty: '2500 Pcs', status: 'LOW_STOCK' },
                              { name: 'LIP GLOSS TUBE 5G', qty: '2600 Pcs', status: 'STABLE' },
                              { name: 'MIST SPRAYER 100ML', qty: '2700 Pcs', status: 'STABLE' },
                           ]).map((row: any, i: number) => (
                              <tr key={i}>
                                 <td className="px-4 py-2 text-[9px] font-black">
                                    {row.name} <span className="text-[7px] text-slate-300 font-bold ml-1 italic">{row.date || ''}</span>
                                 </td>
                                 <td className="px-4 py-2 text-[9px] font-black text-center tabular">{row.qty}</td>
                                 <td className="px-4 py-2 text-center">
                                    <span className={cn("px-2 py-0.5 rounded text-[6.5px] font-black uppercase text-white", row.status === 'STABLE' ? "bg-emerald-500" : "bg-rose-500")}>{row.status}</span>
                                 </td>
                                 <td className="px-4 py-2 text-right text-[9px] font-black tabular pr-4">{row.qty}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </div>

            {/* III.C PEMENUHAN PESANAN (SO FULFILLMENT) */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <h3 className="text-[9px] font-black uppercase tracking-tighter text-brand-black italic">III.C SO FULFILLMENT AUDIT</h3>
               </div>
               <Card className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                  <div className="overflow-x-auto overflow-y-hidden">
                     <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50/50">
                           <tr>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest">CLIENT / NO. SO</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">KELENGKAPAN</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">PROGRESS / VAR</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {(audit.soFulfillment?.length ? audit.soFulfillment : [
                              { client: 'PT. GlowUp', so: 'SO-001', qty: '5K/6K Pcs', status: 'PARSIAL', color: 'amber', var: '-1K (83%)' },
                              { client: 'CLIENT_B', so: 'SO-002', qty: '2K/2K Pcs', status: 'FULL', color: 'emerald', var: '0 (100%)' },
                              { client: 'CLIENT_C', so: 'SO-003', qty: '3K/3K Pcs', status: 'FULL', color: 'emerald', var: '0 (100%)' },
                           ]).map((row: any, i: number) => (
                              <tr key={i}>
                                 <td className="px-4 py-2 text-[9px] font-black">
                                    {row.client} <span className="text-[7px] text-slate-300 font-bold ml-1 italic">{row.so}</span>
                                 </td>
                                 <td className="px-4 py-2 text-[9px] font-black text-center tabular">{row.qty}</td>
                                 <td className="px-4 py-2 text-center">
                                    <span className={cn("px-2 py-0.5 rounded text-[6.5px] font-black uppercase text-white", row.status === 'FULL' ? "bg-emerald-500" : "bg-amber-500")}>{row.status}</span>
                                 </td>
                                 <td className="px-4 py-2 text-right text-[9px] font-black tabular pr-4">{row.var || row.progress || ''}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </div>

            {/* III.D AUDIT RISIKO & KERUGIAN */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <h3 className="text-[9px] font-black uppercase tracking-tighter text-brand-black italic">III.D AUDIT RISIKO & KERUGIAN</h3>
               </div>
               <Card className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                  <div className="overflow-x-auto overflow-y-hidden">
                     <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50/50">
                           <tr>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest">ITEM & SUMBER</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest">DETAIL AUDIT</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-right">IMPACT (RP)</th>
                              <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center pr-4">ACTION</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {(audit.riskLoss?.length ? audit.riskLoss : [
                              { item: 'Acne Serum', source: 'REJECT', detail: 'Leak: Inbound', impact: 'Rp 1.2M', action: 'RETURN' },
                              { item: 'Retinol 10%', source: 'EXPIRED', detail: 'Leak: Rack', impact: 'Rp 45M', action: 'DISPOSAL' },
                              { item: 'Day Cream #05', source: 'STAGNAN', detail: 'Leak: Rack', impact: 'Rp 12M', action: 'OFFER' },
                           ]).map((row: any, i: number) => (
                              <tr key={i}>
                                 <td className="px-4 py-2 text-[9px] font-black">
                                    {row.item} <span className="text-[7px] text-rose-400 font-bold ml-1 italic">{row.source}</span>
                                 </td>
                                 <td className="px-4 py-2 text-[8px] font-bold text-slate-600">{row.detail}</td>
                                 <td className="px-4 py-2 text-right text-[9px] font-black text-rose-600 tabular">{row.impact}</td>
                                 <td className="px-4 py-2 text-center pr-4">
                                    <span className="bg-brand-black text-white px-2 py-0.5 rounded text-[6px] font-black uppercase tracking-widest">
                                       {row.action}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </div>
         </div>

         {/* IV & V. PRODUCTIVITY LISTS (2-COL) */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pb-10">
            {/* IV. TOP 10 LIST BAHAN BAKU */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  <h3 className="text-[9px] font-black uppercase tracking-tighter text-brand-black italic">IV. TOP 10 LIST BAHAN BAKU</h3>
               </div>
               <Card className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                  <table className="w-full text-left whitespace-nowrap">
                     <thead className="bg-slate-50/30">
                        <tr>
                           <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest">NAMA BAHAN BAKU</th>
                           <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">PEMAKAIAN</th>
                           <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">NILAI / OMSET</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {(audit.topRaw?.length ? audit.topRaw : [
                           { name: 'NIACINAMIDE 99%', usage: '800 KG', value: 'Rp 12.0 M' },
                           { name: 'HYALURONIC ACID', usage: '950 KG', value: 'Rp 14.5 M' },
                        ]).map((row: any, i: number) => (
                           <tr key={i}>
                              <td className="px-4 py-2 text-[9px] font-black">{row.name}</td>
                              <td className="px-4 py-2 text-[9px] font-black text-center tabular">{row.usage}</td>
                              <td className="px-4 py-2 text-right text-[9px] font-black text-emerald-600 tabular pr-4">{row.value}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </Card>
            </div>

            {/* V. TOP 10 LIST KEMASAN */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <Box className="w-3 h-3 text-indigo-500" />
                  <h3 className="text-[9px] font-black uppercase tracking-tighter text-brand-black italic">V. TOP 10 LIST KEMASAN</h3>
               </div>
               <Card className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                  <table className="w-full text-left whitespace-nowrap">
                     <thead className="bg-slate-50/30">
                        <tr>
                           <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest">NAMA KEMASAN</th>
                           <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">PEMAKAIAN</th>
                           <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">NILAI / OMSET</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {(audit.topPack?.length ? audit.topPack : [
                           { name: 'AIRLESS BOTTLE 30ML', usage: '15000 PCS', value: 'Rp 5.0 M' },
                           { name: 'LIP GLOSS TUBE 5G', usage: '17500 PCS', value: 'Rp 6.2 M' },
                        ]).map((row: any, i: number) => (
                           <tr key={i}>
                              <td className="px-4 py-2 text-[9px] font-black">{row.name}</td>
                              <td className="px-4 py-2 text-[9px] font-black text-center tabular">{row.usage}</td>
                              <td className="px-4 py-2 text-right text-[9px] font-black text-emerald-600 tabular pr-4">{row.value}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </Card>
            </div>
         </div>
      </div>
   );
}

