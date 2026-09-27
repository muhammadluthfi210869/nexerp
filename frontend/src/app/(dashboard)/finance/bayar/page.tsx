"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  Wallet,
  Building2,
  Receipt,
  CircleDollarSign,
  FileCheck2,
  Clock,
  CheckCircle2,
  Plus,
  CreditCard,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { DnaInput, DnaButton, DnaBadge, DnaDataTableCard, DnaStatCard, DnaTabNav } from "@/components/dna";
import {
  DnaTable,
  DnaTableBody,
  DnaTd,
  DnaTh,
  DnaTableHead,
  DnaTableRow,
} from "@/components/dna";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";

const statusMap: Record<string, { label: string; badge: "success" | "warning" | "critical" }> = {
  PAID: { label: "LUNAS", badge: "success" },
  PARTIAL: { label: "SEBAGIAN", badge: "warning" },
  UNPAID: { label: "TERUTANG", badge: "critical" },
};

export default function BayarConsolidatedPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pembelian");
  const [searchPembelian, setSearchPembelian] = useState("");
  const [searchPenjualan, setSearchPenjualan] = useState("");
  const [searchSample, setSearchSample] = useState("");

  const { data: bills, isLoading: billsLoading, isError: billsError } = useQuery<any[]>({
    queryKey: ["vendor-bills"],
    queryFn: async () => {
      const resp = await api.get("/finance/bills");
      return resp.data.map((b: any) => ({
        id: b.id || b.billNumber,
        billNumber: b.billNumber,
        vendorName: b.vendorName,
        totalAmount: Number(b.totalAmount),
        paidAmount: Number(b.paidAmount || 0),
        remaining: Number(b.remaining || b.totalAmount),
        status: b.status,
      }));
    },
  });

  const { data: invoices, isLoading: invLoading, isError: invError } = useQuery<any[]>({
    queryKey: ["invoices-receivable"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      return resp.data
        .filter((inv: any) => inv.type === "RECEIVABLE" || !inv.type)
        .map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          totalAmount: Number(inv.totalAmount),
          paidAmount: Number(inv.paidAmount || 0),
          remainingAmount: Number(inv.remainingAmount || inv.totalAmount),
          status: inv.status,
          dueDate: new Date(inv.dueDate).toISOString().split("T")[0],
        }));
    },
  });

  const { data: samples, isLoading: sampLoading, isError: sampError } = useQuery<any[]>({
    queryKey: ["bussdev-samples-payment"],
    queryFn: async () => {
      const resp = await api.get("/bussdev/samples");
      return resp.data
        .filter((s: any) => s.status !== "CANCELLED")
        .map((s: any) => ({
          id: s.id,
          code: s.code,
          customerName: s.customerName,
          totalAmount: Number(s.totalAmount || s.unitPrice * s.qty),
          paidAmount: Number(s.paidAmount || 0),
          remainingAmount: Number(s.remainingAmount || s.unitPrice * s.qty),
          paymentStatus: s.paymentStatus || "UNPAID",
        }));
    },
  });

  const filteredBills = (bills || []).filter((b: any) =>
    (b.billNumber || "").toLowerCase().includes(searchPembelian.toLowerCase()) ||
    (b.vendorName || "").toLowerCase().includes(searchPembelian.toLowerCase())
  );
  const filteredInvoices = (invoices || []).filter((inv: any) =>
    (inv.invoiceNumber || "").toLowerCase().includes(searchPenjualan.toLowerCase()) ||
    (inv.customerName || "").toLowerCase().includes(searchPenjualan.toLowerCase())
  );
  const filteredSamples = (samples || []).filter((s: any) =>
    (s.code || "").toLowerCase().includes(searchSample.toLowerCase()) ||
    (s.customerName || "").toLowerCase().includes(searchSample.toLowerCase())
  );

  const totalBillOutstanding = (bills || []).reduce((s: number, b: any) => s + (b.remaining || 0), 0);
  const totalReceivable = (invoices || []).reduce((s: number, inv: any) => s + inv.remainingAmount, 0);
  const totalSampleOutstanding = (samples || []).reduce((s: number, sm: any) => s + sm.remainingAmount, 0);
  const overdueCount = (invoices || []).filter((inv: any) => inv.status === "OVERDUE").length;

  return (
    <DashboardShell
      title="Report"
      titleAccent="PENJUALAN"
      subtitle="Penerimaan piutang penjualan, pelunasan, dan rekonsiliasi payments."
    >
      <>
        <DnaTabNav
          tabs={[
            { id: "pembelian", label: "Bayar Pembelian", icon: Receipt },
            { id: "penjualan", label: "Bayar Penjualan", icon: CircleDollarSign },
            { id: "sample", label: "Bayar Sample", icon: FileCheck2 },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div hidden={activeTab !== "pembelian"} className="space-y-6 animate-fade-slide-in">
          {billsLoading ? (
            <QueryLoading message="Memuat faktur pembelian..." />
          ) : billsError ? (
            <QueryError error="Gagal memuat data faktur" onRetry={() => queryClient.invalidateQueries({ queryKey: ["vendor-bills"] })} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DnaStatCard label="Total Faktur" value={(bills || []).length} icon={<Receipt className="text-blue-600" />} />
                <DnaStatCard label="Total Terutang" value={`Rp ${totalBillOutstanding.toLocaleString("id-ID")}`} icon={<AlertTriangle className="text-rose-500" />} />
                <DnaStatCard label="Supplier" value={`${new Set((bills || []).map((b: any) => b.vendorName)).size} Vendor`} icon={<Building2 className="text-slate-500" />} />
              </div>
              <DnaDataTableCard
                customToolbar={
                  <div className="flex items-center justify-between w-full">
                    <div className="relative w-full max-w-md">
                      <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari invoice / supplier..." value={searchPembelian} onChange={(e) => setSearchPembelian(e.target.value)} />
                    </div>
                    <DnaButton variant="primary" icon={<Plus className="h-4 w-4" />} className="bg-rose-600 hover:bg-rose-700" onClick={() => window.location.href = "/finance/bayar-pembelian"}>
                      Bayar Baru
                    </DnaButton>
                  </div>
                }
              >
                <DnaTable className="table-dense">
                  <DnaTableHead className="bg-slate-50/70">
                    <DnaTableRow className="hover:bg-transparent border-slate-100">
                      <DnaTh className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Invoice</DnaTh>
                      <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Supplier</DnaTh>
                      <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Amount</DnaTh>
                      <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Paid</DnaTh>
                      <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Remaining</DnaTh>
                      <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
                      <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Aksi</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {filteredBills.map((bill: any) => (
                      <DnaTableRow key={bill.id} className="group hover:bg-slate-50/30 transition-all border-b border-slate-50">
                        <DnaTd className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                              <Receipt className="h-4 w-4" />
                            </div>
                            <span className="font-black text-slate-900 text-xs uppercase italic">{bill.billNumber}</span>
                          </div>
                        </DnaTd>
                        <DnaTd className="py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-black text-slate-700 text-xs uppercase">{bill.vendorName}</span>
                          </div>
                        </DnaTd>
                        <DnaTd className="text-right tabular-nums py-4 font-semibold text-slate-900 text-xs">Rp {bill.totalAmount.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="text-right tabular-nums py-4 font-semibold text-emerald-600 text-xs">Rp {bill.paidAmount.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="text-right tabular-nums py-4 font-semibold text-slate-900 text-xs">Rp {bill.remaining.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="text-center py-4">
                          <DnaBadge variant={statusMap[bill.status]?.badge || "default"}>{statusMap[bill.status]?.label || bill.status}</DnaBadge>
                        </DnaTd>
                        <DnaTd className="pr-6 text-right py-4">
                          <DnaButton variant="primary" size="sm" icon={<Wallet className="h-3.5 w-3.5" />} onClick={() => window.location.href = "/finance/bayar-pembelian"}>Bayar</DnaButton>
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                    {filteredBills.length === 0 && (
                      <DnaTableRow><DnaTd colSpan={7} className="text-center py-10 text-slate-400 italic text-xs">Tidak ada faktur ditemukan.</DnaTd></DnaTableRow>
                    )}
                  </DnaTableBody>
                </DnaTable>
              </DnaDataTableCard>
            </>
          )}
        </div>

        <div hidden={activeTab !== "penjualan"} className="space-y-6 animate-fade-slide-in">
          {invLoading ? (
            <QueryLoading message="Memuat faktur penjualan..." />
          ) : invError ? (
            <QueryError error="Gagal memuat data faktur" onRetry={() => queryClient.invalidateQueries({ queryKey: ["invoices-receivable"] })} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DnaStatCard label="Total Piutang" value={`Rp ${totalReceivable.toLocaleString("id-ID")}`} icon={<Wallet className="text-emerald-600" />} />
                <DnaStatCard label="Overdue" value={overdueCount.toString()} subValue="Faktur jatuh tempo" icon={<Clock className="text-rose-500" />} />
                <DnaStatCard label="Outstanding" value={`${filteredInvoices.length} Faktur`} icon={<FileCheck2 className="text-amber-500" />} />
              </div>
              <DnaDataTableCard
                customToolbar={
                  <div className="flex items-center justify-between w-full">
                    <div className="relative w-full max-w-md">
                      <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari invoice / pelanggan..." value={searchPenjualan} onChange={(e) => setSearchPenjualan(e.target.value)} />
                    </div>
                    <DnaButton variant="primary" icon={<CreditCard className="h-4 w-4" />} className="bg-emerald-600 hover:bg-emerald-700" onClick={() => window.location.href = "/finance/bayar-penjualan"}>
                      Terima Pembayaran
                    </DnaButton>
                  </div>
                }
              >
                <DnaTable className="table-dense">
                  <DnaTableHead className="bg-slate-50/70">
                    <DnaTableRow className="hover:bg-transparent border-slate-100">
                      <DnaTh className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Invoice</DnaTh>
                      <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Customer</DnaTh>
                      <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Amount</DnaTh>
                      <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Paid</DnaTh>
                      <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Remaining</DnaTh>
                      <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
                      <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Aksi</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {filteredInvoices.map((inv: any) => (
                      <DnaTableRow key={inv.id} className="group hover:bg-emerald-50/30 transition-all border-b border-slate-50">
                        <DnaTd className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                              <FileCheck2 className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-black text-slate-900 text-xs uppercase italic">{inv.invoiceNumber}</span>
                              <p className="text-[9px] font-medium text-slate-400">Due: {inv.dueDate}</p>
                            </div>
                          </div>
                        </DnaTd>
                        <DnaTd className="py-4">
                          <span className="font-black text-slate-900 text-xs uppercase">{inv.customerName}</span>
                        </DnaTd>
                        <DnaTd className="text-right tabular-nums py-4 font-semibold text-slate-900 text-xs">Rp {inv.totalAmount.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="text-right tabular-nums py-4 font-semibold text-emerald-600 text-xs">Rp {inv.paidAmount.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="text-right tabular-nums py-4 font-semibold text-rose-600 text-xs">Rp {inv.remainingAmount.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="text-center py-4">
                          <DnaBadge variant={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "critical" : "warning"}>
                            {inv.status === "PAID" ? "Lunas" : inv.status === "OVERDUE" ? "Overdue" : "Belum Lunas"}
                          </DnaBadge>
                        </DnaTd>
                        <DnaTd className="pr-6 text-right py-4">
                          <DnaButton variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700" icon={<CircleDollarSign className="h-3.5 w-3.5" />} onClick={() => window.location.href = "/finance/bayar-penjualan"}>
                            Terima
                          </DnaButton>
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                    {filteredInvoices.length === 0 && (
                      <DnaTableRow><DnaTd colSpan={7} className="text-center py-10 text-slate-400 italic text-xs">Tidak ada faktur ditemukan.</DnaTd></DnaTableRow>
                    )}
                  </DnaTableBody>
                </DnaTable>
              </DnaDataTableCard>
            </>
          )}
        </div>

        <div hidden={activeTab !== "sample"} className="space-y-6 animate-fade-slide-in">
          {sampLoading ? (
            <QueryLoading message="Memuat data sample..." />
          ) : sampError ? (
            <QueryError error="Gagal memuat data sample" onRetry={() => queryClient.invalidateQueries({ queryKey: ["bussdev-samples-payment"] })} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DnaStatCard label="Total Outstanding" value={`Rp ${totalSampleOutstanding.toLocaleString("id-ID")}`} icon={<Wallet className="text-rose-500" />} />
                <DnaStatCard label="Menunggu Bayar" value={(samples || []).filter((s: any) => s.remainingAmount > 0).length} subValue="Sample pending" icon={<Clock className="text-amber-500" />} />
                <DnaStatCard label="Total Sample" value={`${filteredSamples.length} Order`} icon={<FileCheck2 className="text-blue-600" />} />
              </div>
              <DnaDataTableCard
                customToolbar={
                  <div className="flex items-center justify-between w-full">
                    <div className="relative w-full max-w-md">
                      <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari kode sample / customer..." value={searchSample} onChange={(e) => setSearchSample(e.target.value)} />
                    </div>
                    <DnaButton variant="primary" icon={<ArrowRight className="h-4 w-4" />} className="bg-emerald-600 hover:bg-emerald-700" onClick={() => window.location.href = "/finance/bayar-sample"}>
                      Bayar Sample
                    </DnaButton>
                  </div>
                }
              >
                <DnaTable className="table-dense">
                  <DnaTableHead className="bg-slate-50/70">
                    <DnaTableRow className="hover:bg-transparent border-slate-100">
                      <DnaTh className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Kode Sample</DnaTh>
                      <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Customer</DnaTh>
                      <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Total</DnaTh>
                      <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sudah Bayar</DnaTh>
                      <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sisa</DnaTh>
                      <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
                      <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Aksi</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {filteredSamples.map((sample: any) => (
                      <DnaTableRow key={sample.id} className="group hover:bg-emerald-50/30 transition-all border-b border-slate-50">
                        <DnaTd className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                              <FileCheck2 className="h-4 w-4" />
                            </div>
                            <span className="font-black text-slate-900 text-xs uppercase italic">{sample.code}</span>
                          </div>
                        </DnaTd>
                        <DnaTd className="py-4">
                          <span className="font-black text-slate-900 text-xs uppercase">{sample.customerName}</span>
                        </DnaTd>
                        <DnaTd className="text-right tabular-nums py-4 font-semibold text-slate-900 text-xs">Rp {sample.totalAmount.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="text-right tabular-nums py-4 font-semibold text-emerald-600 text-xs">Rp {sample.paidAmount.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="text-right tabular-nums py-4 font-semibold text-rose-600 text-xs">Rp {sample.remainingAmount.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="text-center py-4">
                          <DnaBadge variant={sample.paymentStatus === "PAID" ? "success" : sample.paymentStatus === "PARTIAL" ? "warning" : "critical"}>
                            {sample.paymentStatus === "PAID" ? "Lunas" : sample.paymentStatus === "PARTIAL" ? "Partial" : "Belum Bayar"}
                          </DnaBadge>
                        </DnaTd>
                        <DnaTd className="pr-6 text-right py-4">
                          {sample.remainingAmount > 0 && (
                            <DnaButton variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700" icon={<CircleDollarSign className="h-3.5 w-3.5" />} onClick={() => window.location.href = "/finance/bayar-sample"}>Bayar</DnaButton>
                          )}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                    {filteredSamples.length === 0 && (
                      <DnaTableRow><DnaTd colSpan={7} className="text-center py-10 text-slate-400 italic text-xs">Tidak ada sample payment ditemukan.</DnaTd></DnaTableRow>
                    )}
                  </DnaTableBody>
                </DnaTable>
              </DnaDataTableCard>
            </>
          )}
        </div>
      </>
    </DashboardShell>
  );
}
