"use client";

/**
 * Master Barang — Consolidated Page (Daftar + Kelola)
 *
 * Per Batch 6.3 user feedback: legacy ERP punya Daftar Barang + Kelola Barang
 * as 2 pages. Kita consolidated jadi 1 page dengan 2 tabs:
 *   - Tab 1: DAFTAR BARANG (read-only list — everyone can see)
 *   - Tab 2: KELOLA BARANG (CRUD with Sheet modal — admin/warehouse)
 *
 * Special: Uses Sheet (side panel) for Add/Edit instead of Dialog karena
 * form Barang panjang (multi-section: Essential + Logistics + Batch QC +
 * Supplier/HPP). Sheet lebih cocok untuk form panjang.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Package,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Truck,
  ArrowRightLeft,
  FlaskConical,
  Clock,
  Edit2,
  Trash2,
} from "lucide-react";
import { DnaInput } from "@/components/dna/DnaInput";
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
import { DnaBadge } from "@/components/dna/DnaBadge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DnaButton } from "@/components/dna/DnaButton";
import { TableWrapper } from "@/components/dna/TableWrapper";
import {
  MasterPageShell,
  type MasterStatItem,
  type MasterTab,
} from "@/components/dna";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { SupplierHistorySection } from "@/components/scm/SupplierHistorySection";
import { HppBreakdownCard } from "@/components/scm/HppBreakdownCard";

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
  physicalForm?: "CAIR" | "SERBUK" | "BUTIRAN" | "PADAT" | "GAS";
  inventories?: InventoryBatch[];
};

const EMPTY_FORM = {
  name: "",
  code: "",
  type: "RAW_MATERIAL",
  unit: "KG",
  usageUnit: "GRAM",
  outMethod: "FIFO" as "FIFO" | "FEFO",
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
  physicalForm: "PADAT" as "CAIR" | "SERBUK" | "BUTIRAN" | "PADAT" | "GAS",
};

export default function MasterGoodsPage() {
  // Consolidated tabs (Daftar vs Kelola)
  const [activeTab, setActiveTab] = useState<"DAFTAR" | "KELOLA">("DAFTAR");

  const [goods, setGoods] = useState<Good[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingGood, setEditingGood] = useState<Good | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goodsRes, catRes] = await Promise.all([
        api.get("/scm/materials"),
        api.get("/master/categories?type=GOODS"),
      ]);
      setGoods(goodsRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error("Failed to fetch data ecosystem");
    } finally {
      setLoading(false);
    }
  };

  const fetchGoodDetail = async (id: string) => {
    try {
      const res = await api.get(`/scm/materials/${id}`);
      const good = res.data;
      setEditingGood(good);
      setFormData({
        name: good.name,
        code: good.code || "",
        type: good.type,
        unit: good.unit,
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
        halalExpDate: good.halalExpDate ? new Date(good.halalExpDate).toISOString().split("T")[0] : "",
        isHalalValidated: good.isHalalValidated,
        physicalForm: good.physicalForm || "PADAT",
      });
    } catch {
      toast.error("Failure in retrieval of material intelligence");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (batchId: string, status: string) => {
    try {
      await api.post(`/warehouse/batches/${batchId}/status`, {
        status,
        userId: "CURRENT_USER_ID",
      });
      toast.success(`Batch status calibrated to ${status}`);
      if (editingGood) fetchGoodDetail(editingGood.id);
    } catch {
      toast.error("QC Gate validation failure");
    }
  };

  const handleSubmit = (e: { preventDefault: () => void }): void => {
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
    } catch {
      toast.error("Constraint violation in product registration");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/scm/materials/${id}`);
      toast.success("Material deleted");
      setDeletingId(null);
      fetchData();
    } catch {
      toast.error("Failed to delete material");
    }
  };

  const openNew = () => {
    setEditingGood(null);
    setFormData({ ...EMPTY_FORM });
    setIsPanelOpen(true);
  };

  const openEdit = (good: Good) => {
    fetchGoodDetail(good.id);
    setIsPanelOpen(true);
  };

  const filteredGoods = useMemo(() => {
    if (!searchQuery) return goods;
    const q = searchQuery.toLowerCase();
    return goods.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.code?.toLowerCase() || "").includes(q)
    );
  }, [goods, searchQuery]);

  // Stats
  const totalSku = goods.length;
  const criticalStock = goods.filter((g) => g.stockQty <= g.minLevel).length;
  const dummyCount = goods.filter((g) => g.isDummy).length;

  const stats: [MasterStatItem, MasterStatItem, MasterStatItem, MasterStatItem] = [
    { variant: "neutral", label: "Total SKU", value: totalSku, subtext: "Registered SKUs", icon: <Package /> },
    { variant: "rose", label: "Critical Stock", value: criticalStock, subtext: "Requires Attention", icon: <AlertTriangle /> },
    { variant: "amber", label: "Dummy Materials", value: dummyCount, subtext: "Simulation Data", icon: <FlaskConical /> },
    { variant: "blue", label: "System Sync", value: "100%", subtext: "Ecosystem Integrity", icon: <Activity /> },
  ];

  const tabs: [MasterTab, MasterTab] = [
    { key: "DAFTAR", label: "Daftar Barang", count: totalSku },
    { key: "KELOLA", label: "Kelola Barang", count: criticalStock },
  ];

  // ── Tab content: DAFTAR (read-only) ──
  const daftarContent = (
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      <TableWrapper>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Product Specification</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Category</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Logistics</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 text-right">Valuation</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 text-center">Stock Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Syncing Global Ledger...
                  </TableCell>
                </TableRow>
              ) : filteredGoods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada barang.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGoods.map((good) => (
                  <TableRow
                    key={good.id}
                    className="group hover:bg-slate-50/80 border-b border-slate-100"
                  >
                    <TableCell className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs uppercase">{good.name}</span>
                          {good.isDummy && <DnaBadge status="warning">DUMMY</DnaBadge>}
                        </div>
                        <span className="text-[11px] text-slate-500">{good.code || "PENDING_SKU"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <DnaBadge>{good.category?.name || "UNCATEGORIZED"}</DnaBadge>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px] text-slate-500">{good.outMethod}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px] text-slate-500">{good.leadTime} Days</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      <span className="font-bold text-slate-900 text-xs">Rp {Number(good.unitPrice).toLocaleString("id-ID")}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DnaBadge status={good.stockQty <= good.minLevel ? "critical" : "default"}>
                          {good.stockQty} {good.unit}
                        </DnaBadge>
                        {good.isHalalValidated && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TableWrapper>
    </div>
  );

  // ── Tab content: KELOLA (CRUD) ──
  const kelolaContent = (
    <>
      <div className="flex items-center justify-end mb-3">
        <DnaButton variant="primary" icon={<Plus />} onClick={openNew}>
          Tambah Barang
        </DnaButton>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <TableWrapper>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="hover:bg-transparent border-slate-200">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 w-10">#</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Product</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Category</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 text-right">Price</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 text-center">Stock</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 text-center w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredGoods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada barang. Klik "Tambah Barang" untuk menambah.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGoods.map((good, idx) => (
                    <TableRow
                      key={good.id}
                      className="group hover:bg-slate-50/80 border-b border-slate-100"
                    >
                      <TableCell className="px-4 py-3.5 text-slate-400 tabular-nums">{idx + 1}</TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs uppercase">{good.name}</span>
                          <span className="text-[11px] text-slate-500">{good.code || "PENDING_SKU"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <DnaBadge>{good.category?.name || "UNCATEGORIZED"}</DnaBadge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right">
                        <span className="font-bold text-slate-900 text-xs">Rp {Number(good.unitPrice).toLocaleString("id-ID")}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <DnaBadge status={good.stockQty <= good.minLevel ? "critical" : "default"}>
                          {good.stockQty} {good.unit}
                        </DnaBadge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(good)}
                            className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(good.id)}
                            className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TableWrapper>
      </div>
    </>
  );

  return (
    <>
      <MasterPageShell
        title="BARANG"
        badge={<DnaBadge status="info">MATERIALS</DnaBadge>}
        subtitle="Master SKU & material. Tab Daftar = lihat semua barang. Tab Kelola = CRUD dengan Sheet panel."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as "DAFTAR" | "KELOLA")}
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nama atau SKU..."
        daftarContent={daftarContent}
        kelolaContent={kelolaContent}
      />

      {/* Sheet: Add/Edit Material (multi-section form) */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="sm:max-w-[700px] p-0 border-l border-slate-200 shadow-2xl bg-white flex flex-col h-full">
          <SheetHeader className="p-8 bg-slate-800 text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600/20 rounded-xl">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold uppercase tracking-tight text-white leading-none">
                  {editingGood ? "Material Detail" : "Initialize Material"}
                </SheetTitle>
                <SheetDescription className="text-[11px] text-white/60 uppercase tracking-wider mt-1">
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
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product Name</Label>
                    <DnaInput value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border-none font-bold uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SKU / Code</Label>
                    <DnaInput value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="border-none font-bold uppercase" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</Label>
                    <Select value={formData.categoryId || ""} onValueChange={(v) => setFormData({ ...formData, categoryId: v || "" })}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase rounded-xl"><SelectValue placeholder="SELECT" /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl rounded-xl">{categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as string })}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl rounded-xl">
                        <SelectItem value="RAW_MATERIAL" className="text-xs font-bold uppercase">Raw Material</SelectItem>
                        <SelectItem value="FINISHED_GOODS" className="text-xs font-bold uppercase">Finished Goods</SelectItem>
                        <SelectItem value="PACKAGING" className="text-xs font-bold uppercase">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v as string })}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl rounded-xl">
                        <SelectItem value="KG" className="text-xs font-bold uppercase">KG</SelectItem>
                        <SelectItem value="LITER" className="text-xs font-bold uppercase">Liter</SelectItem>
                        <SelectItem value="PCS" className="text-xs font-bold uppercase">PCS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Physical Form</Label>
                    <Select value={formData.physicalForm} onValueChange={(v) => setFormData({ ...formData, physicalForm: v as typeof formData.physicalForm })}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-none shadow-xl rounded-xl">
                        <SelectItem value="CAIR" className="text-xs font-bold uppercase">Cair</SelectItem>
                        <SelectItem value="SERBUK" className="text-xs font-bold uppercase">Serbuk</SelectItem>
                        <SelectItem value="BUTIRAN" className="text-xs font-bold uppercase">Butiran</SelectItem>
                        <SelectItem value="PADAT" className="text-xs font-bold uppercase">Padat</SelectItem>
                        <SelectItem value="GAS" className="text-xs font-bold uppercase">Gas</SelectItem>
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
                      <Label className="text-[11px] font-bold text-slate-900 uppercase">Dummy Material</Label>
                      <Switch checked={formData.isDummy} onCheckedChange={(v) => setFormData({ ...formData, isDummy: v })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Lead Time (Days)</Label>
                      <DnaInput type="number" value={formData.leadTime} onChange={(e) => setFormData({ ...formData, leadTime: Number(e.target.value) })} className="h-10 bg-white border-slate-200 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-4 border-l border-slate-200 pl-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-900 uppercase">Outbound Engine</Label>
                      <Select value={formData.outMethod} onValueChange={(v) => setFormData({ ...formData, outMethod: v as "FIFO" | "FEFO" })}>
                        <SelectTrigger className="h-10 bg-white border-slate-200 font-bold text-xs uppercase rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="border-none shadow-xl rounded-xl">
                          <SelectItem value="FIFO" className="text-xs font-bold uppercase">FIFO</SelectItem>
                          <SelectItem value="FEFO" className="text-xs font-bold uppercase">FEFO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Usage Unit</Label>
                      <DnaInput value={formData.usageUnit || ""} onChange={(e) => setFormData({ ...formData, usageUnit: e.target.value })} className="h-10 bg-white border-slate-200 font-bold uppercase" />
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
                              batch.qcStatus === "GOOD" ? "bg-emerald-50" : batch.qcStatus === "QUARANTINE" ? "bg-amber-50" : "bg-rose-50"
                            )}>
                              {batch.qcStatus === "GOOD" ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> :
                                batch.qcStatus === "QUARANTINE" ? <Clock className="w-5 h-5 text-amber-500" /> :
                                <AlertTriangle className="w-5 h-5 text-rose-500" />}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900 uppercase">BATCH: {batch.batchNumber}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Qty: {batch.currentStock} {editingGood.unit} &middot; Loc: {batch.location?.name || "GEN_WAREHOUSE"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {batch.qcStatus === "QUARANTINE" && (
                              <>
                                <DnaButton variant="primary" size="sm" onClick={() => handleUpdateStatus(batch.id, "GOOD")}>Release</DnaButton>
                                <DnaButton variant="danger" size="sm" onClick={() => handleUpdateStatus(batch.id, "REJECT")}>Reject</DnaButton>
                              </>
                            )}
                            <DnaBadge status={
                              batch.qcStatus === "GOOD" ? "success" :
                                batch.qcStatus === "QUARANTINE" ? "warning" :
                                  "critical"
                            }>
                              {batch.qcStatus}
                            </DnaBadge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[11px] font-bold text-slate-400 uppercase">No Active Batches in Inventory</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editingGood && (
                <div className="px-8 pb-4 space-y-4">
                  <SectionDivider number={7} title="Supplier & HPP" />
                  <SupplierHistorySection materialId={editingGood.id} />
                  <HppBreakdownCard productId={editingGood.id} />
                </div>
              )}
            </form>
          </div>

          <SheetFooter className="p-8 bg-slate-50 border-t border-slate-200 shrink-0">
            <DnaButton variant="outline" onClick={() => setIsPanelOpen(false)}>Batal</DnaButton>
            <DnaButton variant="primary" type="button" onClick={handleSubmit}>
              {editingGood ? "Simpan" : "Tambah"}
            </DnaButton>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirm Submit */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menyimpan data barang ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Barang</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menghapus barang ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setDeletingId(null)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={() => deletingId && handleDelete(deletingId)}>Ya, Hapus</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
