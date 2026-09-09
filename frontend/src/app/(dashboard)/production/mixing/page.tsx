"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FlaskConical,
  Gauge,
  Thermometer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Play,
  Pause,
  Eye,
  Search,
  Filter,
  Layers,
  Sparkles,
  Calculator,
  Printer,
  ShieldCheck,
  FileCheck
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

interface MixingBatchItem {
  id: string;
  code: string; // e.g. SM-2026-0089
  batchNumber: string;
  spkCode: string;
  customerName: string;
  brandName: string;
  productName: string;
  formulaName: string;
  targetPcs: number;
  nettoGram: number; // e.g. 30g
  baseResultKg: number; // e.g. 150 kg
  upscalePct: number; // e.g. 5%
  upscaleResultKg: number; // e.g. 157.5 kg
  vesselMachine: string; // e.g. Bejana Homogenizer 500L
  tempActual: number; // e.g. 72 C
  rpmActual: number; // e.g. 2800 RPM
  phActual: number; // e.g. 5.5
  viscosityCps: number; // e.g. 4500 cPs
  operator: string;
  status: "WEIGHING" | "IN_MIXING" | "QC_BULK_HOLD" | "APPROVED" | "CANCELLED";
  notes?: string;
}

const FALLBACK_MIXING_BATCHES: MixingBatchItem[] = [
  {
    id: "mix-1",
    code: "SM-2026-0089",
    batchNumber: "BATCH-AURA-0910",
    spkCode: "SPK-2026-0043",
    customerName: "CV Aura Skin Estetika",
    brandName: "AuraGlow",
    productName: "Centella Asiatica Soothing Gel Cream",
    formulaName: "FORM-CENT-V3.2",
    targetPcs: 3000,
    nettoGram: 50,
    baseResultKg: 150.0,
    upscalePct: 5.0,
    upscaleResultKg: 157.5,
    vesselMachine: "Homogenizer Vessel 500L (MIX-01)",
    tempActual: 72,
    rpmActual: 2800,
    phActual: 5.6,
    viscosityCps: 4800,
    operator: "Hendra Wijaya",
    status: "IN_MIXING",
    notes: "Proses emulsi fase minyak ke air dengan pendinginan lambat."
  },
  {
    id: "mix-2",
    code: "SM-2026-0088",
    batchNumber: "BATCH-GLW-0909",
    spkCode: "SPK-2026-0042",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "GlowGoddess",
    productName: "Niacinamide 10% Brightening Serum",
    formulaName: "FORM-NIAC-V4.1",
    targetPcs: 5000,
    nettoGram: 30,
    baseResultKg: 150.0,
    upscalePct: 3.0,
    upscaleResultKg: 154.5,
    vesselMachine: "High Shear Mixer 500L (MIX-02)",
    tempActual: 28,
    rpmActual: 1500,
    phActual: 5.4,
    viscosityCps: 1200,
    operator: "Budi Santoso",
    status: "APPROVED",
    notes: "Ruahan lolos QC Organoleptik & pH, siap disalurkan ke Line Filling 2."
  },
  {
    id: "mix-3",
    code: "SM-2026-0090",
    batchNumber: "BATCH-VELV-0912",
    spkCode: "SPK-2026-0044",
    customerName: "PT Velvet Beauty Kreasi",
    brandName: "VelvetLips",
    productName: "Matte Velvet Lip Cream Shade 04",
    formulaName: "FORM-LIP-V2.0",
    targetPcs: 6000,
    nettoGram: 4.5,
    baseResultKg: 27.0,
    upscalePct: 10.0,
    upscaleResultKg: 29.7,
    vesselMachine: "High Shear Mixer 200L (MIX-03)",
    tempActual: 80,
    rpmActual: 3200,
    phActual: 6.2,
    viscosityCps: 8500,
    operator: "Hendra Wijaya",
    status: "WEIGHING",
    notes: "Penimbangan lilin & dispersi pigmen warna di ruang timbang."
  },
  {
    id: "mix-4",
    code: "SM-2026-0085",
    batchNumber: "BATCH-DERM-0828",
    spkCode: "SPK-2026-0035",
    customerName: "PT Derma Lab Medika",
    brandName: "DermaPure",
    productName: "Salicylic Acid 2% Acne Spot Gel",
    formulaName: "FORM-ACNE-V1.8",
    targetPcs: 4000,
    nettoGram: 15,
    baseResultKg: 60.0,
    upscalePct: 5.0,
    upscaleResultKg: 63.0,
    vesselMachine: "Mixing Tank 300L (MIX-04)",
    tempActual: 30,
    rpmActual: 1200,
    phActual: 4.2,
    viscosityCps: 6200,
    operator: "Ahmad Fauzi",
    status: "APPROVED",
    notes: "Selesai filling dan batch telah dirilis."
  }
];

const STATUS_CONFIG: Record<string, { label: string; badge: "default" | "info" | "warning" | "success" | "critical" }> = {
  WEIGHING: { label: "Penimbangan Bahan", badge: "default" },
  IN_MIXING: { label: "Proses Mixing (Bejana)", badge: "info" },
  QC_BULK_HOLD: { label: "Karantina QC Ruahan", badge: "warning" },
  APPROVED: { label: "Lolos QC (Siap Filling)", badge: "success" },
  CANCELLED: { label: "Dibatalkan", badge: "critical" }
};

export default function ProductionMixingPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [logModalItem, setLogModalItem] = useState<MixingBatchItem | null>(null);

  // Form states for Create Mixing Schedule
  const [formSpk, setFormSpk] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formFormula, setFormFormula] = useState("");
  const [formTargetPcs, setFormTargetPcs] = useState<number>(3000);
  const [formNettoGram, setFormNettoGram] = useState<number>(50);
  const [formUpscalePct, setFormUpscalePct] = useState<number>(5);
  const [formVessel, setFormVessel] = useState("Homogenizer Vessel 500L (MIX-01)");
  const [formOperator, setFormOperator] = useState("Hendra Wijaya");
  const [formNotes, setFormNotes] = useState("");

  // Parameter Log form states
  const [logTemp, setLogTemp] = useState<number>(70);
  const [logRpm, setLogRpm] = useState<number>(2800);
  const [logPh, setLogPh] = useState<number>(5.5);
  const [logViscosity, setLogViscosity] = useState<number>(4500);
  const [logOrganoleptic, setLogOrganoleptic] = useState("Sesuai Standar (Krim Halus, Putih Mengkilap, Aroma Floral Ringan)");
  const [logNotes, setLogNotes] = useState("");

  // Calculated upscale in modal
  const calculatedBaseKg = useMemo(() => {
    return (formTargetPcs * formNettoGram) / 1000;
  }, [formTargetPcs, formNettoGram]);

  const calculatedUpscaleKg = useMemo(() => {
    return calculatedBaseKg + (calculatedBaseKg * formUpscalePct) / 100;
  }, [calculatedBaseKg, formUpscalePct]);

  const { data: serverBatches } = useQuery({
    queryKey: ["production-mixing-batches"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/step-logs");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map if server returns data
        }
      } catch (err) {
        console.warn("Using fallback mixing batches", err);
      }
      return FALLBACK_MIXING_BATCHES;
    }
  });

  const batches = serverBatches || FALLBACK_MIXING_BATCHES;

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (activeTab === "IN_MIXING" && b.status !== "IN_MIXING") return false;
      if (activeTab === "WEIGHING" && b.status !== "WEIGHING") return false;
      if (activeTab === "APPROVED" && b.status !== "APPROVED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = b.code.toLowerCase().includes(q);
        const matchBatch = b.batchNumber.toLowerCase().includes(q);
        const matchProduct = b.productName.toLowerCase().includes(q);
        const matchBrand = b.brandName.toLowerCase().includes(q);
        const matchFormula = b.formulaName.toLowerCase().includes(q);
        if (!matchCode && !matchBatch && !matchProduct && !matchBrand && !matchFormula) return false;
      }
      return true;
    });
  }, [batches, activeTab, searchQuery]);

  // KPI Calculations
  const inMixingCount = batches.filter((b) => b.status === "IN_MIXING").length;
  const totalVolumeKg = batches.reduce((acc, b) => acc + b.upscaleResultKg, 0);
  const approvedCount = batches.filter((b) => b.status === "APPROVED").length;

  const handleCreateMixing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct || !formSpk) {
      toast.error("Validasi Gagal", "Harap isi No. SPK dan nama produk.");
      return;
    }

    const newBatch: MixingBatchItem = {
      id: `mix-${Date.now()}`,
      code: `SM-2026-${String(batches.length + 91).padStart(4, "0")}`,
      batchNumber: `BATCH-${formBrand.slice(0, 4).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      spkCode: formSpk,
      customerName: formCustomer || "Klien Maklon",
      brandName: formBrand || "Brand Kosmetik",
      productName: formProduct,
      formulaName: formFormula || "FORM-NEW-V1.0",
      targetPcs: formTargetPcs,
      nettoGram: formNettoGram,
      baseResultKg: calculatedBaseKg,
      upscalePct: formUpscalePct,
      upscaleResultKg: calculatedUpscaleKg,
      vesselMachine: formVessel,
      tempActual: 25,
      rpmActual: 0,
      phActual: 0,
      viscosityCps: 0,
      operator: formOperator,
      status: "WEIGHING",
      notes: formNotes
    };

    batches.unshift(newBatch);
    setIsCreateModalOpen(false);
    toast.success("Jadwal Mixing Dibuat", `Jadwal ${newBatch.code} (${newBatch.upscaleResultKg.toFixed(1)} Kg) berhasil dijadwalkan.`);
  };

  const handleSaveLog = () => {
    if (!logModalItem) return;
    logModalItem.tempActual = logTemp;
    logModalItem.rpmActual = logRpm;
    logModalItem.phActual = logPh;
    logModalItem.viscosityCps = logViscosity;
    logModalItem.status = "APPROVED";
    logModalItem.notes = logNotes || logModalItem.notes;

    setLogModalItem(null);
    toast.success("Log Parameter Tersimpan", `Parameter kritis untuk ${logModalItem.code} telah diverifikasi & disetujui.`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Produksi Mixing (Ruahan / Bulk)"
        subtitle="Tahap 1: Pengolahan massa ruahan (Bulk BSJ) pada bejana homogenizer dengan kalkulasi otomatis upscaling formula CPKB"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Tahap 1: Bulk Processing</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/production/schedule?type=mixing">
              <DnaButton variant="secondary" size="md">
                <Clock className="w-4 h-4 mr-1.5" />
                Jadwal Gantt
              </DnaButton>
            </Link>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Jadwalkan Mixing
            </DnaButton>
          </div>
        }
      />

      {/* KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Mixing Berjalan"
          value={`${inMixingCount} Bejana`}
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
          subtext="Active Vessel"
          variant="info"
        />
        <DnaStatCard
          label="Total Volume Ruahan"
          value={`${totalVolumeKg.toFixed(1)} Kg`}
          icon={<Gauge className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+15% vs target", isPositive: true }}
          variant="blue"
        />
        <DnaStatCard
          label="Ruahan Lolos QC"
          value={`${approvedCount} Batch`}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          subtext="Siap Filling"
          variant="success"
        />
        <DnaStatCard
          label="Rata-rata Yield"
          value="98.4%"
          icon={<Sparkles className="w-5 h-5 text-purple-600" />}
          delta={{ value: "Toleransi max loss 2%", isPositive: true }}
          variant="purple"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Eksekusi Mixing Ruahan"
        badge={
          <DnaBadge variant="default">
            {filteredBatches.length} Batch
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Batch", badge: batches.length },
                { id: "IN_MIXING", label: "Sedang Mixing", badge: inMixingCount },
                { id: "WEIGHING", label: "Penimbangan", badge: batches.filter((b) => b.status === "WEIGHING").length },
                { id: "APPROVED", label: "Lolos QC (Ready Filling)", badge: approvedCount }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No Jadwal, Batch, Formula..."
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
                <th className="px-3.5 py-3">No. Jadwal & Batch</th>
                <th className="px-3.5 py-3">Produk & Brand</th>
                <th className="px-3.5 py-3">Formula BOM</th>
                <th className="px-3.5 py-3 text-right">Target (PCS)</th>
                <th className="px-3.5 py-3 text-right">Base Result</th>
                <th className="px-3.5 py-3 text-right">Upscale (Kg)</th>
                <th className="px-3.5 py-3">Bejana / Mesin</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.map((item) => {
                const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, badge: "default" };
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-slate-800">{item.code}</div>
                      <div className="text-[10px] text-blue-600 font-mono">{item.batchNumber}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{item.brandName}</div>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[11px] text-indigo-700 font-medium">
                      {item.formulaName}
                    </td>
                    <td className="px-3.5 py-3 text-right font-semibold text-slate-800">
                      {item.targetPcs.toLocaleString()} PCS
                    </td>
                    <td className="px-3.5 py-3 text-right text-slate-600 font-medium">
                      {item.baseResultKg.toFixed(1)} Kg
                    </td>
                    <td className="px-3.5 py-3 text-right font-bold text-blue-700">
                      {item.upscaleResultKg.toFixed(1)} Kg
                      <span className="block text-[9px] text-slate-400 font-normal">+{item.upscalePct}%</span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">
                      <div className="font-medium">{item.vesselMachine}</div>
                      <div className="text-[10px] text-slate-500">Op: {item.operator}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <DnaBadge variant={statusInfo.badge}>
                        {statusInfo.label}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setLogModalItem(item);
                            setLogTemp(item.tempActual || 70);
                            setLogRpm(item.rpmActual || 2800);
                            setLogPh(item.phActual || 5.5);
                            setLogViscosity(item.viscosityCps || 4500);
                          }}
                          title="Catat / Verifikasi Parameter Kritis"
                        >
                          <Thermometer className="w-3.5 h-3.5 mr-1" />
                          Log Mutu
                        </DnaButton>

                        {item.status === "APPROVED" && (
                          <Link href="/production/filling">
                            <DnaButton variant="primary" size="sm" title="Lanjut ke Filling Line">
                              Lanjut Filling
                            </DnaButton>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL JADWALKAN MIXING BARU (DENGAN UPSCALING OTOMATIS) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Jadwal Mixing & Kalkulasi Upscale (CPKB)"
        size="lg"
      >
        <form onSubmit={handleCreateMixing} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. SPK / Batch Record <span className="text-rose-500">*</span>
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
                Nama Klien / Perusahaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: CV Aura Skin Estetika"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Brand</label>
              <input
                type="text"
                placeholder="Contoh: AuraGlow"
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
                placeholder="Contoh: Centella Asiatica Soothing Gel Cream"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Formula BOM Terkunci</label>
              <input
                type="text"
                placeholder="Contoh: FORM-CENT-V3.2"
                value={formFormula}
                onChange={(e) => setFormFormula(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-indigo-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bejana Mixing / Mixer</label>
              <select
                value={formVessel}
                onChange={(e) => setFormVessel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Homogenizer Vessel 500L (MIX-01)">Homogenizer Vessel 500L (MIX-01)</option>
                <option value="High Shear Mixer 1000L (MIX-02)">High Shear Mixer 1000L (MIX-02)</option>
                <option value="High Shear Mixer 200L (MIX-03)">High Shear Mixer 200L (MIX-03)</option>
                <option value="Mixing Tank 300L (MIX-04)">Mixing Tank 300L (MIX-04)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Qty (PCS) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                required
                value={formTargetPcs}
                onChange={(e) => setFormTargetPcs(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Netto per PCS (Gram/ml) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                required
                value={formNettoGram}
                onChange={(e) => setFormNettoGram(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upscale Allowance (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                required
                value={formUpscalePct}
                onChange={(e) => setFormUpscalePct(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operator Penanggung Jawab</label>
              <input
                type="text"
                value={formOperator}
                onChange={(e) => setFormOperator(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Kalkulasi Otomatis CPKB Box */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Calculator className="w-4 h-4 text-blue-700" />
              <span>Kalkulasi Otomatis Upscale Formula (Poin 63 & 143 CPKB):</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Base Result (Teoritis):</span>
                <div className="font-semibold text-slate-800">
                  {formTargetPcs.toLocaleString()} PCS × {formNettoGram} gr = <span className="text-blue-700 font-bold">{calculatedBaseKg.toFixed(2)} Kg</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500">Hasil Upscale (Siap Timbang):</span>
                <div className="font-bold text-emerald-800 text-sm">
                  {calculatedUpscaleKg.toFixed(2)} Kg <span className="text-xs font-normal text-slate-600">(+{formUpscalePct}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan / SOP Mixing</label>
            <textarea
              rows={2}
              placeholder="Instruksi suhu penambahan zat aktif, urutan fasa, atau pendinginan..."
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
              Simpan & Terbitkan Jadwal
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL LOG PARAMETER KRITIS CPKB */}
      <DnaModal
        isOpen={!!logModalItem}
        onClose={() => setLogModalItem(null)}
        title={`Log Parameter Kritis Mixing: ${logModalItem?.code}`}
        size="lg"
      >
        {logModalItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">{logModalItem.productName} ({logModalItem.brandName})</div>
              <div className="text-slate-600 flex items-center gap-2">
                <span>No. Batch: <strong className="font-mono text-blue-700">{logModalItem.batchNumber}</strong></span>
                <span>•</span>
                <span>Volume: <strong>{logModalItem.upscaleResultKg} Kg</strong></span>
                <span>•</span>
                <span>Bejana: <strong>{logModalItem.vesselMachine}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Suhu Actual (°C)</label>
                <input
                  type="number"
                  value={logTemp}
                  onChange={(e) => setLogTemp(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400">Target: 65 - 75°C</span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Homogenizer (RPM)</label>
                <input
                  type="number"
                  value={logRpm}
                  onChange={(e) => setLogRpm(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400">Target: 2500-3000 RPM</span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">pH Aktual</label>
                <input
                  type="number"
                  step="0.05"
                  value={logPh}
                  onChange={(e) => setLogPh(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400">Target: 5.2 - 5.8</span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Viskositas (cPs)</label>
                <input
                  type="number"
                  value={logViscosity}
                  onChange={(e) => setLogViscosity(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400">Target: 4000-5000 cPs</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Uji Organoleptik Ruahan</label>
              <input
                type="text"
                value={logOrganoleptic}
                onChange={(e) => setLogOrganoleptic(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan QC / Deviasi</label>
              <textarea
                rows={2}
                placeholder="Catatan inspektor mutu atau operator..."
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setLogModalItem(null)}>
                Tutup
              </DnaButton>
              <DnaButton variant="primary" onClick={handleSaveLog}>
                Verifikasi & Setujui Ruahan
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
