"use client";

import React, { useState, useMemo } from "react";
import {
  CircleDollarSign,
  Eye,
  Search,
  Calendar,
  CreditCard,
  Wallet,
  TrendingUp,
  FlaskConical,
  ArrowUpRight,
  ShieldCheck,
  History,
  FileIcon,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { DnaInput, DnaButton } from "@/components/dna";
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalMigrationShell,
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalCurrency } from "@/lib/operational-formatters";

const STATIC_SALES_INVOICES = [
  { id: "SI-001", kode_faktur: "SI-001", kode_do: "DO-001", kode_so: "SO-001", tanggal: "01/04/2026", pelanggan: "PT Maju Jaya", grand_total: 15000000, dibayar: 10000000, sisa: 5000000, status: "PARTIAL" },
  { id: "SI-002", kode_faktur: "SI-002", kode_do: "DO-002", kode_so: "SO-002", tanggal: "03/04/2026", pelanggan: "CV Sejahtera", grand_total: 7500000, dibayar: 7500000, sisa: 0, status: "PAID" },
  { id: "SI-003", kode_faktur: "SI-003", kode_do: "DO-003", kode_so: "SO-005", tanggal: "07/04/2026", pelanggan: "Beauty Hub Indonesia", grand_total: 22500000, dibayar: 10000000, sisa: 12500000, status: "PARTIAL" },
  { id: "SI-004", kode_faktur: "SI-004", kode_do: "DO-004", kode_so: "SO-008", tanggal: "10/04/2026", pelanggan: "PT Cosmo Indah", grand_total: 18000000, dibayar: 18000000, sisa: 0, status: "PAID" },
  { id: "SI-005", kode_faktur: "SI-005", kode_do: "DO-005", kode_so: "SO-012", tanggal: "14/04/2026", pelanggan: "UD Sinar Jaya", grand_total: 5000000, dibayar: 0, sisa: 5000000, status: "UNPAID" },
];

const STATIC_SAMPLE_INVOICES = [
  { id: "SSI-001", kode_faktur: "SSI-001", kode_sample: "SS-001", tanggal: "02/04/2026", pelanggan: "UD Baru", produk: "Hair Mask Dandruff Solution", grand_total: 500000, dibayar: 250000, sisa: 250000, status: "PARTIAL" },
  { id: "SSI-002", kode_faktur: "SSI-002", kode_sample: "SS-003", tanggal: "06/04/2026", pelanggan: "Beauty Hub Indonesia", produk: "Sunscreen Stick SPF 50", grand_total: 750000, dibayar: 750000, sisa: 0, status: "PAID" },
  { id: "SSI-003", kode_faktur: "SSI-003", kode_sample: "SS-005", tanggal: "12/04/2026", pelanggan: "UD Sinar Jaya", produk: "Hand Body Lotion 250ml", grand_total: 425000, dibayar: 0, sisa: 425000, status: "UNPAID" },
];

export default function ARHubPrototype() {
  const [activeTab, setActiveTab] = useState("products");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const productColumns = useMemo(
    () => [
      {
        id: "faktur",
        header: "Faktur Identity",
        cell: ({ row }: any) => {
          const inv = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <FileIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase">{inv.tanggal}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "so_client",
        header: "SO / Client",
        cell: ({ row }: any) => {
          const inv = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-black text-slate-900 text-[11px] uppercase">{inv.kode_so}</span>
              <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.pelanggan}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "kode_do",
        header: "DO Reference",
        cell: ({ getValue }: any) => <span className="text-xs font-medium">{String(getValue())}</span>,
      },
      {
        accessorKey: "grand_total",
        header: () => <div className="text-right">Valuation</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums text-slate-900 text-xs font-black">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "sisa",
        header: () => <div className="text-right">Outstanding</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums text-rose-600 text-xs font-black">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ getValue }: any) => {
          const status = getValue() as string;
          const tone = status === "PAID" ? "success" : status === "PARTIAL" ? "pending" : "danger";
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status={tone as any}>{getOperationalStatusLabel(status)}</OperationalStatusBadge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }: any) => {
          const inv = row.original;
          return (
            <div className="flex justify-end gap-2">
              <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">
                <Eye className="h-3.5 w-3.5" />
              </DnaButton>
              {inv.sisa > 0 && (
                <DnaButton
                  onClick={() => openPaymentModal(inv)}
                  variant="primary"
                  className="h-8 px-4 rounded-lg text-[8px] tracking-widest shadow-sm bg-emerald-600 hover:bg-emerald-700"
                >
                  <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Collect
                </DnaButton>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  const sampleColumns = useMemo(
    () => [
      {
        id: "faktur",
        header: "Sample Identity",
        cell: ({ row }: any) => {
          const inv = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase">Ref: {inv.kode_sample}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "pelanggan_produk",
        header: "Pelanggan / Produk",
        cell: ({ row }: any) => {
          const inv = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-black text-slate-900 text-[11px] uppercase">{inv.pelanggan}</span>
              <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.produk}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "grand_total",
        header: () => <div className="text-right">Valuation</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums text-slate-900 text-xs font-black">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "sisa",
        header: () => <div className="text-right">Outstanding</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums text-rose-600 text-xs font-black">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ getValue }: any) => {
          const status = getValue() as string;
          const tone = status === "PAID" ? "success" : status === "PARTIAL" ? "pending" : "danger";
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status={tone as any}>{getOperationalStatusLabel(status)}</OperationalStatusBadge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }: any) => (
          <div className="flex justify-end gap-2">
            <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">
              <Eye className="h-3.5 w-3.5" />
            </DnaButton>
            <DnaButton
              onClick={() => openPaymentModal(row.original)}
              variant="primary"
              className="h-8 px-4 rounded-lg text-[8px] tracking-widest shadow-sm bg-emerald-600 hover:bg-emerald-700"
            >
              <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Collect
            </DnaButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalMigrationShell
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
      <OperationalMetricGrid>
        <OperationalMetricCard
          label="Total Receivables"
          value={formatOperationalCurrency(125400000)}
          helper="+12.5% MTD"
          icon={<TrendingUp className="h-4 w-4" />}
          tone="blue"
        />
        <OperationalMetricCard
          label="Overdue (30+ Days)"
          value={formatOperationalCurrency(12000000)}
          helper="Risk Profile: Low"
          icon={<CreditCard className="h-4 w-4" />}
          tone="red"
        />
        <OperationalMetricCard
          label="Collections (MTD)"
          value={formatOperationalCurrency(89200000)}
          helper="70% Target Completion"
          icon={<Wallet className="h-4 w-4" />}
          tone="green"
        />
        <OperationalMetricCard
          label="Sample Revenue"
          value={formatOperationalCurrency(2400000)}
          helper="R&D Commitment"
          icon={<FlaskConical className="h-4 w-4" />}
          tone="amber"
        />
      </OperationalMetricGrid>

      <OperationalTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between w-full gap-6">
          <OperationalTabsList>
            <OperationalTabsTrigger value="products">Regular Products</OperationalTabsTrigger>
            <OperationalTabsTrigger value="samples">R&D Samples</OperationalTabsTrigger>
            <OperationalTabsTrigger value="returns">Retur</OperationalTabsTrigger>
          </OperationalTabsList>
          <div className="flex gap-4 items-center">
            <DnaInput
              icon={<Search className="h-4 w-4" />}
              placeholder="Search Ledger..."
              className="bg-slate-50 border-none rounded-xl text-xs"
            />
            <DnaButton variant="outline" className="h-11 w-11 p-0 rounded-xl bg-slate-50 text-slate-400">
              <MoreHorizontal className="h-5 w-5" />
            </DnaButton>
          </div>
        </div>

        <OperationalTabsContent value="products">
          <OperationalDataTable
            data={STATIC_SALES_INVOICES}
            columns={productColumns as any}
            getRowId={(row: any) => row.id}
            searchPlaceholder="Cari faktur..."
          />
        </OperationalTabsContent>

        <OperationalTabsContent value="samples">
          <OperationalDataTable
            data={STATIC_SAMPLE_INVOICES}
            columns={sampleColumns as any}
            getRowId={(row: any) => row.id}
            searchPlaceholder="Cari sample..."
          />
        </OperationalTabsContent>

        <OperationalTabsContent value="returns">
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
        </OperationalTabsContent>
      </OperationalTabs>

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
                  <p className="font-black text-xs text-rose-600">{formatOperationalCurrency(selectedInvoice.sisa)}</p>
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
    </OperationalMigrationShell>
  );
}
