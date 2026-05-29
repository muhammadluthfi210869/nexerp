"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package,
  Box as BoxIcon,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Truck,
  ArrowRightLeft,
  Info,
  FlaskConical,
  Clock,
  History,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DnaButton } from "@/components/dna/DnaButton";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { StatCard } from "@/components/dna/StatCard";
import { TableShell } from "@/components/layout/TableShell";
import { SectionDivider } from "@/components/layout/SectionDivider";

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
  const [showConfirm, setShowConfirm] = useState(false);

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
        userId: "CURRENT_USER_ID",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
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

  const criticalStock = goods.filter(g => g.stockQty <= g.minLevel).length;
  const dummyCount = goods.filter(g => g.isDummy).length;

  return (
    <TableShell
      title="Goods"
      titleAccent="Catalog"
      subtitle="Master Data Repository & Logistical Intelligence"
      actions={
        <>
          <DnaButton variant="outline" icon={<History />}>Log Audit</DnaButton>
          <DnaButton
            variant="primary"
            icon={<Plus />}
            onClick={() => {
              setEditingGood(null);
              setFormData({
                name: "", code: "", type: "RAW_MATERIAL", unit: "KG", usageUnit: "GRAM",
                outMethod: "FIFO", leadTime: 0, isDummy: false, unitPrice: 0,
                minLevel: 0, maxLevel: 0, reorderPoint: 0, categoryId: "",
                inventoryAccountId: "", salesAccountId: "", halalCertNo: "",
                halalExpDate: "", isHalalValidated: false,
              });
              setIsPanelOpen(true);
            }}
          >
            Initialize Good
          </DnaButton>
        </>
      }
      filters={
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or SKU..."
              className="h-10 pl-10 bg-white border-slate-200 text-[11px] font-bold uppercase placeholder:text-slate-300 focus:ring-blue-500/20 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[var(--card-gap)]">
        <StatCard label="Total SKU" value={goods.length} subValue="Registered SKUs" icon={<Package />} />
        <div className="bg-white border border-rose-200 rounded-2xl p-7 shadow-card transition-all group overflow-hidden relative h-[148px] flex items-center justify-between animate-fade-slide-in">
          <div className="relative z-10 w-full">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Critical Stock</p>
              <h3 className="text-[26px] font-black text-slate-900 tracking-tight tabular leading-tight">{criticalStock}</h3>
              <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider leading-tight">Requires Attention</p>
            </div>
          </div>
          <div className="absolute -bottom-5 -right-5 pointer-events-none select-none z-0">
            <AlertTriangle className="w-[110px] h-[110px] stroke-[0.75px] text-rose-200/40" />
          </div>
        </div>
        <StatCard label="Dummy Materials" value={dummyCount} subValue="Simulation Data" icon={<FlaskConical />} />
        <StatCard label="System Sync" value="100%" subValue="Ecosystem Integrity" icon={<Activity />} />
      </div>

      <TableWrapper>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Product Specification</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Category</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Logistics</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4 text-right tabular-nums">Valuation</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4 text-center">Stock Status</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Syncing Global Ledger...
                  </TableCell>
                </TableRow>
              ) : filteredGoods.map((good) => (
                <TableRow
                  key={good.id}
                  className="group hover:bg-slate-50/30 border-b border-slate-50 cursor-pointer"
                  onClick={() => {
                    fetchGoodDetail(good.id);
                    setIsPanelOpen(true);
                  }}
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-xs uppercase">{good.name}</span>
                          {good.isDummy && (
                            <Badge className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-1.5 py-0.5 h-auto border-none rounded">
                              DUMMY
                            </Badge>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{good.code || "PENDING_SKU"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md">
                      {good.category?.name || "UNCATEGORIZED"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{good.outMethod}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{good.leadTime} Days</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right tabular-nums">
                    <span className="font-black text-slate-900 text-xs">Rp {Number(good.unitPrice).toLocaleString('id-ID')}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-tighter">Moving Avg</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn(
                        "text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full",
                        good.stockQty <= good.minLevel ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-900"
                      )}>
                        {good.stockQty} {good.unit}
                      </span>
                      {good.isHalalValidated && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                      <Info className="h-4 w-4" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableWrapper>

      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="sm:max-w-[700px] p-0 border-l border-slate-200 shadow-2xl bg-white flex flex-col h-full">
          <SheetHeader className="p-8 bg-slate-800 text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600/20 rounded-xl">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <SheetTitle className="text-sm font-black uppercase tracking-tight text-white leading-none">
                  {editingGood ? "Material Detail" : "Initialize Material"}
                </SheetTitle>
                <SheetDescription className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-1">
                  Ecosystem Entry Protocol
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="space-y-6">
                <SectionDivider number={1} title="Essential Architecture" />
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Product Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 bg-slate-50 border-none font-bold text-sm uppercase focus:bg-white transition-all rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SKU / Code</Label>
                    <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="h-11 bg-slate-50 border-none font-bold text-sm uppercase focus:bg-white transition-all rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</Label>
                    <Select value={formData.categoryId || ""} onValueChange={(v) => setFormData({ ...formData, categoryId: v || "" })}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase rounded-xl"><SelectValue placeholder="SELECT" /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl rounded-xl">{categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl rounded-xl">
                        <SelectItem value="RAW_MATERIAL" className="text-xs font-bold uppercase">Raw Material</SelectItem>
                        <SelectItem value="FINISHED_GOODS" className="text-xs font-bold uppercase">Finished Goods</SelectItem>
                        <SelectItem value="PACKAGING" className="text-xs font-bold uppercase">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Unit</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v as any })}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl rounded-xl">
                        <SelectItem value="KG" className="text-xs font-bold uppercase">KG</SelectItem>
                        <SelectItem value="LITER" className="text-xs font-bold uppercase">Liter</SelectItem>
                        <SelectItem value="PCS" className="text-xs font-bold uppercase">PCS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <SectionDivider number={2} title="Logistics Intelligence" />
                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Dummy Material</Label>
                      <Switch checked={formData.isDummy} onCheckedChange={(v) => setFormData({ ...formData, isDummy: v })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase">Lead Time (Days)</Label>
                      <Input type="number" value={formData.leadTime} onChange={(e) => setFormData({ ...formData, leadTime: Number(e.target.value) })} className="h-10 bg-white border-slate-200 font-bold text-sm rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-4 border-l border-slate-200 pl-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Outbound Engine</Label>
                      <Select value={formData.outMethod} onValueChange={(v) => setFormData({ ...formData, outMethod: v as any })}>
                        <SelectTrigger className="h-10 bg-white border-slate-200 font-bold text-xs uppercase rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="border-none shadow-xl rounded-xl">
                          <SelectItem value="FIFO" className="text-xs font-bold uppercase">FIFO</SelectItem>
                          <SelectItem value="FEFO" className="text-xs font-bold uppercase">FEFO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase">Usage Unit</Label>
                      <Input value={formData.usageUnit || ""} onChange={(e) => setFormData({ ...formData, usageUnit: e.target.value })} className="h-10 bg-white border-slate-200 font-bold text-sm uppercase rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {editingGood && (
                <div className="space-y-6">
                  <SectionDivider number={3} title="Batch Integrity & QC Release" />
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
                                Qty: {batch.currentStock} {editingGood.unit} &middot; Loc: {batch.location?.name || 'GEN_WAREHOUSE'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {batch.qcStatus === 'QUARANTINE' && (
                              <>
                                <DnaButton
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(batch.id, 'GOOD')}
                                >
                                  Release
                                </DnaButton>
                                <DnaButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(batch.id, 'REJECT')}
                                >
                                  Reject
                                </DnaButton>
                              </>
                            )}
                            <Badge className={cn(
                              "border-none font-black text-[8px] uppercase h-6 px-2 rounded",
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
            <DnaButton variant="outline" onClick={() => setIsPanelOpen(false)}>Discard</DnaButton>
            <DnaButton variant="primary" type="button" onClick={handleSubmit} className="mb-0">
              {editingGood ? "Commit" : "Deploy"}
            </DnaButton>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menyimpan data ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableShell>
  );
}
