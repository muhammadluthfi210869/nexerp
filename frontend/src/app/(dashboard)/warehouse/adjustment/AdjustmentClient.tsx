"use client";

import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  History,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/dna/StatCard";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Adjustment {
  id: string;
  adjNumber: string;
  materialName: string;
  type: 'WRITE_OFF' | 'CORRECTION' | 'DISPOSAL';
  qty: number;
  unit: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  warehouseName: string;
  date: string;
}

export default function AdjustmentClient() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['adjustments'],
    queryFn: async () => {
      const res = await api.get('/warehouse/adjustments');
      return (res.data || []) as Adjustment[];
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['finance-accounts'],
    queryFn: async () => {
      const res = await api.get('/finance/accounts');
      return res.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      materialId: string;
      type: string;
      qty: number;
      warehouseId: string;
      accountId?: string;
      notes?: string;
    }) => {
      const res = await api.post('/warehouse/adjustments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      setIsNewAdjOpen(false);
      setFormMaterialId("");
      setFormType("");
      setFormQty("");
      setFormWarehouseId("");
      setFormAccountId("");
      setFormNotes("");
      toast.success("Adjustment submitted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create adjustment");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.post(`/warehouse/adjustments/${id}/approve`, { status, userId: "system" });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      toast.success(`Adjustment ${variables.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update adjustment");
    },
  });

  const pendingCount = adjustments.filter((a: Adjustment) => a.status === 'PENDING').length;
  const completedCount = adjustments.filter((a: Adjustment) => a.status !== 'PENDING').length;

  const filteredAdjustments = adjustments.filter((a: Adjustment) => {
    const matchesSearch = a.materialName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || a.type === filterType;
    const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-[2rem]">
      {/* 1. KPI CARDS */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard value={adjustments.length} label="Total Adjustment" change={`${adjustments.length} entries`} variant="neutral" />
        <StatCard value={pendingCount} label="Pending Appr" variant="warning" />
        <StatCard value={completedCount} label="Completed" variant="success" />
      </div>

      {/* 2. FILTER BAR */}
      <div className="bg-white border border-slate-200 p-4 rounded-[24px] flex gap-4 items-center shadow-sm">
         <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="SEARCH MATERIAL..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-[11px] font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all placeholder:text-slate-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
          <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
             <SelectTrigger className="w-40 bg-slate-50 border-slate-200 rounded-xl h-[46px] text-[10px] font-black uppercase tracking-widest">
                <SelectValue placeholder="TYPE" />
             </SelectTrigger>
             <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="ALL">ALL TYPES</SelectItem>
                <SelectItem value="WRITE_OFF">WRITE OFF</SelectItem>
                <SelectItem value="CORRECTION">CORRECTION</SelectItem>
                <SelectItem value="DISPOSAL">DISPOSAL</SelectItem>
             </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
            <SelectTrigger className="w-40 bg-slate-50 border-slate-200 rounded-xl h-[46px] text-[10px] font-black uppercase tracking-widest">
               <SelectValue placeholder="STATUS" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
               <SelectItem value="ALL">ALL STATUS</SelectItem>
               <SelectItem value="PENDING">PENDING</SelectItem>
               <SelectItem value="APPROVED">APPROVED</SelectItem>
               <SelectItem value="REJECTED">REJECTED</SelectItem>
            </SelectContent>
         </Select>
      </div>

      {/* 3. TABLE SECTION */}
      <TableWrapper>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-table-header text-slate-400">#ADJ</th>
              <th className="px-6 py-4 text-left text-table-header text-slate-400">Material</th>
              <th className="px-6 py-4 text-left text-table-header text-slate-400">Type</th>
              <th className="px-6 py-4 text-right text-table-header text-slate-400">Qty</th>
              <th className="px-6 py-4 text-center text-table-header text-slate-400">Status</th>
              <th className="px-6 py-4 text-left text-table-header text-slate-400">Date</th>
              <th className="px-6 py-4 text-right text-table-header text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredAdjustments.map((adj) => (
              <tr key={adj.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-[11px] font-black text-blue-600 tabular">{adj.adjNumber}</td>
                <td className="px-6 py-4">
                   <p className="text-[13px] font-semibold text-slate-900">{adj.materialName}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{adj.warehouseName}</p>
                </td>
                <td className="px-6 py-4">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{adj.type.replace('_', ' ')}</span>
                </td>
                <td className={cn(
                  "px-6 py-4 text-right text-[11px] font-black tabular",
                  adj.qty < 0 ? "text-rose-500" : "text-emerald-500"
                )}>
                   {adj.qty > 0 ? `+${adj.qty}` : adj.qty} {adj.unit}
                </td>
                <td className="px-6 py-4 text-center">
                  <DnaBadge
                    variant={adj.status === 'APPROVED' ? 'success' : adj.status === 'REJECTED' ? 'critical' : 'warning'}
                  >
                    {adj.status}
                  </DnaBadge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-slate-400">
                   {new Date(adj.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                </td>
                <td className="px-6 py-4 text-right">
                  {adj.status === 'PENDING' ? (
                    <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approveMutation.mutate({ id: adj.id, status: 'APPROVED' })}
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                          disabled={approveMutation.isPending}
                        >
                           <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => approveMutation.mutate({ id: adj.id, status: 'REJECTED' })}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                          disabled={approveMutation.isPending}
                        >
                           <XCircle className="w-3.5 h-3.5" />
                        </button>
                    </div>
                  ) : (
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                          <ChevronRight className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAdjustments.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center gap-4">
             <AlertCircle className="w-12 h-12 text-slate-300" />
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No adjustments found matching filters</p>
          </div>
        )}
      </TableWrapper>

      {/* 5. RECENT ACTIVITY FOOTER */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
               <History className="w-4 h-4 text-slate-400" />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recent Activity Log</p>
               <p className="text-[10px] font-bold text-slate-400 italic">"Adjustment ADJ-24002 was approved by Supervisor B." — 2h ago</p>
            </div>
         </div>
         <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-2">
            VIEW FULL AUDIT TRAIL <ChevronRight className="w-3 h-3" />
         </button>
      </div>

    </div>
  );
}
