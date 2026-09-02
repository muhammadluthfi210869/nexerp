"use client";

import { useState, useMemo } from "react";
import { Clock, UserCheck, AlertTriangle, MapPin, Search, CalendarDays } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaBadge, DnaButton } from "@/components/dna";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AttendanceStatus = "ON_TIME" | "LATE" | "OUTSIDE_GEOFENCE";

interface Attendance {
  id: string;
  employee: string;
  division: string;
  clockIn: string;
  clockOut: string | null;
  status: AttendanceStatus;
  photoUrl: string;
  date: string;
}

const ATTENDANCE_DATA: Attendance[] = [
  { id: "A-001", employee: "Budi Santoso", division: "Produksi", clockIn: "07:52", clockOut: "16:30", status: "ON_TIME", photoUrl: "", date: "2026-05-26" },
  { id: "A-002", employee: "Siti Rahayu", division: "QC", clockIn: "07:45", clockOut: "16:15", status: "ON_TIME", photoUrl: "", date: "2026-05-26" },
  { id: "A-003", employee: "Ahmad Fauzi", division: "R&D", clockIn: "08:30", clockOut: null, status: "LATE", photoUrl: "", date: "2026-05-26" },
  { id: "A-004", employee: "Dewi Lestari", division: "HR", clockIn: "07:50", clockOut: "16:20", status: "ON_TIME", photoUrl: "", date: "2026-05-26" },
  { id: "A-005", employee: "Rudi Hartono", division: "Warehouse", clockIn: "08:05", clockOut: "16:45", status: "LATE", photoUrl: "", date: "2026-05-26" },
  { id: "A-006", employee: "Fitri Handayani", division: "Marketing", clockIn: "07:48", clockOut: "16:10", status: "ON_TIME", photoUrl: "", date: "2026-05-26" },
  { id: "A-007", employee: "Agus Prasetyo", division: "Produksi", clockIn: "09:15", clockOut: null, status: "OUTSIDE_GEOFENCE", photoUrl: "", date: "2026-05-26" },
  { id: "A-008", employee: "Linda Kusuma", division: "Finance", clockIn: "07:55", clockOut: "16:35", status: "ON_TIME", photoUrl: "", date: "2026-05-26" },
  { id: "A-009", employee: "Hendra Gunawan", division: "SCM", clockIn: "08:20", clockOut: null, status: "OUTSIDE_GEOFENCE", photoUrl: "", date: "2026-05-26" },
  { id: "A-010", employee: "Maya Sari", division: "Creative", clockIn: "07:40", clockOut: "16:00", status: "ON_TIME", photoUrl: "", date: "2026-05-26" },
];

const STATUS_META: Record<AttendanceStatus, { label: string; status: "success" | "warning" | "critical" }> = {
  ON_TIME: { label: "On Time", status: "success" },
  LATE: { label: "Late", status: "warning" },
  OUTSIDE_GEOFENCE: { label: "Outside Geofence", status: "critical" },
};

export default function AttendancePage() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("2026-05-26");

  const filtered = useMemo(() => {
    let list = [...ATTENDANCE_DATA];
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.employee.toLowerCase().includes(term) ||
          a.division.toLowerCase().includes(term) ||
          a.status.toLowerCase().includes(term),
      );
    }
    if (dateFilter) {
      list = list.filter((a) => a.date === dateFilter);
    }
    return list;
  }, [search, dateFilter]);

  const presentToday = ATTENDANCE_DATA.length;
  const onTime = ATTENDANCE_DATA.filter((a) => a.status === "ON_TIME").length;
  const late = ATTENDANCE_DATA.filter((a) => a.status === "LATE").length;
  const outsideGeofence = ATTENDANCE_DATA.filter((a) => a.status === "OUTSIDE_GEOFENCE").length;

  return (
    <DashboardShell
      title="Attendance"
      titleAccent="Workbench"
      subtitle="Daily Attendance Monitoring & Geofence Validation"
      actions={
        <div className="flex items-center gap-3">
          <div className="relative w-44">
            <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
          <DnaButton variant="primary" icon={<Clock className="stroke-[3px]" />}>
            SYNC TODAY
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-slide-in">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Present Today"
            value={presentToday}
            icon={<UserCheck className="text-emerald-500" />}
          />
          <StatCard
            label="On Time"
            value={onTime}
            icon={<Clock className="text-blue-500" />}
          />
          <StatCard
            label="Late"
            value={late}
            icon={<AlertTriangle className="text-amber-500" />}
          />
          <StatCard
            label="Outside Geofence"
            value={outsideGeofence}
            icon={<MapPin className="text-rose-500" />}
          />
        </div>

        {/* Search + Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="CARI KARYAWAN..."
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Division</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Clock In</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Clock Out</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Photo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-8">
                        Tidak ada data absensi ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((row) => (
                      <TableRow key={row.id} className="group hover:bg-slate-50/50 transition-all">
                        <TableCell>
                          <p className="text-[11px] font-black text-slate-900 uppercase">{row.employee}</p>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-700 bg-slate-100 rounded px-2 py-0.5 uppercase">
                            {row.division}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <p className="text-[13px] font-black text-slate-900 tabular-nums">{row.clockIn}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <p className="text-[11px] font-bold text-slate-400 tabular-nums">{row.clockOut ?? "—"}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <DnaBadge status={STATUS_META[row.status].status}>
                            {STATUS_META[row.status].label}
                          </DnaBadge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase">
                              {row.photoUrl ? "IMG" : "—"}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
