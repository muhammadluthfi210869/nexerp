"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Sparkles,
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
  Upload,
  FileText,
  Tag,
  Check,
  XCircle,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Layers,
  Palette
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

interface PackagingDesign {
  id: string;
  designCode: string;
  salesOrderCode: string;
  clientName: string;
  brandName: string;
  productName: string;
  designerPic: string;
  bpomNotificationNumber: string; // Nomor Notifikasi BPOM NA
  batchNumber: string; // Batch Number cetak
  expiredDate: string; // Exp Date cetak
  revisionVersion: string; // V1.0, V1.1, V2.0
  artworkFileUrl: string;
  mockupImageUrl: string;
  busdevApprovalStatus: "PENDING" | "APPROVED" | "REJECTED";
  purchaseApprovalStatus: "PENDING" | "APPROVED" | "REJECTED";
  overallStatus: "DRAFT" | "PENDING_APPROVAL" | "APPROVED_PRINT_READY" | "REVISION_REQUESTED";
  overallStatusLabel: string;
  createdDate: string;
  notes?: string;
}

const MOCK_DESIGNS: PackagingDesign[] = [
  {
    id: "des-01",
    designCode: "DSN-202603-001",
    salesOrderCode: "SO-202603-0041",
    clientName: "PT Cantika Glow Nusantara",
    brandName: "GlowAura Skin",
    productName: "Brightening Glow Serum 10% Niacinamide 30ml",
    designerPic: "Mas Edi (Creative Lead)",
    bpomNotificationNumber: "NA18260100488",
    batchNumber: "LOT-FG-2609-001",
    expiredDate: "2028-09-01",
    revisionVersion: "V2.0",
    artworkFileUrl: "https://drive.google.com/file/d/artwork-serum-v2.pdf",
    mockupImageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
    busdevApprovalStatus: "APPROVED",
    purchaseApprovalStatus: "APPROVED",
    overallStatus: "APPROVED_PRINT_READY",
    overallStatusLabel: "Print Ready (Siap Cetak Percetakan)",
    createdDate: "2026-03-08",
    notes: "Sudah sinkron ukuran label 85x35mm dan inner box foil emas 35x35x105mm."
  },
  {
    id: "des-02",
    designCode: "DSN-202603-002",
    salesOrderCode: "SO-202603-0044",
    clientName: "PT Miracle Beauty Lab",
    brandName: "MiracleSkin",
    productName: "Ceramide 5X Barrier Repair Moisturizer 50g",
    designerPic: "Siti Creative",
    bpomNotificationNumber: "NA18260100512",
    batchNumber: "LOT-FG-2609-002",
    expiredDate: "2028-09-15",
    revisionVersion: "V1.0",
    artworkFileUrl: "https://drive.google.com/file/d/artwork-moist-v1.pdf",
    mockupImageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
    busdevApprovalStatus: "APPROVED",
    purchaseApprovalStatus: "PENDING",
    overallStatus: "PENDING_APPROVAL",
    overallStatusLabel: "Menunggu Approval Purchase Kemas",
    createdDate: "2026-03-07",
    notes: "Menunggu konfirmasi diameter stiker tutup pot cream 50mm dari vendor kemasan."
  },
  {
    id: "des-03",
    designCode: "DSN-202603-003",
    salesOrderCode: "SO-202603-0048",
    clientName: "CV Derma Estetika Mandiri",
    brandName: "DermaPure",
    productName: "AHA BHA PHA Exfoliating Toner 100ml",
    designerPic: "Mas Edi (Creative Lead)",
    bpomNotificationNumber: "NA18260100533",
    batchNumber: "LOT-FG-2609-003",
    expiredDate: "2028-08-20",
    revisionVersion: "V1.1",
    artworkFileUrl: "https://drive.google.com/file/d/artwork-toner-v1.pdf",
    mockupImageUrl: "https://images.unsplash.com/photo-1608248597359-25166299b9cf?w=400",
    busdevApprovalStatus: "PENDING",
    purchaseApprovalStatus: "PENDING",
    overallStatus: "PENDING_APPROVAL",
    overallStatusLabel: "Menunggu Review Dual Approval",
    createdDate: "2026-03-06",
    notes: "Klien mengganti posisi logo halal dan barcode BPOM."
  }
];

export default function PackagingDesignPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesign, setSelectedDesign] = useState<PackagingDesign | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Form State (SCR-134)
  const [createForm, setCreateForm] = useState({
    salesOrderCode: "SO-202603-0041",
    clientName: "",
    brandName: "",
    productName: "",
    designerPic: "Mas Edi (Creative Lead)",
    bpomNotificationNumber: "NA182601...",
    batchNumber: "LOT-2026...",
    expiredDate: "2028-12-31",
    revisionVersion: "V1.0",
    artworkFileUrl: "",
    mockupImageUrl: "",
    notes: ""
  });

  // Queries
  const { data: rawDesigns, isLoading } = useQuery({
    queryKey: ["rnd-packaging-designs"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/designs");
        return unwrapResponse(res.data) as PackagingDesign[];
      } catch (e) {
        return null;
      }
    }
  });

  const designs: PackagingDesign[] = useMemo(() => {
    if (rawDesigns && Array.isArray(rawDesigns) && rawDesigns.length > 0) {
      return rawDesigns;
    }
    return MOCK_DESIGNS;
  }, [rawDesigns]);

  // Filtering
  const filteredDesigns = useMemo(() => {
    return designs.filter((d) => {
      if (activeTab === "pending" && d.overallStatus !== "PENDING_APPROVAL") return false;
      if (activeTab === "approved" && d.overallStatus !== "APPROVED_PRINT_READY") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          d.designCode.toLowerCase().includes(q) ||
          d.salesOrderCode.toLowerCase().includes(q) ||
          d.clientName.toLowerCase().includes(q) ||
          d.brandName.toLowerCase().includes(q) ||
          d.productName.toLowerCase().includes(q) ||
          d.bpomNotificationNumber.toLowerCase().includes(q) ||
          d.designerPic.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [designs, activeTab, searchQuery]);

  // KPIs
  const totalDesigns = designs.length;
  const pendingApprovalCount = designs.filter(d => d.overallStatus === "PENDING_APPROVAL").length;
  const approvedReadyCount = designs.filter(d => d.overallStatus === "APPROVED_PRINT_READY").length;

  const handleCreateDesign = () => {
    if (!createForm.clientName || !createForm.productName) {
      toast.warning("Form Belum Lengkap", "Nama Klien dan Nama Produk wajib diisi.");
      return;
    }
    toast.success("Desain Kemasan Disimpan", "Dokumen desain kemasan baru berhasil didaftarkan dan diteruskan ke BusDev & Purchase untuk dual-approval.");
    setIsCreateModalOpen(false);
  };

  const handleDualApproval = (id: string, role: "BUSDEV" | "PURCHASE", isApproved: boolean) => {
    toast.success(
      isApproved ? `Approval ${role} Berhasil` : `Desain Ditolak oleh ${role}`,
      `Status approval desain kemasan oleh ${role} telah berhasil diperbarui.`
    );
    setIsDetailModalOpen(false);
  };

  const getStatusBadge = (status: PackagingDesign["overallStatus"]) => {
    switch (status) {
      case "APPROVED_PRINT_READY":
        return <DnaBadge variant="success">PRINT READY (APPROVED)</DnaBadge>;
      case "PENDING_APPROVAL":
        return <DnaBadge variant="warning">MENUNGGU DUAL APPROVAL</DnaBadge>;
      case "REVISION_REQUESTED":
        return <DnaBadge variant="danger">REVISI DESAIN</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Kelola Desain & Kemasan Pra-Produksi"
        description="Pemeriksaan kelayakan cetak kemasan (Artwork Packaging, No. Notifikasi BPOM NA, Batch Number, Exp Date) dan verifikasi Dual Approval BusDev & Purchase (Poin 68-74)."
        badge={<DnaBadge variant="neutral">SCR-133 & SCR-134</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/rnd/dashboard" },
          { label: "Kelola Desain", href: "/rnd/design" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Data rekap desain kemasan berhasil diunduh ke Excel.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat / Revisi Desain (SCR-134)
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL DESAIN KEMASAN"
          value={`${totalDesigns} Artwork`}
          subValue="Dokumen Kemasan Terdaftar"
          icon={<Palette className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="MENUNGGU APPROVAL"
          value={`${pendingApprovalCount} Desain`}
          subValue="Dual-Gate BusDev & Purchase"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="PRINT READY (SIAP CETAK)"
          value={`${approvedReadyCount} Selesai`}
          subValue="Lolos Verifikasi BPOM & Purchase"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="INTEGRITAS REGULATORI"
          value="100% Valid"
          subValue="Sinkron No. Notifikasi BPOM"
          icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua Desain (${totalDesigns})` },
          { id: "pending", label: `Menunggu Approval (${pendingApprovalCount})` },
          { id: "approved", label: `Print Ready (${approvedReadyCount})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. DataTable Card (SCR-133) */}
      <DnaDataTableCard
        title="Daftar Desain Kemasan & Status Dual Approval"
        description="Pengecekan spesifikasi cetak kemasan maklon kosmetik sesuai ketentuan BPOM dan CPKB."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No Desain, SO, Klien, Brand, No BPOM, PIC..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No. Desain & SO</th>
                <th className="py-3 px-4">Klien & Brand</th>
                <th className="py-3 px-4">Produk & PIC Desain</th>
                <th className="py-3 px-4">No. Notifikasi BPOM</th>
                <th className="py-3 px-4">Batch & Exp Date</th>
                <th className="py-3 px-4 text-center">Revisi</th>
                <th className="py-3 px-4">Approval BusDev</th>
                <th className="py-3 px-4">Approval Purchase</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDesigns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Palette className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada dokumen desain kemasan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredDesigns.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-bold text-slate-900">{row.designCode}</p>
                      <span className="font-mono text-[10px] text-slate-500 font-normal">{row.salesOrderCode}</span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-800">{row.clientName}</p>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{row.brandName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{row.productName}</p>
                      <span className="text-[11px] text-slate-500">PIC: {row.designerPic}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {row.bpomNotificationNumber}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      <p className="font-bold text-indigo-700">{row.batchNumber}</p>
                      <p className="text-[10px] text-slate-500">Exp: {row.expiredDate}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block font-mono text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {row.revisionVersion}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {row.busdevApprovalStatus === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {row.purchaseApprovalStatus === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(row.overallStatus)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDesign(row);
                          setIsDetailModalOpen(true);
                        }}
                        title="Lihat Artwork & Otorisasi Approval"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 5. Modal Buat / Revisi Desain (SCR-134) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat / Revisi Desain Kemasan (SCR-134)"
        description="Input spesifikasi artwork kemasan, nomor notifikasi BPOM, dan upload file acuan."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateDesign}>
              Submit Approval ke BusDev & Purchase
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Sales Order Acuan *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.salesOrderCode}
                onChange={(e) => setCreateForm(prev => ({ ...prev, salesOrderCode: e.target.value }))}
              >
                <option value="SO-202603-0041">SO-202603-0041 - PT Cantika Glow (Serum 30ml)</option>
                <option value="SO-202603-0044">SO-202603-0044 - PT Miracle Beauty (Cream 50g)</option>
                <option value="SO-202603-0048">SO-202603-0048 - CV Derma Estetika (Toner 100ml)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">PIC Desain *</label>
              <input
                type="text"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.designerPic}
                onChange={(e) => setCreateForm(prev => ({ ...prev, designerPic: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Klien / Perusahaan *</label>
              <input
                type="text"
                placeholder="PT Cantika Glow Nusantara"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.clientName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Brand / Merk *</label>
              <input
                type="text"
                placeholder="GlowAura Skin"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.brandName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, brandName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nomor Notifikasi BPOM *</label>
              <input
                type="text"
                placeholder="NA182601..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.bpomNotificationNumber}
                onChange={(e) => setCreateForm(prev => ({ ...prev, bpomNotificationNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Batch Number Cetak *</label>
              <input
                type="text"
                placeholder="LOT-2026..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.batchNumber}
                onChange={(e) => setCreateForm(prev => ({ ...prev, batchNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Expired Date *</label>
              <input
                type="date"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.expiredDate}
                onChange={(e) => setCreateForm(prev => ({ ...prev, expiredDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-2 hover:border-blue-500 bg-slate-50">
            <Upload className="w-8 h-8 text-blue-600" />
            <p className="font-semibold text-slate-800">Upload File Artwork (PDF / AI / High-Res PNG)</p>
            <p className="text-[11px] text-slate-500">Maksimal ukuran file 50 MB</p>
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Detail & Dual Approval Gate */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedDesign ? `Artwork Kemasan: ${selectedDesign.designCode}` : "Detail Desain"}
        description="Verifikasi parameter kemasan dan otorisasi persetujuan BusDev & Purchase (Poin 74)."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs">
              <span className="font-bold text-slate-700">Status: </span>
              {selectedDesign && getStatusBadge(selectedDesign.overallStatus)}
            </div>

            <div className="flex items-center gap-2">
              <DnaButton variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </DnaButton>

              {selectedDesign && selectedDesign.overallStatus !== "APPROVED_PRINT_READY" && (
                <>
                  <DnaButton
                    variant="primary"
                    onClick={() => handleDualApproval(selectedDesign.id, "BUSDEV", true)}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve BusDev
                  </DnaButton>
                  <DnaButton
                    variant="primary"
                    onClick={() => handleDualApproval(selectedDesign.id, "PURCHASE", true)}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve Purchase
                  </DnaButton>
                </>
              )}
            </div>
          </div>
        }
      >
        {selectedDesign && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Produk & Brand</span>
                  <p className="text-sm font-bold text-slate-900">{selectedDesign.productName} ({selectedDesign.brandName})</p>
                </div>
                <div>{getStatusBadge(selectedDesign.overallStatus)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">No. Notifikasi BPOM:</span>
                  <p className="font-mono font-bold text-indigo-700">{selectedDesign.bpomNotificationNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Batch Number:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedDesign.batchNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Expired Date:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedDesign.expiredDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Versi Revisi:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedDesign.revisionVersion}</p>
                </div>
              </div>
            </div>

            {/* Dual Approval Status Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 space-y-2 bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase">1. Approval BusDev (Klien)</span>
                  {selectedDesign.busdevApprovalStatus === "APPROVED" ? (
                    <DnaBadge variant="success">APPROVED</DnaBadge>
                  ) : (
                    <DnaBadge variant="warning">PENDING</DnaBadge>
                  )}
                </div>
                <p className="text-slate-500 text-[11px]">Memverifikasi kesesuaian logo, klaim manfaat, teks bahasa, dan nomor BPOM NA.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2 bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase">2. Approval Purchase Kemas</span>
                  {selectedDesign.purchaseApprovalStatus === "APPROVED" ? (
                    <DnaBadge variant="success">APPROVED</DnaBadge>
                  ) : (
                    <DnaBadge variant="warning">PENDING</DnaBadge>
                  )}
                </div>
                <p className="text-slate-500 text-[11px]">Memverifikasi dimensi pisau pond inner box, ukuran die-cut stiker, dan spesifikasi vendor cetak.</p>
              </div>
            </div>

            {selectedDesign.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Catatan Desainer & Spesifikasi Cetak:</span>
                <p className="text-slate-600 mt-0.5">{selectedDesign.notes}</p>
              </div>
            )}
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
