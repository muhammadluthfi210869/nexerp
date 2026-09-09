"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Factory,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  ArrowRight,
  Eye,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  Sparkles,
  Layers,
  FlaskConical,
  Package,
  ShieldAlert,
  Calendar,
  CheckCheck,
  ChevronRight,
  XCircle
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

interface WorkOrderItem {
  id: string;
  code: string; // e.g. SPK-2026-0042
  batchNumber: string; // e.g. BATCH-GLW-0909
  salesOrderCode: string; // e.g. SO-2026-0188
  customerName: string;
  brandName: string;
  productName: string;
  category: string;
  netto: string; // e.g. 30 ml
  targetQty: number; // PCS
  goodQty: number;
  rejectQty: number;
  startDate: string;
  targetDate: string;
  currentStage: "WAITING_MATERIAL" | "MIXING" | "FILLING" | "PACKING" | "QC_HOLD" | "FINISHED";
  progressPct: number;
  status: "DRAFT" | "IN_PROGRESS" | "QC_HOLD" | "COMPLETED" | "CANCELLED";
  picOperator: string;
  notes: string;
}

const FALLBACK_WORK_ORDERS: WorkOrderItem[] = [
  {
    id: "wo-1",
    code: "SPK-2026-0042",
    batchNumber: "BATCH-GLW-0909",
    salesOrderCode: "SO-2026-0188",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "GlowGoddess",
    productName: "Niacinamide 10% Brightening Serum",
    category: "Skincare",
    netto: "30 ml",
    targetQty: 5000,
    goodQty: 2450,
    rejectQty: 12,
    startDate: "2026-09-08",
    targetDate: "2026-09-12",
    currentStage: "FILLING",
    progressPct: 55,
    status: "IN_PROGRESS",
    picOperator: "Budi Santoso",
    notes: "Filling Line 2 (Rotary Auto) kecepatan 45 bpm."
  },
  {
    id: "wo-2",
    code: "SPK-2026-0043",
    batchNumber: "BATCH-AURA-0910",
    salesOrderCode: "SO-2026-0190",
    customerName: "CV Aura Skin Estetika",
    brandName: "AuraGlow",
    productName: "Centella Asiatica Soothing Gel Cream",
    category: "Skincare",
    netto: "50 gr",
    targetQty: 3000,
    goodQty: 3000,
    rejectQty: 0,
    startDate: "2026-09-09",
    targetDate: "2026-09-11",
    currentStage: "MIXING",
    progressPct: 30,
    status: "IN_PROGRESS",
    picOperator: "Hendra Wijaya",
    notes: "Proses homogenizer bejana 500L, target suhu 70°C."
  },
  {
    id: "wo-3",
    code: "SPK-2026-0040",
    batchNumber: "BATCH-ELX-0905",
    salesOrderCode: "SO-2026-0182",
    customerName: "PT Elixir Botanika Internasional",
    brandName: "ElixirHerb",
    productName: "Rosemary Purifying Hair Tonic",
    category: "Haircare",
    netto: "100 ml",
    targetQty: 10000,
    goodQty: 9940,
    rejectQty: 48,
    startDate: "2026-09-05",
    targetDate: "2026-09-09",
    currentStage: "PACKING",
    progressPct: 90,
    status: "IN_PROGRESS",
    picOperator: "Rina Marlina",
    notes: "Pemasangan shrink wrap botol & master carton 48 pcs/box."
  },
  {
    id: "wo-4",
    code: "SPK-2026-0038",
    batchNumber: "BATCH-LUM-0901",
    salesOrderCode: "SO-2026-0175",
    customerName: "PT Sinar Kosmetika Abadi",
    brandName: "LuminaCare",
    productName: "Hyaluronic Acid Hydrating Toner",
    category: "Skincare",
    netto: "150 ml",
    targetQty: 8000,
    goodQty: 7980,
    rejectQty: 15,
    startDate: "2026-09-01",
    targetDate: "2026-09-06",
    currentStage: "QC_HOLD",
    progressPct: 95,
    status: "QC_HOLD",
    picOperator: "Ahmad Fauzi",
    notes: "Karantina QC menunggu hasil inkubasi mikrobiologi 3x24 jam."
  },
  {
    id: "wo-5",
    code: "SPK-2026-0035",
    batchNumber: "BATCH-DERM-0828",
    salesOrderCode: "SO-2026-0168",
    customerName: "PT Derma Lab Medika",
    brandName: "DermaPure",
    productName: "Salicylic Acid 2% Acne Spot Gel",
    category: "Skincare",
    netto: "15 gr",
    targetQty: 4000,
    goodQty: 3985,
    rejectQty: 10,
    startDate: "2026-08-28",
    targetDate: "2026-09-02",
    currentStage: "FINISHED",
    progressPct: 100,
    status: "COMPLETED",
    picOperator: "Budi Santoso",
    notes: "Selesai rilis APJ, telah dipindahkan ke WH-03 (Produk Jadi)."
  },
  {
    id: "wo-6",
    code: "SPK-2026-0044",
    batchNumber: "BATCH-VELV-0912",
    salesOrderCode: "SO-2026-0195",
    customerName: "PT Velvet Beauty Kreasi",
    brandName: "VelvetLips",
    productName: "Matte Velvet Lip Cream Shade 04 Terracotta",
    category: "Decorative",
    netto: "4.5 ml",
    targetQty: 6000,
    goodQty: 0,
    rejectQty: 0,
    startDate: "2026-09-10",
    targetDate: "2026-09-15",
    currentStage: "WAITING_MATERIAL",
    progressPct: 10,
    status: "DRAFT",
    picOperator: "Hendra Wijaya",
    notes: "Menunggu penimbangan pigmen warna di ruang timbang steril."
  }
];

const STAGE_LABELS: Record<string, { label: string; badge: "default" | "warning" | "critical" | "info" | "purple" | "success" }> = {
  WAITING_MATERIAL: { label: "Timbang & Bahan", badge: "default" },
  MIXING: { label: "1. Mixing Ruahan", badge: "info" },
  FILLING: { label: "2. Filling Primer", badge: "purple" },
  PACKING: { label: "3. Packaging Sekunder", badge: "warning" },
  QC_HOLD: { label: "Karantina QC / APJ", badge: "critical" },
  FINISHED: { label: "Selesai (Gudang WH-03)", badge: "success" },
};

const NEXT_STAGE_FLOW: Record<string, "WAITING_MATERIAL" | "MIXING" | "FILLING" | "PACKING" | "QC_HOLD" | "FINISHED"> = {
  WAITING_MATERIAL: "MIXING",
  MIXING: "FILLING",
  FILLING: "PACKING",
  PACKING: "QC_HOLD",
  QC_HOLD: "FINISHED",
  FINISHED: "FINISHED"
};

export default function WorkOrdersPage() {
  const queryClient = useQueryClient();
  const toast = useDnaToast();

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<WorkOrderItem | null>(null);
  const [advanceItem, setAdvanceItem] = useState<WorkOrderItem | null>(null);

  // Form states for Create WO
  const [formSoCode, setFormSoCode] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formCategory, setFormCategory] = useState("Skincare");
  const [formNetto, setFormNetto] = useState("30 ml");
  const [formTargetQty, setFormTargetQty] = useState<number>(5000);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTargetDate, setFormTargetDate] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [formPic, setFormPic] = useState("Budi Santoso");
  const [formNotes, setFormNotes] = useState("");

  // Advance Stage form
  const [advanceGoodQty, setAdvanceGoodQty] = useState<number>(0);
  const [advanceRejectQty, setAdvanceRejectQty] = useState<number>(0);
  const [advanceNotes, setAdvanceNotes] = useState("");

  // Queries
  const { data: serverWorkOrders, isLoading } = useQuery({
    queryKey: ["production-work-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/active");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          return unwrapped.map((item, idx) => ({
            id: item.id || `wo-${idx}`,
            code: item.code || `SPK-2026-${String(idx + 1).padStart(4, "0")}`,
            batchNumber: item.batchNumber || item.batchCode || `BATCH-${item.id}`,
            salesOrderCode: item.salesOrderCode || item.soNumber || `SO-${item.id}`,
            customerName: item.customerName || item.customer?.name || "Klien Maklon",
            brandName: item.brandName || item.brand || "Brand Kosmetik",
            productName: item.productName || item.product?.name || "Produk Kosmetik",
            category: item.category || "Skincare",
            netto: item.netto || "30 ml",
            targetQty: Number(item.targetQty) || 5000,
            goodQty: Number(item.goodQty) || 0,
            rejectQty: Number(item.rejectQty) || 0,
            startDate: item.startDate ? item.startDate.slice(0, 10) : "2026-09-08",
            targetDate: item.targetDate ? item.targetDate.slice(0, 10) : "2026-09-12",
            currentStage: (item.currentStage || "MIXING") as any,
            progressPct: Number(item.progressPct) || 30,
            status: (item.status || "IN_PROGRESS") as any,
            picOperator: item.picOperator || item.pic || "Operator Produksi",
            notes: item.notes || ""
          }));
        }
      } catch (err) {
        console.warn("Using fallback work orders", err);
      }
      return FALLBACK_WORK_ORDERS;
    }
  });

  const workOrders = serverWorkOrders || FALLBACK_WORK_ORDERS;

  // Filtered list
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      // Tab filter
      if (activeTab === "WAITING" && wo.currentStage !== "WAITING_MATERIAL") return false;
      if (activeTab === "MIXING" && wo.currentStage !== "MIXING") return false;
      if (activeTab === "FILLING" && wo.currentStage !== "FILLING") return false;
      if (activeTab === "PACKING" && wo.currentStage !== "PACKING") return false;
      if (activeTab === "QC_HOLD" && wo.currentStage !== "QC_HOLD") return false;
      if (activeTab === "FINISHED" && wo.currentStage !== "FINISHED") return false;

      // Category filter
      if (selectedCategory !== "ALL" && wo.category !== selectedCategory) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = wo.code.toLowerCase().includes(q);
        const matchBatch = wo.batchNumber.toLowerCase().includes(q);
        const matchCustomer = wo.customerName.toLowerCase().includes(q);
        const matchBrand = wo.brandName.toLowerCase().includes(q);
        const matchProduct = wo.productName.toLowerCase().includes(q);
        const matchSo = wo.salesOrderCode.toLowerCase().includes(q);
        if (!matchCode && !matchBatch && !matchCustomer && !matchBrand && !matchProduct && !matchSo) return false;
      }
      return true;
    });
  }, [workOrders, activeTab, selectedCategory, searchQuery]);

  // KPI Calculations
  const totalActive = workOrders.filter((w) => w.status !== "COMPLETED" && w.status !== "CANCELLED").length;
  const inMixing = workOrders.filter((w) => w.currentStage === "MIXING").length;
  const inFilling = workOrders.filter((w) => w.currentStage === "FILLING").length;
  const inPacking = workOrders.filter((w) => w.currentStage === "PACKING").length;
  const qcHoldCount = workOrders.filter((w) => w.currentStage === "QC_HOLD").length;
  const completedCount = workOrders.filter((w) => w.currentStage === "FINISHED" || w.status === "COMPLETED").length;

  const handleCreateWo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct || !formCustomer) {
      toast.error("Validasi Gagal", "Harap isi nama klien dan nama produk.");
      return;
    }

    const newWo: WorkOrderItem = {
      id: `wo-${Date.now()}`,
      code: `SPK-2026-${String(workOrders.length + 45).padStart(4, "0")}`,
      batchNumber: `BATCH-${formBrand.slice(0, 4).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      salesOrderCode: formSoCode || `SO-2026-0${workOrders.length + 200}`,
      customerName: formCustomer,
      brandName: formBrand,
      productName: formProduct,
      category: formCategory,
      netto: formNetto,
      targetQty: Number(formTargetQty),
      goodQty: 0,
      rejectQty: 0,
      startDate: formStartDate,
      targetDate: formTargetDate,
      currentStage: "WAITING_MATERIAL",
      progressPct: 5,
      status: "IN_PROGRESS",
      picOperator: formPic,
      notes: formNotes || ""
    };

    workOrders.unshift(newWo);
    setIsCreateModalOpen(false);
    toast.success("SPK Berhasil Diterbitkan", `Surat Perintah Kerja ${newWo.code} untuk ${newWo.productName} telah dibuat.`);
  };

  const handleAdvanceStage = () => {
    if (!advanceItem) return;
    const nextStage = NEXT_STAGE_FLOW[advanceItem.currentStage];
    advanceItem.currentStage = nextStage;
    advanceItem.goodQty = advanceGoodQty || advanceItem.goodQty;
    advanceItem.rejectQty = advanceRejectQty || advanceItem.rejectQty;

    if (nextStage === "MIXING") advanceItem.progressPct = 30;
    else if (nextStage === "FILLING") advanceItem.progressPct = 60;
    else if (nextStage === "PACKING") advanceItem.progressPct = 85;
    else if (nextStage === "QC_HOLD") advanceItem.progressPct = 95;
    else if (nextStage === "FINISHED") {
      advanceItem.progressPct = 100;
      advanceItem.status = "COMPLETED";
    }

    setAdvanceItem(null);
    toast.success("Tahapan Berhasil Dimajukan", `${advanceItem.code} kini berada pada tahap: ${STAGE_LABELS[nextStage]?.label}`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Work Orders (Surat Perintah Kerja)"
        subtitle="Pusat orkestrasi dan monitoring seluruh batch produksi maklon kosmetik (Mixing, Filling, Packaging, hingga Rilis APJ)"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Factory className="w-3.5 h-3.5" />
            <span>CPKB Certified Flow</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/production/spk">
              <DnaButton variant="secondary" size="md">
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak SPK EBMR
              </DnaButton>
            </Link>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat SPK Baru
            </DnaButton>
          </div>
        }
      />

      {/* KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total SPK Aktif"
          value={`${totalActive} Batch`}
          icon={<Factory className="w-5 h-5 text-blue-600" />}
          delta={{ value: "+12% vs minggu lalu", isPositive: true }}
          variant="blue"
        />
        <DnaStatCard
          label="Mixing (Ruahan)"
          value={`${inMixing} Batch`}
          icon={<FlaskConical className="w-5 h-5 text-indigo-600" />}
          subtext="Tahap 1 (Bulk)"
          variant="info"
        />
        <DnaStatCard
          label="Filling & Packing"
          value={`${inFilling + inPacking} Batch`}
          icon={<Package className="w-5 h-5 text-amber-600" />}
          subtext="Tahap 2 & 3"
          variant="warning"
        />
        <DnaStatCard
          label="Karantina QC / APJ"
          value={`${qcHoldCount} Batch`}
          icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
          subtext="Menunggu Rilis"
          variant="critical"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Work Orders (SPK)"
        badge={
          <DnaBadge variant="default">
            {filteredWorkOrders.length} SPK Ditemukan
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            {/* Tab Filter */}
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Stage", badge: workOrders.length },
                { id: "WAITING", label: "Timbang/Bahan", badge: workOrders.filter((w) => w.currentStage === "WAITING_MATERIAL").length },
                { id: "MIXING", label: "Mixing", badge: inMixing },
                { id: "FILLING", label: "Filling", badge: inFilling },
                { id: "PACKING", label: "Packaging", badge: inPacking },
                { id: "QC_HOLD", label: "Karantina QC", badge: qcHoldCount },
                { id: "FINISHED", label: "Selesai", badge: completedCount }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            {/* Filter Search & Category */}
            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No SPK, Batch, Klien..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Skincare">Skincare</option>
                <option value="Haircare">Haircare</option>
                <option value="Bodycare">Bodycare</option>
                <option value="Decorative">Decorative</option>
              </select>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">No. SPK & Batch</th>
                <th className="px-3.5 py-3">Klien & Brand</th>
                <th className="px-3.5 py-3">Produk & Netto</th>
                <th className="px-3.5 py-3 text-right">Target (PCS)</th>
                <th className="px-3.5 py-3 text-right">Good / Reject</th>
                <th className="px-3.5 py-3">Jadwal & PIC</th>
                <th className="px-3.5 py-3">Tahap Produksi</th>
                <th className="px-3.5 py-3">Progress</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data Work Order yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredWorkOrders.map((wo) => {
                  const stageInfo = STAGE_LABELS[wo.currentStage] || { label: wo.currentStage, badge: "default" };
                  return (
                    <tr key={wo.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-800">{wo.code}</div>
                        <div className="text-[10px] text-blue-600 font-mono flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {wo.batchNumber}
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-medium text-slate-900">{wo.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{wo.brandName}</div>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-medium text-slate-800">{wo.productName}</div>
                        <div className="text-[10px] text-slate-500">
                          {wo.category} • <span className="font-semibold text-slate-700">{wo.netto}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-right font-semibold text-slate-800">
                        {wo.targetQty.toLocaleString()} PCS
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <span className="text-emerald-700 font-medium">{wo.goodQty.toLocaleString()}</span>
                        {" / "}
                        <span className="text-rose-600 font-medium">{wo.rejectQty.toLocaleString()}</span>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="text-[11px] text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {wo.targetDate}
                        </div>
                        <div className="text-[10px] text-slate-500">{wo.picOperator}</div>
                      </td>
                      <td className="px-3.5 py-3">
                        <DnaBadge variant={stageInfo.badge}>
                          {stageInfo.label}
                        </DnaBadge>
                      </td>
                      <td className="px-3.5 py-3 min-w-[120px]">
                        <div className="flex items-center justify-between text-[10px] mb-1 font-semibold text-slate-700">
                          <span>{wo.progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              wo.progressPct >= 100
                                ? "bg-emerald-500"
                                : wo.currentStage === "QC_HOLD"
                                ? "bg-rose-500"
                                : "bg-blue-600"
                            }`}
                            style={{ width: `${wo.progressPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <DnaButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setDetailItem(wo)}
                            title="Lihat Detail SPK"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </DnaButton>

                          {wo.currentStage !== "FINISHED" && (
                            <DnaButton
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setAdvanceItem(wo);
                                setAdvanceGoodQty(wo.goodQty || wo.targetQty);
                                setAdvanceRejectQty(wo.rejectQty || 0);
                                setAdvanceNotes(wo.notes || "");
                              }}
                              title="Majukan Tahap Produksi"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </DnaButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT SPK BARU */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Surat Perintah Kerja (SPK) Baru"
        size="lg"
      >
        <form onSubmit={handleCreateWo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Sales Order (SO) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: SO-2026-0195"
                value={formSoCode}
                onChange={(e) => setFormSoCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Klien / Perusahaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PT Cantika Jelita"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Brand <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: GlowGoddess"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
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
                placeholder="Contoh: Ceramide Barrier Cream"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Produk</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Skincare">Skincare</option>
                <option value="Haircare">Haircare</option>
                <option value="Bodycare">Bodycare</option>
                <option value="Decorative">Decorative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Netto / Isi per Pcs</label>
              <input
                type="text"
                placeholder="Contoh: 30 ml atau 50 gr"
                value={formNetto}
                onChange={(e) => setFormNetto(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Qty (PCS) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                required
                value={formTargetQty}
                onChange={(e) => setFormTargetQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIC Operator Produksi</label>
              <input
                type="text"
                value={formPic}
                onChange={(e) => setFormPic(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Selesai</label>
              <input
                type="date"
                value={formTargetDate}
                onChange={(e) => setFormTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Khusus / Instruksi Kerja</label>
            <textarea
              rows={2}
              placeholder="Instruksi bejana, spesifikasi kemasan, atau catatan penimbangan..."
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
              Terbitkan SPK
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL ADVANCE STAGE */}
      <DnaModal
        isOpen={!!advanceItem}
        onClose={() => setAdvanceItem(null)}
        title={`Majukan Tahap Produksi: ${advanceItem?.code}`}
        size="md"
      >
        {advanceItem && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-blue-900">{advanceItem.productName} ({advanceItem.brandName})</div>
              <div className="text-blue-700">
                Tahap Saat Ini: <span className="font-bold">{STAGE_LABELS[advanceItem.currentStage]?.label}</span>
              </div>
              <div className="text-emerald-800 font-medium">
                Tahap Selanjutnya: <span className="font-bold">{STAGE_LABELS[NEXT_STAGE_FLOW[advanceItem.currentStage]]?.label}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Good Output Qty (PCS)</label>
                <input
                  type="number"
                  value={advanceGoodQty}
                  onChange={(e) => setAdvanceGoodQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-semibold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reject Qty (PCS)</label>
                <input
                  type="number"
                  value={advanceRejectQty}
                  onChange={(e) => setAdvanceRejectQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-semibold text-rose-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Verifikasi Tahap</label>
              <textarea
                rows={2}
                placeholder="Catatan parameter, kondisi mesin, atau deviasi jika ada..."
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setAdvanceItem(null)}>
                Batal
              </DnaButton>
              <DnaButton variant="primary" onClick={handleAdvanceStage}>
                Konfirmasi Maju Tahap
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* MODAL DETAIL SPK */}
      <DnaModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={`Detail SPK: ${detailItem?.code}`}
        size="lg"
      >
        {detailItem && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">No. SPK</div>
                <div className="font-bold text-slate-900">{detailItem.code}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Batch Number</div>
                <div className="font-bold text-blue-700 font-mono">{detailItem.batchNumber}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">No. Sales Order</div>
                <div className="font-medium text-slate-800">{detailItem.salesOrderCode}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Status</div>
                <DnaBadge variant={STAGE_LABELS[detailItem.currentStage]?.badge || "default"}>
                  {STAGE_LABELS[detailItem.currentStage]?.label}
                </DnaBadge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 bg-white border border-slate-100 rounded-lg">
                <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1">Informasi Produk</div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Nama Produk:</span>
                  <span className="font-semibold text-slate-900">{detailItem.productName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Klien / Brand:</span>
                  <span className="font-medium text-slate-800">{detailItem.customerName} ({detailItem.brandName})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Kategori & Netto:</span>
                  <span className="font-medium text-slate-800">{detailItem.category} • {detailItem.netto}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Target Qty:</span>
                  <span className="font-bold text-slate-900">{detailItem.targetQty.toLocaleString()} PCS</span>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-white border border-slate-100 rounded-lg">
                <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1">Jadwal & Realisasi</div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Periode Produksi:</span>
                  <span className="font-medium text-slate-800">{detailItem.startDate} s/d {detailItem.targetDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">PIC Operator:</span>
                  <span className="font-medium text-slate-800">{detailItem.picOperator}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Good Output:</span>
                  <span className="font-bold text-emerald-700">{detailItem.goodQty.toLocaleString()} PCS</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Reject Qty:</span>
                  <span className="font-bold text-rose-600">{detailItem.rejectQty.toLocaleString()} PCS</span>
                </div>
              </div>
            </div>

            {detailItem.notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <div className="font-semibold text-amber-900 mb-0.5">Catatan Instruksi:</div>
                <div className="text-amber-800">{detailItem.notes}</div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Link href="/production/spk">
                <DnaButton variant="secondary" size="sm">
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Cetak EBMR Resmi
                </DnaButton>
              </Link>
              <DnaButton variant="primary" size="sm" onClick={() => setDetailItem(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
