"use client";

import React from "react";
import {
   BarChart3,
   ShieldAlert,
   Wallet,
   DollarSign,
   Factory,
   AlertTriangle,
   RefreshCw
} from "lucide-react";
import { KpiCard } from "@/components/dna/KpiCard";

export default function ExecutiveDashboardClient() {
   return (
      <div className="min-h-screen space-y-[var(--section-gap)]">

         {/* SYSTEM ALERT BAR - INTEGRATED */}
         <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[24px] p-4 flex items-center gap-6 shadow-sm">
            <div className="flex items-center gap-2 bg-white py-1.5 px-3.5 rounded-full border border-[#FECDD3] shadow-sm">
               <div className="w-5 h-5 rounded-full bg-[#DC2626] flex items-center justify-center text-white shrink-0">
                  <ShieldAlert className="w-3 h-3" />
               </div>
               <span className="text-[10px] font-black text-[#DC2626] tracking-wider uppercase">SYSTEM ALERT</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-800 tracking-tight uppercase">
                     <span className="text-[#DC2626] font-black">5 ORDER</span> TELAT PRODUKSI
                  </p>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-800 tracking-tight uppercase">
                     <span className="text-[#DC2626] font-black">12 CLIENT</span> BELUM BAYAR (OVERDUE)
                  </p>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-800 tracking-tight uppercase">
                     <span className="text-[#F59E0B] font-black">20 LEADS</span> BELUM FOLLOW UP
                  </p>
               </div>
            </div>
         </div>

         {/* 3 COLUMN GRID - TWO ROWS */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

            {/* CARD 1: REVENUE & TARGET */}
            <div className="space-y-4">
               <KpiCard
                  label="REVENUE & TARGET"
                  value="Rp 3.24 M"
                  targetPct={72}
                  subValue="MTD OMSET"
                  icon={<DollarSign className="w-4 h-4" />}
               />
               <div className="bg-[#E8F8F5] border border-[#C2F0E5] rounded-[16px] p-4 flex gap-3 items-start">
                  <span className="text-emerald-600 text-sm shrink-0">&#x1F4A1;</span>
                  <div>
                     <p className="text-[9px] font-black text-emerald-800 uppercase tracking-wide">OWNER INSIGHT:</p>
                     <p className="text-[10px] text-emerald-700 font-medium leading-relaxed mt-1">
                        Kita <span className="font-bold">tertinggal Rp 350jt</span> dari proyeksi target ideal. Perlu push deal di minggu terakhir.
                     </p>
                  </div>
               </div>
            </div>

            {/* CARD 2: SALES PIPELINE */}
            <div className="space-y-4">
               <KpiCard
                  label="SALES PIPELINE"
                  value="Rp 8.4 M"
                  targetPct={50}
                  icon={<BarChart3 className="w-4 h-4" />}
               />
               <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-[16px] p-4 flex gap-3 items-start">
                  <span className="text-[#1E40AF] text-sm shrink-0">&#x1F4A1;</span>
                  <div>
                     <p className="text-[9px] font-black text-[#1E40AF] uppercase tracking-wide">OWNER INSIGHT:</p>
                     <p className="text-[10px] text-[#1E40AF]/80 font-medium leading-relaxed mt-1">
                        Conversion rate <span className="font-bold">turun ke 8.4%</span>. Bottleneck utama ada di tahap <span className="font-bold">Sample Approval (rata-rata 18 hari)</span>.
                     </p>
                  </div>
               </div>
            </div>

            {/* CARD 3: PRODUCTION STATUS */}
            <div className="space-y-4">
               <KpiCard
                  label="PRODUCTION STATUS"
                  value="32/48"
                  targetPct={Math.round((32 / 48) * 100)}
                  subValue="On Prod / Total Active"
                  icon={<Factory className="w-4 h-4" />}
               />
               <div className="bg-[#FEF9C3] border border-[#FEF08A] rounded-[16px] p-4 flex gap-3 items-start">
                  <span className="text-[#854D0E] text-sm shrink-0">&#x1F4A1;</span>
                  <div>
                     <p className="text-[9px] font-black text-[#854D0E] uppercase tracking-wide">OWNER INSIGHT:</p>
                     <p className="text-[10px] text-[#854D0E] font-medium leading-relaxed mt-1">
                        Kapasitas produksi sisa <span className="font-bold">15%</span>. Perlu manajemen shift tambahan untuk <span className="font-bold">5 order yang overdue</span>.
                     </p>
                  </div>
               </div>
            </div>

            {/* CARD 4: CASHFLOW & PAYMENT */}
            <div className="space-y-4">
               <KpiCard
                  label="CASHFLOW & PAYMENT"
                  value="Rp 1.18 M"
                  targetPct={50}
                  subValue="Cash In (MTD)"
                  icon={<Wallet className="w-4 h-4" />}
               />
               <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-[16px] p-4 flex gap-3 items-start">
                  <span className="text-[#6D28D9] text-sm shrink-0">&#x1F4A1;</span>
                  <div>
                     <p className="text-[9px] font-black text-[#6D28D9] uppercase tracking-wide">OWNER INSIGHT:</p>
                     <p className="text-[10px] text-[#6D28D9] font-medium leading-relaxed mt-1">
                        Uang nyangkut di <span className="font-bold">Piutang &gt;60 hari</span> sebesar <span className="font-bold">Rp 120jt</span>. Tim Finance harus <span className="font-bold">prioritaskan penagihan ke 5 klien teratas</span>.
                     </p>
                  </div>
               </div>
            </div>

            {/* CARD 5: LOST & PROBLEMS */}
            <div className="space-y-4">
               <KpiCard
                  label="LOST & PROBLEMS"
                  value="Rp 1.12 M"
                  targetPct={80}
                  subValue="Lost < 20% Pipeline"
                  icon={<AlertTriangle className="w-4 h-4" />}
               />
               <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[16px] p-4 flex gap-3 items-start">
                  <span className="text-rose-600 text-sm shrink-0">&#x1F4A1;</span>
                  <div>
                     <p className="text-[9px] font-black text-rose-800 uppercase tracking-wide">OWNER INSIGHT:</p>
                     <p className="text-[10px] text-rose-700 font-medium leading-relaxed mt-1">
                        Kita kalah di <span className="font-bold">Pricing</span>. Analisa kompetitor menunjukkan harga kita <span className="font-bold">lebih tinggi 15%</span> di segmen <span className="font-bold">skincare serum</span>.
                     </p>
                  </div>
               </div>
            </div>

            {/* CARD 6: REPEAT ORDER ENGINE */}
            <div className="space-y-4">
               <KpiCard
                  label="REPEAT ORDER ENGINE"
                  value="68.5%"
                  targetPct={68}
                  subValue="Repeat Rate"
                  icon={<RefreshCw className="w-4 h-4" />}
               />
               <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-[16px] p-4 flex gap-3 items-start">
                  <span className="text-emerald-600 text-sm shrink-0">&#x1F4A1;</span>
                  <div>
                     <p className="text-[9px] font-black text-emerald-800 uppercase tracking-wide">OWNER INSIGHT:</p>
                     <p className="text-[10px] text-emerald-700 font-medium leading-relaxed mt-1">
                        <span className="font-bold">Mesin RO sehat</span>. <span className="font-bold">65% Revenue</span> kita berasal dari client lama. Fokus di <span className="font-bold">customer retention sangat berhasil</span>.
                     </p>
                  </div>
               </div>
            </div>

         </div>
      </div>
   );
}
