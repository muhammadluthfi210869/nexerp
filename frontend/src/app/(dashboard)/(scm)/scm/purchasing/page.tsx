"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Search, 
  FileEdit, 
  Truck,
  PackageCheck,
  ChevronRight,
  User,
  Package,
  Calendar,
  Trash2,
  ShieldAlert,
  ClipboardList,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Send,
  Droplets,
  Zap,
  Filter,
  Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

export default function PurchasingPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState("NET 30");
  const [downPayment, setDownPayment] = useState("0");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  
  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/scm/vendors");
      return res.data;
    }
  });

  const { data: materials } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: async () => {
      const res = await api.get("/scm/materials");
      return res.data.filter((m: any) => m.type === "RAW_MATERIAL");
    }
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/warehouse/warehouses");
      return res.data;
    }
  });

  const { data: prs } = useQuery({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-requests");
      return res.data;
    }
  });

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return (res.data || []).map((po: any) => ({
        id: po.poNumber || po.id,
        vendor: po.supplier?.name || '-',
        date: po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-',
        total: Number(po.totalValue || 0),
        status: po.status === 'RECEIVED' ? 'CLOSED' : po.status === 'ORDERED' ? 'APPROVED' : po.status === 'CANCELLED' ? 'CLOSED' : 'DRAFT',
        type: 'PURCHASE_ORDER',
      }));
    }
  });

  const createPRMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/purchase-request", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Purchase Requisition submitted for approval.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setIsModalOpen(false);
      setItems([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit requisition.");
    }
  });

  const pendingPrCount = String(prs?.filter((r: any) => r.status === 'DRAFT').length || 0).padStart(2, '0');
  const activePoCount = String(purchaseOrders?.length || 0).padStart(2, '0');
  const awaitingGrnCount = String(purchaseOrders?.filter((po: any) => po.status === 'APPROVED').length || 0).padStart(2, '0');
  const criticalShortageCount = String(materials?.filter((m: any) => Number(m.stockQty || 0) < Number(m.reorderPoint || 0)).length || 0).padStart(2, '0');

  const addItem = (materialId: string) => {
    const material = materials?.find((m: any) => m.id === materialId);
    if (!material) return;
    setItems([...items, { id: material.id, name: material.name, qty: 1, unit: material.unit, price: material.unitPrice || 0 }]);
  };

  return (
    <div className="p-10 space-y-12 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 backdrop-blur-md p-8 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="space-y-3">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Procurement Intelligence</span>
           </div>
           <h1 className="text-5xl font-bold tracking-tight text-slate-900">
             Purchasing <span className="text-slate-400 font-medium">& Requisition</span>
           </h1>
           <p className="text-slate-500 font-medium text-sm max-w-lg leading-relaxed">
             Inventory replenishment, vendor coordination, and procurement analytics engine.
           </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 px-10 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 font-semibold tracking-tight text-sm group">
              <Plus className="mr-2.5 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" /> Create Requisition
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32" />
               <div className="relative z-10">
                  <h2 className="text-3xl font-bold tracking-tight">New Requisition</h2>
                  <p className="text-slate-400 text-xs font-medium mt-2">Strategic Sourcing Protocol v4.0</p>
               </div>
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
                  <ClipboardList className="h-8 w-8 text-primary" />
               </div>
            </div>

            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2.5">
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Target Vendor</label>
                      <Select value={selectedVendor} onValueChange={(val: string | null) => setSelectedVendor(val || "")}>
                         <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium px-6 text-slate-900 focus:ring-primary/20">
                            <SelectValue placeholder="Select Vendor" />
                         </SelectTrigger>
                         <SelectContent className="bg-white border-slate-200 shadow-xl rounded-2xl p-2">
                            {vendors?.map((v: any) => (
                               <SelectItem key={v.id} value={v.id} className="font-medium py-3 rounded-lg">
                                  {v.name}
                               </SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Receiving Warehouse</label>
                      <Select value={selectedWarehouse} onValueChange={(val: string | null) => setSelectedWarehouse(val || "")}>
                         <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium px-6 text-slate-900 focus:ring-primary/20">
                            <SelectValue placeholder="Select Warehouse" />
                         </SelectTrigger>
                         <SelectContent className="bg-white border-slate-200 shadow-xl rounded-2xl p-2">
                            {warehouses?.map((w: any) => (
                               <SelectItem key={w.id} value={w.id} className="font-medium py-3 rounded-lg">
                                  {w.name}
                               </SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2.5">
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Payment Terms</label>
                      <Select value={paymentTerms} onValueChange={(val: string | null) => setPaymentTerms(val || "")}>
                         <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium px-6 text-slate-900 focus:ring-primary/20">
                            <SelectValue placeholder="Terms" />
                         </SelectTrigger>
                         <SelectContent className="bg-white border-slate-200 shadow-xl rounded-2xl p-2">
                            <SelectItem value="CASH" className="font-medium py-3 rounded-lg">CASH ON DELIVERY</SelectItem>
                            <SelectItem value="NET 7" className="font-medium py-3 rounded-lg">NET 7 DAYS</SelectItem>
                            <SelectItem value="NET 30" className="font-medium py-3 rounded-lg">NET 30 DAYS</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>
 
                 <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2.5">
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Urgency Level</label>
                      <Select value={urgency} onValueChange={(val: string | null) => setUrgency(val || "NORMAL")}>
                         <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium px-6 text-slate-900 focus:ring-primary/20">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="bg-white border-slate-200 shadow-xl rounded-2xl p-2">
                            <SelectItem value="NORMAL" className="font-medium py-3 rounded-lg">Normal Operation</SelectItem>
                            <SelectItem value="URGENT" className="font-medium py-3 rounded-lg text-amber-600">Urgent Priority</SelectItem>
                            <SelectItem value="CRITICAL" className="font-medium py-3 rounded-lg text-rose-600">Critical Halt</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2.5">
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Down Payment (DP)</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">RP</span>
                         <Input 
                            type="number" 
                            className="h-14 pl-10 bg-slate-50 border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-primary/20"
                            value={downPayment}
                            onChange={(e) => setDownPayment(e.target.value)}
                         />
                      </div>
                   </div>
                </div>

               <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Materials Selection</label>
                  <Select onValueChange={(val: string | null) => val && addItem(val)}>
                     <SelectTrigger className="h-16 border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/40 transition-all font-medium text-slate-500 rounded-2xl">
                        <SelectValue placeholder="+ Append Raw Material to Requisition" />
                     </SelectTrigger>
                     <SelectContent className="bg-white border-slate-200 shadow-xl rounded-2xl p-2">
                        {materials?.map((m: any) => (
                           <SelectItem key={m.id} value={m.id} className="font-medium py-3 rounded-lg transition-all">
                              {m.name} <span className="text-[10px] text-slate-400 ml-3">Unit: {m.unit}</span>
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <Table>
                     <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                           <TableHead className="py-5 pl-8 font-bold uppercase text-[10px] text-slate-400 tracking-wider">Material</TableHead>
                           <TableHead className="font-bold uppercase text-[10px] text-slate-400 text-center">Quantity</TableHead>
                           <TableHead className="font-bold uppercase text-[10px] text-slate-400 text-right">Unit Price</TableHead>
                           <TableHead className="font-bold uppercase text-[10px] text-slate-400 text-center">Tax</TableHead>
                           <TableHead className="font-bold uppercase text-[10px] text-slate-400 text-right">Subtotal</TableHead>
                           <TableHead className="pr-8"></TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="py-16 text-center">
                              <p className="text-slate-300 font-medium text-sm">Awaiting supply configuration...</p>
                            </TableCell>
                          </TableRow>
                        ) : items.map((item) => (
                           <TableRow key={item.id} className="group hover:bg-slate-50 transition-all border-none">
                              <TableCell className="py-6 pl-8">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                       <Package className="h-5 w-5" />
                                    </div>
                                    <div>
                                       <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                                       <p className="text-[10px] font-medium text-slate-400">Domestic Supply</p>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell className="text-center">
                                 <Input type="number" defaultValue={1} className="w-20 mx-auto h-10 border-slate-200 bg-white font-semibold text-center rounded-lg text-slate-900" />
                              </TableCell>
                              <TableCell className="text-right">
                                 <p className="font-semibold text-slate-900 text-sm">Rp {item.price.toLocaleString()}</p>
                              </TableCell>
                              <TableCell className="text-center">
                                 <Select defaultValue="PPN">
                                    <SelectTrigger className="h-10 w-24 mx-auto border-slate-200 bg-white text-[10px] font-bold">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="PPN">PPN 11%</SelectItem>
                                       <SelectItem value="NON">NON-PPN</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                 <p className="font-bold text-primary text-sm">Rp {(item.price * 1.11).toLocaleString()}</p>
                              </TableCell>
                              <TableCell className="pr-8 text-right">
                                 <Button variant="ghost" size="icon" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="h-9 w-9 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                                    <Trash2 className="h-4.5 w-4.5" />
                                 </Button>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </div>

               <div className="pt-6 flex gap-4">
                  <Button variant="ghost" className="h-14 px-8 font-semibold text-sm text-slate-500 hover:text-slate-900" onClick={() => setIsModalOpen(false)}>Discard</Button>
                   <Button className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-semibold tracking-tight rounded-2xl shadow-lg shadow-primary/10 transition-all duration-300 text-sm" disabled={createPRMutation.isPending} onClick={() => {
                     createPRMutation.mutate({
                       warehouseId: selectedWarehouse || undefined,
                       priority: urgency === 'NORMAL' ? 'MEDIUM' : urgency,
                       notes: `Vendor: ${selectedVendor}`,
                       items: items.map((i) => ({ materialId: i.id, qtyRequired: 1, estimatedPrice: i.price })),
                     });
                   }}>
                     {createPRMutation.isPending ? 'SUBMITTING...' : 'Commit Requisition Protocol'}
                   </Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Stats Engine */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Pending PR" value={pendingPrCount} icon={<FileEdit />} color="text-primary" bg="bg-primary/10" />
          <StatCard label="Active PO" value={activePoCount} icon={<Truck />} color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard label="Awaiting GRN" value={awaitingGrnCount} icon={<PackageCheck />} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Critical Shortage" value={criticalShortageCount} icon={<ShieldAlert />} color="text-rose-600" bg="bg-rose-50" />
       </div>

      {/* Registry Database */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Requisition Registry</h3>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search registry..." className="h-11 w-72 pl-11 bg-white border-slate-200 rounded-xl font-medium text-sm shadow-sm focus:ring-primary/20" />
             </div>
             <Button variant="outline" className="h-11 px-4 rounded-xl bg-white border-slate-200 shadow-sm hover:bg-slate-50">
                <Filter className="h-4 w-4 mr-2 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">Filter</span>
             </Button>
          </div>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
           <Table>
              <TableHeader className="bg-slate-50/50">
                 <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-5 pl-8 font-bold uppercase text-[10px] text-slate-400 tracking-wider">Registry ID</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Vendor / Source</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Type</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] text-slate-400 tracking-wider text-right">Value</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] text-slate-400 tracking-wider text-center">Status</TableHead>
                    <TableHead className="pr-8 text-right font-bold uppercase text-[10px] text-slate-400 tracking-wider">Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                 {purchaseOrders?.map((po: any) => (
                    <TableRow key={po.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-none">
                       <TableCell className="py-6 pl-8">
                          <div className="flex items-center gap-4">
                             <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10 group-hover:bg-primary transition-colors duration-300">
                                <ClipboardList className="h-5 w-5" />
                             </div>
                             <div>
                                <span className="font-bold text-slate-900 text-base leading-none">{po.id}</span>
                                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{po.date}</p>
                             </div>
                          </div>
                       </TableCell>
                       <TableCell>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Truck className="h-4 w-4 text-slate-500" />
                             </div>
                             <p className="font-semibold text-slate-700 text-sm">{po.vendor}</p>
                          </div>
                       </TableCell>
                       <TableCell>
                          <Badge variant="secondary" className={cn(
                            "rounded-full px-3 py-1 font-bold uppercase text-[9px] tracking-wider border-none",
                            po.type === 'PURCHASE_ORDER' ? "text-indigo-600 bg-indigo-50" : "text-primary bg-primary/5"
                          )}>
                             {po.type.replace('_', ' ')}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-right font-bold text-slate-900 text-base">
                          Rp {po.total.toLocaleString()}
                       </TableCell>
                       <TableCell className="text-center">
                          <Badge className={cn(
                            "rounded-full px-4 py-1 font-bold uppercase tracking-wider text-[9px] border-none shadow-sm",
                            po.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" : 
                            po.status === 'CLOSED' ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                          )}>
                             {po.status}
                          </Badge>
                       </TableCell>
                       <TableCell className="pr-8 text-right">
                          <div className="flex justify-end gap-2">
                             {po.status === 'APPROVED' && (
                                <Button className="h-10 px-4 rounded-xl bg-primary/10 text-primary font-bold uppercase text-[9px] tracking-tight hover:bg-primary hover:text-white transition-all flex items-center gap-2 border-none shadow-none">
                                   <Send className="h-3 w-3" /> SEND PO
                                </Button>
                             )}
                             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-400">
                                <MoreVertical className="h-5 w-5" />
                             </Button>
                          </div>
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

function StatCard({ label, value, icon, color, bg }: { label: string; value: string | number; icon: any; color: string; bg: string }) {
  return (
     <Card className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex items-center gap-6 group hover:shadow-md hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
        <div className={cn("h-16 w-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative z-10", color)}>
           {React.cloneElement(icon as React.ReactElement<any>, { className: "h-8 w-8 stroke-[2.5px]" })}
        </div>
        <div className="relative z-10 flex flex-col">
           <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">{label}</p>
           <p className="text-4xl font-bold tracking-tight text-slate-900 mt-2">{value}</p>
        </div>
     </Card>
  );
}

