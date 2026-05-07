"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  PackageCheck, 
  AlertTriangle, 
  Truck, 
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Box
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div className="p-8 bg-base min-h-screen space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <PackageCheck className="w-8 h-8 text-emerald-600" />
            WAREHOUSE COMMAND CENTER
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Phase 1: Demand-Supply Signal Orchestration
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-none shadow-sm rounded-3xl flex items-center gap-4">
           <div className="p-4 bg-amber-50 rounded-2xl">
              <ClipboardList className="w-6 h-6 text-amber-600" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Pending Requests</p>
              <p className="text-2xl font-black text-slate-900">{requisitions?.filter((r:any) => r.status === 'PENDING').length || 0}</p>
           </div>
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm rounded-3xl flex items-center gap-4">
           <div className="p-4 bg-rose-50 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Material Shortages</p>
              <p className="text-2xl font-black text-rose-600">{requisitions?.filter((r:any) => r.status === 'SHORTAGE').length || 0}</p>
           </div>
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm rounded-3xl flex items-center gap-4">
           <div className="p-4 bg-emerald-50 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Total Issued (MTD)</p>
              <p className="text-2xl font-black text-emerald-600">{requisitions?.filter((r:any) => r.status === 'ISSUED').length || 0}</p>
           </div>
        </Card>
      </div>

      {/* REQUISITION LIST */}
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search batch or material..." className="pl-10 w-80 rounded-xl border-slate-200" />
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 text-[10px] font-black uppercase gap-2">
                <Filter className="w-3 h-3" /> Filter Status
              </Button>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Live Signal Active</span>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-tight">
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
                     <Badge variant="outline" className="text-[8px] border-slate-100 text-slate-400 font-black">RAW_MATERIAL</Badge>
                  </td>
                  <td className="p-6 text-center">
                     <p className="font-black text-slate-900">{req.qty_requested} <span className="text-[10px] text-slate-400 font-bold uppercase">{req.material?.unit || "KG"}</span></p>
                  </td>
                  <td className="p-6 text-center">
                    <Badge className={cn(
                      "font-black text-[9px] uppercase tracking-tight px-3 py-1 rounded-full",
                      req.status === 'PENDING' ? "bg-amber-100 text-amber-600" :
                      req.status === 'ISSUED' ? "bg-emerald-100 text-emerald-600" :
                      req.status === 'SHORTAGE' ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"
                    )}>
                      {req.status}
                    </Badge>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                       {req.status === 'PENDING' && (
                         <>
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="rounded-xl border-rose-100 text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase"
                             onClick={() => shortageMutation.mutate(req.id)}
                             disabled={shortageMutation.isPending}
                           >
                             <AlertTriangle className="w-3 h-3 mr-1" /> Shortage
                           </Button>
                           <Button 
                             size="sm" 
                             className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase shadow-lg shadow-blue-100"
                             onClick={() => issueMutation.mutate(req.id)}
                             disabled={issueMutation.isPending}
                           >
                             <Truck className="w-3 h-3 mr-1" /> Issue Materials
                           </Button>
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
      </Card>
    </div>
  );
}

