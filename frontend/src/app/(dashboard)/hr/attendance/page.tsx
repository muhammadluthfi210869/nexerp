"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  MapPin,
  UserCheck,
} from "lucide-react";
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  getOperationalStatusLabel,
} from "@/components/operational";

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

const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  ON_TIME: "Tepat Waktu",
  LATE: "Terlambat",
  OUTSIDE_GEOFENCE: "Luar Geofence",
};

export default function AttendancePage() {
  const [dateFilter, setDateFilter] = useState("2026-05-26");

  const filteredByDate = useMemo(() => {
    if (!dateFilter) return ATTENDANCE_DATA;
    return ATTENDANCE_DATA.filter((a) => a.date === dateFilter);
  }, [dateFilter]);

  const presentToday = ATTENDANCE_DATA.length;
  const onTime = ATTENDANCE_DATA.filter((a) => a.status === "ON_TIME").length;
  const late = ATTENDANCE_DATA.filter((a) => a.status === "LATE").length;
  const outsideGeofence = ATTENDANCE_DATA.filter((a) => a.status === "OUTSIDE_GEOFENCE").length;

  const columns = useMemo(
    () => [
      {
        accessorKey: "employee",
        header: "Karyawan",
        cell: ({ row }: { row: { original: Attendance } }) => (
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-slate-900">{row.original.employee}</span>
            <span className="text-[11px] text-slate-500">{row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "division",
        header: "Divisi",
        cell: ({ getValue }: { getValue: () => string }) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "clockIn",
        header: () => <div className="text-center">Clock In</div>,
        cell: ({ getValue }: { getValue: () => string }) => (
          <div className="text-center text-[13px] font-medium tabular-nums text-slate-900">
            {String(getValue())}
          </div>
        ),
      },
      {
        accessorKey: "clockOut",
        header: () => <div className="text-center">Clock Out</div>,
        cell: ({ getValue }: { getValue: () => string | null }) => (
          <div className="text-center text-[13px] tabular-nums text-slate-500">
            {getValue() ?? "—"}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }: { row: { original: Attendance } }) => {
          const s = row.original.status;
          const tone =
            s === "ON_TIME" ? "success" : s === "LATE" ? "pending" : "danger";
          return (
            <div className="flex justify-center">
              <span className={`operational-status-badge is-${tone}`}>
                {ATTENDANCE_STATUS_LABEL[s] ?? getOperationalStatusLabel(s)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "photoUrl",
        header: () => <div className="text-center">Foto</div>,
        cell: ({ row }: { row: { original: Attendance } }) => (
          <div className="text-center text-[11px] text-slate-500">
            {row.original.photoUrl ? "IMG" : "—"}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalPageShell
      title="Absensi"
      subtitle="Pemantauan absensi harian & validasi geofence"
      actions={
        <div className="flex items-center gap-2">
          <div className="operational-field">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter tanggal"
              className="h-9 w-44"
            />
          </div>
          <button type="button" className="operational-button is-primary">
            <Clock className="h-4 w-4" />
            <span>Sinkronkan Hari Ini</span>
          </button>
        </div>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Hadir Hari Ini"
            value={presentToday}
            icon={<UserCheck className="h-4 w-4" />}
            tone="green"
          />
          <OperationalMetricCard
            label="Tepat Waktu"
            value={onTime}
            icon={<Clock className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Terlambat"
            value={late}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="amber"
          />
          <OperationalMetricCard
            label="Luar Geofence"
            value={outsideGeofence}
            icon={<MapPin className="h-4 w-4" />}
            tone="red"
          />
        </OperationalMetricGrid>

        <OperationalDataTable
          data={filteredByDate as unknown as Attendance[]}
          columns={columns as any}
          getRowId={(row: Attendance) => row.id}
          toolbar={
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Tanggal aktif: {dateFilter}</span>
            </div>
          }
          searchPlaceholder="Cari karyawan, divisi, atau status..."
        />
      </div>
    </OperationalPageShell>
  );
}
