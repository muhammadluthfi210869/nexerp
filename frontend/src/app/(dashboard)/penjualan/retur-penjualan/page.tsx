"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  RotateCcw,
  Plus,
  Eye,
  Search,
  Calendar,
  Package,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRightLeft,
  Warehouse,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaCell,
  DnaModal,
  DnaButton,
  DnaInput,
  useDnaToast,
} from "@/components/dna";

interface SalesReturn {
  id: string;
  returnCode: string;
  soNumber: string;
  customerName: string;
  brandName?: string;
  returnDate: string;
  warehouseName: string;
  productName: string;
  qtyReturned: number;
  unitPrice: number;
  totalValue: number;
  returnType: "POTONG_TAGIHAN" | "GANTI_BARANG" | "REFUND";
  status: "PROSES" | "QC_PASSED" | "SELESAI" | "DITOLAK";
  reason: string;
}

const INITIAL_RETURNS: SalesReturn[] = [
  {
    id: "ret-01",
    returnCode: "RET-202603-001",
    soNumber: "SO-2026-001",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "C-Jelita Herbal",
    returnDate: "2026-03-06",
    warehouseName: "Gudang Karantina Maklon (KRT-01)",
    productName: "Brightening Niacinamide Serum 10%",
    qtyReturned: 250,
    unitPrice: 13000,
    totalValue: 3250000,
    returnType: "POTONG_TAGIHAN",
    status: "PROSES",
    reason: "Segel pump bocor mikro saat ekspedisi ke gudang klien.",
  },
  {
    id: "ret-02",
    returnCode: "RET-202602-004",
    soNumber: "SO-2026-003",
    customerName: "CV Aura Natural Skincare",
    brandName: "AuraGlow Botanical",
    returnDate: "2026-02-28",
    warehouseName: "Gudang Barang Jadi Utama (GBJ-01)",
    productName: "Centella Soothing Moisturizer Gel",
    qtyReturned: 100,
    unitPrice: 15000,
    totalValue: 1500000,
    returnType: "GANTI_BARANG",
    status: "SELESAI",
    reason: "Label kemasan primer miring pada batch awal.",
  },
  {
    id: "ret-03",
    returnCode: "RET-202602-002",
    soNumber: "SO-2026-004",
    customerName: "PT Derma Estetika Utama",
    brandName: "DermaGleam Pro",
    returnDate: "2026-02-20",
    warehouseName: "Gudang Karantina Maklon (KRT-01)",
    productName: "Hydrating Hybrid Sunscreen SPF 50+",
    qtyReturned: 150,
    unitPrice: 19000,
    totalValue: 2850000,
    returnType: "POTONG_TAGIHAN",
    status: "QC_PASSED",
    reason: "Kardus luar basah terkena hujan saat transit logistik.",
  },
];

const statusBadgeConfig: Record<string, { status: "warning" | "info" | "success" | "critical"; label: string }> = {
  PROSES: { status: "warning", label: "Inspeksi QC" },
  QC_PASSED: { status: "info", label: "QC Lolos (Karantina)" },
  SELESAI: { status: "success", label: "Selesai (Di-Offset)" },
  DITOLAK: { status: "critical", label: "Ditolak QC" },
};

const returnTypeLabels: Record<string, string> = {
  POTONG_TAGIHAN: "Potong Faktur",
  GANTI_BARANG: "Ganti Barang",
  REFUND: "Pengembalian Dana",
};

export default function ReturPenjualanPage() {
  const toast = useDnaToast();
  const [returns, setReturns] = useState<SalesReturn[]>(INITIAL_RETURNS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailReturn, setDetailReturn] = useState<SalesReturn | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formSoNumber, setFormSoNumber] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formWarehouse, setFormWarehouse] = useState("Gudang Karantina Maklon (KRT-01)");
  const [formType, setFormType] = useState<"POTONG_TAGIHAN" | "GANTI_BARANG" | "REFUND">("POTONG_TAGIHAN");
  const [formReason, setFormReason] = useState("");

  const filteredReturns = returns.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.returnCode.toLowerCase().includes(q) ||
      r.soNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalReturnsCount = returns.length;
  const totalValue = returns.reduce((acc, r) => acc + r.totalValue, 0);
  const inProcessCount = returns.filter((r) => r.status === "PROSES" || r.status === "QC_PASSED").length;
  const completedCount = returns.filter((r) => r.status === "SELESAI").length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer || !formProduct || !formQty || Number(formQty) <= 0) {
      toast.error("Validasi Gagal", "Harap isi nama klien, nama produk, dan jumlah qty retur.");
      return;
    }

    const qty = Number(formQty);
    const price = Number(formPrice) || 0;
    const total = qty * price;
    const code = `RET-202603-00${returns.length + 1}`;

    const newRet: SalesReturn = {
      id: `ret-${Date.now()}`,
      returnCode: code,
      soNumber: formSoNumber || "SO-2026-999",
      customerName: formCustomer,
      brandName: formBrand || "Private Label",
      returnDate: new Date().toISOString().split("T")[0],
      warehouseName: formWarehouse,
      productName: formProduct,
      qtyReturned: qty,
      unitPrice: price,
      totalValue: total,
      returnType: formType,
      status: "PROSES",
      reason: formReason,
    };

    setReturns([newRet, ...returns]);
    toast.success("Retur Penjualan Dicatat", `Klaim retur ${code} sebesar Rp ${total.toLocaleString("id-ID")} dikirim ke QC Karantina.`);
    setIsCreateOpen(false);

    // Reset Form
    setFormSoNumber("");
    setFormCustomer("");
    setFormBrand("");
    setFormProduct("");
    setFormQty("");
    setFormPrice("");
    setFormReason("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <DnaPageHeader
        title="RETUR PENJUALAN (SALES RETURN)"
        description="Administrasi klaim pengembalian barang jadi dari klien maklon kosmetik, verifikasi QC gudang karantina, dan kompensasi nota kredit pemotong tagihan faktur."
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Buat Retur Penjualan
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: "Total Klaim Retur",
            value: totalReturnsCount,
            subtitle: "Akumulasi komplain batch",
            trend: "0.8% dari volume kirim",
            icon: RotateCcw,
            variant: "blue",
          },
          {
            label: "Nilai Pemulihan (Kredit)",
            value: `Rp ${(totalValue / 1000000).toFixed(1)} Jt`,
            subtitle: "Potensi nota kredit invoice",
            trend: "Rekonsiliasi aktif",
            icon: ArrowRightLeft,
            variant: "purple",
          },
          {
            label: "Dalam Inspeksi QC",
            value: inProcessCount,
            subtitle: "Di gudang karantina",
            trend: "Butuh uji lab",
            icon: Clock,
            variant: "amber",
          },
          {
            label: "Retur Selesai (Di-Offset)",
            value: completedCount,
            subtitle: "Tagihan telah disesuaikan",
            trend: "Terselesaikan",
            icon: CheckCircle2,
            variant: "emerald",
          },
        ]}
      />

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Klaim & Pengembalian Produk Maklon"
        count={filteredReturns.length}
        totalItems={returns.length}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-64">
              <DnaInput
                placeholder="Cari kode, SO, klien, produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {["ALL", "PROSES", "QC_PASSED", "SELESAI"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === st
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st === "ALL" ? "Semua" : statusBadgeConfig[st]?.label || st}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">KODE & TANGGAL</th>
                <th className="py-3 px-4">KLIEN & SO</th>
                <th className="py-3 px-4">PRODUK & GUDANG TUJUAN</th>
                <th className="py-3 px-4 text-right">QTY & NILAI RETUR</th>
                <th className="py-3 px-4 text-center">METODE RETUR</th>
                <th className="py-3 px-4 text-center">STATUS QC</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RotateCcw className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada klaim retur ditemukan</p>
                    <p className="text-xs text-slate-400">Sesuaikan filter atau catat retur baru.</p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <DnaCell.Text primary={ret.returnCode} secondary={ret.returnDate} />
                    </td>
                    <td className="py-3.5 px-4">
                      <DnaCell.Avatar name={ret.customerName} subtext={`SO: ${ret.soNumber}`} />
                    </td>
                    <td className="py-3.5 px-4">
                      <DnaCell.Text primary={ret.productName} secondary={ret.warehouseName} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <p className="font-bold text-slate-900">
                        Rp {ret.totalValue.toLocaleString("id-ID")}
                      </p>
                      <p className="text-[11px] text-rose-600 font-medium">
                        {ret.qtyReturned.toLocaleString("id-ID")} pcs @ Rp {ret.unitPrice.toLocaleString("id-ID")}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                        {returnTypeLabels[ret.returnType] || ret.returnType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <DnaCell.Badge
                        status={statusBadgeConfig[ret.status]?.status || "default"}
                        label={statusBadgeConfig[ret.status]?.label || ret.status}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <DnaCell.Actions
                        onView={() => setDetailReturn(ret)}
                        extraActions={
                          <button
                            type="button"
                            onClick={() => {
                              toast.info("Inspeksi QC", `Buka hasil analisa laboratorium untuk ${ret.returnCode}`);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Konfirmasi QC"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Retur Penjualan */}
      <DnaModal
        isOpen={!!detailReturn}
        onClose={() => setDetailReturn(null)}
        title="Detail Klaim Retur & Karantina"
        size="md"
      >
        {detailReturn && (
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nomor Retur
                </span>
                <h3 className="text-base font-bold text-slate-900">{detailReturn.returnCode}</h3>
                <p className="text-xs text-slate-500">Tanggal: {detailReturn.returnDate}</p>
              </div>
              <DnaCell.Badge
                status={statusBadgeConfig[detailReturn.status]?.status || "default"}
                label={statusBadgeConfig[detailReturn.status]?.label || detailReturn.status}
              />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block">Klien Maklon</span>
                  <span className="font-semibold text-slate-800 text-xs">{detailReturn.customerName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Nomor Sales Order</span>
                  <span className="font-mono font-semibold text-blue-600 text-xs">{detailReturn.soNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Nama Produk</span>
                  <span className="font-semibold text-slate-800 text-xs">{detailReturn.productName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Gudang Alokasi</span>
                  <span className="font-semibold text-slate-800 text-xs">{detailReturn.warehouseName}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Barang Diretur:</span>
                <span className="font-bold text-slate-800">{detailReturn.qtyReturned.toLocaleString("id-ID")} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Harga Satuan:</span>
                <span className="font-semibold text-slate-800">Rp {detailReturn.unitPrice.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-rose-600">
                <span>Nilai Total Kompensasi:</span>
                <span>Rp {detailReturn.totalValue.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block mb-1">Alasan Pengembalian / Temuan Lapangan:</span>
              {detailReturn.reason}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setDetailReturn(null)}>
                Tutup
              </DnaButton>
              {detailReturn.status !== "SELESAI" && (
                <DnaButton
                  variant="primary"
                  onClick={() => {
                    setReturns((prev) =>
                      prev.map((r) => (r.id === detailReturn.id ? { ...r, status: "SELESAI" } : r))
                    );
                    toast.success("Retur Selesai", `Kompensasi ${detailReturn.returnCode} berhasil diproses.`);
                    setDetailReturn(null);
                  }}
                >
                  Selesaikan & Offset Tagihan
                </DnaButton>
              )}
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Buat Retur Penjualan Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Catat Retur Penjualan Baru"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">No. Referensi Sales Order *</label>
              <DnaInput
                placeholder="Contoh: SO-2026-001"
                value={formSoNumber}
                onChange={(e) => setFormSoNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Klien Maklon *</label>
              <DnaInput
                placeholder="Contoh: PT Cantika Jelita Nusantara"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Produk Retur *</label>
            <DnaInput
              placeholder="Contoh: Brightening Niacinamide Serum 10%"
              value={formProduct}
              onChange={(e) => setFormProduct(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Qty Retur (Pcs) *</label>
              <DnaInput
                type="number"
                placeholder="Contoh: 100"
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Harga Satuan (Rp) *</label>
              <DnaInput
                type="number"
                placeholder="Contoh: 15000"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Gudang Penerima</label>
              <select
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formWarehouse}
                onChange={(e) => setFormWarehouse(e.target.value)}
              >
                <option value="Gudang Karantina Maklon (KRT-01)">Gudang Karantina Maklon (KRT-01)</option>
                <option value="Gudang Barang Jadi Utama (GBJ-01)">Gudang Barang Jadi Utama (GBJ-01)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Metode Kompensasi</label>
              <select
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
              >
                <option value="POTONG_TAGIHAN">Potong Faktur / Nota Kredit</option>
                <option value="GANTI_BARANG">Ganti Barang Baru</option>
                <option value="REFUND">Pengembalian Dana Kas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Alasan Retur / Kerusakan</label>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Contoh: Tutup botol bocor halus saat distribusi."
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan & Teruskan ke QC
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
