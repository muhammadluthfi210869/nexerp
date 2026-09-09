"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Users
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
  useDnaToast
} from "@/components/dna";

interface HrTicketItem {
  id: string;
  ticketNo: string;
  empName: string;
  department: string;
  type: "CUTI_TAHUNAN" | "IZIN_SAKIT" | "LEMBUR_PRODUKSI" | "DINAS_LUAR";
  startDate: string;
  endDate: string;
  duration: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const FALLBACK_TICKETS: HrTicketItem[] = [
  { id: "1", ticketNo: "REQ-LV-001", empName: "Budi Santoso", department: "Produksi Mixing", type: "LEMBUR_PRODUKSI", startDate: "2026-09-09 16:00", endDate: "2026-09-09 20:00", duration: "4 Jam", reason: "Lembur batch darurat PO-8821", status: "APPROVED" },
  { id: "2", ticketNo: "REQ-LV-002", empName: "Rian Saputra", department: "R&D Lab", type: "CUTI_TAHUNAN", startDate: "2026-09-15", endDate: "2026-09-17", duration: "3 Hari", reason: "Acara keluarga (Sisa Cuti: 8 hari)", status: "PENDING" },
  { id: "3", ticketNo: "REQ-LV-003", empName: "Siti Rahmawati", department: "QC Mikrobiologi", type: "IZIN_SAKIT", startDate: "2026-09-08", endDate: "2026-09-08", duration: "1 Hari", reason: "Surat dokter terlampir", status: "APPROVED" },
];

export default function HrTicketsPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Izin, Cuti & Lembur (Employee Request Tickets)"
        description="Portal pengajuan dan persetujuan bertingkat (Supervisor & HR) untuk cuti tahunan, sakit, dinas luar, dan Surat Perintah Lembur (SPL)."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Tiket Menunggu Approval: 1 Pengajuan</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Pengajuan Baru
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Pengajuan Menunggu Approval"
          value="1 Tiket"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Review Manager", isPositive: false }}
          subtext="Perlu Verifikasi Hari Ini"
          variant="warning"
        />
        <DnaStatCard
          label="Cuti Disetujui (Bulan Ini)"
          value="8 Pengajuan"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Quota Terjaga", isPositive: true }}
          subtext="Total 22 Hari Kerja Cuti"
          variant="success"
        />
        <DnaStatCard
          label="Surat Perintah Lembur (SPL)"
          value="14 Sesi"
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
          subtext="Kebutuhan Target Batch Manufaktur"
          variant="purple"
        />
        <DnaStatCard
          label="Tingkat Absensi Izin Sakit"
          value="0.8%"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          delta={{ value: "Sangat Sehat", isPositive: true }}
          subtext="Kondisi K3 Pabrik Baik"
          variant="info"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Pengajuan Tiket Karyawan"
        badge={<DnaBadge variant="default">{FALLBACK_TICKETS.length} Tiket</DnaBadge>}
        customToolbar={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no tiket / nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">No. Tiket</th>
                <th className="px-3.5 py-3">Nama Pegawai</th>
                <th className="px-3.5 py-3">Departemen</th>
                <th className="px-3.5 py-3">Jenis Permohonan</th>
                <th className="px-3.5 py-3">Periode Tanggal</th>
                <th className="px-3.5 py-3">Durasi</th>
                <th className="px-3.5 py-3">Alasan / Keterangan</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FALLBACK_TICKETS.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-bold">{t.ticketNo}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{t.empName}</td>
                  <td className="px-3.5 py-2.5 text-slate-600">{t.department}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {t.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700">{t.startDate} {t.startDate !== t.endDate && `s/d ${t.endDate}`}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{t.duration}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 text-[11px] max-w-xs truncate">{t.reason}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={t.status === "APPROVED" ? "success" : t.status === "PENDING" ? "warning" : "critical"}>
                      {t.status === "APPROVED" ? "Disetujui" : t.status === "PENDING" ? "Menunggu" : "Ditolak"}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    {t.status === "PENDING" ? (
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="primary"
                          size="sm"
                          onClick={() => toast.success(`Tiket ${t.ticketNo} berhasil disetujui!`)}
                        >
                          Setujui
                        </DnaButton>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Done
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* CREATE TICKET MODAL */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Form Pengajuan Izin / Cuti / Lembur"
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Pegawai</label>
            <input type="text" placeholder="Nama Karyawan" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Jenis Pengajuan</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white">
              <option value="CUTI_TAHUNAN">Cuti Tahunan</option>
              <option value="IZIN_SAKIT">Izin Sakit (Medical Leave)</option>
              <option value="LEMBUR_PRODUKSI">Surat Perintah Lembur (SPL)</option>
              <option value="DINAS_LUAR">Perjalanan Dinas Luar Kota</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal Mulai</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal Selesai</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Alasan / Catatan Pengajuan</label>
            <textarea rows={3} placeholder="Tuliskan keterangan lengkap..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => {
                toast.success("Tiket pengajuan berhasil dikirimkan ke HR!");
                setIsCreateModalOpen(false);
              }}
            >
              Kirim Tiket
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
