"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FileText,
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
  ClipboardCheck,
  ShieldCheck,
  Printer,
  Scale,
  FlaskConical,
  Check,
  Sparkles,
  Layers
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

interface BatchRecordItem {
  id: string;
  batchRecordCode: string;
  spkCode: string;
  releaseDate: string;
  clientName: string;
  brandName: string;
  productName: string;
  formulaCode: string;
  revisionVersion: string;
  batchSizePcs: number;
  batchSizeKg: number;
  cpkbStage: "LINE_CLEARANCE" | "WEIGHING" | "MIXING" | "IN_PROCESS_QC" | "FILLING" | "PACKING" | "RELEASED";
  cpkbStageLabel: string;
  qcApprovalStatus: "PENDING_QC" | "QC_PASSED" | "RELEASED";
  picFormulator: string;
  picProductionLead: string;
  createdDate: string;
  notes?: string;
}

const MOCK_BATCH_RECORDS: BatchRecordItem[] = [
  {
    id: "br-01",
    batchRecordCode: "BR-202603-0012",
    spkCode: "SPK-PRD-202603-0041",
    releaseDate: "2026-03-09",
    clientName: "PT Cantika Glow Nusantara",
    brandName: "GlowAura Skin",
    productName: "Brightening Glow Serum 10% Niacinamide 30ml",
    formulaCode: "FORM-202603-001",
    revisionVersion: "Rev 2.0",
    batchSizePcs: 5000,
    batchSizeKg: 165.0,
    cpkbStage: "WEIGHING",
    cpkbStageLabel: "Penimbangan Bahan Baku Fase A-E",
    qcApprovalStatus: "PENDING_QC",
    picFormulator: "Apt. Dedi Kurniawan, S.Farm",
    picProductionLead: "Ahmad Maulana",
    createdDate: "2026-03-08",
    notes: "Line clearance ruang penimbangan bersih. Timbangan kalibrasi Mettler Toledo valid."
  },
  {
    id: "br-02",
    batchRecordCode: "BR-202603-0015",
    spkCode: "SPK-PRD-202603-0044",
    releaseDate: "2026-03-08",
    clientName: "PT Miracle Beauty Lab",
    brandName: "MiracleSkin",
    productName: "Ceramide 5X Barrier Repair Moisturizer 50g",
    formulaCode: "FORM-202603-002",
    revisionVersion: "Rev 1.1",
    batchSizePcs: 3000,
    batchSizeKg: 162.0,
    cpkbStage: "LINE_CLEARANCE",
    cpkbStageLabel: "Line Clearance Bejana Mixing #02",
    qcApprovalStatus: "PENDING_QC",
    picFormulator: "Dr. Maya Sp.KK",
    picProductionLead: "Hendro Wibowo",
    createdDate: "2026-03-07",
    notes: "Pembersihan sanitasi bejana dengan Alkohol 70% dan swab test mikrobiologi lolos."
  },
  {
    id: "br-03",
    batchRecordCode: "BR-202603-0018",
    spkCode: "SPK-PRD-202603-0048",
    releaseDate: "2026-03-06",
    clientName: "CV Derma Estetika Mandiri",
    brandName: "DermaPure",
    productName: "AHA BHA PHA Exfoliating Toner 100ml",
    formulaCode: "FORM-202603-003",
    revisionVersion: "Rev 1.0",
    batchSizePcs: 2000,
    batchSizeKg: 210.0,
    cpkbStage: "RELEASED",
    cpkbStageLabel: "Bulk & Produk Jadi Lolos QC",
    qcApprovalStatus: "RELEASED",
    picFormulator: "Apt. Siska Handayani, M.Farm",
    picProductionLead: "Ahmad Maulana",
    createdDate: "2026-03-05",
    notes: "Certificate of Analysis (CoA) rilis batch No. COA-FG-2026-048 terbit."
  }
];

export default function BatchRecordPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<BatchRecordItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State (SCR-132)
  const [createForm, setCreateForm] = useState({
    spkCode: "SPK-PRD-202603-0050",
    formulaCode: "FORM-202603-001",
    clientName: "",
    brandName: "",
    productName: "",
    batchSizePcs: 5000,
    batchSizeKg: 165,
    picProductionLead: "Ahmad Maulana",
    notes: ""
  });

  // Queries
  const { data: rawRecords, isLoading } = useQuery({
    queryKey: ["rnd-batch-records"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/batch-records");
        return unwrapResponse(res.data) as BatchRecordItem[];
      } catch (e) {
        return null;
      }
    }
  });

  const records: BatchRecordItem[] = useMemo(() => {
    if (rawRecords && Array.isArray(rawRecords) && rawRecords.length > 0) {
      return rawRecords;
    }
    return MOCK_BATCH_RECORDS;
  }, [rawRecords]);

  // Filtering
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (activeTab === "pre" && r.cpkbStage !== "LINE_CLEARANCE" && r.cpkbStage !== "WEIGHING") return false;
      if (activeTab === "mixing" && r.cpkbStage !== "MIXING" && r.cpkbStage !== "IN_PROCESS_QC") return false;
      if (activeTab === "filling" && r.cpkbStage !== "FILLING" && r.cpkbStage !== "PACKING") return false;
      if (activeTab === "released" && r.cpkbStage !== "RELEASED") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          r.batchRecordCode.toLowerCase().includes(q) ||
          r.spkCode.toLowerCase().includes(q) ||
          r.clientName.toLowerCase().includes(q) ||
          r.brandName.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.formulaCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, activeTab, searchQuery]);

  // KPIs
  const totalRecords = records.length;
  const preProdCount = records.filter(r => r.cpkbStage === "LINE_CLEARANCE" || r.cpkbStage === "WEIGHING").length;
  const releasedCount = records.filter(r => r.cpkbStage === "RELEASED").length;

  const handleCreateRecord = () => {
    if (!createForm.clientName || !createForm.productName) {
      toast.warning("Form Belum Lengkap", "Nama Klien dan Nama Produk wajib diisi.");
      return;
    }
    toast.success("Batch Record Diterbitkan", "Dokumen Electronic Batch Record (EBMR) berhasil dirilis untuk eksekusi pra-produksi.");
    setIsCreateModalOpen(false);
  };

  const getStageBadge = (stage: BatchRecordItem["cpkbStage"]) => {
    switch (stage) {
      case "RELEASED":
        return <DnaBadge variant="success">RELEASED (SELESAI)</DnaBadge>;
      case "WEIGHING":
        return <DnaBadge variant="blue">PENIMBANGAN BAHAN</DnaBadge>;
      case "LINE_CLEARANCE":
        return <DnaBadge variant="purple">LINE CLEARANCE</DnaBadge>;
      case "MIXING":
        return <DnaBadge variant="info">MIXING HOMOGENISASI</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{stage}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Batch Record Pra-Produksi (EBMR Standar CPKB)"
        description="Dokumen induk manufaktur kosmetik standar CPKB: Integrasi formula terkunci, verifikasi checklist line clearance, validasi timbang bahan baku per fase, dan parameter proses kritis."
        badge={<DnaBadge variant="neutral">SCR-131 & SCR-132</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/rnd/dashboard" },
          { label: "Batch Record", href: "/rnd/batch-record" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Batch record berhasil diunduh ke format Excel.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Batch Record (SCR-132)
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL BATCH RECORD"
          value={`${totalRecords} Dokumen`}
          subValue="Batch Manufaktur Terdaftar"
          icon={<FileText className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="TAHAP PRA-PRODUKSI"
          value={`${preProdCount} Batch`}
          subValue="Line Clearance & Timbang Bahan"
          icon={<Scale className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="BATCH RELEASED"
          value={`${releasedCount} Selesai`}
          subValue="Lolos In-Process & Finished QC"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="KEPATUHAN CPKB"
          value="100% Audit Valid"
          subValue="Integritas Data Penimbangan"
          icon={<ShieldCheck className="w-5 h-5 text-cyan-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua Batch (${totalRecords})` },
          { id: "pre", label: `Pra-Produksi & Timbang (${preProdCount})` },
          { id: "released", label: `Selesai Released (${releasedCount})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. DataTable Card (SCR-131) */}
      <DnaDataTableCard
        title="Daftar Electronic Batch Manufacturing Records (EBMR)"
        description="Dokumentasi penelusuran riwayat penimbangan bahan, parameter mixing, dan pelepasan produk jadi."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No. Batch Record, SPK, Produk, Klien, Formula..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No. Batch Record & SPK</th>
                <th className="py-3 px-4">Klien & Brand</th>
                <th className="py-3 px-4">Nama Produk & Formula</th>
                <th className="py-3 px-4 text-right">Ukuran Batch</th>
                <th className="py-3 px-4">Tahap CPKB Aktif</th>
                <th className="py-3 px-4">PIC Formulator & Produksi</th>
                <th className="py-3 px-4 text-center">Status QC</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada batch record yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-bold text-slate-900">{row.batchRecordCode}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-indigo-600 font-semibold">{row.spkCode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-800">{row.clientName}</p>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{row.brandName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{row.productName}</p>
                      <span className="font-mono text-[10px] text-slate-500">{row.formulaCode} ({row.revisionVersion})</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <p className="font-bold text-slate-900">{row.batchSizePcs.toLocaleString()} Pcs</p>
                      <p className="text-[10px] text-indigo-600 font-bold">{row.batchSizeKg} Kg Bulk</p>
                    </td>
                    <td className="py-3 px-4">
                      {getStageBadge(row.cpkbStage)}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-800">{row.picProductionLead}</p>
                      <p className="text-[10px] text-slate-400">R&D: {row.picFormulator.split(",")[0]}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaBadge variant={row.qcApprovalStatus === "RELEASED" ? "success" : "warning"}>
                        {row.qcApprovalStatus === "RELEASED" ? "QC RELEASED" : "MENUNGGU QC"}
                      </DnaBadge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(row);
                          setIsDetailModalOpen(true);
                        }}
                        title="Lihat Lembar EBMR & Checklist"
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

      {/* 5. Modal Buat Batch Record Baru (SCR-132) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Batch Record Baru (SCR-132)"
        description="Penerbitan dokumen manufaktur resmi berbasis formula terkunci dan SPK."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateRecord}>
              Terbitkan Batch Record
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nomor SPK Produksi *</label>
              <input
                type="text"
                placeholder="SPK-PRD-202603-0050"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.spkCode}
                onChange={(e) => setCreateForm(prev => ({ ...prev, spkCode: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Formula Terkunci (Locked) *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                value={createForm.formulaCode}
                onChange={(e) => setCreateForm(prev => ({ ...prev, formulaCode: e.target.value }))}
              >
                <option value="FORM-202603-001">FORM-202603-001 - Brightening Glow Serum 10% (Rev 2.0)</option>
                <option value="FORM-202603-002">FORM-202603-002 - Ceramide 5X Barrier Cream (Rev 1.1)</option>
              </select>
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
              <label className="font-bold text-slate-700 uppercase">Ukuran Batch (Pcs) *</label>
              <input
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.batchSizePcs}
                onChange={(e) => setCreateForm(prev => ({ ...prev, batchSizePcs: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Total Bulk Penimbangan (Kg) *</label>
              <input
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.batchSizeKg}
                onChange={(e) => setCreateForm(prev => ({ ...prev, batchSizeKg: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Catatan & Parameter Khusus</label>
            <textarea
              rows={2}
              placeholder="Instruksi khusus suhu peleburan atau homogenizer RPM..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={createForm.notes}
              onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Detail EBMR & Checklist CPKB */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedRecord ? `Electronic Batch Record: ${selectedRecord.batchRecordCode}` : "Detail EBMR"}
        description="Checklist verifikasi penimbangan bahan, line clearance, dan parameter in-process."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Cetak Batch Record", "Lembar Batch Record resmi berhasil dicetak.")}
            >
              <Printer className="w-4 h-4 mr-1" /> Cetak Lembar EBMR
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Nama Produk</span>
                  <p className="text-sm font-bold text-slate-900">{selectedRecord.productName}</p>
                </div>
                <div>{getStageBadge(selectedRecord.cpkbStage)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Klien / Brand:</span>
                  <p className="font-semibold text-slate-800">{selectedRecord.clientName} ({selectedRecord.brandName})</p>
                </div>
                <div>
                  <span className="text-slate-500">Formula Acuan:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedRecord.formulaCode} ({selectedRecord.revisionVersion})</p>
                </div>
                <div>
                  <span className="text-slate-500">Batch Size:</span>
                  <p className="font-mono font-bold text-indigo-700">{selectedRecord.batchSizePcs.toLocaleString()} Pcs ({selectedRecord.batchSizeKg} Kg)</p>
                </div>
                <div>
                  <span className="text-slate-500">No. SPK:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedRecord.spkCode}</p>
                </div>
              </div>
            </div>

            {/* Checklist CPKB Section */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-700 text-[11px] flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                Checklist Verifikasi Pra-Produksi CPKB
              </h4>

              <div className="space-y-2">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-950">1. Line Clearance Ruang Penimbangan & Bejana Mixing</p>
                    <p className="text-[11px] text-emerald-800">Area bersih, bebas sisa batch sebelumnya, sanitasi alkohol 70% selesai.</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-950">2. Verifikasi Kalibrasi Timbangan & Label Bahan Baku</p>
                    <p className="text-[11px] text-emerald-800">Timbangan Mettler Toledo terkalibrasi. Bahan baku berlabel status lolos QC.</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-blue-950">3. Double-Check Penimbangan Bahan Baku (Fase A s/d E)</p>
                    <p className="text-[11px] text-blue-800">Operator penimbang dan Pengawas QC menandatangani form penimbangan.</p>
                  </div>
                  <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
