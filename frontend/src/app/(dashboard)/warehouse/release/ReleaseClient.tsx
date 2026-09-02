"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  CheckCircle2,
  Eye,
  AlertCircle,
  Clock,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { StatCard } from "@/components/dna/StatCard";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ReleaseRequest {
  id: string;
  relNumber: string;
  woNumber: string;
  productName: string;
  requester: string;
  date: string;
  status: 'WAITING' | 'RELEASED' | 'PARTIAL';
  itemsCount: number;
  materials: {
    name: string;
    requested: string;
    available: string;
    status: 'OK' | 'SHORTAGE';
  }[];
}

export default function ReleaseClient() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ReleaseRequest | null>(null);
  const [isExecuteOpen, setIsExecuteOpen] = useState(false);
  const [isLogsMode, setIsLogsMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: requests = [] } = useQuery<ReleaseRequest[]>({
    queryKey: ["release-requests"],
    queryFn: () => api.get("/warehouse/release-requests").then(r => r.data),
  });

  const executeMutation = useMutation({
    mutationFn: async (woNumber: string) => {
      const res = await api.post(`/warehouse/release/${woNumber}`, {});
      return res.data;
    },
    onSuccess: () => {
      toast.success("Materials released successfully.");
      queryClient.invalidateQueries({ queryKey: ["release-requests"] });
      setIsExecuteOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Release failed"),
  });

  const pendingCount = requests.filter(r => r.status === 'WAITING').length;
  const shortageCount = requests.filter(r => r.materials.some(m => m.status === 'SHORTAGE')).length;
  const totalAvailable = requests.reduce((s, r) =>
    s + r.materials.reduce((ms, m) => ms + (parseInt(m.available) || 0), 0), 0);
  const factoryAssets = totalAvailable > 1000
    ? `${(totalAvailable / 1000).toFixed(1)}K KG`
    : `${totalAvailable} KG`;

  const handleExecute = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (req) executeMutation.mutate(req.woNumber);
    setIsExecuteOpen(false);
  };

  const filteredRequests = requests.filter(r => {
    const q = searchQuery.toLowerCase();
    return !q || r.relNumber.toLowerCase().includes(q) || r.woNumber.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q);
  });

  const displayRequests = filteredRequests.filter(r => isLogsMode
    ? r.status === 'RELEASED'
    : r.status !== 'RELEASED'
  );

  return (
    <div className="flex flex-col gap-[2rem]">

      {/* 1. KPI CARDS */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard value={`${pendingCount} REQ`} label="Pending Release" />
        <StatCard value={factoryAssets} label="Factory Assets" />
        <StatCard value={shortageCount.toString().padStart(2, '0')} label="Shortage" />
      </div>

      {/* 2. SEARCH & FILTER BAR */}
      <Card className="bg-white border-gray-200 p-4 rounded-[24px] flex gap-4 items-center shadow-sm">
         <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="SEARCH BY RELEASE ID OR WO..."
              className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-[11px] font-black text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <button
           onClick={() => setIsLogsMode(!isLogsMode)}
           className="h-11 px-4 rounded-xl bg-gray-100 border border-gray-200 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-all"
         >
            {isLogsMode ? "QUEUE" : "LOGS"}
         </button>
         <button className="bg-gray-100 border border-gray-200 p-3 rounded-xl text-gray-500 hover:text-gray-900 transition-all">
            <Filter className="w-4 h-4" />
         </button>
      </Card>

      {/* 3. TABLE SECTION */}
      <TableWrapper>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-table-header text-slate-400">REL#</th>
              <th className="px-6 py-4 text-left text-table-header text-slate-400">WO#</th>
              <th className="px-6 py-4 text-left text-table-header text-slate-400">Target Product</th>
              <th className="px-6 py-4 text-left text-table-header text-slate-400">Requester</th>
              <th className="px-6 py-4 text-center text-table-header text-slate-400">Items</th>
              <th className="px-6 py-4 text-left text-table-header text-slate-400">Date</th>
              <th className="px-6 py-4 text-center text-table-header text-slate-400">Status</th>
              <th className="px-6 py-4 text-right text-table-header text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayRequests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-blue-600 tabular">{req.relNumber}</td>
                <td className="px-6 py-4 text-[10px] font-black text-gray-700 tabular">{req.woNumber}</td>
                <td className="px-6 py-4">
                   <p className="text-[11px] font-black text-gray-900">{req.productName}</p>
                </td>
                <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                   {req.requester}
                </td>
                <td className="px-6 py-4 text-center text-[10px] font-black tabular text-slate-500">
                   {req.itemsCount} Items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-slate-400 tabular">
                   {new Date(req.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                </td>
                <td className="px-6 py-4 text-center">
                  <DnaBadge
                    status={req.status === 'RELEASED' ? 'success' : req.status === 'PARTIAL' ? 'info' : 'warning'}
                  >
                    {req.status}
                  </DnaBadge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {req.status === 'WAITING' && (
                      <button
                        onClick={() => { setSelectedRequest(req); setIsExecuteOpen(true); }}
                        className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 flex items-center gap-1.5"
                      >
                         EXECUTE <CheckCircle2 className="w-3 h-3" />
                      </button>
                    )}
                    <button className="p-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 transition-all">
                       <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      {/* 4. EXECUTE DIALOG */}
      <Dialog open={isExecuteOpen} onOpenChange={setIsExecuteOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 rounded-[24px] max-w-2xl p-0 overflow-hidden border-2 shadow-2xl">
           <div className="bg-gray-50 p-8 border-b border-gray-200">
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase mb-1">Execute Material Release</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RELEASE #{selectedRequest?.relNumber} — WO {selectedRequest?.woNumber}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">PRODUCT TARGET</p>
                    <p className="text-[14px] font-black text-gray-900">{selectedRequest?.productName}</p>
                 </div>
              </div>
           </div>

           <div className="p-8 space-y-6">
              <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Material Requirements Checklist</p>
                 <div className="bg-gray-50 rounded-[1.5rem] border border-gray-200 overflow-hidden">
                    <table className="w-full">
                       <thead>
                          <tr className="bg-gray-100 border-b border-gray-200">
                             <th className="px-5 py-3 text-left text-[8px] font-black text-slate-600 uppercase">Material</th>
                             <th className="px-5 py-3 text-right text-[8px] font-black text-slate-600 uppercase">Required</th>
                             <th className="px-5 py-3 text-right text-[8px] font-black text-slate-600 uppercase">Available</th>
                             <th className="px-5 py-3 text-center text-[8px] font-black text-slate-600 uppercase">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200">
                          {selectedRequest?.materials.map((mat, i) => (
                             <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3 text-[10px] font-black text-gray-700">{mat.name}</td>
                                <td className="px-5 py-3 text-right text-[10px] font-black tabular text-gray-900">{mat.requested}</td>
                                <td className="px-5 py-3 text-right text-[10px] font-black tabular text-slate-400">{mat.available}</td>
                                <td className="px-5 py-3 text-center">
                                   {mat.status === 'OK' ? (
                                     <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                   ) : (
                                     <AlertCircle className="w-4 h-4 text-rose-500 mx-auto" />
                                   )}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                       <Layers className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Recommended FEFO Batch</p>
                       <p className="text-[13px] font-black text-white tabular uppercase tracking-tighter">B240420-A <span className="text-slate-500 text-[10px] font-bold ml-2">(EXP: 31/12/24)</span></p>
                    </div>
                 </div>
                   <DnaBadge status="info">BATCH OPTIMIZED</DnaBadge>
              </div>

              <div className="flex gap-4 pt-4">
                 <Button variant="ghost" className="flex-1 rounded-xl h-14 text-gray-500 font-black tracking-widest hover:bg-gray-100" onClick={() => setIsExecuteOpen(false)}>CANCEL</Button>
                 <Button 
                   className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-14 font-black uppercase italic tracking-tighter text-[13px] shadow-2xl shadow-emerald-500/20"
                   onClick={() => selectedRequest && handleExecute(selectedRequest.id)}
                 >
                    CONFIRM & RELEASE MATERIALS
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* 5. RECENT ACTIVITY FOOTER */}
      {!isLogsMode && (
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
                 <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recent Release History</p>
                 <p className="text-[10px] font-bold text-slate-400 italic">"REL-8998 for GLOW SERUM was fully released by J. Doe" — 1h ago</p>
              </div>
           </div>
           <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-2">
              VIEW DISPATCH MANIFESTS <ExternalLink className="w-3 h-3" />
           </button>
        </div>
      )}

    </div>
  );
}
