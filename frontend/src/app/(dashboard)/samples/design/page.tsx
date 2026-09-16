"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Palette,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Check,
  XCircle,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  X,
  Camera
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast
} from "@/components/dna";
import { Input } from "@/components/ui/input";

interface PackagingDesign {
  id: string;
  designCode: string;
  salesOrderCode: string;
  brandProduct: string;
  designerPic: string; // Mas Edi (Creative Lead)
  batchNumber: string;
  expiredDate: string;
  revisionVersion: string; // V1.0, V2.0
  bpomNumber: string; // NA18260100488
  busdevApproval: "PENDING" | "APPROVED" | "REJECTED";
  purchaseApproval: "PENDING" | "APPROVED" | "REJECTED";
  packagingPhoto: string;
  notes?: string;
  fileUrl?: string;
}

const INITIAL_DESIGNS: PackagingDesign[] = [
  {
    id: "des-01",
    designCode: "DSN-2026-001",
    salesOrderCode: "SO-2026-0041",
    brandProduct: "GlowAura Skin - Brightening Serum 30ml",
    designerPic: "Mas Edi (Creative Lead)",
    batchNumber: "LOT-FG-2609-001",
    expiredDate: "2028-09-01",
    revisionVersion: "V2.0",
    bpomNumber: "NA18260100488",
    busdevApproval: "APPROVED",
    purchaseApproval: "APPROVED",
    packagingPhoto: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200",
    notes: "Ukuran label 85x35mm dan inner box foil emas 35x35x105mm terverifikasi.",
    fileUrl: "https://drive.google.com/artwork-serum-v2.pdf"
  },
  {
    id: "des-02",
    designCode: "DSN-2026-002",
    salesOrderCode: "SO-2026-0044",
    brandProduct: "MiracleSkin - Barrier Repair Moisturizer 50g",
    designerPic: "Mas Edi (Creative Lead)",
    batchNumber: "LOT-FG-2609-002",
    expiredDate: "2028-09-15",
    revisionVersion: "V1.0",
    bpomNumber: "NA18260100512",
    busdevApproval: "APPROVED",
    purchaseApproval: "PENDING",
    packagingPhoto: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200",
    notes: "Menunggu konfirmasi ketersediaan jar akrilik frosted dari supplier.",
    fileUrl: "https://drive.google.com/artwork-moist-v1.pdf"
  },
  {
    id: "des-03",
    designCode: "DSN-2026-003",
    salesOrderCode: "SO-2026-0049",
    brandProduct: "AcneClear Lab - Soothing Cica Gel 30gr",
    designerPic: "Mas Edi (Creative Lead)",
    batchNumber: "LOT-FG-2609-003",
    expiredDate: "2028-08-20",
    revisionVersion: "V1.2",
    bpomNumber: "NA18260100604",
    busdevApproval: "PENDING",
    purchaseApproval: "PENDING",
    packagingPhoto: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200",
    notes: "Revisi teks klaim dermatologis sesuai arahan tim Regulasi BPOM.",
    fileUrl: "https://drive.google.com/artwork-gel-v12.pdf"
  },
  {
    id: "des-04",
    designCode: "DSN-2026-004",
    salesOrderCode: "SO-2026-0052",
    brandProduct: "Royal Glow - Hydrating Lip Tint Peptide 5ml",
    designerPic: "Creative Team",
    batchNumber: "LOT-FG-2609-004",
    expiredDate: "2028-10-10",
    revisionVersion: "V1.0",
    bpomNumber: "NA18260100718",
    busdevApproval: "APPROVED",
    purchaseApproval: "APPROVED",
    packagingPhoto: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200",
    notes: "Packaging vial doe-foot applicator siap cetak sablon UV.",
    fileUrl: "https://drive.google.com/artwork-liptint-v1.pdf"
  }
];

function DesignManageContent() {
  const searchParams = useSearchParams();
  const [designs, setDesigns] = useState<PackagingDesign[]>(INITIAL_DESIGNS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [picFilter, setPicFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<PackagingDesign | null>(null);
  const toast = useDnaToast();

  // Create Form State
  const [formData, setFormData] = useState({
    salesOrderCode: "SO-2026-0055",
    brandProduct: "",
    designerPic: "Mas Edi (Creative Lead)",
    bpomNumber: "",
    batchNumber: "LOT-FG-2609-005",
    expiredDate: "2028-11-01",
    revisionVersion: "V1.0",
    notes: ""
  });

  // Handle URL action=create
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Filtering
  const filteredDesigns = useMemo(() => {
    return designs.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        d.designCode.toLowerCase().includes(q) ||
        d.salesOrderCode.toLowerCase().includes(q) ||
        d.brandProduct.toLowerCase().includes(q) ||
        d.bpomNumber.toLowerCase().includes(q) ||
        d.designerPic.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "APPROVED" && d.busdevApproval === "APPROVED" && d.purchaseApproval === "APPROVED") ||
        (statusFilter === "PENDING" && (d.busdevApproval === "PENDING" || d.purchaseApproval === "PENDING")) ||
        (statusFilter === "REJECTED" && (d.busdevApproval === "REJECTED" || d.purchaseApproval === "REJECTED"));

      const matchesPic =
        picFilter === "ALL" || d.designerPic.includes(picFilter);

      return matchesSearch && matchesStatus && matchesPic;
    });
  }, [designs, searchQuery, statusFilter, picFilter]);

  // KPIs (1:1 G-SERP Row 134)
  const totalBerjalan = designs.length;
  const menungguApproval = designs.filter(
    (d) => d.busdevApproval === "PENDING" || d.purchaseApproval === "PENDING"
  ).length;
  const disetujui = designs.filter(
    (d) => d.busdevApproval === "APPROVED" && d.purchaseApproval === "APPROVED"
  ).length;
  const perluRevisi = designs.filter(
    (d) => d.busdevApproval === "REJECTED" || d.purchaseApproval === "REJECTED"
  ).length;

  const handleSaveDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandProduct || !formData.bpomNumber) {
      toast.warning("Lengkapi Data", "Brand/Produk dan Nomor BPOM wajib diisi.");
      return;
    }

    const newDesign: PackagingDesign = {
      id: `des-${Date.now()}`,
      designCode: `DSN-2026-${String(designs.length + 1).padStart(3, "0")}`,
      salesOrderCode: formData.salesOrderCode,
      brandProduct: formData.brandProduct,
      designerPic: formData.designerPic,
      batchNumber: formData.batchNumber,
      expiredDate: formData.expiredDate,
      revisionVersion: formData.revisionVersion,
      bpomNumber: formData.bpomNumber,
      busdevApproval: "PENDING",
      purchaseApproval: "PENDING",
      packagingPhoto: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200",
      notes: formData.notes
    };

    setDesigns([newDesign, ...designs]);
    setIsCreateModalOpen(false);
    setFormData({
      salesOrderCode: "SO-2026-0056",
      brandProduct: "",
      designerPic: "Mas Edi (Creative Lead)",
      bpomNumber: "",
      batchNumber: "LOT-FG-2609-006",
      expiredDate: "2028-11-01",
      revisionVersion: "V1.0",
      notes: ""
    });
    toast.success("Desain Berhasil Dibuat", "Desain diteruskan ke BusDev & Purchase untuk dual-approval.");
  };

  const handleApproval = (id: string, role: "BUSDEV" | "PURCHASE", approved: boolean) => {
    setDesigns(
      designs.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            [role === "BUSDEV" ? "busdevApproval" : "purchaseApproval"]: approved ? "APPROVED" : "REJECTED"
          };
        }
        return d;
      })
    );
    toast.success(
      approved ? `Approval ${role} Disetujui` : `Desain Ditolak oleh ${role}`,
      `Status approval desain kemasan diperbarui.`
    );
    if (selectedDesign && selectedDesign.id === id) {
      setSelectedDesign({
        ...selectedDesign,
        [role === "BUSDEV" ? "busdevApproval" : "purchaseApproval"]: approved ? "APPROVED" : "REJECTED"
      });
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Kelola Desain & Kemasan"
        description="Pemeriksaan kelayakan cetak kemasan maklon kosmetik, nomor notifikasi BPOM NA, batch/exp date, dan Dual Approval BusDev & Purchase (Poin 68-74)."
        breadcrumbs={[
          { label: "Operasional", href: "/dashboard-rnd" },
          { label: "Pra Produksi", href: "/design-manage" },
          { label: "Kelola Desain", href: "/design-manage" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Excel", "Data rekapitulasi desain kemasan berhasil diunduh.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Desain Baru
            </DnaButton>
          </div>
        }
      />

      {/* 2. 4 KPI Cards (1:1 G-SERP Row 134) */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL DESAIN BERJALAN"
          value={`${totalBerjalan} Desain`}
          subValue="Dokumen Kemasan Terdaftar"
          icon={<Palette className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="MENUNGGU APPROVAL"
          value={`${menungguApproval} Desain`}
          subValue="Dual-Gate BusDev & Purchase"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="DESAIN DISETUJUI"
          value={`${disetujui} Siap Cetak`}
          subValue="Lolos Verifikasi BPOM & Cetak"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="DESAIN PERLU REVISI"
          value={`${perluRevisi} Revisi`}
          subValue="Catatan Revisi Artwork"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
      </DnaKpiGrid>

      {/* 3. DataTable (1:1 G-SERP Row 134 — EXACT 12 COLUMNS) */}
      <DnaDataTableCard
        title="Daftar Desain Kemasan & Status Approval"
        description="Spesifikasi cetak kemasan maklon kosmetik sesuai nomor registrasi BPOM dan standar CPKB."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari kode desain, SO, brand/produk, BPOM, PIC..."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Status Approval</option>
              <option value="APPROVED">Disetujui (Print Ready)</option>
              <option value="PENDING">Menunggu Approval</option>
              <option value="REJECTED">Perlu Revisi</option>
            </select>
            <select
              value={picFilter}
              onChange={(e) => setPicFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua PIC Desain</option>
              <option value="Mas Edi">Mas Edi (Creative Lead)</option>
              <option value="Creative Team">Creative Team</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-3 text-center w-10">#</th>
                <th className="py-3 px-3 w-28">Kode Desain</th>
                <th className="py-3 px-3 w-28">Sales Order</th>
                <th className="py-3 px-3">Brand / Produk</th>
                <th className="py-3 px-3 w-36">PIC Desain</th>
                <th className="py-3 px-3 w-28">No. Batch</th>
                <th className="py-3 px-3 w-24">Expired Date</th>
                <th className="py-3 px-3 text-center w-20">Versi Revisi</th>
                <th className="py-3 px-3 w-32">Status BPOM</th>
                <th className="py-3 px-3 text-center w-36">Approval (BD & PO)</th>
                <th className="py-3 px-3 text-center w-20">Foto Kemasan</th>
                <th className="py-3 px-3 text-center w-16">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDesigns.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    Tidak ada dokumen desain kemasan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredDesigns.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{row.designCode}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{row.salesOrderCode}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.brandProduct}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{row.designerPic}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{row.batchNumber}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{row.expiredDate}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono font-bold text-slate-800">
                        {row.revisionVersion}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-800 font-bold">{row.bpomNumber}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.busdevApproval === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.busdevApproval === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                          title="Approval BusDev"
                        >
                          BD: {row.busdevApproval}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.purchaseApproval === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.purchaseApproval === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                          title="Approval Purchase"
                        >
                          PO: {row.purchaseApproval}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedDesign(row)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 inline-flex items-center justify-center"
                        title="Lihat Foto Kemasan Acuan"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedDesign(row)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Detail & Dual Approval"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 4. Modal Buat Desain Baru (SCR-135 / ?action=create) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Buat / Revisi Desain Kemasan</h3>
                <p className="text-xs text-slate-500">Pendaftaran dokumen artwork kemasan maklon kosmetik (Poin 71-74)</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDesign} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Nomor Sales Order <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.salesOrderCode}
                    onChange={(e) => setFormData({ ...formData, salesOrderCode: e.target.value })}
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    PIC Desain <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.designerPic}
                    onChange={(e) => setFormData({ ...formData, designerPic: e.target.value })}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 font-medium"
                  >
                    <option value="Mas Edi (Creative Lead)">Mas Edi (Creative Lead)</option>
                    <option value="Creative Team">Creative Team</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Brand & Nama Produk <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Contoh: GlowAura - Brightening Serum 30ml"
                  value={formData.brandProduct}
                  onChange={(e) => setFormData({ ...formData, brandProduct: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Nomor BPOM NA <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="NA182601..."
                    value={formData.bpomNumber}
                    onChange={(e) => setFormData({ ...formData, bpomNumber: e.target.value })}
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Batch Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Expired Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={formData.expiredDate}
                    onChange={(e) => setFormData({ ...formData, expiredDate: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Versi Revisi</label>
                  <Input
                    value={formData.revisionVersion}
                    onChange={(e) => setFormData({ ...formData, revisionVersion: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Upload Acuan Kemasan</label>
                  <Input type="file" className="h-8 text-xs" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Catatan Tambahan</label>
                <Input
                  placeholder="Informasi foil, ukuran die-cut, atau catatan finishing..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <DnaButton type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Kembali
                </DnaButton>
                <DnaButton type="submit" variant="primary">
                  Simpan Draft & Ajukan Approval
                </DnaButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Detail & Dual Approval BusDev & Purchase */}
      {selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{selectedDesign.brandProduct}</h3>
                <p className="text-xs font-mono text-blue-600">{selectedDesign.designCode} • {selectedDesign.salesOrderCode}</p>
              </div>
              <button onClick={() => setSelectedDesign(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block">Nomor BPOM NA:</span>
                <span className="font-mono font-bold text-slate-900">{selectedDesign.bpomNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Batch / Exp Date:</span>
                <span className="font-mono text-slate-800">{selectedDesign.batchNumber} / {selectedDesign.expiredDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">PIC Desain:</span>
                <span className="font-medium text-slate-800">{selectedDesign.designerPic}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Versi Revisi:</span>
                <span className="font-mono font-bold text-indigo-600">{selectedDesign.revisionVersion}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-bold block">Catatan Produksi & Cetak:</span>
                <span className="text-slate-700">{selectedDesign.notes || "-"}</span>
              </div>
            </div>

            {/* Dual Approval Gatekeeper */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Dual Approval Gatekeeper (Poin 68-74):</span>
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg">
                <div>
                  <span className="font-bold text-xs text-slate-700">1. Approval BusDev:</span>
                  <p className="text-[11px] text-slate-500">Status: {selectedDesign.busdevApproval}</p>
                </div>
                <div className="flex gap-1.5">
                  <DnaButton
                    size="sm"
                    variant={selectedDesign.busdevApproval === "APPROVED" ? "primary" : "outline"}
                    onClick={() => handleApproval(selectedDesign.id, "BUSDEV", true)}
                  >
                    Approve
                  </DnaButton>
                  <DnaButton
                    size="sm"
                    variant={selectedDesign.busdevApproval === "REJECTED" ? "danger" : "outline"}
                    onClick={() => handleApproval(selectedDesign.id, "BUSDEV", false)}
                  >
                    Reject
                  </DnaButton>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg">
                <div>
                  <span className="font-bold text-xs text-slate-700">2. Approval Purchase:</span>
                  <p className="text-[11px] text-slate-500">Status: {selectedDesign.purchaseApproval}</p>
                </div>
                <div className="flex gap-1.5">
                  <DnaButton
                    size="sm"
                    variant={selectedDesign.purchaseApproval === "APPROVED" ? "primary" : "outline"}
                    onClick={() => handleApproval(selectedDesign.id, "PURCHASE", true)}
                  >
                    Approve
                  </DnaButton>
                  <DnaButton
                    size="sm"
                    variant={selectedDesign.purchaseApproval === "REJECTED" ? "danger" : "outline"}
                    onClick={() => handleApproval(selectedDesign.id, "PURCHASE", false)}
                  >
                    Reject
                  </DnaButton>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <DnaButton variant="outline" onClick={() => setSelectedDesign(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        </div>
      )}
    </DnaPageContainer>
  );
}

export default function DesignManagePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Memuat Kelola Desain...</div>}>
      <DesignManageContent />
    </Suspense>
  );
}
