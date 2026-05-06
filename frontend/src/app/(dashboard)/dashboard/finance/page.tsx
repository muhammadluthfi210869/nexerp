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
  FileText, 
  AlertCircle, 
  CreditCard,
  PlusCircle,
  Search,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Types ---
interface SalesOrder {
  id: string;
  total_amount: number;
  status: "PENDING_DP" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  created_at: string;
  lead: { client_name: string };
  sample: { id: string; name: string };
  invoices: Invoice[];
}

interface Invoice {
  id: string;
  so_id: string;
  type: "DP" | "FINAL_PAYMENT";
  amount_due: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
}

export default function FinanceDashboard() {
  const queryClient = useQueryClient();
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // --- Fetchers ---
  const { data: salesOrders, isLoading: soLoading } = useQuery<SalesOrder[]>({
    queryKey: ["sales-orders"],
    queryFn: async () => {
      const res = await api.get("/commercial/sales-orders");
      return res.data;
    }
  });

  // --- Mutations ---
  const generateInvoiceMutation = useMutation({
    mutationFn: async (payload: Partial<Invoice> & { so_id: string }) => {
      return api.post("/commercial/invoices", payload);
    },
    onSuccess: () => {
      toast.success("Invoice Matrix generated and transmitted.");
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      setIsInvoiceModalOpen(false);
    },
    onError: () => toast.error("Transmission error. Failed to generate invoice.")
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (payload: { invoice_id: string; amount_paid: number; payment_date: string }) => {
      return api.post("/commercial/payments", payload);
    },
    onSuccess: () => {
      toast.success("Payment Verified. Financial Interlock cleared.");
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      setIsPaymentModalOpen(false);
    },
    onError: () => toast.error("Verification failed. Insufficient funds or data error.")
  });

  // --- Helpers ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/50";
      case "PENDING_DP": return "bg-amber-500/10 text-amber-500 border-amber-500/50";
      case "COMPLETED": return "bg-blue-500/10 text-blue-500 border-blue-500/50";
      case "CANCELLED": return "bg-red-500/10 text-red-500 border-red-500/50";
      default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/50";
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "PARTIAL": return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "UNPAID": return "bg-red-500/10 text-red-500 border border-red-500/20";
      default: return "";
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Finance Gate v2.0</h1>
          <p className="text-zinc-500 font-sans text-xs uppercase tracking-tight mt-1">
            <span className="text-emerald-500">◆</span> Billing & Payment Verification Command Center
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-zinc-800 bg-black text-zinc-400 hover:text-white hover:border-zinc-700 font-bold uppercase tracking-tight text-[10px]">
            <Search className="mr-2 h-3 w-3" /> Audit Log
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Order Center */}
        <Card className="lg:col-span-3 border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-emerald-500" /> SALES ORDER MONITORING
                </CardTitle>
                <CardDescription className="text-zinc-500">Real-time status of commercial contracts and factory locks.</CardDescription>
              </div>
              <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-[10px] font-sans">
                {salesOrders?.length || 0} CONTRACTS
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-zinc-900 overflow-hidden bg-black/20">
              <Table>
                <TableHeader className="bg-zinc-900/50">
                  <TableRow className="border-zinc-900 hover:bg-transparent">
                    <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">SO ID</TableHead>
                    <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">Client Entity</TableHead>
                    <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">Transaction Value</TableHead>
                    <TableHead className="text-zinc-500 font-sans text-[10px] uppercase">Operational Gate</TableHead>
                    <TableHead className="text-zinc-500 font-sans text-[10px] uppercase text-center">Invoice Matrix</TableHead>
                    <TableHead className="text-right text-zinc-500 font-sans text-[10px] uppercase">Command</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-zinc-800 italic uppercase tracking-tighter text-2xl font-black">Decrypting Ledger...</TableCell></TableRow>
                  ) : salesOrders?.map(so => (
                    <TableRow key={so.id} className="border-zinc-900 hover:bg-white/[0.02] transition-colors group">
                      <TableCell className="font-sans text-xs text-white group-hover:text-emerald-400">{so.id.split('-')[0]}</TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-zinc-300 uppercase tracking-tight">{so.lead?.client_name}</p>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-zinc-300">
                        IDR {Number(so.total_amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-sans text-[10px] px-2 py-0.5 rounded-none border ${getStatusColor(so.status)}`}>
                          {so.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center flex-wrap">
                          {so.invoices.map(inv => (
                            <button
                              key={inv.id}
                              onClick={() => { setSelectedInvoice(inv); setIsPaymentModalOpen(true); }}
                              className={`text-[9px] px-2 py-1 rounded-sm font-black uppercase transition-all hover:scale-110 flex items-center gap-1 ${getInvoiceStatusColor(inv.status)}`}
                            >
                              <CreditCard className="h-2 w-2" />
                              {inv.type} {inv.status === 'PAID' ? '✓' : ''}
                            </button>
                          ))}
                          {so.invoices.length === 0 && <span className="text-zinc-800 text-[10px] italic font-sans uppercase tracking-tight">Awaiting Invoice Gen</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="h-8 border border-transparent hover:border-zinc-800 hover:bg-zinc-900/50 text-emerald-500"
                          onClick={() => { setSelectedSO(so); setIsInvoiceModalOpen(true); }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">Invoice</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {salesOrders?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20">
                          <p className="text-zinc-800 text-xs uppercase font-bold tracking-[0.3em]">No Commercial Contracts in Database</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Generator Modal */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-900 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center tracking-tighter uppercase text-2xl font-black italic">
              <FileText className="mr-2 h-6 w-6 text-emerald-500" /> GENERATE BILLING
            </DialogTitle>
          </DialogHeader>
          {selectedSO && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              generateInvoiceMutation.mutate({
                id: `INV-${Date.now()}`,
                so_id: selectedSO.id,
                type: (formData.get("type") as "DP" | "FINAL_PAYMENT") || "DP",
                amount_due: Number(formData.get("amount")),
                status: "UNPAID"
              });
            }} className="space-y-6 py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Invoice Category</Label>
                  <Select name="type" defaultValue="DP">
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 focus:ring-emerald-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                      <SelectItem value="DP" className="focus:bg-emerald-500 focus:text-white">DOWN PAYMENT (30% DEFAULT)</SelectItem>
                      <SelectItem value="FINAL_PAYMENT" className="focus:bg-emerald-500 focus:text-white">FINAL SETTLEMENT (FULL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Amount Due (IDR)</Label>
                  <div className="relative">
                    <Input 
                      name="amount" 
                      type="number" 
                      defaultValue={Number(selectedSO.total_amount) * 0.3} 
                      className="bg-zinc-900 border-zinc-800 font-sans h-12 text-xl pl-12 text-emerald-500 focus-visible:ring-emerald-500"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-sans font-bold">Rp</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-900/30 p-4 rounded-none border border-zinc-800/50 space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tight text-center border-b border-zinc-800 pb-2 mb-2">Contract Verification</p>
                <div className="flex justify-between text-xs">
                    <span className="text-zinc-600 uppercase font-bold">SO_Ref</span>
                    <span className="text-white font-sans">{selectedSO.id.split('-')[0]}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-zinc-600 uppercase font-bold">Client</span>
                    <span className="text-white font-sans">{selectedSO.lead?.client_name}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-zinc-800 pt-2 mt-2">
                    <span className="text-zinc-600 uppercase font-black">Total Contract</span>
                    <span className="text-emerald-500 font-black">IDR {Number(selectedSO.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={generateInvoiceMutation.isPending}
                  className="w-full bg-white text-black hover:bg-emerald-500 hover:text-white font-black h-14 tracking-[0.2em] uppercase transition-all"
                >
                   {generateInvoiceMutation.isPending ? "transmitting..." : "Initialize Billing Matrix"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Verification Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-900 text-white sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center tracking-tighter uppercase text-2xl font-black italic">
              <Wallet className="mr-2 h-6 w-6 text-emerald-500" /> FINANCIAL VERIFIER
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              verifyPaymentMutation.mutate({
                invoice_id: selectedInvoice.id,
                amount_paid: Number(formData.get("amount")),
                payment_date: new Date().toISOString()
              });
            }} className="space-y-6 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Amount to Verify (IDR)</Label>
                <div className="relative">
                  <Input 
                    name="amount" 
                    type="number" 
                    defaultValue={Number(selectedInvoice.amount_due)}
                    className="bg-zinc-900 border-zinc-800 font-sans h-14 text-2xl pl-12 text-white focus-visible:ring-emerald-500"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-sans font-bold">Rp</span>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-900/30 rounded-none border border-zinc-800/80">
                <p className="text-[10px] text-zinc-500 mb-2 font-black italic uppercase tracking-tight text-center border-b border-zinc-800 pb-2">Audit Engagement</p>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-zinc-600 font-bold uppercase">Invoice_ID</span>
                    <span className="text-white font-sans text-right">{selectedInvoice.id}</span>
                    <span className="text-zinc-600 font-bold uppercase">Billing_Type</span>
                    <span className="text-amber-500 font-black text-right uppercase tracking-tighter">{selectedInvoice.type}</span>
                    <span className="text-zinc-600 font-bold uppercase">Due_Value</span>
                    <span className="text-white font-sans text-right font-bold">IDR {Number(selectedInvoice.amount_due).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                   type="submit" 
                   disabled={verifyPaymentMutation.isPending}
                   className="w-full bg-emerald-600 text-white hover:bg-emerald-500 font-black h-16 tracking-[0.3em] uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                   {verifyPaymentMutation.isPending ? "PROCESSING..." : "VERIFY & UNLOCK FACTORY"}
                </Button>
                
                {selectedInvoice.type === 'DP' && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20">
                     <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                     <p className="text-[9px] text-amber-500 font-bold uppercase leading-relaxed tracking-tight">
                        Security Interlock Notice: Verifying this DP will automatically switch the SalesOrder to ACTIVE and trigger Production Material Requisitions.
                     </p>
                  </div>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

