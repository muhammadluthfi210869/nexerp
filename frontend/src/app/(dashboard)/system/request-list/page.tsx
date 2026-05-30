"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DnaButton, DnaInput } from "@/components/dna";
import { Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RequestListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["change-requests", "all"],
    queryFn: async () => (await api.get("/system/change-requests/all")).data,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      api.patch(`/system/change-request/${id}`, { status }),
    onSuccess: () => {
      toast.success("Status permintaan diperbarui");
      queryClient.invalidateQueries({ queryKey: ["change-requests"] });
    },
  });

  const filtered = requests?.filter((r: any) =>
    !search || r.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell
      title="List"
      titleAccent="Permintaan"
      subtitle="Review & kelola permintaan perubahan dari user"
    >
      <div className="flex gap-4 mb-6">
        <DnaInput
          placeholder="Cari permintaan..."
          icon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="text-[9px] font-black uppercase text-slate-400">Judul</TableHead>
              <TableHead className="text-[9px] font-black uppercase text-slate-400">User</TableHead>
              <TableHead className="text-[9px] font-black uppercase text-slate-400">Prioritas</TableHead>
              <TableHead className="text-[9px] font-black uppercase text-slate-400">Tanggal</TableHead>
              <TableHead className="text-[9px] font-black uppercase text-slate-400 text-center">Status</TableHead>
              <TableHead className="text-[9px] font-black uppercase text-slate-400 text-right pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><div className="h-12 bg-slate-50 rounded animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : !filtered?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                  Belum ada permintaan
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req: any) => (
                <TableRow key={req.id} className="hover:bg-slate-50/30">
                  <TableCell className="font-black text-xs uppercase">{req.title}</TableCell>
                  <TableCell className="text-xs text-slate-500">{req.createdBy || "-"}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                      req.priority === "CRITICAL" ? "bg-rose-100 text-rose-600" :
                      req.priority === "HIGH" ? "bg-orange-100 text-orange-600" :
                      req.priority === "MEDIUM" ? "bg-amber-100 text-amber-600" :
                      "bg-slate-100 text-slate-500"
                    )}>{req.priority || "MEDIUM"}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{req.createdAt}</TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                      req.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" :
                      req.status === "REJECTED" ? "bg-rose-100 text-rose-600" :
                      "bg-amber-100 text-amber-600"
                    )}>{req.status || "PENDING"}</span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <DnaButton
                        variant="danger"
                        size="sm"
                        onClick={() => resolveMutation.mutate({ id: req.id, status: "REJECTED" })}
                        disabled={req.status === "REJECTED" || req.status === "APPROVED"}
                      >
                        <XCircle className="w-3 h-3" />
                      </DnaButton>
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => resolveMutation.mutate({ id: req.id, status: "APPROVED" })}
                        disabled={req.status === "REJECTED" || req.status === "APPROVED"}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                      </DnaButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardShell>
  );
}
