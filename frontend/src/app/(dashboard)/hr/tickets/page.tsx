"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Users,
  AlertCircle,
  FileCheck,
  Printer,
  FileSpreadsheet,
  Eye,
  Check,
  X,
  Loader2,
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
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell
} from "@/components/dna";

interface HrTicketItem {
  id: string;
  ticketNo: string;
  empId: string;
  empName: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason: string;
  approver: string;
  status: string;
}

export default function HrTicketsPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HrTicketItem | null>(null);

  // Live queries
  const { data: rawTickets = [], isLoading } = useQuery({
    queryKey: ["hr-tickets"],
    queryFn: async () => {
      const res = await api.get("/hr/tickets");
      return res.data;
    },
  });

  const { data: rawEmployees = [] } = useQuery({
    queryKey: ["hr-employees"],
    queryFn: async () => {
      const res = await api.get("/hr/employees");
      return res.data;
    },
  });

  const employees = Array.isArray(rawEmployees) ? rawEmployees : [];

  const tickets: HrTicketItem[] = useMemo(() => {
    if (!rawTickets || !Array.isArray(rawTickets) || rawTickets.length === 0) return [];
    return rawTickets.map((t: any, idx: number) => {
      const sDate = t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : "-";
      const eDate = t.endDate ? new Date(t.endDate).toISOString().slice(0, 10) : sDate;
      const durationDays = (t.startDate && t.endDate)
        ? Math.max(1, Math.round((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;

      return {
        id: t.id || `tck-${idx}`,
        ticketNo: t.id ? `REQ-LV-${String(t.id).slice(0, 6).toUpperCase()}` : `REQ-LV-${idx + 1}`,
        empId: t.employee?.employeeId || t.employee?.nik || t.employeeId || `EMP-${idx + 1}`,
        empName: t.employee?.name || t.employee?.fullName || "Karyawan",
        department: t.employee?.department || "Operasional",
        type: t.type || "LEAVE",
        startDate: sDate,
        endDate: eDate,
        duration: `${durationDays} Hari`,
        reason: t.reason || "-",
        approver: t.approver?.name || "Manager",
        status: t.status || "PENDING",
      };
    });
  }, [rawTickets]);

  // Form states
  const [newTicket, setNewTicket] = useState({
    employeeId: "",
    type: "LEAVE",
    startDate: "2026-09-20",
    endDate: "2026-09-21",
    reason: ""
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/hr/tickets", payload)).data;
    },
    onSuccess: () => {
      toast.success("Pengajuan tiket berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["hr-tickets"] });
      setIsCreateModalOpen(false);
      setNewTicket({
        employeeId: employees[0]?.id || "",
        type: "LEAVE",
        startDate: "2026-09-20",
        endDate: "2026-09-21",
        reason: ""
      });
    },
    onError: (err: any) => {
      toast.error("Gagal membuat pengajuan tiket!", extractApiError(err));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (status === "APPROVED") {
        return (await api.patch(`/hr/tickets/${id}/approve`, {})).data;
      }
      return (await api.patch(`/hr/tickets/${id}/reject`, {})).data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Tiket berhasil di-${vars.status === "APPROVED" ? "setujui" : "tolak"}!`);
      queryClient.invalidateQueries({ queryKey: ["hr-tickets"] });
      setSelectedTicket(null);
    },
    onError: (err: any) => {
      toast.error("Gagal memperbarui status tiket!", extractApiError(err));
    },
  });

  const pendingCount = tickets.filter(t => t.status === "PENDING").length;
  const approvedCount = tickets.filter(t => t.status === "APPROVED").length;
  const splCount = tickets.filter(t => t.type === "OVERTIME" || t.type === "LEMBUR_PRODUKSI").length;

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch =
        t.empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === "ALL" || t.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [tickets, searchQuery, typeFilter]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const empId = newTicket.employeeId || employees[0]?.id;
    if (!empId) {
      toast.error("Pilih karyawan terlebih dahulu!");
      return;
    }
    if (!newTicket.reason.trim()) {
      toast.error("Alasan pengajuan wajib diisi!");
      return;
    }
    createMutation.mutate({
      employeeId: empId,
      type: newTicket.type,
      startDate: new Date(newTicket.startDate).toISOString(),
      endDate: new Date(newTicket.endDate).toISOString(),
      reason: newTicket.reason,
    });
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Izin, Cuti & Lembur (Employee Request Tickets)"
        description="Portal persetujuan bertingkat izin sakit, cuti tahunan, dinas luar kota, dan Surat Perintah Lembur (SPL) operator manufaktur."
        tabs={[
          { id: "ALL", label: "Semua Tiket", count: tickets.length },
          { id: "LEAVE", label: "Cuti & Izin" },
          { id: "OVERTIME", label: "Lembur (SPL)" },
          { id: "REIMBURSE", label: "Reimburse & Dinas" },
        ]}
        activeTab={typeFilter}
        onTabChange={setTypeFilter}
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

      {/* DATA TABLE */}
      <DnaDataTableCard
        customToolbar={
          <div className="flex items-center justify-between w-full">
            <div className="relative w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari no tiket, nama, atau divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-semibold text-slate-800">{filteredTickets.length}</span> Tiket Pengajuan
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left min-w-[1150px]">
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <DnaTh className="px-3.5 py-2.5 w-[120px]">No Tiket</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[120px]">NIK</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Karyawan</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Departemen</DnaTh>
                <DnaTh className="px-3.5 py-2.5 text-center w-[130px]">Jenis Pengajuan</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Jadwal & Durasi</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Alasan / Keperluan</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Approver</DnaTh>
                <DnaTh className="px-3.5 py-2.5 text-center w-[100px]">Status</DnaTh>
                <DnaTh className="px-3.5 py-2.5 text-center w-[70px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={10} className="px-3.5 py-8 text-center text-xs text-slate-400">
                    Tidak ada tiket pengajuan yang sesuai dengan kriteria filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredTickets.map((tck) => (
                  <DnaTableRow key={tck.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Code>{tck.ticketNo}</DnaCell.Code>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Code>{tck.empId}</DnaCell.Code>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-semibold text-slate-900">{tck.empName}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="text-slate-700">{tck.department}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <DnaBadge
                        variant={
                          tck.type === "LEMBUR_PRODUKSI" ? "purple" :
                          tck.type === "CUTI_TAHUNAN" ? "info" :
                          tck.type === "IZIN_SAKIT" ? "warning" : "default"
                        }
                      >
                        {tck.type.replace("_", " ")}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.NaturalPair
                        primary={`${tck.startDate}${tck.startDate !== tck.endDate ? ` s/d ${tck.endDate}` : ""}`}
                        secondary={`Durasi: ${tck.duration}`}
                      />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="text-slate-800">{tck.reason}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="text-slate-600 font-medium">{tck.approver}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <DnaBadge
                        variant={
                          tck.status === "APPROVED" ? "success" :
                          tck.status === "PENDING" ? "warning" : "critical"
                        }
                      >
                        {tck.status}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicket(tck)}
                        title="Lihat Detail & Aksi"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* QUICK PEEK DRAWER: DETAIL & APPROVAL WORKFLOW */}
      <DnaDetailDrawer
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.ticketNo || "Detail Tiket HR"}
        subtitle={`${selectedTicket?.empName} • ${selectedTicket?.department}`}
        badge={
          selectedTicket ? (
            <DnaBadge
              variant={
                selectedTicket.status === "APPROVED" ? "success" :
                selectedTicket.status === "PENDING" ? "warning" : "critical"
              }
            >
              {selectedTicket.status}
            </DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "details",
            label: "Rincian Pengajuan",
            content: selectedTicket && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Jenis Pengajuan</span>
                    <strong className="text-slate-900">{selectedTicket.type.replace("_", " ")}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Durasi Efektif</span>
                    <strong className="text-slate-900">{selectedTicket.duration}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mulai Berlaku</span>
                    <span className="tabular-nums text-slate-800">{selectedTicket.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Selesai</span>
                    <span className="tabular-nums text-slate-800">{selectedTicket.endDate}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-900">Alasan & Keperluan Resmi</h4>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                    {selectedTicket.reason}
                  </p>
                </div>
              </div>
            )
          },
          {
            id: "workflow",
            label: "Alur Persetujuan & Sign-off",
            content: selectedTicket && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-600">Pejabat Approver:</span>
                    <span className="font-bold text-slate-900">{selectedTicket.approver}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Status Persetujuan:</span>
                    <DnaBadge variant={selectedTicket.status === "APPROVED" ? "success" : "warning"}>
                      {selectedTicket.status}
                    </DnaBadge>
                  </div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedTicket(null)}>
              Tutup
            </DnaButton>
            {selectedTicket?.status === "PENDING" ? (
              <div className="flex gap-2">
                <DnaButton
                  variant="danger"
                  size="md"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedTicket.id, status: "REJECTED" });
                  }}
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Tolak
                </DnaButton>
                <DnaButton
                  variant="primary"
                  size="md"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedTicket.id, status: "APPROVED" });
                  }}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Setujui
                </DnaButton>
              </div>
            ) : (
              <DnaButton variant="secondary" size="md" onClick={() => toast.success("Mencetak lembar persetujuan...")}>
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Lembar
              </DnaButton>
            )}
          </div>
        }
      />

      {/* MODAL: BUAT PENGAJUAN BARU */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Formulir Pengajuan Izin / Cuti / Lembur"
        size="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Karyawan *</label>
            <DnaSelect
              value={newTicket.employeeId || employees[0]?.id || ""}
              onChange={(val) => setNewTicket({ ...newTicket, employeeId: val })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || emp.fullName} ({emp.employeeId || emp.nik || "Karyawan"}) - {emp.department || "Operasional"}
                </option>
              ))}
              {employees.length === 0 && (
                <option value="">(Memuat data karyawan...)</option>
              )}
            </DnaSelect>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Pengajuan *</label>
            <DnaSelect
              value={newTicket.type}
              onChange={(val) => setNewTicket({ ...newTicket, type: val })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="LEAVE">Cuti Tahunan / Izin Sakit (LEAVE)</option>
              <option value="OVERTIME">Surat Perintah Lembur / SPL Produksi (OVERTIME)</option>
              <option value="REIMBURSE">Dinas Luar Kota / Reimburse (REIMBURSE)</option>
            </DnaSelect>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai *</label>
              <DnaInput
                type="date"
                required
                value={newTicket.startDate}
                onChange={(e) => setNewTicket({ ...newTicket, startDate: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai *</label>
              <DnaInput
                type="date"
                required
                value={newTicket.endDate}
                onChange={(e) => setNewTicket({ ...newTicket, endDate: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
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
            <DnaButton variant="primary" size="md" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Mengirim..." : "Kirim Tiket Pengajuan"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </DnaPageContainer>
  );
}
