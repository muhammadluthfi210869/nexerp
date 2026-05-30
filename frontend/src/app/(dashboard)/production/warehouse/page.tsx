"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  AlertTriangle, 
  Truck, 
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Box
} from "lucide-react";
import { StatCard, TableWrapper, DnaBadge, DnaButton, DnaInput } from "@/components/dna";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function WarehouseControlPage() {
  const queryClient = useQueryClient();

  const { data: requisitions, isLoading } = useQuery({
    queryKey: ["allRequisitions"],
    queryFn: async () => (await api.get("/production/requisitions")).data,
    refetchInterval: 10000
  });

  const issueMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/production/requisitions/${id}/issue`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allRequisitions"] });
      toast.success("Material Issued Successfully");
    }
  });

  const shortageMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/production/requisitions/${id}/shortage`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allRequisitions"] });
      toast.error("Shortage Escalated to SCM");
    }
  });

  return (
    <DashboardShell
      title="WAREHOUSE"
      titleAccent="COMMAND CENTER"
      subtitle="Phase 1: Demand-Supply Signal Orchestration"
    >

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Pending Requests"
          value={requisitions?.filter((r:any) => r.status === 'PENDING').length || 0}
          icon={<ClipboardList className="w-6 h-6 text-amber-600" />}
        />
        <StatCard
          label="Material Shortages"
          value={requisitions?.filter((r:any) => r.status === 'SHORTAGE').length || 0}
          icon={<AlertTriangle className="w-6 h-6 text-rose-600" />}
        />
        <StatCard
          label="Total Issued (MTD)"
          value={requisitions?.filter((r:any) => r.status === 'ISSUED').length || 0}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
        />
      </div>

      {/* REQUISITION LIST */}
      <TableWrapper
        filters={
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <DnaInput icon={<Search className="w-4 h-4" />} placeholder="Search batch or material..." className="w-80" />
              <DnaButton variant="outline" size="sm" icon={<Filter className="w-3 h-3" />}>
                Filter Status
              </DnaButton>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Live Signal Active</span>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/30 text-table-header text-slate-400 uppercase tracking-tight">
                <th className="p-6 text-left">Batch No</th>
                <th className="p-6 text-left">Brand & Product</th>
                <th className="p-6 text-left">Material Required</th>
                <th className="p-6 text-center">Req Qty</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                 <tr>
                    <td colSpan={6} className="p-20 text-center font-black text-slate-300 italic">Syncing inventory signals...</td>
                 </tr>
              ) : requisitions?.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="p-20 text-center">
                       <Box className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                       <p className="font-black text-slate-300 italic">No active requisitions from production.</p>
                    </td>
                 </tr>
              ) : requisitions.map((req: any) => (
                <tr key={req.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900">{req.reqNumber}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">WO: {req.workOrder?.woNumber || "UNLINKED"}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="font-black text-blue-600 uppercase text-xs">{req.workOrder?.lead?.brandName || "Nex"}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{req.workOrder?.lead?.productInterest || "PRIVATE LABEL"}</p>
                  </td>
                  <td className="p-6">
                     <p className="font-black text-slate-900 text-xs uppercase">{req.material?.name || "BASE COMPOUND"}</p>
                      <DnaBadge status="default" className="text-[8px]">RAW_MATERIAL</DnaBadge>
                  </td>
                  <td className="p-6 text-center">
                     <p className="font-black text-slate-900">{req.qty_requested} <span className="text-[10px] text-slate-400 font-bold uppercase">{req.material?.unit || "KG"}</span></p>
                  </td>
                  <td className="p-6 text-center">
                    <DnaBadge
                      status={req.status === 'PENDING' ? 'warning' : req.status === 'ISSUED' ? 'success' : req.status === 'SHORTAGE' ? 'critical' : 'default'}
                    >
                      {req.status}
                    </DnaBadge>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                        {req.status === 'PENDING' && (
                          <>
                            <DnaButton
                              variant="danger"
                              size="sm"
                              icon={<AlertTriangle className="w-3 h-3" />}
                              onClick={() => shortageMutation.mutate(req.id)}
                              disabled={shortageMutation.isPending}
                            >
                              Shortage
                            </DnaButton>
                            <DnaButton
                              variant="primary"
                              size="sm"
                              icon={<Truck className="w-3 h-3" />}
                              onClick={() => issueMutation.mutate(req.id)}
                              disabled={issueMutation.isPending}
                            >
                              Issue Materials
                            </DnaButton>
                          </>
                        )}
                       {req.status === 'ISSUED' && (
                         <div className="text-emerald-500 flex items-center gap-1 font-black text-[10px] uppercase">
                            <CheckCircle2 className="w-4 h-4" /> Released
                         </div>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableWrapper>
    </DashboardShell>
  );
}

