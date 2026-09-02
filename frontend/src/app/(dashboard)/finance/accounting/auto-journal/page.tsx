"use client";

import React, { useState } from "react";
import { 
  Settings2, 
  History, 
  BookOpen,
  Plus, 
  Save, 
  ShieldCheck,
  Activity,
  GitMerge,
  ChevronDown,
  Building2,
  Lock,
  Zap,
  ArrowRightLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DnaButton, DnaBadge } from "@/components/dna";
import { TableShell } from "@/components/layout/TableShell";

// Static Data from Plan
const STATIC_COA = [
  { "kode": "11111", "nama": "Kas Utama" },
  { "kode": "11112", "nama": "Kas Kecil" },
  { "kode": "11212", "nama": "BCA (2640351589)" },
  { "kode": "11411", "nama": "Piutang Dagang" },
  { "kode": "11412", "nama": "Uang Muka Pembelian" },
  { "kode": "11611", "nama": "Persediaan Bahan Baku" },
  { "kode": "11612", "nama": "Persediaan Bahan Pembantu" },
  { "kode": "11613", "nama": "Persediaan Barang Setengah Jadi" },
  { "kode": "11614", "nama": "Persediaan Barang Jadi" },
  { "kode": "11615", "nama": "Persediaan Kemasan" },
  { "kode": "11616", "nama": "Persediaan Lainnya" },
  { "kode": "21111", "nama": "Hutang Dagang" },
  { "kode": "21113", "nama": "Uang Muka Penjualan" },
  { "kode": "31111", "nama": "Modal Saham" },
  { "kode": "41111", "nama": "Penjualan" },
  { "kode": "41211", "nama": "Retur/Potongan Penjualan" },
  { "kode": "51111", "nama": "HPP" },
  { "kode": "61111", "nama": "Beban Gaji" },
  { "kode": "71111", "nama": "Pendapatan Lain-lain" },
  { "kode": "72111", "nama": "Beban Bunga" }
];

const MAPPING_GROUPS = [
  {
    title: "Purchasing & Liabilities",
    icon: Building2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    items: [
      { id: "coa_1", label: "Hutang Dagang", desc: "CoA hutang dagang saat faktur pembelian", default: "21111" },
      { id: "coa_2", label: "Potongan Pembayaran", desc: "CoA potongan pembayaran saat faktur pembelian", default: "71114" },
      { id: "coa_3", label: "Beban Lainnya", desc: "CoA biaya lainnya saat faktur pembelian", default: "" },
      { id: "coa_4", label: "PPN Masukan", desc: "CoA PPN masukan saat faktur pembelian", default: "" },
      { id: "coa_10", label: "Uang Muka Pembelian", desc: "CoA uang muka pembelian", default: "" }
    ]
  },
  {
    title: "Sales & Receivables",
    icon: ArrowRightLeft,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    items: [
      { id: "coa_7", label: "Piutang Dagang", desc: "CoA piutang dagang saat faktur penjualan", default: "11411" },
      { id: "coa_8", label: "Potongan Penjualan", desc: "CoA potongan penjualan", default: "41211" },
      { id: "coa_9", label: "PPN Keluaran", desc: "CoA PPN keluaran saat faktur penjualan", default: "" },
      { id: "coa_11", label: "Uang Muka Penjualan", desc: "CoA uang muka penjualan", default: "" }
    ]
  },
  {
    title: "Inventory & Logistics",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    items: [
      { id: "coa_5", label: "Koreksi Stok", desc: "CoA lawan persediaan pada stok opname", default: "" },
      { id: "coa_6", label: "Persediaan Dalam Perjalanan", desc: "CoA lawan persediaan saat pengiriman barang", default: "" },
      { id: "coa_12", label: "Selisih Harga Pembelian", desc: "CoA selisih harga saat retur pembelian", default: "" }
    ]
  }
];

export default function AutoJournalConfigPrototype() {
  const [mappings, setMappings] = useState<Record<string, string>>({
    coa_1: "21111",
    coa_2: "71114",
    coa_7: "11411",
    coa_8: "41211"
  });

  const handleUpdateMapping = (id: string, val: string) => {
    setMappings(prev => ({ ...prev, [id]: val }));
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <TableShell
      title="Jurnal"
      titleAccent="Otomatis"
      subtitle="Automated Journal Entry Configuration & Chart of Accounts Mapping Hub"
      actions={
        <div className="flex gap-4">
          <DnaButton 
            variant="outline"
            className="h-14 px-6 border border-slate-200 rounded-2xl"
            icon={<History className="h-4 w-4 text-amber-500" />}
          >
            Audit Log
          </DnaButton>
          <DnaButton 
            variant="primary"
            className="h-14 px-8 bg-blue-600 hover:bg-blue-700 rounded-2xl hover:scale-105"
            icon={<Save className="h-5 w-5 text-blue-400" />}
          >
            Save Configuration
          </DnaButton>
        </div>
      }
    >

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Main Config Area */}
         <div className="lg:col-span-8 space-y-10">
            {MAPPING_GROUPS.map((group, gIdx) => (
              <motion.div 
                key={gIdx}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                 <Card className="rounded-2xl border border-slate-200 shadow-sm p-12 bg-white space-y-10">
                    <div className="flex items-center gap-3">
                       <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm", group.bg, group.color)}>
                          <group.icon className="h-5 w-5" />
                       </div>
                       <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">{group.title} <span className="text-blue-600">Protocol</span></h2>
                    </div>

                    <div className="space-y-8">
                       {group.items.map((item) => (
                         <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center group/item">
                            <div className="md:col-span-4 space-y-1">
                               <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.label}</p>
                               <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed">{item.desc}</p>
                            </div>
                            <div className="md:col-span-8 flex gap-4">
                               <div className="relative flex-1">
                                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                  <select 
                                    value={mappings[item.id] || ""}
                                    onChange={(e) => handleUpdateMapping(item.id, e.target.value)}
                                    className="w-full h-11 pl-12 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] appearance-none focus:ring-2 focus:ring-blue-500 transition-all italic outline-none cursor-pointer"
                                  >
                                     <option value="">— SELECT COA —</option>
                                     {STATIC_COA.map(coa => (
                                       <option key={coa.kode} value={coa.kode}>{coa.kode} — {coa.nama}</option>
                                     ))}
                                  </select>
                                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                                </div>
                                <DnaButton variant="ghost" className="h-11 w-11 p-0 rounded-xl bg-slate-50 text-slate-300 hover:bg-blue-600 hover:text-white transition-all shrink-0" icon={<Plus className="h-5 w-5" />} />
                            </div>
                         </div>
                       ))}
                    </div>
                 </Card>
              </motion.div>
            ))}
         </div>

         {/* Sidebar Stats & Info */}
         <div className="lg:col-span-4 space-y-10">
            <div className="sticky top-10 space-y-10">
               <Card className="rounded-2xl border border-slate-200 shadow-sm p-10 bg-white overflow-hidden relative">
                  <div className="relative z-10 space-y-10">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Configuration Ledger</p>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase mt-2 text-slate-900">Policy <br/> <span className="text-blue-600">Stability</span></h2>
                     </div>

                     <div className="space-y-6 pt-10 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Mappings</p>
                           <p className="text-2xl font-black text-gray-900 tabular-nums">{Object.keys(mappings).length} <span className="text-xs text-slate-400">/ 12</span></p>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(Object.keys(mappings).length / 12) * 100}%` }}
                              className="h-full bg-blue-500" 
                           />
                        </div>
                     </div>

                     <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 flex gap-4 items-start">
                        <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
                        <p className="text-[9px] font-medium text-slate-500 leading-relaxed uppercase">
                           "Automated entries are immutable once posted. Ensure mapping accuracy before finalizing the financial cycle."
                        </p>
                     </div>
                  </div>
                  <Settings2 className="h-48 w-48 text-slate-100/40 absolute -right-12 -bottom-12 rotate-12" />
               </Card>

               <Card className="rounded-2xl border border-slate-200 shadow-sm p-8 bg-white space-y-6">
                  <div className="flex items-center gap-3">
                     <Lock className="h-5 w-5 text-blue-600" />
                     <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900">Access Governance</h3>
                  </div>
                  <div className="space-y-4">
                     {[
                       { user: "Accounting Head", status: "Verified", date: "Just now" },
                       { user: "Audit System", status: "Active", date: "Syncing..." },
                     ].map((user, i) => (
                       <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase text-slate-900">{user.user}</span>
                             <span className="text-[8px] font-medium text-slate-400 uppercase">{user.date}</span>
                          </div>
                          <DnaBadge status="success">{user.status}</DnaBadge>
                       </div>
                     ))}
                  </div>
               </Card>
            </div>
         </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-between items-center px-6 mt-6">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <Activity className="h-4 w-4 text-emerald-500" />
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Protocol 11-COA: Active</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
               <GitMerge className="h-4 w-4 text-blue-600" />
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Sub-ledger Integration Enabled</span>
            </div>
         </div>
         <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">Institutional Grade Financial OS © 2026</p>
      </div>
    </TableShell>
  );
}
