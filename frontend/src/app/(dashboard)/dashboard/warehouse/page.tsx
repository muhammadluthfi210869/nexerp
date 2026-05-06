"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Box, 
  CheckCircle2, 
  AlertCircle, 
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Beaker
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// --- Types ---
interface Material {
  id: string;
  name: string;
  code: string;
  stock_qty: number;
  min_stock: number;
  unit: string;
  type: string;
}

interface ProductionPlan {
  id: string;
  batch_no: string;
  status: string;
  so: { lead: { client_name: string } };
  requisitions: {
    id: string;
    material_id: string;
    material: Material;
    qty_requested: number;
    qty_issued: number;
  }[];
}

export default function WarehouseDashboard() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [isFKPWizardOpen, setIsFKPWizardOpen] = useState(false);

  // --- Fetchers ---
  const { data: materials, isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: ["warehouse-materials"],
    queryFn: async () => {
      const res = await api.get("/scm/materials");
      return res.data;
    }
  });

  const { data: globalPlans } = useQuery<ProductionPlan[]>({
    queryKey: ["production-plans"],
    queryFn: async () => {
      const res = await api.get("/production-plans");
      return res.data;
    }
  });

  const pendingPlans = globalPlans?.filter(p => p.status === "PLANNING") || [];

  // --- Mutations ---
  const issueMaterialsMutation = useMutation({
    mutationFn: async (planId: string) => {
      return api.patch(`/production-plans/${planId}/issue-materials`, {});
    },
    onSuccess: () => {
      toast.success("Inventory Subtracted. FKP Approved. Factory can proceed.");
      queryClient.invalidateQueries({ queryKey: ["production-plans"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-materials"] });
      setIsFKPWizardOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || "Stock Interlock Violation! Operation Rejected.")
  });

  // --- Interlock Helper ---
  const checkStockAvailability = (plan: ProductionPlan) => {
    return plan.requisitions.every(req => 
      Number(req.material.stock_qty) >= Number(req.qty_requested)
    );
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-1000 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Warehouse Portal v1.0</h1>
          <p className="text-zinc-500 font-sans text-xs uppercase tracking-tight mt-1">
            <span className="text-emerald-500">▶</span> Material Requisition (FKP) Verification & Stock Control
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Inventory Overview */}
        <Card className="lg:col-span-2 border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader>
             <CardTitle className="text-lg font-bold text-white uppercase tracking-tighter flex items-center">
                <Box className="mr-2 h-5 w-5 text-emerald-500" /> GLOBAL INVENTORY LEDGER
             </CardTitle>
             <CardDescription className="text-zinc-500">Total stock availability across all raw materials and packaging.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-sm border border-zinc-900 overflow-hidden">
               <Table>
                 <TableHeader className="bg-zinc-900/50">
                   <TableRow className="border-zinc-900">
                      <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">Material</TableHead>
                      <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">Type</TableHead>
                      <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">Stock Status</TableHead>
                      <TableHead className="text-zinc-500 font-sans text-[10px] uppercase text-right">Qty Available</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {materials?.map(m => (
                      <TableRow key={m.id} className="border-zinc-900 hover:bg-white/[0.01]">
                        <TableCell>
                           <p className="text-xs font-bold text-white uppercase">{m.name}</p>
                           <p className="text-[10px] font-sans text-zinc-500 italic uppercase tracking-tighter">{m.id.split('-')[0]}</p>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="text-[8px] bg-zinc-900 text-zinc-500 border-zinc-800 rounded-none px-2 py-0">
                               {m.type}
                           </Badge>
                        </TableCell>
                        <TableCell>
                           {m.stock_qty < m.min_stock ? (
                             <Badge className="bg-red-500/10 text-red-500 border border-red-500/30 text-[9px] font-black uppercase rounded-none">LOW STOCK</Badge>
                           ) : (
                             <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[9px] font-black uppercase rounded-none">HEALTHY</Badge>
                           )}
                        </TableCell>
                        <TableCell className="text-right font-sans font-bold text-sm text-zinc-300">
                           {Number(m.stock_qty).toLocaleString()} {m.unit}
                        </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requisitions (FKP) */}
        <Card className="lg:col-span-1 border-zinc-800 bg-zinc-950/50 backdrop-blur-xl h-fit">
          <CardHeader>
             <CardTitle className="text-sm font-black text-zinc-400 uppercase tracking-tight flex items-center">
                <ClipboardCheck className="mr-2 h-4 w-4 text-emerald-500" /> FKP INBOX
             </CardTitle>
             <CardDescription className="text-[10px] uppercase font-bold text-zinc-600">Scale-out requisitions from PPIC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {pendingPlans.map(plan => (
               <div 
                 key={plan.id}
                 className="p-4 border border-zinc-900 bg-black/40 rounded-sm hover:border-emerald-500/50 transition-all cursor-pointer group"
                 onClick={() => { setSelectedPlan(plan); setIsFKPWizardOpen(true); }}
               >
                 <div className="flex justify-between items-start mb-2">
                    <p className="font-sans text-xs text-white uppercase group-hover:text-emerald-400 font-bold">{plan.batch_no}</p>
                    <Badge className="bg-amber-500 text-black text-[9px] font-black uppercase rounded-none">PENDING ISSUANCE</Badge>
                 </div>
                 <p className="text-[10px] text-zinc-500 uppercase font-black truncate tracking-tighter">{plan.so?.lead?.client_name}</p>
                 <div className="flex justify-between items-center mt-3 border-t border-zinc-900 pt-3">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase">{plan.requisitions.length} Items</p>
                    <ArrowRight className="h-4 w-4 text-zinc-800 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                 </div>
               </div>
             ))}
             {pendingPlans.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-none bg-zinc-900/10">
                   <ShieldCheck className="h-10 w-10 text-zinc-800 mb-2 opacity-20" />
                   <p className="text-[10px] font-black uppercase text-zinc-800 tracking-tight italic font-sans text-center px-4">All requisitions cleared. Warehouse idle.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* FKP Processing Wizard */}
      <Dialog open={isFKPWizardOpen} onOpenChange={setIsFKPWizardOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-900 text-white sm:max-w-[700px]">
          <DialogHeader>
             <DialogTitle className="flex items-center text-3xl font-black italic uppercase tracking-tighter text-white">
                <Beaker className="mr-3 h-8 w-8 text-emerald-500" /> MATERIAL ISSUE INTERLOCK
             </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-6 py-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800">
                     <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Batch Registry</p>
                     <p className="text-sm font-black text-white uppercase">{selectedPlan.batch_no}</p>
                  </div>
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800">
                     <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Production Client</p>
                     <p className="text-sm font-black text-white uppercase">{selectedPlan.so?.lead?.client_name}</p>
                  </div>
               </div>

               <div className="rounded-none border border-zinc-900 overflow-hidden">
                  <Table>
                     <TableHeader className="bg-zinc-900/30">
                        <TableRow className="border-zinc-900">
                           <TableHead className="text-[10px] uppercase font-black text-zinc-500">Resource</TableHead>
                           <TableHead className="text-[10px] uppercase font-black text-zinc-500">Needed</TableHead>
                           <TableHead className="text-[10px] uppercase font-black text-zinc-500">Inventory</TableHead>
                           <TableHead className="text-[10px] uppercase font-black text-zinc-500 text-right">Audit Status</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {selectedPlan.requisitions.map(req => {
                          const isAvailable = Number(req.material.stock_qty) >= Number(req.qty_requested);
                          return (
                             <TableRow key={req.id} className="border-zinc-900">
                                <TableCell className="text-xs uppercase font-bold text-white">{req.material.name}</TableCell>
                                <TableCell className="font-sans text-zinc-300 text-xs">{Number(req.qty_requested).toLocaleString()} {req.material.unit}</TableCell>
                                <TableCell className="font-sans text-zinc-500 text-xs">{Number(req.material.stock_qty).toLocaleString()} {req.material.unit}</TableCell>
                                <TableCell className="text-right">
                                   {isAvailable ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                                   ) : (
                                      <div className="flex items-center gap-2 justify-end">
                                         <span className="text-[8px] font-black text-red-500 uppercase italic">Shortage Detected</span>
                                         <AlertCircle className="h-4 w-4 text-red-500" />
                                      </div>
                                   )}
                                </TableCell>
                             </TableRow>
                          );
                        })}
                     </TableBody>
                  </Table>
               </div>

               {!checkStockAvailability(selectedPlan) && (
                  <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/30">
                     <AlertCircle className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                     <div>
                        <p className="text-[11px] font-black text-red-500 uppercase tracking-tight">CRITICAL FAILURE: Stock Depletion Interlock</p>
                        <p className="text-[10px] text-red-400/80 leading-relaxed uppercase mt-1">
                           Current inventory cannot fulfill this requisition. Manual approval is blocked by the supply chain core logic. 
                           Harap buat Purchase Order (PO) ke Supplier segera.
                        </p>
                     </div>
                  </div>
               )}

               <DialogFooter>
                  <Button 
                    variant="outline" 
                    className="border-zinc-800 text-zinc-500 hover:bg-zinc-900"
                    onClick={() => setIsFKPWizardOpen(false)}
                  >
                     Discard
                  </Button>
                  <Button 
                    disabled={!checkStockAvailability(selectedPlan) || issueMaterialsMutation.isPending}
                    className={`px-10 h-12 font-black uppercase tracking-tight transition-all ${
                       checkStockAvailability(selectedPlan) 
                       ? "bg-white text-black hover:bg-emerald-500 hover:text-white"
                       : "bg-zinc-900 text-zinc-800 cursor-not-allowed opacity-50"
                    }`}
                    onClick={() => issueMaterialsMutation.mutate(selectedPlan.id)}
                  >
                     {issueMaterialsMutation.isPending ? "SUBTRACTING LEDGER..." : "ISSUE MATERIALS & UNLOCK FACTORY"}
                  </Button>
               </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

