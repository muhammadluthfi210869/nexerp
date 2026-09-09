"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Camera,
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
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface AttendanceRecord {
  id: string;
  empId: string;
  empName: string;
  department: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  locationStatus: "INSIDE_GEOFENCE" | "OUTSIDE_RADIUS";
  status: "ON_TIME" | "LATE" | "ABSENT" | "LEAVE";
}

const FALLBACK_ATTENDANCE: AttendanceRecord[] = [
  { id: "1", empId: "EMP-041", empName: "Budi Santoso", department: "Produksi Mixing", shift: "Shift 1 (07:00 - 15:30)", checkIn: "06:52", checkOut: "15:35", locationStatus: "INSIDE_GEOFENCE", status: "ON_TIME" },
  { id: "2", empId: "EMP-052", empName: "Siti Aisyah", department: "QC Mikrobiologi", shift: "Shift 1 (07:00 - 15:30)", checkIn: "07:14", checkOut: "15:32", locationStatus: "INSIDE_GEOFENCE", status: "LATE" },
  { id: "3", empId: "EMP-088", empName: "Ahmad Dani", department: "Gudang Inbound", shift: "Shift 1 (07:00 - 15:30)", checkIn: "06:45", checkOut: "15:40", locationStatus: "INSIDE_GEOFENCE", status: "ON_TIME" },
  { id: "4", empId: "EMP-102", empName: "Nurul Hidayah", department: "R&D Formulasi", shift: "Office (08:00 - 17:00)", checkIn: "07:55", checkOut: "-", locationStatus: "INSIDE_GEOFENCE", status: "ON_TIME" },
];

export default function HrAttendancePage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Presensi Live Attendance (Geofencing & Shift)"
        description="Monitoring kehadiran realtime karyawan pabrik dan kantor berbasis verifikasi GPS Geofence & Foto Biometrik."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tingkat Kehadiran Hari Ini: 97.2%</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Rekap
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Log Presensi ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Hadir Tepat Waktu"
          value="118 Orang"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "95.2%", isPositive: true }}
          subtext="Check-in Sebelum Jam Kerja"
          variant="success"
        />
        <DnaStatCard
          label="Terlambat Masuk"
          value="4 Orang"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Rata-rata 12 Menit", isPositive: false }}
          subtext="Pemotongan Tunjangan Hadir"
          variant="warning"
        />
        <DnaStatCard
          label="Izin / Cuti Resmi"
          value="2 Orang"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          subtext="Disetujui via Tiket HR"
          variant="info"
        />
        <DnaStatCard
          label="Presensi Luar Radius (GPS)"
          value="0"
          icon={<MapPin className="w-5 h-5 text-purple-600" />}
          delta={{ value: "100% Valid Area", isPositive: true }}
          subtext="Radius Pabrik 150m OK"
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Log Kehadiran Karyawan Hari Ini (09 Sep 2026)"
        badge={<DnaBadge variant="default">{FALLBACK_ATTENDANCE.length} Karyawan Terdaftar</DnaBadge>}
        customToolbar={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIK / nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">NIK</th>
                <th className="px-3.5 py-3">Nama Karyawan</th>
                <th className="px-3.5 py-3">Departemen</th>
                <th className="px-3.5 py-3">Jadwal Shift</th>
                <th className="px-3.5 py-3">Jam Masuk</th>
                <th className="px-3.5 py-3">Jam Pulang</th>
                <th className="px-3.5 py-3">Validasi Lokasi</th>
                <th className="px-3.5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FALLBACK_ATTENDANCE.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-slate-600 font-bold">{row.empId}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{row.empName}</td>
                  <td className="px-3.5 py-2.5 text-slate-700">{row.department}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px]">{row.shift}</td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-700">{row.checkIn}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600">{row.checkOut}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                      <MapPin className="w-3 h-3" />
                      Pabrik (Geofenced)
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={row.status === "ON_TIME" ? "success" : "warning"}>
                      {row.status === "ON_TIME" ? "Tepat Waktu" : "Terlambat"}
                    </DnaBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
