"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaButton, DnaInput } from "@/components/dna";
import {
  Plus, Loader2, FileText, CheckCircle2, XCircle, Clock, AlertCircle
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  return (
    <DashboardShell
      title="Permintaan"
      titleAccent="Perubahan"
      subtitle="Ajukan perubahan & pengembangan fitur ERP"
      actions={
        <DnaButton onClick={() => setIsModalOpen(true)} icon={<Plus />} variant="primary">
          Ajukan Perubahan
        </DnaButton>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
          ))
        ) : !requests?.length ? (
          <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-400">Belum ada permintaan perubahan</p>
          </div>
        ) : (
          requests.map((req: any) => (
            <div key={req.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <FileText className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-black text-sm uppercase">{req.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{req.description}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{req.createdAt}</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                        req.status === "DONE" ? "bg-emerald-100 text-emerald-600" :
                        req.status === "REJECTED" ? "bg-rose-100 text-rose-600" :
                        "bg-amber-100 text-amber-600"
                      )}>{req.status || "PENDING"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-sm">Permintaan Perubahan ERP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Judul</label>
              <DnaInput
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul perubahan..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full h-28 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs"
                placeholder="Jelaskan perubahan yang diinginkan..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Prioritas</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-black text-xs uppercase"
              >
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="CRITICAL">Kritis</option>
              </select>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100">
            <DnaButton variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => createMutation.mutate()}
              disabled={!form.title || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Kirim"}
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
