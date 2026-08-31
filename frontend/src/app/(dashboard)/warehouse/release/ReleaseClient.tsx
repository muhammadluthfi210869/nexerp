"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
 Search,
 CheckCircle2,
 Eye,
 AlertCircle,
 Clock,
 ExternalLink,
 Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
} from "@/components/ui/dialog";
import {
 OperationalDataTable,
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalStatusBadge,
 getOperationalStatusLabel,
} from "@/components/operational";
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

 const columns = React.useMemo(() => [
 { accessorKey: "relNumber", header: "REL#", cell: ({ getValue }: any) => <span className="font-medium text-[13px] tabular-nums">{String(getValue() || "—")}</span> },
 { accessorKey: "woNumber", header: "WO#", cell: ({ getValue }: any) => <span className="font-medium text-[13px] tabular-nums">{String(getValue() || "—")}</span> },
 { accessorKey: "productName", header: "Target Product", cell: ({ getValue }: any) => <span className="font-medium text-[13px]">{String(getValue() || "—")}</span> },
 { accessorKey: "requester", header: "Requester", cell: ({ getValue }: any) => <span className="text-[12px] text-slate-600">{String(getValue() || "—")}</span> },
 { accessorKey: "itemsCount", header: () => <span className="block text-right">Items</span>, cell: ({ getValue }: any) => <span className="block text-right text-[13px] tabular-nums">{String(getValue() ?? "—")}</span> },
 { accessorKey: "date", header: "Date", cell: ({ getValue }: any) => <span className="text-[12px] text-slate-600">{getValue() ? new Date(getValue()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : "—"}</span> },
 { accessorKey: "status", header: () => <span className="block text-center">Status</span>, cell: ({ getValue }: any) => {
 const value = String(getValue());
 const tone = value === 'RELEASED' ? 'success' : value === 'PARTIAL' ? 'process' : 'pending';
 return <div className="flex justify-center"><OperationalStatusBadge status={tone}>{getOperationalStatusLabel(value)}</OperationalStatusBadge></div>;
 } },
 { id: "actions", header: () => <span className="block text-right">Actions</span>, cell: ({ row }: any) => {
 const req = row.original;
 return <div className="flex justify-end gap-2">
 {req.status === 'WAITING' && (
 <button
 type="button"
 onClick={() => { setSelectedRequest(req); setIsExecuteOpen(true); }}
 className="operational-button is-primary"
 >
 <CheckCircle2 className="w-3 h-3" />
 <span>Execute</span>
 </button>
 )}
 <button type="button" className="operational-button is-ghost p-2" aria-label="View">
 <Eye className="w-3.5 h-3.5" />
 </button>
 </div>;
 } },
 ], []);

 return (
 <div className="operational-stack">

 {/* 1. KPI CARDS */}
 <OperationalMetricGrid>
 <OperationalMetricCard label="Pending Release" value={`${pendingCount} REQ`} icon={<Clock />} tone="amber" />
 <OperationalMetricCard label="Factory Assets" value={factoryAssets} icon={<Layers />} tone="blue" />
 <OperationalMetricCard label="Shortage" value={shortageCount.toString().padStart(2, '0')} icon={<AlertCircle />} tone="red" />
 </OperationalMetricGrid>

 {/* 2. SEARCH & FILTER BAR */}
 <div className="operational-panel">
 <div className="flex gap-4 items-center">
 <div className="relative flex-1">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type="text"
 placeholder="Search by release ID or WO..."
 className="operational-input-search w-full"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 <button
 type="button"
 onClick={() => setIsLogsMode(!isLogsMode)}
 className="operational-button is-secondary"
 >
 {isLogsMode ? "Queue" : "Logs"}
 </button>
 </div>
 </div>

 {/* 3. TABLE SECTION */}
 <OperationalDataTable
 data={displayRequests}
 columns={columns}
 getRowId={(row: ReleaseRequest) => row.id}
 searchPlaceholder="Search release requests..."
 />

 {/* 4. EXECUTE DIALOG */}
 <Dialog open={isExecuteOpen} onOpenChange={setIsExecuteOpen}>
 <DialogContent className="bg-white text-gray-900 rounded-2xl max-w-2xl p-0 overflow-hidden border border-slate-200">
 <div className="bg-slate-50 p-8 border-b border-slate-200">
 <div className="flex justify-between items-start">
 <div>
 <h2 className="text-xl font-semibold mb-1">Execute Material Release</h2>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Release #{selectedRequest?.relNumber || "—"} — WO {selectedRequest?.woNumber || "—"}</p>
 </div>
 <div className="text-right">
 <p className="text-[9px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Product Target</p>
 <p className="text-[14px] font-semibold text-gray-900">{selectedRequest?.productName || "—"}</p>
 </div>
 </div>
 </div>

 <div className="p-8 space-y-6">
 <div className="space-y-3">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material Requirements Checklist</p>
 <div className="operational-panel overflow-hidden p-0">
 <table className="w-full">
 <thead>
 <tr className="bg-slate-100 border-b border-slate-200">
 <th className="px-5 py-3 text-left text-[8px] font-bold text-slate-600 uppercase">Material</th>
 <th className="px-5 py-3 text-right text-[8px] font-bold text-slate-600 uppercase">Required</th>
 <th className="px-5 py-3 text-right text-[8px] font-bold text-slate-600 uppercase">Available</th>
 <th className="px-5 py-3 text-center text-[8px] font-bold text-slate-600 uppercase">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {selectedRequest?.materials.map((mat, i) => (
 <tr key={i} className="hover:bg-slate-50 transition-colors">
 <td className="px-5 py-3 text-[10px] font-bold text-gray-700">{mat.name || "—"}</td>
 <td className="px-5 py-3 text-right text-[10px] font-medium tabular text-gray-900">{mat.requested || "—"}</td>
 <td className="px-5 py-3 text-right text-[10px] font-bold tabular text-slate-400">{mat.available || "—"}</td>
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
 <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Recommended FEFO Batch</p>
 <p className="text-[13px] font-bold text-gray-900 tabular uppercase tracking-tighter">B240420-A <span className="text-slate-500 text-[10px] font-bold ml-2">(EXP: 31/12/24)</span></p>
 </div>
 </div>
 <OperationalStatusBadge status="process">Batch Optimized</OperationalStatusBadge>
 </div>

 <div className="flex gap-4 pt-4">
 <button type="button" className="operational-button is-secondary flex-1" onClick={() => setIsExecuteOpen(false)}>Cancel</button>
 <button
 type="button"
 className="operational-button is-primary flex-1"
 onClick={() => selectedRequest && handleExecute(selectedRequest.id)}
 >
 Confirm & Release Materials
 </button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 {/* 5. RECENT ACTIVITY FOOTER */}
 {!isLogsMode && (
 <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
 <Clock className="w-4 h-4 text-slate-400" />
 </div>
 <div>
 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Recent Release History</p>
 <p className="text-[10px] font-bold text-slate-400 italic">&ldquo;REL-8998 for GLOW SERUM was fully released by J. Doe&rdquo; — 1h ago</p>
 </div>
 </div>
 <button type="button" className="text-[9px] font-bold text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-2">
 View Dispatch Manifests <ExternalLink className="w-3 h-3" />
 </button>
 </div>
 )}

 </div>
 );
}
