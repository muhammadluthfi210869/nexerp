"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, TableWrapper } from "@/components/dna";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, mapStatus } from "@/components/canonical";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  FileText,
  Package,
  RotateCcw,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Truck,
  PackageCheck,
  FileEdit,
  ClipboardList,
  User,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { QueryLoading } from "@/components/query-states";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency } from "@/lib/utils";
import { DnaButton } from "@/components/dna";

// Legacy STATUS_BADGE_MAP removed: replaced by canonical mapStatus() in @/components/canonical

function PRTab() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-requests");
      return unwrapResponse(res) || [];
    },
  });

  const total = requests?.length || 0;
  const pending = requests?.filter((r: any) => r.status === "DRAFT" || r.status === "SUBMITTED").length || 0;
  const urgent = requests?.filter((r: any) => r.priority === "URGENT").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Permintaan Pembelian</h3>
        <Link href="/scm/purchase-requests" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <PlusCircle className="h-3 w-3" /> Tambah Baru
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<FileText className="text-blue-600" />} label="Total Permintaan" value={total} />
        <StatCard icon={<Clock className="text-amber-600" />} label="Menunggu Approve" value={pending} />
        <StatCard icon={<AlertTriangle className="text-rose-600" />} label="Mendesak" value={urgent} />
      </div>
      <TableWrapper>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">ID</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Gudang</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Pembuat</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Jml Item</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-center">Status</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-16 text-center"><QueryLoading message="Memuat data..." /></TableCell></TableRow>
            ) : !requests || requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <EmptyState icon={<FileText className="h-8 w-8 text-slate-300" />} title="Belum Ada PR" description="Belum ada permintaan pembelian." />
                </TableCell>
              </TableRow>
            ) : requests?.slice(0, 5).map((pr: any) => (
              <TableRow key={pr.id} className="group hover:bg-slate-50/30 transition-all">
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[10px] italic">PR</div>
                    <div>
                      <p className="font-black text-slate-900 text-xs uppercase italic">#{pr.id?.split("-")[0]}</p>
                      <p className="text-[9px] font-black text-slate-400 mt-0.5">{pr.requestDate ? new Date(pr.requestDate).toLocaleDateString() : "-"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 font-medium text-slate-700 text-xs">{pr.warehouse?.name || "-"}</TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-600">{pr.creator?.fullName || pr.createdBy || "-"}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 text-right font-black text-slate-900 text-xs">{pr.items?.length || 0}</TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <StatusBadge variant={mapStatus(pr.status)}>{pr.status?.replace("_", " ") || "DRAFT"}</StatusBadge>
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <Link href={`/scm/purchase-requests`} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase">Lihat</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
      <div className="text-right">
        <Link href="/scm/purchase-requests" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">Lihat Semua Permintaan Pembelian →</Link>
      </div>
    </div>
  );
}

function POTab() {
  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return unwrapResponse(res) || [];
    },
  });

  const totalPo = purchaseOrders?.length || 0;
  const activePo = purchaseOrders?.filter((po: any) => po.status === "APPROVED" || po.status === "ORDERED").length || 0;
  const totalValue = (purchaseOrders || []).reduce((sum: number, po: any) => sum + Number(po.totalValue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Buat Pembelian</h3>
        <Link href="/scm/purchasing" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <PlusCircle className="h-3 w-3" /> Tambah Baru
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<ShoppingCart className="text-blue-600" />} label="Total PO" value={totalPo} />
        <StatCard icon={<Truck className="text-emerald-600" />} label="PO Aktif" value={activePo} />
        <StatCard icon={<Wallet className="text-amber-600" />} label="Total Nilai" value={`Rp ${(totalValue / 1000000).toFixed(1)}jt`} />
      </div>
      <TableWrapper>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">No. PO</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Supplier</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Tgl</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Nilai</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-center">Status</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-16 text-center"><QueryLoading message="Memuat data..." /></TableCell></TableRow>
            ) : !purchaseOrders || purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <EmptyState icon={<ShoppingCart className="h-8 w-8 text-slate-300" />} title="Belum Ada PO" description="Belum ada purchase order." />
                </TableCell>
              </TableRow>
            ) : purchaseOrders?.slice(0, 5).map((po: any) => (
              <TableRow key={po.id} className="group hover:bg-slate-50/30 transition-all">
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm border border-slate-200">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-black text-slate-900 text-xs uppercase italic">{po.poNumber}</span>
                      <p className="text-[9px] font-black text-slate-400 mt-0.5 uppercase">{po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "-"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 font-medium text-slate-700 text-xs">{po.supplier?.name || "-"}</TableCell>
                <TableCell className="py-3 px-4 text-slate-500 text-[10px] font-medium">{po.estArrival ? new Date(po.estArrival).toLocaleDateString() : "-"}</TableCell>
                <TableCell className="py-3 px-4 text-right font-black text-slate-900 text-xs tabular-nums">Rp {Number(po.totalValue).toLocaleString()}</TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <StatusBadge variant={mapStatus(po.status)}>{po.status?.replace("_", " ") || "DRAFT"}</StatusBadge>
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <Link href="/scm/purchasing" className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase">Lihat</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
      <div className="text-right">
        <Link href="/scm/purchasing" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">Lihat Semua Pembelian →</Link>
      </div>
    </div>
  );
}

function ReceivingTab() {
  const { data: receipts, isLoading } = useQuery({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/scm/inbounds");
      return (unwrapResponse(res) || []).map((grn: any) => ({
        id: grn.inboundNumber || grn.id,
        poId: grn.po?.poNumber || grn.poId || "-",
        vendor: grn.po?.supplier?.name || "-",
        date: grn.receivedAt ? new Date(grn.receivedAt).toISOString().split("T")[0] : "-",
        status: grn.status === "APPROVED" ? "VERIFIED" : "PENDING",
        qc: grn.status === "APPROVED" ? "PASSED" : "WAITING",
      }));
    },
  });

  const arrivalsToday = receipts?.filter((r: any) => r.date === new Date().toISOString().split("T")[0]).length || 0;
  const awaitingQc = receipts?.filter((r: any) => r.qc === "WAITING").length || 0;
  const verified = receipts?.filter((r: any) => r.status === "VERIFIED").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Pembelian Masuk</h3>
        <Link href="/scm/receiving" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <PlusCircle className="h-3 w-3" /> Tambah Baru
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Truck className="text-blue-600" />} label="Kedatangan Hari Ini" value={arrivalsToday} />
        <StatCard icon={<AlertCircle className="text-amber-600" />} label="Menunggu QC" value={awaitingQc} />
        <StatCard icon={<PackageCheck className="text-emerald-600" />} label="Terverifikasi" value={verified} />
      </div>
      <TableWrapper>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">ID GRN</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">PO Asal</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Pemasok</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-center">Status QC</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-16 text-center"><QueryLoading message="Memuat data..." /></TableCell></TableRow>
            ) : !receipts || receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <EmptyState icon={<PackageCheck className="h-8 w-8 text-slate-300" />} title="Belum Ada Penerimaan" description="Belum ada barang yang diterima." />
                </TableCell>
              </TableRow>
            ) : receipts?.slice(0, 5).map((receipt: any) => (
              <TableRow key={receipt.id} className="group hover:bg-slate-50/30 transition-all">
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm border border-slate-200">
                      <PackageCheck className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <span className="font-black text-slate-900 text-xs uppercase italic">{receipt.id}</span>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{receipt.date}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4"><StatusBadge variant="default">{receipt.poId}</StatusBadge></TableCell>
                <TableCell className="py-3 px-4 font-medium text-slate-700 text-xs">{receipt.vendor}</TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <StatusBadge variant={receipt.qc === "PASSED" ? "success" : "warning"}>{receipt.qc}</StatusBadge>
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <Link href="/scm/receiving" className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase">Lihat</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
      <div className="text-right">
        <Link href="/scm/receiving" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">Lihat Semua Penerimaan →</Link>
      </div>
    </div>
  );
}

function ReturnsTab() {
  const { data: returns, isLoading } = useQuery({
    queryKey: ["purchase-returns"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-returns");
      return unwrapResponse(res) || [];
    },
  });

  const totalReturns = returns?.length || 0;
  const pendingReturns = returns?.filter((r: any) => r.status === "DRAFT" || r.status === "WAITING_APPROVAL").length || 0;
  const completedReturns = returns?.filter((r: any) => r.status === "COMPLETED").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Retur Pembelian</h3>
        <Link href="/scm/purchase-returns" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <PlusCircle className="h-3 w-3" /> Tambah Baru
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<RotateCcw className="text-rose-600" />} label="Total Retur" value={totalReturns} />
        <StatCard icon={<Clock className="text-amber-600" />} label="Menunggu" value={pendingReturns} />
        <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Selesai" value={completedReturns} />
      </div>
      <TableWrapper>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">No. Retur</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Pemasok</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Pembuat</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Nilai</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-center">Status</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-16 text-center"><QueryLoading message="Memuat data..." /></TableCell></TableRow>
            ) : !returns || returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <EmptyState icon={<RotateCcw className="h-8 w-8 text-slate-300" />} title="Belum Ada Retur" description="Belum ada transaksi retur." />
                </TableCell>
              </TableRow>
            ) : returns?.slice(0, 5).map((ret: any) => (
              <TableRow key={ret.id} className="group hover:bg-slate-50/30 transition-all">
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-black text-slate-900 text-xs">{ret.returnNumber}</span>
                      <p className="text-[9px] font-medium text-slate-400">{ret.createdAt ? new Date(ret.createdAt).toLocaleDateString() : "-"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 font-black text-slate-700 text-xs">{ret.supplier?.name || "-"}</TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-600">{ret.creator?.fullName || "-"}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 text-right font-black text-rose-600 text-xs">Rp {Number(ret.totalValue).toLocaleString()}</TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <StatusBadge variant={mapStatus(ret.status)}>
                    {ret.status?.replace("_", " ") || "DRAFT"}
                  </StatusBadge>
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <Link href="/scm/purchase-returns" className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase">Lihat</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
      <div className="text-right">
        <Link href="/scm/purchase-returns" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">Lihat Semua Retur →</Link>
      </div>
    </div>
  );
}

function PaymentsTab() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-invoices");
      return unwrapResponse(res) || [];
    },
  });

  const invList = Array.isArray(invoices) ? invoices : [];
  const unpaid = invList.filter((inv: any) => inv.status === "UNPAID").length || 0;
  const paid = invList.filter((inv: any) => inv.status === "PAID").length || 0;
  const totalOutstanding = invList.reduce((sum: number, inv: any) => sum + Number(inv.outstandingAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Bayar Pembelian</h3>
        <Link href="/scm/purchasing/payments" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <PlusCircle className="h-3 w-3" /> Tambah Baru
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<CreditCard className="text-rose-600" />} label="Belum Dibayar" value={unpaid} />
        <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Lunas" value={paid} />
        <StatCard icon={<Wallet className="text-amber-600" />} label="Outstanding" value={`Rp ${totalOutstanding.toLocaleString()}`} />
      </div>
      <TableWrapper>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Faktur</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">PO / Pemasok</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Tgl</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Total</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Sisa</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-center">Status</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="py-16 text-center"><QueryLoading message="Memuat data..." /></TableCell></TableRow>
            ) : invList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <EmptyState icon={<CreditCard className="h-8 w-8 text-slate-300" />} title="Belum Ada Faktur" description="Belum ada faktur pembelian." />
                </TableCell>
              </TableRow>
            ) : invList.slice(0, 5).map((inv: any) => (
              <TableRow key={inv.id} className="group hover:bg-slate-50/30 transition-all">
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm border border-slate-200">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="font-black text-slate-900 text-xs uppercase italic">{inv.invoiceNumber}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <span className="text-[10px] font-black text-emerald-600 uppercase italic">{inv.supplier?.name || "-"}</span>
                </TableCell>
                <TableCell className="py-3 px-4 text-[11px] font-black text-slate-600 uppercase">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell className="py-3 px-4 text-right font-black text-slate-900 text-xs">Rp {Number(inv.amountDue).toLocaleString()}</TableCell>
                <TableCell className="py-3 px-4 text-right font-black text-xs" style={{ color: Number(inv.outstandingAmount) > 0 ? "#dc2626" : "#059669" }}>
                  Rp {Number(inv.outstandingAmount).toLocaleString()}
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <StatusBadge variant={inv.status === "PAID" ? "success" : "destructive"}>{inv.status === "PAID" ? "Lunas" : inv.status === "UNPAID" ? "Belum Lunas" : inv.status}</StatusBadge>
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <Link href="/scm/purchasing/payments" className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase">Lihat</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
      <div className="text-right">
        <Link href="/scm/purchasing/payments" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">Lihat Semua Pembayaran →</Link>
      </div>
    </div>
  );
}

function DPTab() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-invoices");
      return unwrapResponse(res) || [];
    },
  });

  const dpList = Array.isArray(invoices) ? invoices.filter((inv: any) => inv.type === "DP") : [];
  const totalDp = dpList.reduce((sum: number, dp: any) => sum + Number(dp.amountDue || 0), 0);
  const unpaidDp = dpList.filter((dp: any) => dp.status === "UNPAID").length || 0;
  const paidDp = dpList.filter((dp: any) => dp.status === "PAID").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">DP Pembelian</h3>
        <Link href="/scm/purchasing/down-payment" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <PlusCircle className="h-3 w-3" /> Tambah Baru
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<DollarSign className="text-blue-600" />} label="Total DP" value={`Rp ${(totalDp / 1000000).toFixed(1)}jt`} />
        <StatCard icon={<Clock className="text-amber-600" />} label="Belum Lunas" value={unpaidDp} />
        <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Lunas" value={paidDp} />
      </div>
      <TableWrapper>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">ID DP</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">PO / Pemasok</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Jumlah</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-center">Status</TableHead>
              <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-16 text-center"><QueryLoading message="Memuat data..." /></TableCell></TableRow>
            ) : dpList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <EmptyState icon={<DollarSign className="h-8 w-8 text-slate-300" />} title="Belum Ada DP" description="Belum ada uang muka pembelian." />
                </TableCell>
              </TableRow>
            ) : dpList.slice(0, 5).map((dp: any) => (
              <TableRow key={dp.id} className="group hover:bg-slate-50/30 transition-all">
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white text-slate-900 flex items-center justify-center font-black text-[9px] border border-slate-200">
                      DP
                    </div>
                    <span className="font-black text-slate-900 text-xs uppercase italic">{dp.invoiceNumber}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <span className="font-black text-slate-900 text-xs uppercase">{dp.po?.poNumber || "-"}</span>
                  <p className="text-[9px] font-black text-blue-600 uppercase italic mt-0.5">{dp.supplier?.name || "-"}</p>
                </TableCell>
                <TableCell className="py-3 px-4 text-right font-black text-slate-900 text-xs">Rp {Number(dp.amountDue).toLocaleString()}</TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <StatusBadge variant={dp.status === "PAID" ? "success" : "warning"}>{dp.status === "PAID" ? "Lunas" : "Belum Lunas"}</StatusBadge>
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <Link href="/scm/purchasing/down-payment" className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase">Lihat</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
      <div className="text-right">
        <Link href="/scm/purchasing/down-payment" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">Lihat Semua DP →</Link>
      </div>
    </div>
  );
}

const tabs = [
  { value: "pr", label: "Permintaan Pembelian", icon: FileText, component: PRTab },
  { value: "po", label: "Buat Pembelian", icon: ShoppingCart, component: POTab },
  { value: "receiving", label: "Pembelian Masuk", icon: PackageCheck, component: ReceivingTab },
  { value: "returns", label: "Retur Pembelian", icon: RotateCcw, component: ReturnsTab },
  { value: "payments", label: "Bayar Pembelian", icon: CreditCard, component: PaymentsTab },
  { value: "dp", label: "DP Pembelian", icon: DollarSign, component: DPTab },
];

export default function PembelianPage() {
  return (
    <DashboardShell
      title="Pembelian"
      titleAccent="SCM"
      subtitle="Manajemen Pembelian — Purchase Requests, Orders, Receiving, Returns & Payments"
    >
      <div className="phase4-pilot-page">
      <Tabs defaultValue="pr">
        <TabsList className="phase4-tabs-list mb-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="phase4-tabs-trigger">
              <tab.icon className="h-3.5 w-3.5 mr-1.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>
      </div>
    </DashboardShell>
  );
}
