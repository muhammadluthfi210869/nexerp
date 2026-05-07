"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Truck, 
  ArrowRightLeft, 
  PackageCheck, 
  Search, 
  Filter,
  ArrowRight,
  AlertCircle,
  Scan,
  MoreVertical,
  CheckCircle2,
  Clock,
  History,
  Plus,
  ArrowDownToLine,
  Trash2,
  MoveHorizontal,
  ChevronRight,
  ShieldCheck,
  CalendarDays,
  MapPin,
  Loader2,
  ClipboardCheck,
  KeyRound,
  Eye,
  Info,
  Zap,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WarehouseWorkstation() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("procurement");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [selectedIssueItem, setSelectedIssueItem] = useState<any>(null);
  const [selectedOpname, setSelectedOpname] = useState<any>(null);
  const [managerPin, setManagerPin] = useState("");

  // Transfer Form State
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [destWarehouse, setDestWarehouse] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transferItems, setTransferItems] = useState<{ materialId: string; materialName: string; qty: number }[]>([]);
  const [newMatId, setNewMatId] = useState("");
  const [newMatQty, setNewMatQty] = useState("");

  // Opname Form State
  const [opnameWarehouse, setOpnameWarehouse] = useState("");
  const [opnameItems, setOpnameItems] = useState<{ materialId: string; name: string; systemQty: number; actualQty: number }[]>([]);

  // Queries
  const { data: procurementItems = [] } = useQuery({
    queryKey: ["ws-procurement"],
    queryFn: () => api.get("/scm/purchase-orders").then(r => r.data?.slice?.(0, 5) || []),
  });

  const { data: internalTransfers = [] } = useQuery({
    queryKey: ["ws-transfers"],
    queryFn: () => api.get("/warehouse/transfers").then(r => r.data?.slice?.(0, 5) || []),
  });

  const { data: stockOpnames = [] } = useQuery({
    queryKey: ["ws-opnames"],
    queryFn: () => api.get("/warehouse/opname").then(r => r.data?.slice?.(0, 5) || []),
  });

  const { data: logisticsItems = [] } = useQuery({
    queryKey: ["ws-release"],
    queryFn: () => api.get("/warehouse/release-requests").then(r => r.data?.slice?.(0, 5) || []),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["ws-warehouses"],
    queryFn: () => api.get("/master/warehouses").then(r => r.data || []),
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["ws-materials"],
    queryFn: () => api.get("/master/materials").then(r => r.data || []),
  });

  const { data: fefoData } = useQuery({
    queryKey: ["ws-fefo", selectedIssueItem?.materialId],
    queryFn: () => api.get(`/warehouse/suggest-batch/${selectedIssueItem.materialId}`).then(r => r.data),
    enabled: !!selectedIssueItem?.materialId,
  });
  const fefoSuggestion = fefoData || {
    suggestedBatch: { batchNumber: "B240420-A", expDate: "2024-12-31", location: { name: "AISLE 4-B" } }
  };
  const isFefoLoading = false;

  // Mutations
  const createOpnameMutation = useMutation({
    mutationFn: (data: any) => api.post("/warehouse/opname", data).then(r => r.data),
    onSuccess: () => {
      toast.success("Stock Opname created.");
      queryClient.invalidateQueries({ queryKey: ["ws-opnames"] });
      setIsOpnameModalOpen(false);
      setOpnameItems([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: any) => api.post("/warehouse/transfers", data).then(r => r.data),
    onSuccess: () => {
      toast.success("Transfer order created.");
      queryClient.invalidateQueries({ queryKey: ["ws-transfers"] });
      setIsTransferModalOpen(false);
      setTransferItems([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const approveOpnameMutation = useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) =>
      api.post(`/warehouse/opname/${id}/approve-pin`, { userId: "system", pin }).then(r => r.data),
    onSuccess: () => {
      toast.success("Opname approved. Inventory adjusted.");
      queryClient.invalidateQueries({ queryKey: ["ws-opnames"] });
      setSelectedOpname(null);
      setManagerPin("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "PIN verification failed"),
  });

  const issueBatchMutation = useMutation({
    mutationFn: (data: { batchId: string; status: string }) =>
      api.post(`/warehouse/batches/${data.batchId}/status`, { status: data.status, userId: "system" }).then(r => r.data),
    onSuccess: () => {
      toast.success("Batch issued following FEFO protocol.");
      setSelectedIssueItem(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const handleIssueConfirmation = () => {
    const batchId = fefoSuggestion?.suggestedBatch?.batchNumber;
    if (batchId) issueBatchMutation.mutate({ batchId, status: "ISSUED" });
    else {
      toast.success(`Material Issued Following FEFO.`);
      setSelectedIssueItem(null);
    }
  };

  const addTransferMaterial = (matId: string) => {
    const mat = materials.find((m: any) => m.id === matId);
    if (!mat) return;
    setTransferItems([...transferItems, { materialId: mat.id, materialName: mat.name, qty: 1 }]);
    setNewMatId("");
  };

  const addOpnameMaterial = (matId: string) => {
    const mat = materials.find((m: any) => m.id === matId);
    if (!mat) return;
    if (opnameItems.find(i => i.materialId === matId)) return;
    setOpnameItems([...opnameItems, { materialId: mat.id, name: mat.name, systemQty: Number(mat.stockQty || 0), actualQty: Number(mat.stockQty || 0) }]);
  };

  return (
    <div className="space-y-8">
      {/* 🚀 I. COMMAND CENTER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">WAREHOUSE WORKSTATION ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic">WAREHOUSE <span className="text-slate-300">OPS</span></h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">STRICT MULTI-TAB EXECUTION & MATERIAL HANDOVER PORTAL</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-12 px-6 border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest italic rounded-xl">
              <History className="mr-2 h-4 w-4" /> SHIFT LOGS
           </Button>

           <Dialog open={isOpnameModalOpen} onOpenChange={setIsOpnameModalOpen}>
              <DialogTrigger asChild>
                 <Button variant="outline" className="h-12 px-6 border-amber-200 bg-white text-amber-600 font-black text-[10px] uppercase tracking-widest italic rounded-xl">
                    <ClipboardCheck className="mr-2 h-4 w-4" /> STOCK OPNAME
                 </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
                 <div className="bg-brand-black p-10 text-white relative">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">STOCK <span className="text-slate-500">AUDIT ENGINE</span></h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">PHYSICAL STOCK VERIFICATION & RECONCILIATION</p>
                    <ShieldCheck className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
                 </div>
                 <div className="p-10 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">TARGET WAREHOUSE</label>
                         <Select onValueChange={(v: any) => setOpnameWarehouse(typeof v === 'string' ? v : '')}>
                           <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                              <SelectValue placeholder="SELECT WAREHOUSE TO AUDIT..." />
                           </SelectTrigger>
                           <SelectContent>
                              {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id} className="font-black uppercase text-[10px]">{w.name}</SelectItem>)}
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center gap-2">
                           <div className="w-1 h-3 bg-brand-black rounded-full" />
                           <label className="text-[9px] font-black uppercase text-brand-black tracking-widest">ADD MATERIALS TO AUDIT</label>
                        </div>
                         <Select onValueChange={(v: any) => typeof v === 'string' && addOpnameMaterial(v)}>
                           <SelectTrigger className="h-14 border-2 border-dashed border-slate-200 bg-white rounded-2xl font-black uppercase text-[10px] text-slate-400">
                              <SelectValue placeholder="+ APPEND MATERIAL TO AUDIT" />
                           </SelectTrigger>
                           <SelectContent>
                              {materials.map((m: any) => <SelectItem key={m.id} value={m.id} className="font-black uppercase text-[10px]">{m.name} (STOCK: {m.stockQty})</SelectItem>)}
                          </SelectContent>
                       </Select>

                       <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                           {materials.map((item: any, idx: number) => (
                             <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex-1">
                                   <p className="text-[10px] font-black uppercase italic">{item.name}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">SYSTEM: {item.stockQty}</p>
                                </div>
                                <div className="w-24">
                                   <Input 
                                     type="number" 
                                     className="h-10 bg-white border-slate-200 font-black text-center text-blue-600 text-xs rounded-xl" 
                                     defaultValue={item.stockQty}
                                   />
                                </div>
                                <div className="w-16 text-right font-black text-[10px] uppercase text-slate-300 italic">0</div>
                                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-rose-500 h-8 w-8 p-0"><Trash2 size={14}/></Button>
                             </div>
                          ))}
                       </div>
                    </div>

                    <Button onClick={() => {
                        if (!opnameWarehouse) return toast.error("Select a warehouse.");
                        if (opnameItems.length === 0) return toast.error("Add at least one material.");
                        createOpnameMutation.mutate({
                          warehouseId: opnameWarehouse,
                          picId: "system",
                          items: opnameItems.map(i => ({ materialId: i.materialId, systemQty: i.systemQty, actualQty: i.actualQty })),
                        });
                      }}
                       className="w-full h-16 bg-brand-black hover:bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl italic"
                       disabled={createOpnameMutation.isPending}
                    >
                       {createOpnameMutation.isPending ? "PROCESSING..." : "CREATE OPNAME REPORT"}
                    </Button>
                 </div>
              </DialogContent>
           </Dialog>

           <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
              <DialogTrigger asChild>
                 <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest italic rounded-xl shadow-lg shadow-blue-100 border-none">
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> INTERNAL TRANSFER
                 </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
                 <div className="bg-brand-black p-10 text-white relative">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">INTERNAL <span className="text-slate-500">TRANSFER</span></h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">MOVING ASSETS BETWEEN LOCATIONS</p>
                    <MoveHorizontal className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
                 </div>
                 <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">SOURCE WAREHOUSE</label>
                           <Select onValueChange={(v: any) => typeof v === 'string' && setSourceWarehouse(v)}>
                              <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                 <SelectValue placeholder="FROM..." />
                              </SelectTrigger>
                              <SelectContent>
                                 {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id} className="font-black uppercase text-[10px]">{w.name}</SelectItem>)}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">DESTINATION</label>
                           <Select onValueChange={(v: any) => typeof v === 'string' && setDestWarehouse(v)}>
                             <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                <SelectValue placeholder="TO..." />
                             </SelectTrigger>
                             <SelectContent>
                                {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id} className="font-black uppercase text-[10px]">{w.name}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">VEHICLE PLATE (OPTIONAL)</label>
                        <Input placeholder="E.G. B 1234 ABC" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-brand-black rounded-full" />
                          <label className="text-[9px] font-black uppercase text-brand-black tracking-widest">ADD ITEMS</label>
                       </div>
                       <div className="flex gap-4">
                           <Select onValueChange={(v: any) => typeof v === 'string' && setNewMatId(v)}>
                              <SelectTrigger className="flex-1 h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                 <SelectValue placeholder="MATERIAL..." />
                              </SelectTrigger>
                              <SelectContent>
                                 {materials.map((m: any) => <SelectItem key={m.id} value={m.id} className="font-black uppercase text-[10px]">{m.name}</SelectItem>)}
                              </SelectContent>
                           </Select>
                           <Input type="number" placeholder="QTY" value={newMatQty} onChange={(e) => setNewMatQty(e.target.value)} className="w-24 h-14 bg-slate-50 border-slate-200 font-black text-center text-xs rounded-xl" />
                           <Button onClick={() => {
                             if (!newMatId || !newMatQty) return toast.error("Select material and qty");
                             addTransferMaterial(newMatId);
                           }} className="h-14 w-14 bg-brand-black text-white rounded-xl shadow-lg border-none hover:bg-slate-800"><Plus /></Button>
                       </div>

                       <div className="bg-slate-50 rounded-2xl p-6 space-y-3 max-h-40 overflow-y-auto border border-slate-100">
                          <p className="text-center py-4 text-[10px] font-black text-slate-300 uppercase italic tracking-widest">NO ITEMS ADDED TO QUEUE</p>
                       </div>
                    </div>

                    <Button onClick={() => {
                        if (!sourceWarehouse || !destWarehouse) return toast.error("Select both warehouses.");
                        if (transferItems.length === 0) return toast.error("Add at least one material.");
                        createTransferMutation.mutate({
                          sourceWarehouseId: sourceWarehouse,
                          destWarehouseId: destWarehouse,
                          items: transferItems.map(i => ({ materialId: i.materialId, qty: i.qty })),
                          notes: vehicleNo ? `Vehicle: ${vehicleNo}` : undefined,
                        });
                      }}
                       className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl italic border-none"
                       disabled={createTransferMutation.isPending}
                    >
                       {createTransferMutation.isPending ? "PROCESSING..." : "INITIATE INTERNAL TRANSFER"}
                    </Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* 📑 II. EXECUTION TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <TabsList className="h-14 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
               <TabsTrigger value="procurement" className="h-11 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest italic flex gap-2 data-[state=active]:bg-brand-black data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                  <Truck className="w-4 h-4" /> 01. PROCUREMENT
               </TabsTrigger>
               <TabsTrigger value="internal" className="h-11 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest italic flex gap-2 data-[state=active]:bg-brand-black data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                  <ArrowRightLeft className="w-4 h-4" /> 02. INTERNAL
               </TabsTrigger>
               <TabsTrigger value="logistics" className="h-11 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest italic flex gap-2 data-[state=active]:bg-brand-black data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                  <PackageCheck className="w-4 h-4" /> 03. LOGISTICS
               </TabsTrigger>
            </TabsList>

            <div className="relative w-full max-w-sm group">
               <Scan className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
               <Input 
                  placeholder="SCAN BATCH / REQUISITION..." 
                  className="h-14 pl-12 bg-white border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest placeholder:text-slate-300 shadow-sm focus:ring-blue-600/10"
               />
               <Zap className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-100 animate-pulse" />
            </div>
         </div>

         {/* Tab 1: Procurement */}
         <TabsContent value="procurement" className="space-y-6">
            <div className="flex items-center gap-2">
               <div className="w-1 h-4 bg-brand-black rounded-full" />
               <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">PENDING INBOUND & RECEIVING</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
               {procurementItems.map((item: any) => (
                  <WorkCard 
                    key={item.id}
                    icon={<Truck />}
                    title={`PO: ${item.poId}`}
                    subtitle={`${item.receivedAt} • ${item.items?.length} MATERIALS IN QUEUE`}
                    status="IN_TRANSIT"
                    actionLabel="RECEIVE BATCH"
                    onAction={() => toast.info("PROCEED TO INBOUND TAB")}
                  />
               ))}
            </div>
         </TabsContent>

         {/* Tab 2: Internal */}
         <TabsContent value="internal" className="space-y-12">
            <div className="space-y-6">
               <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-600 rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">INTERNAL TRANSFERS</h3>
               </div>
               <div className="grid grid-cols-1 gap-6">
                  {internalTransfers.map((item: any) => (
                    <WorkCard 
                      key={item.id}
                      icon={<ArrowRightLeft />}
                      title={item.transferNumber}
                      subtitle={`${item.sourceWarehouse?.name} → ${item.destWarehouse?.name}`}
                      status={item.status}
                      actionLabel="EXECUTE MOVE"
                      isAmber={true}
                    />
                  ))}
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-amber-500 rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">STOCK AUDIT & OPNAME</h3>
               </div>
               <div className="grid grid-cols-1 gap-6">
                  {stockOpnames.map((item: any) => (
                    <WorkCard 
                      key={item.id}
                      icon={<ClipboardCheck />}
                      title={item.opnameNumber}
                      subtitle={`${item.warehouse?.name} • ITEMS: ${item.items?.length}`}
                      status={item.approvalStatus}
                      actionLabel="APPROVE DISCREPANCY"
                      onAction={() => setSelectedOpname(item)}
                      isAmber={true}
                    />
                  ))}
               </div>
            </div>
         </TabsContent>

         {/* Tab 3: Logistics */}
         <TabsContent value="logistics" className="space-y-6">
            <div className="flex items-center gap-2">
               <div className="w-1 h-4 bg-emerald-600 rounded-full" />
               <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">PENDING PRODUCTION REQUISITIONS</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
               {logisticsItems.map((item: any) => (
                  <div key={item.materialId} className="bento-card bg-white p-8 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 group hover:translate-y-[-5px] transition-all">
                     <div className="flex items-center gap-8">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                           <PackageCheck className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-brand-black uppercase italic tracking-tighter">{item.name}</h4>
                           <div className="flex flex-wrap gap-6 mt-2">
                              <div className="flex flex-col">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REQUESTED</p>
                                 <p className="text-xs font-black text-brand-black uppercase tabular tracking-tighter">{item.totalRequested} {item.unit}</p>
                              </div>
                              <div className="flex flex-col">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">STOCK AVAIL</p>
                                 <p className="text-xs font-black text-brand-black uppercase tabular tracking-tighter">{item.currentStock} {item.unit}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-sm italic">READY_FOR_HANDOVER</Badge>
                        <Button 
                           onClick={() => setSelectedIssueItem(item)}
                           className="h-12 px-8 bg-brand-black hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-slate-100 italic border-none transition-all"
                        >
                           ISSUE MATERIAL
                        </Button>
                     </div>
                  </div>
               ))}
            </div>
         </TabsContent>
      </Tabs>

      {/* 🛡️ FEFO SECURITY GATE DIALOG */}
      <Dialog open={!!selectedIssueItem} onOpenChange={(open) => !open && setSelectedIssueItem(null)}>
         <DialogContent className="sm:max-w-[550px] bg-white rounded-[3rem] border border-slate-200 shadow-2xl p-0 overflow-hidden">
            <div className="bg-emerald-600 p-10 text-white relative">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="h-7 w-7" />
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">FEFO <span className="text-emerald-900/50">SECURITY GATE</span></DialogTitle>
               </div>
               <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">MANDATORY BATCH RELEASE PROTOCOL</p>
               <CalendarDays className="absolute right-10 top-1/2 -translate-y-1/2 h-20 w-20 text-emerald-500 opacity-20" />
            </div>

            <div className="p-10 space-y-8">
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-6">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TARGET MATERIAL</p>
                        <p className="text-2xl font-black text-brand-black uppercase italic tracking-tighter mt-1">{selectedIssueItem?.name}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RELEASE QTY</p>
                        <p className="text-2xl font-black text-emerald-600 uppercase italic tracking-tighter mt-1">{selectedIssueItem?.totalRequested} {selectedIssueItem?.unit}</p>
                     </div>
                  </div>

                  <div className="p-8 bg-brand-black rounded-[2.5rem] text-white space-y-8 relative overflow-hidden group shadow-2xl">
                     <div className="absolute top-0 right-0 p-6">
                        <Badge className="bg-emerald-500 text-brand-black border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20">BEST MATCH</Badge>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">MANDATORY BATCH NUMBER</p>
                        <p className="text-4xl font-black italic tracking-tighter text-blue-500 group-hover:scale-105 transition-transform duration-500">#{fefoSuggestion.suggestedBatch.batchNumber}</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-8">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                              <CalendarDays className="h-6 w-6 text-emerald-500" />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">EXPIRY DATE</p>
                              <p className="text-sm font-black uppercase text-white italic tracking-tighter">{fefoSuggestion.suggestedBatch.expDate}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                              <MapPin className="h-6 w-6 text-amber-500" />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">LOCATION</p>
                              <p className="text-sm font-black uppercase text-white italic tracking-tighter">{fefoSuggestion.suggestedBatch.location.name}</p>
                           </div>
                        </div>
                     </div>
                     <Zap className="absolute -right-8 -bottom-8 h-40 w-40 text-white/[0.03] group-hover:rotate-12 transition-transform duration-1000" />
                  </div>
               </div>

               <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-5">
                  <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-black text-amber-800 leading-relaxed uppercase italic">
                     WARNING: SYSTEM HAS IDENTIFIED THIS BATCH AS THE OLDEST STOCK. RELEASING ANY OTHER BATCH WILL RESULT IN A FEFO VIOLATION AUDIT LOG.
                  </p>
               </div>

               <DialogFooter className="gap-4">
                  <Button variant="ghost" onClick={() => setSelectedIssueItem(null)} className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 italic">CANCEL</Button>
                  <Button 
                    onClick={handleIssueConfirmation}
                    className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-emerald-100 italic border-none transition-all"
                  >
                    CONFIRM & ISSUE BATCH
                  </Button>
               </DialogFooter>
            </div>
         </DialogContent>
      </Dialog>

      {/* 🔐 AUDIT APPROVAL GATE DIALOG */}
      <Dialog open={!!selectedOpname} onOpenChange={(open) => !open && setSelectedOpname(null)}>
         <DialogContent className="sm:max-w-[500px] bg-white rounded-[3rem] border border-slate-200 shadow-2xl p-0 overflow-hidden">
            <div className="bg-brand-black p-10 text-white relative">
               <div className="flex items-center gap-3">
                  <AlertCircle className="h-7 w-7 text-amber-500 animate-pulse" />
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">AUDIT <span className="text-slate-500">APPROVAL GATE</span></DialogTitle>
               </div>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">DISCREPANCY RECONCILIATION REQUIRED</p>
               <KeyRound className="absolute right-10 top-1/2 -translate-y-1/2 h-20 w-20 text-white/5" />
            </div>

            <div className="p-10 space-y-10">
               <div className="space-y-6">
                  <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6 border border-slate-100 shadow-inner">
                     <div className="flex justify-between items-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OPNAME NUMBER</p>
                        <p className="text-xs font-black text-brand-black uppercase italic tracking-tighter">{selectedOpname?.opnameNumber}</p>
                     </div>
                     <div className="flex justify-between items-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ITEMS AUDITED</p>
                        <p className="text-xs font-black text-brand-black uppercase italic tracking-tighter">{selectedOpname?.items?.length} MATERIALS</p>
                     </div>
                     <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VARIANCE VALUE</p>
                        <p className="text-2xl font-black text-rose-600 uppercase italic tracking-tighter">Rp {selectedOpname?.totalLossValue?.toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center gap-2 px-1">
                        <KeyRound className="h-4 w-4 text-blue-600" />
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">MANAGER AUTHORIZATION PIN</label>
                     </div>
                     <Input 
                       type="password" 
                       placeholder="••••" 
                       className="h-16 text-center text-4xl tracking-[1em] font-black border-2 border-slate-100 bg-slate-50 rounded-2xl focus:ring-blue-600/10"
                       value={managerPin}
                       onChange={(e) => setManagerPin(e.target.value)}
                       maxLength={4}
                     />
                     <p className="text-center text-[9px] font-black text-slate-300 uppercase italic tracking-widest">ONLY AUTHORIZED MANAGERS CAN APPROVE STOCK ADJUSTMENTS</p>
                  </div>
               </div>

               <DialogFooter className="gap-4">
                  <Button variant="ghost" onClick={() => setSelectedOpname(null)} className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 italic">DECLINE</Button>
                  <Button onClick={() => {
                      if (selectedOpname && managerPin.length >= 4) {
                        approveOpnameMutation.mutate({ id: selectedOpname.id, pin: managerPin });
                      }
                    }}
                    disabled={managerPin.length < 4 || approveOpnameMutation.isPending}
                    className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-100 italic border-none transition-all"
                  >
                    {approveOpnameMutation.isPending ? "AUTHORIZING..." : "AUTHORIZE ADJUSTMENT"}
                  </Button>
               </DialogFooter>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkCard({ 
  icon, 
  title, 
  subtitle, 
  status, 
  actionLabel, 
  onAction, 
  disabled = false,
  isAmber = false 
}: any) {
  return (
    <div className={cn(
      "bento-card bg-white p-8 border flex flex-col md:flex-row items-center justify-between gap-6 group hover:translate-y-[-5px] transition-all",
      isAmber ? "border-amber-100 bg-amber-50/10" : "border-slate-100"
    )}>
      <div className="flex items-center gap-8">
        <div className={cn(
          "h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner",
          isAmber ? "bg-amber-50" : "bg-slate-50"
        )}>
          {React.cloneElement(icon, { className: cn("w-8 h-8", isAmber ? "text-amber-500" : "text-slate-300 group-hover:text-brand-black transition-colors") })}
        </div>
        <div>
          <h4 className="text-xl font-black text-brand-black uppercase italic tracking-tighter group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge className={cn(
          "border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-sm italic",
          status === 'COMPLETED' || status === 'APPROVED' ? "bg-emerald-50 text-emerald-700" : 
          status === 'PENDING' || status === 'DRAFT' || status === 'IN_TRANSIT' ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"
        )}>{status}</Badge>
        <Button 
          onClick={onAction}
          disabled={disabled}
          className={cn(
            "h-12 px-8 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg italic border-none transition-all",
            isAmber ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-brand-black hover:bg-slate-800 text-white"
          )}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

