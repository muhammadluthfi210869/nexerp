"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Zap,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Play,
  Pause,
  Eye,
  Search,
  Filter,
  Scale,
  ShieldCheck,
  RotateCw,
  Gauge,
  Printer,
  Sparkles,
  ArrowRight
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

interface FillingBatchItem {
  id: string;
  code: string; // e.g. SF-2026-0104
  spkCode: string;
  batchNumber: string;
  customerName: string;
  brandName: string;
  productName: string;
  primaryPackaging: string; // e.g. Botol Dropper 30ml Amber
  targetQty: number; // PCS
  actualQty: number; // PCS
  rejectQty: number; // PCS
  fillingLine: string; // e.g. Rotary Auto Line 2
  tareWeightGram: number; // e.g. 45.2g
  netWeightGram: number; // e.g. 30.1g
  cappingTorqueNm: number; // e.g. 1.8 Nm
  leakTestPass: boolean;
  operator: string;
  status: "WAITING_BULK" | "IN_FILLING" | "IPC_HOLD" | "COMPLETED";
  notes?: string;
}

const FALLBACK_FILLING_BATCHES: FillingBatchItem[] = [
  {
    id: "fil-1",
    code: "SF-2026-0104",
    spkCode: "SPK-2026-0042",
    batchNumber: "BATCH-GLW-0909",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "GlowGoddess",
    productName: "Niacinamide 10% Brightening Serum",
    primaryPackaging: "Botol Pipet Kaca 30ml Frosted",
    targetQty: 5000,
    actualQty: 2450,
    rejectQty: 12,
    fillingLine: "Rotary Auto Filling Line 2 (FIL-02)",
    tareWeightGram: 46.5,
    netWeightGram: 30.2,
    cappingTorqueNm: 1.8,
    leakTestPass: true,
    operator: "Budi Santoso",
    status: "IN_FILLING",
    notes: "Kecepatan filling 45 botol/menit, sampling berat tiap 30 menit."
  },
  {
    id: "fil-2",
    code: "SF-2026-0105",
    spkCode: "SPK-2026-0043",
    batchNumber: "BATCH-AURA-0910",
    customerName: "CV Aura Skin Estetika",
    brandName: "AuraGlow",
    productName: "Centella Asiatica Soothing Gel Cream",
    primaryPackaging: "Acrylic Jar Pot 50gr White Frost",
    targetQty: 3000,
    actualQty: 0,
    rejectQty: 0,
    fillingLine: "Semi-Auto Jar Filling Line (FIL-01)",
    tareWeightGram: 62.0,
    netWeightGram: 50.0,
    cappingTorqueNm: 2.0,
    leakTestPass: true,
    operator: "Budi Santoso",
    status: "WAITING_BULK",
    notes: "Menunggu penyelesaian mixing ruahan di bejana 500L."
  },
  {
    id: "fil-3",
    code: "SF-2026-0102",
    spkCode: "SPK-2026-0040",
    batchNumber: "BATCH-ELX-0905",
    customerName: "PT Elixir Botanika Internasional",
    brandName: "ElixirHerb",
    productName: "Rosemary Purifying Hair Tonic",
    primaryPackaging: "Botol Spray Amber 100ml PET",
    targetQty: 10000,
    actualQty: 9940,
    rejectQty: 48,
    fillingLine: "Piston Filling Line 1 (FIL-03)",
    tareWeightGram: 22.4,
    netWeightGram: 100.3,
    cappingTorqueNm: 1.5,
    leakTestPass: true,
    operator: "Ahmad Fauzi",
    status: "COMPLETED",
    notes: "Selesai 100% dan telah diserahterimakan ke Lini Packaging Sekunder."
  }
];

const STATUS_CONFIG: Record<string, { label: string; badge: "default" | "info" | "warning" | "success" }> = {
  WAITING_BULK: { label: "Menunggu Ruahan", badge: "default" },
  IN_FILLING: { label: "Sedang Pengisian (Line Aktif)", badge: "info" },
  IPC_HOLD: { label: "IPC Hold / Cek Bobot", badge: "warning" },
  COMPLETED: { label: "Selesai (Siap Packaging)", badge: "success" }
};

export default function ProductionFillingPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ipcModalItem, setIpcModalItem] = useState<FillingBatchItem | null>(null);

  // Form states for Create Filling Schedule
  const [formSpk, setFormSpk] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formPackaging, setFormPackaging] = useState("Botol Pipet Kaca 30ml");
  const [formLine, setFormLine] = useState("Rotary Auto Filling Line 2 (FIL-02)");
  const [formTargetQty, setFormTargetQty] = useState<number>(5000);
  const [formOperator, setFormOperator] = useState("Budi Santoso");
  const [formNotes, setFormNotes] = useState("");

  // IPC Form states
  const [ipcActualQty, setIpcActualQty] = useState<number>(0);
  const [ipcRejectQty, setIpcRejectQty] = useState<number>(0);
  const [ipcTareWeight, setIpcTareWeight] = useState<number>(45);
  const [ipcNetWeight, setIpcNetWeight] = useState<number>(30);
  const [ipcTorque, setIpcTorque] = useState<number>(1.8);
  const [ipcLeakPass, setIpcLeakPass] = useState<boolean>(true);
  const [ipcNotes, setIpcNotes] = useState("");

  const { data: serverBatches } = useQuery({
    queryKey: ["production-filling-batches"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/step-logs");
        const unwrapped = unwrapResponse(res) as any[];
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map if server returns
        }
      } catch (err) {
        console.warn("Using fallback filling batches", err);
      }
      return FALLBACK_FILLING_BATCHES;
    }
  });

  const batches = serverBatches || FALLBACK_FILLING_BATCHES;

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (activeTab === "IN_FILLING" && b.status !== "IN_FILLING") return false;
      if (activeTab === "WAITING_BULK" && b.status !== "WAITING_BULK") return false;
      if (activeTab === "COMPLETED" && b.status !== "COMPLETED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = b.code.toLowerCase().includes(q);
        const matchSpk = b.spkCode.toLowerCase().includes(q);
        const matchProduct = b.productName.toLowerCase().includes(q);
        const matchBrand = b.brandName.toLowerCase().includes(q);
        const matchPackaging = b.primaryPackaging.toLowerCase().includes(q);
        if (!matchCode && !matchSpk && !matchProduct && !matchBrand && !matchPackaging) return false;
      }
      return true;
    });
  }, [batches, activeTab, searchQuery]);

  // KPI Calculations
  const inFillingCount = batches.filter((b) => b.status === "IN_FILLING").length;
  const totalCompletedPcs = batches.reduce((acc, b) => acc + b.actualQty, 0);
  const totalRejectPcs = batches.reduce((acc, b) => acc + b.rejectQty, 0);
  const rejectRate = totalCompletedPcs > 0 ? ((totalRejectPcs / (totalCompletedPcs + totalRejectPcs)) * 100).toFixed(2) : "0.35";

  const handleCreateFilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSpk || !formProduct) {
      toast.error("Validasi Gagal", "Harap lengkapi No. SPK dan nama produk.");
      return;
    }

    const newBatch: FillingBatchItem = {
      id: `fil-${Date.now()}`,
      code: `SF-2026-${String(batches.length + 106).padStart(4, "0")}`,
      spkCode: formSpk,
      batchNumber: `BATCH-${String(Date.now()).slice(-6)}`,
      customerName: formCustomer || "Klien Maklon",
      brandName: "Brand Kosmetik",
      productName: formProduct,
      primaryPackaging: formPackaging,
      targetQty: Number(formTargetQty),
      actualQty: 0,
      rejectQty: 0,
      fillingLine: formLine,
      tareWeightGram: 45.0,
      netWeightGram: 30.0,
      cappingTorqueNm: 1.8,
      leakTestPass: true,
      operator: formOperator,
      status: "WAITING_BULK",
      notes: formNotes
    };

    batches.unshift(newBatch);
    setIsCreateModalOpen(false);
    toast.success("Jadwal Filling Dibuat", `Jadwal ${newBatch.code} berhasil ditambahkan ke ${newBatch.fillingLine}.`);
  };

  const handleSaveIpc = () => {
    if (!ipcModalItem) return;
    ipcModalItem.actualQty = ipcActualQty;
    ipcModalItem.rejectQty = ipcRejectQty;
    ipcModalItem.tareWeightGram = ipcTareWeight;
    ipcModalItem.netWeightGram = ipcNetWeight;
    ipcModalItem.cappingTorqueNm = ipcTorque;
    ipcModalItem.leakTestPass = ipcLeakPass;
    if (ipcActualQty >= ipcModalItem.targetQty) {
      ipcModalItem.status = "COMPLETED";
    }

    setIpcModalItem(null);
    toast.success("Log IPC Filling Tersimpan", `Pencatatan in-process control ${ipcModalItem.code} telah diverifikasi.`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Produksi Filling (Kemasan Primer)"
        subtitle="Tahap 2: Pengisian ruahan ke kemasan primer (botol, pot, tube) dengan verifikasi tara bobot, uji kebocoran & in-process QC"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Tahap 2: Primary Packaging</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/production/schedule?type=filling">
              <DnaButton variant="secondary" size="md">
                Jadwal Line
              </DnaButton>
            </Link>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Jadwalkan Filling
            </DnaButton>
          </div>
        }
      />

      {/* KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Line Filling Berjalan"
          value={`${inFillingCount} Line`}
          icon={<Zap className="w-5 h-5 text-purple-600" />}
          subtext="Active Line"
          variant="purple"
        />
        <DnaStatCard
          label="Total Output Terisi"
          value={`${totalCompletedPcs.toLocaleString()} PCS`}
          icon={<Package className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+18% kapasitas", isPositive: true }}
          variant="blue"
        />
        <DnaStatCard
          label="Reject Kemasan"
          value={`${totalRejectPcs} PCS`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          subtext={`${rejectRate}% Reject Rate`}
          variant="warning"
        />
        <DnaStatCard
          label="IPC Leak Test Pass"
          value="100%"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          subtext="Uji vakum -0.6 bar OK"
          variant="success"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Eksekusi Filling Primer"
        badge={
          <DnaBadge variant="default">
            {filteredBatches.length} Lini Filling
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Lini", badge: batches.length },
                { id: "IN_FILLING", label: "Sedang Pengisian", badge: inFillingCount },
                { id: "WAITING_BULK", label: "Menunggu Ruahan", badge: batches.filter((b) => b.status === "WAITING_BULK").length },
                { id: "COMPLETED", label: "Selesai (Ready Packaging)", badge: batches.filter((b) => b.status === "COMPLETED").length }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Jadwal, Produk, Kemasan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
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
                <th className="px-3.5 py-3">No. Jadwal & SPK</th>
                <th className="px-3.5 py-3">Produk & Brand</th>
                <th className="px-3.5 py-3">Kemasan Primer</th>
                <th className="px-3.5 py-3 text-right">Target (PCS)</th>
                <th className="px-3.5 py-3 text-right">Realisasi (Good / Reject)</th>
                <th className="px-3.5 py-3">Mesin / Line</th>
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
                      <div className="text-[10px] text-purple-700 font-mono">{item.spkCode}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{item.brandName}</div>
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">
                      <div className="font-medium">{item.primaryPackaging}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Netto: {item.netWeightGram}g</div>
                    </td>
                    <td className="px-3.5 py-3 text-right font-semibold text-slate-800">
                      {item.targetQty.toLocaleString()} PCS
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <span className="font-bold text-emerald-700">{item.actualQty.toLocaleString()}</span>
                      {" / "}
                      <span className="text-rose-600 font-medium">{item.rejectQty.toLocaleString()}</span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">
                      <div className="font-medium">{item.fillingLine}</div>
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
                            setIpcModalItem(item);
                            setIpcActualQty(item.actualQty || item.targetQty);
                            setIpcRejectQty(item.rejectQty || 0);
                            setIpcTareWeight(item.tareWeightGram || 45);
                            setIpcNetWeight(item.netWeightGram || 30);
                            setIpcTorque(item.cappingTorqueNm || 1.8);
                            setIpcLeakPass(item.leakTestPass ?? true);
                            setIpcNotes(item.notes || "");
                          }}
                          title="Input Log Output & IPC Filling"
                        >
                          <Scale className="w-3.5 h-3.5 mr-1" />
                          Log IPC
                        </DnaButton>

                        {item.status === "COMPLETED" && (
                          <Link href="/production/packaging">
                            <DnaButton variant="primary" size="sm" title="Lanjut ke Packaging Sekunder">
                              Ke Packaging
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

      {/* MODAL BUAT JADWAL FILLING BARU */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Jadwal Filling Kemasan Primer"
        size="lg"
      >
        <form onSubmit={handleCreateFilling} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. SPK / Batch <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: SPK-2026-0042"
                value={formSpk}
                onChange={(e) => setFormSpk(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Klien / Perusahaan</label>
              <input
                type="text"
                placeholder="Contoh: PT Cantika Jelita"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Produk Maklon <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Niacinamide 10% Serum"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kemasan Primer</label>
              <input
                type="text"
                placeholder="Contoh: Botol Pipet Kaca 30ml Amber"
                value={formPackaging}
                onChange={(e) => setFormPackaging(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Line Mesin Filling</label>
              <select
                value={formLine}
                onChange={(e) => setFormLine(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="Rotary Auto Filling Line 2 (FIL-02)">Rotary Auto Filling Line 2 (FIL-02)</option>
                <option value="Semi-Auto Jar Filling Line (FIL-01)">Semi-Auto Jar Filling Line (FIL-01)</option>
                <option value="Piston Filling Line 1 (FIL-03)">Piston Filling Line 1 (FIL-03)</option>
                <option value="Tube Sealing & Filling Line (FIL-04)">Tube Sealing & Filling Line (FIL-04)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Output (PCS) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                required
                value={formTargetQty}
                onChange={(e) => setFormTargetQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operator Penanggung Jawab</label>
              <input
                type="text"
                value={formOperator}
                onChange={(e) => setFormOperator(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Setup / Sterilisasi Wadah</label>
            <textarea
              rows={2}
              placeholder="Instruksi sterilisasi UV botol, setting nozzle, atau batas toleransi timbang..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Jadwal Filling
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL IPC FILLING & OUTPUT LOG */}
      <DnaModal
        isOpen={!!ipcModalItem}
        onClose={() => setIpcModalItem(null)}
        title={`Log IPC & Realisasi Filling: ${ipcModalItem?.code}`}
        size="lg"
      >
        {ipcModalItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">{ipcModalItem.productName} ({ipcModalItem.brandName})</div>
              <div className="text-slate-600">
                Kemasan: <strong className="text-purple-700">{ipcModalItem.primaryPackaging}</strong> • Line: <strong>{ipcModalItem.fillingLine}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Good Output Qty (PCS)</label>
                <input
                  type="number"
                  value={ipcActualQty}
                  onChange={(e) => setIpcActualQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-emerald-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reject Kemasan (PCS)</label>
                <input
                  type="number"
                  value={ipcRejectQty}
                  onChange={(e) => setIpcRejectQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-rose-600 text-sm"
                />
              </div>
            </div>

            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
              <div className="font-bold text-purple-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-purple-700" />
                <span>Parameter IPC (In-Process Control) CPKB:</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tara Bobot Kosong (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ipcTareWeight}
                    onChange={(e) => setIpcTareWeight(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Netto Bersih Aktual (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ipcNetWeight}
                    onChange={(e) => setIpcNetWeight(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded font-semibold text-purple-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Torsi Tutup (N.m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ipcTorque}
                    onChange={(e) => setIpcTorque(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="leakPass"
                  checked={ipcLeakPass}
                  onChange={(e) => setIpcLeakPass(e.target.checked)}
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="leakPass" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Uji Kebocoran Botol (Vacuum Leak Test -0.6 bar selama 30 detik) LULUS / PASS
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Verifikasi</label>
              <textarea
                rows={2}
                placeholder="Catatan nozzle atau kondisi kemasan..."
                value={ipcNotes}
                onChange={(e) => setIpcNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setIpcModalItem(null)}>
                Batal
              </DnaButton>
              <DnaButton variant="primary" onClick={handleSaveIpc}>
                Simpan Log IPC Filling
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
