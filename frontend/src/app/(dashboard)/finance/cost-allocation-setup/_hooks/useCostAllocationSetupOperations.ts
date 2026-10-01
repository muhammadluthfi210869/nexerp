import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { CostAllocationRow } from "../_types/cost-allocation-setup.types";

export function useCostAllocationSetupOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [methodFilter, setMethodFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState<string>("DIRECT");
  const [formBasis, setFormBasis] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState("");

  const {
    data: allocations,
    isLoading,
    isError,
    refetch,
  } = useQuery<CostAllocationRow[]>({
    queryKey: ["finance-cost-allocations"],
    queryFn: async () => {
      const res = await api.get("/finance/cost-allocations");
      const body = unwrapResponse<any>(res);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows.map((a) => ({
        id: a.id,
        allocationDate: a.allocationDate,
        amount: Number(a.amount || 0),
        fromCostCenter: a.fromCostCenter,
        toCostCenter: a.toCostCenter,
        allocationMethod: a.allocationMethod || "DIRECT",
        basis: a.basis ?? null,
        notes: a.notes ?? null,
      }));
    },
  });

  const rows = useMemo(() => {
    const list = allocations ?? [];
    return list
      .filter((r) => methodFilter === "ALL" || r.allocationMethod === methodFilter)
      .sort(
        (a, b) =>
          new Date(b.allocationDate).getTime() - new Date(a.allocationDate).getTime(),
      );
  }, [allocations, methodFilter]);

  const all = allocations ?? [];
  const sourcePools = new Set(all.map((r) => r.fromCostCenter)).size;
  const totalAmount = all.reduce((acc, r) => acc + r.amount, 0);
  const methodCounts = useMemo(() => {
    const map = new Map<string, number>();
    all.forEach((r) => map.set(r.allocationMethod, (map.get(r.allocationMethod) ?? 0) + 1));
    return map;
  }, [all]);
  const dominantMethod =
    [...methodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "â€”";

  const latestAllocationDate = all[0]
    ? new Date(
        Math.max(...all.map((r) => new Date(r.allocationDate).getTime())),
      )
        .toISOString()
        .slice(0, 10)
    : "â€”";

  const resetForm = () => {
    setFormFrom("");
    setFormTo("");
    setFormAmount("");
    setFormMethod("DIRECT");
    setFormBasis("");
    setFormNotes("");
    setFormDate(new Date().toISOString().slice(0, 10));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formAmount);
    if (!formFrom.trim() || !formTo.trim() || !(amount > 0)) {
      toast.error("Validasi Gagal", "Cost center asal, tujuan, dan nominal alokasi wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/finance/cost-allocations", {
        allocationDate: formDate,
        amount,
        fromCostCenter: formFrom.trim(),
        toCostCenter: formTo.trim(),
        allocationMethod: formMethod,
        basis: formBasis.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["finance-cost-allocations"] });
      toast.success("Alokasi Tersimpan", `Alokasi ${formFrom} â†’ ${formTo} berhasil dicatat.`);
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error("Gagal Menyimpan", message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    methodFilter,
    setMethodFilter,
    isCreateOpen,
    setIsCreateOpen,
    isSaving,
    formFrom,
    setFormFrom,
    formTo,
    setFormTo,
    formAmount,
    setFormAmount,
    formMethod,
    setFormMethod,
    formBasis,
    setFormBasis,
    formDate,
    setFormDate,
    formNotes,
    setFormNotes,
    allocations,
    rows,
    all,
    sourcePools,
    totalAmount,
    dominantMethod,
    latestAllocationDate,
    isLoading,
    isError,
    refetch,
    resetForm,
    handleSave,
  };
}
