"use client";

import React from "react";
import {
   TrendingUp,
   ShieldAlert,
   AlertTriangle,
   Box,
   DollarSign,
   ChevronRight,
   Zap,
   Clock,
   Beaker,
   Warehouse,
   Target,
   Layers,
   RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/dna/KpiCard";
import { DnaBadge } from "@/components/dna/DnaBadge";

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
      <div className="flex flex-col gap-[2rem]">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
               label="CAPACITY"
               value={`${stats.capacity?.utility || '0'}%`}
               targetPct={Number(stats.capacity?.utility) || 0}
               subValue="Space Utilization"
               icon={<Warehouse className="w-4 h-4" />}
            />
            <KpiCard
               label="ACCURACY"
               value={`${typeof stats.capacity?.accuracy === 'number' ? stats.capacity.accuracy.toFixed(1) : '0'}%`}
               targetPct={stats.capacity?.accuracy || 0}
               icon={<Target className="w-4 h-4" />}
            />
            <KpiCard
               label="FIFA SCORE"
               value={`${stats.capacity?.fifoScore || '0.0'}/10`}
               targetPct={(Number(stats.capacity?.fifoScore) || 0) * 10}
               icon={<Layers className="w-4 h-4" />}
            />
            <KpiCard
               label="VALUATION AUDIT"
               value={`Rp ${(Number(stats.valuation?.total || 0) >= 1000 ? (Number(stats.valuation?.total || 0) / 1000).toFixed(2) + ' T' : Number(stats.valuation?.total || 0).toFixed(2) + ' B').replace('.', ',')}`}
               targetPct={50}
               subValue="Total Inventory Value"
               icon={<DollarSign className="w-4 h-4" />}
            />
            <KpiCard
               label="TURNOVER"
               value={`${stats.turnover?.ratio || '0'}x`}
               targetPct={stats.turnover?.health || 0}
               subValue={`Health ${stats.turnover?.health || 0}%`}
               icon={<RefreshCw className="w-4 h-4" />}
            />
            <KpiCard
               label="RISK"
               value={`${stats.risk?.criticalItems || 0}`}
               targetPct={(stats.risk?.criticalItems ?? 0) === 0 ? 100 : 0}
               subValue="Items Critical"
               icon={<ShieldAlert className="w-4 h-4" />}
            />
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
                        <p className="text-[18px] font-black text-brand-black tabular leading-none">{audit.jalurA?.inbound ?? 0}</p>
                     </div>
                     <ChevronRight className="w-3.5 h-3.5 text-slate-100" />
                     <div className="text-center bg-rose-50 px-8 py-2.5 rounded-xl border border-rose-100">
                        <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest mb-1">KARANTINA / QC</p>
                        <p className="text-[18px] font-black text-rose-600 tabular leading-none">{audit.jalurA?.karantina ?? 0}</p>
                     </div>
                  </div>
                  <div className="px-6 text-right min-w-[100px] border-l border-slate-50 flex flex-col justify-center">
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">VELOCITY</p>
                     <p className="text-[18px] font-black text-blue-600 tabular leading-none tracking-tighter">{audit.jalurA?.velocity ?? 0}<span className="text-[9px] text-slate-300 ml-0.5">/10</span></p>
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
                        <p className="text-[18px] font-black text-rose-600 tabular leading-none">{audit.jalurB?.picking ?? 0}</p>
                     </div>
                     <ChevronRight className="w-3.5 h-3.5 text-slate-100" />
                     <div className="text-center">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-50">HANDOVER</p>
                        <p className="text-[18px] font-black text-brand-black tabular leading-none">{audit.jalurB?.handover ?? 0}</p>
                     </div>
                  </div>
                  <div className="px-6 text-right min-w-[100px] border-l border-slate-50 flex flex-col justify-center">
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">VELOCITY</p>
                     <p className="text-[18px] font-black text-amber-600 tabular leading-none tracking-tighter">{audit.jalurB?.velocity ?? 0}<span className="text-[9px] text-slate-300 ml-0.5">/10</span></p>
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
                        <p className="text-[18px] font-black text-brand-black tabular leading-none">{audit.jalurC?.orderProc ?? 0}</p>
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
                     <p className="text-[18px] font-black text-emerald-600 tabular leading-none tracking-tighter">{audit.jalurC?.velocity ?? 0}<span className="text-[9px] text-slate-300 ml-0.5">/10</span></p>
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
                              <th className="px-4 py-2 text-table-header text-slate-400">NAMA / MASUK</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-center">SIMPAN</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-center">STATUS</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-right pr-4">FIS/BK/AV</th>
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
                                    <DnaBadge status={row.status === 'FEFO_OK' ? 'success' : 'warning'}>{row.status}</DnaBadge>
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
                              <th className="px-4 py-2 text-table-header text-slate-400">NAMA / MASUK</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-center">SIMPAN</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-center">STATUS</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-right pr-4">FIS/BK/AV</th>
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
                                    <DnaBadge status={row.status === 'STABLE' ? 'success' : 'critical'}>{row.status}</DnaBadge>
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
                              <th className="px-4 py-2 text-table-header text-slate-400">CLIENT / NO. SO</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-center">KELENGKAPAN</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-center">STATUS</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-right pr-4">PROGRESS / VAR</th>
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
                                    <DnaBadge status={row.status === 'FULL' ? 'success' : 'warning'}>{row.status}</DnaBadge>
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
                              <th className="px-4 py-2 text-table-header text-slate-400">ITEM & SUMBER</th>
                              <th className="px-4 py-2 text-table-header text-slate-400">DETAIL AUDIT</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-right">IMPACT (RP)</th>
                              <th className="px-4 py-2 text-table-header text-slate-400 text-center pr-4">ACTION</th>
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
                                     <DnaBadge status="default">
                                        {row.action}
                                     </DnaBadge>
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
                           <th className="px-4 py-2 text-table-header text-slate-400">NAMA BAHAN BAKU</th>
                           <th className="px-4 py-2 text-table-header text-slate-400 text-center">PEMAKAIAN</th>
                           <th className="px-4 py-2 text-table-header text-slate-400 text-right pr-4">NILAI / OMSET</th>
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
                           <th className="px-4 py-2 text-table-header text-slate-400">NAMA KEMASAN</th>
                           <th className="px-4 py-2 text-table-header text-slate-400 text-center">PEMAKAIAN</th>
                           <th className="px-4 py-2 text-table-header text-slate-400 text-right pr-4">NILAI / OMSET</th>
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

