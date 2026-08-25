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
  Truck, 
  CheckCircle2, 
  ClipboardList, 
  ArrowRightLeft,
  Navigation,
  Boxes,
  Clock,
  Package
} from "lucide-react";
import { KpiCard } from "@/components/dna/KpiCard";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DashboardShell } from "@/components/layout/DashboardShell";

// --- Types ---
interface FinishedGood {
  id: string;
  wo: { 
     id: string;
     batch_no: string; 
     so: { 
        id: string;
        lead: { client_name: string } 
     } 
  };
  stock_qty: number;
}

interface Shipment {
  id: string;
  so_id: string;
  logistics_id: string;
  status: "PACKING" | "SHIPPED" | "DELIVERED";
  tracking_no: string;
  shipped_at: string;
  delivered_at: string;
  so: { lead: { client_name: string } };
}

export default function FulfillmentDashboard() {
  const queryClient = useQueryClient();
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [selectedSO, setSelectedSO] = useState<{ id: string; lead: { client_name: string } } | null>(null);

  // --- Fetchers ---
  const { data: finishedGoods } = useQuery<FinishedGood[]>({
    queryKey: ["finished-goods"],
    queryFn: async () => {
      // I'll fetch 'production-plans' and check if finishedGoods exist.
      const plans = await api.get("/production-plans");
      return plans.data
        .filter((p: { status: string; finishedGoods: FinishedGood | null }) => p.status === "DONE" && p.finishedGoods)
        .map((p: any) => ({
          ...p.finishedGoods,
          stock_qty: Number(p.finishedGoods.stock_qty ?? p.finishedGoods.stockQty ?? 0),
          wo: { ...p, batch_no: p.batch_no ?? p.batchNo, so: { ...p.so, lead: { ...p.so?.lead, client_name: p.so?.lead?.client_name ?? p.so?.lead?.clientName ?? "" } } },
        }));
    }
  });

  const { data: shipments } = useQuery<Shipment[]>({
    queryKey: ["shipments"],
    queryFn: async () => {
      try {
        const res = await api.get("/fulfillment/shipments");
        return res.data;
      } catch {
        return [];
      }
    }
  });

  // --- Mutations ---
  const generateShipment = useMutation({
    mutationFn: async (payload: Partial<Shipment>) => {
      return api.post("/fulfillment/shipments", payload);
    },
    onSuccess: () => {
      toast.success("Surat Jalan (Shipment) Generated. Packing initiated.");
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      setIsShipmentModalOpen(false);
    }
  });

  const updateShipmentStatus = useMutation({
     mutationFn: async ({ id, status }: { id: string; status: string }) => {
        return api.patch(`/fulfillment/shipments/${id}/status`, { status });
     },
     onSuccess: () => {
        toast.success("Shipment Status Updated. Inventory Adjusted.");
        queryClient.invalidateQueries({ queryKey: ["shipments"] });
        queryClient.invalidateQueries({ queryKey: ["finished-goods"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-trends"] });
     }
  });

  return (
    <DashboardShell
      title="Fulfillment"
      titleAccent="Hub"
      subtitle="Finished Goods Distribution & Retention Trigger"
    >
      {(() => {
        const fgTotal = finishedGoods?.reduce((sum, fg) => sum + fg.stock_qty, 0) || 0;
        const pendingShipments = shipments?.filter(s => s.status === "SHIPPED" || s.status === "PACKING").length || 0;
        const deliveredToday = shipments?.filter(s => s.status === "DELIVERED").length || 0;
        return (
          <div className="grid grid-cols-3 gap-8 mb-6">
            <KpiCard label="FG Inventory" value={String(fgTotal)} targetPct={50} icon={<Package />} />
            <KpiCard label="Pending Shipments" value={String(pendingShipments)} targetPct={50} icon={<Truck />} />
            <KpiCard label="Delivered Today" value={String(deliveredToday)} targetPct={50} icon={<CheckCircle2 />} />
          </div>
        );
      })()}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Finished Goods Inventory */}
        <Card className="lg:col-span-1 border-gray-200 bg-white h-fit">
           <CardHeader>
              <CardTitle className="text-sm font-black text-gray-600 uppercase tracking-[0.2em] flex items-center">
                 <Boxes className="mr-2 h-4 w-4 text-emerald-500" /> STOK BARANG JADI (FG)
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold text-zinc-600">Post-production inventory ledger</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              {finishedGoods?.map(fg => (
                <div key={fg.id} className="p-4 bg-gray-50 border border-gray-200 rounded-sm hover:border-blue-500/50 transition-all cursor-default group">
                   <div className="flex justify-between items-start mb-1">
                       <p className="text-[10px] font-sans text-gray-900 font-black uppercase italic tracking-tighter">{fg.wo.batch_no}</p>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[8px] font-black uppercase">READY</Badge>
                   </div>
                   <p className="text-xs font-bold text-gray-600 uppercase">{fg.wo.so.lead.client_name}</p>
                   <div className="flex justify-between items-end mt-4">
                       <div className="text-3xl font-black text-gray-900 font-sans">{fg.stock_qty} <span className="text-xs text-zinc-600 uppercase font-bold">Units</span></div>
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="text-[10px] font-black text-blue-500 uppercase hover:text-white p-0"
                        onClick={() => { setSelectedSO(fg.wo.so); setIsShipmentModalOpen(true); }}
                      >
                         SHIPPABLE <ArrowRightLeft className="ml-1 h-3 w-3" />
                      </Button>
                   </div>
                </div>
              ))}
              {(!finishedGoods || finishedGoods.length === 0) && (
                 <div className="py-20 text-center opacity-20 bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center">
                    <Clock className="h-10 w-10 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-tight">Awaiting QC-Done Batches</p>
                 </div>
              )}
           </CardContent>
        </Card>

        {/* Shipment Tracker */}
        <Card className="lg:col-span-2 border-gray-200 bg-white">
           <CardHeader>
               <CardTitle className="text-lg font-bold text-gray-900 uppercase tracking-tighter flex items-center">
                 <Truck className="mr-2 h-5 w-5 text-blue-500" /> ACTIVE SHIPMENT STREAM
              </CardTitle>
           </CardHeader>
           <CardContent>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                 <Table>
                    <TableHeader className="bg-gray-50">
                       <TableRow className="border-gray-200">
                          <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Surat Jalan</TableHead>
                          <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Destination</TableHead>
                          <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Status</TableHead>
                          <TableHead className="w-[150px]"></TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {shipments?.map(ship => (
                          <TableRow key={ship.id} className="border-gray-200 hover:bg-gray-50">
                             <TableCell className="font-sans text-xs font-black text-blue-400 uppercase">{ship.id}</TableCell>
                              <TableCell className="text-xs font-bold text-gray-900 uppercase">{ship.so.lead.client_name}</TableCell>
                             <TableCell>
                                <Badge className={`text-[9px] font-black uppercase rounded-none border ${
                                   ship.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 
                                   'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                }`}>
                                   {ship.status}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right">
                                {ship.status === 'PACKING' && (
                                   <Button size="sm" variant="outline" className="text-[9px] h-7 border-gray-200" onClick={() => updateShipmentStatus.mutate({ id: ship.id, status: 'SHIPPED' })}>
                                      SHIPPED
                                   </Button>
                                )}
                                {ship.status === 'SHIPPED' && (
                                   <Button size="sm" className="text-[9px] h-7 bg-emerald-500 text-black hover:bg-white" onClick={() => updateShipmentStatus.mutate({ id: ship.id, status: 'DELIVERED' })}>
                                      DELIVERED
                                   </Button>
                                )}
                                {ship.status === 'DELIVERED' && (
                                   <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-auto" />
                                )}
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </div>
           </CardContent>
        </Card>
      </div>

      <Dialog open={isShipmentModalOpen} onOpenChange={setIsShipmentModalOpen}>
          <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center text-2xl font-black italic uppercase tracking-tighter text-blue-500">
                   <ClipboardList className="mr-3 h-7 w-7 text-blue-500" /> GENERATE SURAT JALAN
               </DialogTitle>
            </DialogHeader>
            {selectedSO && (
               <div className="space-y-6 py-4">
                  <div className="p-4 bg-white rounded-none border border-gray-200">
                     <p className="text-[9px] text-zinc-500 font-black uppercase mb-1">Shipping Entity</p>
                      <p className="text-lg font-black text-gray-900 uppercase">{selectedSO.lead.client_name}</p>
                     <p className="text-xs text-zinc-600 font-sans mt-1">SO ID: {selectedSO.id}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20">
                     <Navigation className="h-5 w-5 text-blue-500" />
                     <p className="text-[10px] text-blue-400 leading-relaxed uppercase">Logistics Trigger: Creating this document will move the Finished Good from the internal ledger to the delivery stream.</p>
                  </div>

                  <DialogFooter>
                     <Button 
                       className="w-full bg-white text-black font-black uppercase tracking-tight h-14 hover:bg-blue-500 hover:text-white transition-all"
                       onClick={() => {
                          generateShipment.mutate({
                             so_id: selectedSO.id,
                             logistics_id: "00000000-0000-0000-0000-000000000000", // Placeholder for actual ID from session
                             status: "PACKING"
                          });
                       }}
                     >
                        Confirm Dispatch
                     </Button>
                  </DialogFooter>
               </div>
            )}
         </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

