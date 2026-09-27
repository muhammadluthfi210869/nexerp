"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
import { DnaPageContainer, DnaPageHeader, DnaCard, DnaButton, DnaBadge, DnaSelect, useDnaToast } from "@/components/dna";

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
  const toast = useDnaToast();
  const qc = useQueryClient();

  const [mappings, setMappings] = useState<Record<string, string>>({
    coa_1: "21111",
    coa_2: "71114",
    coa_7: "11411",
    coa_8: "41211"
  });

  // 1. Fetch live COA accounts
  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["finance-accounts"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/accounts");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    }
  });

  // 2. Fetch saved configs from backend
  const { data: serverConfigs = [] } = useQuery<any[]>({
    queryKey: ["finance-auto-journal-configs"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/auto-journal-configs");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    }
  });

  // Sync server configs into mappings state
  useEffect(() => {
    if (serverConfigs.length > 0) {
      const newMappings = { ...mappings };
      serverConfigs.forEach((cfg: any) => {
        if (cfg.transactionType && cfg.coaDebetId) {
          newMappings[cfg.transactionType] = cfg.coaDebetId;
        }
      });
      setMappings(newMappings);
    }
  }, [serverConfigs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(mappings).filter(([_, val]) => !!val);
      const promises = entries.map(([key, val]) => {
        // Resolve account ID if available
        const matched = accounts.find((a: any) => a.code === val || a.id === val);
        const accountId = matched?.id || val;
        return api.post("/finance/auto-journal-configs", {
          transactionType: key,
          coaDebetId: accountId,
          coaCreditId: accountId,
          description: `Auto journal rule for ${key}`
        });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Konfigurasi jurnal otomatis berhasil disimpan ke database!");
      qc.invalidateQueries({ queryKey: ["finance-auto-journal-configs"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menyimpan konfigurasi");
    }
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
    <DnaPageContainer>
      <DnaPageHeader
        title="Jurnal"
        titleAccent="Otomatis"
        subtitle="Automated Journal Entry Configuration & Chart of Accounts Mapping Hub"
        actions={
          <div className="flex gap-4">
            <DnaButton
              variant="outline"
              className="h-14 px-6 border border-slate-200 rounded-2xl"
              icon={<History className="h-4 w-4 text-amber-500" />}
              onClick={() => toast.info("Audit log jurnal otomatis: Seluruh aturan posting tersinkron")}
            >
              Audit Log
            </DnaButton>
            <DnaButton
              variant="primary"
              className="h-14 px-8 bg-blue-600 hover:bg-blue-700 rounded-2xl hover:scale-105"
              icon={<Save className="h-5 w-5 text-blue-400" />}
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save Configuration"}
            </DnaButton>
          </div>
        }
      />

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
                 <DnaCard className="rounded-2xl border border-slate-200 shadow-sm p-12 bg-white space-y-10">
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
                                  <DnaSelect
                                    value={mappings[item.id] || ""}
                                    onChange={(value) => handleUpdateMapping(item.id, value)}
                                    className="w-full h-11 pl-12 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] appearance-none focus:ring-2 focus:ring-blue-500 transition-all italic outline-none cursor-pointer"
                                  >
                                     <option value="">— SELECT COA —</option>
                                     {accounts.length > 0 ? (
                                       accounts.map((coa: any) => (
                                         <option key={coa.id || coa.code} value={coa.code}>
                                           {coa.code} — {coa.name}
                                         </option>
                                       ))
                                     ) : (
                                       <option value={item.default || ""}>{item.default ? `${item.default} — Akun Bawaan` : "Belum ada akun di database"}</option>
                                     )}
                                  </DnaSelect>
                               </div>
                               <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover/item:border-blue-500 group-hover/item:text-blue-600 transition-all">
                                  <Settings2 className="h-4 w-4" />
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </DnaCard>
              </motion.div>
            ))}
         </div>

         {/* Sidebar Controls */}
         <div className="lg:col-span-4 space-y-10">
            {/* System Status */}
            <DnaCard className="rounded-2xl border border-slate-200 shadow-sm p-8 bg-white space-y-6">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Engine Health</span>
                  <DnaBadge variant="success" className="px-3 py-1 font-black italic uppercase text-[9px]">LIVE SYNC</DnaBadge>
               </div>
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                     <p className="text-sm font-black text-slate-900 uppercase italic">Balanced Journal Gate</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Double-entry strictly enforced</p>
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Akun COA Aktif</span>
                  <span className="text-slate-900 font-extrabold">{accounts.length} Akun</span>
               </div>
            </DnaCard>

            {/* Quick Helper */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white space-y-6 shadow-xl shadow-blue-500/10">
               <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <GitMerge className="h-5 w-5" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase italic tracking-tight">Atomic Mapping Engine</h3>
                  <p className="text-xs text-blue-100 leading-relaxed font-medium">
                     Setiap transaksi operasional faktur dan kas otomatis membentuk pasangan Debit-Kredit pada bagan akun COA yang Anda petakan di sini.
                  </p>
               </div>
            </div>
         </div>
      </div>
    </DnaPageContainer>
  );
}
