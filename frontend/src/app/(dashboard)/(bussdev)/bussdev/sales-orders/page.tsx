"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  FileText,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Trash2,
  Calculator,
  Download,
  Loader2
} from "lucide-react";
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
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SalesOrdersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Queries
  const { data: orders, isLoading } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: async () => (await api.get("/commercial/sales-orders")).data,
  });

  const { data: leads } = useQuery({
    queryKey: ["bussdev-leads"],
    queryFn: async () => (await api.get("/bussdev/leads")).data,
  });

  const { data: taxes } = useQuery({
    queryKey: ["master-taxes"],
    queryFn: async () => (await api.get("/finance/taxes")).data,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/commercial/sales-orders", payload)).data;
    },
    onSuccess: () => {
      toast.success("Sales Order created successfully!");
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create order");
    }
  });

  const filteredOrders = orders?.filter((o: any) =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.lead?.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell
      title="Sales Order"
      titleAccent="Central"
      subtitle="Detailed Commercial Commitments & Financial Gating"
      actions={
        null // Hidden per Protocol V4 (Automated SO only)
      }
    >
      <div className="space-y-6">
        {/* FILTERS */}
        <div className="flex gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search by SO #, Client, or Brand..."
              className="h-12 pl-12 bg-white border-slate-200 rounded-2xl font-bold text-xs shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white font-bold text-[10px] uppercase tracking-widest text-slate-600">
            <Filter className="w-4 h-4 mr-2" /> Filter Status
          </Button>
        </div>

        {/* ORDER LIST */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)
          ) : filteredOrders?.length > 0 ? (
            filteredOrders.map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Sales Orders Found</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        leads={leads}
        taxes={taxes}
        onSubmit={(data: any) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />
    </DashboardShell>
  );
}

function OrderCard({ order }: { order: any }) {
  const statusColors: any = {
    PENDING_DP: "bg-amber-50 text-amber-600 border-amber-100",
    ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-100",
    COMPLETED: "bg-blue-50 text-blue-600 border-blue-100",
    CANCELLED: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <Card className="p-5 border border-slate-200 rounded-3xl hover:shadow-xl hover:border-blue-200 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{order.orderNumber}</span>
              <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2 py-0", statusColors[order.status])}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-600 uppercase tracking-tight">
              {order.brandName || order.lead?.clientName}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
            <p className="text-sm font-black text-slate-900">Rp {Number(order.totalAmount).toLocaleString()}</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Items</p>
            <p className="text-sm font-black text-slate-600">{order.items?.length || 0} Products</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50 text-slate-300 hover:text-blue-600">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CreateOrderModal({ isOpen, onOpenChange, leads, taxes, onSubmit, isPending }: any) {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [items, setItems] = useState<any[]>(() => [{ id: Date.now(), productName: "", quantity: 1, unitPrice: 0, taxId: "" }]);
  const [salesCategory, setSalesCategory] = useState("MAKLON_FULL");

  const addItem = () => {
    setItems([...items, { id: Date.now(), productName: "", quantity: 1, unitPrice: 0, taxId: "" }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedLead = leads?.find((l: any) => l.id === selectedLeadId);

    onSubmit({
      leadId: selectedLeadId,
      sampleId: selectedLead?.sampleRequests?.[0]?.id || "", // Default to first sample for now
      salesCategory,
      brandName: selectedLead?.brandName,
      totalAmount: calculateTotal(),
      items: items.map(item => ({
        materialId: "00000000-0000-0000-0000-000000000000", // Generic placeholder or link to R&D
        productName: item.productName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxId: item.taxId || undefined
      }))
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[2rem]">
        <DialogHeader className="p-8 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Plus className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight">Create Main Sales Order</DialogTitle>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Operational Protocol SO-V1</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-hide">
          {/* STEP 1: IDENTITY */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-blue-600 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">1. Client Selection</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nama Konsumen / Lead</Label>
                <Select value={selectedLeadId} onValueChange={(val) => setSelectedLeadId(val ?? "")} required>
                  <SelectTrigger className="h-12 bg-slate-50 border-none font-bold text-xs uppercase rounded-xl">
                    <SelectValue placeholder="PILIH KONSUMEN" />
                  </SelectTrigger>
                  <SelectContent className="font-bold text-xs uppercase">
                    {leads?.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>{l.clientName} ({l.brandName || "NO BRAND"})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Kategori Penjualan</Label>
                <Select value={salesCategory} onValueChange={(val) => setSalesCategory(val ?? "MAKLON_FULL")} required>
                  <SelectTrigger className="h-12 bg-slate-50 border-none font-bold text-xs uppercase rounded-xl">
                    <SelectValue placeholder="PILIH KATEGORI" />
                  </SelectTrigger>
                  <SelectContent className="font-bold text-xs uppercase">
                    <SelectItem value="MAKLON_FULL">MAKLON FULL</SelectItem>
                    <SelectItem value="B2B">B2B COMMERCIAL</SelectItem>
                    <SelectItem value="B2C">B2C DIRECT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* STEP 2: ITEMS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">2. Itemized Entries</h3>
              </div>
              <Button type="button" onClick={addItem} variant="outline" size="sm" className="h-8 rounded-full font-bold text-[9px] uppercase tracking-widest border-blue-100 text-blue-600 hover:bg-blue-50">
                <Plus className="w-3 h-3 mr-1" /> Add Product
              </Button>
            </div>

            <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-3 px-4">Product Description</th>
                    <th className="py-3 px-2 w-24">Qty</th>
                    <th className="py-3 px-2 w-40">Price (IDR)</th>
                    <th className="py-3 px-2 w-32">Tax</th>
                    <th className="py-3 px-2 w-32 text-right pr-4">Subtotal</th>
                    <th className="py-3 px-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-3 px-4">
                        <Input
                          placeholder="e.g. Brightening Day Cream 15g"
                          className="h-10 bg-transparent border-none font-bold text-xs uppercase focus:ring-0 p-0"
                          value={item.productName}
                          onChange={(e) => updateItem(item.id, "productName", e.target.value)}
                          required
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          className="h-10 bg-transparent border-none font-black text-xs focus:ring-0 p-0"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                          required
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          className="h-10 bg-transparent border-none font-black text-xs focus:ring-0 p-0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                          required
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Select value={item.taxId} onValueChange={(val) => updateItem(item.id, "taxId", val)}>
                          <SelectTrigger className="h-8 border-none bg-slate-100 rounded-md font-bold text-[9px] uppercase">
                            <SelectValue placeholder="NO TAX" />
                          </SelectTrigger>
                          <SelectContent className="font-bold text-[9px] uppercase">
                            {taxes?.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2 text-right pr-4 text-[11px] font-black text-slate-900">
                        {(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button type="button" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/50">
                  <tr className="border-t border-slate-100">
                    <td colSpan={4} className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase text-right">Estimated Total Amount</td>
                    <td className="py-4 px-2 text-right pr-4 text-sm font-black text-blue-600">
                      Rp {calculateTotal().toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest px-8 rounded-xl shadow-lg shadow-blue-100 h-12"
              disabled={isPending || items.length === 0}
            >
              {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Commit Sales Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

