"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  Wallet,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";

const STATUS_TONE: Record<string, "pending" | "process" | "success" | "danger" | "neutral"> = {
  PENDING_APPROVAL_MGR: "pending",
  APPROVED_BY_MGR: "process",
  PAID: "success",
  REJECTED: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL_MGR: "Waiting Manager",
  APPROVED_BY_MGR: "Approved - Queueing Finance",
  PAID: "Disbursed / Paid",
  REJECTED: "Rejected",
};

export default function MyFundRequestsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    departmentId: "BD",
    amount: 0,
    reason: "",
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-fund-requests"],
    queryFn: async () => {
      const resp = await api.get("/finance/fund-requests/me");
      return resp.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/finance/fund-request", data),
    onSuccess: () => {
      toast.success("Fund request submitted successfully.");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-fund-requests"] });
    },
    onError: () => toast.error("Submission failed."),
  });

  return (
    <OperationalPageShell
      title="My Requests"
      subtitle="Internal Fund Requisition & Tracking"
      actions={
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button type="button" className="operational-button is-primary">
              <Plus className="h-4 w-4" />
              <span>New Fund Request</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-blue-600 p-6 text-white relative">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white">
                Requisition Form
              </DialogTitle>
              <DialogDescription className="text-white/60 font-medium uppercase text-[10px] tracking-tight mt-3">
                Internal Fund Disbursement Request
              </DialogDescription>
              <Wallet className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 text-white/10" />
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Divisi Pengaju
                </label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(val) => val && setFormData({ ...formData, departmentId: val })}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-none font-bold rounded-xl text-xs">
                    <SelectValue placeholder="Pilih Divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BD">Business Development</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="SCM">Supply Chain</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Nominal Dana (IDR)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="number"
                    placeholder="0"
                    className="h-12 w-full pl-12 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:border-blue-500"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Keperluan / Justifikasi
                </label>
                <input
                  type="text"
                  placeholder="Misal: Biaya Langganan Software R&D"
                  className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-sm focus:outline-none focus:border-blue-500"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
              <button
                type="button"
                className="operational-button is-primary w-full"
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Submitting..." : "Submit Requisition"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total Requests"
            value={requests.length}
            icon={<FileText className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Pending Approval"
            value={
              requests.filter(
                (r: any) => r.status === "PENDING_APPROVAL_MGR" || r.status === "PENDING_APPROVAL_DIR"
              ).length
            }
            icon={<Clock className="h-4 w-4" />}
            tone="amber"
          />
          <OperationalMetricCard
            label="Disbursed"
            value={requests.filter((r: any) => r.status === "PAID").length}
            icon={<Wallet className="h-4 w-4" />}
            tone="green"
          />
        </OperationalMetricGrid>

        <div className="space-y-3">
          <AnimatePresence>
            {requests.map((req: any, idx: number) => {
              const tone = STATUS_TONE[req.status] || "neutral";
              const label = STATUS_LABEL[req.status] || getOperationalStatusLabel(req.status);
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <OperationalPanel className="!flex-row items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 tracking-tight uppercase italic">
                          {req.reason || "—"}
                        </h3>
                        <OperationalStatusBadge status={tone}>{label}</OperationalStatusBadge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> {req.departmentId || "—"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-blue-600">REQ-ID: {req.id ? req.id.slice(0, 8) : "—"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">
                        Requested Amount
                      </p>
                      <p className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                        {formatCurrency(req.amount ?? 0)}
                      </p>
                    </div>
                  </OperationalPanel>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {requests.length === 0 && (
            <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-bold uppercase tracking-tight text-xs">
                Tidak ada pengajuan dana ditemukan
              </p>
            </div>
          )}
        </div>
      </div>
    </OperationalPageShell>
  );
}
