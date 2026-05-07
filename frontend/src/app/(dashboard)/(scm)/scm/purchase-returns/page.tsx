"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Search, 
  RotateCcw,
  Truck,
  PackageX,
  ChevronRight,
  ClipboardList,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Filter
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PurchaseReturnsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInbound, setSelectedInbound] = useState<string | null>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);

  const { data: returns, isLoading } = useQuery({
    queryKey: ["purchase-returns"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-returns");
      return res.data;
    }
  });

  const { data: inbounds } = useQuery({
    queryKey: ["inbounds-approved"],
    queryFn: async () => {
      const res = await api.get("/scm/inbounds");
      return res.data.filter((i: any) => i.status === "APPROVED");
    }
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/master/suppliers");
      return res.data;
    }
  });

  const handleSelectInbound = (id: string) => {
    setSelectedInbound(id);
    const inbound = inbounds?.find((i: any) => i.id === id);
    if (inbound) {
      setReturnItems(inbound.items.map((item: any) => ({
        materialId: item.materialId,
        name: item.material.name,
        qtyReceived: item.quantity,
        qtyReturn: 0,
        unitPrice: item.unitPrice,
      })));
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post("/scm/purchase-returns", data);
    },
    onSuccess: () => {
      toast.success("Purchase Return protocol initiated.");
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      setIsModalOpen(false);
      setReturnItems([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to initiate return.");
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/scm/purchase-returns/${id}/status`, { status: "COMPLETED" });
    },
    onSuccess: () => {
      toast.success("Return completed. Inventory updated.");
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
    }
  });

  const handleSubmit = () => {
    const validItems = returnItems.filter(i => i.qtyReturn > 0);
    if (validItems.length === 0) {
        toast.error("Please specify at least one item to return.");
        return;
    }

    const inbound = inbounds?.find((i: any) => i.id === selectedInbound);
    
    createMutation.mutate({
      supplierId: inbound.po.supplierId,
      warehouseId: inbound.warehouseId,
      inboundId: selectedInbound,
      items: validItems.map(i => ({
        materialId: i.materialId,
        quantity: i.qtyReturn,
        unitPrice: i.unitPrice
      }))
    });
  };

  return (
    <div className="p-10 space-y-12 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 backdrop-blur-md p-8 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="space-y-3">
           <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-rose-500 animate-spin-slow" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-500">Reverse Logistics Engine</span>
           </div>
           <h1 className="text-5xl font-bold tracking-tight text-slate-900">
             Purchase <span className="text-slate-400 font-medium">Returns</span>
           </h1>
           <p className="text-slate-500 font-medium text-sm max-w-lg leading-relaxed">
             Manage supplier debits, material rejections, and inventory reversals.
           </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 px-10 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-lg shadow-rose-200 transition-all duration-300 font-semibold tracking-tight text-sm group">
              <Plus className="mr-2.5 h-5 w-5" /> Initiate Return
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1000px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
            <div className="bg-rose-900 p-10 text-white flex justify-between items-center">
               <div>
                  <h2 className="text-3xl font-bold tracking-tight text-white">Reverse SCM Transaction</h2>
                  <p className="text-rose-200 text-xs font-medium mt-2">Inventory Correction Protocol v4.0</p>
               </div>
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <PackageX className="h-8 w-8 text-rose-300" />
               </div>
            </div>

            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto">
               <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Reference Goods Receipt (Inbound)</label>
                  <Select onValueChange={(val: string | null) => val && handleSelectInbound(val)}>
                     <SelectTrigger className="h-16 border-slate-200 bg-slate-50 rounded-2xl font-medium px-6 text-slate-900 focus:ring-rose-500/20">
                        <SelectValue placeholder="Select GR to Return..." />
                     </SelectTrigger>
                     <SelectContent className="bg-white border-slate-200 shadow-xl rounded-2xl p-2">
                        {inbounds?.map((i: any) => (
                           <SelectItem key={i.id} value={i.id} className="font-medium py-3 rounded-lg">
                              {i.inboundNumber} <span className="text-slate-400 ml-2">({i.po?.poNumber} - {i.po?.supplier?.name})</span>
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               {selectedInbound && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Material Rejection List</h4>
                       <Badge className="bg-rose-50 text-rose-600 border-none font-bold uppercase text-[10px]">Verification Required</Badge>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                        <Table>
                           <TableHeader className="bg-slate-50/50">
                              <TableRow className="hover:bg-transparent border-slate-100">
                                 <TableHead className="py-5 pl-8 font-bold uppercase text-[10px] text-slate-400 tracking-wider">Material Name</TableHead>
                                 <TableHead className="font-bold uppercase text-[10px] text-slate-400 tracking-wider text-center">GR Qty</TableHead>
                                 <TableHead className="font-bold uppercase text-[10px] text-slate-400 tracking-wider text-center">Return Qty</TableHead>
                                 <TableHead className="pr-8 text-right font-bold uppercase text-[10px] text-slate-400 tracking-wider">Unit Price</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody className="divide-y divide-slate-100">
                              {returnItems.map((item, idx) => (
                                 <TableRow key={idx} className="group hover:bg-slate-50 transition-all border-none">
                                    <TableCell className="py-6 pl-8">
                                       <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                                             <ClipboardList className="h-5 w-5" />
                                          </div>
                                          <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-slate-500">{item.qtyReceived}</TableCell>
                                    <TableCell className="text-center">
                                       <Input 
                                          type="number" 
                                          value={item.qtyReturn} 
                                          onChange={(e) => {
                                             const val = Number(e.target.value);
                                             if (val > item.qtyReceived) return toast.error("Return qty cannot exceed GR qty");
                                             const newItems = [...returnItems];
                                             newItems[idx].qtyReturn = val;
                                             setReturnItems(newItems);
                                          }}
                                          className="w-24 mx-auto h-12 border-rose-100 bg-rose-50/30 focus:bg-white focus:ring-rose-500/20 font-bold text-center rounded-xl text-rose-900" 
                                       />
                                    </TableCell>
                                    <TableCell className="pr-8 text-right">
                                       <p className="font-semibold text-slate-900 text-sm">Rp {item.unitPrice.toLocaleString()}</p>
                                    </TableCell>
                                 </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                    </div>
                 </div>
               )}

               <div className="pt-6 flex gap-4">
                  <Button variant="ghost" className="h-14 px-8 font-semibold text-sm text-slate-500 hover:text-slate-900" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button 
                    className="flex-1 h-14 bg-rose-900 hover:bg-rose-950 text-white font-semibold tracking-tight rounded-2xl shadow-xl shadow-rose-200 transition-all duration-300 text-sm"
                    onClick={handleSubmit}
                    disabled={!selectedInbound || createMutation.isPending}
                  >
                    Confirm Rejection & Return
                  </Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Registry */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-rose-500 rounded-full" />
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Return Registry</h3>
           </div>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
           <Table>
              <TableHeader className="bg-slate-50/50">
                 <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-5 pl-8 font-bold uppercase text-[10px] text-slate-400 tracking-wider">Return #</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Vendor</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Value</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] text-slate-400 tracking-wider text-center">Status</TableHead>
                    <TableHead className="pr-8 text-right font-bold uppercase text-[10px] text-slate-400 tracking-wider">Verification</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                 {returns?.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={5} className="py-20 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No return transactions recorded in the current period.</p>
                     </TableCell>
                   </TableRow>
                 ) : returns?.map((ret: any) => (
                    <TableRow key={ret.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-none">
                       <TableCell className="py-6 pl-8">
                          <div className="flex items-center gap-4">
                             <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                                <RotateCcw className="h-5 w-5" />
                             </div>
                             <div>
                                <span className="font-bold text-slate-900 text-base">{ret.returnNumber}</span>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{new Date(ret.createdAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                       </TableCell>
                       <TableCell className="font-semibold text-slate-700 text-sm">{ret.supplier?.name}</TableCell>
                       <TableCell className="font-bold text-rose-600 text-base">Rp {Number(ret.totalValue).toLocaleString()}</TableCell>
                       <TableCell className="text-center">
                          <Badge className={cn(
                            "rounded-full px-4 py-1 font-bold uppercase tracking-wider text-[9px] border-none shadow-sm",
                            ret.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" : 
                            ret.status === 'CANCELLED' ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                          )}>
                             {ret.status}
                          </Badge>
                       </TableCell>
                       <TableCell className="pr-8 text-right">
                          {ret.status === 'DRAFT' && (
                             <Button 
                               onClick={() => completeMutation.mutate(ret.id)}
                               className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[9px] tracking-tight transition-all border-none"
                             >
                                Finalize & Reverse Stock
                             </Button>
                          )}
                          {ret.status === 'COMPLETED' && (
                             <div className="flex items-center justify-end gap-2 text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase">Inventory Reverted</span>
                             </div>
                          )}
                       </TableCell>
                    </TableRow>
                 ))}
              </TableBody>
           </Table>
        </Card>
      </div>
    </div>
  );
}

