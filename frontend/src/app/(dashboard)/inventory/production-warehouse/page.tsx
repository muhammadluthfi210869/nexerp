"use client";

import React, { useState } from "react";
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
import {
  DnaStatCard,
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaCell,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";

// SPEC: SCR-PROD-WH-001 — Warehouse Command Center for Production Material Requisition

export default function WarehouseControlPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredRequisitions = searchTerm 
    ? requisitions?.filter((r: any) => 
        r.reqNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.workOrder?.woNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.workOrder?.lead?.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : requisitions;

  return (
    <DashboardShell
      title="WAREHOUSE"
      titleAccent="COMMAND CENTER"
      subtitle="Phase 1: Demand-Supply Signal Orchestration"
    >

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DnaStatCard
          label="Pending Requests"
          value={requisitions?.filter((r:any) => r.status === 'PENDING').length || 0}
          icon={<ClipboardList />}
          variant="amber"
        />
        <DnaStatCard
          label="Material Shortages"
          value={requisitions?.filter((r:any) => r.status === 'SHORTAGE').length || 0}
          icon={<AlertTriangle />}
          variant="rose"
        />
        <DnaStatCard
          label="Total Issued (MTD)"
          value={requisitions?.filter((r:any) => r.status === 'ISSUED').length || 0}
          icon={<CheckCircle2 />}
          variant="emerald"
        />
      </div>

      {/* REQUISITION LIST */}
      <DnaDataTableCard
        customToolbar={
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-4">
              <DnaInput
                icon={<Search className="w-4 h-4" />}
                placeholder="Search batch or material..."
                className="w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <DnaButton variant="outline" size="sm" icon={<Filter className="w-3 h-3" />}>
                Filter Status
              </DnaButton>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Live Signal Active</span>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full">
            <DnaTableHead>
              <DnaTableRow className="bg-slate-50/50 text-table-header text-slate-400 uppercase tracking-tight">
                <DnaTh className="p-4 text-left">Batch No</DnaTh>
                <DnaTh className="p-4 text-left">Brand & Product</DnaTh>
                <DnaTh className="p-4 text-left">Material Required</DnaTh>
                <DnaTh className="p-4 text-center">Req Qty</DnaTh>
                <DnaTh className="p-4 text-center">Status</DnaTh>
                <DnaTh className="p-4 text-right">Actions</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody className="divide-y divide-slate-100">
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="p-16 text-center font-bold text-slate-400 italic">Syncing inventory signals...</DnaTd>
                </DnaTableRow>
              ) : filteredRequisitions?.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="p-16 text-center">
                    <Box className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                    <p className="font-bold text-slate-400 italic">
                      {searchTerm ? "No matching requisitions found." : "No active requisitions from production."}
                    </p>
                  </DnaTd>
                </DnaTableRow>
              ) : filteredRequisitions.map((req: any) => (
                <DnaTableRow key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                  <DnaTd className="p-4">
                    <DnaCell.NaturalPair
                      primary={req.reqNumber}
                      secondary={`WO: ${req.workOrder?.woNumber || "UNLINKED"}`}
                    />
                  </DnaTd>
                  <DnaTd className="p-4">
                    <DnaCell.NaturalPair
                      primary={req.workOrder?.lead?.brandName || "Nex"}
                      secondary={req.workOrder?.lead?.productInterest || "PRIVATE LABEL"}
                    />
                  </DnaTd>
                  <DnaTd className="p-4">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-xs uppercase">{req.material?.name || "BASE COMPOUND"}</p>
                      <DnaBadge variant="default" className="text-[8px]">RAW_MATERIAL</DnaBadge>
                    </div>
                  </DnaTd>
                  <DnaTd className="p-4 text-center">
                    <p className="font-bold text-slate-900 tabular-nums">{req.qty_requested} <span className="text-[10px] text-slate-400 font-bold uppercase">{req.material?.unit || "KG"}</span></p>
                  </DnaTd>
                  <DnaTd className="p-4 text-center">
                    <DnaBadge
                      variant={req.status === 'PENDING' ? 'warning' : req.status === 'ISSUED' ? 'success' : req.status === 'SHORTAGE' ? 'critical' : 'default'}
                    >
                      {req.status}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {req.status === 'PENDING' && (
                        <>
                          <DnaButton
                            variant="critical"
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
                        <div className="text-emerald-500 flex items-center gap-1 font-bold text-[10px] uppercase">
                          <CheckCircle2 className="w-4 h-4" /> Released
                        </div>
                      )}
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DashboardShell>
  );
}

