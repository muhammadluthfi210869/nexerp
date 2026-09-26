"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  DnaDetailDrawer,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaCell,
  DnaTable,
} from "@/components/dna";

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

export default function FundRequestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Pengajuan Dana...</div>}>
      <FundRequestsContent />
    </Suspense>
  );
}

function FundRequestsContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FundRequestItem | null>(null);

  const { data: rawRequests = [], refetch } = useQuery({
    queryKey: ["finance-fund-requests"],
    queryFn: async (): Promise<any[]> => {
      try {
        const res = await api.get("/finance/fund-requests");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const fundRequests: FundRequestItem[] = useMemo(() => {
    return rawRequests.map((req: any) => ({
      id: req.id,
      requestNo: req.requestNumber || `FR-${req.id?.slice(0, 8)}`,
      applicant: req.requester?.name || req.applicant || "Staff Pemohon",
      level: (req.level || "STAFF") as "STAFF" | "HEAD_DIVISI",
      department: req.department?.name || req.departmentId || "Operasional",
      purpose: req.reason || req.purpose || "Operasional",
      amount: Number(req.amount || 0),
      currentApprovalLevel: req.status === "APPROVED_BY_DIR" ? "COMPLETED" : req.status === "APPROVED_BY_MGR" ? "DIREKTUR" : "ACCOUNTING",
      status: req.status === "DISBURSED" ? "DISBURSED" : req.status === "REJECTED" ? "REJECTED" : req.status?.includes("APPROVED") ? "APPROVED" : "PENDING_APPROVAL",
      requestDate: req.createdAt ? new Date(req.createdAt).toISOString().split("T")[0] : "",
      requiredDate: req.requiredDate ? new Date(req.requiredDate).toISOString().split("T")[0] : "",
      notes: req.rejectReason || req.notes,
    }));
  }, [rawRequests]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

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
    return fundRequests.reduce((acc, r) => acc + r.amount, 0);
  }, [fundRequests]);

  const totalMenungguApproval = useMemo(() => {
    return fundRequests.filter((r) => r.status === "PENDING_APPROVAL").length;
  }, [fundRequests]);

  const totalDisbursed = useMemo(() => {
    return fundRequests.filter((r) => r.status === "DISBURSED").reduce((acc, r) => acc + r.amount, 0);
  }, [fundRequests]);

  const filteredRequests = useMemo(() => {
    return fundRequests.filter((r) => {
      const matchSearch =
        r.requestNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.purpose.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchDept = departmentFilter === "ALL" || r.department === departmentFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [fundRequests, searchQuery, statusFilter, departmentFilter]);

  const handleSubmit = async () => {
    if (!formData.purpose || !formData.amount) {
      toast.error("Mohon lengkapi seluruh formulir pengajuan dana!");
      return;
    }
    try {
      await api.post("/finance/fund-request", {
        departmentId: formData.department,
        amount: Number(formData.amount),
        reason: formData.purpose,
      });
      toast.success("Pengajuan dana berhasil disubmit ke alur persetujuan!");
      refetch();
      setIsCreateModalOpen(false);
      setFormData({
        level: "STAFF",
        applicant: "",
        department: "Produksi Manufaktur",
        purpose: "",
        amount: "",
        requiredDate: new Date().toISOString().split("T")[0]
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal mengajukan dana");
    }
  };

  const handleApprove = async (req: FundRequestItem) => {
    try {
      await api.patch(`/finance/fund-request/${req.id}/approve`, {
        approvedById: req.id,
      });
      toast.success(`Pengajuan dana ${req.requestNo} berhasil disetujui!`);
      refetch();
      setSelectedRequest(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyetujui pengajuan dana");
    }
  };

  const handleDisburse = async (req: FundRequestItem) => {
    try {
      await api.post(`/finance/fund-request/${req.id}/disburse`, {
        disbursedById: req.id,
        accountId: req.id,
      });
      toast.success(`Dana ${req.requestNo} (${formatRupiah(req.amount)}) berhasil dicairkan!`);
      refetch();
      setSelectedRequest(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal mencairkan dana");
    }
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
        tabs={[
          { id: "ALL", label: "Semua Pengajuan" },
          { id: "PENDING_APPROVAL", label: "Menunggu Approval" },
          { id: "APPROVED", label: "Disetujui" },
          { id: "DISBURSED", label: "Dicairkan" },
          { id: "REJECTED", label: "Ditolak" }
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
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
          delta={{ value: `${fundRequests.length} Pengajuan`, isPositive: true }}
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
        toolbarProps={{
          searchProps: {
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Cari pemohon / keperluan...",
          },
          filterElement: (
            <DnaSelect 
              value={departmentFilter}
              onChange={setDepartmentFilter}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Departemen</option>
              <option value="Produksi Manufaktur">Produksi Manufaktur</option>
              <option value="Gudang & Logistik">Gudang & Logistik</option>
              <option value="R&D Formulasi">R&D Formulasi</option>
              <option value="Business Development">Business Development</option>
            </DnaSelect>
          ),
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-2.5 w-[140px]">No. Pengajuan</th>
                <th className="px-4 py-2.5 w-[110px]">Tgl Pengajuan</th>
                <th className="px-4 py-2.5 w-[160px]">Pemohon</th>
                <th className="px-4 py-2.5 w-[160px]">Departemen</th>
                <th className="px-4 py-2.5 min-w-[200px]">Keperluan</th>
                <th className="px-4 py-2.5 w-[140px] text-center">Tahap Gate</th>
                <th className="px-4 py-2.5 w-[140px] text-right">Nominal (Rp)</th>
                <th className="px-4 py-2.5 w-[130px] text-center">Status</th>
                <th className="pr-4 py-2.5 w-[70px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRequest(r)}
                  className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2.5">
                    <DnaCell.Code code={r.requestNo} />
                  </td>
                  <td className="px-4 py-2.5">
                    <DnaCell.Text text={r.requestDate} />
                  </td>
                  <td className="px-4 py-2.5">
                    <DnaCell.Text text={r.applicant} />
                  </td>
                  <td className="px-4 py-2.5">
                    <DnaCell.Text text={r.department} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[12px] font-medium text-slate-800 line-clamp-1">{r.purpose}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {r.currentApprovalLevel}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <DnaCell.Numeric value={r.amount} prefix="Rp " />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <DnaBadge
                      status={
                        r.status === "DISBURSED"
                          ? "success"
                          : r.status === "APPROVED"
                          ? "info"
                          : r.status === "PENDING_APPROVAL"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {r.status.replace(/_/g, " ")}
                    </DnaBadge>
                  </td>
                  <td className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <DnaButton variant="ghost" className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" onClick={() => setSelectedRequest(r)} title="Lihat">
                      <Eye className="w-3.5 h-3.5" />
                    </DnaButton>
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

      {/* DETAIL & APPROVAL DRAWER (QUICK PEEK) */}
      <DnaDetailDrawer
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={`Pengajuan Dana: ${selectedRequest?.requestNo}`}
        subtitle={selectedRequest?.purpose}
        badge={
          selectedRequest && (
            <DnaBadge
              variant={
                selectedRequest.status === "DISBURSED"
                  ? "success"
                  : selectedRequest.status === "APPROVED"
                  ? "purple"
                  : selectedRequest.status === "PENDING_APPROVAL"
                  ? "warning"
                  : "critical"
              }
            >
              {selectedRequest.status.replace(/_/g, " ")}
            </DnaBadge>
          )
        }
        tabs={[
          {
            id: "info",
            label: "Rincian Permintaan",
            content: (
              <div className="space-y-4 p-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <div className="text-[11px] text-slate-500">Nomor Pengajuan</div>
                    <div className="tabular-nums font-bold text-blue-700 text-sm">{selectedRequest?.requestNo}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Tanggal Diajukan</div>
                    <div className="font-medium text-slate-800">{selectedRequest?.requestDate}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Pemohon & Jabatan</div>
                    <div className="font-semibold text-slate-900">{selectedRequest?.applicant} ({selectedRequest?.level})</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Departemen</div>
                    <div className="font-semibold text-slate-800">{selectedRequest?.department}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Target Tanggal Dibutuhkan</div>
                    <div className="font-medium text-amber-700 font-semibold">{selectedRequest?.requiredDate}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Gerbang Approval Aktif</div>
                    <div className="font-semibold text-blue-800">{selectedRequest?.currentApprovalLevel}</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">Tujuan / Keperluan Pengeluaran:</div>
                  <p className="text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                    {selectedRequest?.purpose}
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center">
                  <div>
                    <div className="text-[11px] text-blue-700 font-bold uppercase">Total Nominal Diajukan</div>
                    <div className="text-xl font-black text-blue-900">
                      {selectedRequest ? formatRupiah(selectedRequest.amount) : "0"}
                    </div>
                  </div>
                  <DnaBadge variant="info">4-TIER GOVERNANCE</DnaBadge>
                </div>
              </div>
            )
          },
          {
            id: "workflow",
            label: "Jalur Persetujuan (Workflow)",
            content: (
              <div className="p-4 space-y-3 text-xs">
                <div className="text-slate-500 font-medium">Matriks Approval Bertingkat Sesuai SOP Finansial:</div>
                <div className="space-y-2.5">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-emerald-900">1. Verifikasi Head Divisi</div>
                      <div className="text-[11px] text-emerald-700">Validasi urgensi pengadaan operasional</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center justify-between ${
                    selectedRequest?.currentApprovalLevel === "ACCOUNTING" ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
                  }`}>
                    <div>
                      <div className="font-bold text-slate-900">2. Review Accounting & Anggaran</div>
                      <div className="text-[11px] text-slate-600">Pengecekan budget COA dan alokasi dana</div>
                    </div>
                    {selectedRequest?.currentApprovalLevel === "ACCOUNTING" ? (
                      <Clock className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center justify-between ${
                    selectedRequest?.currentApprovalLevel === "DIREKTUR" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <div className="font-bold text-slate-900">3. Persetujuan Direktur Keuangan</div>
                      <div className="text-[11px] text-slate-600">Sign-off otorisasi pengeluaran dana &gt; Rp 10 Juta</div>
                    </div>
                    {selectedRequest?.currentApprovalLevel === "DIREKTUR" ? (
                      <Clock className="w-5 h-5 text-amber-600" />
                    ) : selectedRequest?.status === "DISBURSED" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <div className="text-[10px] text-slate-400 tabular-nums">MENUNGGU</div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center justify-between ${
                    selectedRequest?.status === "DISBURSED" ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <div className="font-bold text-slate-900">4. Pencairan Kas Keluar (Disbursement)</div>
                      <div className="text-[11px] text-slate-600">Posting otomatis bukti kas keluar & transfer bank</div>
                    </div>
                    {selectedRequest?.status === "DISBURSED" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <div className="text-[10px] text-slate-400 tabular-nums">STANDBY</div>
                    )}
                  </div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
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
                    Tolak
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
        }
      />
    </DnaPageContainer>
  );
}
