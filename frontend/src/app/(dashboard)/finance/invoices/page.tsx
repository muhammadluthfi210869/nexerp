"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 Search,
 FileCheck2,
 CreditCard,
 UserCheck,
 AlertTriangle,
 Download,
 Zap,
 Mail,
} from "lucide-react";
import {
 PageShell,
 CanonicalMetricGrid,
 MetricCard,
 DataTable,
 StatusBadge,
 mapStatus,
} from "@/components/canonical";
import { FinalDocumentPdfButton } from "@/components/documents/FinalDocumentPdfButton";
import { formatOperationalCurrency } from "@/lib/operational-formatters";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import type { ColumnDef } from "@tanstack/react-table";

interface Invoice {
 id: string;
 invoiceNumber: string;
 customer: string;
 date: string;
 dueDate: string;
 amount: number;
 status: string;
 source: string;
 type: string;
 clientName: string;
 brandName: string;
 items: any[];
}

export default function InvoicingPage() {
 const [searchTerm, setSearchTerm] = useState("");

 const { data: invoices, isLoading } = useQuery<Invoice[]>({
 queryKey: ["invoices"],
 queryFn: async () => {
 const resp = await api.get("/finance/invoices");
 return resp.data.map((inv: any) => ({
 id: inv.invoiceNumber,
 invoiceNumber: inv.invoiceNumber,
 customer: inv.customerName || inv.so?.lead?.clientName || "Unknown",
 date: new Date(inv.issuedAt || inv.createdAt).toISOString().split('T')[0],
 dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
 amount: Number(inv.amountDue || inv.totalAmount || 0),
 status: inv.status,
 source: inv.type === "DP" ? "DP Invoice" : "Final Invoice",
 type: inv.type,
 clientName: inv.customerName || inv.so?.lead?.clientName || "Unknown",
 brandName: inv.so?.brandName || "",
 items: inv.so?.items || [],
 }));
 },
 });

 const filteredInvoices = invoices?.filter(inv =>
 inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
 inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
 ) || [];

 const columns = useMemo<ColumnDef<Invoice, any>[]>(
 () => [
 {
 id: "invoice",
 header: "Identitas Invoice",
 cell: ({ row }) => (
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
 <FileCheck2 className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="font-medium text-slate-900 tracking-tight text-[12px] uppercase">{row.original.id}</span>
 <span className="text-[10px] text-slate-400 mt-0.5">Jatuh tempo: {row.original.dueDate}</span>
 </div>
 </div>
 ),
 },
 {
 id: "customer",
 header: "Pelanggan / Mitra",
 cell: ({ row }) => (
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-medium text-[10px] text-slate-500 uppercase">
 {row.original.customer.charAt(0)}
 </div>
 <p className="font-medium text-slate-900 text-[12px] uppercase">{row.original.customer}</p>
 </div>
 ),
 },
 {
 accessorKey: "source",
 header: () => <div className="text-center">Sumber Transaksi</div>,
 cell: ({ getValue }) => (
 <div className="text-center">
 <span className="rounded-md border border-[#E2E8F0] text-slate-500 font-medium uppercase text-[10px] tracking-tight px-1.5 py-0.5">
 {String(getValue() ?? "—")}
 </span>
 </div>
 ),
 },
 {
 accessorKey: "amount",
 header: () => <div className="text-right">Jumlah Terutang</div>,
 cell: ({ getValue }) => (
 <span className="block text-right font-medium text-slate-900 text-[12px] tabular-nums">
 {formatOperationalCurrency(Number(getValue() ?? 0))}
 </span>
 ),
 },
 {
 accessorKey: "status",
 header: () => <div className="text-center">Status</div>,
 cell: ({ getValue }) => (
 <div className="text-center">
 <StatusBadge variant={mapStatus(String(getValue()))}>
 {getOperationalStatusLabel(String(getValue()))}
 </StatusBadge>
 </div>
 ),
 },
 {
 id: "actions",
 header: () => <div className="text-right">Aksi</div>,
 cell: ({ row }) => (
 <div className="flex justify-end gap-1.5">
 <FinalDocumentPdfButton
 documentType={row.original.type === "DP" ? "INVOICE_DP" : "INVOICE_FINAL"}
 documentNumber={row.original.invoiceNumber}
 data={{
 clientName: row.original.clientName,
 brandName: row.original.brandName,
 soNumber: row.original.id,
 amount: row.original.amount,
 items: row.original.items,
 dueDate: row.original.dueDate,
 notes: `${row.original.source} for ${row.original.clientName}`,
 }}
 />
 <button
 type="button"
 aria-label="Email"
 className="h-8 w-8 rounded-md border border-[#E2E8F0] bg-white text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
 >
 <Mail className="h-3.5 w-3.5" />
 </button>
 </div>
 ),
 },
 ],
 [],
 );

 return (
 <PageShell
 title="Piutang Pelanggan"
 subtitle="Penerbitan invoice dan pengelolaan penagihan pelanggan"
 actions={
 <div className="flex gap-2">
 <button
 type="button"
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
 >
 <Download className="h-4 w-4" />
 <span>Ekspor Ledger</span>
 </button>
 <button
 type="button"
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700"
 >
 <Zap className="h-4 w-4" />
 <span>Tagihan Massal</span>
 </button>
 </div>
 }
 >
 <div className="flex flex-col gap-6">
 <CanonicalMetricGrid>
 <MetricCard
 label="Total Piutang"
 value="Rp 170.0M"
 helper="Rp 45,0 jt jatuh tempo 14 hari"
 icon={<CreditCard />}
 variant="info"
 />
 <MetricCard
 label="Tertagih (MTD)"
 value="Rp 89.2M"
 helper="65% dari target"
 icon={<UserCheck />}
 variant="success"
 />
 <MetricCard
 label="Menunggu Persetujuan"
 value="4 Invoice"
 helper="Menunggu pemeriksaan"
 icon={<AlertTriangle />}
 variant="warning"
 />
 </CanonicalMetricGrid>

 <DataTable
 title="Daftar Invoice"
 searchPlaceholder="Cari invoice..."
 data={filteredInvoices}
 columns={columns}
 getRowId={(row) => row.id}
 loading={isLoading}
 emptyMessage="Belum ada invoice ditemukan"
 toolbarRight={
 <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400">
 <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
 <input
 type="search"
 placeholder="Cari invoice..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700 placeholder:text-slate-400"
 />
 </label>
 }
 enableSearch={false}
 />
 </div>
 </PageShell>
 );
}
