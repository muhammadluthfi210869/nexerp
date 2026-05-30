"use client";

import { useState } from "react";
import { Briefcase, Users, Clock, Plus, Eye, Send, CheckCircle2, Search, X } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaBadge, DnaButton, DnaInput } from "@/components/dna";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type PositionStatus = "SENT" | "PENDING" | "DONE";

interface Position {
  id: string;
  position: string;
  department: string;
  candidates: number;
  status: PositionStatus;
  daysOpen: number;
  createdAt: string;
}

const POSITION_DATA: Position[] = [
  { id: "REQ-001", position: "QC Supervisor", department: "QC", candidates: 12, status: "SENT", daysOpen: 14, createdAt: "2026-05-12" },
  { id: "REQ-002", position: "R&D Formulation Specialist", department: "R&D", candidates: 8, status: "PENDING", daysOpen: 28, createdAt: "2026-04-28" },
  { id: "REQ-003", position: "Produksi Operator", department: "Produksi", candidates: 24, status: "DONE", daysOpen: 7, createdAt: "2026-05-19" },
  { id: "REQ-004", position: "Marketing Brand Manager", department: "Marketing", candidates: 5, status: "SENT", daysOpen: 21, createdAt: "2026-05-05" },
  { id: "REQ-005", position: "Warehouse Lead", department: "Warehouse", candidates: 3, status: "PENDING", daysOpen: 35, createdAt: "2026-04-21" },
  { id: "REQ-006", position: "Finance Staff", department: "Finance", candidates: 15, status: "DONE", daysOpen: 10, createdAt: "2026-05-16" },
];

const STATUS_META: Record<PositionStatus, { label: string; status: "success" | "info" | "warning" | "purple" | "default" }> = {
  SENT: { label: "Sent", status: "info" },
  PENDING: { label: "Pending", status: "warning" },
  DONE: { label: "Done", status: "success" },
};

export default function RecruitmentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ position: "", department: "" });

  const openPositions = POSITION_DATA.filter((p) => p.status !== "DONE").length;
  const totalCandidates = POSITION_DATA.reduce((sum, p) => sum + p.candidates, 0);
  const avgDaysOpen = Math.round(POSITION_DATA.reduce((sum, p) => sum + p.daysOpen, 0) / POSITION_DATA.length);

  const handleCreate = () => {
    if (!form.position.trim() || !form.department.trim()) {
      toast.error("Lengkapi semua field");
      return;
    }
    toast.success(`Posisi "${form.position}" berhasil dibuat (mock)`);
    setIsModalOpen(false);
    setForm({ position: "", department: "" });
  };

  return (
    <DashboardShell
      title="Recruitment"
      titleAccent="Pipeline"
      subtitle="Position Requisition Tracking & Candidate Pipeline"
      actions={
        <DnaButton variant="primary" onClick={() => setIsModalOpen(true)} icon={<Plus className="stroke-[3px]" />}>
          CREATE POSITION
        </DnaButton>
      }
    >
      <div className="space-y-6 animate-fade-slide-in">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Open Positions"
            value={openPositions}
            icon={<Briefcase className="text-blue-500" />}
          />
          <StatCard
            label="Total Candidates"
            value={totalCandidates}
            icon={<Users className="text-purple-500" />}
          />
          <StatCard
            label="Time to Fill (Avg)"
            value={`${avgDaysOpen} Days`}
            icon={<Clock className="text-amber-500" />}
          />
        </div>

        {/* Table */}
        <div className="rounded-[24px] border border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 border-b border-slate-100">
                  <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Position</TableHead>
                  <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Department</TableHead>
                  <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Candidates</TableHead>
                  <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Days Open</TableHead>
                  <TableHead className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {POSITION_DATA.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-8">
                      Tidak ada posisi rekrutmen ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  POSITION_DATA.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-slate-50/50 transition-all">
                      <TableCell>
                        <p className="text-[11px] font-black text-slate-900 uppercase">{row.position}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{row.id}</p>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-700 bg-slate-100 rounded px-2 py-0.5 uppercase">
                          {row.department}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <p className="text-[13px] font-black text-slate-900 tabular-nums">{row.candidates}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <DnaBadge status={STATUS_META[row.status].status}>
                          {STATUS_META[row.status].label}
                        </DnaBadge>
                      </TableCell>
                      <TableCell className="text-center">
                        <p className="text-[13px] font-black text-slate-900 tabular-nums">{row.daysOpen}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <DnaButton variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                            DETAIL
                          </DnaButton>
                          {row.status === "PENDING" && (
                            <DnaButton variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                              SEND
                            </DnaButton>
                          )}
                          {row.status === "SENT" && (
                            <DnaButton variant="secondary" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />} className="bg-emerald-600 hover:bg-emerald-700">
                              CLOSE
                            </DnaButton>
                          )}
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

      {/* Create Position Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden">
          <div className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic">
              CREATE POSITION
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium uppercase text-[9px] tracking-widest mt-2 leading-none">
              Formulir Pembukaan Posisi Rekrutmen Baru
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Position Name</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="e.g. QC Supervisor"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. QC"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-2 justify-end">
            <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>
              CANCEL
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreate}>
              CREATE
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
