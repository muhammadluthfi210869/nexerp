"use client";

import React, { useState, useMemo } from "react";
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
  X
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
  type: "CUTI_TAHUNAN" | "IZIN_SAKIT" | "LEMBUR_PRODUKSI" | "DINAS_LUAR" | "CUTI_MELAHIRKAN";
  startDate: string;
  endDate: string;
  duration: string;
  reason: string;
  approver: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const INITIAL_TICKETS: HrTicketItem[] = [
  { id: "TCK-01", ticketNo: "REQ-LV-001", empId: "KIL-2022-001", empName: "Budi Santoso, S.T", department: "Produksi Mixing", type: "LEMBUR_PRODUKSI", startDate: "2026-09-09 16:00", endDate: "2026-09-09 20:00", duration: "4 Jam", reason: "Surat Perintah Lembur (SPL) Batch Darurat PO-8821", approver: "Plant Manager", status: "APPROVED" },
  { id: "TCK-02", ticketNo: "REQ-LV-002", empId: "KIL-2023-014", empName: "Rian Saputra, S.Farm", department: "R&D Formulasi", type: "CUTI_TAHUNAN", startDate: "2026-09-15", endDate: "2026-09-17", duration: "3 Hari", reason: "Acara keluarga (Sisa Cuti Tahunan: 8 Hari)", approver: "Head of R&D", status: "PENDING" },
  { id: "TCK-03", ticketNo: "REQ-LV-003", empId: "KIL-2023-022", empName: "Siti Rahmawati, S.Si", department: "QC Mikrobiologi", type: "IZIN_SAKIT", startDate: "2026-09-08", endDate: "2026-09-08", duration: "1 Hari", reason: "Sakit demam, surat dokter klinik terlampir", approver: "Supervisor QA", status: "APPROVED" },
  { id: "TCK-04", ticketNo: "REQ-LV-004", empId: "KIL-2024-005", empName: "Dewi Lestari, S.E", department: "BusDev Maklon", type: "DINAS_LUAR", startDate: "2026-09-11", endDate: "2026-09-12", duration: "2 Hari", reason: "Meeting presentasi formula kosmetik dengan klien Jakarta", approver: "Direktur Bisnis", status: "APPROVED" },
];

export default function HrTicketsPage() {
  const toast = useDnaToast();
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
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

  const pendingCount = INITIAL_TICKETS.filter(t => t.status === "PENDING").length;
  const approvedCount = INITIAL_TICKETS.filter(t => t.status === "APPROVED").length;
  const splCount = INITIAL_TICKETS.filter(t => t.type === "LEMBUR_PRODUKSI").length;

  const filteredTickets = useMemo(() => {
    return INITIAL_TICKETS.filter(t => {
      const matchSearch =
        t.empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === "ALL" || t.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [searchQuery, typeFilter]);

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
        tabs={[
          { id: "ALL", label: "Semua Tiket", count: INITIAL_TICKETS.length },
          { id: "CUTI_TAHUNAN", label: "Cuti Tahunan" },
          { id: "IZIN_SAKIT", label: "Izin Sakit" },
          { id: "LEMBUR_PRODUKSI", label: "Lembur (SPL)" },
          { id: "DINAS_LUAR", label: "Dinas Luar" }
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
                  onClick={() => {
                    toast.error(`Tiket ${selectedTicket.ticketNo} ditolak.`);
                    setSelectedTicket(null);
                  }}
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Tolak
                </DnaButton>
                <DnaButton
                  variant="primary"
                  size="md"
                  onClick={() => {
                    toast.success(`Tiket ${selectedTicket.ticketNo} berhasil disetujui!`);
                    setSelectedTicket(null);
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
              value={newTicket.empName}
              onChange={(val) => setNewTicket({ ...newTicket, empName: val })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="Budi Santoso, S.T">Budi Santoso - Produksi Mixing</option>
              <option value="Rian Saputra, S.Farm">Rian Saputra - R&D Formulasi</option>
              <option value="Siti Rahmawati, S.Si">Siti Rahmawati - QC Mikrobiologi</option>
              <option value="Dewi Lestari, S.E">Dewi Lestari - BusDev</option>
            </DnaSelect>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Pengajuan *</label>
            <DnaSelect
              value={newTicket.type}
              onChange={(val) => setNewTicket({ ...newTicket, type: val as any })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="CUTI_TAHUNAN">Cuti Tahunan (Tahunan / Pribadi)</option>
              <option value="IZIN_SAKIT">Izin Sakit (Surat Dokter)</option>
              <option value="LEMBUR_PRODUKSI">Surat Perintah Lembur (SPL Produksi)</option>
              <option value="DINAS_LUAR">Perjalanan Dinas Luar Kota</option>
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
            <DnaButton variant="primary" size="md" type="submit">
              Kirim Tiket Pengajuan
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </DnaPageContainer>
  );
}
