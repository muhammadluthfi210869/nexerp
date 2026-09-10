"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowDownCircle,
  Search,
  Building2,
  CreditCard,
  FileText,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { DnaInput, DnaButton, DnaBadge, StatCard, TableWrapper } from "@/components/dna";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DpConsolidatedPage() {
  const [searchPembelian, setSearchPembelian] = useState("");
  const [searchPenjualan, setSearchPenjualan] = useState("");

  const { data: purchaseOrders } = useQuery<any[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => (await api.get("/scm/purchase-orders")).data,
    retry: false,
  });

  const { data: salesOrders } = useQuery<any[]>({
    queryKey: ["finance-sales-orders"],
    queryFn: async () => (await api.get("/finance/sales-orders")).data,
    retry: false,
  });

  const poList = (purchaseOrders || []).filter((p: any) => p.status !== "CANCELLED");
  const soList = (salesOrders || []).filter((s: any) => {
    const total = Number(s.totalAmount) || 0;
    const paid = Number(s.amountPaid) || 0;
    return paid < total;
  });

  const totalDpPembelianTerbayar = poList.reduce((s: number, p: any) => s + (Number(p.paidAmount) || 0), 0);
  const totalDpPembelianOutstanding = poList.reduce((s: number, p: any) => {
    const total = Number(p.totalAmount) || 0;
    const paid = Number(p.paidAmount) || 0;
    return s + (total - paid);
  }, 0);
  const totalDpPenjualanTerbayar = soList.reduce((s: number, o: any) => s + (Number(o.amountPaid) || 0), 0);
  const totalDpPenjualanOutstanding = soList.reduce((s: number, o: any) => {
    const total = Number(o.totalAmount) || 0;
    const paid = Number(o.amountPaid) || 0;
    return s + (total - paid);
  }, 0);

  const filteredPO = poList.filter((p: any) =>
    (p.poNumber || "").toLowerCase().includes(searchPembelian.toLowerCase()) ||
    (p.supplier?.name || p.supplierName || "").toLowerCase().includes(searchPembelian.toLowerCase())
  );
  const filteredSO = soList.filter((o: any) =>
    (o.orderNumber || "").toLowerCase().includes(searchPenjualan.toLowerCase()) ||
    (o.lead?.clientName || "").toLowerCase().includes(searchPenjualan.toLowerCase())
  );

  const poStatusBadge = (status: string) => {
    if (status === "APPROVED") return <DnaBadge status="success">APPROVED</DnaBadge>;
    if (status === "PENDING") return <DnaBadge status="warning">PENDING</DnaBadge>;
    if (status === "DP_PAID") return <DnaBadge status="info">DP PAID</DnaBadge>;
    return <DnaBadge status="default">{status}</DnaBadge>;
  };

  return (
    <DashboardShell
      title="DOWN"
      titleAccent="PAYMENT"
      subtitle="Uang Muka Pembelian & Penjualan — DP Management Hub"
    >
      <Tabs defaultValue="pembelian" className="space-y-6">
        <div className="relative">
          <TabsList className="bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl h-14 inline-flex gap-1 border border-slate-200/50 shadow-inner">
            {[
              { id: "pembelian", label: "DP Pembelian", icon: Building2 },
              { id: "penjualan", label: "DP Penjualan", icon: ArrowUpRight },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative rounded-xl px-6 h-full data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-500 transition-all duration-300 text-[10px] font-black uppercase tracking-tight"
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="pembelian" className="space-y-6 animate-fade-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total PO"
              value={poList.length}
              icon={<FileText className="text-blue-600" />}
            />
            <StatCard
              label="DP Terbayar"
              value={`Rp ${totalDpPembelianTerbayar.toLocaleString("id-ID")}`}
              icon={<CheckCircle2 className="text-emerald-600" />}
            />
            <StatCard
              label="Outstanding"
              value={`Rp ${totalDpPembelianOutstanding.toLocaleString("id-ID")}`}
              icon={<Clock className="text-amber-500" />}
            />
          </div>
          <TableWrapper
            filters={
              <div className="flex items-center justify-between w-full">
                <div className="relative w-full max-w-md">
                  <DnaInput
                    icon={<Search className="h-4 w-4" />}
                    placeholder="Cari PO atau Supplier..."
                    value={searchPembelian}
                    onChange={(e) => setSearchPembelian(e.target.value)}
                  />
                </div>
                <DnaButton
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={() => window.location.href = "/finance/dp-pembelian"}
                >
                  Tambah DP Baru
                </DnaButton>
              </div>
            }
          >
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/70">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">PO Number</TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Supplier</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Total</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sudah Dibayar</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sisa</TableHead>
                  <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
                  <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPO.map((po: any) => {
                  const total = Number(po.totalAmount) || 0;
                  const paid = Number(po.paidAmount) || 0;
                  const sisa = total - paid;
                  return (
                    <TableRow key={po.id} className="group hover:bg-slate-50/30 transition-all border-b border-slate-50">
                      <TableCell className="pl-6 py-4">
                        <span className="font-black text-slate-900 text-xs uppercase italic">{po.poNumber}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700 text-xs">{po.supplier?.name || po.supplierName || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">Rp {total.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums py-4 font-black text-emerald-600 text-xs">Rp {paid.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums py-4 font-black text-rose-600 text-xs">Rp {sisa.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-center py-4">{poStatusBadge(po.status)}</TableCell>
                      <TableCell className="pr-6 text-right py-4">
                        <DnaButton
                          variant="outline"
                          size="sm"
                          icon={<ArrowDownCircle className="h-3.5 w-3.5" />}
                          onClick={() => window.location.href = "/finance/dp-pembelian"}
                        >
                          Bayar DP
                        </DnaButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPO.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400 italic text-xs">Tidak ada PO ditemukan.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </TabsContent>

        <TabsContent value="penjualan" className="space-y-6 animate-fade-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total SO Belum Lunas"
              value={soList.length}
              icon={<FileText className="text-blue-600" />}
            />
            <StatCard
              label="DP Terbayar"
              value={`Rp ${totalDpPenjualanTerbayar.toLocaleString("id-ID")}`}
              icon={<CheckCircle2 className="text-emerald-600" />}
            />
            <StatCard
              label="Sisa Piutang"
              value={`Rp ${totalDpPenjualanOutstanding.toLocaleString("id-ID")}`}
              icon={<AlertTriangle className="text-rose-500" />}
            />
          </div>
          <TableWrapper
            filters={
              <div className="flex items-center justify-between w-full">
                <div className="relative w-full max-w-md">
                  <DnaInput
                    icon={<Search className="h-4 w-4" />}
                    placeholder="Cari SO atau Customer..."
                    value={searchPenjualan}
                    onChange={(e) => setSearchPenjualan(e.target.value)}
                  />
                </div>
                <DnaButton
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = "/finance/dp-penjualan"}
                >
                  Tambah DP Baru
                </DnaButton>
              </div>
            }
          >
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/70">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">SO Number</TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Customer</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Total</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sudah Dibayar</TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sisa</TableHead>
                  <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
                  <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSO.map((so: any) => {
                  const total = Number(so.totalAmount) || 0;
                  const paid = Number(so.amountPaid) || 0;
                  const sisa = total - paid;
                  return (
                    <TableRow key={so.id} className="group hover:bg-slate-50/30 transition-all border-b border-slate-50">
                      <TableCell className="pl-6 py-4">
                        <span className="font-black text-slate-900 text-xs uppercase italic">{so.orderNumber}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700 text-xs">{so.lead?.clientName || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">Rp {total.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums py-4 font-black text-emerald-600 text-xs">Rp {paid.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums py-4 font-black text-rose-600 text-xs">Rp {sisa.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-center py-4">
                        <DnaBadge status={paid === 0 ? "critical" : paid < total ? "warning" : "success"}>
                          {paid === 0 ? "Belum Bayar" : paid < total ? "Partial" : "Lunas"}
                        </DnaBadge>
                      </TableCell>
                      <TableCell className="pr-6 text-right py-4">
                        <DnaButton
                          variant="outline"
                          size="sm"
                          icon={<ArrowUpRight className="h-3.5 w-3.5" />}
                          onClick={() => window.location.href = "/finance/dp-penjualan"}
                        >
                          Catat DP
                        </DnaButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredSO.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400 italic text-xs">Tidak ada SO ditemukan.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
