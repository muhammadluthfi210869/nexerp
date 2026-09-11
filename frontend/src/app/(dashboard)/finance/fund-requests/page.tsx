"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Eye,
  Search,
  Filter,
  DollarSign,
  Printer,
  Upload,
  UserCheck,
  AlertTriangle,
  Building2,
  Wallet
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
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect,
  DnaTextarea
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

interface FundRequestItem {
  id: string;
  requestNo: string;
  applicant: string;
  level: "STAFF" | "HEAD_DIVISI";
  department: string;
  purpose: string;
  amount: number;
  currentApprovalLevel: "HEAD_DIVISI" | "ACCOUNTING" | "DIREKTUR" | "COMPLETED";
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "DISBURSED";
  requestDate: string;
  requiredDate: string;
  notes?: string;
}

const FALLBACK_REQUESTS: FundRequestItem[] = [
  { id: "1", requestNo: "FR-2609-001", applicant: "Ahmad Staff Gudang", level: "STAFF", department: "Gudang & Logistik", purpose: "Pengadaan Pallet Kayu Standar CPKB 50 Unit", amount: 7500000, currentApprovalLevel: "ACCOUNTING", status: "PENDING_APPROVAL", requestDate: "2026-09-08", requiredDate: "2026-09-12" },
  { id: "2", requestNo: "FR-2609-002", applicant: "Budi Santoso (Head)", level: "HEAD_DIVISI", department: "Produksi Manufaktur", purpose: "Sparepart Katup Seal Homogenizer High-Speed", amount: 18500000, currentApprovalLevel: "DIREKTUR", status: "PENDING_APPROVAL", requestDate: "2026-09-07", requiredDate: "2026-09-10" },
  { id: "3", requestNo: "FR-2609-003", applicant: "Rian Saputra", level: "STAFF", department: "R&D Formulasi", purpose: "Bahan Uji Mikrobiologi & Media Kultur Cepat", amount: 4200000, currentApprovalLevel: "COMPLETED", status: "DISBURSED", requestDate: "2026-09-02", requiredDate: "2026-09-05" },
  { id: "4", requestNo: "FR-2609-004", applicant: "Dewi Lestari (Head)", level: "HEAD_DIVISI", department: "Business Development", purpose: "Sewa Booth Pameran Maklon Kosmetik Jakarta", amount: 35000000, currentApprovalLevel: "COMPLETED", status: "APPROVED", requestDate: "2026-09-01", requiredDate: "2026-09-15" },
];

export default function FundRequestsPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FundRequestItem | null>(null);

  // Create Form (SCR-112)
  const [formData, setFormData] = useState({
    level: "STAFF",
    applicant: "",
    department: "Produksi Manufaktur",
    purpose: "",
    amount: "",
    requiredDate: new Date().toISOString().split("T")[0]
  });

  const totalPengajuanBulanIni = useMemo(() => {
    return FALLBACK_REQUESTS.reduce((acc, r) => acc + r.amount, 0);
  }, []);

  const totalMenungguApproval = useMemo(() => {
    return FALLBACK_REQUESTS.filter((r) => r.status === "PENDING_APPROVAL").length;
  }, []);

  const totalDisbursed = useMemo(() => {
    return FALLBACK_REQUESTS.filter((r) => r.status === "DISBURSED").reduce((acc, r) => acc + r.amount, 0);
  }, []);

  const filteredRequests = useMemo(() => {
    return FALLBACK_REQUESTS.filter((r) => {
      const matchSearch =
        r.requestNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.purpose.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchDept = departmentFilter === "ALL" || r.department === departmentFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [searchQuery, statusFilter, departmentFilter]);

  const handleSubmit = () => {
    if (!formData.applicant || !formData.purpose || !formData.amount) {
      toast.error("Mohon lengkapi seluruh formulir pengajuan dana!");
      return;
    }
    toast.success("Pengajuan dana berhasil disubmit ke alur persetujuan!");
    setIsCreateModalOpen(false);
  };

  const handleApprove = (req: FundRequestItem) => {
    toast.success(`Pengajuan dana ${req.requestNo} berhasil disetujui!`);
    setSelectedRequest(null);
  };

  const handleDisburse = (req: FundRequestItem) => {
    toast.success(`Dana ${req.requestNo} (${formatRupiah(req.amount)}) berhasil dicairkan! Kas Keluar otomatis dibuat.`);
    setSelectedRequest(null);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pengajuan Dana (Fund Request)"
        description="Alur persetujuan pengeluaran dana operasional bertingkat (Staff -> Head -> Accounting -> Direktur) dengan otomatisasi mutasi kas keluar."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Poin 22-24: Pengganti Google Form & Multi-tier Approval</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Pengajuan Dana
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS (SCR-111) */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Pengajuan Bulan Ini"
          value={formatRupiah(totalPengajuanBulanIni)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          delta={{ value: `${FALLBACK_REQUESTS.length} Pengajuan`, isPositive: true }}
          subtext="Total Permintaan Dana Masuk"
          variant="info"
        />
        <DnaStatCard
          label="Menunggu Approval"
          value={`${totalMenungguApproval} Permintaan`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Action Required", isPositive: false }}
          subtext="Perlu Verifikasi Manager/Accounting"
          variant="warning"
        />
        <DnaStatCard
          label="Sudah Dicairkan (Disbursed)"
          value={formatRupiah(totalDisbursed)}
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Kas Keluar Posted", isPositive: true }}
          subtext="Dana Telah Diberikan ke Pemohon"
          variant="success"
        />
      </DnaKpiGrid>

      {/* TABLE LIST (SCR-111) */}
      <DnaDataTableCard
        title="Daftar Pengajuan Dana Operasional"
        badge={<DnaBadge variant="default">{filteredRequests.length} Pengajuan</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2">
<DnaSelect 
              value={departmentFilter}
              onChange={setDepartmentFilter}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Departemen</option>
              <option value="Produksi Manufaktur">Produksi Manufaktur</option>
              <option value="Gudang & Logistik">Gudang & Logistik</option>
              <option value="R&D Formulasi">R&D Formulasi</option>
              <option value="Business Development">Business Development</option>
            </DnaSelect>
<DnaSelect 
              value={statusFilter}
              onChange={setStatusFilter}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING_APPROVAL">Menunggu Approval</option>
              <option value="APPROVED">Disetujui</option>
              <option value="DISBURSED">Sudah Dicairkan</option>
              <option value="REJECTED">Ditolak</option>
            </DnaSelect>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari pemohon / keperluan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">No. Pengajuan</th>
                <th className="px-3.5 py-3">Pemohon</th>
                <th className="px-3.5 py-3">Departemen</th>
                <th className="px-3.5 py-3">Tujuan / Keperluan</th>
                <th className="px-3.5 py-3 text-right">Amount (Rp)</th>
                <th className="px-3.5 py-3 text-center">Level Approval</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3">Tgl Pengajuan</th>
                <th className="px-3.5 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-bold">{r.requestNo}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="font-bold text-slate-900">{r.applicant}</div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {r.level === "STAFF" ? "Staff" : "Head Divisi"}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700">{r.department}</td>
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium max-w-xs truncate">{r.purpose}</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">{formatRupiah(r.amount)}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      {r.currentApprovalLevel}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        r.status === "DISBURSED"
                          ? "success"
                          : r.status === "APPROVED"
                          ? "purple"
                          : r.status === "PENDING_APPROVAL"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {r.status.replace(/_/g, " ")}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">{r.requestDate}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <DnaButton variant="secondary" size="sm" onClick={() => setSelectedRequest(r)}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Lihat
                      </DnaButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT PENGAJUAN (SCR-112) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Form Pengajuan Dana Operasional (Fund Request)"
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Jenjang Pengaju *</label>
  <DnaSelect 
                value={formData.level}
                onChange={(value) => setFormData({ ...formData, level: value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="STAFF">Staff (Alur: Head ke Accounting ke Direktur)</option>
                <option value="HEAD_DIVISI">Head Divisi (Alur: Langsung Accounting ke Direktur)</option>
              </DnaSelect>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Departemen *</label>
  <DnaSelect 
                value={formData.department}
                onChange={(value) => setFormData({ ...formData, department: value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="Produksi Manufaktur">Produksi Manufaktur</option>
                <option value="Gudang & Logistik">Gudang & Logistik</option>
                <option value="R&D Formulasi">R&D Formulasi</option>
                <option value="Quality Control (QC)">Quality Control (QC)</option>
                <option value="Business Development">Business Development</option>
              </DnaSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nama Pemohon *</label>
              <DnaInput
                type="text"
                placeholder="e.g. Ahmad Staff Gudang"
                value={formData.applicant}
                onChange={(e) => setFormData({ ...formData, applicant: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal Dibutuhkan *</label>
              <DnaInput
                type="date"
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tujuan / Keperluan Dana *</label>
            <DnaTextarea
              rows={3}
              placeholder="Jelaskan secara rinci kebutuhan dan tujuan penggunaan dana..."
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nominal yang Diajukan (Rp) *</label>
              <DnaInput
                type="number"
                placeholder="e.g. 7500000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Lampiran Bukti / Invoice Penawaran</label>
              <div className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-2 bg-slate-50 cursor-pointer">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] text-slate-500">Upload file PDF/JPG...</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleSubmit}>
              Submit Pengajuan
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* DETAIL & APPROVAL MODAL (SCR-111) */}
      <DnaModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={`Detail Pengajuan Dana: ${selectedRequest?.requestNo}`}
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Pemohon / Jabatan:</span>
              <strong className="text-slate-800">{selectedRequest?.applicant} ({selectedRequest?.level})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Departemen:</span>
              <strong className="text-slate-800">{selectedRequest?.department}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tgl Pengajuan / Dibutuhkan:</span>
              <strong className="text-slate-800">{selectedRequest?.requestDate} s/d {selectedRequest?.requiredDate}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status Saat Ini:</span>
              <DnaBadge variant="warning">{selectedRequest?.status}</DnaBadge>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <span className="text-slate-500 block mb-1 font-semibold">Keperluan:</span>
              <p className="text-slate-800 bg-white p-2 rounded border border-slate-100 font-medium">
                {selectedRequest?.purpose}
              </p>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-900 font-bold">Total Nominal Diajukan:</span>
              <strong className="text-blue-700 font-black text-sm">
                {selectedRequest ? formatRupiah(selectedRequest.amount) : "0"}
              </strong>
            </div>
          </div>

          {/* APPROVAL ACTIONS */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedRequest(null)}>
              Tutup
            </DnaButton>
            <div className="flex items-center gap-2">
              {selectedRequest?.status === "PENDING_APPROVAL" && (
                <>
                  <DnaButton
                    variant="danger"
                    size="md"
                    onClick={() => {
                      toast.error("Pengajuan ditolak.");
                      setSelectedRequest(null);
                    }}
                  >
                    Tolak Pengajuan
                  </DnaButton>
                  <DnaButton variant="primary" size="md" onClick={() => selectedRequest && handleApprove(selectedRequest)}>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Setujui (Approve)
                  </DnaButton>
                </>
              )}
              {selectedRequest?.status === "APPROVED" && (
                <DnaButton variant="primary" size="md" onClick={() => selectedRequest && handleDisburse(selectedRequest)}>
                  <Wallet className="w-4 h-4 mr-1.5" />
                  Cairkan Dana (Disburse)
                </DnaButton>
              )}
            </div>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
