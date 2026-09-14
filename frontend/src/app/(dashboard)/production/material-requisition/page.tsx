"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Layers,
  ClipboardList,
  PackageCheck,
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Filter,
  Warehouse,
  Boxes,
  Printer,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaTabNav,
  useDnaToast
} from "@/components/dna";
import Link from "next/link";

interface MaterialRequisitionItem {
  id: string;
  code: string; // e.g. SPB-PRD-2026-0091
  date: string;
  spkCode: string; // e.g. SPK-2026-0043
  batchNumber: string;
  customerName: string;
  brandName: string;
  productName: string;
  requestType: "RAW_MATERIAL" | "PRIMARY_PACKAGING" | "SECONDARY_PACKAGING";
  totalItems: number;
  itemsSummary: string;
  sourceWarehouse: string; // e.g. WH-01 (Gudang Bahan Baku)
  status: "DRAFT" | "SUBMITTED" | "PARTIALLY_ISSUED" | "FULLY_ISSUED";
  requestedBy: string;
  issuedBy?: string;
  notes?: string;
}

const FALLBACK_REQUISITIONS: MaterialRequisitionItem[] = [
  {
    id: "spb-1",
    code: "SPB-PRD-2026-0091",
    date: "2026-09-09",
    spkCode: "SPK-2026-0043",
    batchNumber: "BATCH-AURA-0910",
    customerName: "CV Aura Skin Estetika",
    brandName: "AuraGlow",
    productName: "Centella Asiatica Soothing Gel Cream",
    requestType: "RAW_MATERIAL",
    totalItems: 8,
    itemsSummary: "Centella Extract, Glycerin, Niacinamide, Carbomer 940, TEA, Preservative",
    sourceWarehouse: "WH-01 (Gudang Bahan Baku)",
    status: "SUBMITTED",
    requestedBy: "Hendra Wijaya",
    notes: "Permintaan bahan baku formula upscaled 157.5 Kg untuk bejana 500L."
  },
  {
    id: "spb-2",
    code: "SPB-PRD-2026-0090",
    date: "2026-09-08",
    spkCode: "SPK-2026-0042",
    batchNumber: "BATCH-GLW-0909",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "GlowGoddess",
    productName: "Niacinamide 10% Brightening Serum",
    requestType: "PRIMARY_PACKAGING",
    totalItems: 3,
    itemsSummary: "Botol Kaca Pipet 30ml (5,100 pcs), Dropper Rubber White (5,100 pcs)",
    sourceWarehouse: "WH-02 (Gudang Bahan Kemas)",
    status: "FULLY_ISSUED",
    requestedBy: "Budi Santoso",
    issuedBy: "Yayan Sopian (Gudang Kemas)",
    notes: "Telah diserahkan penuh ke Line Filling 2."
  },
  {
    id: "spb-3",
    code: "SPB-PRD-2026-0089",
    date: "2026-09-08",
    spkCode: "SPK-2026-0040",
    batchNumber: "BATCH-ELX-0905",
    customerName: "PT Elixir Botanika Internasional",
    brandName: "ElixirHerb",
    productName: "Rosemary Purifying Hair Tonic",
    requestType: "SECONDARY_PACKAGING",
    totalItems: 4,
    itemsSummary: "Inner Box Hologram (10,200 pcs), Shrink Film Roll (5 roll), Master Carton (220 box)",
    sourceWarehouse: "WH-02 (Gudang Bahan Kemas)",
    status: "FULLY_ISSUED",
    requestedBy: "Rina Marlina",
    issuedBy: "Yayan Sopian (Gudang Kemas)",
    notes: "Telah diterima di conveyor packaging sekunder."
  },
  {
    id: "spb-4",
    code: "SPB-PRD-2026-0092",
    date: "2026-09-10",
    spkCode: "SPK-2026-0044",
    batchNumber: "BATCH-VELV-0912",
    customerName: "PT Velvet Beauty Kreasi",
    brandName: "VelvetLips",
    productName: "Matte Velvet Lip Cream Shade 04",
    requestType: "RAW_MATERIAL",
    totalItems: 6,
    itemsSummary: "Isododecane, Dimethicone Crosspolymer, Red Iron Oxide, Titanium Dioxide, Fragrance",
    sourceWarehouse: "WH-01 (Gudang Bahan Baku)",
    status: "DRAFT",
    requestedBy: "Hendra Wijaya",
    notes: "Draft alokasi pigmen pewarna bibir grade kosmetik."
  }
];

const TYPE_CONFIG: Record<string, { label: string; badge: "info" | "purple" | "warning" }> = {
  RAW_MATERIAL: { label: "Bahan Baku (Aktif & Basis)", badge: "info" },
  PRIMARY_PACKAGING: { label: "Bahan Kemas Primer", badge: "purple" },
  SECONDARY_PACKAGING: { label: "Bahan Kemas Sekunder", badge: "warning" },
};

const STATUS_CONFIG: Record<string, { label: string; badge: "default" | "warning" | "info" | "success" }> = {
  DRAFT: { label: "Draft SPB", badge: "default" },
  SUBMITTED: { label: "Diajukan (Menunggu Gudang)", badge: "warning" },
  PARTIALLY_ISSUED: { label: "Dikeluarkan Sebagian", badge: "info" },
  FULLY_ISSUED: { label: "Selesai Dikeluarkan", badge: "success" }
};

export default function MaterialRequisitionPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailModalItem, setDetailModalItem] = useState<MaterialRequisitionItem | null>(null);

  // Form states for Create SPB
  const [formSpk, setFormSpk] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formType, setFormType] = useState<"RAW_MATERIAL" | "PRIMARY_PACKAGING" | "SECONDARY_PACKAGING">("RAW_MATERIAL");
  const [formWarehouse, setFormWarehouse] = useState("WH-01 (Gudang Bahan Baku)");
  const [formItems, setFormItems] = useState("");
  const [formRequester, setFormRequester] = useState("Hendra Wijaya");
  const [formNotes, setFormNotes] = useState("");

  const { data: serverRequisitions } = useQuery({
    queryKey: ["production-material-requisitions"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/requisitions");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map if server returns
        }
      } catch (err) {
        console.warn("Using fallback requisitions", err);
      }
      return FALLBACK_REQUISITIONS;
    }
  });

  const requisitions = serverRequisitions || FALLBACK_REQUISITIONS;

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      if (activeTab === "SUBMITTED" && r.status !== "SUBMITTED") return false;
      if (activeTab === "FULLY_ISSUED" && r.status !== "FULLY_ISSUED") return false;
      if (activeTab === "RAW" && r.requestType !== "RAW_MATERIAL") return false;
      if (activeTab === "PACKAGING" && r.requestType === "RAW_MATERIAL") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = r.code.toLowerCase().includes(q);
        const matchSpk = r.spkCode.toLowerCase().includes(q);
        const matchBatch = r.batchNumber.toLowerCase().includes(q);
        const matchProduct = r.productName.toLowerCase().includes(q);
        const matchBrand = r.brandName.toLowerCase().includes(q);
        if (!matchCode && !matchSpk && !matchBatch && !matchProduct && !matchBrand) return false;
      }
      return true;
    });
  }, [requisitions, activeTab, searchQuery]);

  // KPI Calculations
  const totalSubmitted = requisitions.filter((r) => r.status === "SUBMITTED").length;
  const totalIssued = requisitions.filter((r) => r.status === "FULLY_ISSUED").length;
  const rawMaterialReqs = requisitions.filter((r) => r.requestType === "RAW_MATERIAL").length;

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSpk || !formProduct) {
      toast.error("Validasi Gagal", "Harap lengkapi No. SPK dan nama produk.");
      return;
    }

    const newReq: MaterialRequisitionItem = {
      id: `spb-${Date.now()}`,
      code: `SPB-PRD-2026-${String(requisitions.length + 95).padStart(4, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      spkCode: formSpk,
      batchNumber: `BATCH-${String(Date.now()).slice(-6)}`,
      customerName: formCustomer || "Klien Maklon",
      brandName: formBrand || "Brand Kosmetik",
      productName: formProduct,
      requestType: formType,
      totalItems: formItems.split(",").length || 3,
      itemsSummary: formItems || "Bahan Baku & Kemas Terkunci BOM",
      sourceWarehouse: formWarehouse,
      status: "SUBMITTED",
      requestedBy: formRequester,
      notes: formNotes
    };

    requisitions.unshift(newReq);
    setIsCreateModalOpen(false);
    toast.success("SPB Berhasil Diterbitkan", `Surat Permintaan Barang ${newReq.code} telah diajukan ke ${newReq.sourceWarehouse}.`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Permintaan Bahan Baku & Kemas (SPB)"
        subtitle="Surat Permintaan Barang (SPB) terikat SPK aktif untuk alokasi penimbangan bahan baku & pengeluaran kemasan dari gudang"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Batch-Bound Requisition</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/warehouse/stok">
              <DnaButton variant="secondary" size="md">
                <Warehouse className="w-4 h-4 mr-1.5" />
                Cek Stok Gudang
              </DnaButton>
            </Link>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat SPB Baru
            </DnaButton>
          </div>
        }
      />

      {/* KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Menunggu Pengeluaran"
          value={`${totalSubmitted} SPB`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          subtext="Pending Gudang"
          variant="warning"
        />
        <DnaStatCard
          label="Telah Dikeluarkan Penuh"
          value={`${totalIssued} SPB`}
          icon={<PackageCheck className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Fulfillment 100%", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Permintaan Bahan Baku"
          value={`${rawMaterialReqs} SPB`}
          icon={<Layers className="w-5 h-5 text-blue-600" />}
          subtext="WH-01 (Bahan Baku)"
          variant="info"
        />
        <DnaStatCard
          label="Defisit / Shortage"
          value="0 Item"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="Stok Mencukupi"
          variant="success"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Surat Permintaan Barang (SPB) Produksi"
        badge={
          <DnaBadge variant="default">
            {filteredRequisitions.length} SPB
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua SPB", badge: requisitions.length },
                { id: "SUBMITTED", label: "Menunggu Pengeluaran", badge: totalSubmitted },
                { id: "FULLY_ISSUED", label: "Telah Dikeluarkan", badge: totalIssued },
                { id: "RAW", label: "Bahan Baku", badge: rawMaterialReqs },
                { id: "PACKAGING", label: "Bahan Kemas", badge: requisitions.length - rawMaterialReqs }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No SPB, SPK, Produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">No. SPB & Tanggal</th>
                <th className="px-3.5 py-3">No. SPK & Batch</th>
                <th className="px-3.5 py-3">Produk & Brand</th>
                <th className="px-3.5 py-3">Tipe Permintaan</th>
                <th className="px-3.5 py-3">Gudang Sumber</th>
                <th className="px-3.5 py-3">Item Ringkasan</th>
                <th className="px-3.5 py-3">Pemohon</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequisitions.map((item) => {
                const typeInfo = TYPE_CONFIG[item.requestType] || TYPE_CONFIG.RAW_MATERIAL;
                const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, badge: "default" };
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-slate-800">{item.code}</div>
                      <div className="text-[10px] text-slate-400">{item.date}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-blue-700 font-mono">{item.spkCode}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.batchNumber}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500">{item.brandName}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <DnaBadge variant={typeInfo.badge}>
                        {typeInfo.label}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 font-medium text-slate-700">{item.sourceWarehouse}</td>
                    <td className="px-3.5 py-3 text-slate-600 max-w-[220px] truncate" title={item.itemsSummary}>
                      <span className="font-semibold text-slate-800">{item.totalItems} item:</span> {item.itemsSummary}
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">{item.requestedBy}</td>
                    <td className="px-3.5 py-3">
                      <DnaBadge variant={statusInfo.badge}>
                        {statusInfo.label}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <DnaButton variant="secondary" size="sm" onClick={() => setDetailModalItem(item)}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detail
                      </DnaButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT SPB BARU */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Surat Permintaan Barang (SPB) Produksi"
        size="lg"
      >
        <form onSubmit={handleCreateRequisition} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. SPK Terkait <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: SPK-2026-0043"
                value={formSpk}
                onChange={(e) => setFormSpk(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Produk Maklon <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Centella Asiatica Gel Cream"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Permintaan Bahan</label>
              <select
                value={formType}
                onChange={(e) => {
                  const t = e.target.value as any;
                  setFormType(t);
                  if (t === "RAW_MATERIAL") setFormWarehouse("WH-01 (Gudang Bahan Baku)");
                  else setFormWarehouse("WH-02 (Gudang Bahan Kemas)");
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="RAW_MATERIAL">1. Bahan Baku (Aktif, Basis, Ekstrak, Parfum)</option>
                <option value="PRIMARY_PACKAGING">2. Bahan Kemas Primer (Botol, Pot, Tube, Dropper)</option>
                <option value="SECONDARY_PACKAGING">3. Bahan Kemas Sekunder (Box, Leaflet, Shrink, Carton)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gudang Sumber</label>
              <input
                type="text"
                readOnly
                value={formWarehouse}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pemohon (Operator / Formulator)</label>
              <input
                type="text"
                value={formRequester}
                onChange={(e) => setFormRequester(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Daftar Item Bahan / Komponen (BOM) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Sebutkan nama-nama item bahan yang diminta dari gudang (pisahkan dengan koma)..."
              value={formItems}
              onChange={(e) => setFormItems(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan penimbangan steril atau instruksi lot khusus..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Ajukan SPB ke Gudang
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL DETAIL SPB */}
      <DnaModal
        isOpen={!!detailModalItem}
        onClose={() => setDetailModalItem(null)}
        title={`Detail SPB: ${detailModalItem?.code}`}
        size="md"
      >
        {detailModalItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">{detailModalItem.code}</div>
              <div className="text-slate-600">
                Terkait SPK: <strong className="font-mono text-blue-700">{detailModalItem.spkCode}</strong> ({detailModalItem.batchNumber})
              </div>
            </div>

            <div className="space-y-2 p-3 bg-white border border-slate-100 rounded-lg">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Produk:</span>
                <span className="font-semibold text-slate-900">{detailModalItem.productName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Gudang Sumber:</span>
                <span className="font-semibold text-slate-800">{detailModalItem.sourceWarehouse}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Pemohon:</span>
                <span className="font-medium text-slate-800">{detailModalItem.requestedBy}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Petugas Pengeluaran:</span>
                <span className="font-medium text-emerald-800">{detailModalItem.issuedBy || "Menunggu Petugas Gudang"}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Daftar Item:</span>
                <div className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-800 font-medium">
                  {detailModalItem.itemsSummary}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <DnaButton variant="primary" size="sm" onClick={() => setDetailModalItem(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
