"use client";

/**
 * Sales Orders (SO) — Commercial Operations Workbench
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 17, 60, & 120),
 * dan REQUIREMENT.md Poin 38 (Input deadline per PIC), 148 (Format Kode Universal ringkas/lengkap),
 * serta AR Delivery Gatekeeper (HELD vs RELEASED).
 *
 * Visual DNA Golden Reference:
 * - Light Enterprise Theme (bg-[#F8FAFC])
 * - DnaPageHeader with primary action (+ Buat Sales Order)
 * - DnaKpiGrid with 4 interactive KPI cards (Total SO, Pending Approval, Proses Pabrik, Omzet)
 * - DnaDataTableCard with 2-level filter toolbar (search, order category, gatekeeper, status)
 * - Standardized DnaCell.* primitives
 * - DnaModal for Buat SO (dengan multi-line item cart & deadline per PIC) dan Detail Inspeksi
 */

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  FileText,
  Printer,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaCell,
  useDnaToast,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

export interface SalesOrderItem {
  id: string;
  soCode: string; // Universal Code e.g. DL-FIN-SO-202609-0001
  orderDate: string;
  customerName: string;
  brandName: string;
  category: "MAKLON_BARU" | "REPEAT_ORDER" | "JUAL_PUTUS";
  deadlineFinal: string;
  deadlinePic: {
    design: string;
    rnd: string;
    scm: string;
    production: string;
  };
  items: {
    itemName: string;
    netto: string;
    qty: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }[];
  grandTotal: number;
  approvalStatus: "PENDING" | "APPROVED" | "IN_PRODUCTION" | "COMPLETED";
  gatekeeperStatus: "HELD" | "RELEASED";
  notes?: string;
}

const INITIAL_SALES_ORDERS: SalesOrderItem[] = [
  {
    id: "so-1",
    soCode: "SO-202609-000002",
    orderDate: "2026-09-01",
    customerName: "PT Maju Jaya Skincare",
    brandName: "Maju Glow",
    category: "MAKLON_BARU",
    deadlineFinal: "2026-10-15",
    deadlinePic: {
      design: "2026-09-08",
      rnd: "2026-09-15",
      scm: "2026-09-22",
      production: "2026-10-10",
    },
    items: [
      {
        itemName: "Day Cream SPF 50 Tone Up 30g",
        netto: "30g",
        qty: 5000,
        unitPrice: 28000,
        discount: 2500000,
        subtotal: 137500000,
      },
    ],
    grandTotal: 137500000,
    approvalStatus: "IN_PRODUCTION",
    gatekeeperStatus: "RELEASED",
    notes: "DP 50% sudah diterima dan diverifikasi Finance. Lanjut tahap filling.",
  },
  {
    id: "so-2",
    soCode: "SO-202609-000004",
    orderDate: "2026-09-03",
    customerName: "Vivin Anggi Ardita",
    brandName: "FYS Beauty Care",
    category: "REPEAT_ORDER",
    deadlineFinal: "2026-09-28",
    deadlinePic: {
      design: "2026-09-05",
      rnd: "2026-09-07",
      scm: "2026-09-12",
      production: "2026-09-25",
    },
    items: [
      {
        itemName: "Acne Facial Wash 100ml",
        netto: "100ml",
        qty: 3000,
        unitPrice: 22000,
        discount: 0,
        subtotal: 66000000,
      },
    ],
    grandTotal: 66000000,
    approvalStatus: "IN_PRODUCTION",
    gatekeeperStatus: "HELD",
    notes: "Produksi selesai, menunggu konfirmasi pelunasan sebelum DO dilepas.",
  },
  {
    id: "so-3",
    soCode: "SO-202609-000005",
    orderDate: "2026-09-05",
    customerName: "Beauty Hub Indonesia",
    brandName: "GlowHub",
    category: "MAKLON_BARU",
    deadlineFinal: "2026-10-30",
    deadlinePic: {
      design: "2026-09-15",
      rnd: "2026-09-25",
      scm: "2026-10-05",
      production: "2026-10-25",
    },
    items: [
      {
        itemName: "Brightening Body Lotion 250ml",
        netto: "250ml",
        qty: 2000,
        unitPrice: 42000,
        discount: 1000000,
        subtotal: 83000000,
      },
    ],
    grandTotal: 83000000,
    approvalStatus: "PENDING",
    gatekeeperStatus: "HELD",
    notes: "Menunggu persetujuan Direktur & verifikasi DP 50%.",
  },
  {
    id: "so-4",
    soCode: "SO-202609-000008",
    orderDate: "2026-09-07",
    customerName: "PT Cosmo Indah Jaya",
    brandName: "CosmoDerm",
    category: "REPEAT_ORDER",
    deadlineFinal: "2026-10-20",
    deadlinePic: {
      design: "2026-09-10",
      rnd: "2026-09-12",
      scm: "2026-09-20",
      production: "2026-10-15",
    },
    items: [
      {
        itemName: "Moisturizer Gel Aloe 50ml",
        netto: "50ml",
        qty: 4000,
        unitPrice: 32000,
        discount: 3000000,
        subtotal: 125000000,
      },
    ],
    grandTotal: 125000000,
    approvalStatus: "APPROVED",
    gatekeeperStatus: "HELD",
    notes: "Batch record diterbitkan, jadwal mixing tgl 12 September.",
  },
];

function SalesOrdersContent() {
  const toast = useDnaToast();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<SalesOrderItem[]>(INITIAL_SALES_ORDERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedGatekeeper, setSelectedGatekeeper] = useState("ALL");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SalesOrderItem | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [codeType, setCodeType] = useState<"SHORT" | "FULL">("SHORT");
  const [form, setForm] = useState({
    customerName: "",
    brandName: "",
    category: "MAKLON_BARU" as SalesOrderItem["category"],
    orderDate: new Date().toISOString().slice(0, 10),
    deadlineFinal: "2026-10-31",
    deadlineDesign: "2026-09-20",
    deadlineRnd: "2026-09-28",
    deadlineScm: "2026-10-08",
    deadlineProduction: "2026-10-25",
    itemName: "",
    netto: "50ml",
    qty: "2000",
    unitPrice: "35000",
    discount: "0",
    notes: "",
  });

  // KPI calculations
  const totalOmzet = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalPending = orders.filter((o) => o.approvalStatus === "PENDING").length;
  const totalInProd = orders.filter((o) => o.approvalStatus === "IN_PRODUCTION").length;
  const totalReleased = orders.filter((o) => o.gatekeeperStatus === "RELEASED").length;

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedKpiFilter === "PENDING" && o.approvalStatus !== "PENDING") return false;
      if (selectedKpiFilter === "IN_PROD" && o.approvalStatus !== "IN_PRODUCTION") return false;
      if (selectedKpiFilter === "RELEASED" && o.gatekeeperStatus !== "RELEASED") return false;

      if (selectedCategory !== "ALL" && o.category !== selectedCategory) return false;
      if (selectedGatekeeper !== "ALL" && o.gatekeeperStatus !== selectedGatekeeper) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = o.soCode.toLowerCase().includes(q);
        const matchCustomer = o.customerName.toLowerCase().includes(q);
        const matchBrand = o.brandName.toLowerCase().includes(q);
        if (!matchCode && !matchCustomer && !matchBrand) return false;
      }

      return true;
    });
  }, [orders, selectedKpiFilter, selectedCategory, selectedGatekeeper, searchQuery]);

  const handleCreateSO = () => {
    if (!form.customerName.trim() || !form.itemName.trim()) {
      toast.warning("Nama Pelanggan dan Nama Produk wajib diisi!");
      return;
    }

    const qtyNum = parseInt(form.qty) || 1000;
    const priceNum = parseInt(form.unitPrice) || 30000;
    const discNum = parseInt(form.discount) || 0;
    const totalLine = qtyNum * priceNum - discNum;

    const seqNumber = String(orders.length + 1).padStart(6, "0");
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const generatedCode =
      codeType === "FULL"
        ? `DL-BUS-SO-${dateStamp}-${seqNumber}`
        : `SO-${dateStamp.slice(0, 6)}-${seqNumber}`;

    const newSO: SalesOrderItem = {
      id: "so-" + Date.now(),
      soCode: generatedCode,
      orderDate: form.orderDate,
      customerName: form.customerName,
      brandName: form.brandName || form.customerName,
      category: form.category,
      deadlineFinal: form.deadlineFinal,
      deadlinePic: {
        design: form.deadlineDesign,
        rnd: form.deadlineRnd,
        scm: form.deadlineScm,
        production: form.deadlineProduction,
      },
      items: [
        {
          itemName: form.itemName,
          netto: form.netto,
          qty: qtyNum,
          unitPrice: priceNum,
          discount: discNum,
          subtotal: totalLine,
        },
      ],
      grandTotal: totalLine,
      approvalStatus: "PENDING",
      gatekeeperStatus: "HELD",
      notes: form.notes,
    };

    setOrders((prev) => [newSO, ...prev]);
    setIsCreateOpen(false);
    toast.success(`Sales Order ${newSO.soCode} berhasil diterbitkan!`);
  };

  const handleToggleGatekeeper = (so: SalesOrderItem) => {
    const nextStatus = so.gatekeeperStatus === "HELD" ? "RELEASED" : "HELD";
    setOrders((prev) =>
      prev.map((item) =>
        item.id === so.id ? { ...item, gatekeeperStatus: nextStatus } : item
      )
    );
    if (selectedDetail && selectedDetail.id === so.id) {
      setSelectedDetail((prev) => (prev ? { ...prev, gatekeeperStatus: nextStatus } : null));
    }
    toast.success(
      `Gatekeeper Pengiriman diubah ke ${nextStatus}. ${
        nextStatus === "RELEASED"
          ? "Gudang diizinkan mencetak Surat Jalan / DO."
          : "Gudang dikunci dari pengiriman."
      }`
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans">
      <DnaPageHeader
        title="Penjualan & Sales Orders (SO)"
        description="Pusat Kontrol Pesanan Penjualan, Matriks Deadline per PIC, dan Otorisasi Gatekeeper Logistik"
        backLink={{ href: "/bussdev/client-manager?tab=production", label: "Client Produksi" }}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            ORDER WORKBENCH
          </span>
        }
        actions={
          <DnaButton
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Sales Order (SO)
          </DnaButton>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
        {/* 4 KPI Cards */}
        <DnaKpiGrid
          columns={4}
          items={[
            {
              label: "TOTAL SALES ORDERS",
              value: `${orders.length} Order`,
              subtext: "Seluruh kontrak penjualan aktif",
              icon: FileSpreadsheet,
              status: selectedKpiFilter === null ? "primary" : "neutral",
              onClick: () => setSelectedKpiFilter(null),
            },
            {
              label: "MENUNGGU APPROVAL",
              value: `${totalPending} SO`,
              subtext: "Verifikasi kontrak & DP awal",
              icon: Clock,
              status: selectedKpiFilter === "PENDING" ? "warning" : "neutral",
              onClick: () =>
                setSelectedKpiFilter(selectedKpiFilter === "PENDING" ? null : "PENDING"),
            },
            {
              label: "DALAM PRODUKSI PABRIK",
              value: `${totalInProd} SO`,
              subtext: "Tahap mixing / filling / packing",
              icon: Package,
              status: selectedKpiFilter === "IN_PROD" ? "purple" : "neutral",
              onClick: () =>
                setSelectedKpiFilter(selectedKpiFilter === "IN_PROD" ? null : "IN_PROD"),
            },
            {
              label: "TOTAL OMZET BERJALAN",
              value: formatCurrency(totalOmzet),
              subtext: `${totalReleased} SO Diizinkan Kirim (RELEASED)`,
              icon: DollarSign,
              status: "success",
            },
          ]}
        />

        {/* Level-2 Filter Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-72">
              <DnaInput
                placeholder="Cari no SO, nama klien, brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Kategori Order</option>
              <option value="MAKLON_BARU">Maklon Baru (First Batch)</option>
              <option value="REPEAT_ORDER">Repeat Order (RO)</option>
              <option value="JUAL_PUTUS">Jual Putus / Distribusi</option>
            </select>

            <select
              value={selectedGatekeeper}
              onChange={(e) => setSelectedGatekeeper(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Gatekeeper</option>
              <option value="HELD">HELD (Tahan Pengiriman)</option>
              <option value="RELEASED">RELEASED (Siap Kirim)</option>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-400">
            Menampilkan <span className="text-slate-800">{filteredOrders.length}</span> Sales Order
          </div>
        </div>

        {/* Data Table Card */}
        <DnaDataTableCard title="Daftar Kontrak Sales Order (SO)" count={filteredOrders.length}>
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">KODE SO</th>
                <th className="p-3">TANGGAL</th>
                <th className="p-3">PELANGGAN</th>
                <th className="p-3">KATEGORI</th>
                <th className="p-3">BRAND</th>
                <th className="p-3">PEMBUAT</th>
                <th className="p-3">DEADLINE PER PIC</th>
                <th className="p-3 text-right">GRAND TOTAL</th>
                <th className="p-3 text-center">STATUS</th>
                <th className="p-3 text-right">#</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((so, idx) => (
                <tr
                  key={so.id}
                  onClick={() => setSelectedDetail(so)}
                  className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 cursor-pointer group text-xs"
                >
                  <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3 font-mono font-semibold text-blue-600 whitespace-nowrap">{so.soCode}</td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">{so.orderDate}</td>
                  <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{so.customerName}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {so.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{so.brandName}</td>
                  <td className="p-3 text-slate-700 whitespace-nowrap">Irma Safarina (BusDev)</td>
                  <td className="p-3 text-slate-600 whitespace-nowrap font-mono">{so.deadlineFinal}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(so.grandTotal)}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <DnaCell.Badge
                      status={
                        so.approvalStatus === "COMPLETED"
                          ? "approved"
                          : so.approvalStatus === "IN_PRODUCTION"
                          ? "progress"
                          : so.approvalStatus === "APPROVED"
                          ? "info"
                          : "pending"
                      }
                      label={so.approvalStatus}
                    />
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleGatekeeper(so)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-tight border transition-all cursor-pointer ${
                          so.gatekeeperStatus === "RELEASED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                        }`}
                        title="Toggle gatekeeper pengiriman"
                      >
                        {so.gatekeeperStatus === "RELEASED" ? (
                          <>
                            <Unlock className="w-3 h-3" />
                            RELEASED
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            HELD
                          </>
                        )}
                      </button>
                      <DnaButton variant="ghost" size="sm" onClick={() => setSelectedDetail(so)}>
                        Detail
                      </DnaButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DnaDataTableCard>
      </div>

      {/* Modal Buat SO Baru (Multi-Line Cart & Deadline per PIC) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Sales Order (SO) Baru"
        subtitle="Formulir Kontrak Penjualan Produk & Matriks Alokasi Deadline per Departemen"
        size="lg"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <DnaButton variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateSO}>
              Terbitkan Sales Order
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-medium">
          {/* Format Kode Universal Selector (Poin 148) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
                Format Penomoran Kode SO Universal
              </span>
              <span className="text-[10px] text-slate-500">
                Pilih format standar kode transaksi sesuai SOP perusahaan (Poin 148)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCodeType("SHORT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  codeType === "SHORT"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Ringkas (SO-202609-0001)
              </button>
              <button
                type="button"
                onClick={() => setCodeType("FULL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  codeType === "FULL"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Lengkap (DL-BUS-SO-...)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Nama Pelanggan *
              </label>
              <DnaInput
                placeholder="Contoh: PT Cantik Jelita"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Brand Produk
              </label>
              <DnaInput
                placeholder="Contoh: Jelita Glow"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Kategori Order
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="MAKLON_BARU">Maklon Baru (Batch 1)</option>
                <option value="REPEAT_ORDER">Repeat Order (Batch Lanjutan)</option>
                <option value="JUAL_PUTUS">Jual Putus / Distribusi</option>
              </select>
            </div>
          </div>

          {/* Deadlines per PIC Section (Requirement Poin 38) */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Alokasi Deadline per PIC / Departemen (Poin 38)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  1. PIC Desain & Kemas:
                </span>
                <input
                  type="date"
                  value={form.deadlineDesign}
                  onChange={(e) => setForm({ ...form, deadlineDesign: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  2. PIC Formulasi R&D:
                </span>
                <input
                  type="date"
                  value={form.deadlineRnd}
                  onChange={(e) => setForm({ ...form, deadlineRnd: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  3. PIC Pengadaan SCM:
                </span>
                <input
                  type="date"
                  value={form.deadlineScm}
                  onChange={(e) => setForm({ ...form, deadlineScm: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  4. PIC Produksi Pabrik:
                </span>
                <input
                  type="date"
                  value={form.deadlineProduction}
                  onChange={(e) => setForm({ ...form, deadlineProduction: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Multi-line Product Cart Item */}
          <div className="border border-slate-200 rounded-xl p-3 space-y-3 bg-white">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              Rincian Item Produk
            </span>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Nama Produk *
                </label>
                <DnaInput
                  placeholder="Contoh: Sunscreen Brightening SPF 50"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Netto / Ukuran
                </label>
                <DnaInput
                  placeholder="30g / 50ml"
                  value={form.netto}
                  onChange={(e) => setForm({ ...form, netto: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Kuantitas (Qty)
                </label>
                <DnaInput
                  type="number"
                  placeholder="2000"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Harga Satuan (Rp)
                </label>
                <DnaInput
                  type="number"
                  placeholder="35000"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </DnaModal>

      {/* Modal Detail SO */}
      {selectedDetail && (
        <DnaModal
          isOpen={true}
          onClose={() => setSelectedDetail(null)}
          title={`Detail Sales Order — ${selectedDetail.soCode}`}
          subtitle={`${selectedDetail.customerName} (${selectedDetail.brandName})`}
          size="lg"
          footer={
            <div className="flex justify-between items-center w-full">
              <button
                type="button"
                onClick={() => handleToggleGatekeeper(selectedDetail)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedDetail.gatekeeperStatus === "RELEASED"
                    ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                }`}
              >
                {selectedDetail.gatekeeperStatus === "RELEASED" ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Kunci Gatekeeper (Tahan Pengiriman DO)
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    Buka Kunci Gatekeeper (Otorisasi Pengiriman DO)
                  </>
                )}
              </button>
              <div className="flex gap-2">
                <DnaButton variant="ghost" onClick={() => setSelectedDetail(null)}>
                  Tutup
                </DnaButton>
                <DnaButton
                  variant="primary"
                  onClick={() => {
                    toast.info(`Mencetak Kontrak Penjualan ${selectedDetail.soCode}`);
                  }}
                  className="gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Kontrak SO
                </DnaButton>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tgl Order:</span>
                <p className="font-bold text-slate-800">{selectedDetail.orderDate}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Deadline Final:</span>
                <p className="font-bold text-slate-800">{selectedDetail.deadlineFinal}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status Approval:</span>
                <p className="font-bold text-blue-600">{selectedDetail.approvalStatus}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Grand Total:</span>
                <p className="font-bold text-emerald-600">{formatCurrency(selectedDetail.grandTotal)}</p>
              </div>
            </div>

            {/* Matriks Deadline per PIC */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Target Deadline per PIC (Poin 38)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">DESAIN KEMASAN</span>
                  <span className="font-bold text-slate-800">{selectedDetail.deadlinePic.design}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">FORMULA R&D</span>
                  <span className="font-bold text-slate-800">{selectedDetail.deadlinePic.rnd}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">PENGADAAN SCM</span>
                  <span className="font-bold text-slate-800">{selectedDetail.deadlinePic.scm}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">PRODUKSI PABRIK</span>
                  <span className="font-bold text-slate-800">{selectedDetail.deadlinePic.production}</span>
                </div>
              </div>
            </div>

            {/* Rincian Produk */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Rincian Produk Dipesan
              </span>
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[10px] font-bold">
                    <th className="p-2">PRODUK</th>
                    <th className="p-2 text-center">NETTO</th>
                    <th className="p-2 text-right">QTY</th>
                    <th className="p-2 text-right">HARGA (RP)</th>
                    <th className="p-2 text-right">DISKON (RP)</th>
                    <th className="p-2 text-right">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDetail.items.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="p-2 font-bold text-slate-800">{it.itemName}</td>
                      <td className="p-2 text-center text-slate-500">{it.netto}</td>
                      <td className="p-2 text-right font-medium">{it.qty.toLocaleString()} pcs</td>
                      <td className="p-2 text-right font-medium">{formatCurrency(it.unitPrice)}</td>
                      <td className="p-2 text-right text-rose-600 font-medium">
                        {it.discount > 0 ? `-${formatCurrency(it.discount)}` : "—"}
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        {formatCurrency(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedDetail.notes && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                <span className="font-bold text-slate-700 block mb-0.5">Catatan Order:</span>
                {selectedDetail.notes}
              </div>
            )}
          </div>
        </DnaModal>
      )}
    </div>
  );
}

export default function SalesOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>}>
      <SalesOrdersContent />
    </Suspense>
  );
}
