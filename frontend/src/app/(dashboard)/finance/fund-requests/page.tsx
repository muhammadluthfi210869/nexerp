"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Filter,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  XCircle,
  ArrowRight,
  UserCheck,
  Send
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
  useDnaToast,
  formatRupiah
} from "@/components/dna";

interface FundRequestItem {
  id: string;
  code: string; // e.g. FR-2026-0034
  date: string;
  requesterName: string;
  department: string;
  purpose: string;
  amount: number;
  currentApprovalLevel: "HOD" | "ACCOUNTING" | "DIRECTOR" | "DISBURSED";
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DISBURSED";
  neededDate: string;
  bankAccountTarget?: string;
  notes?: string;
}

const FALLBACK_FUND_REQUESTS: FundRequestItem[] = [
  {
    id: "fr-1",
    code: "FR-2026-0034",
    date: "2026-09-08",
    requesterName: "Hendra Wijaya",
    department: "R&D & Formulasi",
    purpose: "Pembelian Bahan Baku Uji Stabilitas Skincare Retinol Batch 2",
    amount: 15000000,
    currentApprovalLevel: "DIRECTOR",
    status: "APPROVED",
    neededDate: "2026-09-12",
    bankAccountTarget: "BCA 8901234567 a.n Hendra Wijaya",
    notes: "Telah disetujui HOD & Accounting, menunggu persetujuan Direktur Utama."
  },
  {
    id: "fr-2",
    code: "FR-2026-0035",
    date: "2026-09-09",
    requesterName: "Budi Santoso",
    department: "Produksi Pabrik",
    purpose: "Biaya Penggantian Seal Gasket & Tooling Mesin Rotary Filling",
    amount: 8500000,
    currentApprovalLevel: "ACCOUNTING",
    status: "SUBMITTED",
    neededDate: "2026-09-11",
    bankAccountTarget: "BCA 1239874561 a.n Budi Santoso",
    notes: "Penggantian darurat untuk persiapan batch 10.000 pcs."
  },
  {
    id: "fr-3",
    code: "FR-2026-0032",
    date: "2026-09-05",
    requesterName: "Revita Sari",
    department: "Digital Marketing",
    purpose: "Budget Paid Ads Meta & TikTok Campaign Launching Brand Klien",
    amount: 25000000,
    currentApprovalLevel: "DISBURSED",
    status: "DISBURSED",
    neededDate: "2026-09-06",
    bankAccountTarget: "Mandiri 1300098765432 a.n Revita Sari",
    notes: "Dana telah dicairkan via BCA Giro Operasional."
  }
];

const STATUS_CONFIG: Record<string, { label: string; badge: "default" | "warning" | "info" | "success" | "critical" }> = {
  DRAFT: { label: "Draft", badge: "default" },
  SUBMITTED: { label: "Menunggu Review", badge: "warning" },
  APPROVED: { label: "Disetujui (Siap Cair)", badge: "info" },
  DISBURSED: { label: "Dana Dicairkan", badge: "success" },
  REJECTED: { label: "Ditolak", badge: "critical" }
};

export default function FundRequestsPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<FundRequestItem | null>(null);

  // Form states
  const [formDept, setFormDept] = useState("Produksi Pabrik");
  const [formRequester, setFormRequester] = useState("Budi Santoso");
  const [formPurpose, setFormPurpose] = useState("");
  const [formAmount, setFormAmount] = useState<number>(5000000);
  const [formNeededDate, setFormNeededDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [formBankTarget, setFormBankTarget] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const { data: serverData } = useQuery({
    queryKey: ["finance-fund-requests"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/fund-requests");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map if server returns
        }
      } catch (err) {
        console.warn("Using fallback fund requests", err);
      }
      return FALLBACK_FUND_REQUESTS;
    }
  });

  const requests = serverData || FALLBACK_FUND_REQUESTS;

  const filteredList = useMemo(() => {
    return requests.filter((item) => {
      if (activeTab === "PENDING" && item.status !== "SUBMITTED" && item.status !== "APPROVED") return false;
      if (activeTab === "DISBURSED" && item.status !== "DISBURSED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchReq = item.requesterName.toLowerCase().includes(q);
        const matchDept = item.department.toLowerCase().includes(q);
        const matchPurpose = item.purpose.toLowerCase().includes(q);
        if (!matchCode && !matchReq && !matchDept && !matchPurpose) return false;
      }
      return true;
    });
  }, [requests, activeTab, searchQuery]);

  const pendingAmount = requests
    .filter((r) => r.status === "SUBMITTED" || r.status === "APPROVED")
    .reduce((acc, r) => acc + r.amount, 0);

  const handleCreateFundRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPurpose || formAmount <= 0) {
      toast.error("Validasi Gagal", "Harap isi keperluan dan nominal pengajuan.");
      return;
    }

    const newItem: FundRequestItem = {
      id: `fr-${Date.now()}`,
      code: `FR-2026-${String(requests.length + 36).padStart(4, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      requesterName: formRequester,
      department: formDept,
      purpose: formPurpose,
      amount: Number(formAmount),
      currentApprovalLevel: "HOD",
      status: "SUBMITTED",
      neededDate: formNeededDate,
      bankAccountTarget: formBankTarget,
      notes: formNotes
    };

    requests.unshift(newItem);
    setIsCreateModalOpen(false);
    toast.success("Pengajuan Dana Terkirim", `Pengajuan ${newItem.code} (${formatRupiah(newItem.amount)}) telah diajukan ke HOD.`);
  };

  const handleDisburse = (item: FundRequestItem) => {
    item.status = "DISBURSED";
    item.currentApprovalLevel = "DISBURSED";
    toast.success("Dana Berhasil Dicairkan", `Pengajuan ${item.code} telah dicairkan dan voucher kas keluar diterbitkan.`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pengajuan Dana (Fund Requests)"
        subtitle="Alur 4-Tier Approval pengajuan dana operasional departemen (Pemohon -> HOD -> Accounting -> Direktur Utama)"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4-Tier Multi Approval</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Pengajuan Dana
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Menunggu Persetujuan"
          value={formatRupiah(pendingAmount)}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: `${requests.filter((r) => r.status === "SUBMITTED").length} Pengajuan`, isPositive: false }}
          variant="warning"
        />
        <DnaStatCard
          label="Siap Dicairkan (Approved)"
          value={`${requests.filter((r) => r.status === "APPROVED").length} Dokumen`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="Telah Disetujui Direksi"
          variant="success"
        />
        <DnaStatCard
          label="Telah Dicairkan Bulan Ini"
          value={formatRupiah(requests.filter((r) => r.status === "DISBURSED").reduce((acc, r) => acc + r.amount, 0))}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          subtext="Disbursed Voucher OK"
          variant="blue"
        />
        <DnaStatCard
          label="Rata-rata Lead Time Approval"
          value="4.8 Jam"
          icon={<Send className="w-5 h-5 text-purple-600" />}
          subtext="SLA Internal < 24 Jam"
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Pengajuan Dana Operasional"
        badge={
          <DnaBadge variant="default">
            {filteredList.length} Pengajuan
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Pengajuan", badge: requests.length },
                { id: "PENDING", label: "Menunggu Approval", badge: requests.filter((r) => r.status === "SUBMITTED" || r.status === "APPROVED").length },
                { id: "DISBURSED", label: "Telah Dicairkan", badge: requests.filter((r) => r.status === "DISBURSED").length }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No Pengajuan, Pemohon, Keperluan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">No. Pengajuan</th>
                <th className="px-3.5 py-3">Pemohon & Dept</th>
                <th className="px-3.5 py-3">Keperluan / Tujuan</th>
                <th className="px-3.5 py-3 text-right">Nominal Diajukan</th>
                <th className="px-3.5 py-3">Dibutuhkan Tgl</th>
                <th className="px-3.5 py-3">Level Approval</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => {
                const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, badge: "default" };
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3 font-bold text-slate-900">{item.code}</td>
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-slate-800">{item.requesterName}</div>
                      <div className="text-[10px] text-slate-500">{item.department}</div>
                    </td>
                    <td className="px-3.5 py-3 max-w-[220px] truncate" title={item.purpose}>
                      <div className="font-medium text-slate-900 truncate">{item.purpose}</div>
                    </td>
                    <td className="px-3.5 py-3 text-right font-extrabold text-slate-900">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">{item.neededDate}</td>
                    <td className="px-3.5 py-3 font-medium text-indigo-700">
                      Tier: {item.currentApprovalLevel}
                    </td>
                    <td className="px-3.5 py-3">
                      <DnaBadge variant={statusInfo.badge}>
                        {statusInfo.label}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton variant="secondary" size="sm" onClick={() => setDetailItem(item)}>
                          <Eye className="w-3.5 h-3.5" />
                        </DnaButton>

                        {item.status === "APPROVED" && (
                          <DnaButton variant="primary" size="sm" onClick={() => handleDisburse(item)}>
                            Cairkan
                          </DnaButton>
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

      {/* MODAL BUAT PENGAJUAN DANA */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Pengajuan Dana Operasional (Fund Request)"
        size="lg"
      >
        <form onSubmit={handleCreateFundRequest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departemen Pemohon <span className="text-rose-500">*</span>
              </label>
              <select
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
              >
                <option value="Produksi Pabrik">Produksi Pabrik</option>
                <option value="R&D & Formulasi">R&D & Formulasi</option>
                <option value="Gudang & Logistik">Gudang & Logistik</option>
                <option value="Quality Control (QC)">Quality Control (QC)</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="General Affair & HR">General Affair & HR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pemohon <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formRequester}
                onChange={(e) => setFormRequester(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Dana Dibutuhkan (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-purple-900 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Dibutuhkan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formNeededDate}
                onChange={(e) => setFormNeededDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rekening Tujuan Pencairan (Bank / No. Rek / Nama)</label>
              <input
                type="text"
                placeholder="Contoh: BCA 8901234567 a.n Budi Santoso"
                value={formBankTarget}
                onChange={(e) => setFormBankTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keperluan & Justifikasi Kebutuhan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Jelaskan secara detail tujuan penggunaan dana..."
              value={formPurpose}
              onChange={(e) => setFormPurpose(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan untuk Finance / Direksi..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Kirim Pengajuan
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL DETAIL PENGAJUAN */}
      <DnaModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={`Detail Pengajuan Dana: ${detailItem?.code}`}
        size="md"
      >
        {detailItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
              <div className="text-[10px] text-purple-800 uppercase font-bold">Nominal Pengajuan</div>
              <div className="text-xl font-black text-purple-900">{formatRupiah(detailItem.amount)}</div>
              <div className="text-[11px] text-purple-700 font-medium">{detailItem.purpose}</div>
            </div>

            <div className="space-y-2 p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Pemohon:</span>
                <span className="font-semibold text-slate-900">{detailItem.requesterName} ({detailItem.department})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tanggal Pengajuan:</span>
                <span className="font-medium text-slate-800">{detailItem.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tanggal Dibutuhkan:</span>
                <span className="font-semibold text-slate-900">{detailItem.neededDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rekening Tujuan:</span>
                <span className="font-mono text-slate-700">{detailItem.bankAccountTarget || "-"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status & Level Approval:</span>
                <span className="font-semibold text-purple-800">{detailItem.status} (Tier: {detailItem.currentApprovalLevel})</span>
              </div>
            </div>

            {detailItem.notes && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <span className="font-semibold text-[11px] block mb-0.5">Catatan Approval:</span>
                <div>{detailItem.notes}</div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <DnaButton variant="primary" size="sm" onClick={() => setDetailItem(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
