"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Eye,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Sparkles,
  Tag,
  Check,
  RotateCcw,
  FileText,
  DollarSign,
  Package
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

interface NpfSampleItem {
  id: string;
  npfCode: string;
  entryDate: string;
  clientName: string;
  brandName: string;
  productName: string;
  category: "SKINCARE" | "BODYCARE" | "HAIRCARE" | "DECORATIVE";
  categoryLabel: string;
  sampleType: "FREE_SAMPLE" | "PAID_SAMPLE";
  sampleFeeAmount: number; // Rp 0 for free, e.g. Rp 350.000 for paid
  benchmarkProduct: string;
  targetTexture: string;
  targetFragrance: string;
  keyActiveIngredients: string;
  targetNettoGram: number;
  targetHppPrice: number;
  busdevPic: string;
  formulatorPic: string;
  currentRevision: string; // Rev 1, Rev 2
  status: "QUEUE" | "LAB_TRIAL" | "READY_TO_SHIP" | "SHIPPED" | "FEEDBACK_REVIEW" | "APPROVED" | "REVISION_REQUESTED";
  statusLabel: string;
  trackingAwb?: string;
  clientFeedback?: string;
}

const MOCK_NPFS: NpfSampleItem[] = [
  {
    id: "npf-01",
    npfCode: "NPF-202603-001",
    entryDate: "2026-03-08",
    clientName: "PT Cantika Glow Nusantara",
    brandName: "GlowAura Skin",
    productName: "Serum Brightening Niacinamide 10% + Zinc PCA",
    category: "SKINCARE",
    categoryLabel: "Skincare (Serum)",
    sampleType: "FREE_SAMPLE",
    sampleFeeAmount: 0,
    benchmarkProduct: "The Ordinary Niacinamide 10% + Zinc 1%",
    targetTexture: "Watery gel ringan, cepat menyerap, non-sticky",
    targetFragrance: "Unscented (Tanpa pewangi)",
    keyActiveIngredients: "Niacinamide 10%, Zinc PCA 1%, Hyaluronic Acid",
    targetNettoGram: 30,
    targetHppPrice: 15000,
    busdevPic: "Sari Dewi",
    formulatorPic: "Apt. Dedi Kurniawan, S.Farm",
    currentRevision: "Rev 1",
    status: "LAB_TRIAL",
    statusLabel: "Proses Formulasi Lab"
  },
  {
    id: "npf-02",
    npfCode: "NPF-202603-002",
    entryDate: "2026-03-05",
    clientName: "CV Derma Estetika Mandiri",
    brandName: "DermaPure",
    productName: "Acne Spot Gel Centella + Salicylic Acid 2%",
    category: "SKINCARE",
    categoryLabel: "Skincare (Gel)",
    sampleType: "FREE_SAMPLE",
    sampleFeeAmount: 0,
    benchmarkProduct: "Skintific Salicylic Acid Acne Spot",
    targetTexture: "Clear gel transparan, sensasi cooling",
    targetFragrance: "Natural Tea Tree Essential Oil 0.1%",
    keyActiveIngredients: "Salicylic Acid 2%, Centella Asiatica 5%, Pionin",
    targetNettoGram: 15,
    targetHppPrice: 9500,
    busdevPic: "Sari Dewi",
    formulatorPic: "Dr. Maya Sp.KK",
    currentRevision: "Rev 1",
    status: "SHIPPED",
    statusLabel: "Sample Terkirim (Review Klien)",
    trackingAwb: "JNE88921102"
  },
  {
    id: "npf-03",
    npfCode: "NPF-202603-003",
    entryDate: "2026-03-01",
    clientName: "PT Miracle Beauty Lab",
    brandName: "MiracleSkin",
    productName: "Moisturizer Ceramide 5X Barrier Repair 50g",
    category: "SKINCARE",
    categoryLabel: "Skincare (Cream Gel)",
    sampleType: "PAID_SAMPLE",
    sampleFeeAmount: 350000,
    benchmarkProduct: "Skintific 5X Ceramide Barrier Moisture Gel",
    targetTexture: "Melting gel-cream, melembabkan tanpa berminyak",
    targetFragrance: "Fresh Rose Floral 0.2%",
    keyActiveIngredients: "5X Ceramide Complex, Marine Collagen, Centella",
    targetNettoGram: 50,
    targetHppPrice: 22000,
    busdevPic: "Rian Hendra",
    formulatorPic: "Apt. Siska Handayani, M.Farm",
    currentRevision: "Rev 2",
    status: "APPROVED",
    statusLabel: "Sample Disetujui (Lanjut SPK)",
    clientFeedback: "Tekstur dan kelembaban sempurna. Aroma pas, siap lanjut pendaftaran BPOM."
  }
];

export default function NpfSamplePage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNpf, setSelectedNpf] = useState<NpfSampleItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Form State (SCR-123)
  const [createForm, setCreateForm] = useState({
    clientName: "",
    brandName: "",
    productName: "",
    category: "SKINCARE",
    sampleType: "FREE_SAMPLE" as "FREE_SAMPLE" | "PAID_SAMPLE",
    sampleFee: 0,
    benchmarkProduct: "",
    targetTexture: "",
    targetFragrance: "",
    keyActiveIngredients: "",
    targetNettoGram: 30,
    targetHppPrice: 15000,
    busdevPic: "Sari Dewi (BusDev)",
    formulatorPic: "Apt. Dedi Kurniawan, S.Farm"
  });

  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackDecision, setFeedbackDecision] = useState<"APPROVED" | "REVISION">("APPROVED");

  // Queries
  const { data: rawNpfs, isLoading } = useQuery({
    queryKey: ["rnd-npfs"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/npf");
        return unwrapResponse(res.data) as NpfSampleItem[];
      } catch (e) {
        return null;
      }
    }
  });

  const npfs: NpfSampleItem[] = useMemo(() => {
    if (rawNpfs && Array.isArray(rawNpfs) && rawNpfs.length > 0) {
      return rawNpfs;
    }
    return MOCK_NPFS;
  }, [rawNpfs]);

  // Filtering
  const filteredNpfs = useMemo(() => {
    return npfs.filter((n) => {
      if (activeTab === "lab" && n.status !== "LAB_TRIAL" && n.status !== "QUEUE") return false;
      if (activeTab === "shipped" && n.status !== "SHIPPED" && n.status !== "READY_TO_SHIP") return false;
      if (activeTab === "approved" && n.status !== "APPROVED") return false;
      if (activeTab === "revision" && n.status !== "REVISION_REQUESTED") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          n.npfCode.toLowerCase().includes(q) ||
          n.clientName.toLowerCase().includes(q) ||
          n.brandName.toLowerCase().includes(q) ||
          n.productName.toLowerCase().includes(q) ||
          n.formulatorPic.toLowerCase().includes(q) ||
          n.benchmarkProduct.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [npfs, activeTab, searchQuery]);

  // KPIs
  const totalNpfs = npfs.length;
  const labTrialCount = npfs.filter(n => n.status === "LAB_TRIAL" || n.status === "QUEUE").length;
  const shippedCount = npfs.filter(n => n.status === "SHIPPED").length;
  const approvedCount = npfs.filter(n => n.status === "APPROVED").length;

  const handleCreateNpf = () => {
    if (!createForm.clientName || !createForm.productName) {
      toast.warning("Form Belum Lengkap", "Nama Klien dan Nama Produk wajib diisi.");
      return;
    }
    toast.success("Dokumen NPF Disimpan", "Dokumen formulasi produk baru berhasil didaftarkan dan masuk antrean lab formulator.");
    setIsCreateModalOpen(false);
  };

  const handleSaveFeedback = () => {
    toast.success(
      feedbackDecision === "APPROVED" ? "Sample Disetujui (Approved)" : "Revisi Sample Diajukan",
      feedbackDecision === "APPROVED"
        ? "Sample telah disetujui klien. Project dapat dilanjutkan ke tahap HPP & SPK Pra-Produksi."
        : "Permintaan revisi sample telah dikirim ke formulator untuk pembuatan formula Rev 2."
    );
    setIsFeedbackModalOpen(false);
  };

  const getStatusBadge = (status: NpfSampleItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return <DnaBadge variant="success">APPROVED (DEAL)</DnaBadge>;
      case "SHIPPED":
        return <DnaBadge variant="info">SAMPLE TERKIRIM</DnaBadge>;
      case "LAB_TRIAL":
        return <DnaBadge variant="blue">FORMULASI LAB</DnaBadge>;
      case "REVISION_REQUESTED":
        return <DnaBadge variant="purple">REVISI SAMPLE</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="NPF & Manajemen Sample Klien (New Product Formulation)"
        description="Intake spesifikasi produk baru, target benchmark kompetitor, formulasi sample lab, pelacakan Free Sample vs Paid Sample (Poin 13), hingga konfirmasi feedback klien."
        badge={<DnaBadge variant="neutral">SCR-017 & SCR-121</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/rnd/dashboard" },
          { label: "NPF & Sample", href: "/rnd/npf" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Data NPF & Sample berhasil diunduh ke format Excel.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat NPF Baru (SCR-123)
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL DOKUMEN NPF"
          value={`${totalNpfs} Dokumen`}
          subValue="Permintaan Formulasi Masuk"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="FORMULASI LAB"
          value={`${labTrialCount} Trial`}
          subValue="Dalam Pengerjaan Formulator"
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="SAMPLE TERKIRIM"
          value={`${shippedCount} Klien`}
          subValue="Menunggu Review Feedback"
          icon={<Send className="w-5 h-5 text-cyan-600" />}
        />
        <DnaStatCard
          label="SAMPLE APPROVED (DEAL)"
          value={`${approvedCount} Disetujui`}
          subValue="Siap Masuk Pra-Produksi"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua NPF (${totalNpfs})` },
          { id: "lab", label: `Formulasi Lab (${labTrialCount})` },
          { id: "shipped", label: `Sample Terkirim (${shippedCount})` },
          { id: "approved", label: `Approved Deal (${approvedCount})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. DataTable Card (SCR-121) */}
      <DnaDataTableCard
        title="Daftar Permintaan Sample & Formulasi NPF"
        description="Pelacakan lifecycle sample mulai dari benchmark, trial lab, pengiriman kurir resi, hingga approval deal."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Kode NPF, Klien, Brand, Produk, Formulator..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Kode & Tanggal</th>
                <th className="py-3 px-4">Klien & Brand</th>
                <th className="py-3 px-4">Produk & Kategori</th>
                <th className="py-3 px-4">Tipe Sample</th>
                <th className="py-3 px-4">Target Benchmark</th>
                <th className="py-3 px-4 text-center">Revisi</th>
                <th className="py-3 px-4">PIC Formulator</th>
                <th className="py-3 px-4">Status Sample</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNpfs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada permintaan sample NPF yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredNpfs.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-bold text-slate-900">{row.npfCode}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{row.entryDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-800">{row.clientName}</p>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{row.brandName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{row.productName}</p>
                      <span className="text-[11px] text-slate-500">{row.categoryLabel} (@{row.targetNettoGram}g)</span>
                    </td>
                    <td className="py-3 px-4">
                      {row.sampleType === "FREE_SAMPLE" ? (
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          FREE SAMPLE
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            PAID SAMPLE
                          </span>
                          <p className="font-mono text-[10px] text-slate-600 font-bold">Rp {row.sampleFeeAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 truncate max-w-[200px]" title={row.benchmarkProduct}>
                      {row.benchmarkProduct}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block font-mono text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {row.currentRevision}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-800">{row.formulatorPic}</p>
                      <p className="text-[10px] text-slate-400">BusDev: {row.busdevPic}</p>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNpf(row);
                            setIsDetailModalOpen(true);
                          }}
                          title="Lihat Detail NPF"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNpf(row);
                            setIsFeedbackModalOpen(true);
                          }}
                          title="Input Feedback / Revisi Klien"
                        >
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 5. Modal Buat NPF Baru (SCR-123) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Dokumen NPF Baru (SCR-123)"
        description="Formulir intake spesifikasi dan acuan produk maklon kosmetik baru."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateNpf}>
              Simpan & Daftarkan NPF
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Pelanggan / Klien *</label>
              <input
                type="text"
                placeholder="PT Cantika Glow Nusantara"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.clientName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Brand / Merk *</label>
              <input
                type="text"
                placeholder="GlowAura Skin"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.brandName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, brandName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Produk NPF *</label>
              <input
                type="text"
                placeholder="Brightening Serum Niacinamide 10%"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.productName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, productName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Tipe Sample (Poin 13) *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                value={createForm.sampleType}
                onChange={(e) => setCreateForm(prev => ({ ...prev, sampleType: e.target.value as any }))}
              >
                <option value="FREE_SAMPLE">Free Sample Maklon (Standar)</option>
                <option value="PAID_SAMPLE">Paid Sample (Fee Sample Khusus)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Benchmark Produk Kompetitor / Acuan Klien</label>
            <input
              type="text"
              placeholder="Contoh: Skintific 5X Ceramide Barrier Moisture Gel"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={createForm.benchmarkProduct}
              onChange={(e) => setCreateForm(prev => ({ ...prev, benchmarkProduct: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Ekspektasi Tekstur & Sensasi Kulit</label>
              <input
                type="text"
                placeholder="Watery gel ringan, cepat meresap, matte finish..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.targetTexture}
                onChange={(e) => setCreateForm(prev => ({ ...prev, targetTexture: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Ekspektasi Aroma / Fragrance</label>
              <input
                type="text"
                placeholder="Fresh floral rose lembut / Unscented..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.targetFragrance}
                onChange={(e) => setCreateForm(prev => ({ ...prev, targetFragrance: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Bahan Aktif Kunci yang Diinginkan</label>
            <input
              type="text"
              placeholder="Niacinamide 10%, Zinc PCA 1%, Hyaluronic Acid..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={createForm.keyActiveIngredients}
              onChange={(e) => setCreateForm(prev => ({ ...prev, keyActiveIngredients: e.target.value }))}
            />
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Input Feedback & Revisi Sample */}
      <DnaModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Input Feedback & Keputusan Sample Klien"
        description="Pencatatan respon klien setelah menguji sample kosmetik di lapangan."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsFeedbackModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveFeedback}>
              Simpan Keputusan
            </DnaButton>
          </div>
        }
      >
        {selectedNpf && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">{selectedNpf.productName}</p>
              <p className="text-slate-500">{selectedNpf.clientName} ({selectedNpf.brandName}) • {selectedNpf.currentRevision}</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Keputusan Klien *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
                value={feedbackDecision}
                onChange={(e) => setFeedbackDecision(e.target.value as any)}
              >
                <option value="APPROVED">✅ Sample Disetujui (Approved Deal - Siap Produksi)</option>
                <option value="REVISION">🔄 Request Revisi Formula (Lanjut Rev 2 / Rev 3)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Rincian Feedback / Catatan Revisi</label>
              <textarea
                rows={3}
                placeholder="Berikan catatan detail terkait tekstur, aroma, warna, rasa di kulit, atau request perubahan..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </DnaModal>

      {/* 7. Modal Detail NPF */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Rincian Dokumen NPF & Spesifikasi Sample"
        description="Detail parameter intake formulasi dan riwayat review."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedNpf && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Nomor NPF</span>
                  <p className="font-mono text-base font-bold text-slate-900">{selectedNpf.npfCode}</p>
                </div>
                <div>{getStatusBadge(selectedNpf.status)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Klien & Brand:</span>
                  <p className="font-semibold text-slate-800">{selectedNpf.clientName} ({selectedNpf.brandName})</p>
                </div>
                <div>
                  <span className="text-slate-500">Formulator PIC:</span>
                  <p className="font-semibold text-slate-800">{selectedNpf.formulatorPic}</p>
                </div>
                <div>
                  <span className="text-slate-500">Tipe Sample:</span>
                  <p className="font-bold text-indigo-700">{selectedNpf.sampleType}</p>
                </div>
                <div>
                  <span className="text-slate-500">Target Netto:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedNpf.targetNettoGram} Gram / Pcs</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[11px]">Benchmark & Bahan Aktif</span>
                <p className="text-slate-600"><strong className="text-slate-800">Acuan:</strong> {selectedNpf.benchmarkProduct}</p>
                <p className="text-slate-600"><strong className="text-slate-800">Aktif:</strong> {selectedNpf.keyActiveIngredients}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[11px]">Tekstur & Aroma</span>
                <p className="text-slate-600"><strong className="text-slate-800">Tekstur:</strong> {selectedNpf.targetTexture}</p>
                <p className="text-slate-600"><strong className="text-slate-800">Aroma:</strong> {selectedNpf.targetFragrance}</p>
              </div>
            </div>

            {selectedNpf.clientFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-emerald-900">Feedback Resmi Klien:</span>
                <p className="text-emerald-800">{selectedNpf.clientFeedback}</p>
              </div>
            )}
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
