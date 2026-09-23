"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Search,
  Camera,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Eye,
  Check
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
  useDnaToast,
  DnaInput,
  DnaSelect,
  DnaTable
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
  const [activeTab, setActiveTab] = useState<string>("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-09-09");
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [clockInEmp, setClockInEmp] = useState("EMP-001");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const onTimeCount = INITIAL_ATTENDANCE.filter(a => a.status === "ON_TIME").length;
  const lateCount = INITIAL_ATTENDANCE.filter(a => a.status === "LATE").length;
  const leaveCount = INITIAL_ATTENDANCE.filter(a => a.status === "LEAVE").length;

  const filteredAttendance = useMemo(() => {
    return INITIAL_ATTENDANCE.filter(a =>
      a.empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Presensi Live Attendance (Geofencing & Shift)"
        description="Monitoring kehadiran realtime karyawan pabrik dan kantor berbasis verifikasi GPS Geofence radius pabrik kosmetik & biometrik. Geofence Pabrik: Radius 50m Aktif."
        tabs={[
          { id: "live", label: "Live Log Presensi Hari Ini", count: INITIAL_ATTENDANCE.length },
          { id: "recap", label: "Rekapitulasi Bulanan" },
          { id: "shifts", label: "Pengaturan Shift & Geofence" }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaInput
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

      {/* DATA TABLE WRAPPER */}
      <DnaDataTableCard
        toolbarProps={{
          searchProps: {
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Cari nama atau NIK karyawan...",
          },
        }}
      >
        {/* TAB 1: LIVE LOG TABLE */}
        {activeTab === "live" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 font-bold uppercase tracking-wider text-[11px] select-none">
                  <th className="px-4 py-2.5 w-[130px]">NIK Karyawan</th>
                  <th className="px-4 py-2.5 min-w-[180px]">Nama Karyawan</th>
                  <th className="px-4 py-2.5 w-[160px]">Departemen</th>
                  <th className="px-4 py-2.5 w-[160px]">Pola Shift</th>
                  <th className="px-4 py-2.5 w-[110px] text-center">Jam Masuk</th>
                  <th className="px-4 py-2.5 w-[110px] text-center">Jam Pulang</th>
                  <th className="px-4 py-2.5 w-[160px]">Geofence GPS</th>
                  <th className="px-4 py-2.5 w-[130px] text-center">Status Presensi</th>
                  <th className="pr-4 py-2.5 w-[70px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3.5 py-8 text-center text-slate-400">
                      Tidak ada catatan presensi yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((rec) => (
                    <tr key={rec.id} className="h-[48px] hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5">
                        <DnaCell.Code code={rec.empId} />
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{rec.empName}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] font-medium text-slate-800 line-clamp-1">{rec.department}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <DnaCell.Text text={rec.shift} />
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-[11.5px] text-slate-900">
                        {rec.checkIn}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-[11.5px] text-slate-900">
                        {rec.checkOut}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-[11px] text-slate-700 font-mono line-clamp-1">{rec.latLng}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <DnaBadge
                          variant={
                            rec.status === "ON_TIME" ? "success" :
                            rec.status === "LATE" ? "warning" :
                            rec.status === "LEAVE" ? "info" : "critical"
                          }
                        >
                          {rec.status === "ON_TIME" ? "Tepat Waktu" :
                           rec.status === "LATE" ? "Terlambat" :
                           rec.status === "LEAVE" ? "Cuti Resmi" : "Alpa"}
                        </DnaBadge>
                      </td>
                      <td className="pr-4 py-2.5 text-right">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            onClick={() => setSelectedRecord(rec)}
                            title="Lihat Detail Presensi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </DnaButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: RECAP */}
        {activeTab === "recap" && (
          <div className="p-4 text-xs text-slate-600">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Ringkasan Disiplin Presensi Pabrik Manufaktur</h4>
              <p>Tingkat kehadiran rata-rata periode berjalan adalah <strong className="text-emerald-700">97.2%</strong>. Tidak ada pelanggaran geofencing di luar area perimeter pabrik kosmetik.</p>
              <div className="grid grid-cols-3 gap-3 pt-3">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">Total Hari Kerja</span>
                  <span className="font-bold text-slate-900 text-sm">22 Hari</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">Rata-rata Keterlambatan</span>
                  <span className="font-bold text-amber-700 text-sm">2.4 Menit / Orang</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">Kepatuhan Geofence GPS</span>
                  <span className="font-bold text-emerald-700 text-sm">99.8% Sesuai</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SHIFTS */}
        {activeTab === "shifts" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 text-xs">
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900">Shift 1 (Pabrik Manufaktur)</h4>
                <DnaBadge variant="success">Produksi</DnaBadge>
              </div>
              <p className="text-slate-500 font-mono">07:00 - 15:30 WIB</p>
              <div className="mt-2 text-slate-400 text-[11px]">Istirahat: 12:00 - 13:00 WIB &bull; Toleransi: 10 mnt</div>
            </div>
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900">Shift 2 (Filling & Packing)</h4>
                <DnaBadge variant="purple">Lanjutan</DnaBadge>
              </div>
              <p className="text-slate-500 font-mono">15:00 - 23:00 WIB</p>
              <div className="mt-2 text-slate-400 text-[11px]">Istirahat: 18:00 - 19:00 WIB &bull; Toleransi: 10 mnt</div>
            </div>
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900">Office & R&D Hours</h4>
                <DnaBadge variant="info">Regular</DnaBadge>
              </div>
              <p className="text-slate-500 font-mono">08:00 - 17:00 WIB</p>
              <div className="mt-2 text-slate-400 text-[11px]">Senin - Jumat &bull; Toleransi: 15 mnt</div>
            </div>
          </div>
        )}
      </DnaDataTableCard>

      {/* MODAL: LIVE CLOCK-IN SIMULATOR */}
      <DnaModal
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
        title="Verifikasi Presensi GPS & Biometrik"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="font-bold text-emerald-900 text-sm">GPS Terdeteksi: Area Perimeter Pabrik</div>
            <div className="text-emerald-700 text-[11px] font-mono mt-0.5">-6.2088, 106.8456 (Akurasi: 4 meter)</div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Karyawan Clock-In:</label>
            <DnaSelect
              value={clockInEmp}
              onChange={setClockInEmp}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="EMP-001">Budi Santoso - Produksi Mixing</option>
              <option value="EMP-002">Rian Saputra - R&D Formulasi</option>
              <option value="EMP-003">Siti Rahmawati - QC Mikrobiologi</option>
            </DnaSelect>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <DnaButton variant="secondary" size="md" onClick={() => setIsClockInModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => {
                toast.success("Clock-In Berhasil Tercatat dengan Geotag GPS!");
                setIsClockInModalOpen(false);
              }}
            >
              Konfirmasi Check-In
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* QUICK PEEK DRAWER: DETAIL PRESENSI */}
      <DnaDetailDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.empName || "Detail Presensi"}
        subtitle={`${selectedRecord?.empId} • ${selectedRecord?.department}`}
        badge={
          selectedRecord ? (
            <DnaBadge
              variant={
                selectedRecord.status === "ON_TIME" ? "success" :
                selectedRecord.status === "LATE" ? "warning" : "info"
              }
            >
              {selectedRecord.status}
            </DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "geofence",
            label: "Log Presensi & Geofence",
            content: selectedRecord && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Jam Masuk (Check-In)</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedRecord.checkIn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Jam Pulang (Check-Out)</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedRecord.checkOut}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pola Shift Kerja</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.shift}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Keterlambatan</span>
                    <span className="font-bold text-amber-700">{selectedRecord.lateMinutes} Menit</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Verifikasi GPS Geofence Perimeter</span>
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1 font-mono text-[11px] text-slate-700">
                    <div>Koordinat: {selectedRecord.latLng}</div>
                    <div className="text-emerald-700 font-semibold">Status: Di Dalam Radius Perimeter Pabrik (Valid)</div>
                  </div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedRecord(null)}>
              Tutup
            </DnaButton>
            <DnaButton variant="secondary" size="md" onClick={() => toast.success("Mencetak lembar log presensi...")}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Log
            </DnaButton>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
