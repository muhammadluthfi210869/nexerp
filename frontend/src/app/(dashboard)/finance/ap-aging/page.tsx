"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  KpiCard,
  TableWrapper,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaTdNumber,
  DnaTdCode,
  DnaBadge,
  DnaButton,
  DnaPagination
} from "@/components/dna";
import {
  History,
  AlertTriangle,
  Clock,
  Building2,
  CreditCard,
  Calendar,
  Landmark,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";

interface ApAgingInvoice {
  id: string;
  invoiceNo: string;
  poNumber: string;
  invoiceDate: string;
  dueDate: string;
  vendorName: string;
  category: "Bahan Baku" | "Kemasan" | "Jasa Maklon" | "Operasional";
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  daysToDue: number; // positive = days left, negative = overdue
}

const INITIAL_AP_INVOICES: ApAgingInvoice[] = [
  {
    id: "ap-1",
    invoiceNo: "FP-202608-000045",
    poNumber: "PO-202608-000020",
    invoiceDate: "2026-08-05",
    dueDate: "2026-09-01",
    vendorName: "PT Sumber Wangi Abadi",
    category: "Bahan Baku",
    totalAmount: 18500000.00,
    paidAmount: 0.00,
    remainingAmount: 18500000.00,
    daysToDue: -3 // Overdue 3 days
  },
  {
    id: "ap-2",
    invoiceNo: "FP-202608-000048",
    poNumber: "PO-202608-000022",
    invoiceDate: "2026-08-06",
    dueDate: "2026-09-05",
    vendorName: "Marga Duwi Kencana",
    category: "Bahan Baku",
    totalAmount: 34200000.00,
    paidAmount: 10000000.00,
    remainingAmount: 24200000.00,
    daysToDue: 1 // H-3 critical
  },
  {
    id: "ap-3",
    invoiceNo: "FP-202608-000052",
    poNumber: "PO-202608-000028",
    invoiceDate: "2026-08-08",
    dueDate: "2026-09-06",
    vendorName: "Multi Kemas Plasindo",
    category: "Kemasan",
    totalAmount: 45000000.00,
    paidAmount: 15000000.00,
    remainingAmount: 30000000.00,
    daysToDue: 2 // H-3 critical
  },
  {
    id: "ap-4",
    invoiceNo: "FP-202608-000060",
    poNumber: "PO-202608-000030",
    invoiceDate: "2026-08-10",
    dueDate: "2026-09-10",
    vendorName: "PT Cipta Plastik Mandiri",
    category: "Kemasan",
    totalAmount: 12500000.00,
    paidAmount: 0.00,
    remainingAmount: 12500000.00,
    daysToDue: 6 // H-7 warning
  },
  {
    id: "ap-5",
    invoiceNo: "FP-202608-000065",
    poNumber: "PO-202608-000033",
    invoiceDate: "2026-08-15",
    dueDate: "2026-09-11",
    vendorName: "PT Ekspedisi Logistik Cepat",
    category: "Operasional",
    totalAmount: 4800000.00,
    paidAmount: 0.00,
    remainingAmount: 4800000.00,
    daysToDue: 7 // H-7 warning
  },
  {
    id: "ap-6",
    invoiceNo: "FP-202608-000070",
    poNumber: "PO-202608-000035",
    invoiceDate: "2026-08-20",
    dueDate: "2026-09-25",
    vendorName: "PT Kimia Sejahtera Prima",
    category: "Bahan Baku",
    totalAmount: 52000000.00,
    paidAmount: 0.00,
    remainingAmount: 52000000.00,
    daysToDue: 21 // Lancar
  }
];

export default function ApAgingPage() {
  const [invoices, setInvoices] = useState<ApAgingInvoice[]>(INITIAL_AP_INVOICES);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OVERDUE" | "H3" | "H7" | "CURRENT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Bank Balances Header Info
  const bankBalances = {
    total: 428500000,
    bca: 265000000,
    mandiri: 118500000,
    kas: 45000000
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // KPIs
  const totalAp = invoices.reduce((acc, cur) => acc + cur.remainingAmount, 0);
  const overdueInvoices = invoices.filter((i) => i.daysToDue < 0);
  const overdueTotal = overdueInvoices.reduce((acc, cur) => acc + cur.remainingAmount, 0);
  const h3Invoices = invoices.filter((i) => i.daysToDue >= 0 && i.daysToDue <= 3);
  const h3Total = h3Invoices.reduce((acc, cur) => acc + cur.remainingAmount, 0);
  const h7Invoices = invoices.filter((i) => i.daysToDue > 3 && i.daysToDue <= 7);
  const h7Total = h7Invoices.reduce((acc, cur) => acc + cur.remainingAmount, 0);

  // Filtered & Paginated
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterStatus === "OVERDUE" && inv.daysToDue >= 0) return false;
      if (filterStatus === "H3" && (inv.daysToDue < 0 || inv.daysToDue > 3)) return false;
      if (filterStatus === "H7" && (inv.daysToDue <= 3 || inv.daysToDue > 7)) return false;
      if (filterStatus === "CURRENT" && inv.daysToDue <= 7) return false;

      const q = searchQuery.toLowerCase();
      return (
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.vendorName.toLowerCase().includes(q) ||
        inv.poNumber.toLowerCase().includes(q) ||
        inv.category.toLowerCase().includes(q)
      );
    });
  }, [invoices, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filtered.slice(start, start + entriesPerPage);
  }, [filtered, currentPage, entriesPerPage]);

  return (
    <DnaPageContainer>
      {/* 1. Standard Visual DNA Page Header with Active Bank Balances Indicator */}
      <DnaPageHeader
        title="AP Aging & Likuiditas"
        badge={<DnaBadge status="purple">LIQUIDITY ENGINE</DnaBadge>}
        subtitle={`Monitoring hutang dagang jatuh tempo & kesiapan saldo kas/bank total Rp ${formatRupiah(bankBalances.total).split(",")[0]}`}
        action={
          <div className="flex items-center gap-3 text-xs bg-slate-100 dark:bg-[#101726] p-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">BCA Utama</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">Rp {formatRupiah(bankBalances.bca).split(",")[0]}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Bank Mandiri</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">Rp {formatRupiah(bankBalances.mandiri).split(",")[0]}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Kas Kecil</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">Rp {formatRupiah(bankBalances.kas).split(",")[0]}</span>
            </div>
          </div>
        }
      />

      {/* 2. KPI Grid with H-3, H-7, Overdue Alert Cards */}
      <DnaKpiGrid>
        <KpiCard
          label="Total Hutang Dagang (AP)"
          value={`Rp ${formatRupiah(totalAp).split(",")[0]}`}
          subtext={`${invoices.length} tagihan vendor aktif`}
          variant="slate"
        />
        <KpiCard
          label="Jatuh Tempo H-7"
          value={`Rp ${formatRupiah(h7Total).split(",")[0]}`}
          subtext={`${h7Invoices.length} faktur jatuh tempo 4-7 hari`}
          variant="amber"
        />
        <KpiCard
          label="Jatuh Tempo H-3 (Kritis)"
          value={`Rp ${formatRupiah(h3Total).split(",")[0]}`}
          subtext={`${h3Invoices.length} faktur jatuh tempo <= 3 hari`}
          variant="rose"
        />
        <KpiCard
          label="Lewat Jatuh Tempo (Overdue)"
          value={`Rp ${formatRupiah(overdueTotal).split(",")[0]}`}
          subtext={`${overdueInvoices.length} faktur menunggak`}
          variant="rose"
        />
      </DnaKpiGrid>

      {/* 3. Sub-Nav Tabs & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {[
            { id: "ALL", label: "Semua Faktur", count: invoices.length },
            { id: "H3", label: "H-3 Kritis", count: h3Invoices.length },
            { id: "H7", label: "H-7 Perhatian", count: h7Invoices.length },
            { id: "OVERDUE", label: "Overdue", count: overdueInvoices.length },
            { id: "CURRENT", label: "Lancar", count: invoices.filter(i => i.daysToDue > 7).length },
          ].map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterStatus(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-blue-700/80 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 px-2 bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari faktur, vendor, PO..."
              className="w-56 pl-3 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Table with Color-Coded H-3 (Red), H-7 (Yellow), Overdue (Bold + Alert) */}
      <TableWrapper>
        <DnaTable>
          <DnaTableHead>
            <tr>
              <DnaTh className="w-10 text-center">#</DnaTh>
              <DnaTh>No. Faktur</DnaTh>
              <DnaTh>Supplier / Vendor</DnaTh>
              <DnaTh>Kategori</DnaTh>
              <DnaTh>Tanggal</DnaTh>
              <DnaTh>Jatuh Tempo</DnaTh>
              <DnaTh align="right">Saldo Hutang</DnaTh>
              <DnaTh className="text-center">Status Jatuh Tempo</DnaTh>
              <DnaTh className="w-24 text-center">Aksi</DnaTh>
            </tr>
          </DnaTableHead>
          <DnaTableBody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                  Tidak ada data faktur hutang sesuai filter.
                </td>
              </tr>
            ) : (
              paginated.map((inv, idx) => {
                const rowNum = (currentPage - 1) * entriesPerPage + idx + 1;
                const isOverdue = inv.daysToDue < 0;
                const isH3 = inv.daysToDue >= 0 && inv.daysToDue <= 3;
                const isH7 = inv.daysToDue > 3 && inv.daysToDue <= 7;

                return (
                  <DnaTableRow
                    key={inv.id}
                    className={
                      isOverdue
                        ? "bg-rose-50/60 font-black hover:bg-rose-100/60"
                        : isH3
                        ? "bg-rose-50/30 font-bold hover:bg-rose-50/70"
                        : isH7
                        ? "bg-amber-50/30 hover:bg-amber-50/70"
                        : ""
                    }
                  >
                    <DnaTd className="text-center font-bold text-slate-500">
                      {rowNum}
                    </DnaTd>
                    <DnaTdCode code={inv.invoiceNo} />
                    <DnaTd>
                      <span className={`text-xs ${isOverdue ? "font-black text-rose-950" : "font-bold text-slate-900"}`}>
                        {inv.vendorName}
                      </span>
                    </DnaTd>
                    <DnaTd>
                      <span className="text-xs text-slate-600 font-medium">
                        {inv.category}
                      </span>
                    </DnaTd>
                    <DnaTd>
                      <span className="text-xs text-slate-600 font-medium">
                        {inv.invoiceDate}
                      </span>
                    </DnaTd>
                    <DnaTd>
                      <span className={`text-xs ${isOverdue ? "text-rose-700 font-black" : isH3 ? "text-rose-600 font-bold" : isH7 ? "text-amber-700 font-bold" : "text-slate-800 font-medium"}`}>
                        {inv.dueDate}
                      </span>
                    </DnaTd>
                    <DnaTdNumber>
                      <span className={`text-xs ${isOverdue ? "font-black text-rose-700" : isH3 ? "font-bold text-rose-600" : "font-bold text-slate-900"}`}>
                        Rp {formatRupiah(inv.remainingAmount)}
                      </span>
                    </DnaTdNumber>
                    <DnaTd className="text-center">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black bg-rose-600 text-white rounded-md uppercase tracking-wider animate-bounce shadow-xs">
                          <AlertTriangle className="w-3 h-3" />
                          LEWAT {Math.abs(inv.daysToDue)} HARI
                        </span>
                      ) : isH3 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-400 rounded-md uppercase">
                          <Clock className="w-3 h-3 text-rose-600" />
                          H-{inv.daysToDue} JATUH TEMPO
                        </span>
                      ) : isH7 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-400 rounded-md uppercase">
                          <Clock className="w-3 h-3 text-amber-600" />
                          H-{inv.daysToDue} JATUH TEMPO
                        </span>
                      ) : (
                        <DnaBadge status="success">LANCAR ({inv.daysToDue} HARI)</DnaBadge>
                      )}
                    </DnaTd>
                    <DnaTd className="text-center">
                      <Link
                        href="/finance/bayar-pembelian"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <CreditCard className="w-3 h-3" />
                        Bayar
                      </Link>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </TableWrapper>

      {/* 5. DNA Pagination Footer */}
      <DnaPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={entriesPerPage}
        onPageChange={setCurrentPage}
      />
    </DnaPageContainer>
  );
}
