"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaBadge,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  DnaSelect,
} from "@/components/dna";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

interface CalendarScheduleEvent {
  id: string;
  date: string; // YYYY-MM-DD
  stage: string;
  brand: string;
  product: string;
  code: string;
  batchRecord: string;
  targetQty: number;
  status: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const dateKey = (year: number, monthIndex: number, day: number) =>
  new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);

const toDayKey = (value: string) => new Date(value).toISOString().slice(0, 10);

const stageLabel = (stage: string) =>
  stage.charAt(0) + stage.slice(1).toLowerCase();

export default function DashboardProductionSchedulePage() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<CalendarScheduleEvent | null>(null);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const {
    data: events,
    isLoading,
    isError,
    refetch,
  } = useQuery<CalendarScheduleEvent[]>({
    queryKey: ["production-schedules"],
    queryFn: async () => {
      const res = await api.get("/production/schedules");
      const body = unwrapResponse<any>(res);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows.map((s) => ({
        id: s.id,
        date: toDayKey(s.startTime),
        stage: String(s.stage || "UNKNOWN"),
        brand: s.workOrder?.lead?.brandName || "—",
        product: s.workOrder?.lead?.productInterest || "—",
        code: s.scheduleNumber,
        batchRecord: s.workOrder?.woNumber || "—",
        targetQty: Number(s.targetQty || 0),
        status: s.status || "SCHEDULED",
      }));
    },
  });

  const calendarCells = useMemo(() => {
    const startWeekday = new Date(Date.UTC(currentYear, currentMonth, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
    const daysInPrevMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();

    const cells: { dayNumber: number; isCurrentMonth: boolean; monthOffset: number }[] = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({ dayNumber: daysInPrevMonth - i, isCurrentMonth: false, monthOffset: -1 });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ dayNumber: d, isCurrentMonth: true, monthOffset: 0 });
    }
    let nextDay = 1;
    while (cells.length < 35 || cells.length % 7 !== 0) {
      cells.push({ dayNumber: nextDay++, isCurrentMonth: false, monthOffset: 1 });
    }
    return cells;
  }, [currentYear, currentMonth]);

  const filteredEvents = useMemo(() => {
    return (events ?? []).filter((e) => {
      const matchSearch =
        e.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStage = filterStage === "ALL" || e.stage === filterStage;
      return matchSearch && matchStage;
    });
  }, [events, searchTerm, filterStage]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarScheduleEvent[]>();
    filteredEvents.forEach((e) => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [filteredEvents]);

  const stages = useMemo(
    () => [...new Set((events ?? []).map((e) => e.stage))].sort(),
    [events],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <DnaPageHeader
          title="D. Jadwal Produksi"
          subtitle="Kalender jadwal pelaksanaan produksi dari API /production/schedules"
        />
        <div className="flex items-center gap-2">
          <Link href="/production">
            <DnaButton variant="secondary" size="sm">
              Dasbor Produksi
            </DnaButton>
          </Link>
          <Link href="/production/realization-calendar">
            <DnaButton variant="secondary" size="sm">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Kalender Realisasi
            </DnaButton>
          </Link>
        </div>
      </div>

      <DnaDataTableCard
        title={`${MONTH_NAMES[currentMonth]} ${currentYear}`}
        description="Visualisasi timeline agenda produksi harian"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <DnaSelect
              value={filterStage}
              onChange={(val) => setFilterStage(val)}
              options={[
                { value: "ALL", label: "Semua Tahap" },
                ...stages.map((s) => ({ value: s, label: stageLabel(s) })),
              ]}
              className="h-8 w-36 text-xs"
            />

            <div className="w-48">
              <DnaInput
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>
          </div>
        }
      >
        {isLoading ? (
          <DnaLoadingSkeleton rows={6} />
        ) : isError ? (
          <DnaErrorState
            title="Gagal Memuat Jadwal Produksi"
            message="Tidak dapat mengambil jadwal produksi dari server."
            onRetry={() => refetch()}
          />
        ) : (events ?? []).length === 0 ? (
          <DnaEmptyState
            title="Belum Ada Jadwal Produksi"
            description="Belum ada jadwal batch (mixing/filling/packaging) yang tercatat di sistem."
          />
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-2.5">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[560px]">
              {calendarCells.map((cell, idx) => {
                const cellMonth =
                  cell.monthOffset === 0
                    ? currentMonth
                    : cell.monthOffset === -1
                    ? currentMonth - 1
                    : currentMonth + 1;
                const key = dateKey(currentYear, cellMonth, cell.dayNumber);
                const dayEvents = eventsByDate.get(key) ?? [];

                return (
                  <div
                    key={idx}
                    className={`p-1.5 flex flex-col min-h-[100px] transition-colors ${
                      cell.isCurrentMonth ? "bg-white hover:bg-slate-50/40" : "bg-slate-50/40 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1 px-1 font-semibold">
                      <span className={cell.isCurrentMonth ? "text-slate-800" : "text-slate-400"}>
                        {cell.dayNumber}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-blue-600 tabular-nums">
                          {dayEvents.length} jadwal
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[90px]">
                      {dayEvents.map((evt) => {
                        const isMixing = evt.stage === "MIXING";
                        const isFilling = evt.stage === "FILLING";
                        const badgeClass = isMixing
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : isFilling
                          ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";

                        return (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() => setSelectedEvent(evt)}
                            className={`w-full text-left p-1 rounded text-[11px] border leading-tight transition-colors block truncate ${badgeClass}`}
                            title={`[${evt.brand}] ${evt.product} (${evt.stage})`}
                          >
                            <span className="font-semibold">[{evt.brand}]</span> {evt.product} ({evt.stage})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DnaDataTableCard>

      <DnaModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Detail Jadwal Produksi"
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="text-slate-400">Tahap & Kode</div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>{selectedEvent.code}</span>
                <DnaBadge
                  variant={
                    selectedEvent.stage === "MIXING"
                      ? "primary"
                      : selectedEvent.stage === "FILLING"
                      ? "secondary"
                      : "default"
                  }
                >
                  {stageLabel(selectedEvent.stage)}
                </DnaBadge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Brand</span>
                <span className="font-semibold text-slate-800">{selectedEvent.brand}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Tanggal Pelaksanaan</span>
                <span className="font-medium text-slate-800">{selectedEvent.date}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg col-span-2">
                <span className="text-slate-400 block">Produk</span>
                <span className="font-bold text-slate-900">{selectedEvent.product}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Work Order</span>
                <span className="tabular-nums font-semibold text-slate-800">{selectedEvent.batchRecord}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Target Produksi</span>
                <span className="font-bold text-emerald-700">{selectedEvent.targetQty.toLocaleString()} PCS</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg col-span-2">
                <span className="text-slate-400 block">Status Jadwal</span>
                <span className="font-medium text-slate-800">{selectedEvent.status}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <DnaButton variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </div>
  );
}