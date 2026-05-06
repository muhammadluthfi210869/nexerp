"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Search, 
  FileCheck, 
  Truck, 
  DollarSign,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Trash2,
  Package,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  ShoppingCart
} from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface POItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  taxType: string;
  taxAmount: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: { name: string };
  status: 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
  totalValue: number;
  downPayment: number;
  paymentTerms: string;
  estArrival?: string;
  createdAt: string;
  items: Array<{
    id: string;
    material: { name: string };
    quantity: number;
    unitPrice: number;
    receivedQty: number;
  }>;
}

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [estArrival, setEstArrival] = useState("");
  const [downPayment, setDownPayment] = useState("0");
  const [paymentTerms, setPaymentTerms] = useState("NET 30");
  const [items, setItems] = useState<POItem[]>([]);
  
  // New Item State
  const [newItemMaterialId, setNewItemMaterialId] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemTaxType, setNewItemTaxType] = useState("PPN_11");

  // Escalation State
  const [escalationPin, setEscalationPin] = useState("");
  const [escalationReason, setEscalationReason] = useState("");

  // Fetch POs
  const { data: orders, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return res.data;
    },
  });

  // Fetch Suppliers
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await api.get("/master/suppliers");
      return res.data;
    },
  });

  // Fetch Materials
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await api.get("/master/materials");
      return res.data;
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/purchase-order", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Purchase Order successfully dispatched to Supplier.");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Protocol Error: Failed to commit order.");
    }
  });

  const resetForm = () => {
    setSelectedSupplier("");
    setEstArrival("");
    setDownPayment("0");
    setPaymentTerms("NET 30");
    setItems([]);
    setEscalationPin("");
    setEscalationReason("");
  };

  const addItem = () => {
    if (!newItemMaterialId || !newItemQty || !newItemPrice) return;
    const material = materials.find((m: any) => m.id === newItemMaterialId);
    if (!material) return;

    const price = Number(newItemPrice);
    const qty = Number(newItemQty);
    const taxRate = newItemTaxType === "PPN_11" ? 0.11 : 0;
    const taxAmount = price * qty * taxRate;

    setItems([...items, {
      materialId: newItemMaterialId,
      materialName: material.name,
      quantity: qty,
      unitPrice: price,
      taxType: newItemTaxType,
      taxAmount: taxAmount
    }]);
    setNewItemMaterialId("");
    setNewItemQty("");
    setNewItemPrice("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Payload Empty: Add at least one material.");
      return;
    }

    createPOMutation.mutate({
      supplierId: selectedSupplier,
      estArrival: estArrival || null,
      downPayment: Number(downPayment),
      paymentTerms,
      items: items.map(i => ({
        materialId: i.materialId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxType: i.taxType
      })),
      escalationPin: escalationPin || undefined,
      escalationReason: escalationReason || undefined,
    });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'RECEIVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PARTIAL': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ORDERED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const calculateTotal = () => {
    return items.reduce((acc, i) => acc + (i.quantity * i.unitPrice * 1.11), 0);
  };

  return (
    <div className="p-1 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            PURCHASE <span className="text-emerald-600">ORDERS</span>
          </h1>
          <div className="flex items-center gap-3 mt-4">
             <Badge className="bg-slate-900 text-white font-bold tracking-tight text-[10px] uppercase px-4 py-1.5 rounded-full border-none">Official Procurement v2.4</Badge>
             <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">Vendor Commitment Protocol</p>
          </div>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger render={
            <Button className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-2xl shadow-xl shadow-emerald-100 transition-all hover:-translate-y-1 active:scale-95 border-none uppercase tracking-tighter text-sm">
              <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> Create PO
            </Button>
          } />
          <DialogContent className="sm:max-w-[800px] bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-emerald-600 p-8 text-white relative">
               <DialogTitle className="text-3xl font-black uppercase tracking-tighter leading-none italic">Legal Purchase Order</DialogTitle>
               <DialogDescription className="text-emerald-100 font-medium uppercase text-[10px] tracking-tight mt-2">External procurement commitment to supplier</DialogDescription>
               <FileCheck className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 text-emerald-500 opacity-30" />
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Target Supplier</Label>
                  <Select value={selectedSupplier} onValueChange={(v: string | null) => setSelectedSupplier(v || "")} required>
                    <SelectTrigger className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl focus:bg-white focus:border-emerald-200 transition-all">
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((s: any) => (
                        <SelectItem key={s.id} value={s.id} className="font-bold">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Est. Arrival Date</Label>
                  <Input 
                    type="date" 
                    className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl focus:bg-white focus:border-emerald-200 transition-all"
                    value={estArrival}
                    onChange={(e) => setEstArrival(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Payment Terms (Legacy: Jatuh Tempo)</Label>
                  <Select value={paymentTerms} onValueChange={(val: string | null) => setPaymentTerms(val || "")}>
                    <SelectTrigger className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl focus:bg-white focus:border-emerald-200 transition-all">
                      <SelectValue placeholder="Select Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH" className="font-bold">CASH ON DELIVERY</SelectItem>
                      <SelectItem value="NET 7" className="font-bold">NET 7 DAYS</SelectItem>
                      <SelectItem value="NET 14" className="font-bold">NET 14 DAYS</SelectItem>
                      <SelectItem value="NET 30" className="font-bold">NET 30 DAYS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Down Payment (DP Amount)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">RP</span>
                    <Input 
                      type="number" 
                      className="h-12 pl-10 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl focus:bg-white focus:border-emerald-200 transition-all"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ESCALATION SECTION (Only for blacklisted vendors) */}
              {suppliers?.find((s: any) => s.id === selectedSupplier)?.isBlacklisted && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <div>
                      <h4 className="text-xs font-black text-rose-900 uppercase tracking-tight">Vendor Under QC Supervision</h4>
                      <p className="text-[9px] font-bold text-rose-700 leading-tight">This vendor has been flagged. Manager authorization is mandatory to proceed.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <Label className="text-[9px] font-black uppercase text-rose-400 pl-1">Manager PIN</Label>
                      <Input 
                        type="password"
                        placeholder="••••"
                        className="h-11 border-rose-200 bg-white font-black text-center tracking-[0.5em]"
                        value={escalationPin}
                        onChange={(e) => setEscalationPin(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[9px] font-black uppercase text-rose-400 pl-1">Reason for Override</Label>
                      <Input 
                        placeholder="Justify this order..."
                        className="h-11 border-rose-200 bg-white font-bold"
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ITEM BUILDER */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-tight text-slate-900 pl-1">Material Items & Price Agreement</Label>
                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-2">
                    <Select value={newItemMaterialId} onValueChange={(v: string | null) => setNewItemMaterialId(v || "")}>
                      <SelectTrigger className="h-11 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl">
                        <SelectValue placeholder="Material..." />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map((m: any) => (
                          <SelectItem key={m.id} value={m.id} className="font-bold">{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input 
                    type="number" 
                    placeholder="Qty" 
                    className="h-11 border-2 border-slate-50 bg-slate-50 font-bold col-span-1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                  />
                  <Input 
                    type="number" 
                    placeholder="Price/Unit" 
                    className="h-11 border-2 border-slate-50 bg-slate-50 font-bold col-span-1"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                  <Select value={newItemTaxType} onValueChange={(val: string | null) => setNewItemTaxType(val || "")}>
                    <SelectTrigger className="h-11 border-2 border-slate-50 bg-slate-50 font-bold col-span-1">
                      <SelectValue placeholder="Tax" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NON_TAX" className="font-bold">NON</SelectItem>
                      <SelectItem value="PPN_11" className="font-bold">PPN 11%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addItem} className="h-11 bg-slate-900 text-white font-black rounded-xl">
                    ADD
                  </Button>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-100/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-[9px] font-black uppercase">Material</TableHead>
                        <TableHead className="h-10 text-[9px] font-black uppercase text-center">Qty</TableHead>
                        <TableHead className="h-10 text-[9px] font-black uppercase text-right">Price</TableHead>
                        <TableHead className="h-10 text-[9px] font-black uppercase text-right">Tax</TableHead>
                        <TableHead className="h-10 text-[9px] font-black uppercase text-right">Subtotal</TableHead>
                        <TableHead className="h-10 text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx} className="bg-white hover:bg-slate-50/50">
                          <TableCell className="font-bold text-xs">{item.materialName}</TableCell>
                          <TableCell className="text-center font-black text-xs text-emerald-600">{item.quantity}</TableCell>
                          <TableCell className="text-right font-bold text-xs">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-bold text-[9px] text-slate-400">PPN 11%</TableCell>
                          <TableCell className="text-right font-black text-xs">{formatCurrency(item.quantity * item.unitPrice * 1.11)}</TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-rose-500 hover:bg-rose-50 h-8 w-8 p-0">
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-emerald-50/30">
                        <TableCell colSpan={4} className="text-right font-black text-[10px] uppercase text-emerald-600 italic">Total PO Value (Incl. Tax)</TableCell>
                        <TableCell className="text-right font-black text-sm text-emerald-700">{formatCurrency(calculateTotal())}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-tight rounded-2xl shadow-lg"
                disabled={createPOMutation.isPending}
              >
                {createPOMutation.isPending ? <Loader2 className="animate-spin" /> : "Commit & Generate PO Document"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<ShoppingCart className="text-emerald-600" />} label="Active Orders" value={orders?.filter(o => o.status === 'ORDERED').length || 0} />
        <StatCard icon={<Truck className="text-blue-600" />} label="In Transit" value={orders?.filter(o => o.status === 'PARTIAL').length || 0} />
        <StatCard icon={<CheckCircle2 className="text-slate-900" />} label="Fulfilled" value={orders?.filter(o => o.status === 'RECEIVED').length || 0} />
        <StatCard icon={<DollarSign className="text-amber-600" />} label="Total Expenditure" value={formatCurrency(orders?.reduce((acc, o) => acc + o.totalValue, 0) || 0)} />
      </div>

      {/* DATA TABLE */}
      <div className="relative group">
         <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[3rem] blur opacity-5 group-hover:opacity-10 transition duration-1000"></div>
         <div className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
            <Table>
               <TableHeader className="bg-slate-50/70">
                  <TableRow className="hover:bg-transparent border-slate-100">
                     <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">PO Identifier</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Supplier / Vendor</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Value Analytics</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Delivery Status</TableHead>
                     <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Action</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {isLoading ? (
                     <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-emerald-600" /></TableCell></TableRow>
                  ) : orders?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-400 font-bold uppercase tracking-tight text-xs">No purchase orders in database.</TableCell></TableRow>
                  ) : (
                     orders?.map((po: any) => (
                        <TableRow key={po.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
                           <TableCell className="py-8 pl-10">
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm italic group-hover:scale-110 transition-transform">
                                    PO
                                 </div>
                                 <div>
                                    <p className="font-black text-slate-900 tracking-tight text-lg leading-tight uppercase italic">{po.poNumber}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1 italic">{new Date(po.createdAt).toLocaleDateString()}</p>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="space-y-1.5">
                                 <p className="text-slate-700 font-bold text-sm tracking-tight flex items-center gap-2 uppercase italic">
                                    <ShieldCheck size={14} className="text-emerald-600" /> {po.supplier.name}
                                 </p>
                                 <div className="flex items-center gap-2">
                                    <Calendar size={10} className="text-slate-400" />
                                    <span className="text-[9px] font-black uppercase text-slate-400 italic">Est. {po.estArrival ? new Date(po.estArrival).toLocaleDateString() : 'TBD'}</span>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="space-y-1">
                                 <p className="font-black text-slate-900 text-base">{formatCurrency(po.totalValue)}</p>
                                 <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tight italic">{po.items.length} Items Contracted</p>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge className={cn("rounded-xl px-4 py-2 font-black uppercase tracking-tight text-[10px] border shadow-sm", getStatusColor(po.status))}>
                                 {po.status}
                              </Badge>
                           </TableCell>
                           <TableCell className="pr-10 text-right">
                              <Button className="h-11 px-6 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-tight text-[10px] rounded-xl shadow-xl hover:-translate-x-1 transition-all border-none italic">
                                 Print PO <ClipboardList className="ml-2 h-3.5 w-3.5" />
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string | number }) {
   return (
      <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-8 flex flex-col gap-4 bg-white hover:translate-y-[-4px] transition-all duration-500">
         <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">
            {icon}
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-300">{label}</p>
            <p className="text-2xl font-black tracking-tighter mt-1 text-slate-900">{value}</p>
         </div>
      </Card>
   );
}

