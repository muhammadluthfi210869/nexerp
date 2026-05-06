"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  Filter, 
  ArrowLeft, 
  CheckCircle2, 
  Truck,
  Activity,
  Eye,
  Zap,
  ClipboardList,
  AlertCircle,
  Clock,
  ExternalLink,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <button className="hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-widest">Warehouse / Release</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
             Material Release
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
        </div>

        <div className="flex gap-3">
           <Button 
             variant="outline" 
             onClick={() => setIsLogsMode(!isLogsMode)}
             className="bg-slate-800/40 border-slate-700 rounded-2xl px-6 h-11 font-black uppercase tracking-tighter text-[11px] text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
           >
              <ClipboardList className="w-4 h-4 mr-2" /> {isLogsMode ? "BACK TO QUEUE" : "RELEASE LOGS"}
           </Button>
           <Button className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl px-6 h-11 font-black uppercase tracking-tighter text-[11px] shadow-xl shadow-emerald-500/10 border-0">
              <Zap className="w-4 h-4 mr-2" /> BATCH RELEASE
           </Button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[
          { label: "PENDING RELEASE", val: `${pendingCount} REQ`, icon: Activity, color: "text-amber-400" },
          { label: "FACTORY ASST", val: factoryAssets, icon: Truck, color: "text-blue-400" },
          { label: "SHORTAGE", val: shortageCount.toString().padStart(2, '0'), icon: AlertCircle, color: shortageCount > 0 ? "text-rose-400" : "text-emerald-400" },
        ].map((card, i) => (
          <Card key={i} className="bg-slate-800/60 backdrop-blur border-slate-700/30 p-6 rounded-[2.5rem] flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-4xl font-black tracking-tighter tabular text-white">{card.val}</p>
            </div>
            <div className={cn("p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50", card.color)}>
               <card.icon className="w-6 h-6" />
            </div>
          </Card>
        ))}
      </div>

      {/* 3. SEARCH BAR */}
      <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 p-4 rounded-[1.5rem] mb-6 flex gap-4 items-center shadow-inner shadow-slate-900/20">
         <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH BY RELEASE ID OR WO..." 
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-[11px] font-black text-white focus:outline-none focus:ring-1 focus:ring-slate-500 transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <button className="bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl text-slate-400 hover:text-white transition-all">
            <Filter className="w-4 h-4" />
         </button>
      </Card>

      {/* 4. TABLE SECTION */}
      <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 rounded-[2rem] overflow-hidden shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900/40 border-b border-slate-700/50">
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">REL#</th>
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">WO#</th>
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Product</th>
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Requester</th>
              <th className="px-6 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Items</th>
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {displayRequests.map((req) => (
              <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-blue-400 tabular">{req.relNumber}</td>
                <td className="px-6 py-4 text-[10px] font-black text-slate-300 tabular">{req.woNumber}</td>
                <td className="px-6 py-4">
                   <p className="text-[11px] font-black text-white">{req.productName}</p>
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
                   <span className={cn(
                     "px-2 py-0.5 rounded text-[6.5px] font-black uppercase tracking-widest border",
                     req.status === 'WAITING' ? "bg-amber-500/20 text-amber-500 border-amber-500/30" :
                     req.status === 'RELEASED' ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" :
                     "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                   )}>
                     {req.status}
                   </span>
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
                    <button className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all">
                       <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 5. EXECUTE DIALOG */}
      <Dialog open={isExecuteOpen} onOpenChange={setIsExecuteOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2.5rem] max-w-2xl p-0 overflow-hidden border-2 shadow-2xl">
           <div className="bg-slate-800/50 p-8 border-b border-slate-700/50">
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase mb-1">Execute Material Release</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RELEASE #{selectedRequest?.relNumber} — WO {selectedRequest?.woNumber}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">PRODUCT TARGET</p>
                    <p className="text-[14px] font-black text-white">{selectedRequest?.productName}</p>
                 </div>
              </div>
           </div>

           <div className="p-8 space-y-6">
              <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Material Requirements Checklist</p>
                 <div className="bg-slate-950/50 rounded-[1.5rem] border border-slate-800 overflow-hidden">
                    <table className="w-full">
                       <thead>
                          <tr className="bg-slate-900 border-b border-slate-800">
                             <th className="px-5 py-3 text-left text-[8px] font-black text-slate-600 uppercase">Material</th>
                             <th className="px-5 py-3 text-right text-[8px] font-black text-slate-600 uppercase">Required</th>
                             <th className="px-5 py-3 text-right text-[8px] font-black text-slate-600 uppercase">Available</th>
                             <th className="px-5 py-3 text-center text-[8px] font-black text-slate-600 uppercase">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800">
                          {selectedRequest?.materials.map((mat, i) => (
                             <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-5 py-3 text-[10px] font-black text-slate-300">{mat.name}</td>
                                <td className="px-5 py-3 text-right text-[10px] font-black tabular text-white">{mat.requested}</td>
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
                 <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[7px] font-black tracking-[0.2em]">BATCH OPTIMIZED</Badge>
              </div>

              <div className="flex gap-4 pt-4">
                 <Button variant="ghost" className="flex-1 rounded-xl h-14 text-slate-500 font-black tracking-widest hover:bg-slate-800" onClick={() => setIsExecuteOpen(false)}>CANCEL</Button>
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

      {/* 6. RECENT ACTIVITY FOOTER */}
      {!isLogsMode && (
        <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
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
