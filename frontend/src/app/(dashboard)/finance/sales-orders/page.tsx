"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Search, 
  FileText, 
  ChevronRight, 
  ArrowUpRight,
  Package,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Eye,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";

export default function SalesOrderPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["finance-sales-orders"],
    queryFn: async () => (await api.get("/finance/sales-orders")).data,
  });

  const verifyMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await api.post("/finance/verify-payment", {
        type: "ORDER",
        id: orderId,
        verifiedBy: "FINANCE_OFFICER"
      });
    },
    onSuccess: () => {
      toast.success("Down Payment Verified. Production sequence unlocked.");
      queryClient.invalidateQueries({ queryKey: ["finance-sales-orders"] });
      setIsProofModalOpen(false);
    }
  });

  const filteredOrders = orders?.filter((o: any) => 
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.lead?.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingVerification = orders?.filter((o: any) => o.paymentProofUrl && !o.isPaymentVerified) || [];

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-amber-600" /></div>;

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700 bg-[#FBFBFB] min-h-screen font-inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 italic">Financial Governance</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Sales <span className="text-amber-500">Validation</span> Hub
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Validating Commercial Commitments & Down Payments
           </p>
        </div>
      </div>

      {/* Verification Queue (HUD) */}
      {pendingVerification.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
           {pendingVerification.map((order: any) => (
             <Card key={order.id} className="p-6 bg-white border-none shadow-xl border-l-4 border-amber-500 rounded-2xl group hover:scale-[1.02] transition-all">
                <div className="flex justify-between items-start mb-4">
                   <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase tracking-tight">AWAITING DP</Badge>
                   <span className="text-[10px] font-black text-slate-300">#{order.id}</span>
                </div>
                <h4 className="font-black text-slate-900 uppercase italic text-sm line-clamp-1">{order.lead?.clientName}</h4>
                <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">{formatCurrency(Number(order.totalAmount))}</p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                   <Button 
                    className="flex-1 h-10 bg-slate-900 hover:bg-amber-500 text-white font-black text-[10px] uppercase rounded-xl transition-all"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsProofModalOpen(true);
                    }}
                   >
                      Verify Payment
                   </Button>
                </div>
             </Card>
           ))}
        </div>
      )}

      {/* Main Grid */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
              <div>
                 <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm italic">Master Sales Order Log</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total {orders?.length || 0} Registered Commitments</p>
              </div>
           </div>
           
           <div className="relative w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input 
                placeholder="Search orders, clients, or IDs..." 
                className="pl-12 h-14 bg-slate-50/50 border-none rounded-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-amber-200 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[10px]">Order Protocol</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[10px]">Commercial Value</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Payment Intel</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Lifecycle</TableHead>
              <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[10px]">Audit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders?.map((order: any) => (
              <TableRow key={order.id} className="group hover:bg-slate-50/80 transition-all duration-300 border-b border-slate-50">
                <TableCell className="py-8 pl-10">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black italic shadow-xl group-hover:bg-amber-500 transition-all duration-500">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase italic text-base leading-none">{order.lead?.clientName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-2 flex items-center gap-1">
                        <span className="text-amber-500">ID:</span> {order.orderNumber} • <span className="text-blue-500">PIC:</span> {order.lead?.pic?.name}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-lg tracking-tighter italic">{formatCurrency(Number(order.totalAmount))}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">MOQ: {order.quantity.toLocaleString()} Pcs</span>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  {order.isPaymentVerified ? (
                    <div className="flex flex-col items-center gap-1">
                       <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase py-1 px-4 rounded-lg">VERIFIED</Badge>
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">On {new Date(order.paymentVerifiedAt).toLocaleDateString()}</span>
                    </div>
                  ) : order.paymentProofUrl ? (
                    <div className="flex flex-col items-center gap-2">
                       <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase py-1 px-4 rounded-lg animate-pulse">PENDING VALIDATION</Badge>
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[8px] font-black uppercase text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsProofModalOpen(true);
                        }}
                       >
                         Review Proof <ExternalLink className="h-2 w-2 ml-1" />
                       </Button>
                    </div>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] uppercase py-1 px-4 rounded-lg">AWAITING PROOF</Badge>
                  )}
                </TableCell>

                <TableCell className="text-center">
                   <Badge className={cn(
                     "rounded-xl px-5 py-2 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                     order.status === 'DP_PAID' ? "bg-blue-600 text-white" : 
                     order.status === 'PENDING_DP' ? "bg-amber-100 text-amber-700" : "bg-slate-900 text-white"
                   )}>
                      {order.status.replace('_', ' ')}
                   </Badge>
                </TableCell>

                <TableCell className="text-right pr-10">
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-900 hover:text-white text-slate-300">
                      <ChevronRight className="h-5 w-5" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Payment Proof Modal */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
         <DialogContent className="sm:max-w-[600px] bg-white rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-8 text-white">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Payment <span className="text-amber-500">Verification</span></h3>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-tight mt-1">Audit Protocol for SO #{selectedOrder?.orderNumber}</p>
                  </div>
                  <ShieldCheck className="h-10 w-10 text-amber-500 opacity-50" />
               </div>
            </div>

            <div className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Total Transaction</p>
                     <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{formatCurrency(Number(selectedOrder?.totalAmount || 0))}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Expected DP (30%)</p>
                     <p className="text-2xl font-black text-emerald-600 tracking-tighter italic">{formatCurrency(Number(selectedOrder?.totalAmount || 0) * 0.3)}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-tight text-slate-400 flex items-center gap-2">
                    <Eye className="h-3 w-3" /> Transferred Proof Document
                  </label>
                  <div className="aspect-video w-full bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 group overflow-hidden relative">
                     {selectedOrder?.paymentProofUrl ? (
                       <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                          <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight mb-4">Proof of transfer uploaded by BussDev</p>
                          <a 
                            href={selectedOrder.paymentProofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-tight py-3 px-8 rounded-xl shadow-xl hover:bg-amber-500 transition-all flex items-center gap-2"
                          >
                             Open Full Document <ExternalLink className="h-3 w-3" />
                          </a>
                       </div>
                     ) : (
                       <div className="text-center p-10">
                          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4 opacity-50" />
                          <p className="text-xs font-black text-rose-900/60 uppercase italic">No Proof Document Attached</p>
                       </div>
                     )}
                  </div>
               </div>
            </div>

            <DialogFooter className="p-10 pt-0 flex gap-4">
               <Button 
                variant="outline" 
                className="flex-1 h-16 rounded-2xl border-2 border-slate-100 font-black uppercase text-[10px] tracking-tight hover:bg-slate-50"
                onClick={() => setIsProofModalOpen(false)}
               >
                  Reject & Notify BD
               </Button>
               <Button 
                className="flex-[2] h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] tracking-tight shadow-xl shadow-emerald-100 transition-all"
                onClick={() => verifyMutation.mutate(selectedOrder.id)}
                disabled={verifyMutation.isPending || !selectedOrder?.paymentProofUrl}
              >
                  {verifyMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify & Approve Order"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}

