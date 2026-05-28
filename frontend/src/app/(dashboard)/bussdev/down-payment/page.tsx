"use client";

import React, { useState } from "react";
import { 
  Plus, 
  History, 
  Eye, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  Save, 
  Search, 
  Calendar, 
  CreditCard, 
  FileText,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, TableWrapper, DnaInput, DnaButton } from "@/components/dna";

// Static Data from Plan
const STATIC_DP_LIST = [
  { kode: "SDP-001", tanggal: "01/04/2026", no_penjualan: "SO-001", pelanggan: "PT Maju Jaya", kas_bank: "BCA (2640351589)", jumlah_dp: 1000000, terpakai: 500000, sisa: 500000, status: "Sebagian" },
  { kode: "SDP-002", tanggal: "03/04/2026", no_penjualan: "SO-002", pelanggan: "Beauty Hub Indonesia", kas_bank: "Mandiri Corporate", jumlah_dp: 2500000, terpakai: 2500000, sisa: 0, status: "Lunas" },
  { kode: "SDP-003", tanggal: "07/04/2026", no_penjualan: "SO-005", pelanggan: "CV Sejahtera Makmur", kas_bank: "BCA (2640351589)", jumlah_dp: 750000, terpakai: 750000, sisa: 0, status: "Lunas" },
  { kode: "SDP-004", tanggal: "10/04/2026", no_penjualan: "SO-008", pelanggan: "PT Cosmo Indah", kas_bank: "Kas Utama", jumlah_dp: 5000000, terpakai: 2000000, sisa: 3000000, status: "Sebagian" },
  { kode: "SDP-005", tanggal: "15/04/2026", no_penjualan: "SO-012", pelanggan: "UD Sinar Jaya", kas_bank: "BCA (2640351589)", jumlah_dp: 350000, terpakai: 0, sisa: 350000, status: "Pending" },
];

const SO_DATA = {
  "SO-001": { date: "28/03/2026", client: "PT Maju Jaya", items: [
    { type: "Product", name: "Sunscreen SPF 50", netto: "50ml", price: 75000, qty: 100, total: 7500000 },
    { type: "Product", name: "Facial Wash Gentle", netto: "100ml", price: 45000, qty: 100, total: 4500000 }
  ], subtotal: 12000000, discount: 500000, tax: 1265000, grandtotal: 12765000 },
  "SO-005": { date: "05/05/2026", client: "Beauty Hub Indonesia", items: [
    { type: "Product", name: "Moisturizer Gel", netto: "30g", price: 120000, qty: 50, total: 6000000 }
  ], subtotal: 6000000, discount: 0, tax: 660000, grandtotal: 6660000 }
};

export default function SalesDownPaymentPrototype() {
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedSO, setSelectedSO] = useState<string | null>(null);

  return (
    <DashboardShell
      title="DP"
      titleAccent="Penjualan"
      subtitle="Customer advance payments & commercial contract security"
      actions={
        <div className="flex gap-4">
          <DnaButton 
            variant="outline" 
            size="md"
          >
            <History className="mr-2 h-4 w-4 text-amber-500" /> Riwayat
          </DnaButton>
          <DnaButton 
            onClick={() => setView("form")}
            variant="primary"
            size="md"
          >
            <Plus className="mr-2 h-5 w-5" /> Terima DP Baru
          </DnaButton>
        </div>
      }
    >

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Total DP Secured"
                value="Rp 1,000,000"
                subValue="Growth Pipeline"
                icon={<Briefcase />}
              />

              <StatCard
                label="Unused Commitment"
                value="Rp 500,000"
                subValue="Awaiting Sales Fulfillment"
                icon={<AlertCircle />}
              />

              <div className="bg-blue-600 border-none rounded-2xl p-7 shadow-sm transition-all group overflow-hidden relative h-[148px] flex items-center justify-between animate-fade-slide-in text-white">
                <div className="flex justify-between items-center relative z-10 w-full">
                  <div className="space-y-2 flex-1 min-w-0 pr-4">
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.25em]">
                      Contract Security Rate
                    </p>
                    <h3 className="text-[26px] font-black text-white tracking-tight tabular leading-tight italic">
                      100%
                    </h3>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-emerald-400 animate-pulse">
                      <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest">No Default Risk</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white/10 rounded-xl transition-all shadow-sm shrink-0 text-white">
                    <CheckCircle2 className="w-[18px] h-[18px]" />
                  </div>
                </div>
                <CheckCircle2 className="w-[110px] h-[110px] stroke-[0.75px] text-white/10 transition-all duration-700 absolute -bottom-5 -right-5 pointer-events-none select-none z-0" />
              </div>
            </div>

            {/* List Table */}
            <TableWrapper
              filters={
                <div className="flex justify-between items-center bg-white w-full">
                  <div className="w-72">
                    <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search DP or Client..." className="bg-slate-50 border-none rounded-xl text-xs font-medium" />
                  </div>
                  <Button variant="ghost" className="h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-tight text-slate-500">
                    Filter: May 2026
                  </Button>
                </div>
              }
            >
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-4 px-4 text-table-header text-slate-400">DP Identity</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400">SO / Customer</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400">Collection Source</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Amount / Utilized</TableHead>
                    <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                    <TableHead className="py-4 px-4 pr-6 text-table-header text-slate-400 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STATIC_DP_LIST.map((dp, idx) => (
                    <TableRow key={dp.kode} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-all shrink-0">
                            <Briefcase className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{dp.kode}</span>
                            <span className="text-[9px] font-medium text-slate-400 uppercase mt-0.5">{dp.tanggal}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-xs uppercase">{dp.no_penjualan}</span>
                          <span className="text-[10px] font-black text-blue-600 uppercase italic mt-0.5">{dp.pelanggan}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3 text-slate-400" />
                          <span className="text-[11px] font-medium text-slate-600 uppercase">{dp.kas_bank}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-xs tabular-nums">Rp {dp.jumlah_dp.toLocaleString('id-ID')}</span>
                          <span className="text-[9px] font-medium text-emerald-500 uppercase tracking-tighter mt-0.5">Applied: Rp {dp.terpakai.toLocaleString('id-ID')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span className="bg-amber-100 text-amber-700 rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm">
                          {dp.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 pr-6 text-right">
                        <DnaButton variant="ghost" size="sm">
                          Detail
                        </DnaButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>

            {/* Insight Callout */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-6 items-start">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic">💡 Owner Insight: Commercial commitment</p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed uppercase">
                   Securing a Down Payment is the primary defense against order cancellations. 
                    Ensure all <span className="text-blue-600 font-black">SO Above Rp 50M</span> have at least a 30% DP confirmed before production kicks in.
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-6xl mx-auto space-y-10 pb-20"
          >
            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                onClick={() => setView("list")}
                className="group hover:bg-white rounded-2xl p-2 pr-4 transition-all"
              >
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-200 group-hover:text-slate-900 transition-all">
                  <ChevronLeft className="h-5 w-5" />
                </div>
                <span className="ml-3 font-black uppercase text-[10px] tracking-widest text-slate-400 group-hover:text-slate-900 transition-all">Abort Collection</span>
              </Button>
              <div className="flex items-center gap-3">
                 <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: selectedSO ? "100%" : "30%" }} className="h-full bg-blue-600" />
                 </div>
                 <span className="text-[10px] font-black uppercase text-slate-400">Step {selectedSO ? "2" : "1"} of 2</span>
              </div>
            </div>

            {/* Form Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-8 space-y-8">
                      <Card className="rounded-2xl border-none shadow-sm p-10 bg-white space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <ShoppingCart className="h-3 w-3" /> Select Sales Order
                      </label>
                      <div className="relative">
                        <select 
                          onChange={(e) => setSelectedSO(e.target.value)}
                          className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 font-black uppercase text-sm italic appearance-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="">— SELECT PENDING SALES ORDER —</option>
                          <option value="SO-001">SO-001 | PT Maju Jaya</option>
                          <option value="SO-005">SO-005 | Beauty Hub Indonesia</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ArrowRight className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedSO && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-8 border-t border-slate-100 space-y-8 overflow-hidden"
                        >
                          <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase">SO Origin</p>
                              <p className="font-black text-slate-900 text-sm italic uppercase">{selectedSO}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase">Issue Date</p>
                              <p className="font-black text-slate-900 text-sm uppercase">{SO_DATA[selectedSO as keyof typeof SO_DATA].date}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase">Debtor / Client</p>
                              <p className="font-black text-blue-600 text-sm uppercase italic">{SO_DATA[selectedSO as keyof typeof SO_DATA].client}</p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-100 overflow-hidden">
                            <Table>
                              <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-200">
                                  <TableHead className="text-[9px] font-black uppercase text-slate-400 pl-8">Commercial Product</TableHead>
                                  <TableHead className="text-[9px] font-black uppercase text-slate-400 text-center">Qty</TableHead>
                                  <TableHead className="text-[9px] font-black uppercase text-slate-400 text-right pr-8">Valuation</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {SO_DATA[selectedSO as keyof typeof SO_DATA].items.map((item, i) => (
                                  <TableRow key={i} className="hover:bg-transparent border-slate-50">
                                    <TableCell className="pl-8">
                                       <div className="flex flex-col">
                                           <span className="font-medium text-slate-900 text-xs uppercase">{item.name}</span>
                                          <span className="text-[9px] font-black text-slate-400 uppercase">{item.netto}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-center font-black text-slate-900 tabular-nums">{item.qty}</TableCell>
                                    <TableCell className="text-right pr-8 font-black text-slate-900 tabular-nums">Rp {item.total.toLocaleString('id-ID')}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>

                  {selectedSO && (
                    <Card className="rounded-2xl border-none shadow-sm p-10 bg-white space-y-10">
                       <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900">Secure <span className="text-blue-600">Customer Funds</span></h2>
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collection Date</label>
                            <DnaInput type="date" icon={<Calendar className="h-4 w-4" />} className="h-14 bg-slate-50 border-none rounded-2xl font-black uppercase text-xs" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Vault</label>
                            <div className="relative">
                              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <select className="w-full h-14 pl-12 bg-slate-50 border-none rounded-2xl font-black uppercase text-xs appearance-none">
                                 <option>BCA Business (2640...)</option>
                                 <option>Mandiri Corporate</option>
                                 <option>Main Cash Ledger</option>
                              </select>
                            </div>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Committed (IDR)</label>
                           <DnaInput type="number" icon={<span className="font-black text-slate-400">Rp</span>} placeholder="0.00" className="h-20 bg-slate-100 text-slate-900 border-none rounded-2xl text-2xl font-black tabular-nums" />
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collection Remarks</label>
                          <textarea 
                            rows={3}
                            placeholder="Add commercial context or payment reference..."
                            className="w-full p-6 bg-slate-50 border-none rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                       </div>

                       <Button 
                          className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-sm font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02]"
                       >
                         <Save className="mr-3 h-5 w-5" /> Commit Advance Payment
                       </Button>
                    </Card>
                  )}
               </div>

               {/* Summary Panel */}
               <div className="lg:col-span-4">
                  <div className="sticky top-10 space-y-8">
                      <Card className="rounded-2xl border border-slate-200 shadow-sm p-10 bg-white text-slate-900 overflow-hidden relative">
                        <div className="relative z-10 space-y-8">
                           <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Order Valuation</p>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase mt-2 text-slate-900">Revenue <span className="text-blue-600">Gate</span></h2>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-slate-200 font-black uppercase text-[10px]">
                               <div className="flex justify-between items-center">
                                   <span className="text-slate-500">Sub Total</span>
                                    <span className="tabular-nums text-slate-900">Rp {selectedSO ? SO_DATA[selectedSO as keyof typeof SO_DATA].subtotal.toLocaleString('id-ID') : "0"}</span>
                                </div>
                                <div className="flex justify-between items-center text-rose-500">
                                    <span className="text-slate-500">Discount Applied</span>
                                    <span className="tabular-nums text-slate-900">- Rp {selectedSO ? SO_DATA[selectedSO as keyof typeof SO_DATA].discount.toLocaleString('id-ID') : "0"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Tax Protocol (11%)</span>
                                    <span className="tabular-nums text-slate-900">Rp {selectedSO ? SO_DATA[selectedSO as keyof typeof SO_DATA].tax.toLocaleString('id-ID') : "0"}</span>
                                </div>
                                 <div className="flex justify-between items-center pt-4 border-t border-slate-300 text-blue-600">
                                   <span className="tracking-widest">Grand Total</span>
                                    <span className="text-2xl text-slate-900 tabular-nums">Rp {selectedSO ? SO_DATA[selectedSO as keyof typeof SO_DATA].grandtotal.toLocaleString('id-ID') : "0"}</span>
                               </div>
                            </div>
                        </div>
                         <FileText className="h-48 w-48 text-black/5 absolute -right-12 -bottom-12 rotate-12" />
                      </Card>

                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 space-y-4">
                          <div className="flex items-center gap-3 text-blue-600">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Policy Verification</span>
                          </div>
                          <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase">
                            Advance payments must match the bank statement balance exactly. Cross-check client identity for tax compliance.
                          </p>
                      </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
