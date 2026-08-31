"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 Calculator,
 History,
 Eye,
 Search,
 Boxes,
 ShieldAlert,
 CheckCircle2,
 X,
 ChevronLeft,
 Save,
 FileText,
 PieChart,
 TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
 OperationalButton,
 OperationalDataTable,
 OperationalField,
 OperationalInput,
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalPageShell,
 OperationalPanel,
 OperationalStatusBadge,
 getOperationalStatusLabel,
} from "@/components/operational";

// Static Data from Plan
const STATIC_HPP_REQUESTS = [
 { kode: "HPP-001", tanggal: "01/04/2026", pelanggan: "PT Maju Jaya", produk: "Hair Mask", formula: "FML-001 Rev 2", moq: 1000, status: "Proses" },
 { kode: "HPP-002", tanggal: "03/04/2026", pelanggan: "CV Sejahtera", produk: "Body Lotion", formula: "FML-002 Rev 1", moq: 500, status: "Selesai" },
 { kode: "HPP-003", tanggal: "07/04/2026", pelanggan: "Beauty Hub Indonesia", produk: "Sunscreen SPF 50", formula: "FML-004 Rev 3", moq: 2000, status: "Proses" },
 { kode: "HPP-004", tanggal: "10/04/2026", pelanggan: "PT Cosmo Indah", produk: "Facial Wash", formula: "FML-005 Rev 1", moq: 1500, status: "Selesai" },
 { kode: "HPP-005", tanggal: "14/04/2026", pelanggan: "UD Sinar Jaya", produk: "Hand Cream 50g", formula: "FML-008 Rev 1", moq: 3000, status: "Draft" },
];

const MOCK_SAMPLES = {
 "Sample-A": { name: "Anti-Aging Serum", netto: "30ml", revision: "Rev 3", formula: "FML-99-X" },
 "Sample-B": { name: "Brightening Day Cream", netto: "50g", revision: "Rev 1", formula: "FML-102-Y" },
 "Sample-C": { name: "Niacinamide Toner", netto: "100ml", revision: "Rev 2", formula: "FML-106-Z" },
};

const STATUS_TONE: Record<string, "pending" | "success" | "neutral" | "process" | "danger"> = {
 Proses: "process",
 Selesai: "success",
 Draft: "neutral",
};

export default function COGSRequestPrototype() {
 const [view, setView] = useState<"list" | "form">("list");
 const [selectedSample, setSelectedSample] = useState<string | null>(null);
 const [moqList, setMoqList] = useState<number[]>([]);
 const [currentMoq, setCurrentMoq] = useState<string>("");
 const [searchTerm, setSearchTerm] = useState("");

 const addMoq = () => {
 if (!currentMoq) return;
 setMoqList([...moqList, Number(currentMoq)]);
 setCurrentMoq("");
 };

 const { data: hppRequests = [], isLoading: hppLoading } = useQuery<any[]>({
 queryKey: ["cogs-hpp-requests"],
 queryFn: async () => {
 try {
 const resp = await api.get("/finance/cogs-requests");
 return resp.data;
 } catch {
 return STATIC_HPP_REQUESTS;
 }
 },
 });

 const { data: samples = {}, isLoading: samplesLoading } = useQuery({
 queryKey: ["rnd-samples-for-cogs"],
 queryFn: async () => {
 try {
 const resp = await api.get("/rnd/samples");
 return resp.data;
 } catch {
 return MOCK_SAMPLES;
 }
 },
 });

 const filteredRequests = hppRequests.filter((req: any) => {
 const term = searchTerm.toLowerCase();
 return (
 (req.pelanggan || "").toLowerCase().includes(term) ||
 (req.produk || "").toLowerCase().includes(term) ||
 (req.kode || "").toLowerCase().includes(term) ||
 (req.formula || "").toLowerCase().includes(term)
 );
 });

 const columns = [
 {
 accessorKey: "kode",
 header: "Request Identity",
 cell: ({ row }: { row: { original: any } }) => (
 <div className="flex items-center gap-2">
 <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <Calculator className="h-4 w-4" />
 </div>
 <div>
 <p className="font-black text-slate-900 tracking-tight text-[11px] uppercase italic leading-none">
 {row.original.kode}
 </p>
 <p className="text-[9px] font-medium text-slate-400 uppercase leading-none mt-1">
 {row.original.tanggal || "—"}
 </p>
 </div>
 </div>
 ),
 },
 {
 accessorKey: "pelanggan",
 header: "Client",
 cell: ({ getValue }: { getValue: () => string }) => (
 <span className="text-[11px] font-bold text-slate-800 uppercase">
 {getValue() ?? "—"}
 </span>
 ),
 },
 {
 accessorKey: "produk",
 header: "Product",
 cell: ({ getValue }: { getValue: () => string }) => (
 <span className="text-[11px] font-medium text-slate-600 uppercase">
 {getValue() ?? "—"}
 </span>
 ),
 },
 {
 accessorKey: "formula",
 header: "Formula Ref",
 cell: ({ getValue }: { getValue: () => string }) => (
 <span className="operational-status-badge is-info">{getValue() ?? "—"}</span>
 ),
 },
 {
 accessorKey: "moq",
 header: () => <div className="text-right">MOQ Target</div>,
 cell: ({ getValue }: { getValue: () => number }) => (
 <div className="text-right font-mono tabular-nums text-[11px] font-bold text-slate-900">
 {(getValue() ?? 0).toLocaleString("id-ID")} pcs
 </div>
 ),
 },
 {
 accessorKey: "status",
 header: () => <div className="text-center">Status</div>,
 cell: ({ row }: { row: { original: any } }) => {
 const s = row.original.status;
 return (
 <div className="flex justify-center">
 <OperationalStatusBadge status={STATUS_TONE[s] || "neutral"}>
 {getOperationalStatusLabel(s)}
 </OperationalStatusBadge>
 </div>
 );
 },
 },
 {
 id: "actions",
 header: () => <div className="text-center">Aksi</div>,
 cell: ({ row }: { row: { original: any } }) => (
 <div className="flex justify-center">
 <button
 type="button"
 className="operational-button is-primary h-8 px-3 text-[10px]"
 onClick={() => {
 setSelectedSample("Sample-A");
 setView("form");
 }}
 >
 <Eye className="h-3.5 w-3.5" />
 <span>Detail</span>
 </button>
 </div>
 ),
 },
 ];

 return (
 <OperationalPageShell
 title={view === "list" ? "Permintaan HPP" : "Form Permintaan HPP"}
 subtitle="Cost of Goods Sold Analysis & Multi-MOQ Margin Projection"
 actions={
 view === "list" ? (
 <div className="flex items-center gap-2">
 <button type="button" className="operational-button is-secondary">
 <History className="h-4 w-4 text-amber-500" />
 <span>Valuation History</span>
 </button>
 <button
 type="button"
 className="operational-button is-primary"
 onClick={() => setView("form")}
 >
 <Calculator className="h-4 w-4" />
 <span>Request Costing</span>
 </button>
 </div>
 ) : undefined
 }
 >
 {view === "list" ? (
 <div className="operational-stack">
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Active Requests"
 value="24"
 icon={<FileText className="h-4 w-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Avg. Valuation Time"
 value="1.2 Days"
 icon={<PieChart className="h-4 w-4" />}
 tone="green"
 />
 <OperationalMetricCard
 label="Cost Adjustments"
 value="15%"
 icon={<TrendingUp className="h-4 w-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Margin Alert"
 value="3"
 icon={<ShieldAlert className="h-4 w-4" />}
 tone="red"
 />
 </OperationalMetricGrid>

 <OperationalDataTable
 data={filteredRequests}
 columns={columns as any}
 getRowId={(row: any) => row.kode}
 searchPlaceholder="Cari klien, produk, atau kode..."
 loading={hppLoading}
 toolbar={
 <div className="flex items-center gap-2 text-[11px] text-slate-500">
 <span className="status-dot bg-blue-500 animate-pulse" />
 <span>Valuation Index • {filteredRequests.length} Records</span>
 </div>
 }
 />
 </div>
 ) : (
 <div className="operational-stack">
 <OperationalPanel className="!flex-row justify-between items-center gap-3">
 <button
 type="button"
 className="operational-button is-danger"
 onClick={() => setView("list")}
 >
 <ChevronLeft className="h-4 w-4" />
 <span>Abort Valuation</span>
 </button>
 <div className="flex items-center gap-4">
 <div className="flex flex-col items-end">
 <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Drafting Phase</span>
 <span className="text-[10px] font-black uppercase text-blue-600">Protocol 06-HPP</span>
 </div>
 <span className="h-6 w-px bg-slate-200" />
 <button
 type="button"
 className="operational-button is-primary"
 onClick={() => {
 toast.success("Request HPP berhasil difinalisasi!");
 setView("list");
 }}
 >
 <Save className="h-4 w-4" />
 <span>Finalize Request</span>
 </button>
 </div>
 </OperationalPanel>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2 space-y-4">
 <OperationalPanel>
 <div className="flex items-center gap-2 mb-3">
 <span className="status-dot bg-blue-600" />
 <h3 className="text-xs font-black uppercase tracking-tight text-slate-700">
 Entity Identification
 </h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <OperationalField label="Target Client">
 <select className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 text-[11px] font-bold uppercase focus:outline-none focus:border-blue-500">
 <option value="">— Select Client —</option>
 <option value="1">PT Maju Jaya</option>
 <option value="2">Beauty Hub Indonesia</option>
 </select>
 </OperationalField>
 <OperationalField label="Valuation Date">
 <input
 type="date"
 defaultValue={new Date().toISOString().split("T")[0]}
 className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 text-[11px] font-bold focus:outline-none focus:border-blue-500"
 />
 </OperationalField>
 </div>

 <div className="mt-3">
 <OperationalField label="Source Sample (R&D)">
 <select
 onChange={(e) => setSelectedSample(e.target.value)}
 value={selectedSample || ""}
 className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 text-[11px] font-bold uppercase focus:outline-none focus:border-blue-500"
 >
 <option value="">— Select Approved Sample —</option>
 {samplesLoading ? (
 <option disabled>Loading...</option>
 ) : (
 <>
 <option value="Sample-A">SSI-001 | Anti-Aging Serum</option>
 <option value="Sample-B">SSI-005 | Brightening Day Cream</option>
 <option value="Sample-C">SSI-006 | Niacinamide Toner</option>
 </>
 )}
 </select>
 </OperationalField>
 </div>

 {selectedSample && (
 <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
 <div className="space-y-0.5">
 <p className="text-[9px] font-black text-slate-400 uppercase">Product Name</p>
 <p className="font-black text-slate-900 text-[11px] uppercase italic">
 {samples[selectedSample as keyof typeof MOCK_SAMPLES]?.name ?? "—"}
 </p>
 </div>
 <div className="space-y-0.5 md:text-center">
 <p className="text-[9px] font-black text-slate-400 uppercase">Netto / Size</p>
 <p className="font-black text-slate-900 text-[11px] uppercase">
 {samples[selectedSample as keyof typeof MOCK_SAMPLES]?.netto ?? "—"}
 </p>
 </div>
 <div className="space-y-0.5 md:text-right">
 <p className="text-[9px] font-black text-slate-400 uppercase">Current Formula</p>
 <span className="operational-status-badge is-purple">
 {samples[selectedSample as keyof typeof MOCK_SAMPLES]?.formula ?? "—"}{" "}
 {samples[selectedSample as keyof typeof MOCK_SAMPLES]?.revision ?? "—"}
 </span>
 </div>
 </div>
 )}
 </OperationalPanel>

 <OperationalPanel>
 <div className="flex items-center gap-2 mb-3">
 <span className="status-dot bg-blue-600" />
 <h3 className="text-xs font-black uppercase tracking-tight text-slate-700">
 Packaging & Scale
 </h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <OperationalField label="Primary Packaging">
 <select className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 text-[11px] font-bold uppercase focus:outline-none focus:border-blue-500">
 <option>Bottle Airless 30ml Gold</option>
 <option>Jar Acrylic 50g White</option>
 </select>
 </OperationalField>
 <OperationalField label="Secondary Packaging">
 <select className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 text-[11px] font-bold uppercase focus:outline-none focus:border-blue-500">
 <option>Inner Box Ivory 350gsm + Doff</option>
 <option>Inner Box Silver Foil Gloss</option>
 </select>
 </OperationalField>
 </div>

 <div className="pt-3 border-t border-slate-100 mt-3 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
 MOQ Points for Analysis
 </span>
 <OperationalStatusBadge status="process">Comparative Costing</OperationalStatusBadge>
 </div>
 <div className="flex gap-3">
 <OperationalInput
 type="text"
 value={currentMoq}
 onChange={(e) => setCurrentMoq(e.target.value)}
 placeholder="E.g., 1000, 5000, 10000"
 icon={<Boxes className="w-4 h-4 text-slate-400" />}
 className="flex-1"
 />
 <button
 type="button"
 className="operational-button is-primary"
 onClick={addMoq}
 >
 <span>Add Point</span>
 </button>
 </div>

 {moqList.length > 0 && (
 <div className="flex flex-wrap gap-2 pt-2">
 {moqList.map((m, i) => (
 <span
 key={i}
 className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase rounded-lg px-3 py-1"
 >
 {m.toLocaleString()} pcs
 <button
 type="button"
 onClick={() => setMoqList(moqList.filter((_, idx) => idx !== i))}
 aria-label="Hapus MOQ"
 >
 <X className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600 transition-colors" />
 </button>
 </span>
 ))}
 </div>
 )}
 </div>

 <div className="pt-3 border-t border-slate-100 mt-3">
 <OperationalField label="Commercial Notes / Context">
 <textarea
 className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-medium focus:outline-none focus:border-blue-500"
 rows={3}
 placeholder="Provide context for valuation (e.g., promotional bundle or high-volume export order)..."
 />
 </OperationalField>
 </div>
 </OperationalPanel>
 </div>

 <div className="space-y-4">
 <OperationalPanel>
 <div className="space-y-3">
 <div>
 <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">
 Valuation Ledger
 </p>
 <h2 className="text-base font-black italic tracking-tight uppercase mt-1 leading-tight text-slate-900">
 Cost Integrity Index
 </h2>
 </div>

 <div className="space-y-3 pt-3 border-t border-slate-100">
 <div className="flex items-start gap-2">
 <div className="h-6 w-6 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
 <CheckCircle2 className="w-3 h-3 text-emerald-500" />
 </div>
 <div className="space-y-0.5">
 <p className="text-[10px] font-bold uppercase text-slate-800 leading-tight">
 Material Cost
 </p>
 <p className="text-[9px] font-medium text-slate-400 uppercase leading-none">
 Auto-fetched from Formula BOM
 </p>
 </div>
 </div>
 <div className="flex items-start gap-2">
 <div className="h-6 w-6 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
 <CheckCircle2 className="w-3 h-3 text-emerald-500" />
 </div>
 <div className="space-y-0.5">
 <p className="text-[10px] font-bold uppercase text-slate-800 leading-tight">
 Overhead Allocation
 </p>
 <p className="text-[9px] font-medium text-slate-400 uppercase leading-none">
 Based on Production Complexity
 </p>
 </div>
 </div>
 </div>

 <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-1">
 <p className="text-[9px] font-black uppercase tracking-wider text-blue-600">
 Protocol 06-HPP
 </p>
 <p className="text-[9px] font-medium text-slate-500 leading-relaxed uppercase">
 HPP analysis includes direct labor, variable overhead, and packaging loss buffers (3-5%).
 </p>
 </div>
 </div>
 </OperationalPanel>

 <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-white space-y-2">
 <div className="flex items-center gap-2 text-blue-600">
 <ShieldAlert className="w-4 h-4" />
 <span className="text-[10px] font-black uppercase tracking-wider">Valuation Policy</span>
 </div>
 <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase italic">
 "Every valuation must reflect current raw material market prices. Adjustments are valid for 14 working days."
 </p>
 </div>
 </div>
 </div>
 </div>
 )}
 </OperationalPageShell>
 );
}
