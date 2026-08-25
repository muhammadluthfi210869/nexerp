"use client";

import { useState, useMemo } from "react";
import {
  Briefcase,
  Users,
  Clock,
  Plus,
  Eye,
  Send,
  CheckCircle2,
} from "lucide-react";
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  getOperationalStatusLabel,
} from "@/components/operational";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const POSITION_STATUS_LABEL: Record<PositionStatus, string> = {
  SENT: "Terkirim",
  PENDING: "Menunggu",
  DONE: "Selesai",
};

const POSITION_STATUS_TONE: Record<PositionStatus, "info" | "pending" | "success"> = {
  SENT: "info",
  PENDING: "pending",
  DONE: "success",
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

  const columns = useMemo(
    () => [
      {
        accessorKey: "position",
        header: "Posisi",
        cell: ({ row }: { row: { original: Position } }) => (
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-slate-900">{row.original.position}</span>
            <span className="text-[11px] text-slate-500">{row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "department",
        header: "Departemen",
        cell: ({ getValue }: { getValue: () => string }) => (
          <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "candidates",
        header: () => <div className="text-center">Kandidat</div>,
        cell: ({ getValue }: { getValue: () => number }) => (
          <div className="text-center text-[13px] font-medium tabular-nums text-slate-900">
            {Number(getValue()).toLocaleString("id-ID")}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }: { row: { original: Position } }) => {
          const s = row.original.status;
          return (
            <div className="flex justify-center">
              <span className={`operational-status-badge is-${POSITION_STATUS_TONE[s]}`}>
                {POSITION_STATUS_LABEL[s] ?? getOperationalStatusLabel(s)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "daysOpen",
        header: () => <div className="text-center">Hari Terbuka</div>,
        cell: ({ getValue }: { getValue: () => number }) => (
          <div className="text-center text-[13px] font-medium tabular-nums text-slate-900">
            {String(getValue())}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }: { row: { original: Position } }) => (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              className="operational-button is-secondary h-8 px-3 text-[11px]"
              aria-label="Detail posisi"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Detail</span>
            </button>
            {row.original.status === "PENDING" && (
              <button type="button" className="operational-button is-primary h-8 px-3 text-[11px]">
                <Send className="h-3.5 w-3.5" />
                <span>Kirim</span>
              </button>
            )}
            {row.original.status === "SENT" && (
              <button type="button" className="operational-button is-success h-8 px-3 text-[11px]" style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Tutup</span>
              </button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalPageShell
      title="Rekrutmen"
      subtitle="Pelacakan posisi rekrutmen & pipeline kandidat"
      actions={
        <button type="button" className="operational-button is-primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Buat Posisi</span>
        </button>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Posisi Terbuka"
            value={openPositions}
            icon={<Briefcase className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Total Kandidat"
            value={totalCandidates}
            icon={<Users className="h-4 w-4" />}
            tone="purple"
          />
          <OperationalMetricCard
            label="Rata-rata Hari"
            value={`${avgDaysOpen} Hari`}
            icon={<Clock className="h-4 w-4" />}
            tone="amber"
          />
        </OperationalMetricGrid>

        <OperationalDataTable
          data={POSITION_DATA as unknown as Position[]}
          columns={columns as any}
          getRowId={(row: Position) => row.id}
          searchPlaceholder="Cari posisi, departemen, atau status..."
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buat Posisi Baru</DialogTitle>
            <DialogDescription>
              Formulir pembukaan posisi rekrutmen baru.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="operational-field">
              <span>Nama Posisi</span>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Contoh: QC Supervisor"
              />
            </div>
            <div className="operational-field">
              <span>Departemen</span>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Contoh: QC"
              />
            </div>
          </div>
          <DialogFooter>
            <button type="button" className="operational-button is-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="button" className="operational-button is-primary" onClick={handleCreate}>
              Buat
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
