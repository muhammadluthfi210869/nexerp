"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
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
  Boxes,
  ShieldCheck,
  Barcode,
  Printer,
  Sparkles,
  ArrowRight,
  ClipboardCheck
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

interface PackagingBatchItem {
  id: string;
  code: string; // e.g. SP-2026-0077
  spkCode: string;
  batchNumber: string;
  customerName: string;
  brandName: string;
  productName: string;
  secondaryComponents: string; // e.g. Inner Box, Leaflet, Hologram, Shrink, Master Box
  targetQty: number; // PCS
  actualQty: number; // PCS
  rejectBoxQty: number; // PCS
  masterCartonCount: number; // e.g. 208 Box (48 pcs/carton)
  packingLine: string; // e.g. Conveyor Line 1 + Shrink Tunnel
  expDatePrint: string; // e.g. 09/2029
  barcodeVerified: boolean;
  hologramApplied: boolean;
  operator: string;
  status: "QUEUED" | "IN_PACKING" | "READY_APJ" | "COMPLETED";
  notes?: string;
}

const FALLBACK_PACKAGING_BATCHES: PackagingBatchItem[] = [
  {
    id: "pck-1",
    code: "SP-2026-0077",
    spkCode: "SPK-2026-0040",
    batchNumber: "BATCH-ELX-0905",
    customerName: "PT Elixir Botanika Internasional",
    brandName: "ElixirHerb",
    productName: "Rosemary Purifying Hair Tonic",
    secondaryComponents: "Inner Box Hologram + Shrink Wrap + Master Box (48 pcs)",
    targetQty: 10000,
    actualQty: 9940,
    rejectBoxQty: 18,
    masterCartonCount: 207,
    packingLine: "Conveyor Line 1 + Shrink Tunnel (PCK-01)",
    expDatePrint: "09/2029",
    barcodeVerified: true,
    hologramApplied: true,
    operator: "Rina Marlina",
    status: "READY_APJ",
    notes: "Telah selesai packaging sekunder, siap diserahkan ke gerbang Rilis APJ."
  },
  {
    id: "pck-2",
    code: "SP-2026-0078",
    spkCode: "SPK-2026-0042",
    batchNumber: "BATCH-GLW-0909",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "GlowGoddess",
    productName: "Niacinamide 10% Brightening Serum",
    secondaryComponents: "Folding Box Emboss Gold + Leaflet + Shrink Film",
    targetQty: 5000,
    actualQty: 2400,
    rejectBoxQty: 8,
    masterCartonCount: 50,
    packingLine: "Manual Assembly Line (PCK-02)",
    expDatePrint: "09/2029",
    barcodeVerified: true,
    hologramApplied: true,
    operator: "Rina Marlina",
    status: "IN_PACKING",
    notes: "Proses pelipatan box & penempelan segel hologram QC maklon."
  },
  {
    id: "pck-3",
    code: "SP-2026-0079",
    spkCode: "SPK-2026-0043",
    batchNumber: "BATCH-AURA-0910",
    customerName: "CV Aura Skin Estetika",
    brandName: "AuraGlow",
    productName: "Centella Asiatica Soothing Gel Cream",
    secondaryComponents: "Inner Box Duplex + Spatula Plastik + Shrink Wrap",
    targetQty: 3000,
    actualQty: 0,
    rejectBoxQty: 0,
    masterCartonCount: 0,
    packingLine: "Conveyor Line 2 (PCK-03)",
    expDatePrint: "09/2029",
    barcodeVerified: false,
    hologramApplied: false,
    operator: "Rina Marlina",
    status: "QUEUED",
    notes: "Menunggu penyelesaian lini filling jar pot."
  }
];

const STATUS_CONFIG: Record<string, { label: string; badge: "default" | "warning" | "purple" | "success" }> = {
  QUEUED: { label: "Menunggu Lini Filling", badge: "default" },
  IN_PACKING: { label: "Sedang Packaging (Line Aktif)", badge: "warning" },
  READY_APJ: { label: "Selesai (Siap Rilis APJ)", badge: "purple" },
  COMPLETED: { label: "Selesai & Masuk Gudang", badge: "success" }
};

export default function ProductionPackagingPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [logModalItem, setLogModalItem] = useState<PackagingBatchItem | null>(null);

  // Form states for Create Packaging Schedule
  const [formSpk, setFormSpk] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formComponents, setFormComponents] = useState("Inner Box + Hologram + Shrink + Master Box");
  const [formLine, setFormLine] = useState("Conveyor Line 1 + Shrink Tunnel (PCK-01)");
  const [formTargetQty, setFormTargetQty] = useState<number>(5000);
  const [formExpDate, setFormExpDate] = useState("09/2029");
  const [formOperator, setFormOperator] = useState("Rina Marlina");
  const [formNotes, setFormNotes] = useState("");

  // Log Form states
  const [logActualQty, setLogActualQty] = useState<number>(0);
  const [logRejectBoxQty, setLogRejectBoxQty] = useState<number>(0);
  const [logMasterCartons, setLogMasterCartons] = useState<number>(0);
  const [logBarcodePass, setLogBarcodePass] = useState<boolean>(true);
  const [logHologramPass, setLogHologramPass] = useState<boolean>(true);
  const [logNotes, setLogNotes] = useState("");

  const { data: serverBatches } = useQuery({
    queryKey: ["production-packaging-batches"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/step-logs");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map if server returns
        }
      } catch (err) {
        console.warn("Using fallback packaging batches", err);
      }
      return FALLBACK_PACKAGING_BATCHES;
    }
  });

  const batches = serverBatches || FALLBACK_PACKAGING_BATCHES;

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (activeTab === "IN_PACKING" && b.status !== "IN_PACKING") return false;
      if (activeTab === "READY_APJ" && b.status !== "READY_APJ") return false;
      if (activeTab === "QUEUED" && b.status !== "QUEUED") return false;
      if (activeTab === "COMPLETED" && b.status !== "COMPLETED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = b.code.toLowerCase().includes(q);
        const matchSpk = b.spkCode.toLowerCase().includes(q);
        const matchProduct = b.productName.toLowerCase().includes(q);
        const matchBrand = b.brandName.toLowerCase().includes(q);
        if (!matchCode && !matchSpk && !matchProduct && !matchBrand) return false;
      }
      return true;
    });
  }, [batches, activeTab, searchQuery]);

  // KPI Calculations
  const inPackingCount = batches.filter((b) => b.status === "IN_PACKING").length;
  const readyApjCount = batches.filter((b) => b.status === "READY_APJ").length;
  const totalCompletedPcs = batches.reduce((acc, b) => acc + b.actualQty, 0);
  const totalCartons = batches.reduce((acc, b) => acc + b.masterCartonCount, 0);

  const handleCreatePackaging = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSpk || !formProduct) {
      toast.error("Validasi Gagal", "Harap lengkapi No. SPK dan nama produk.");
      return;
    }

    const newBatch: PackagingBatchItem = {
      id: `pck-${Date.now()}`,
      code: `SP-2026-${String(batches.length + 80).padStart(4, "0")}`,
      spkCode: formSpk,
      batchNumber: `BATCH-${String(Date.now()).slice(-6)}`,
      customerName: formCustomer || "Klien Maklon",
      brandName: "Brand Kosmetik",
      productName: formProduct,
      secondaryComponents: formComponents,
      targetQty: Number(formTargetQty),
      actualQty: 0,
      rejectBoxQty: 0,
      masterCartonCount: 0,
      packingLine: formLine,
      expDatePrint: formExpDate,
      barcodeVerified: false,
      hologramApplied: false,
      operator: formOperator,
      status: "QUEUED",
      notes: formNotes
    };

    batches.unshift(newBatch);
    setIsCreateModalOpen(false);
    toast.success("Jadwal Packaging Dibuat", `Jadwal ${newBatch.code} berhasil ditambahkan ke ${newBatch.packingLine}.`);
  };

  const handleSaveLog = () => {
    if (!logModalItem) return;
    logModalItem.actualQty = logActualQty;
    logModalItem.rejectBoxQty = logRejectBoxQty;
    logModalItem.masterCartonCount = logMasterCartons;
    logModalItem.barcodeVerified = logBarcodePass;
    logModalItem.hologramApplied = logHologramPass;
    if (logActualQty >= logModalItem.targetQty) {
      logModalItem.status = "READY_APJ";
    }

    setLogModalItem(null);
    toast.success("Log Packaging Selesai", `Batch ${logModalItem.code} siap diserahkan ke Gerbang Rilis APJ.`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Produksi Packaging (Kemasan Sekunder)"
        subtitle="Tahap 3: Finishing produk jadi (inner box, leaflet, hologram QC, shrink wrap, hingga master carton) sebelum Rilis APJ"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
            <Package className="w-3.5 h-3.5" />
            <span>Tahap 3: Secondary Packaging</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/quality/qc-release">
              <DnaButton variant="secondary" size="md">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Gerbang Rilis APJ
              </DnaButton>
            </Link>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Jadwalkan Packaging
            </DnaButton>
          </div>
        }
      />

      {/* KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Line Packaging Berjalan"
          value={`${inPackingCount} Line`}
          icon={<Package className="w-5 h-5 text-amber-600" />}
          subtext="Active Line"
          variant="warning"
        />
        <DnaStatCard
          label="Produk Jadi Selesai"
          value={`${totalCompletedPcs.toLocaleString()} PCS`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+24% finishing rate", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Master Carton Terisi"
          value={`${totalCartons} Carton`}
          icon={<Boxes className="w-5 h-5 text-indigo-600" />}
          subtext="Siap Pallet"
          variant="blue"
        />
        <DnaStatCard
          label="Menunggu Rilis APJ"
          value={`${readyApjCount} Batch`}
          icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
          subtext="Gate APJ"
          variant="purple"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Eksekusi Packaging Sekunder"
        badge={
          <DnaBadge variant="default">
            {filteredBatches.length} Lini Packaging
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Lini", badge: batches.length },
                { id: "IN_PACKING", label: "Sedang Packaging", badge: inPackingCount },
                { id: "READY_APJ", label: "Siap Rilis APJ", badge: readyApjCount },
                { id: "QUEUED", label: "Antrean (Menunggu Filling)", badge: batches.filter((b) => b.status === "QUEUED").length }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No Jadwal, SPK, Produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
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
                <th className="px-3.5 py-3">Komponen Sekunder</th>
                <th className="px-3.5 py-3 text-right">Target (PCS)</th>
                <th className="px-3.5 py-3 text-right">Good / Reject Box</th>
                <th className="px-3.5 py-3 text-right">Master Carton</th>
                <th className="px-3.5 py-3">Line / Meja</th>
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
                      <div className="text-[10px] text-amber-700 font-mono">{item.spkCode}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{item.brandName}</div>
                    </td>
                    <td className="px-3.5 py-3 text-slate-700 max-w-[200px] truncate" title={item.secondaryComponents}>
                      <div className="font-medium truncate">{item.secondaryComponents}</div>
                      <div className="text-[10px] text-slate-500">Exp: {item.expDatePrint}</div>
                    </td>
                    <td className="px-3.5 py-3 text-right font-semibold text-slate-800">
                      {item.targetQty.toLocaleString()} PCS
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <span className="font-bold text-emerald-700">{item.actualQty.toLocaleString()}</span>
                      {" / "}
                      <span className="text-rose-600 font-medium">{item.rejectBoxQty.toLocaleString()}</span>
                    </td>
                    <td className="px-3.5 py-3 text-right font-bold text-indigo-700">
                      {item.masterCartonCount} Box
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">
                      <div className="font-medium">{item.packingLine}</div>
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
                            setLogActualQty(item.actualQty || item.targetQty);
                            setLogRejectBoxQty(item.rejectBoxQty || 0);
                            setLogMasterCartons(item.masterCartonCount || Math.ceil(item.targetQty / 48));
                            setLogBarcodePass(item.barcodeVerified ?? true);
                            setLogHologramPass(item.hologramApplied ?? true);
                            setLogNotes(item.notes || "");
                          }}
                          title="Input Log Output Packaging"
                        >
                          <Boxes className="w-3.5 h-3.5 mr-1" />
                          Log Pack
                        </DnaButton>

                        {item.status === "READY_APJ" && (
                          <Link href="/quality/qc-release">
                            <DnaButton variant="primary" size="sm" title="Serahkan ke Rilis APJ">
                              Rilis APJ
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

      {/* MODAL BUAT JADWAL PACKAGING BARU */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Jadwal Packaging Kemasan Sekunder"
        size="lg"
      >
        <form onSubmit={handleCreatePackaging} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. SPK / Batch <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: SPK-2026-0040"
                value={formSpk}
                onChange={(e) => setFormSpk(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Klien / Perusahaan</label>
              <input
                type="text"
                placeholder="Contoh: PT Elixir Botanika"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Produk Maklon <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Purifying Hair Tonic"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Komponen Sekunder (BOM Kemas)</label>
              <input
                type="text"
                value={formComponents}
                onChange={(e) => setFormComponents(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Line / Meja Assembly</label>
              <select
                value={formLine}
                onChange={(e) => setFormLine(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Conveyor Line 1 + Shrink Tunnel (PCK-01)">Conveyor Line 1 + Shrink Tunnel (PCK-01)</option>
                <option value="Manual Assembly Line (PCK-02)">Manual Assembly Line (PCK-02)</option>
                <option value="Conveyor Line 2 (PCK-03)">Conveyor Line 2 (PCK-03)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Output Jadi (PCS) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                required
                value={formTargetQty}
                onChange={(e) => setFormTargetQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Format Exp Date Cetak</label>
              <input
                type="text"
                placeholder="Contoh: 09/2029"
                value={formExpDate}
                onChange={(e) => setFormExpDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operator PIC</label>
              <input
                type="text"
                value={formOperator}
                onChange={(e) => setFormOperator(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Khusus Packaging</label>
            <textarea
              rows={2}
              placeholder="Instruksi penempelan segel hologram, susunan carton, atau stiker barcode NA BPOM..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Jadwal Packaging
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL LOG PACKAGING & MASTER CARTON */}
      <DnaModal
        isOpen={!!logModalItem}
        onClose={() => setLogModalItem(null)}
        title={`Log Output Packaging & Finishing: ${logModalItem?.code}`}
        size="lg"
      >
        {logModalItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">{logModalItem.productName} ({logModalItem.brandName})</div>
              <div className="text-slate-600">
                Line: <strong>{logModalItem.packingLine}</strong> • Komponen: {logModalItem.secondaryComponents}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Good Output Jadi (PCS)</label>
                <input
                  type="number"
                  value={logActualQty}
                  onChange={(e) => setLogActualQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-emerald-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reject Box / Kemas (PCS)</label>
                <input
                  type="number"
                  value={logRejectBoxQty}
                  onChange={(e) => setLogRejectBoxQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-rose-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Master Carton Terisi</label>
                <input
                  type="number"
                  value={logMasterCartons}
                  onChange={(e) => setLogMasterCartons(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-indigo-700 text-sm"
                />
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-amber-700" />
                <span>Verifikasi Kemasan Sekunder Standar CPKB:</span>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logBarcodePass}
                    onChange={(e) => setLogBarcodePass(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-medium text-slate-800">Barcode NA BPOM & QR 2D dapat dipindai dengan jelas (Scan OK)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logHologramPass}
                    onChange={(e) => setLogHologramPass(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-medium text-slate-800">Segel Hologram Keaslian tertempel rapi di lidah penutup box</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan Operator</label>
              <textarea
                rows={2}
                placeholder="Catatan susunan pallet atau deviasi..."
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setLogModalItem(null)}>
                Batal
              </DnaButton>
              <DnaButton variant="primary" onClick={handleSaveLog}>
                Simpan & Serahkan ke Rilis APJ
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
