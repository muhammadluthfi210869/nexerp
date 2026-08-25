"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Clock,
  DollarSign,
  Umbrella,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
} from "lucide-react";
import {
  OperationalDataTable,
  OperationalPageShell,
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatOperationalCurrency, formatOperationalDate } from "@/lib/operational-formatters";

type TicketType = "LEAVE" | "OVERTIME" | "REIMBURSE";
type TicketStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISBURSED";

interface Ticket {
  id: string;
  type: TicketType;
  status: TicketStatus;
  reason: string;
  startDate: string;
  endDate: string | null;
  amount: number | null;
  employeeName: string;
  createdAt: string;
}

const MOCK_TICKETS: Ticket[] = [
  { id: "TKT-001", type: "LEAVE", status: "PENDING", reason: "Cuti Tahunan 2026", startDate: "2026-06-01", endDate: "2026-06-05", amount: null, employeeName: "Budi Santoso", createdAt: "2026-05-25T08:00:00Z" },
  { id: "TKT-002", type: "OVERTIME", status: "APPROVED", reason: "Lembur Project Akhir Bulan", startDate: "2026-05-24", endDate: null, amount: null, employeeName: "Siti Rahayu", createdAt: "2026-05-24T16:30:00Z" },
  { id: "TKT-003", type: "REIMBURSE", status: "PENDING", reason: "Biaya Transportasi Meeting Client", startDate: "2026-05-23", endDate: null, amount: 250000, employeeName: "Ahmad Fauzi", createdAt: "2026-05-23T09:15:00Z" },
  { id: "TKT-004", type: "LEAVE", status: "REJECTED", reason: "Izin tidak mendesak", startDate: "2026-05-20", endDate: "2026-05-21", amount: null, employeeName: "Dewi Lestari", createdAt: "2026-05-19T10:00:00Z" },
  { id: "TKT-005", type: "REIMBURSE", status: "DISBURSED", reason: "Pembelian Supplies Kantor", startDate: "2026-05-15", endDate: null, amount: 1500000, employeeName: "Rudi Hartono", createdAt: "2026-05-15T07:45:00Z" },
  { id: "TKT-006", type: "OVERTIME", status: "PENDING", reason: "Support maintenance weekend", startDate: "2026-05-28", endDate: null, amount: null, employeeName: "Fitri Handayani", createdAt: "2026-05-26T14:00:00Z" },
  { id: "TKT-007", type: "LEAVE", status: "APPROVED", reason: "Medical Appointment", startDate: "2026-05-27", endDate: "2026-05-27", amount: null, employeeName: "Agus Prasetyo", createdAt: "2026-05-22T11:30:00Z" },
];

const TYPE_META: Record<TicketType, { label: string }> = {
  LEAVE: { label: "Cuti" },
  OVERTIME: { label: "Lembur" },
  REIMBURSE: { label: "Reimburse" },
};

const STATUS_TONE: Record<TicketStatus, "pending" | "success" | "danger" | "info"> = {
  PENDING: "pending",
  APPROVED: "success",
  REJECTED: "danger",
  DISBURSED: "info",
};

const TAB_VALUES = ["all", "pending", "approved", "rejected"] as const;

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TAB_VALUES)[number]>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ type: "LEAVE" as TicketType, reason: "", startDate: "", endDate: "", amount: 0 });

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["hr-tickets"],
    queryFn: async () => {
      try {
        const resp = await api.get("/hr/tickets");
        return resp.data;
      } catch {
        return MOCK_TICKETS;
      }
    },
  });

  const filteredTickets = useMemo(() => {
    let list = [...tickets];
    if (activeTab !== "all") {
      list = list.filter((t) => t.status.toLowerCase() === activeTab);
    }
    return list;
  }, [activeTab, tickets]);

  const handleCreate = () => {
    toast.success("Tiket berhasil dibuat (mock)");
    setIsModalOpen(false);
    setForm({ type: "LEAVE", reason: "", startDate: "", endDate: "", amount: 0 });
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "type",
        header: "Tipe",
        cell: ({ row }: { row: { original: Ticket } }) => (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {row.original.type === "LEAVE" ? (
              <Umbrella className="h-3.5 w-3.5" />
            ) : row.original.type === "OVERTIME" ? (
              <Clock className="h-3.5 w-3.5" />
            ) : (
              <DollarSign className="h-3.5 w-3.5" />
            )}
            {TYPE_META[row.original.type].label}
          </span>
        ),
      },
      {
        accessorKey: "employeeName",
        header: "Karyawan",
        cell: ({ getValue }: { getValue: () => string }) => (
          <span className="text-[13px] font-medium text-slate-700">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Alasan",
        cell: ({ getValue }: { getValue: () => string }) => (
          <span className="line-clamp-1 max-w-[260px] text-[13px] text-slate-700">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "startDate",
        header: "Tanggal",
        cell: ({ row }: { row: { original: Ticket } }) => {
          const start = formatOperationalDate(row.original.startDate, { day: "2-digit", month: "2-digit", year: "numeric" });
          if (!row.original.endDate) return <span className="text-[13px] text-slate-500">{start}</span>;
          const end = formatOperationalDate(row.original.endDate, { day: "2-digit", month: "2-digit", year: "numeric" });
          return (
            <span className="text-[13px] text-slate-500">
              {start} — {end}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Nominal</div>,
        cell: ({ row }: { row: { original: Ticket } }) => (
          <div className="text-right text-[13px] font-medium tabular-nums text-slate-900">
            {row.original.amount != null ? formatOperationalCurrency(row.original.amount) : "—"}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }: { row: { original: Ticket } }) => {
          const s = row.original.status;
          return (
            <div className="flex justify-center">
              <span className={`operational-status-badge is-${STATUS_TONE[s]}`}>
                {getOperationalStatusLabel(s)}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }: { row: { original: Ticket } }) => (
          <div className="flex justify-center gap-1.5">
            {row.original.status === "PENDING" ? (
              <>
                <button
                  type="button"
                  className="operational-button h-8 px-3 text-[11px]"
                  style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Setujui</span>
                </button>
                <button
                  type="button"
                  className="operational-button is-danger h-8 px-3 text-[11px]"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Tolak</span>
                </button>
              </>
            ) : (
              <button type="button" className="operational-button is-secondary h-8 px-3 text-[11px]">
                Detail
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
      title="Portal Tiket"
      subtitle="Pengajuan cuti, lembur, & reimbursement karyawan"
      actions={
        <button type="button" className="operational-button is-primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Buat Tiket</span>
        </button>
      }
    >
      <div className="operational-stack">
        <OperationalTabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as typeof activeTab)}>
          <OperationalTabsList>
            <OperationalTabsTrigger value="all">Semua</OperationalTabsTrigger>
            <OperationalTabsTrigger value="pending">Menunggu</OperationalTabsTrigger>
            <OperationalTabsTrigger value="approved">Disetujui</OperationalTabsTrigger>
            <OperationalTabsTrigger value="rejected">Ditolak</OperationalTabsTrigger>
          </OperationalTabsList>

          {TAB_VALUES.map((tab) => (
            <OperationalTabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <OperationalDataTable
                  data={filteredTickets as unknown as Ticket[]}
                  columns={columns as any}
                  getRowId={(row: Ticket) => row.id}
                  searchPlaceholder="Cari tiket, karyawan, atau alasan..."
                  emptyMessage="Tidak ada tiket ditemukan"
                />
              )}
            </OperationalTabsContent>
          ))}
        </OperationalTabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buat Tiket Baru</DialogTitle>
            <DialogDescription>
              Formulir pengajuan cuti, lembur, atau reimbursement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="operational-field">
              <span>Tipe Tiket</span>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as TicketType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAVE">Cuti</SelectItem>
                  <SelectItem value="OVERTIME">Lembur</SelectItem>
                  <SelectItem value="REIMBURSE">Reimbursement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="operational-field">
              <span>Alasan</span>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Jelaskan alasan pengajuan..."
                className="operational-textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="operational-field">
                <span>Tanggal Mulai</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="operational-field">
                <span>Tanggal Akhir</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            {form.type === "REIMBURSE" && (
              <div className="operational-field">
                <span>Nominal (IDR)</span>
                <input
                  type="number"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <button type="button" className="operational-button is-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="button" className="operational-button is-primary" onClick={handleCreate}>
              Kirim
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
