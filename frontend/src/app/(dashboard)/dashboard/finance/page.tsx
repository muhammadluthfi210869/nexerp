"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
} from "@/components/dna/DnaTable";
import {
  DnaCard,
  DnaCardContent,
  DnaCardHeader,
  DnaCardTitle,
  DnaCardDescription,
} from "@/components/dna/DnaCard";
import { DnaBadge } from "@/components/dna";
import { DnaButton } from "@/components/dna";
import { 
  FileText, 
  AlertCircle, 
  CreditCard,
  PlusCircle,
  Search,
  Wallet,
  DollarSign,
  Factory
} from "lucide-react";
import { KpiCard } from "@/components/dna/KpiCard";
import { toast } from "sonner";
import { useState } from "react";
import {
  DnaDialog,
  DnaDialogContent,
  DnaDialogHeader,
  DnaDialogTitle,
  DnaDialogFooter,
} from "@/components/dna";
import { DnaInput } from "@/components/dna/DnaInput";
import { DnaLabel } from "@/components/dna/DnaLabel";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/dna/DnaSelectCompound";
import { DashboardShell } from "@/components/layout/DashboardShell";

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
    <DashboardShell
      title="Finance"
      titleAccent="Gate v2.0"
      subtitle="Billing & Payment Verification Command Center"
      actions={
        <DnaButton variant="outline" size="sm" className="border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 font-bold uppercase tracking-tight text-[10px]">
          <Search className="mr-2 h-3 w-3" /> Audit Log
        </DnaButton>
      }
    >
      {(() => {
        const pendingDP = salesOrders?.filter(so => so.status === "PENDING_DP").length || 0;
        const activeSO = salesOrders?.filter(so => so.status === "ACTIVE").length || 0;
        return (
          <div className="grid grid-cols-3 gap-8 mb-6">
            <KpiCard label="Total SO" value={String(salesOrders?.length || 0)} targetPct={50} icon={<FileText />} />
            <KpiCard
              label="Pending DP"
              value={String(pendingDP)}
              targetPct={pendingDP === 0 ? 100 : Math.max(0, 100 - pendingDP * 10)}
              icon={<DollarSign />}
            />
            <KpiCard label="Ready to Produce" value={String(activeSO)} targetPct={50} icon={<Factory />} />
          </div>
        );
      })()}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Order Center */}
        <DnaCard className="lg:col-span-3 border-gray-200 bg-white">
          <DnaCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <DnaCardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-emerald-500" /> SALES ORDER MONITORING
                </DnaCardTitle>
                <DnaCardDescription className="text-zinc-500">Real-time status of commercial contracts and factory locks.</DnaCardDescription>
              </div>
              <DnaBadge variant="outline" className="border-gray-200 text-zinc-500 text-[10px] font-sans">
                {salesOrders?.length || 0} CONTRACTS
              </DnaBadge>
            </div>
          </DnaCardHeader>
          <DnaCardContent>
            <div className="rounded-md border border-gray-200 overflow-hidden bg-gray-50">
              <DnaTable>
                <DnaTableHead className="bg-gray-50">
                  <DnaTableRow className="border-gray-200 hover:bg-transparent">
                    <DnaTh className="text-zinc-500 font-sans text-[10px] uppercase">SO ID</DnaTh>
                    <DnaTh className="text-zinc-500 font-sans text-[10px] uppercase">Client Entity</DnaTh>
                    <DnaTh className="text-zinc-500 font-sans text-[10px] uppercase">Transaction Value</DnaTh>
                    <DnaTh className="text-zinc-500 font-sans text-[10px] uppercase">Operational Gate</DnaTh>
                    <DnaTh className="text-zinc-500 font-sans text-[10px] uppercase text-center">Invoice Matrix</DnaTh>
                    <DnaTh className="text-right text-zinc-500 font-sans text-[10px] uppercase">Command</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {soLoading ? (
                    <DnaTableRow><DnaTd colSpan={6} className="text-center py-20 text-gray-400 italic uppercase tracking-tighter text-2xl font-black">Decrypting Ledger...</DnaTd></DnaTableRow>
                  ) : salesOrders?.map(so => (
                    <DnaTableRow key={so.id} className="border-gray-200 hover:bg-gray-50 transition-colors group">
                      <DnaTd className="font-sans text-xs text-gray-900 group-hover:text-emerald-400">{so.id.split('-')[0]}</DnaTd>
                      <DnaTd>
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{so.lead?.client_name}</p>
                      </DnaTd>
                      <DnaTd className="font-sans text-sm text-gray-900">
                        IDR {Number(so.total_amount).toLocaleString()}
                      </DnaTd>
                      <DnaTd>
                        <DnaBadge variant="outline" className={`font-sans text-[10px] px-2 py-0.5 rounded-none border ${getStatusColor(so.status)}`}>
                          {so.status}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd>
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
                          {so.invoices.length === 0 && <span className="text-gray-400 text-[10px] italic font-sans uppercase tracking-tight">Awaiting Invoice Gen</span>}
                        </div>
                      </DnaTd>
                      <DnaTd className="text-right">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-8 border border-transparent hover:border-gray-200 hover:bg-gray-50 text-emerald-500"
                          onClick={() => { setSelectedSO(so); setIsInvoiceModalOpen(true); }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">Invoice</span>
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                  {salesOrders?.length === 0 && (
                    <DnaTableRow>
                      <DnaTd colSpan={6} className="text-center py-20">
                          <p className="text-gray-400 text-xs uppercase font-bold tracking-[0.3em]">No Commercial Contracts in Database</p>
                      </DnaTd>
                    </DnaTableRow>
                  )}
                </DnaTableBody>
              </DnaTable>
            </div>
          </DnaCardContent>
        </DnaCard>
      </div>

      {/* Invoice Generator Modal */}
      <DnaDialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DnaDialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[500px]">
          <DnaDialogHeader>
            <DnaDialogTitle className="flex items-center tracking-tighter uppercase text-2xl font-black italic">
              <FileText className="mr-2 h-6 w-6 text-emerald-500" /> GENERATE BILLING
            </DnaDialogTitle>
          </DnaDialogHeader>
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
                  <DnaLabel className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Invoice Category</DnaLabel>
                  <Select name="type" defaultValue="DP">
                    <SelectTrigger className="bg-white border-gray-200 h-12 focus:ring-emerald-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                      <SelectItem value="DP" className="focus:bg-emerald-500 focus:text-white">DOWN PAYMENT (30% DEFAULT)</SelectItem>
                      <SelectItem value="FINAL_PAYMENT" className="focus:bg-emerald-500 focus:text-white">FINAL SETTLEMENT (FULL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <DnaLabel className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Amount Due (IDR)</DnaLabel>
                  <div className="relative">
                    <DnaInput
                      name="amount"
                      type="number"
                      defaultValue={Number(selectedSO.total_amount) * 0.3}
                      className="bg-white border-gray-200 font-sans h-12 text-xl pl-12 text-emerald-500 focus-visible:ring-emerald-500"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-sans font-bold">Rp</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-none border border-gray-200 space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tight text-center border-b border-gray-200 pb-2 mb-2">Contract Verification</p>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500 uppercase font-bold">SO_Ref</span>
                    <span className="text-gray-900 font-sans">{selectedSO.id.split('-')[0]}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500 uppercase font-bold">Client</span>
                    <span className="text-gray-900 font-sans">{selectedSO.lead?.client_name}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-500 uppercase font-black">Total Contract</span>
                    <span className="text-emerald-500 font-black">IDR {Number(selectedSO.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <DnaDialogFooter>
                <DnaButton
                  type="submit"
                  disabled={generateInvoiceMutation.isPending}
                  className="w-full bg-white text-black hover:bg-emerald-500 hover:text-white font-black h-14 tracking-[0.2em] uppercase transition-all"
                >
                   {generateInvoiceMutation.isPending ? "transmitting..." : "Initialize Billing Matrix"}
                </DnaButton>
              </DnaDialogFooter>
            </form>
          )}
        </DnaDialogContent>
      </DnaDialog>

      {/* Payment Verification Modal */}
      <DnaDialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DnaDialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[450px]">
          <DnaDialogHeader>
            <DnaDialogTitle className="flex items-center tracking-tighter uppercase text-2xl font-black italic">
              <Wallet className="mr-2 h-6 w-6 text-emerald-500" /> FINANCIAL VERIFIER
            </DnaDialogTitle>
          </DnaDialogHeader>
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
                <DnaLabel className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Amount to Verify (IDR)</DnaLabel>
                <div className="relative">
                  <DnaInput
                    name="amount"
                    type="number"
                    defaultValue={Number(selectedInvoice.amount_due)}
                    className="bg-white border-gray-200 font-sans h-14 text-2xl pl-12 text-gray-900 focus-visible:ring-emerald-500"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-sans font-bold">Rp</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-none border border-gray-200">
                <p className="text-[10px] text-zinc-500 mb-2 font-black italic uppercase tracking-tight text-center border-b border-gray-200 pb-2">Audit Engagement</p>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-gray-500 font-bold uppercase">Invoice_ID</span>
                    <span className="text-gray-900 font-sans text-right">{selectedInvoice.id}</span>
                    <span className="text-gray-500 font-bold uppercase">Billing_Type</span>
                    <span className="text-amber-500 font-black text-right uppercase tracking-tighter">{selectedInvoice.type}</span>
                    <span className="text-gray-500 font-bold uppercase">Due_Value</span>
                    <span className="text-gray-900 font-sans text-right font-bold">IDR {Number(selectedInvoice.amount_due).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <DnaButton
                   type="submit"
                   disabled={verifyPaymentMutation.isPending}
                   className="w-full bg-emerald-600 text-white hover:bg-emerald-500 font-black h-16 tracking-[0.3em] uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                   {verifyPaymentMutation.isPending ? "PROCESSING..." : "VERIFY & UNLOCK FACTORY"}
                </DnaButton>

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
        </DnaDialogContent>
      </DnaDialog>
    </DashboardShell>
  );
}

