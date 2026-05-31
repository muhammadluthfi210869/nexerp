"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock, DollarSign, Umbrella, CheckCircle2, XCircle, Plus, Search, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaBadge, DnaButton } from "@/components/dna";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

const TYPE_META: Record<TicketType, { label: string; icon: React.ReactNode; className: string }> = {
  LEAVE: { label: "Cuti", icon: <Umbrella className="w-3.5 h-3.5" />, className: "bg-cyan-50 text-cyan-600 border-cyan-100" },
  OVERTIME: { label: "Lembur", icon: <Clock className="w-3.5 h-3.5" />, className: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  REIMBURSE: { label: "Reimburse", icon: <DollarSign className="w-3.5 h-3.5" />, className: "bg-amber-50 text-amber-600 border-amber-100" },
};

const STATUS_META: Record<TicketStatus, { label: string; status: "success" | "info" | "warning" | "critical" | "purple" | "default" }> = {
  PENDING: { label: "Pending", status: "warning" },
  APPROVED: { label: "Disetujui", status: "success" },
  REJECTED: { label: "Ditolak", status: "critical" },
  DISBURSED: { label: "Dibayar", status: "info" },
};

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
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
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.reason.toLowerCase().includes(term) ||
          t.type.toLowerCase().includes(term) ||
          t.employeeName.toLowerCase().includes(term),
      );
    }
    return list;
  }, [activeTab, search, tickets]);

  const handleCreate = () => {
    toast.success("Tiket berhasil dibuat (mock)");
    setIsModalOpen(false);
    setForm({ type: "LEAVE", reason: "", startDate: "", endDate: "", amount: 0 });
  };

  return (
    <DashboardShell
      title="TICKET"
      titleAccent="PORTAL"
      subtitle="Pengajuan Cuti, Lembur & Reimbursement Karyawan"
      actions={
        <DnaButton variant="primary" onClick={() => setIsModalOpen(true)} icon={<Plus className="stroke-[3px]" />}>
          BUAT TIKET
        </DnaButton>
      }
    >
      <div className="space-y-6 animate-fade-slide-in">
        {/* Search + Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-12 border border-slate-100">
                <TabsTrigger value="all" className="rounded-xl px-5 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[9px] tracking-widest transition-all gap-2">
                  Semua
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-xl px-5 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[9px] tracking-widest transition-all gap-2">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="approved" className="rounded-xl px-5 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[9px] tracking-widest transition-all gap-2">
                  Disetujui
                </TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-xl px-5 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[9px] tracking-widest transition-all gap-2">
                  Ditolak
                </TabsTrigger>
              </TabsList>
              <div className="relative w-full md:w-64 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="CARI TIKET..."
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Content Tabs */}
            {["all", "pending", "approved", "rejected"].map((tab) => (
              <TabsContent key={tab} value={tab} className="m-0 mt-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="rounded-[24px] border border-[var(--border-color)] shadow-sm overflow-hidden bg-white animate-fade-slide-in">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">TIPE</th>
                          <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">KARYAWAN</th>
                          <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">ALASAN</th>
                          <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">TANGGAL</th>
                          <th className="px-4 py-4 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">NOMINAL</th>
                          <th className="px-4 py-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</th>
                          <th className="px-4 py-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center">
                              <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
                            </td>
                          </tr>
                        ) : filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Tidak ada tiket ditemukan
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.map((ticket) => {
                            const typeMeta = TYPE_META[ticket.type];
                            const statusMeta = STATUS_META[ticket.status];
                            return (
                              <tr key={ticket.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black rounded-lg px-2.5 py-1 uppercase ${typeMeta.className}`}>
                                    {typeMeta.icon}
                                    {typeMeta.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-[11px] font-black text-slate-700 uppercase">{ticket.employeeName}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-[11px] font-medium text-slate-700 max-w-[250px] truncate uppercase">{ticket.reason}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-[11px] font-medium text-slate-400">
                                    {new Date(ticket.startDate).toLocaleDateString("id-ID")}
                                    {ticket.endDate ? ` — ${new Date(ticket.endDate).toLocaleDateString("id-ID")}` : ""}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <p className="text-[13px] font-black text-slate-900 tracking-tighter tabular-nums">
                                    {ticket.amount != null ? `Rp ${ticket.amount.toLocaleString("id-ID")}` : "—"}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <DnaBadge status={statusMeta.status}>{statusMeta.label}</DnaBadge>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center gap-2">
                                    {ticket.status === "PENDING" && (
                                      <div className="flex gap-1.5">
                                        <DnaButton variant="primary" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />} className="bg-emerald-600 hover:bg-emerald-700">
                                          SETUJUI
                                        </DnaButton>
                                        <DnaButton variant="danger" size="sm" icon={<XCircle className="w-3.5 h-3.5" />}>
                                          TOLAK
                                        </DnaButton>
                                      </div>
                                    )}
                                    {ticket.status !== "PENDING" && (
                                      <DnaButton variant="outline" size="sm">
                                        DETAIL
                                      </DnaButton>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden">
          <div className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic">
              BUAT TIKET BARU
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium uppercase text-[9px] tracking-widest mt-2 leading-none">
              Formulir Pengajuan Cuti / Lembur / Reimbursement
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Tipe Tiket</label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as TicketType })}
              >
                <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                  <SelectValue placeholder="Pilih tipe..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  <SelectItem value="LEAVE" className="font-medium text-xs uppercase cursor-pointer hover:bg-slate-50">Cuti</SelectItem>
                  <SelectItem value="OVERTIME" className="font-medium text-xs uppercase cursor-pointer hover:bg-slate-50">Lembur</SelectItem>
                  <SelectItem value="REIMBURSE" className="font-medium text-xs uppercase cursor-pointer hover:bg-slate-50">Reimbursement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Alasan</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-xs resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Jelaskan alasan pengajuan..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Tanggal Mulai</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Tanggal Akhir</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
            {form.type === "REIMBURSE" && (
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Nominal (IDR)</label>
                <input
                  type="number"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xl text-blue-600 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            )}
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-2 justify-end">
            <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>
              BATAL
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreate}>
              KIRIM
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
