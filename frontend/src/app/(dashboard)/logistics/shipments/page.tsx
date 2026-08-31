"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Truck,
  Search,
  ClipboardList,
  Box as BoxIcon,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  OperationalButton,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";

// Backend canonical statuses (ShipStatus enum):
//   PACKING → SHIPPED → DELIVERED.
// SHIPPED transition is atomic (Pre-R4 verified: shipments.service.ts
// transactional conditional updateMany). The frontend NEVER recreates
// stock logic — it only invokes canonical API and renders truth.

const STATUS_TONE: Record<string, "neutral" | "pending" | "process" | "success" | "danger"> = {
  PACKING: "pending",
  SHIPPED: "process",
  DELIVERED: "success",
  RETURNED: "danger",
};

export default function ShipmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: shipments = [], isLoading } = useQuery<any[]>({
    queryKey: ["shipments"],
    queryFn: async () => (await api.get("/fulfillment/shipments")).data,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/fulfillment/shipments/${id}/status`, { status }),
    onSuccess: (_data, vars) => {
      toast.success(`Shipment ${vars.id.slice(0, 8)} → ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      // Stock truth may have changed; refetch finished goods too.
      queryClient.invalidateQueries({ queryKey: ["finished-goods"] });
    },
    onError: (err: any, vars) => {
      toast.error(
        err.response?.data?.message ||
          `Gagal update shipment ${vars.id.slice(0, 8)} → ${vars.status}`,
      );
    },
  });

  const filtered = shipments.filter((s: any) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return (
      (s.trackingNo ?? "").toLowerCase().includes(t) ||
      (s.so?.orderNumber ?? s.soId ?? "").toString().toLowerCase().includes(t) ||
      (s.so?.lead?.name ?? "").toLowerCase().includes(t)
    );
  });

  const packingCount = shipments.filter((s) => s.status === "PACKING").length;
  const shippedCount = shipments.filter((s) => s.status === "SHIPPED").length;
  const deliveredCount = shipments.filter((s) => s.status === "DELIVERED").length;

  const detail = detailId
    ? shipments.find((s: any) => s.id === detailId)
    : null;

  return (
    <OperationalPageShell
      title="Shipment Workspace"
      subtitle="Logistik · Delivery"
    >
      <OperationalMetricGrid>
        <OperationalMetricCard
          label="Sedang Dipacking"
          value={packingCount}
          icon={<BoxIcon className="h-5 w-5 text-amber-500" />}
        />
        <OperationalMetricCard
          label="Dalam Pengiriman"
          value={shippedCount}
          icon={<Truck className="h-5 w-5 text-blue-500" />}
        />
        <OperationalMetricCard
          label="Terkirim"
          value={deliveredCount}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
      </OperationalMetricGrid>

      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {filtered.length} shipment{filtered.length === 1 ? "" : "s"}
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tracking / SO / customer..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] font-medium text-slate-700 focus:border-blue-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <OperationalPanel>
        <div className="px-4 py-3 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Daftar Pengiriman
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 p-6 text-[11px] font-bold uppercase text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <ClipboardList className="h-10 w-10 text-slate-200" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Belum ada shipment
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              Shipment dibuat otomatis dari Delivery Order yang siap kirim.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase text-slate-500">Tracking</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase text-slate-500">SO / Customer</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase text-slate-500">Items</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s: any) => (
                <tr key={s.id} className="bg-white hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-[11px] font-bold text-slate-900">
                      {s.trackingNo ?? s.id.slice(0, 8)}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400">
                      {new Date(s.createdAt ?? Date.now()).toLocaleDateString("id-ID")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-medium text-slate-900">
                      {s.so?.orderNumber ?? s.soId?.slice(0, 8) ?? "—"}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">
                      {s.so?.lead?.name ?? s.logistics?.fullName ?? ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
                      {s.items?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <OperationalStatusBadge status={STATUS_TONE[s.status] ?? "neutral"}>
                      {getOperationalStatusLabel(s.status)}
                    </OperationalStatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <OperationalButton
                        variant="ghost"
                        onClick={() => setDetailId(s.id)}
                      >
                        Detail
                      </OperationalButton>
                      {s.status === "PACKING" && (
                        <OperationalButton
                          variant="primary"
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({ id: s.id, status: "SHIPPED" })
                          }
                        >
                          Kirim
                        </OperationalButton>
                      )}
                      {s.status === "SHIPPED" && (
                        <OperationalButton
                          variant="primary"
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({ id: s.id, status: "DELIVERED" })
                          }
                        >
                          Tandai Terkirim
                        </OperationalButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </OperationalPanel>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden">
          <DialogHeader className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">
              Detail Shipment
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium uppercase text-[9px] tracking-widest">
              {detail?.trackingNo ?? detail?.id?.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 p-6">
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <p className="font-bold uppercase text-[9px] tracking-widest text-slate-400">SO</p>
                  <p className="font-medium text-slate-900">
                    {detail.so?.orderNumber ?? detail.soId ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="font-bold uppercase text-[9px] tracking-widest text-slate-400">Status</p>
                  <OperationalStatusBadge status={STATUS_TONE[detail.status] ?? "neutral"}>
                    {getOperationalStatusLabel(detail.status)}
                  </OperationalStatusBadge>
                </div>
                <div>
                  <p className="font-bold uppercase text-[9px] tracking-widest text-slate-400">Logistik</p>
                  <p className="font-medium text-slate-900">{detail.logistics?.fullName ?? "—"}</p>
                </div>
                <div>
                  <p className="font-bold uppercase text-[9px] tracking-widest text-slate-400">Tracking</p>
                  <p className="font-mono text-[10px] font-bold text-slate-900">
                    {detail.trackingNo ?? "—"}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-bold uppercase text-[9px] tracking-widest text-slate-400">Items</p>
                <ul className="mt-1 space-y-1">
                  {(detail.items ?? []).map((it: any) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between rounded bg-slate-50 px-3 py-1.5 text-[11px]"
                    >
                      <span className="font-mono text-slate-700">
                        {it.materialId?.slice(0, 8) ?? it.material?.name ?? "item"}
                      </span>
                      <span className="font-black tabular-nums text-slate-900">
                        {it.qtyShipped}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter className="p-6 pt-0 flex justify-end gap-2">
            <OperationalButton variant="ghost" onClick={() => setDetailId(null)}>
              Tutup
            </OperationalButton>
            {detail?.status === "PACKING" && (
              <OperationalButton
                variant="primary"
                disabled={updateStatusMutation.isPending}
                onClick={() =>
                  updateStatusMutation.mutate({ id: detail.id, status: "SHIPPED" })
                }
              >
                Kirim Sekarang
              </OperationalButton>
            )}
            {detail?.status === "SHIPPED" && (
              <OperationalButton
                variant="primary"
                disabled={updateStatusMutation.isPending}
                onClick={() =>
                  updateStatusMutation.mutate({ id: detail.id, status: "DELIVERED" })
                }
              >
                Tandai Terkirim
              </OperationalButton>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}