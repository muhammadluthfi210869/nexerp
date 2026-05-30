"use client";

import { useState, useMemo } from "react";
import { BarChart3, Calendar, Activity, Filter } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaBadge, DnaButton } from "@/components/dna";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface KPIEntry {
  id: string;
  employee: string;
  division: string;
  objective: number;
  subjective: number;
  finalScore: number;
  period: string;
}

const DIVISIONS = ["All", "Produksi", "QC", "R&D", "Marketing", "Warehouse", "SCM", "Finance", "HR", "Creative"];

const KPI_DATA: KPIEntry[] = [
  { id: "KPI-001", employee: "Budi Santoso", division: "Produksi", objective: 88, subjective: 85, finalScore: 87.1, period: "Q1 2026" },
  { id: "KPI-002", employee: "Siti Rahayu", division: "QC", objective: 92, subjective: 90, finalScore: 91.4, period: "Q1 2026" },
  { id: "KPI-003", employee: "Ahmad Fauzi", division: "R&D", objective: 76, subjective: 80, finalScore: 77.2, period: "Q1 2026" },
  { id: "KPI-004", employee: "Dewi Lestari", division: "HR", objective: 95, subjective: 92, finalScore: 94.1, period: "Q1 2026" },
  { id: "KPI-005", employee: "Rudi Hartono", division: "Warehouse", objective: 65, subjective: 70, finalScore: 66.5, period: "Q1 2026" },
  { id: "KPI-006", employee: "Fitri Handayani", division: "Marketing", objective: 82, subjective: 78, finalScore: 80.8, period: "Q1 2026" },
  { id: "KPI-007", employee: "Agus Prasetyo", division: "Produksi", objective: 70, subjective: 65, finalScore: 68.5, period: "Q1 2026" },
  { id: "KPI-008", employee: "Linda Kusuma", division: "Finance", objective: 90, subjective: 88, finalScore: 89.4, period: "Q1 2026" },
  { id: "KPI-009", employee: "Hendra Gunawan", division: "SCM", objective: 73, subjective: 75, finalScore: 73.6, period: "Q1 2026" },
  { id: "KPI-010", employee: "Maya Sari", division: "Creative", objective: 85, subjective: 82, finalScore: 84.1, period: "Q1 2026" },
];

function getScoreBadge(score: number): "success" | "warning" | "critical" {
  if (score >= 85) return "success";
  if (score >= 70) return "warning";
  return "critical";
}

export default function KPIPage() {
  const [divisionFilter, setDivisionFilter] = useState("All");

  const filtered = useMemo(() => {
    if (divisionFilter === "All") return KPI_DATA;
    return KPI_DATA.filter((k) => k.division === divisionFilter);
  }, [divisionFilter]);

  const avgScore = Math.round(KPI_DATA.reduce((sum, k) => sum + k.finalScore, 0) / KPI_DATA.length);
  const activePeriod = "Q1 2026";
  const eventCount = KPI_DATA.length;

  return (
    <DashboardShell
      title="KPI"
      titleAccent="Engine"
      subtitle="Employee Performance Scoring & Objective Tracking"
      actions={
        <DnaButton variant="primary" icon={<BarChart3 className="stroke-[3px]" />}>
          RUN ASSESSMENT
        </DnaButton>
      }
    >
      <div className="space-y-6 animate-fade-slide-in">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Avg KPI Score"
            value={`${avgScore}`}
            subValue="out of 100"
            icon={<BarChart3 className="text-blue-500" />}
          />
          <StatCard
            label="Active Period"
            value={activePeriod}
            icon={<Calendar className="text-purple-500" />}
          />
          <StatCard
            label="Event Count"
            value={eventCount}
            subValue="scored entries"
            icon={<Activity className="text-emerald-500" />}
          />
        </div>

        {/* Filter + Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-44">
                <Select value={divisionFilter} onValueChange={(v: string | null) => setDivisionFilter(v ?? "")}>
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase">
                    <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <SelectValue placeholder="Filter Division" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200">
                    {DIVISIONS.map((d) => (
                      <SelectItem key={d} value={d} className="font-medium text-xs uppercase cursor-pointer hover:bg-slate-50">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {filtered.length} records
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Division</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Objective (70%)</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Subjective (30%)</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Final Score</TableHead>
                    <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-8">
                        Tidak ada data KPI ditemukan
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
                        <TableCell className="text-right">
                          <p className="text-[13px] font-black text-slate-900 tabular-nums">{row.objective}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="text-[13px] font-black text-slate-900 tabular-nums">{row.subjective}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <DnaBadge status={getScoreBadge(row.finalScore)}>
                            {row.finalScore.toFixed(1)}
                          </DnaBadge>
                        </TableCell>
                        <TableCell>
                          <p className="text-[11px] font-medium text-slate-400 uppercase">{row.period}</p>
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
