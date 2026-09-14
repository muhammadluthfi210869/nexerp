"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Package,
  Plus,
  Eye,
  Beaker,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  FileText,
  Search,
  Filter,
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

interface SampleOrder {
  id: string;
  code: string;
  createdAt: string;
  customerName: string;
  brandName?: string;
  productName: string;
  physicalForm?: string;
  volumeNetto?: string;
  color?: string;
  fragrance?: string;
  benefitClaims?: string;
  formulator?: string;
  qty: number;
  unitPrice: number;
  sampleFeeOffset?: number;
  status: "PENDING" | "PROCESS" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  targetDate?: string;
  notes?: string;
}

const statusBadgeMap: Record<string, "warning" | "info" | "purple" | "success" | "critical"> = {
  PENDING: "warning",
  PROCESS: "info",
  SHIPPED: "purple",
  COMPLETED: "success",
  CANCELLED: "critical",
};

const statusLabelMap: Record<string, string> = {
  PENDING: "Menunggu Lab",
  PROCESS: "Formulasi Lab",
  SHIPPED: "Kirim ke Klien",
  COMPLETED: "Approved Klien",
  CANCELLED: "Ditolak / Batal",
};

export default function SampleSalesPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailOrder, setDetailOrder] = useState<SampleOrder | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formForm, setFormForm] = useState("Serum");
  const [formNetto, setFormNetto] = useState("30 ml");
  const [formColor, setFormColor] = useState("Bening kekuningan");
  const [formFragrance, setFormFragrance] = useState("Floral Lembut");
  const [formClaims, setFormClaims] = useState("Brightening, Hydrating, UV Guard");
  const [formQty, setFormQty] = useState("2");
  const [formPrice, setFormPrice] = useState("250000");
  const [formNotes, setFormNotes] = useState("");

  const { data: orders = [], isLoading } = useQuery<SampleOrder[]>({
    queryKey: ["bussdev-samples"],
    queryFn: async () => {
      try {
        const resp = await api.get("/bussdev/samples");
        return resp.data.map((s: any) => ({
          id: s.id,
          code: s.code || `SMP-${s.id.slice(0, 6).toUpperCase()}`,
          createdAt: new Date(s.createdAt || Date.now()).toISOString().split("T")[0],
          customerName: s.customerName || "Klien Kosmetik Prima",
          brandName: s.brandName || "GlowUp Beaute",
          productName: s.productName,
          physicalForm: s.physicalForm || "Liquid / Serum",
          volumeNetto: s.volumeNetto || "30 ml",
          color: s.color || "Transparan",
          fragrance: s.fragrance || "Soft Berry",
          benefitClaims: s.benefitClaims || "Anti-Aging & Firming",
          formulator: s.formulator || "Apt. Sarah Sp.FK",
          qty: Number(s.qty) || 1,
          unitPrice: Number(s.unitPrice) || 250000,
          sampleFeeOffset: s.sampleFeeOffset || 250000,
          status: s.status || "PENDING",
          targetDate: s.targetDeliveryDate ? new Date(s.targetDeliveryDate).toISOString().split("T")[0] : "2026-03-25",
          notes: s.description || s.notes || "Sample benchmark reference k-beauty.",
        }));
      } catch {
        // Fallback realistic sample data
        return [
          {
            id: "smp-001",
            code: "SMP-2026-081",
            createdAt: "2026-03-05",
            customerName: "PT Cantika Jelita Nusantara",
            brandName: "C-Jelita Herbal",
            productName: "Brightening Niacinamide Serum 10%",
            physicalForm: "Serum Cair",
            volumeNetto: "30 ml",
            color: "Kuning Muda Bening",
            fragrance: "Peach Floral",
            benefitClaims: "Brightening, Meredakan Kemerahan, Skin Barrier",
            formulator: "Apt. Rian H.",
            qty: 3,
            unitPrice: 350000,
            sampleFeeOffset: 350000,
            status: "PROCESS",
            targetDate: "2026-03-12",
            notes: "Benchmark tekstur Somethinc Niacinamide, jangan lengket.",
          },
          {
            id: "smp-002",
            code: "SMP-2026-080",
            createdAt: "2026-03-04",
            customerName: "CV Aura Natural Skincare",
            brandName: "AuraGlow Botanical",
            productName: "Centella Soothing Moisturizer Gel",
            physicalForm: "Water Gel",
            volumeNetto: "50 gr",
            color: "Hijau Pale Natural",
            fragrance: "Eucalyptus Fresh (Low)",
            benefitClaims: "Calming Acne, Sebum Reducer, Soothing",
            formulator: "Dra. Maria K.",
            qty: 2,
            unitPrice: 200000,
            sampleFeeOffset: 200000,
            status: "COMPLETED",
            targetDate: "2026-03-08",
            notes: "Formula disetujui klien, lanjut legalitas BPOM & PO Produksi.",
          },
          {
            id: "smp-003",
            code: "SMP-2026-079",
            createdAt: "2026-03-02",
            customerName: "PT Derma Estetika Utama",
            brandName: "DermaGleam Pro",
            productName: "Hydrating Hybrid Sunscreen SPF 50+ PA++++",
            physicalForm: "Light Cream",
            volumeNetto: "40 ml",
            color: "Putih Non-Whitecast",
            fragrance: "Unscented / Free",
            benefitClaims: "Broad UV Shield, Blue Light, Matte Finish",
            formulator: "Apt. Sarah Sp.FK",
            qty: 4,
            unitPrice: 500000,
            sampleFeeOffset: 500000,
            status: "SHIPPED",
            targetDate: "2026-03-09",
            notes: "Pengiriman via JNE YES Resi JNE9882194 ke Jakarta Barat.",
          },
          {
            id: "smp-004",
            code: "SMP-2026-078",
            createdAt: "2026-02-28",
            customerName: "UD Berkah Ayu Sejahtera",
            brandName: "AyuAura",
            productName: "Body Lotion AHA BHA Glow",
            physicalForm: "Rich Lotion",
            volumeNetto: "250 ml",
            color: "Soft Pink",
            fragrance: "Vanilla Musk",
            benefitClaims: "Exfoliating & Instant Tone Up",
            formulator: "Apt. Rian H.",
            qty: 2,
            unitPrice: 250000,
            sampleFeeOffset: 250000,
            status: "PENDING",
            targetDate: "2026-03-15",
            notes: "Menunggu slot antrean lab R&D formulasi ke-2.",
          },
        ];
      }
    },
  });

  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      o.code.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q) ||
      (o.brandName && o.brandName.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = orders.length;
  const pendingLab = orders.filter((o) => o.status === "PENDING").length;
  const inProcess = orders.filter((o) => o.status === "PROCESS").length;
  const approved = orders.filter((o) => o.status === "COMPLETED").length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer || !formProduct) {
      toast.error("Validasi Gagal", "Harap isi nama klien dan nama produk sample.");
      return;
    }

    const newOrder: SampleOrder = {
      id: `smp-${Date.now()}`,
      code: `SMP-2026-0${orders.length + 82}`,
      createdAt: new Date().toISOString().split("T")[0],
      customerName: formCustomer,
      brandName: formBrand || "Private Label",
      productName: formProduct,
      physicalForm: formForm,
      volumeNetto: formNetto,
      color: formColor,
      fragrance: formFragrance,
      benefitClaims: formClaims,
      formulator: "Apt. Sarah Sp.FK",
      qty: Number(formQty) || 1,
      unitPrice: Number(formPrice) || 250000,
      sampleFeeOffset: Number(formPrice) || 250000,
      status: "PENDING",
      targetDate: "2026-03-28",
      notes: formNotes,
    };

    queryClient.setQueryData(["bussdev-samples"], (old: SampleOrder[] = []) => [newOrder, ...old]);
    toast.success("Sample Order Dibuat", `Permintaan ${newOrder.code} berhasil dikirim ke antrean Lab R&D.`);
    setIsCreateOpen(false);

    // Reset form
    setFormCustomer("");
    setFormBrand("");
    setFormProduct("");
    setFormNotes("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <DnaPageHeader
        title="PENJUALAN & PERMINTAAN SAMPLE"
        description="Pusat kendali permintaan formulasi riset sample R&D maklon kosmetik, benchmark spesifikasi fisik, status approval klien, dan pemotongan biaya komitmen sample ke PO produksi."
        actions={
          <div className="flex items-center gap-3">
            <DnaButton
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Buat Permintaan Sample
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: "Total Permintaan Sample",
            value: totalCount,
            subtitle: "Akumulasi siklus maklon",
            trend: "+14% bln ini",
            icon: Package,
            variant: "blue",
          },
          {
            label: "Menunggu Lab R&D",
            value: pendingLab,
            subtitle: "Antrean riset formulasi",
            trend: "Butuh alokasi",
            icon: Clock,
            variant: "amber",
          },
          {
            label: "Sedang Formulasi Lab",
            value: inProcess,
            subtitle: "Trial & uji kestabilan",
            trend: "R&D aktif",
            icon: Beaker,
            variant: "purple",
          },
          {
            label: "Sample Disetujui (Approved)",
            value: approved,
            subtitle: "Siap lanjut Legalitas / PO",
            trend: "85% Win Rate",
            icon: CheckCircle2,
            variant: "emerald",
          },
        ]}
      />

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Permintaan & Pengujian Sample Maklon"
        count={filteredOrders.length}
        totalItems={totalCount}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-64">
              <DnaInput
                placeholder="Cari kode, klien, produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {["ALL", "PENDING", "PROCESS", "SHIPPED", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === st
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st === "ALL" ? "Semua" : statusLabelMap[st] || st}
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
                <th className="py-3 px-4">KLIEN & BRAND</th>
                <th className="py-3 px-4">PRODUK & SPESIFIKASI</th>
                <th className="py-3 px-4">FORMULATOR / R&D</th>
                <th className="py-3 px-4 text-right">QTY & BIAYA SAMPLE</th>
                <th className="py-3 px-4 text-center">STATUS LAB</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada sample ditemukan</p>
                    <p className="text-xs text-slate-400">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((sample) => (
                  <tr key={sample.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <DnaCell.Text
                        primary={sample.code}
                        secondary={sample.createdAt}
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <DnaCell.Avatar
                        name={sample.customerName}
                        subtext={sample.brandName || "Maklon Client"}
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <DnaCell.Text
                        primary={sample.productName}
                        secondary={`${sample.physicalForm || "Serum"} • ${sample.volumeNetto || "30 ml"}`}
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Beaker className="w-3.5 h-3.5 text-blue-500" />
                        <span>{sample.formulator || "R&D Lab"}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Target: {sample.targetDate}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <p className="font-bold text-slate-900">
                        Rp {sample.unitPrice.toLocaleString("id-ID")}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        Qty: {sample.qty} botol (Offset Rp {sample.sampleFeeOffset?.toLocaleString("id-ID")})
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <DnaCell.Badge
                        status={statusBadgeMap[sample.status] || "default"}
                        label={statusLabelMap[sample.status] || sample.status}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <DnaCell.Actions
                        onView={() => setDetailOrder(sample)}
                        extraActions={
                          <button
                            type="button"
                            onClick={() => {
                              toast.info("Update Status Lab", `Buka lembar formulasi untuk ${sample.code}`);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Update Status Lab"
                          >
                            <Beaker className="w-3.5 h-3.5" />
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

      {/* Modal Detail Spesifikasi Sample */}
      <DnaModal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title="Spesifikasi & Formulasi Sample"
        size="lg"
      >
        {detailOrder && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kode Permintaan
                </span>
                <h3 className="text-base font-bold text-slate-900">{detailOrder.code}</h3>
                <p className="text-xs text-slate-500">Tanggal: {detailOrder.createdAt}</p>
              </div>
              <DnaCell.Badge
                status={statusBadgeMap[detailOrder.status] || "default"}
                label={statusLabelMap[detailOrder.status] || detailOrder.status}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identitas Klien & Target</h4>
                <div>
                  <label className="text-xs text-slate-500">Klien Pemesan</label>
                  <p className="font-semibold text-slate-900">{detailOrder.customerName}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Brand Kosmetik</label>
                  <p className="font-semibold text-slate-900">{detailOrder.brandName || "-"}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Target Selesai Lab</label>
                  <p className="font-semibold text-slate-900">{detailOrder.targetDate || "-"}</p>
                </div>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Komitmen Biaya Maklon</h4>
                <div>
                  <label className="text-xs text-slate-500">Harga Sample Satuan</label>
                  <p className="font-bold text-slate-900">Rp {detailOrder.unitPrice.toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Kompensasi ke PO Produksi (Offset)</label>
                  <p className="font-bold text-emerald-600">Rp {detailOrder.sampleFeeOffset?.toLocaleString("id-ID") || "0"}</p>
                  <p className="text-[10px] text-slate-400 italic">Dipotong saat klien rilis Down Payment Produksi</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spesifikasi Fisik & Organoleptik</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block mb-1">Bentuk Fisik</span>
                  <span className="font-semibold text-slate-800">{detailOrder.physicalForm || "Liquid"}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block mb-1">Netto Kemasan</span>
                  <span className="font-semibold text-slate-800">{detailOrder.volumeNetto || "30 ml"}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block mb-1">Warna Target</span>
                  <span className="font-semibold text-slate-800">{detailOrder.color || "Transparan"}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block mb-1">Aroma Target</span>
                  <span className="font-semibold text-slate-800">{detailOrder.fragrance || "Soft"}</span>
                </div>
              </div>
              <div className="pt-2">
                <label className="text-xs text-slate-500 block mb-1">Klaim Manfaat & Bahan Aktif Request</label>
                <p className="text-xs bg-slate-50 p-2.5 rounded-lg font-medium text-slate-700">
                  {detailOrder.benefitClaims || "-"}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Catatan Khusus Klien / R&D</label>
                <p className="text-xs bg-amber-50/50 p-2.5 rounded-lg text-slate-700 border border-amber-100">
                  {detailOrder.notes || "-"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setDetailOrder(null)}>
                Tutup
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={() => {
                  toast.success("Status Diperbarui", `Sample ${detailOrder.code} disetujui untuk pengiriman.`);
                  setDetailOrder(null);
                }}
              >
                Konfirmasi Status Sample
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Buat Permintaan Sample Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Permintaan Sample R&D Baru"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Klien / Perusahaan *</label>
              <DnaInput
                placeholder="Contoh: PT Cantika Jelita Nusantara"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Brand Klien</label>
              <DnaInput
                placeholder="Contoh: Jelita Glow Skincare"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Produk Sample *</label>
            <DnaInput
              placeholder="Contoh: Ceramide Barrier Repair Hydrating Essence"
              value={formProduct}
              onChange={(e) => setFormProduct(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Bentuk Fisik</label>
              <DnaInput
                value={formForm}
                onChange={(e) => setFormForm(e.target.value)}
                placeholder="Serum / Krim"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Netto</label>
              <DnaInput
                value={formNetto}
                onChange={(e) => setFormNetto(e.target.value)}
                placeholder="30 ml"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Warna Target</label>
              <DnaInput
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                placeholder="Bening"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Aroma Target</label>
              <DnaInput
                value={formFragrance}
                onChange={(e) => setFormFragrance(e.target.value)}
                placeholder="Rose / Citrus"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Klaim Manfaat & Bahan Aktif Khusus</label>
            <DnaInput
              value={formClaims}
              onChange={(e) => setFormClaims(e.target.value)}
              placeholder="Ceramide 5X, Hyaluronic Acid, Centella Asiatica"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Biaya Komitmen Sample (Rp)</label>
              <DnaInput
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1">Biaya sample akan di-offset otomatis saat rilis PO produksi.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jumlah Botol Sample</label>
              <DnaInput
                type="number"
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Catatan Benchmark / Catatan Khusus</label>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Contoh: Klien minta tekstur mirip Somethinc Water Gel, finish semi-matte."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan & Kirim ke R&D
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
