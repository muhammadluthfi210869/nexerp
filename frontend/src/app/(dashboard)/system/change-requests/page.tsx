"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Loader2, FileText, AlertCircle } from "lucide-react";
import {
  OperationalButton,
  OperationalDataTable,
  OperationalInput,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalDate } from "@/lib/operational-formatters";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ChangeRequestsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["change-requests"],
    queryFn: async () => (await api.get("/system/change-requests")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/system/change-request", form),
    onSuccess: () => {
      toast.success("Permintaan perubahan terkirim");
      queryClient.invalidateQueries({ queryKey: ["change-requests"] });
      setIsModalOpen(false);
      setForm({ title: "", description: "", priority: "MEDIUM" });
    },
    onError: () => toast.error("Gagal mengirim permintaan"),
  });

  const totalCount = requests?.length ?? 0;
  const pendingCount = (requests || []).filter((r: any) => r.status !== "DONE" && r.status !== "REJECTED").length;
  const completedCount = (requests || []).filter((r: any) => r.status === "DONE").length;

  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Judul",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-slate-900">{row.original.title}</span>
              <span className="text-[12px] text-slate-500">{row.original.description || "—"}</span>
              <span className="mt-1 text-[10px] font-medium uppercase text-slate-400">
                {formatOperationalDate(row.original.createdAt)}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }: { row: { original: any } }) => {
          const s = row.original.status || "PENDING";
          const tone = s === "DONE" ? "success" : s === "REJECTED" ? "danger" : "pending";
          return (
            <div className="flex justify-center">
              <span className={`operational-status-badge is-${tone}`}>
                {getOperationalStatusLabel(s)}
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <OperationalPageShell
      title="Permintaan Perubahan"
      subtitle="Ajukan perubahan & pengembangan fitur ERP"
      actions={
        <OperationalButton variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Ajukan Perubahan</span>
        </OperationalButton>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total Permintaan"
            value={totalCount}
            icon={<FileText className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Menunggu"
            value={pendingCount}
            icon={<AlertCircle className="h-4 w-4" />}
            tone="amber"
          />
          <OperationalMetricCard
            label="Selesai"
            value={completedCount}
            icon={<FileText className="h-4 w-4" />}
            tone="green"
          />
        </OperationalMetricGrid>

        <OperationalPanel>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-md animate-pulse" />
              ))}
            </div>
          ) : (requests?.length ?? 0) === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 py-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-[13px] font-medium text-slate-400">Belum ada permintaan perubahan</p>
            </div>
          ) : (
            <OperationalDataTable
              data={requests as any}
              columns={columns as any}
              getRowId={(row: any) => row.id}
              searchPlaceholder="Cari permintaan..."
            />
          )}
        </OperationalPanel>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-xl border border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-[14px] font-semibold uppercase text-slate-900">Permintaan Perubahan ERP</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 p-5">
            <div className="operational-field">
              <span>Judul</span>
              <OperationalInput
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul perubahan..."
              />
            </div>
            <div className="operational-field">
              <span>Deskripsi</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-28 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] font-medium text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jelaskan perubahan yang diinginkan..."
              />
            </div>
            <div className="operational-field">
              <span>Prioritas</span>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 font-semibold text-[12px] uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="CRITICAL">Kritis</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <OperationalButton variant="ghost" onClick={() => setIsModalOpen(false)}>
              Batal
            </OperationalButton>
            <OperationalButton
              variant="primary"
              onClick={() => createMutation.mutate()}
              disabled={!form.title || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim"}
            </OperationalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
