"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Layers,
  FlaskConical,
  Package,
  Boxes,
  Eye,
  Clock,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaBadge,
} from "@/components/dna";

interface CalendarScheduleEvent {
  id: string;
  date: string; // YYYY-MM-DD
  dayNumber: number;
  stage: "Mixing" | "Filling" | "Packaging";
  brand: string;
  product: string;
  code: string;
  batchRecord: string;
  targetQty: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
}

const SCHEDULE_EVENTS: CalendarScheduleEvent[] = [
  {
    id: "e1",
    date: "2026-09-01",
    dayNumber: 1,
    stage: "Mixing",
    brand: "JS The Perfection of My Aura",
    product: "DEAL - DAY CREAM (I CARE B)",
    code: "SCH-MIX-2026-0001",
    batchRecord: "BR-2026-0001",
    targetQty: 3000,
    status: "COMPLETED",
  },
  {
    id: "e2",
    date: "2026-09-01",
    dayNumber: 1,
    stage: "Mixing",
    brand: "JS The Perfection of My Aura",
    product: "DEAL - FACE SERUM (I CARE B - ACNE)",
    code: "SCH-MIX-2026-0002",
    batchRecord: "BR-2026-0002",
    targetQty: 5000,
    status: "COMPLETED",
  },
  {
    id: "e3",
    date: "2026-09-01",
    dayNumber: 1,
    stage: "Mixing",
    brand: "JS The Perfection of My Aura",
    product: "DEAL - FACE TONER - REVISI WARNA (SIRIN)",
    code: "SCH-MIX-2026-0003",
    batchRecord: "BR-2026-0003",
    targetQty: 4000,
    status: "COMPLETED",
  },
  {
    id: "e4",
    date: "2026-09-01",
    dayNumber: 1,
    stage: "Mixing",
    brand: "JS The Perfection of My Aura",
    product: "DEAL - FACE WASH (FORMULA AUREA)",
    code: "SCH-MIX-2026-0004",
    batchRecord: "BR-2026-0004",
    targetQty: 6000,
    status: "COMPLETED",
  },
  {
    id: "e5",
    date: "2026-09-03",
    dayNumber: 3,
    stage: "Mixing",
    brand: "CONSCENTRA",
    product: "Extrait De Parfum Etheris",
    code: "SCH-MIX-2026-0005",
    batchRecord: "BR-2026-0005",
    targetQty: 2500,
    status: "COMPLETED",
  },
  {
    id: "e6",
    date: "2026-09-03",
    dayNumber: 3,
    stage: "Mixing",
    brand: "CONSCENTRA",
    product: "Extrait De Parfum Nyara",
    code: "SCH-MIX-2026-0006",
    batchRecord: "BR-2026-0006",
    targetQty: 2500,
    status: "COMPLETED",
  },
  {
    id: "e7",
    date: "2026-09-04",
    dayNumber: 4,
    stage: "Mixing",
    brand: "CONSCENTRA",
    product: "Extrait De Parfum Noctivus",
    code: "SCH-MIX-2026-0007",
    batchRecord: "BR-2026-0007",
    targetQty: 3000,
    status: "COMPLETED",
  },
  {
    id: "e8",
    date: "2026-09-07",
    dayNumber: 7,
    stage: "Mixing",
    brand: "SIGVIOLET",
    product: "DEAL - SHAMPOO SIGVIOLET",
    code: "SCH-MIX-2026-0008",
    batchRecord: "BR-2026-0008",
    targetQty: 5000,
    status: "COMPLETED",
  },
  {
    id: "e9",
    date: "2026-09-18",
    dayNumber: 18,
    stage: "Mixing",
    brand: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    code: "SCH-MIX-2026-0009",
    batchRecord: "BR-2026-0009",
    targetQty: 3000,
    status: "IN_PROGRESS",
  },
  {
    id: "e10",
    date: "2026-09-19",
    dayNumber: 19,
    stage: "Filling",
    brand: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    code: "SCH-FIL-2026-0001",
    batchRecord: "BR-2026-0009",
    targetQty: 3000,
    status: "IN_PROGRESS",
  },
  {
    id: "e11",
    date: "2026-09-20",
    dayNumber: 20,
    stage: "Packaging",
    brand: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    code: "SCH-PKG-2026-0001",
    batchRecord: "BR-2026-0009",
    targetQty: 3000,
    status: "SCHEDULED",
  },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardProductionSchedulePage() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 0-indexed, 8 = September
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<CalendarScheduleEvent | null>(null);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

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

  // Generate 35 calendar cells (September 2026 starts on Tuesday, day 2)
  // August ends on 31 (Sun 30, Mon 31), Sept 1..30, Oct 1..3
  const calendarCells = useMemo(() => {
    const cells = [];
    // Prev month padding (August 2026 ends on Monday 31, Sunday 30)
    cells.push({ dayNumber: 30, isCurrentMonth: false, monthOffset: -1 });
    cells.push({ dayNumber: 31, isCurrentMonth: false, monthOffset: -1 });
    // September 1 to 30
    for (let i = 1; i <= 30; i++) {
      cells.push({ dayNumber: i, isCurrentMonth: true, monthOffset: 0 });
    }
    // Next month padding (October 1 to 3)
    for (let i = 1; i <= 3; i++) {
      cells.push({ dayNumber: i, isCurrentMonth: false, monthOffset: 1 });
    }
    return cells;
  }, []);

  const filteredEvents = useMemo(() => {
    return SCHEDULE_EVENTS.filter((e) => {
      const matchSearch =
        e.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStage = filterStage === "ALL" || e.stage === filterStage;
      return matchSearch && matchStage;
    });
  }, [searchTerm, filterStage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <DnaPageHeader
          title="D. Jadwal Produksi"
          subtitle="Kalender Jadwal Pelaksanaan Produksi Kosmetik (Mixing, Filling, Packaging)"
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
        title={`${monthNames[currentMonth]} ${currentYear}`}
        description="Visualisasi timeline agenda produksi harian"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* View toggles */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === "month" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === "week" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === "day" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                Day
              </button>
            </div>

            {/* Prev/Next Month */}
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

            {/* Filter by Stage */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Tahap</option>
              <option value="Mixing">Mixing</option>
              <option value="Filling">Filling</option>
              <option value="Packaging">Packaging</option>
            </select>

            {/* Search */}
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
        {/* CALENDAR GRID */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          {/* DAY HEADER */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-2.5">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* CALENDAR CELLS */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[560px]">
            {calendarCells.map((cell, idx) => {
              const dayEvents = cell.isCurrentMonth
                ? filteredEvents.filter((e) => e.dayNumber === cell.dayNumber)
                : [];

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
                      <span className="text-[10px] text-blue-600 font-mono">
                        {dayEvents.length} jadwal
                      </span>
                    )}
                  </div>

                  {/* EVENT ITEMS IN CELL */}
                  <div className="space-y-1 overflow-y-auto max-h-[90px]">
                    {dayEvents.map((evt) => {
                      const isMixing = evt.stage === "Mixing";
                      const isFilling = evt.stage === "Filling";
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
      </DnaDataTableCard>

      {/* DETAIL MODAL EVENT */}
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
                    selectedEvent.stage === "Mixing"
                      ? "primary"
                      : selectedEvent.stage === "Filling"
                      ? "secondary"
                      : "default"
                  }
                >
                  {selectedEvent.stage}
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
                <span className="text-slate-400 block">Batch Record</span>
                <span className="font-mono font-semibold text-slate-800">{selectedEvent.batchRecord}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Target Produksi</span>
                <span className="font-bold text-emerald-700">{selectedEvent.targetQty.toLocaleString()} PCS</span>
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
