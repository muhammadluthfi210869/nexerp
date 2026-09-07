"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Calendar,
  FileText,
  ArrowRight,
} from "lucide-react";
import { DnaButton, DnaBadge, DnaInput, TableWrapper } from "@/components/dna";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";

interface ChecklistMilestone {
  id: string;
  poNumber: string;
  supplier: string;
  milestone: string;
  deadline: string;
  estimasiDeadline?: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "OVERDUE";
  notes?: string;
}

const INITIAL_DATA: ChecklistMilestone[] = [
  { id: "m1", poNumber: "PO-202609-0033", supplier: "PT Chemikas Mandiri", milestone: "QC Lab Results", deadline: "2026-09-10", estimasiDeadline: "2026-09-12", status: "IN_PROGRESS", notes: "Sample dikirim ke lab" },
  { id: "m2", poNumber: "PO-202609-0033", supplier: "PT Chemikas Mandiri", milestone: "Goods Receipt (GR)", deadline: "2026-09-15", status: "PENDING" },
  { id: "m3", poNumber: "PO-202609-0032", supplier: "CV Packindo Lestari", milestone: "Quality Check", deadline: "2026-09-08", estimasiDeadline: "2026-09-09", status: "OVERDUE", notes: "Kemasan tidak sesuai spec" },
  { id: "m4", poNumber: "PO-202609-0031", supplier: "PT Aroma Essentia Prima", milestone: "Customs Clearance", deadline: "2026-09-20", status: "PENDING" },
  { id: "m5", poNumber: "PO-202609-0030", supplier: "PT Botolindo Utama", milestone: "Final QC Pass", deadline: "2026-09-05", estimasiDeadline: "2026-09-04", status: "COMPLETED" },
];

export default function ChecklistProgressPage() {
  const [data, setData] = useState<ChecklistMilestone[]>(INITIAL_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEstimasi, setEditEstimasi] = useState("");

  const handleSaveEstimasi = (id: string) => {
    setData(prev => prev.map(m => m.id === id ? { ...m, estimasiDeadline: editEstimasi } : m));
    setEditingId(null);
    toast.success("Estimasi deadline berhasil disimpan.");
  };

  return (
    <DashboardShell
      title="CHECKLIST"
      titleAccent="TRACKING"
      subtitle="Pantau milestone dan estimasi deadline pengadaan"
      actions={
        <DnaBadge status="info">
          {data.filter(m => m.status === 'OVERDUE').length} Melebihi Batas
        </DnaBadge>
      }
    >
      <TableWrapper>
        <Table className="table-dense">
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">No. PO</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">Supplier</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">Milestone</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">Deadline</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">Estimasi Deadline</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase text-center">Status</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((m) => (
              <TableRow key={m.id} className="hover:bg-slate-50/30 transition-all">
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-black text-xs uppercase italic text-slate-900">{m.poNumber}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 font-medium text-xs text-slate-700">{m.supplier}</TableCell>
                <TableCell className="py-3 px-4 text-xs text-slate-600">{m.milestone}</TableCell>
                <TableCell className="py-3 px-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className={m.status === 'OVERDUE' ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {m.deadline}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  {editingId === m.id ? (
                    <div className="flex items-center gap-2">
                      <DnaInput
                        type="date"
                        value={editEstimasi}
                        onChange={(e) => setEditEstimasi(e.target.value)}
                        className="w-36 h-8 text-xs"
                      />
                      <DnaButton variant="primary" size="sm" className="h-8 text-xs" onClick={() => handleSaveEstimasi(m.id)}>Simpan</DnaButton>
                      <DnaButton variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditingId(null)}>Batal</DnaButton>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {m.estimasiDeadline ? (
                        <span className="text-xs font-bold text-blue-600">{m.estimasiDeadline}</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada</span>
                      )}
                      <button
                        onClick={() => { setEditingId(m.id); setEditEstimasi(m.estimasiDeadline || ''); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold ml-2"
                      >
                        {m.estimasiDeadline ? 'Edit' : '+ Tambah'}
                      </button>
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <DnaBadge status={
                    m.status === 'COMPLETED' ? "success" :
                    m.status === 'IN_PROGRESS' ? "info" :
                    m.status === 'OVERDUE' ? "critical" : "warning"
                  }>
                    {m.status === 'IN_PROGRESS' ? 'IN PROGRESS' :
                     m.status === 'COMPLETED' ? 'COMPLETED' :
                     m.status === 'OVERDUE' ? 'OVERDUE' : 'PENDING'}
                  </DnaBadge>
                </TableCell>
                <TableCell className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                  {m.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </DashboardShell>
  );
}
