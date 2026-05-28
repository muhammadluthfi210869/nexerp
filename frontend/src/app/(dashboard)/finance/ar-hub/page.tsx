"use client";

import React, { useState } from "react";
import { 
  CircleDollarSign, 
  Eye, 
  Search, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Wallet, 
  X, 
  TrendingUp, 
  Package, 
  FlaskConical, 
  ArrowUpRight,
  ShieldCheck,
  History,
  FileIcon,
  MoreHorizontal,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { DnaInput, DnaButton, DnaBadge, StatCard, TableWrapper } from "@/components/dna";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";

// Static Data from Plan
const STATIC_SALES_INVOICES = [
  { kode_faktur: "SI-001", kode_do: "DO-001", kode_so: "SO-001", tanggal: "01/04/2026", pelanggan: "PT Maju Jaya", grand_total: 15000000, dibayar: 10000000, sisa: 5000000, status: "Belum Lunas" },
  { kode_faktur: "SI-002", kode_do: "DO-002", kode_so: "SO-002", tanggal: "03/04/2026", pelanggan: "CV Sejahtera", grand_total: 7500000, dibayar: 7500000, sisa: 0, status: "Lunas" },
  { kode_faktur: "SI-003", kode_do: "DO-003", kode_so: "SO-005", tanggal: "07/04/2026", pelanggan: "Beauty Hub Indonesia", grand_total: 22500000, dibayar: 10000000, sisa: 12500000, status: "Belum Lunas" },
  { kode_faktur: "SI-004", kode_do: "DO-004", kode_so: "SO-008", tanggal: "10/04/2026", pelanggan: "PT Cosmo Indah", grand_total: 18000000, dibayar: 18000000, sisa: 0, status: "Lunas" },
  { kode_faktur: "SI-005", kode_do: "DO-005", kode_so: "SO-012", tanggal: "14/04/2026", pelanggan: "UD Sinar Jaya", grand_total: 5000000, dibayar: 0, sisa: 5000000, status: "Belum Lunas" },
];

const STATIC_SAMPLE_INVOICES = [
  { kode_faktur: "SSI-001", kode_sample: "SS-001", tanggal: "02/04/2026", pelanggan: "UD Baru", produk: "Hair Mask Dandruff Solution", grand_total: 500000, dibayar: 250000, sisa: 250000, status: "Belum Lunas" },
  { kode_faktur: "SSI-002", kode_sample: "SS-003", tanggal: "06/04/2026", pelanggan: "Beauty Hub Indonesia", produk: "Sunscreen Stick SPF 50", grand_total: 750000, dibayar: 750000, sisa: 0, status: "Lunas" },
  { kode_faktur: "SSI-003", kode_sample: "SS-005", tanggal: "12/04/2026", pelanggan: "UD Sinar Jaya", produk: "Hand Body Lotion 250ml", grand_total: 425000, dibayar: 0, sisa: 425000, status: "Belum Lunas" },
];

export default function ARHubPrototype() {
  const [activeTab, setActiveTab] = useState("products");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  return (
    <DashboardShell
      title="PENERIMAAN"
      titleAccent="PIUTANG"
      subtitle="Enterprise Revenue Recognition & Collection Control"
      actions={
        <div className="flex gap-4">
          <DnaButton 
            variant="outline"
            className="h-12 px-6 rounded-2xl uppercase tracking-tight text-[10px]"
          >
            <History className="mr-2 h-4 w-4 text-amber-500" /> Riwayat
          </DnaButton>
          <DnaButton 
            variant="primary"
            className="h-12 px-8 rounded-2xl tracking-tighter text-sm transition-all hover:scale-105"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Validasi
          </DnaButton>
        </div>
      }
    >
      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total Receivables"
          value="Rp 125.4M"
          subValue="+12.5% MTD"
          icon={<TrendingUp className="text-blue-600" />}
        />
        <StatCard
          label="Overdue (30+ Days)"
          value="Rp 12.0M"
          subValue="Risk Profile: Low"
          icon={<CreditCard className="text-rose-600" />}
        />
        <StatCard
          label="Collections (MTD)"
          value="Rp 89.2M"
          subValue="70% Target Completion"
          icon={<Wallet className="text-emerald-500" />}
        />
        <StatCard
          label="Sample Revenue"
          value="Rp 2.4M"
          subValue="R&D Commitment"
          icon={<FlaskConical className="text-amber-500" />}
        />
      </div>

      {/* Main Content Area */}
      <Tabs defaultValue="products" onValueChange={setActiveTab} className="w-full mt-6">
        <TableWrapper
          filters={
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
              <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100">
                <TabsTrigger value="products" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all">
                  <Package className="mr-2 h-4 w-4" /> Regular Products
                </TabsTrigger>
                <TabsTrigger value="samples" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all">
                  <FlaskConical className="mr-2 h-4 w-4" /> R&D Samples
                </TabsTrigger>
                <TabsTrigger value="returns" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all">
                  <RotateCcw className="mr-2 h-4 w-4" /> Retur
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-4 items-center">
                <div className="relative w-64">
                  <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search Ledger..." className="bg-slate-50 border-none rounded-xl text-xs" />
                </div>
                <DnaButton variant="outline" className="h-11 w-11 p-0 rounded-xl bg-slate-50 text-slate-400">
                  <MoreHorizontal className="h-5 w-5" />
                </DnaButton>
              </div>
            </div>
          }
        >
          <TabsContent value="products" className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Faktur Identity</TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">SO / Client</TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">DO Reference</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Valuation</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Outstanding</TableHead>
                  <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
                  <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STATIC_SALES_INVOICES.map((inv) => (
                  <TableRow key={inv.kode_faktur} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <FileIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                          <span className="text-[9px] font-medium text-slate-400 uppercase">{inv.tanggal}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-[11px] uppercase">{inv.kode_so}</span>
                        <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.pelanggan}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm bg-slate-100 text-slate-600">{inv.kode_do}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-4 text-slate-900 text-xs font-black">
                      Rp {inv.grand_total.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-4 text-rose-600 text-xs font-black">
                      Rp {inv.sisa.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <DnaBadge status={inv.status === "Lunas" ? "success" : "critical"}>
                        {inv.status}
                      </DnaBadge>
                    </TableCell>
                    <TableCell className="pr-6 text-right py-4">
                      <div className="flex justify-end gap-2">
                        <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">
                          <Eye className="h-3.5 w-3.5" />
                        </DnaButton>
                        {inv.sisa > 0 && (
                          <DnaButton 
                            onClick={() => openPaymentModal(inv)}
                            variant="primary"
                            className="h-8 px-4 rounded-lg text-[8px] tracking-widest shadow-sm transition-all hover:scale-105 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Collect
                          </DnaButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="samples" className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Sample Identity</TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pelanggan / Produk</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Valuation</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Outstanding</TableHead>
                  <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
                  <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STATIC_SAMPLE_INVOICES.map((inv) => (
                  <TableRow key={inv.kode_faktur} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <FlaskConical className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                          <span className="text-[9px] font-medium text-slate-400 uppercase">Ref: {inv.kode_sample}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-[11px] uppercase">{inv.pelanggan}</span>
                        <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.produk}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-4 text-slate-900 text-xs font-black">
                      Rp {inv.grand_total.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-4 text-rose-600 text-xs font-black">
                      Rp {inv.sisa.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <DnaBadge status={inv.status === "Lunas" ? "success" : "critical"}>
                        {inv.status}
                      </DnaBadge>
                    </TableCell>
                    <TableCell className="pr-6 text-right py-4">
                      <div className="flex justify-end gap-2">
                        <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">
                          <Eye className="h-3.5 w-3.5" />
                        </DnaButton>
                        <DnaButton 
                          onClick={() => openPaymentModal(inv)}
                          variant="primary"
                          className="h-8 px-4 rounded-lg text-[8px] tracking-widest shadow-sm transition-all hover:scale-105 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Collect
                        </DnaButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="returns" className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-8">
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 bg-slate-50/50 text-center">
                <RotateCcw className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2">Retur Penjualan</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                  Retur dari BusDev akan muncul di sini untuk adjustment piutang. 
                  Proses: Kurangi outstanding invoice + buat jurnal adjustment.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <p className="text-[9px] font-black uppercase text-slate-400">Pending Retur</p>
                    <p className="text-xl font-black text-slate-900 mt-1">2</p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <p className="text-[9px] font-black uppercase text-slate-400">Total Adjustment</p>
                    <p className="text-xl font-black text-rose-600 mt-1">Rp 3.2M</p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <p className="text-[9px] font-black uppercase text-slate-400">Approved</p>
                    <p className="text-xl font-black text-emerald-600 mt-1">1</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </TableWrapper>
      </Tabs>

      {/* Payment Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border-none"
            >
              <div className="p-8 bg-blue-600 text-white flex flex-row justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">AR Collection Settlement</h3>
                  <p className="text-blue-200 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">Revenue Settlement Protocol v2.1</p>
                </div>
                <CircleDollarSign className="h-12 w-12 text-white/80" />
              </div>

              <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Debtor</p>
                  <p className="font-black text-xs uppercase text-slate-900 truncate">{selectedInvoice.pelanggan}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Invoice ID</p>
                  <p className="font-black text-xs uppercase text-slate-900">{selectedInvoice.kode_faktur}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Outstanding</p>
                  <p className="font-black text-xs text-rose-600">Rp {selectedInvoice.sisa.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Payment Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <DnaInput type="date" className="h-11 pl-12 bg-slate-50 border-none font-black uppercase text-xs focus:ring-4 focus:ring-blue-500/5 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Target Account</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select className="w-full h-11 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs appearance-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none">
                        <option>BCA Main (2640...)</option>
                        <option>Mandiri Corporate</option>
                        <option>Petty Cash (IDR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Collection Amount (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                    <DnaInput 
                      type="number" 
                      defaultValue={selectedInvoice.sisa}
                      className="h-12 pl-12 bg-slate-50 border-none font-black text-lg text-slate-900 tabular-nums focus:ring-4 focus:ring-blue-500/5 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Remarks / Reference</label>
                  <textarea 
                    rows={3}
                    placeholder="E.g., Bank transfer reference..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <DnaButton 
                    onClick={() => setIsModalOpen(false)}
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50"
                  >
                    Abort & Dismiss
                  </DnaButton>
                  <DnaButton 
                    onClick={() => setIsModalOpen(false)}
                    variant="primary"
                    className="flex-[2] h-12 rounded-xl tracking-widest text-[10px] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" /> Commit Collection
                  </DnaButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Insight */}
      <div className="bg-blue-50/30 border border-blue-100/20 rounded-2xl p-8 flex gap-8 items-center shadow-sm mt-6">
        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-slate-100">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic">Owner Insight: Revenue Integrity</p>
          <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase">
            Sample revenue collection is critical for R&D overhead coverage. 
            Ensure all <span className="text-blue-600 font-black">R&D Samples</span> with outstanding balances are flagged in the next executive pipeline review.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
