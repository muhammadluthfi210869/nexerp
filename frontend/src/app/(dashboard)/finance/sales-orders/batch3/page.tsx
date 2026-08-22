"use client";

/**
 * BATCH 3 — Sales Order with formula pinning + change control.
 *
 * Frozen-UI principle: this is a NEW page (does NOT modify the existing
 * /finance/sales-orders/page.tsx). It exposes the Batch 3 endpoints:
 *
 *   - GET  /commercial/sales-orders         (list with new fields)
 *   - GET  /commercial/sales-orders/batch3/:id/handoff
 *   - POST /commercial/sales-orders/batch3/:id/commit
 *   - POST /commercial/sales-orders/batch3/:id/amend
 *   - GET  /commercial/sales-orders/batch3/readiness/:leadId/:sampleId
 *
 * The page renders ONLY what the new contract exposes (formula version,
 * commit/amend, amendments). Existing UI remains untouched.
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ShieldCheck, GitCommit, History, Loader2, AlertCircle } from "lucide-react";

interface Batch3Handoff {
  salesOrderId: string;
  orderNumber: string;
  currentVersion: number;
  committedAt: string | null;
  status: string;
  customer: { id: string; clientName: string; brandName?: string };
  sample: { id: string; sampleCode: string };
  formula: { id: string; code: string; version: number } | null;
  quantity: number;
  totalAmount: number;
  items: any[];
  amendmentCount: number;
}

interface ReadinessResult {
  eligible: boolean;
  reason: string;
  message: string;
  pipelines: any[];
}

export default function Batch3SalesOrderPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amendQty, setAmendQty] = useState<string>("");
  const [amendReason, setAmendReason] = useState<string>("");

  // List SOs from the canonical endpoint. We display the new fields
  // that Batch 3 added (formulaId, version, committedAt).
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["b3-sales-orders"],
    queryFn: async () => (await api.get("/commercial/sales-orders")).data,
  });

  const { data: handoff } = useQuery<Batch3Handoff>({
    queryKey: ["b3-handoff", selectedId],
    queryFn: async () =>
      (await api.get(`/commercial/sales-orders/batch3/${selectedId}/handoff`)).data,
    enabled: !!selectedId,
  });

  const commitMut = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/commercial/sales-orders/batch3/${id}/commit`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b3-sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["b3-handoff", selectedId] });
    },
  });

  const amendMut = useMutation({
    mutationFn: async (vars: { id: string; quantity?: number; reason: string }) =>
      (
        await api.post(`/commercial/sales-orders/batch3/${vars.id}/amend`, {
          quantity: vars.quantity ? Number(vars.quantity) : undefined,
          reason: vars.reason,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b3-sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["b3-handoff", selectedId] });
      setAmendQty("");
      setAmendReason("");
    },
  });

  if (isLoading)
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="animate-spin h-5 w-5" /> Loading Batch 3 Sales Orders…
      </div>
    );

  if (error)
    return (
      <div className="p-8 flex items-center gap-2 text-red-500">
        <AlertCircle className="h-5 w-5" />
        Failed to load orders: {String((error as Error).message)}
      </div>
    );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase italic">Batch 3 — Sales Order</h1>
        <p className="text-sm text-slate-500 mt-1">
          Formula pinning + post-commit change control. Frozen-UI: this is a new page, existing
          /finance/sales-orders remains untouched.
        </p>
      </div>

      {/* Order list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Formula Pinned</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Version</th>
              <th className="px-4 py-3 text-center">Committed</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((o: any) => (
              <tr
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className={`border-t border-slate-100 cursor-pointer hover:bg-blue-50/30 ${
                  selectedId === o.id ? "bg-blue-50" : ""
                }`}
              >
                <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                <td className="px-4 py-3">{o.lead?.clientName ?? "—"}</td>
                <td className="px-4 py-3">
                  {o.formulaId ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                      <ShieldCheck className="h-3 w-3" />
                      {o.formulaId.slice(0, 8)}…
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">not pinned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{o.quantity}</td>
                <td className="px-4 py-3 text-right">{Number(o.totalAmount).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs">
                    v{o.version ?? 1}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {o.committedAt ? (
                    <span className="text-emerald-600 font-bold text-xs">YES</span>
                  ) : (
                    <span className="text-amber-600 font-bold text-xs">NO</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs">
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
            {(orders || []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No sales orders yet. Create one via POST /commercial/sales-orders/batch3.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Selected SO detail */}
      {selectedId && handoff && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">{handoff.orderNumber}</h2>
              <p className="text-xs text-slate-500">
                {handoff.customer.clientName} • Sample {handoff.sample.sampleCode}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>
                Version:{" "}
                <span className="font-mono font-bold text-slate-700">v{handoff.currentVersion}</span>
              </div>
              <div>
                Amendments:{" "}
                <span className="font-bold text-slate-700">{handoff.amendmentCount}</span>
              </div>
            </div>
          </div>

          {/* Formula pin */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="h-4 w-4" />
              Formula Pinned (INV-09)
            </div>
            {handoff.formula ? (
              <div className="mt-2 font-mono text-xs text-emerald-900">
                {handoff.formula.code} • version {handoff.formula.version}
                <br />
                <span className="text-slate-500">id: {handoff.formula.id}</span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-amber-700">no formula pinned</div>
            )}
          </div>

          {/* Commit + amend actions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <GitCommit className="h-4 w-4" />
                Commit (pre-commit → locked)
              </div>
              {handoff.committedAt ? (
                <div className="mt-2 text-xs text-emerald-600">
                  Committed at {new Date(handoff.committedAt).toLocaleString()}
                </div>
              ) : (
                <button
                  onClick={() => commitMut.mutate(selectedId)}
                  disabled={commitMut.isPending}
                  className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {commitMut.isPending ? "Committing…" : "Commit"}
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <History className="h-4 w-4" />
                Amend (post-commit change control)
              </div>
              {handoff.committedAt ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="number"
                    placeholder="New quantity"
                    value={amendQty}
                    onChange={(e) => setAmendQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Reason (required for material change)"
                    value={amendReason}
                    onChange={(e) => setAmendReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                  <button
                    onClick={() =>
                      amendMut.mutate({
                        id: selectedId,
                        quantity: amendQty ? Number(amendQty) : undefined,
                        reason: amendReason,
                      })
                    }
                    disabled={amendMut.isPending || !amendQty || !amendReason}
                    className="w-full px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {amendMut.isPending ? "Amending…" : "Amend"}
                  </button>
                </div>
              ) : (
                <div className="mt-2 text-xs text-slate-400">commit first to enable amend</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
