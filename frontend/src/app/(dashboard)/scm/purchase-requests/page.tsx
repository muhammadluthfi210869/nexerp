"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Search, 
  FileText, 
  ShoppingCart, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Package
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PRItem {
  materialId: string;
  materialName: string;
  qtyRequired: number;
  estimatedPrice?: number;
}

interface PurchaseRequest {
  id: string;
  requestDate: string;
  warehouseId: string;
  warehouse: { name: string };
  priority: 'LOW' | 'MEDIUM' | 'URGENT';
  status: 'DRAFT' | 'APPROVED' | 'ORDERED';
  notes?: string;
  items: Array<{
    id: string;
    material: { name: string };
    qtyRequired: number;
    estimatedPrice: number;
  }>;
}

export default function PurchaseRequestsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [requiredDate, setRequiredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PRItem[]>([]);
  
  // New Item State
  const [newItemMaterialId, setNewItemMaterialId] = useState("");
  const [newItemQty, setNewItemQty] = useState("");

  // Fetch PRs
  const { data: requests, isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-requests");
      return res.data;
    },
  });

  // Fetch Warehouses
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/master/warehouses");
      return res.data;
    },
  });

  // Fetch Materials
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await api.get("/master/materials");
      return res.data;
    },
  });

  const createPRMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/purchase-request", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Purchase Request successfully broadcasted to SCM.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Protocol Error: Failed to commit request.");
    }
  });

  const resetForm = () => {
    setSelectedWarehouse("");
    setPriority("MEDIUM");
    setNotes("");
    setItems([]);
  };

  const addItem = () => {
    if (!newItemMaterialId || !newItemQty) return;
    const material = materials.find((m: any) => m.id === newItemMaterialId);
    if (!material) return;

    setItems([...items, {
      materialId: newItemMaterialId,
      materialName: material.name,
      qtyRequired: Number(newItemQty),
      estimatedPrice: material.lastPurchasePrice || 0
    }]);
    setNewItemMaterialId("");
    setNewItemQty("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Payload Empty: Add at least one material.");
      return;
    }

    createPRMutation.mutate({
      warehouseId: selectedWarehouse,
      priority,
      requiredDate,
      notes,
      items: items.map(i => ({
        materialId: i.materialId,
        qtyRequired: i.qtyRequired,
        estimatedPrice: i.estimatedPrice
      }))
    });
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return 'bg-rose-500 text-white';
      case 'MEDIUM': return 'bg-amber-500 text-white';
      case 'LOW': return 'bg-blue-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ORDERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'APPROVED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="p-1 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            PURCHASE <span className="text-blue-600">REQUESTS</span>
          </h1>
          <div className="flex items-center gap-3 mt-4">
             <Badge className="bg-slate-900 text-white font-bold tracking-tight text-[10px] uppercase px-4 py-1.5 rounded-full border-none">Internal Procurement v1.0</Badge>
             <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">Supply Chain Demand Logic</p>
          </div>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-black px-8 rounded-2xl shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95 border-none uppercase tracking-tighter text-sm">
              <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> Initialize PR
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-blue-600 p-8 text-white relative">
               <DialogTitle className="text-3xl font-black uppercase tracking-tighter leading-none italic">Material Requirement</DialogTitle>
               <DialogDescription className="text-blue-100 font-medium uppercase text-[10px] tracking-tight mt-2">Formal request to SCM for procurement</DialogDescription>
               <FileText className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 text-blue-500 opacity-30" />
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Target Warehouse</Label>
                  <Select value={selectedWarehouse} onValueChange={(val) => { if (typeof val === 'string') setSelectedWarehouse(val); }} required>
                    <SelectTrigger className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl focus:bg-white focus:border-blue-200 transition-all">
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((w: any) => (
                        <SelectItem key={w.id} value={w.id} className="font-bold">{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Priority Level</Label>
                  <Select value={priority} onValueChange={(val) => { if (typeof val === 'string') setPriority(val); }} required>
                    <SelectTrigger className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl focus:bg-white focus:border-blue-200 transition-all">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW" className="font-bold text-blue-600">LOW</SelectItem>
                      <SelectItem value="MEDIUM" className="font-bold text-amber-600">MEDIUM</SelectItem>
                      <SelectItem value="URGENT" className="font-bold text-rose-600">URGENT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Required By Date</Label>
                  <Input 
                    type="date" 
                    className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl focus:bg-white focus:border-blue-200 transition-all"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* ITEM BUILDER */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-tight text-slate-900 pl-1">Material Items (Dynamic Rows)</Label>
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3">
                    <Select value={newItemMaterialId} onValueChange={(val) => { if (typeof val === 'string') setNewItemMaterialId(val); }}>
                      <SelectTrigger className="h-11 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl">
                        <SelectValue placeholder="Search Material..." />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map((m: any) => (
                          <SelectItem key={m.id} value={m.id} className="font-bold">{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input 
                    type="number" 
                    placeholder="Qty" 
                    className="h-11 border-2 border-slate-50 bg-slate-50 font-bold"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                  />
                  <Button type="button" onClick={addItem} className="h-11 bg-slate-900 text-white font-black rounded-xl">
                    ADD
                  </Button>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-100/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-[9px] font-black uppercase">Material</TableHead>
                        <TableHead className="h-10 text-[9px] font-black uppercase">Qty</TableHead>
                        <TableHead className="h-10 text-[9px] font-black uppercase text-right">Est. Price</TableHead>
                        <TableHead className="h-10 text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-20 text-center text-[10px] font-bold text-slate-300 italic uppercase">No items added yet</TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, idx) => (
                          <TableRow key={idx} className="bg-white hover:bg-slate-50/50">
                            <TableCell className="font-bold text-xs">{item.materialName}</TableCell>
                            <TableCell className="font-black text-xs text-blue-600">{item.qtyRequired}</TableCell>
                            <TableCell className="text-right font-bold text-xs">{formatCurrency(item.estimatedPrice || 0)}</TableCell>
                            <TableCell className="text-right">
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-rose-500 hover:bg-rose-50 h-8 w-8 p-0">
                                <Trash2 size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Justification / Notes</Label>
                <Textarea 
                  placeholder="Reason for request (e.g. For Batch 502, Skincare Line)" 
                  className="min-h-[80px] rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold focus:bg-white transition-all"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tight rounded-2xl shadow-lg"
                disabled={createPRMutation.isPending}
              >
                {createPRMutation.isPending ? <Loader2 className="animate-spin" /> : "Authorize & Broadcast Request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<FileText className="text-blue-600" />} label="Total Requests" value={requests?.length || 0} />
        <StatCard icon={<Clock className="text-amber-600" />} label="Pending Approval" value={requests?.filter(r => r.status === 'DRAFT').length || 0} />
        <StatCard icon={<AlertTriangle className="text-rose-600" />} label="Urgent Needs" value={requests?.filter(r => r.priority === 'URGENT').length || 0} />
        <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Ordered to PO" value={requests?.filter(r => r.status === 'ORDERED').length || 0} />
      </div>

      {/* DATA TABLE */}
      <div className="relative group">
         <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-5 group-hover:opacity-10 transition duration-1000"></div>
         <div className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
            <Table>
               <TableHeader className="bg-slate-50/70">
                  <TableRow className="hover:bg-transparent border-slate-100">
                     <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Request Metadata</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Warehouse / Logic</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Item Count</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
                     <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Action</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {isLoading ? (
                     <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-blue-600" /></TableCell></TableRow>
                  ) : requests?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-400 font-bold uppercase tracking-tight text-xs">No requests in pipeline.</TableCell></TableRow>
                  ) : (
                     requests?.map((pr: any) => (
                        <TableRow key={pr.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
                           <TableCell className="py-8 pl-10">
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm italic group-hover:scale-110 transition-transform">
                                    PR
                                 </div>
                                 <div>
                                    <p className="font-black text-slate-900 tracking-tight text-lg leading-tight uppercase italic">#{pr.id.split('-')[0]}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1 italic">{new Date(pr.requestDate).toLocaleDateString()}</p>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="space-y-1.5">
                                 <p className="text-slate-700 font-bold text-sm tracking-tight flex items-center gap-2 uppercase italic">
                                    <Package size={14} className="text-blue-600" /> {pr.warehouse.name}
                                 </p>
                                 <Badge className={cn("text-[9px] font-black uppercase rounded-lg px-2 shadow-sm border-none", getPriorityColor(pr.priority))}>
                                    {pr.priority} Priority
                                 </Badge>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="space-y-1">
                                 <p className="font-black text-slate-900 text-base">{pr.items.length} Materials</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight italic">{pr.notes || "No notes provided"}</p>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge className={cn("rounded-xl px-4 py-2 font-black uppercase tracking-tight text-[10px] border shadow-sm", getStatusColor(pr.status))}>
                                 {pr.status}
                              </Badge>
                           </TableCell>
                           <TableCell className="pr-10 text-right">
                              <Button className="h-11 px-6 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-tight text-[10px] rounded-xl shadow-xl hover:-translate-x-1 transition-all border-none italic">
                                 Review <ArrowRight className="ml-2 h-3.5 w-3.5" />
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string | number }) {
   return (
      <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-8 flex flex-col gap-4 bg-white hover:translate-y-[-4px] transition-all duration-500">
         <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">
            {icon}
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-300">{label}</p>
            <p className="text-2xl font-black tracking-tighter mt-1 text-slate-900">{value}</p>
         </div>
      </Card>
   );
}

