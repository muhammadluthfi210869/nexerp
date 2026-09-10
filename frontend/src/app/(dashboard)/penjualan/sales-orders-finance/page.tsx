"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Search, 
  FileText, 
  ChevronRight, 
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Eye,
  AlertCircle,
  Loader2
} from "lucide-react";
import { DnaInput, DnaButton, DnaBadge, TableWrapper } from "@/components/dna";
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
import { TableShell } from "@/components/layout/TableShell";
import { FinalDocumentPdfButton } from "@/components/documents/FinalDocumentPdfButton";

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
    <TableShell
      title="Sales"
      titleAccent="Validation Hub"
      subtitle="Validating Commercial Commitments & Down Payments"
    >

      {/* Verification Queue (HUD) */}
      {pendingVerification.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500 mb-6">
           {pendingVerification.map((order: any) => (
             <div key={order.id} className="p-6 bg-white border border-slate-200 shadow-sm border-l-4 border-amber-500 rounded-2xl group hover:scale-[1.02] transition-all">
                <div className="flex justify-between items-start mb-4">
                   <DnaBadge status="warning">AWAITING DP</DnaBadge>
                   <span className="text-[10px] font-black text-slate-300">#{order.id}</span>
                </div>
                <h4 className="font-black text-slate-900 uppercase italic text-sm line-clamp-1">{order.lead?.clientName}</h4>
                <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">{formatCurrency(Number(order.totalAmount))}</p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                    <DnaButton 
                      variant="primary"
                      className="flex-1 h-10 bg-blue-600 hover:bg-amber-500 rounded-xl"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsProofModalOpen(true);
                      }}
                    >
                      Verify Payment
                    </DnaButton>
                </div>
              </div>
           ))}
        </div>
      )}

      {/* Main Grid */}
      <TableWrapper
        filters={
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
             <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                <div>
                   <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm italic">Master Sales Order Log</h3>
                   <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Total {orders?.length || 0} Registered Commitments</p>
                </div>
             </div>
             
             <div className="relative w-full md:w-96">
                <DnaInput 
                  icon={<Search className="h-4 w-4" />}
                  placeholder="Search orders, clients, or IDs..." 
                  className="bg-slate-50 border-none rounded-xl text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
        }
      >
        <Table className="table-dense">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="py-4 pl-6 font-black text-slate-400 uppercase tracking-tight text-[10px]">Order Protocol</TableHead>
              <TableHead className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px]">Commercial Value</TableHead>
              <TableHead className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Payment Intel</TableHead>
              <TableHead className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Lifecycle</TableHead>
              <TableHead className="pr-6 text-right py-4 font-black text-slate-400 uppercase tracking-tight text-[10px]">Audit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders?.map((order: any) => (
              <TableRow key={order.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black italic shadow-sm group-hover:bg-amber-500 transition-all duration-500">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase italic text-base leading-none">{order.lead?.clientName}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mt-2 flex items-center gap-1">
                        <span className="text-amber-500 font-bold">ID:</span> {order.orderNumber} • <span className="text-blue-500 font-bold">PIC:</span> {order.lead?.pic?.name}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-sm tracking-tighter font-mono tabular-nums">{formatCurrency(Number(order.totalAmount))}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">MOQ: {order.quantity.toLocaleString()} Pcs</span>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  {order.isPaymentVerified ? (
                    <div className="flex flex-col items-center gap-1">
                       <DnaBadge status="success">VERIFIED</DnaBadge>
                       <span className="text-[8px] font-medium text-slate-400 uppercase tracking-tight">On {new Date(order.paymentVerifiedAt).toLocaleDateString()}</span>
                    </div>
                  ) : order.paymentProofUrl ? (
                    <div className="flex flex-col items-center gap-2">
                       <DnaBadge status="warning" className="animate-pulse">PENDING VALIDATION</DnaBadge>
                       <DnaButton 
                        variant="ghost"
                        className="h-6 text-[8px] text-blue-600 hover:bg-blue-50"
                        icon={<ExternalLink className="h-2 w-2" />}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsProofModalOpen(true);
                        }}
                       >
                         Review Proof
                       </DnaButton>
                    </div>
                  ) : (
                    <DnaBadge status="default">AWAITING PROOF</DnaBadge>
                  )}
                </TableCell>

                <TableCell className="text-center">
                   <DnaBadge status={order.status === 'DP_PAID' ? 'info' : order.status === 'PENDING_DP' ? 'warning' : 'default'}>
                      {order.status.replace('_', ' ')}
                   </DnaBadge>
                </TableCell>

                <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <FinalDocumentPdfButton
                        documentType="QUOTATION"
                        documentNumber={order.orderNumber}
                        data={{
                          clientName: order.lead?.clientName || "Unknown",
                          brandName: order.brandName || "",
                          items: order.items || [],
                          totalAmount: order.totalAmount,
                          notes: `Sales Order ${order.orderNumber}`,
                        }}
                        label="PDF"
                      />
                      <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-400">
                        <ChevronRight className="h-4 w-4" />
                      </DnaButton>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Payment Proof Modal */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
         <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-blue-600 p-8 text-white">
               <div className="flex justify-between items-center">
                  <div>
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Payment <span className="text-amber-400">Verification</span></h3>
                     <DialogDescription className="text-blue-200 font-medium uppercase text-[9px] tracking-tight mt-1">Audit Protocol for SO #{selectedOrder?.orderNumber}</DialogDescription>
                  </div>
                  <ShieldCheck className="h-10 w-10 text-amber-400 opacity-50" />
               </div>
            </div>

            <div className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Total Transaction</p>
                     <p className="text-2xl font-black text-slate-900 tracking-tighter italic font-mono tabular-nums">{formatCurrency(Number(selectedOrder?.totalAmount || 0))}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Expected DP (30%)</p>
                     <p className="text-2xl font-black text-emerald-600 tracking-tighter italic font-mono tabular-nums">{formatCurrency(Number(selectedOrder?.totalAmount || 0) * 0.3)}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-tight text-slate-400 flex items-center gap-2">
                    <Eye className="h-3 w-3" /> Transferred Proof Document
                  </label>
                  <div className="aspect-video w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 group overflow-hidden relative">
                     {selectedOrder?.paymentProofUrl ? (
                       <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                          <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-tight mb-4">Proof of transfer uploaded by BussDev</p>
                          <a 
                            href={selectedOrder.paymentProofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-tight py-3 px-8 rounded-xl shadow-sm hover:bg-amber-500 transition-all flex items-center gap-2"
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
               <DnaButton 
                variant="outline"
                className="flex-1 h-16 rounded-2xl"
                onClick={() => setIsProofModalOpen(false)}
               >
                  Reject & Notify BD
               </DnaButton>
               <DnaButton 
                variant="primary"
                className="flex-[2] h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                onClick={() => verifyMutation.mutate(selectedOrder.id)}
                disabled={verifyMutation.isPending || !selectedOrder?.paymentProofUrl}
              >
                  {verifyMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify & Approve Order"}
               </DnaButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </TableShell>
  );
}
