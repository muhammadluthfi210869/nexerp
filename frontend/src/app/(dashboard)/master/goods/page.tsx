"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package,
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
import type { ColumnDef } from "@tanstack/react-table";
import { OperationalInput } from "@/components/operational/OperationalUI";
import {
  OperationalDataTable,
  OperationalMetricGrid,
  OperationalMetricCard,
  OperationalButton,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational/OperationalUI";
import {
  OperationalMigrationShell,
} from "@/components/operational/OperationalMigrationShell";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatOperationalCurrency } from "@/lib/operational-formatters";

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

  const columns: ColumnDef<Good>[] = [
    {
      id: "specification",
      header: "Spesifikasi Produk",
      accessorFn: (row) => row.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-xs uppercase">{row.original.name}</span>
              {row.original.isDummy && (
                <OperationalStatusBadge status="pending">DUMMY</OperationalStatusBadge>
              )}
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              {row.original.code || "PENDING_SKU"}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Kategori",
      accessorFn: (row) => row.category?.name || "TANPA KATEGORI",
      cell: ({ row }) => (
        <OperationalStatusBadge status="neutral">
          {row.original.category?.name || "TANPA KATEGORI"}
        </OperationalStatusBadge>
      ),
    },
    {
      id: "logistics",
      header: "Logistik",
      accessorFn: (row) => row.outMethod,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-bold text-slate-500 uppercase">{row.original.outMethod}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-bold text-slate-500 uppercase">{row.original.leadTime} Hari</span>
          </div>
        </div>
      ),
    },
    {
      id: "value",
      header: "Nilai",
      accessorFn: (row) => row.unitPrice,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="font-black text-slate-900 text-xs">{formatOperationalCurrency(row.original.unitPrice)}</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-tighter">Rata-rata Bergerak</span>
        </div>
      ),
    },
    {
      id: "stockStatus",
      header: "Status Stok",
      accessorFn: (row) => row.stockQty,
      cell: ({ row }) => (
        <div className="flex flex-col items-center gap-1">
          <OperationalStatusBadge status={row.original.stockQty <= row.original.minLevel ? "danger" : "neutral"}>
            {row.original.stockQty} {row.original.unit}
          </OperationalStatusBadge>
          {row.original.isHalalValidated && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      enableSorting: false,
      cell: ({ row }) => (
        <OperationalButton
          variant="ghost"
          aria-label={`Inspect ${row.original.name}`}
          onClick={() => {
            fetchGoodDetail(row.original.id);
            setIsPanelOpen(true);
          }}
        >
          <Info className="h-4 w-4" />
        </OperationalButton>
      ),
    },
  ];

  return (
    <OperationalMigrationShell
      title="Master Barang"
      subtitle="Katalog SKU, klasifikasi, dan informasi logistik"
      actions={
        <>
          <OperationalButton variant="secondary">
            <History className="h-4 w-4" />
            <span>Log Audit</span>
          </OperationalButton>
          <OperationalButton
            variant="primary"
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
            <Plus className="h-4 w-4" />
            <span>Tambah Barang</span>
          </OperationalButton>
        </>
      }
      filters={
        <OperationalInput
          icon={<Search className="h-4 w-4" />}
          placeholder="Cari nama atau SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white max-w-sm flex-1"
          autoFocus
        />
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total SKU"
            value={goods.length}
            helper="SKU terdaftar"
            icon={<Package className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Stok Kritis"
            value={criticalStock}
            helper="Perlu Perhatian"
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="red"
          />
          <OperationalMetricCard
            label="Material Contoh"
            value={dummyCount}
            helper="Data simulasi"
            icon={<FlaskConical className="h-4 w-4" />}
            tone="purple"
          />
          <OperationalMetricCard
            label="Sinkronisasi Sistem"
            value="100%"
            helper="Integritas data"
            icon={<Activity className="h-4 w-4" />}
            tone="green"
          />
        </OperationalMetricGrid>

        <OperationalDataTable
          data={filteredGoods}
          columns={columns as any}
          getRowId={(row: Good) => row.id}
          toolbar={
            <span className="text-[10px] font-semibold text-slate-400">
              {filteredGoods.length} data · {goods.length} total SKU · Klik baris untuk detail
            </span>
          }
          searchPlaceholder=""
          enableSearch={false}
          enableColumnVisibility={false}
          loading={loading}
          emptyMessage="Syncing Global Ledger..."
        />
      </div>

      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="sm:max-w-[700px] p-0 flex flex-col h-full">
          <SheetHeader className="p-8 shrink-0">
            <div className="flex items-center gap-4">
              <Package className="w-5 h-5" />
              <div>
                <SheetTitle>
                  {editingGood ? "Material Detail" : "Initialize Material"}
                </SheetTitle>
                <SheetDescription>
                  Ecosystem Entry Protocol
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <form onSubmit={handleSubmit} className="p-8 operational-stack">
              {/* Essential Architecture */}
              <div className="operational-stack">
                <div className="operational-section-title">
                  <span>1</span>
                  <span>Essential Architecture</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="operational-field">
                    <span>Product Name</span>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="operational-field">
                    <span>SKU / Code</span>
                    <input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="operational-field">
                    <span>Category</span>
                    <Select value={formData.categoryId || ""} onValueChange={(v) => setFormData({ ...formData, categoryId: v || "" })}>
                      <SelectTrigger><SelectValue placeholder="SELECT" /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="operational-field">
                    <span>Type</span>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RAW_MATERIAL">Raw Material</SelectItem>
                        <SelectItem value="FINISHED_GOODS">Finished Goods</SelectItem>
                        <SelectItem value="PACKAGING">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="operational-field">
                    <span>Unit</span>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="LITER">Liter</SelectItem>
                        <SelectItem value="PCS">PCS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Logistics Intelligence */}
              <div className="operational-stack">
                <div className="operational-section-title">
                  <span>2</span>
                  <span>Logistics Intelligence</span>
                </div>
                <div className="grid grid-cols-2 gap-6 operational-panel p-6">
                  <div className="operational-stack">
                    <div className="flex items-center justify-between">
                      <Label>Dummy Material</Label>
                      <Switch checked={formData.isDummy} onCheckedChange={(v) => setFormData({ ...formData, isDummy: v })} />
                    </div>
                    <div className="operational-field">
                      <span>Lead Time (Days)</span>
                      <input
                        type="number"
                        value={formData.leadTime}
                        onChange={(e) => setFormData({ ...formData, leadTime: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="operational-stack border-l border-slate-200 pl-6">
                    <div className="operational-field">
                      <span>Outbound Engine</span>
                      <Select value={formData.outMethod} onValueChange={(v) => setFormData({ ...formData, outMethod: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIFO">FIFO</SelectItem>
                          <SelectItem value="FEFO">FEFO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="operational-field">
                      <span>Usage Unit</span>
                      <input
                        value={formData.usageUnit || ""}
                        onChange={(e) => setFormData({ ...formData, usageUnit: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {editingGood && (
                <div className="operational-stack">
                  <div className="operational-section-title">
                    <span>3</span>
                    <span>Batch Integrity & QC Release</span>
                  </div>
                  <div className="operational-stack">
                    {editingGood.inventories && editingGood.inventories.length > 0 ? (
                      editingGood.inventories.map((batch) => (
                        <div key={batch.id} className="operational-panel p-5 flex items-center justify-between">
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
                                <OperationalButton
                                  variant="primary"
                                  onClick={() => handleUpdateStatus(batch.id, 'GOOD')}
                                >
                                  Release
                                </OperationalButton>
                                <OperationalButton
                                  variant="danger"
                                  onClick={() => handleUpdateStatus(batch.id, 'REJECT')}
                                >
                                  Reject
                                </OperationalButton>
                              </>
                            )}
                            <OperationalStatusBadge
                              status={
                                batch.qcStatus === 'GOOD' ? "success" :
                                batch.qcStatus === 'QUARANTINE' ? "pending" :
                                "danger"
                              }
                            >
                              {getOperationalStatusLabel(batch.qcStatus)}
                            </OperationalStatusBadge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center operational-panel">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">No Active Batches in Inventory</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          <SheetFooter className="p-8 shrink-0">
            <OperationalButton variant="secondary" onClick={() => setIsPanelOpen(false)}>Discard</OperationalButton>
            <OperationalButton variant="primary" type="button" onClick={handleSubmit}>
              {editingGood ? "Commit" : "Deploy"}
            </OperationalButton>
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
            <OperationalButton variant="secondary" onClick={() => setShowConfirm(false)}>Batal</OperationalButton>
            <OperationalButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</OperationalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalMigrationShell>
  );
}
