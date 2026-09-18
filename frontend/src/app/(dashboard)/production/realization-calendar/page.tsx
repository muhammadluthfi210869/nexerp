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
  CheckCircle2,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaBadge,
} from "@/components/dna";

interface CalendarRealizationEvent {
  id: string;
  date: string;
  dayNumber: number;
  stage: "Mixing" | "Filling" | "Packaging";
  brand: string;
  product: string;
  realizationNo: string;
  batchRecord: string;
  actualQty: number;
  unit: string;
  operator: string;
  status: "COMPLETED" | "IN_PROGRESS";
}

const REALIZATION_EVENTS: CalendarRealizationEvent[] = [
  {
    id: "r1",
    date: "2026-08-31",
    dayNumber: 31,
    stage: "Filling",
    brand: "GHIMAROW",
    product: "LUXURIOUS WHITENING BOOSTER, 250 ML",
    realizationNo: "RLZ-FIL-2026-0831",
    batchRecord: "BR-2026-0831",
    actualQty: 2450,
    unit: "PCS",
    operator: "Budi Santoso",
    status: "COMPLETED",
  },
  {
    id: "r2",
    date: "2026-08-31",
    dayNumber: 31,
    stage: "Filling",
    brand: "IMOZU",
    product: "Body Lotion Tone Up",
    realizationNo: "RLZ-FIL-2026-0832",
    batchRecord: "BR-2026-0832",
    actualQty: 3950,
    unit: "PCS",
    operator: "Budi Santoso",
    status: "COMPLETED",
  },
  {
    id: "r3",
    date: "2026-08-31",
    dayNumber: 31,
    stage: "Mixing",
    brand: "MILMICHA",
    product: "Moisturizer Gel ( MILMICHA GLOW )",
    realizationNo: "RLZ-MIX-2026-0833",
    batchRecord: "BR-2026-0833",
    actualQty: 200,
    unit: "Kg",
    operator: "Ahmad Fauzi",
    status: "COMPLETED",
  },
  {
    id: "r4",
    date: "2026-08-31",
    dayNumber: 31,
    stage: "Mixing",
    brand: "PRIORITAS",
    product: "EAU DE PARFUM IMOZU PINK CHIFFON",
    realizationNo: "RLZ-MIX-2026-0834",
    batchRecord: "BR-2026-0834",
    actualQty: 120,
    unit: "Kg",
    operator: "Ahmad Fauzi",
    status: "COMPLETED",
  },
  {
    id: "r5",
    date: "2026-09-03",
    dayNumber: 3,
    stage: "Mixing",
    brand: "JS The Perfection of My Aura",
    product: "DEAL - DAY CREAM (I CARE B)",
    realizationNo: "RLZ-MIX-2026-0901",
    batchRecord: "BR-2026-0001",
    actualQty: 157.2,
    unit: "Kg",
    operator: "Ahmad Fauzi",
    status: "COMPLETED",
  },
  {
    id: "r6",
    date: "2026-09-03",
    dayNumber: 3,
    stage: "Mixing",
    brand: "JS The Perfection of My Aura",
    product: "DEAL - FACE WASH (FORMULA AUREA)",
    realizationNo: "RLZ-MIX-2026-0902",
    batchRecord: "BR-2026-0004",
    actualQty: 305,
    unit: "Kg",
    operator: "Ahmad Fauzi",
    status: "COMPLETED",
  },
  {
    id: "r7",
    date: "2026-09-19",
    dayNumber: 19,
    stage: "Filling",
    brand: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    realizationNo: "RLZ-FIL-2026-0001",
    batchRecord: "BR-2026-0001",
    actualQty: 2980,
    unit: "PCS",
    operator: "Budi Santoso",
    status: "COMPLETED",
  },
  {
    id: "r8",
    date: "2026-09-20",
    dayNumber: 20,
    stage: "Packaging",
    brand: "Farah Derma Clinic",
    product: "Day Cream SPF 30 (BJD)",
    realizationNo: "RLZ-PKG-2026-0001",
    batchRecord: "BR-2026-0001",
    actualQty: 2970,
    unit: "PCS",
    operator: "Rina Marlina",
    status: "IN_PROGRESS",
  },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardProductionRealizationPage() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // September
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<CalendarRealizationEvent | null>(null);

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

  const calendarCells = useMemo(() => {
    const cells = [];
    cells.push({ dayNumber: 30, isCurrentMonth: false, monthOffset: -1 });
    cells.push({ dayNumber: 31, isCurrentMonth: false, monthOffset: -1 });
    for (let i = 1; i <= 30; i++) {
      cells.push({ dayNumber: i, isCurrentMonth: true, monthOffset: 0 });
    }
    for (let i = 1; i <= 3; i++) {
      cells.push({ dayNumber: i, isCurrentMonth: false, monthOffset: 1 });
    }
    return cells;
  }, []);

  const filteredEvents = useMemo(() => {
    return REALIZATION_EVENTS.filter((e) => {
      const matchSearch =
        e.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.realizationNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStage = filterStage === "ALL" || e.stage === filterStage;
      return matchSearch && matchStage;
    });
  }, [searchTerm, filterStage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <DnaPageHeader
          title="D. Realisasi Produksi"
          subtitle="Kalender Rekap Realisasi Pelaksanaan Produksi (Mixing, Filling, Packaging)"
        />
        <div className="flex items-center gap-2">
          <Link href="/production">
            <DnaButton variant="secondary" size="sm">
              Dasbor Produksi
            </DnaButton>
          </Link>
          <Link href="/production/schedule-calendar">
            <DnaButton variant="secondary" size="sm">
              <CalendarIcon className="w-3.5 h-3.5 mr-1" />
              Kalender Jadwal
            </DnaButton>
          </Link>
        </div>
      </div>

      <DnaDataTableCard
        title={`${monthNames[currentMonth]} ${currentYear}`}
        description="Visualisasi timeline realisasi output produksi aktual"
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
              // Matching date
              const dayEvents = filteredEvents.filter((e) => {
                if (cell.isCurrentMonth) {
                  return e.dayNumber === cell.dayNumber && e.date.startsWith("2026-09");
                } else if (cell.monthOffset === -1) {
                  return e.dayNumber === cell.dayNumber && e.date.startsWith("2026-08");
                }
                return false;
              });

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
                      <span className="text-[10px] text-emerald-600 font-mono">
                        {dayEvents.length} realisasi
                      </span>
                    )}
                  </div>

                  {/* EVENT ITEMS IN CELL */}
                  <div className="space-y-1 overflow-y-auto max-h-[90px]">
                    {dayEvents.map((evt) => {
                      const isMixing = evt.stage === "Mixing";
                      const isFilling = evt.stage === "Filling";
                      const badgeClass = isMixing
                        ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                        : isFilling
                        ? "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                        : "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100";

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
        title="Detail Realisasi Produksi"
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="text-slate-400">Tahap & No Realisasi</div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>{selectedEvent.realizationNo}</span>
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
                <span className="text-slate-400 block">Tanggal Realisasi</span>
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
                <span className="text-slate-400 block">Realisasi Output</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {selectedEvent.actualQty.toLocaleString()} {selectedEvent.unit}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg col-span-2">
                <span className="text-slate-400 block">Operator Penanggung Jawab</span>
                <span className="font-medium text-slate-800">{selectedEvent.operator}</span>
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
