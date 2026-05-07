"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Package, 
  Tag, 
  Settings, 
  History,
  Box as BoxIcon,
  Zap,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Filter,
  Truck,
  Layers,
  ArrowRightLeft,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { TableShell } from "@/components/layout/TableShell";
import { KPIGrid, KPICard } from "@/components/layout/KPIGrid";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { DataTable, DataTableHead, DataTableTh, DataTableBody, DataTableRow, DataTableCell } from "@/components/layout/DataTable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Category = { id: string; name: string };
type Account = { id: string; name: string; code: string };

type InventoryBatch = {
  id: string;
  batchNumber: string;
  currentStock: number;
  expDate: string | null;
  qcStatus: "GOOD" | "QUARANTINE" | "REJECT";
  location?: { name: string };
  supplier?: { name: string };
};

type Good = {
  id: string;
  name: string;
  code: string | null;
  type: string;
  unit: string;
  usageUnit: string | null;
  outMethod: "FIFO" | "FEFO";
  leadTime: number;
  isDummy: boolean;
  unitPrice: number;
  stockQty: number;
  minLevel: number;
  maxLevel: number;
  reorderPoint: number;
  categoryId: string | null;
  category?: Category | null;
  inventoryAccountId?: string | null;
  salesAccountId?: string | null;
  inventoryAccount?: Account | null;
  salesAccount?: Account | null;
  halalCertNo?: string | null;
  halalExpDate?: string | null;
  isHalalValidated: boolean;
  inventories?: InventoryBatch[];
};

export default function MasterGoodsPage() {
  const [goods, setGoods] = useState<Good[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingGood, setEditingGood] = useState<Good | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "RAW_MATERIAL",
    unit: "KG",
    usageUnit: "GRAM",
    outMethod: "FIFO",
    leadTime: 0,
    isDummy: false,
    unitPrice: 0,
    minLevel: 0,
    maxLevel: 0,
    reorderPoint: 0,
    categoryId: "",
    inventoryAccountId: "",
    salesAccountId: "",
    halalCertNo: "",
    halalExpDate: "",
    isHalalValidated: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goodsRes, catRes, accRes] = await Promise.all([
        api.get("/scm/materials"),
        api.get("/master/categories?type=GOODS"),
        api.get("/finance/accounts"),
      ]);
      setGoods(goodsRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);
    } catch (err) {
      toast.error("Failed to fetch data ecosystem");
    } finally {
      setLoading(false);
    }
  };

  const fetchGoodDetail = async (id: string) => {
    try {
      const res = await api.get(`/scm/materials/${id}`);
      setEditingGood(res.data);
      const good = res.data;
      setFormData({
        name: good.name,
        code: good.code || "",
        type: good.type as any,
        unit: good.unit as any,
        usageUnit: good.usageUnit || "GRAM",
        outMethod: good.outMethod,
        leadTime: good.leadTime,
        isDummy: good.isDummy,
        unitPrice: Number(good.unitPrice),
        minLevel: good.minLevel,
        maxLevel: good.maxLevel,
        reorderPoint: good.reorderPoint,
        categoryId: good.categoryId || "",
        inventoryAccountId: good.inventoryAccountId || "",
        salesAccountId: good.salesAccountId || "",
        halalCertNo: good.halalCertNo || "",
        halalExpDate: good.halalExpDate ? new Date(good.halalExpDate).toISOString().split('T')[0] : "",
        isHalalValidated: good.isHalalValidated,
      });
    } catch (err) {
      toast.error("Failure in retrieval of material intelligence");
    }
  };

  const handleUpdateStatus = async (batchId: string, status: string) => {
    try {
      setIsUpdatingStatus(true);
      await api.post(`/warehouse/batches/${batchId}/status`, { 
        status, 
        userId: "CURRENT_USER_ID" // Simplified for logic demonstration
      });
      toast.success(`Batch status calibrated to ${status}`);
      if (editingGood) fetchGoodDetail(editingGood.id);
    } catch (err) {
      toast.error("QC Gate validation failure");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGood) {
        await api.put(`/scm/materials/${editingGood.id}`, formData);
        toast.success("Product architecture updated");
      } else {
        await api.post("/scm/materials", formData);
        toast.success("New product registered to ecosystem");
      }
      setIsPanelOpen(false);
      setEditingGood(null);
      fetchData();
    } catch (err) {
      toast.error("Constraint violation in product registration");
    }
  };

  const filteredGoods = goods.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <TableShell
      title="Goods"
      titleAccent="Catalog"
      subtitle="Master Data Repository & Logistical Intelligence"
      actions={
        <>
          <Button variant="outline" size="sm" className="h-9 px-4 bg-white font-bold text-[10px] uppercase tracking-tight border-slate-200">
            <History className="mr-2 h-3.5 w-3.5" /> Log Audit
          </Button>
          <Button 
            onClick={() => {
              setEditingGood(null);
              setFormData({
                name: "",
                code: "",
                type: "RAW_MATERIAL",
                unit: "KG",
                usageUnit: "GRAM",
                outMethod: "FIFO",
                leadTime: 0,
                isDummy: false,
                unitPrice: 0,
                minLevel: 0,
                maxLevel: 0,
                reorderPoint: 0,
                categoryId: "",
                inventoryAccountId: "",
                salesAccountId: "",
                halalCertNo: "",
                halalExpDate: "",
                isHalalValidated: false,
              });
              setIsPanelOpen(true);
            }}
            size="sm"
            className="h-9 px-4 bg-brand-black hover:bg-brand-blue text-white font-bold text-[10px] uppercase tracking-tight shadow-lg shadow-black/10"
          >
            <Plus className="mr-2 h-3.5 w-3.5 stroke-[3px]" /> Initialize Good
          </Button>
        </>
      }
      filters={
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="SCAN BARCODE OR SEARCH SKU..." 
              className="h-10 pl-10 bg-white border-slate-200 text-[11px] font-bold uppercase placeholder:text-slate-300 focus:ring-brand-blue/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-slate-200">
            <Filter className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      }
    >
      {/* Analytics KPI Row */}
      <KPIGrid columns={4}>
        <KPICard id="A" title="TOTAL SKU" dotColor="bg-blue-500">
           <h3 className="text-2xl font-bold tracking-tight text-slate-900">{goods.length}</h3>
           <p className="text-[9px] font-bold text-slate-400 uppercase">Registered SKUs</p>
        </KPICard>
        <KPICard id="B" title="CRITICAL STOCK" dotColor="bg-rose-500" variant={goods.filter(g => g.stockQty <= g.minLevel).length > 0 ? "danger" : "default"}>
           <h3 className="text-2xl font-bold tracking-tight">{goods.filter(g => g.stockQty <= g.minLevel).length}</h3>
           <p className="text-[9px] font-bold uppercase opacity-60">Requires Attention</p>
        </KPICard>
        <KPICard id="C" title="DUMMY MATERIALS" dotColor="bg-amber-500">
           <h3 className="text-2xl font-bold tracking-tight text-slate-900">{goods.filter(g => g.isDummy).length}</h3>
           <p className="text-[9px] font-bold text-slate-400 uppercase">Simulation Data</p>
        </KPICard>
        <KPICard id="D" title="SYSTEM SYNC" dotColor="bg-emerald-500">
           <h3 className="text-2xl font-bold tracking-tight text-slate-900">100%</h3>
           <p className="text-[9px] font-bold text-slate-400 uppercase">Ecosystem Integrity</p>
        </KPICard>
      </KPIGrid>

      {/* Main Table */}
      <div className="mt-6 border border-slate-100 rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <DataTable>
          <DataTableHead className="bg-slate-50/50">
            <DataTableTh>PRODUCT SPECIFICATION</DataTableTh>
            <DataTableTh>LOGISTICS</DataTableTh>
            <DataTableTh>VALUATION</DataTableTh>
            <DataTableTh align="center">STOCK STATUS</DataTableTh>
            <DataTableTh align="right">ACTION</DataTableTh>
          </DataTableHead>
          <DataTableBody>
            {loading ? (
              <DataTableRow>
                <DataTableCell colSpan={5} className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">
                   Syncing Global Ledger...
                </DataTableCell>
              </DataTableRow>
            ) : filteredGoods.map((good) => (
              <DataTableRow key={good.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => {
                fetchGoodDetail(good.id);
                setIsPanelOpen(true);
              }}>
                <DataTableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-[11px] uppercase truncate max-w-[200px]">{good.name}</span>
                      {good.isDummy && <Badge className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-1 h-3.5 border-none">DUMMY</Badge>}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{good.code || "PENDING_SKU"}</span>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <ArrowRightLeft className="w-2.5 h-2.5 text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{good.outMethod}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="w-2.5 h-2.5 text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{good.leadTime} DAYS</span>
                    </div>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-900 uppercase">Rp {Number(good.unitPrice).toLocaleString('id-ID')}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">MOVING AVERAGE</span>
                  </div>
                </DataTableCell>
                <DataTableCell align="center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      "text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full",
                      good.stockQty <= good.minLevel ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-900"
                    )}>
                      {good.stockQty} {good.unit}
                    </span>
                    {good.isHalalValidated && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                  </div>
                </DataTableCell>
                <DataTableCell align="right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg group-hover:bg-brand-black group-hover:text-white transition-all"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </div>

      {/* Slide-out Detail Panel (Master-Detail) */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="sm:max-w-[700px] p-0 border-l border-slate-100 shadow-2xl bg-white flex flex-col h-full">
          <SheetHeader className="p-8 bg-brand-black text-white shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-blue/20 rounded-lg">
                <Package className="w-5 h-5 text-brand-blue" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold uppercase tracking-tight text-white leading-none">
                  {editingGood ? "Material Detail" : "Initialize Material"}
                </SheetTitle>
                <SheetDescription className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
                  Ecosystem Entry Protocol v4.2
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Essential Section */}
              <div className="space-y-6">
                <SectionDivider number={1} title="ESSENTIAL ARCHITECTURE" />
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Product Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-11 bg-slate-50 border-none font-bold text-sm uppercase focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SKU / Material Code</Label>
                    <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="h-11 bg-slate-50 border-none font-bold text-sm uppercase focus:bg-white transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</Label>
                    <Select value={formData.categoryId || ""} onValueChange={(v) => setFormData({...formData, categoryId: v || ""})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase"><SelectValue placeholder="SELECT" /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl">{categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v as any})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl">
                        <SelectItem value="RAW_MATERIAL" className="text-xs font-bold uppercase">Raw Material</SelectItem>
                        <SelectItem value="FINISHED_GOODS" className="text-xs font-bold uppercase">Finished Goods</SelectItem>
                        <SelectItem value="PACKAGING" className="text-xs font-bold uppercase">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Purchase Unit</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({...formData, unit: v as any})}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl">
                        <SelectItem value="KG" className="text-xs font-bold uppercase">KG</SelectItem>
                        <SelectItem value="LITER" className="text-xs font-bold uppercase">LITER</SelectItem>
                        <SelectItem value="PCS" className="text-xs font-bold uppercase">PCS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Logistics Intelligence Section */}
              <div className="space-y-6">
                <SectionDivider number={2} title="LOGISTICS INTELLIGENCE" />
                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Dummy Material</Label>
                      <Switch checked={formData.isDummy} onCheckedChange={(v) => setFormData({...formData, isDummy: v})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase">Lead Time (Days)</Label>
                      <Input type="number" value={formData.leadTime} onChange={(e) => setFormData({...formData, leadTime: Number(e.target.value)})} className="h-10 bg-white border-slate-200 font-bold text-sm" />
                    </div>
                  </div>
                  <div className="space-y-4 border-l border-slate-200 pl-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Outbound Engine</Label>
                      <Select value={formData.outMethod} onValueChange={(v) => setFormData({...formData, outMethod: v as any})}>
                        <SelectTrigger className="h-10 bg-white border-slate-200 font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent className="border-none shadow-xl">
                          <SelectItem value="FIFO" className="text-xs font-bold uppercase">FIFO (Earliest Entry)</SelectItem>
                          <SelectItem value="FEFO" className="text-xs font-bold uppercase">FEFO (Earliest Expired)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase">Usage Unit (Production)</Label>
                      <Input value={formData.usageUnit || ""} onChange={(e) => setFormData({...formData, usageUnit: e.target.value})} className="h-10 bg-white border-slate-200 font-bold text-sm uppercase" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Batches & QC Section (Phase 4) */}
              {editingGood && (
                <div className="space-y-6">
                  <SectionDivider number={3} title="BATCH INTEGRITY & QC RELEASE" />
                  <div className="space-y-4">
                    {editingGood.inventories && editingGood.inventories.length > 0 ? (
                      editingGood.inventories.map((batch) => (
                        <div key={batch.id} className="p-5 border border-slate-100 rounded-2xl flex items-center justify-between hover:shadow-sm transition-all">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center",
                              batch.qcStatus === 'GOOD' ? "bg-emerald-50" : batch.qcStatus === 'QUARANTINE' ? "bg-amber-50" : "bg-rose-50"
                            )}>
                              {batch.qcStatus === 'GOOD' ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : 
                               batch.qcStatus === 'QUARANTINE' ? <Clock className="w-5 h-5 text-amber-500" /> : 
                               <AlertTriangle className="w-5 h-5 text-rose-500" />}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 uppercase">BATCH: {batch.batchNumber}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                Qty: {batch.currentStock} {editingGood.unit} • Loc: {batch.location?.name || 'GEN_WAREHOUSE'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             {batch.qcStatus === 'QUARANTINE' && (
                               <>
                                 <Button 
                                   onClick={() => handleUpdateStatus(batch.id, 'GOOD')}
                                   size="sm" 
                                   className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase rounded-lg"
                                 >
                                   Release
                                 </Button>
                                 <Button 
                                   onClick={() => handleUpdateStatus(batch.id, 'REJECT')}
                                   size="sm" 
                                   variant="outline"
                                   className="h-8 px-3 border-rose-200 text-rose-600 font-bold text-[9px] uppercase rounded-lg hover:bg-rose-50"
                                 >
                                   Reject
                                 </Button>
                               </>
                             )}
                             <Badge className={cn(
                               "border-none font-black text-[8px] uppercase h-6 px-2",
                               batch.qcStatus === 'GOOD' ? "bg-emerald-100 text-emerald-700" : 
                               batch.qcStatus === 'QUARANTINE' ? "bg-amber-100 text-amber-700" : 
                               "bg-rose-100 text-rose-700"
                             )}>
                               {batch.qcStatus}
                             </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">No Active Batches in Inventory</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          <SheetFooter className="p-8 bg-slate-50 border-t border-slate-200 shrink-0">
            <Button type="button" variant="ghost" className="h-12 font-bold uppercase text-[10px] text-slate-400" onClick={() => setIsPanelOpen(false)}>Discard</Button>
            <Button onClick={handleSubmit} className="h-12 flex-1 bg-brand-black hover:bg-brand-blue text-white font-bold uppercase text-xs shadow-xl shadow-black/20">
              {editingGood ? "Commit Architecture" : "Deploy Protocol"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </TableShell>
  );
}

