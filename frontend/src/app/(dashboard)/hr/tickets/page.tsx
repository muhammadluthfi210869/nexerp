"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  Users,
  AlertCircle,
  FileCheck,
  Printer,
  FileSpreadsheet
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaTabNav,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface HrTicketItem {
  id: string;
  ticketNo: string;
  empId: string;
  empName: string;
  department: string;
  type: "CUTI_TAHUNAN" | "IZIN_SAKIT" | "LEMBUR_PRODUKSI" | "DINAS_LUAR" | "CUTI_MELAHIRKAN";
  startDate: string;
  endDate: string;
  duration: string;
  reason: string;
  approver: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export default function HrTicketsPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"tickets" | "leaves" | "spl">("tickets");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HrTicketItem | null>(null);

  // Form states
  const [newTicket, setNewTicket] = useState({
    empName: "Budi Santoso, S.T",
    type: "CUTI_TAHUNAN" as const,
    startDate: "2026-09-20",
    endDate: "2026-09-21",
    reason: ""
  });

  // Fetch tickets from backend
  const { data: tickets = [] } = useQuery<HrTicketItem[]>({
    queryKey: ["hr-tickets"],
    queryFn: () => api.get("/hr/tickets").then(r => unwrapResponse(r.data) ?? []),
  });

  // Status update mutation (approve/reject)
  const updateTicketStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      api.patch(`/hr/tickets/${id}`, { status }),
    onSuccess: (_, vars) => {
      toast.success(`Tiket berhasil di${vars.status === "APPROVED" ? "setujui" : "tolak"}!`);
      queryClient.invalidateQueries({ queryKey: ["hr-tickets"] });
    },
    onError: () => toast.error("Gagal memperbarui status tiket."),
  });

  const pendingCount = tickets.filter(t => t.status === "PENDING").length;
  const approvedCount = tickets.filter(t => t.status === "APPROVED").length;
  const splCount = tickets.filter(t => t.type === "LEMBUR_PRODUKSI").length;

  const filteredTickets = tickets.filter(t => {
    const matchSearch = t.empName.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === "ALL" || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.reason) {
      toast.error("Alasan pengajuan wajib diisi!");
      return;
    }
    toast.success("Pengajuan tiket berhasil dikirim ke atasan!");
    setIsCreateModalOpen(false);
    setNewTicket({ empName: "Budi Santoso, S.T", type: "CUTI_TAHUNAN", startDate: "2026-09-20", endDate: "2026-09-21", reason: "" });
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Izin, Cuti & Lembur (Employee Request Tickets)"
        description="Portal persetujuan bertingkat izin sakit, cuti tahunan, dinas luar kota, dan Surat Perintah Lembur (SPL) operator manufaktur."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCount} Tiket Menunggu Approval</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Rekap
            </DnaButton>
            <DnaButton variant="secondary" size="md" onClick={() => toast.success("Exporting Log Tiket ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Pengajuan Baru
            </DnaButton>
          </div>
        }
      />

      {/* KPI STAT CARDS */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Menunggu Approval Manager"
          value={pendingCount + " Tiket"}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Perlu Verifikasi", isPositive: false }}
          subtext="Review Atasan & HR"
          variant="warning"
        />
        <DnaStatCard
          label="Cuti Disetujui (Bulan Ini)"
          value={approvedCount + " Tiket"}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Quota Terjaga", isPositive: true }}
          subtext="Total Hari Kerja Cuti"
          variant="success"
        />
        <DnaStatCard
          label="Surat Perintah Lembur (SPL)"
          value={splCount + " Sesi"}
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
          subtext="Kebutuhan Target Batch Manufaktur"
          variant="purple"
        />
        <DnaStatCard
          label="Sisa Kuota Cuti Karyawan"
          value="Rata-rata 8.5 Hari"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          subtext="Hak Cuti Tahunan 12 Hari/Thn"
          variant="info"
        />
      </DnaKpiGrid>

      {/* TAB NAVIGATION */}
      <DnaTabNav
        tabs={[
          { id: "tickets", label: "Semua Tiket Pengajuan", icon: FileText, count: tickets.length },
          { id: "leaves", label: "Cuti & Izin Sakit", icon: Calendar },
          { id: "spl", label: "Surat Perintah Lembur (SPL)", icon: Clock }
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      {/* DATA TABLE */}
      <DnaDataTableCard
        title="Daftar Pengajuan Tiket Personalia"
        badge={<DnaBadge variant="purple">{filteredTickets.length} Tiket</DnaBadge>}
        customToolbar={
          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no tiket atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold"
            >
              <option value="ALL">Semua Jenis Pengajuan</option>
              <option value="CUTI_TAHUNAN">Cuti Tahunan</option>
              <option value="IZIN_SAKIT">Izin Sakit</option>
              <option value="LEMBUR_PRODUKSI">Surat Perintah Lembur (SPL)</option>
              <option value="DINAS_LUAR">Dinas Luar</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">No Tiket</th>
                <th className="px-3.5 py-3">Karyawan & Departemen</th>
                <th className="px-3.5 py-3">Jenis Pengajuan</th>
                <th className="px-3.5 py-3">Jadwal / Rentang Waktu</th>
                <th className="px-3.5 py-3 text-center">Durasi</th>
                <th className="px-3.5 py-3">Alasan / Catatan</th>
                <th className="px-3.5 py-3">Approver</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((tck) => (
                <tr key={tck.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-900">
                    {tck.ticketNo}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="font-bold text-slate-900">{tck.empName}</div>
                    <div className="text-[11px] text-slate-500">{tck.department}</div>
                  </td>
                  <td className="px-3.5 py-3">
                    <DnaBadge
                      variant={
                        tck.type === "LEMBUR_PRODUKSI" ? "purple" :
                        tck.type === "CUTI_TAHUNAN" ? "info" :
                        tck.type === "IZIN_SAKIT" ? "warning" : "default"
                      }
                    >
                      {tck.type.replace("_", " ")}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-3 text-slate-700">
                    <div>{tck.startDate}</div>
                    {tck.startDate !== tck.endDate && <div className="text-[11px] text-slate-400">s/d {tck.endDate}</div>}
                  </td>
                  <td className="px-3.5 py-3 text-center font-bold text-slate-900">
                    {tck.duration}
                  </td>
                  <td className="px-3.5 py-3 text-slate-600 max-w-[200px] truncate">
                    {tck.reason}
                  </td>
                  <td className="px-3.5 py-3 font-semibold text-slate-700">
                    {tck.approver}
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <DnaBadge
                      variant={
                        tck.status === "APPROVED" ? "success" :
                        tck.status === "PENDING" ? "warning" : "critical"
                      }
                    >
                      {tck.status}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {tck.status === "PENDING" ? (
                        <>
                          <DnaButton
                            variant="primary"
                            size="sm"
                            onClick={() => updateTicketStatus.mutate({ id: tck.id, status: "APPROVED" })}
                          >
                            Setujui
                          </DnaButton>
                          <DnaButton
                            variant="danger"
                            size="sm"
                            onClick={() => updateTicketStatus.mutate({ id: tck.id, status: "REJECTED" })}
                          >
                            Tolak
                          </DnaButton>
                        </>
                      ) : (
                        <DnaButton variant="ghost" size="sm" onClick={() => setSelectedTicket(tck)}>
                          Detail
                        </DnaButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL: BUAT PENGAJUAN BARU */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Formulir Pengajuan Izin / Cuti / Lembur"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Karyawan *</label>
            <select
              value={newTicket.empName}
              onChange={(e) => setNewTicket({ ...newTicket, empName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="Budi Santoso, S.T">Budi Santoso - Produksi Mixing</option>
              <option value="Rian Saputra, S.Farm">Rian Saputra - R&D Formulasi</option>
              <option value="Siti Rahmawati, S.Si">Siti Rahmawati - QC Mikrobiologi</option>
              <option value="Dewi Lestari, S.E">Dewi Lestari - BusDev</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Pengajuan *</label>
            <select
              value={newTicket.type}
              onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value as any })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="CUTI_TAHUNAN">Cuti Tahunan (Tahunan / Pribadi)</option>
              <option value="IZIN_SAKIT">Izin Sakit (Surat Dokter)</option>
              <option value="LEMBUR_PRODUKSI">Surat Perintah Lembur (SPL Produksi)</option>
              <option value="DINAS_LUAR">Perjalanan Dinas Luar Kota</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai *</label>
              <input
                type="date"
                required
                value={newTicket.startDate}
                onChange={(e) => setNewTicket({ ...newTicket, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai *</label>
              <input
                type="date"
                required
                value={newTicket.endDate}
                onChange={(e) => setNewTicket({ ...newTicket, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alasan Pengajuan & Keterangan *</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan kebutuhan pengajuan cuti/lembur secara spesifik..."
              value={newTicket.reason}
              onChange={(e) => setNewTicket({ ...newTicket, reason: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <DnaButton variant="secondary" size="md" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" type="submit">
              Kirim Tiket Pengajuan
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </DnaPageContainer>
  );
}
