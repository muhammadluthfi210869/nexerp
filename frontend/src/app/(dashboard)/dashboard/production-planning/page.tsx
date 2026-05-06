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
  Factory, 
  ClipboardList, 
  PlusCircle, 
  Settings2,
  Box
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Types ---
interface SalesOrder {
  id: string;
  status: string;
  quantity: number;
  lead: { client_name: string };
  sample: { id: string; name: string };
}

interface ProductionPlan {
  id: string;
  batch_no: string;
  status: "PLANNING" | "READY" | "ON_PROGRESS" | "DONE";
  so: { lead: { client_name: string } };
  requisitions: {
    id: string;
    material_id: string;
    material: {
      id: string;
      name: string;
      code: string;
      unit: string;
    };
    qty_requested: number;
    qty_issued: number;
  }[];
}

export default function PPICDashboard() {
  const queryClient = useQueryClient();
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [isFRPModalOpen, setIsFRPModalOpen] = useState(false);

  // --- Fetchers ---
  const { data: salesOrders } = useQuery<SalesOrder[]>({
    queryKey: ["active-so"],
    queryFn: async () => {
      const res = await api.get("/commercial/sales-orders");
      return res.data.filter((so: { status: string }) => so.status === "ACTIVE");
    }
  });

  const { data: productionPlans, isLoading: plansLoading } = useQuery<ProductionPlan[]>({
    queryKey: ["production-plans"],
    queryFn: async () => {
      const res = await api.get("/production-plans");
      return res.data;
    }
  });

  // --- Mutations ---
  const generateFRP = useMutation({
    mutationFn: async (payload: Partial<ProductionPlan> & { so_id: string }) => {
      return api.post("/production-plans", payload);
    },
    onSuccess: () => {
      toast.success("FRP Locked. FKP Matrix automatically calculated & transmitted to Warehouse.");
      queryClient.invalidateQueries({ queryKey: ["production-plans"] });
      setIsFRPModalOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || "Critical error during factory scale-out.")
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-1000 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">PPIC Command Center v1.0</h1>
          <p className="text-zinc-500 font-sans text-xs uppercase tracking-tight mt-1">
            <span className="text-emerald-500">▶</span> Factory Response Planning (FRP) & Supply Chain Interlock
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Active SO Gate */}
        <Card className="lg:col-span-1 border-zinc-800 bg-zinc-950/50 backdrop-blur-xl h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-black text-zinc-400 uppercase tracking-tight flex items-center">
              <ClipboardList className="mr-2 h-4 w-4 text-emerald-500" /> ACTIVE SO PULL
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold text-zinc-600">Contracts cleared by Finance Gate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {salesOrders?.map(so => (
              <div 
                key={so.id} 
                className="p-3 border border-zinc-900 bg-black/40 rounded-sm hover:border-emerald-500/50 transition-all cursor-pointer group"
                onClick={() => { setSelectedSO(so); setIsFRPModalOpen(true); }}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-sans text-zinc-500">{so.id.split('-')[0]}</p>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase">ACTIVE</Badge>
                </div>
                <p className="text-xs font-bold text-white group-hover:text-emerald-400 truncate uppercase">{so.lead?.client_name}</p>
                <div className="flex justify-between items-center mt-2 border-t border-zinc-900 pt-2">
                   <p className="text-[10px] text-zinc-600">Qty: <span className="text-white font-sans">{so.quantity} Units</span></p>
                   <PlusCircle className="h-3 w-3 text-zinc-800 group-hover:text-emerald-500" />
                </div>
              </div>
            ))}
            {(!salesOrders || salesOrders.length === 0) && (
              <div className="py-12 flex flex-col items-center justify-center opacity-20 bg-zinc-900/50 rounded border border-dashed border-zinc-800">
                <Settings2 className="h-8 w-8 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-tight">No Active SO Found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FRP Master Table */}
        <Card className="lg:col-span-3 border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                   <CardTitle className="text-lg font-bold text-white uppercase tracking-tighter">FRP OPERATIONAL TRACKER</CardTitle>
                   <CardDescription className="text-zinc-500">Live monitoring of mass-production work orders and material requisitions.</CardDescription>
                </div>
                <div className="flex gap-4 font-sans text-[10px]">
                   <div className="flex items-center gap-1 text-zinc-500"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> PLANNING</div>
                   <div className="flex items-center gap-1 text-zinc-500"><span className="w-2 h-2 rounded-full bg-blue-500" /> READY</div>
                </div>
             </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-sm border border-zinc-900 overflow-hidden">
               <Table>
                 <TableHeader className="bg-zinc-900/50">
                   <TableRow className="border-zinc-900 hover:bg-transparent">
                      <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">Batch No</TableHead>
                      <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">Client Entity</TableHead>
                      <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">FKP Status</TableHead>
                      <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">Operational Stage</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {productionPlans?.map(plan => (
                      <TableRow key={plan.id} className="border-zinc-900 hover:bg-white/[0.01]">
                        <TableCell className="font-sans text-xs text-white uppercase">{plan.batch_no}</TableCell>
                        <TableCell className="text-sm font-bold text-zinc-300 uppercase">{plan.so?.lead?.client_name}</TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <Box className="h-3 w-3 text-zinc-600" />
                              <span className="text-[10px] font-sans text-zinc-500">{plan.requisitions?.length || 0} ITEMS SCALE-OUT</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <Badge 
                            variant="outline" 
                            className={`rounded-none border px-2 py-0.5 text-[9px] font-black uppercase ${
                              plan.status === 'READY' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40' :
                              plan.status === 'PLANNING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/40' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/40'
                            }`}
                           >
                             {plan.status}
                           </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!productionPlans || productionPlans.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-zinc-800 font-sans text-[10px] uppercase tracking-[0.4em]">
                           No Factory Production Plans Initiated
                        </TableCell>
                      </TableRow>
                    )}
                 </TableBody>
               </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FRP Initiation Modal */}
      <Dialog open={isFRPModalOpen} onOpenChange={setIsFRPModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-900 text-white sm:max-w-[500px]">
          <DialogHeader>
             <DialogTitle className="flex items-center text-2xl font-black italic uppercase tracking-tighter">
                <Factory className="mr-2 h-6 w-6 text-emerald-500" /> INITIALIZE PRODUCTION
             </DialogTitle>
          </DialogHeader>
          {selectedSO && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              generateFRP.mutate({
                so_id: selectedSO.id,
                batch_no: formData.get("batch_no") as string,
                status: "PLANNING"
              });
            }} className="space-y-6 py-4">
               <div className="space-y-4">
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-none space-y-2">
                     <p className="text-[10px] text-zinc-500 font-black uppercase text-center border-b border-zinc-800 pb-2 mb-2">Contract Data Extract</p>
                     <div className="flex justify-between text-xs">
                        <span className="text-zinc-600 font-bold uppercase">Client:</span>
                        <span className="text-white font-sans uppercase">{selectedSO.lead?.client_name}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-zinc-600 font-bold uppercase">Batch Scale:</span>
                        <span className="text-white font-sans">{selectedSO.quantity} units</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Internal Batch Number</Label>
                     <Input 
                        name="batch_no"
                        placeholder="e.g. PN-2023-B01"
                        className="bg-zinc-900 border-zinc-800 h-12 font-sans text-lg focus:ring-emerald-500"
                        required
                     />
                  </div>

                  <div className="bg-emerald-500/5 p-3 rounded border border-emerald-500/20 flex gap-3">
                     <Settings2 className="h-5 w-5 text-emerald-500 mt-1 shrink-0" />
                     <div>
                        <p className="text-[10px] text-emerald-500 font-black uppercase">Auto-Calculate Logic Active</p>
                        <p className="text-[9px] text-emerald-400/70 leading-relaxed uppercase">
                           Generating this work order will trigger the recursive scale-out of the R&D formula. 
                           Warehouse will receive a requisition of exactly <span className="font-black">{(selectedSO.quantity * 100).toLocaleString()}mg</span> base volume adjustment.
                        </p>
                     </div>
                  </div>
               </div>

               <DialogFooter>
                  <Button type="submit" disabled={generateFRP.isPending} className="w-full bg-white text-black hover:bg-emerald-500 hover:text-white font-black h-14 tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                     {generateFRP.isPending ? "Calculating Matrix..." : "LOCK FRP & TRANSMIT FKP"}
                  </Button>
               </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

