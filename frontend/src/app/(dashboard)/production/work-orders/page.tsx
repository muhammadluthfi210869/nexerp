"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Factory,
  Plus,
  ArrowRight,
  Eye,
  Printer,
  FileSpreadsheet,
  FlaskConical,
  Package,
  ShieldAlert,
  Calendar,
  Layers,
  CheckCircle2
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  DnaModal,
  DnaInput,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import Link from "next/link";

interface WorkOrderItem {
  id: string;
  code: string;
  batchNumber: string;
  salesOrderCode: string;
  customerName: string;
  brandName: string;
  productName: string;
  category: string;
  netto: string;
  targetQty: number;
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

const STAGE_LABELS: Record<string, { label: string; badge: "default" | "warning" | "critical" | "info" | "purple" | "success" }> = {
  WAITING_MATERIAL: { label: "Timbang Bahan", badge: "default" },
  MIXING: { label: "1. Mixing", badge: "info" },
  FILLING: { label: "2. Filling", badge: "purple" },
  PACKING: { label: "3. Packaging", badge: "warning" },
  QC_HOLD: { label: "Karantina QC", badge: "critical" },
  FINISHED: { label: "Selesai", badge: "success" },
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
  const toast = useDnaToast();

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<WorkOrderItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
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
            customerName: item.customerName || item.customer?.name || "PT Cantika Glow Nusantara",
            brandName: item.brandName || item.brand || "GlowAura",
            productName: item.productName || item.product?.name || "Brightening Serum 30ml",
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
        console.warn("Failed to fetch active work orders", err);
      }
      return [];
    }
  });

  const [localWorkOrders, setLocalWorkOrders] = useState<WorkOrderItem[]>([]);
  const workOrders = useMemo(() => {
    return [...localWorkOrders, ...(serverWorkOrders || [])];
  }, [localWorkOrders, serverWorkOrders]);

  // Filtered list
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (activeTab === "WAITING" && wo.currentStage !== "WAITING_MATERIAL") return false;
      if (activeTab === "MIXING" && wo.currentStage !== "MIXING") return false;
      if (activeTab === "FILLING" && wo.currentStage !== "FILLING") return false;
      if (activeTab === "PACKING" && wo.currentStage !== "PACKING") return false;
      if (activeTab === "QC_HOLD" && wo.currentStage !== "QC_HOLD") return false;
      if (activeTab === "FINISHED" && wo.currentStage !== "FINISHED") return false;

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
  }, [workOrders, activeTab, searchQuery]);

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

    setLocalWorkOrders([newWo, ...localWorkOrders]);
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
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Work Orders (Surat Perintah Kerja)"
        description="Pusat orkestrasi dan monitoring batch produksi maklon kosmetik (Mixing, Filling, Packaging, hingga Rilis APJ)."
        badge={<DnaBadge variant="neutral">CPKB-FLOW</DnaBadge>}
        breadcrumbs={[
          { label: "Produksi Pabrik", href: "/production" },
          { label: "Work Orders", href: "/production/work-orders" }
        ]}
        tabs={[
          { id: "ALL", label: `Semua (${workOrders.length})` },
          { id: "WAITING", label: "Timbang Bahan" },
          { id: "MIXING", label: `Mixing (${inMixing})` },
          { id: "FILLING", label: `Filling (${inFilling})` },
          { id: "PACKING", label: `Packing (${inPacking})` },
          { id: "QC_HOLD", label: `Karantina QC (${qcHoldCount})` },
          { id: "FINISHED", label: `Selesai (${completedCount})` }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/production/spk">
              <DnaButton variant="secondary">
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak SPK EBMR
              </DnaButton>
            </Link>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat SPK Baru
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL SPK AKTIF"
          value={`${totalActive} Batch`}
          icon={<Factory className="w-5 h-5 text-blue-600" />}
          subValue="Dalam Lini Produksi"
        />
        <DnaStatCard
          label="MIXING (RUAHAN)"
          value={`${inMixing} Batch`}
          icon={<FlaskConical className="w-5 h-5 text-indigo-600" />}
          subValue="Tahap 1 (Bulk Mixing)"
        />
        <DnaStatCard
          label="FILLING & PACKAGING"
          value={`${inFilling + inPacking} Batch`}
          icon={<Package className="w-5 h-5 text-amber-600" />}
          subValue="Tahap 2 & 3"
        />
        <DnaStatCard
          label="KARANTINA QC / APJ"
          value={`${qcHoldCount} Batch`}
          icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
          subValue="Menunggu Rilis Mutu"
        />
      </DnaKpiGrid>

      {/* 3. DataTable Card (Zero redundant title, zero horizontal scroll, max 6 cols) */}
      <DnaDataTableCard
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No. SPK, Batch, Klien, Brand, Produk..."
      >
        <div className="w-full">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-[18%]">No. SPK & Batch</DnaTh>
                <DnaTh className="py-3 px-4 w-[24%]">Klien & Brand</DnaTh>
                <DnaTh className="py-3 px-4 w-[24%]">Produk & Target</DnaTh>
                <DnaTh className="py-3 px-4 w-[14%]">Jadwal & PIC</DnaTh>
                <DnaTh className="py-3 px-4 w-[14%]">Tahap & Progress</DnaTh>
                <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data Work Orders...
                  </DnaTd>
                </DnaTableRow>
              ) : filteredWorkOrders.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    <Factory className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data Work Order yang sesuai dengan filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredWorkOrders.map((wo) => {
                  const stageInfo = STAGE_LABELS[wo.currentStage] || { label: wo.currentStage, badge: "default" };
                  return (
                    <DnaTableRow key={wo.id} className="hover:bg-slate-50/70 transition-colors">
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="tabular-nums text-xs font-bold text-slate-900 truncate">{wo.code}</p>
                        <p className="text-[11px] text-blue-600 tabular-nums flex items-center gap-1 truncate">
                          <Layers className="w-3 h-3 shrink-0" /> {wo.batchNumber}
                        </p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="font-semibold text-slate-900 text-xs truncate">{wo.customerName}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{wo.brandName}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="font-semibold text-slate-900 text-xs truncate">{wo.productName}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {wo.targetQty.toLocaleString()} Pcs • {wo.netto}
                        </p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="tabular-nums text-xs text-slate-700 truncate">{wo.targetDate}</p>
                        <p className="text-[11px] text-slate-400 truncate">{wo.picOperator}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <div className="flex items-center gap-1.5">
                          <DnaBadge variant={stageInfo.badge}>{stageInfo.label}</DnaBadge>
                        </div>
                        <p className="text-[10px] text-slate-500 tabular-nums mt-0.5 truncate">
                          {wo.progressPct}% • G:{wo.goodQty} R:{wo.rejectQty}
                        </p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDetailItem(wo);
                              setIsDetailDrawerOpen(true);
                            }}
                            title="Lihat Detail SPK"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </DnaButton>
                          {wo.currentStage !== "FINISHED" && (
                            <DnaButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAdvanceItem(wo);
                                setAdvanceGoodQty(wo.goodQty || wo.targetQty);
                                setAdvanceRejectQty(wo.rejectQty || 0);
                                setAdvanceNotes(wo.notes || "");
                              }}
                              title="Majukan Tahap Produksi"
                            >
                              <ArrowRight className="w-4 h-4 text-blue-600" />
                            </DnaButton>
                          )}
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  );
                })
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* 4. Modal Buat SPK Baru */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Surat Perintah Kerja (SPK) Baru"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateWo}>
              Terbitkan SPK
            </DnaButton>
          </div>
        }
      >
        <form onSubmit={handleCreateWo} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                No. Sales Order (SO) <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                placeholder="SO-2026-0195"
                value={formSoCode}
                onChange={(e) => setFormSoCode(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Nama Klien <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                placeholder="PT Cantika Jelita"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Nama Brand <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                placeholder="GlowGoddess"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Nama Produk Maklon <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                placeholder="Ceramide Barrier Cream"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Target Qty (PCS) <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                type="number"
                value={formTargetQty.toString()}
                onChange={(e) => setFormTargetQty(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Netto Kemasan</label>
              <DnaInput
                placeholder="30 ml"
                value={formNetto}
                onChange={(e) => setFormNetto(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Tanggal Mulai</label>
              <DnaInput
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Target Selesai</label>
              <DnaInput
                type="date"
                value={formTargetDate}
                onChange={(e) => setFormTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Instruksi Khusus</label>
            <DnaInput
              placeholder="Instruksi bejana, spesifikasi kemasan, atau catatan penimbangan..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
        </form>
      </DnaModal>

      {/* 5. Modal Majukan Tahap */}
      <DnaModal
        isOpen={!!advanceItem}
        onClose={() => setAdvanceItem(null)}
        title={`Majukan Tahap Produksi: ${advanceItem?.code}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setAdvanceItem(null)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleAdvanceStage}>
              Konfirmasi Maju Tahap
            </DnaButton>
          </div>
        }
      >
        {advanceItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
              <div className="font-semibold text-blue-900">{advanceItem.productName} ({advanceItem.brandName})</div>
              <div className="text-blue-700">
                Tahap Saat Ini: <span className="font-bold">{STAGE_LABELS[advanceItem.currentStage]?.label}</span>
              </div>
              <div className="text-emerald-800 font-medium">
                Tahap Selanjutnya: <span className="font-bold">{STAGE_LABELS[NEXT_STAGE_FLOW[advanceItem.currentStage]]?.label}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Good Output Qty (PCS)</label>
                <DnaInput
                  type="number"
                  value={advanceGoodQty.toString()}
                  onChange={(e) => setAdvanceGoodQty(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Reject Qty (PCS)</label>
                <DnaInput
                  type="number"
                  value={advanceRejectQty.toString()}
                  onChange={(e) => setAdvanceRejectQty(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Catatan Verifikasi Tahap</label>
              <DnaInput
                placeholder="Catatan parameter, kondisi mesin, atau deviasi jika ada..."
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </DnaModal>

      {/* 6. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={detailItem?.code || "Detail SPK"}
        subtitle={detailItem ? `${detailItem.productName} • ${detailItem.customerName}` : undefined}
        badge={detailItem ? <DnaBadge variant={STAGE_LABELS[detailItem.currentStage]?.badge || "default"}>{STAGE_LABELS[detailItem.currentStage]?.label}</DnaBadge> : undefined}
        tabs={[
          {
            id: "summary",
            label: "Ringkasan Batch",
            content: detailItem ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="tabular-nums font-bold text-slate-900">{detailItem.code}</span>
                    <span className="tabular-nums text-blue-600 font-semibold">{detailItem.batchNumber}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{detailItem.productName}</p>
                  <p className="text-slate-600">{detailItem.customerName} ({detailItem.brandName})</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Target Produksi</span>
                    <p className="tabular-nums font-bold text-slate-900 text-sm">{detailItem.targetQty.toLocaleString()} Pcs</p>
                    <span className="text-[10px] text-slate-400">Netto: {detailItem.netto}</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Output Saat Ini</span>
                    <p className="tabular-nums font-bold text-emerald-700 text-sm">{detailItem.goodQty.toLocaleString()} Pcs</p>
                    <span className="text-[10px] text-rose-500">Reject: {detailItem.rejectQty.toLocaleString()} Pcs</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 uppercase">Progress Pengerjaan</span>
                    <span className="tabular-nums font-bold text-blue-600">{detailItem.progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        detailItem.progressPct >= 100 ? "bg-emerald-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${detailItem.progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : null
          },
          {
            id: "schedule",
            label: "Jadwal & PIC",
            content: detailItem ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Mulai:</span>
                    <span className="tabular-nums font-bold text-slate-800">{detailItem.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Selesai:</span>
                    <span className="tabular-nums font-bold text-slate-800">{detailItem.targetDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PIC Operator:</span>
                    <span className="font-semibold text-slate-900">{detailItem.picOperator}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700">Catatan Khusus:</span>
                  <p className="text-slate-600">{detailItem.notes || "Tidak ada catatan instruksi."}</p>
                </div>
              </div>
            ) : null
          }
        ]}
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>
              Tutup
            </DnaButton>
            <Link href="/production/spk">
              <DnaButton variant="primary">
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Dokumen SPK
              </DnaButton>
            </Link>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
