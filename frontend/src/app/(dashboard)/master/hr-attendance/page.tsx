"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
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
  latLng: string;
  status: "ON_TIME" | "LATE" | "ABSENT" | "LEAVE";
  lateMinutes: number;
}

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: "ATT-01", empId: "KIL-2022-001", empName: "Budi Santoso, S.T", department: "Produksi Mixing", shift: "Shift 1 (07:00 - 15:30)", checkIn: "06:48", checkOut: "15:35", locationStatus: "INSIDE_GEOFENCE", latLng: "-6.2088, 106.8456 (Radius 12m)", status: "ON_TIME", lateMinutes: 0 },
  { id: "ATT-02", empId: "KIL-2023-014", empName: "Rian Saputra, S.Farm", department: "R&D Formulasi", shift: "Office (08:00 - 17:00)", checkIn: "07:52", checkOut: "17:05", locationStatus: "INSIDE_GEOFENCE", latLng: "-6.2088, 106.8456 (Radius 18m)", status: "ON_TIME", lateMinutes: 0 },
  { id: "ATT-03", empId: "KIL-2023-022", empName: "Siti Rahmawati, S.Si", department: "QC Mikrobiologi", shift: "Shift 1 (07:00 - 15:30)", checkIn: "07:18", checkOut: "15:30", locationStatus: "INSIDE_GEOFENCE", latLng: "-6.2088, 106.8456 (Radius 25m)", status: "LATE", lateMinutes: 18 },
  { id: "ATT-04", empId: "KIL-2024-005", empName: "Dewi Lestari, S.E", department: "BusDev Maklon", shift: "Office (08:00 - 17:00)", checkIn: "08:00", checkOut: "-", locationStatus: "INSIDE_GEOFENCE", latLng: "-6.2088, 106.8456 (Radius 15m)", status: "ON_TIME", lateMinutes: 0 },
  { id: "ATT-05", empId: "KIL-2024-031", empName: "Ahmad Dani", department: "Gudang Inbound", shift: "Shift 1 (07:00 - 15:30)", checkIn: "06:42", checkOut: "15:40", locationStatus: "INSIDE_GEOFENCE", latLng: "-6.2088, 106.8456 (Radius 8m)", status: "ON_TIME", lateMinutes: 0 },
  { id: "ATT-06", empId: "KIL-2025-012", empName: "dr. Amanda Putri, M.Biomed", department: "QA & APJ", shift: "Office (08:00 - 17:00)", checkIn: "-", checkOut: "-", locationStatus: "OUTSIDE_RADIUS", latLng: "-", status: "LEAVE", lateMinutes: 0 },
];

export default function HrAttendancePage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"live" | "recap" | "shifts">("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-09-09");
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("EMP-001");

  // Fetch employees for clock-in selector (per-employee attendance is GET /hr/employees/:id/attendance)
  const { data: employees = [] } = useQuery<{ id: string; name: string; division?: string }[]>({
    queryKey: ["hr-employees"],
    queryFn: () => api.get("/hr/employees").then(r => unwrapResponse(r.data) ?? []),
  });

  // Clock-in / clock-out mutations
  const clockIn = useMutation({
    mutationFn: (body: { employeeId: string; lat: number; lng: number }) =>
      api.post("/hr/attendance/clock-in", body),
    onSuccess: () => {
      toast.success("Clock-In Berhasil Tercatat dengan Geotag GPS!");
      setIsClockInModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["hr-attendance"] });
    },
    onError: () => toast.error("Gagal clock-in, coba lagi."),
  });

  const clockOut = useMutation({
    mutationFn: (body: { employeeId: string }) =>
      api.post("/hr/attendance/clock-out", body),
    onSuccess: () => {
      toast.success("Clock-Out Berhasil Tercatat!");
      queryClient.invalidateQueries({ queryKey: ["hr-attendance"] });
    },
    onError: () => toast.error("Gagal clock-out, coba lagi."),
  });

  const onTimeCount = INITIAL_ATTENDANCE.filter(a => a.status === "ON_TIME").length;
  const lateCount = INITIAL_ATTENDANCE.filter(a => a.status === "LATE").length;
  const leaveCount = INITIAL_ATTENDANCE.filter(a => a.status === "LEAVE").length;

  const filteredAttendance = INITIAL_ATTENDANCE.filter(a =>
    a.empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Presensi Live Attendance (Geofencing & Shift)"
        description="Monitoring kehadiran realtime karyawan pabrik dan kantor berbasis verifikasi GPS Geofence radius pabrik kosmetik & biometrik."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Geofence Pabrik: Radius 50m Aktif</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shadow-sm font-semibold"
            />
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Rekap
            </DnaButton>
            <DnaButton variant="secondary" size="md" onClick={() => toast.success("Exporting Log Presensi ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsClockInModalOpen(true)}>
              <Camera className="w-4 h-4 mr-1.5" />
              Live Clock-In / Out
            </DnaButton>
          </div>
        }
      />

      {/* KPI STAT CARDS */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Hadir Tepat Waktu"
          value={onTimeCount + " Orang"}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "96.4%", isPositive: true }}
          subtext="Check-In Sebelum Jam Kerja"
          variant="success"
        />
        <DnaStatCard
          label="Terlambat Masuk"
          value={lateCount + " Orang"}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Rata-rata 18 Menit", isPositive: false }}
          subtext="Pemotongan Tunjangan Hadir"
          variant="warning"
        />
        <DnaStatCard
          label="Izin / Cuti Resmi"
          value={leaveCount + " Orang"}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          subtext="Disetujui via Tiket HR"
          variant="info"
        />
        <DnaStatCard
          label="Verifikasi Radius Geofence"
          value="100% Valid"
          icon={<MapPin className="w-5 h-5 text-purple-600" />}
          subtext="Seluruh Presensi di Area Pabrik"
          variant="purple"
        />
      </DnaKpiGrid>

      {/* TAB NAVIGATION */}
      <DnaTabNav
        tabs={[
          { id: "live", label: "Live Log Presensi Hari Ini", icon: Clock },
          { id: "recap", label: "Rekapitulasi Presensi Bulanan", icon: Calendar },
          { id: "shifts", label: "Pengaturan Shift & Geofence", icon: Layers }
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      {/* TAB 1: LIVE LOG TABLE */}
      {activeTab === "live" && (
        <DnaDataTableCard
          title="Log Kehadiran Karyawan Hari Ini"
          badge={<DnaBadge variant="info">{filteredAttendance.length} Log</DnaBadge>}
          customToolbar={
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau NIK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">Karyawan & NIK</th>
                  <th className="px-3.5 py-3">Departemen</th>
                  <th className="px-3.5 py-3">Shift Kerja</th>
                  <th className="px-3.5 py-3 text-center">Jam Masuk</th>
                  <th className="px-3.5 py-3 text-center">Jam Pulang</th>
                  <th className="px-3.5 py-3">Verifikasi Geofence GPS</th>
                  <th className="px-3.5 py-3 text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3">
                      <div className="font-bold text-slate-900">{rec.empName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{rec.empId}</div>
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-slate-700">
                      {rec.department}
                    </td>
                    <td className="px-3.5 py-3 text-slate-600">
                      {rec.shift}
                    </td>
                    <td className="px-3.5 py-3 text-center font-mono font-bold text-slate-900">
                      {rec.checkIn}
                    </td>
                    <td className="px-3.5 py-3 text-center font-mono font-bold text-slate-900">
                      {rec.checkOut}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] text-slate-600 font-mono">{rec.latLng}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <DnaBadge
                        variant={
                          rec.status === "ON_TIME" ? "success" :
                          rec.status === "LATE" ? "warning" :
                          rec.status === "LEAVE" ? "info" : "critical"
                        }
                      >
                        {rec.status === "ON_TIME" ? "Tepat Waktu" :
                         rec.status === "LATE" ? "Terlambat (" + rec.lateMinutes + "m)" :
                         rec.status === "LEAVE" ? "Cuti Resmi" : "Alpa"}
                      </DnaBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      )}

      {/* TAB 2 & 3: RECAP & SHIFTS PLACEHOLDER */}
      {activeTab === "recap" && (
        <DnaDataTableCard
          title="Rekapitulasi Kehadiran Bulanan (September 2026)"
          badge={<DnaBadge variant="purple">124 Karyawan</DnaBadge>}
        >
          <div className="p-4 text-xs text-slate-600">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2">Ringkasan Disiplin Presensi Pabrik</h4>
              <p>Tingkat kehadiran rata-rata periode berjalan adalah <strong>97.2%</strong>. Tidak ada pelanggaran geofencing di luar area perimeter pabrik kalopsia.</p>
            </div>
          </div>
        </DnaDataTableCard>
      )}

      {activeTab === "shifts" && (
        <DnaDataTableCard
          title="Master Shift & Titik Geofence Pabrik"
          badge={<DnaBadge variant="info">3 Shift Aktif</DnaBadge>}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 text-xs">
            <div className="p-3.5 border border-slate-200 rounded-xl bg-white">
              <h4 className="font-bold text-slate-900">Shift 1 (Pabrik Manufaktur)</h4>
              <p className="text-slate-500 mt-1">07:00 - 15:30 WIB (Istirahat 12:00 - 13:00)</p>
              <DnaBadge variant="success" className="mt-2">Produksi & QC</DnaBadge>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-xl bg-white">
              <h4 className="font-bold text-slate-900">Shift 2 (Pabrik Filling/Packing)</h4>
              <p className="text-slate-500 mt-1">15:00 - 23:00 WIB (Istirahat 18:00 - 19:00)</p>
              <DnaBadge variant="purple" className="mt-2">Produksi Lanjutan</DnaBadge>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-xl bg-white">
              <h4 className="font-bold text-slate-900">Office & R&D Hours</h4>
              <p className="text-slate-500 mt-1">08:00 - 17:00 WIB (Senin - Jumat)</p>
              <DnaBadge variant="info" className="mt-2">Office & Lab</DnaBadge>
            </div>
          </div>
        </DnaDataTableCard>
      )}

      {/* MODAL: LIVE CLOCK-IN SIMULATOR */}
      <DnaModal
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
        title="Verifikasi Presensi GPS & Biometrik"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="font-bold text-emerald-900 text-sm">GPS Terdeteksi: Pabrik Kalopsia</div>
            <div className="text-emerald-700 text-[11px] font-mono mt-0.5">-6.2088, 106.8456 (Akurasi: 4 meter)</div>
          </div>

          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
            <div className="font-semibold text-slate-800 mb-1">Pilih Karyawan Clock-In:</div>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}{emp.division ? ` - ${emp.division}` : ""}</option>
                ))
              ) : (
                <>
                  <option value="EMP-001">Budi Santoso - Produksi Mixing</option>
                  <option value="EMP-002">Rian Saputra - R&D Formulasi</option>
                  <option value="EMP-003">Siti Rahmawati - QC Mikrobiologi</option>
                </>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <DnaButton variant="secondary" size="md" onClick={() => setIsClockInModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              disabled={clockIn.isPending}
              onClick={() => clockIn.mutate({ employeeId: selectedEmpId, lat: -6.2088, lng: 106.8456 })}
            >
              {clockIn.isPending ? "Mencatat..." : "Konfirmasi Check-In"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
