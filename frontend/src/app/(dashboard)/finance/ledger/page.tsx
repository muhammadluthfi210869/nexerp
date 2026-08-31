"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogTitle,
 DialogHeader,
 DialogFooter,
} from "@/components/ui/dialog";
import {
 Plus,
 Search,
 BookOpen,
 Calculator,
 History as HistoryIcon,
 Trash2,
 FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
 OperationalPageShell,
 OperationalDataTable,
 OperationalPanel,
 OperationalMetricGrid,
 OperationalMetricCard,
 OperationalField,
 OperationalButton,
 getOperationalStatusLabel,
} from "@/components/operational";
import { OperationalInput } from "@/components/operational/OperationalUI";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { formatOperationalCurrency, formatOperationalNumber } from "@/lib/operational-formatters";

interface JournalLine {
 accountId: string;
 accountName: string;
 debit: number;
 credit: number;
 description: string;
}

interface JournalRow {
 id: string;
 reference: string;
 description: string;
 date: string;
 totalAmount: number;
 status: string;
 lines?: { debit: number }[];
}

export default function GeneralLedgerPage() {
 const queryClient = useQueryClient();
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [searchTerm, setSearchTerm] = useState("");

 // Form State
 const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
 const [reference, setReference] = useState("");
 const [generalNotes, setGeneralNotes] = useState("");
 const [lines, setLines] = useState<JournalLine[]>([]);

 // New Line State
 const [selectedAccountId, setSelectedAccountId] = useState("");
 const [lineDebit, setLineDebit] = useState("");
 const [lineCredit, setLineCredit] = useState("");
 const [lineNote, setLineNote] = useState("");
 const [showConfirm, setShowConfirm] = useState(false);

 // Queries
 const { data: coa } = useQuery({
 queryKey: ["coa"],
 queryFn: async () => {
 const resp = await api.get("/finance/accounts");
 const data = resp.data;
 return Array.isArray(data) ? data : (data?.accounts || data?.data || []);
 },
 });

 const { data: journals, isLoading } = useQuery<JournalRow[]>({
 queryKey: ["journals"],
 queryFn: async () => {
 const resp = await api.get("/finance/journals");
 return resp.data;
 },
 });

 const { data: stats } = useQuery({
 queryKey: ["finance-stats"],
 queryFn: async () => {
 const resp = await api.get("/finance/dashboard/advanced");
 return resp.data.metrics;
 }
 });

 const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
 const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
 const isBalanced = totalDebit === totalCredit && totalDebit > 0;

 const addLine = () => {
 if (!selectedAccountId || (!lineDebit && !lineCredit)) {
 toast.error("Account and either Debit or Credit required.");
 return;
 }
 const account = coa?.find((a: any) => a.id === selectedAccountId);
 if (!account) return;

 setLines([...lines, {
 accountId: selectedAccountId,
 accountName: account.name,
 debit: Number(lineDebit) || 0,
 credit: Number(lineCredit) || 0,
 description: lineNote
 }]);

 setSelectedAccountId("");
 setLineDebit("");
 setLineCredit("");
 setLineNote("");
 };

 const removeLine = (index: number) => {
 setLines(lines.filter((_, i) => i !== index));
 };

 const createJournalMutation = useMutation({
 mutationFn: async (data: any) => {
 const resp = await api.post("/finance/journals", data);
 return resp.data;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["journals"] });
 queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
 setIsAddModalOpen(false);
 setLines([]);
 setReference("");
 setGeneralNotes("");
 toast.success("Journal Entry Berhasil Diposting");
 },
 onError: (error: any) => {
 toast.error("Gagal Posting Journal: " + (error.response?.data?.message || error.message));
 }
 });

 const handleSubmit = () => {
 if (!isBalanced) return toast.error("Journal Tidak Balance!");
 if (lines.length < 2) return toast.error("Journal Minimal 2 Baris!");
 setShowConfirm(true);
 };

 const confirmSubmit = () => {
 setShowConfirm(false);
 createJournalMutation.mutate({
 date,
 reference,
 description: generalNotes,
 lines: lines.map(l => ({
 accountId: l.accountId,
 debit: l.debit,
 credit: l.credit,
 description: l.description
 }))
 });
 };

 const filteredJournals = useMemo(() => {
 return (journals || []).filter(jv =>
 (jv.reference || jv.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
 (jv.description || "").toLowerCase().includes(searchTerm.toLowerCase())
 );
 }, [journals, searchTerm]);

 const columns = useMemo(
 () => [
 {
 accessorKey: "reference",
 header: "Voucher / Description",
 cell: ({ row }: { row: { original: JournalRow } }) => (
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-slate-900">{row.original.reference || row.original.id || "—"}</span>
 <span className="text-[11px] text-slate-500">{row.original.description || "Manual Journal"}</span>
 </div>
 ),
 },
 {
 accessorKey: "date",
 header: "Posting Date",
 cell: ({ row }: { row: { original: JournalRow } }) => (
 <span className="text-[13px] text-slate-700">
 {row.original.date || "—"}
 </span>
 ),
 },
 {
 accessorKey: "totalAmount",
 header: () => <div className="text-right">Total Amount</div>,
 cell: ({ row }: { row: { original: JournalRow } }) => {
 const amount = row.original.totalAmount ||
 row.original.lines?.reduce((sum: number, l: any) => sum + Number(l.debit), 0) ||
 0;
 return (
 <div className="text-right font-mono tabular-nums text-[13px] font-semibold text-slate-900">
 {formatOperationalCurrency(amount)}
 </div>
 );
 },
 },
 {
 accessorKey: "status",
 header: () => <div className="text-center">Status</div>,
 cell: ({ row }: { row: { original: JournalRow } }) => {
 const s = row.original.status || "POSTED";
 return (
 <div className="flex justify-center">
 <span className="operational-status-badge is-success">
 {getOperationalStatusLabel(s) === "—" ? "Posted" : getOperationalStatusLabel(s)}
 </span>
 </div>
 );
 },
 },
 {
 id: "actions",
 header: () => <div className="text-right">Action</div>,
 cell: () => (
 <div className="flex justify-end">
 <button type="button" className="operational-button is-secondary h-8 px-3 text-[11px]">
 <FileText className="h-3.5 w-3.5" />
 <span>Details</span>
 </button>
 </div>
 ),
 },
 ],
 [],
 );

 return (
 <OperationalPageShell
 title="General Ledger"
 subtitle="Manual Journal & Adjustments • Fiscal Compliance v4.0"
 actions={
 <button
 type="button"
 className="operational-button is-primary"
 onClick={() => setIsAddModalOpen(true)}
 >
 <Plus className="h-4 w-4" />
 <span>New Journal Entry</span>
 </button>
 }
 >
 <div className="grid grid-cols-12 gap-6 items-start">
 {/* Left Column: Sidebar */}
 <div className="col-span-12 lg:col-span-3 space-y-6">
 <OperationalPanel>
 <div className="space-y-4">
 <button
 type="button"
 className="operational-button is-primary w-full"
 onClick={() => setIsAddModalOpen(true)}
 >
 <Plus className="h-4 w-4" />
 <span>New Journal Entry</span>
 </button>

 <div className="space-y-2 pt-3 border-t border-slate-100">
 <OperationalField label="Cari Voucher">
 <OperationalInput
 icon={<Search className="h-4 w-4" />}
 placeholder="Keterangan / Ref..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </OperationalField>
 </div>
 </div>
 </OperationalPanel>

 <OperationalPanel>
 <h4 className="text-[10px] font-black uppercase tracking-tight text-slate-500 mb-3">
 Compliance Audit
 </h4>
 <div className="space-y-3">
 <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
 <span className="text-[11px] font-medium text-slate-600">Unposted Drafts</span>
 <span className="operational-status-badge is-info">0</span>
 </div>
 <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
 <span className="text-[11px] font-medium text-slate-600">System Integrity</span>
 <span className="operational-status-badge is-success">100% OK</span>
 </div>
 </div>
 </OperationalPanel>
 </div>

 {/* Right Column: Main Content */}
 <div className="col-span-12 lg:col-span-9 space-y-6">
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Total Journals"
 value={formatOperationalNumber(journals?.length || 0)}
 icon={<BookOpen className="w-4 h-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Monthly Profit"
 value={formatOperationalCurrency(stats?.profit ?? 0)}
 icon={<Calculator className="w-4 h-4" />}
 tone="green"
 />
 <OperationalMetricCard
 label="Total Assets"
 value={formatOperationalCurrency(stats?.totalAssets ?? 0)}
 icon={<HistoryIcon className="w-4 h-4" />}
 tone="purple"
 />
 </OperationalMetricGrid>

 <OperationalDataTable
 data={filteredJournals as unknown as JournalRow[]}
 columns={columns as any}
 getRowId={(row: JournalRow) => row.id}
 loading={isLoading}
 toolbar={
 <div className="flex flex-col">
 <h3 className="text-[13px] font-semibold text-slate-900">
 General Ledger Registry
 </h3>
 <span className="text-[11px] text-slate-500">
 Fiscal Ledger Vouchers • {filteredJournals.length} Records
 </span>
 </div>
 }
 searchPlaceholder="Cari voucher, referensi, atau deskripsi..."
 />
 </div>
 </div>

 {/* Dialog container placed globally */}
 <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
 <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
 <div className="bg-blue-600 p-6 text-white relative">
 <DialogTitle className="text-xl font-semibold leading-none text-white">Journal Voucher Form</DialogTitle>
 <DialogDescription className="text-blue-100 text-[12px] mt-1.5">Double-entry accounting protocol</DialogDescription>
 <Calculator className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-white opacity-30" />
 </div>

 <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
 <div className="grid grid-cols-3 gap-4">
 <OperationalField label="Tanggal">
 <OperationalInput
 type="date"
 value={date}
 onChange={(e) => setDate(e.target.value)}
 />
 </OperationalField>
 <OperationalField label="No. Bukti / Referensi">
 <OperationalInput
 placeholder="Nomor memo internal..."
 value={reference}
 onChange={(e) => setReference(e.target.value)}
 />
 </OperationalField>
 <OperationalField label="Keterangan Jurnal">
 <OperationalInput
 placeholder="Deskripsi tujuan jurnal..."
 value={generalNotes}
 onChange={(e) => setGeneralNotes(e.target.value)}
 />
 </OperationalField>
 </div>

 {/* DYNAMIC ROWS */}
 <div className="space-y-3 pt-3 border-t border-slate-100">
 <div className="flex justify-between items-center px-1">
 <span className="text-[11px] font-semibold text-slate-700">Transaction Lines</span>
 <span className={cn(
 "operational-status-badge",
 isBalanced ? "is-success" : "is-danger"
 )}>
 {isBalanced ? "Balanced" : `Diff: ${formatOperationalCurrency(Math.abs(totalDebit - totalCredit))}`}
 </span>
 </div>

 <div className="grid grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 items-end">
 <div className="col-span-4">
 <Select value={selectedAccountId} onValueChange={(v) => setSelectedAccountId(v || "")}>
 <SelectTrigger className="h-9">
 <SelectValue placeholder="Pilih Akun (CoA)..." />
 </SelectTrigger>
 <SelectContent>
 {coa?.map((a: any) => (
 <SelectItem key={a.id} value={a.id || ""}>{a.id} - {a.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="col-span-2">
 <OperationalInput
 type="number"
 placeholder="Debit (Rp)"
 value={lineDebit}
 onChange={(e) => { setLineDebit(e.target.value); if(e.target.value) setLineCredit(""); }}
 />
 </div>
 <div className="col-span-2">
 <OperationalInput
 type="number"
 placeholder="Kredit (Rp)"
 value={lineCredit}
 onChange={(e) => { setLineCredit(e.target.value); if(e.target.value) setLineDebit(""); }}
 />
 </div>
 <div className="col-span-3">
 <OperationalInput
 placeholder="Notes..."
 value={lineNote}
 onChange={(e) => setLineNote(e.target.value)}
 />
 </div>
 <div className="col-span-1">
 <OperationalButton variant="primary" onClick={addLine} className="w-full h-9 p-0">
 <Plus size={14} />
 </OperationalButton>
 </div>
 </div>

 {lines.length > 0 && (
 <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
 <table className="erp-data-table-inner w-full text-[13px]">
 <thead className="bg-slate-50">
 <tr>
 <th className="h-9 text-left text-[11px] font-semibold text-slate-600 px-3">Account</th>
 <th className="h-9 text-right text-[11px] font-semibold text-slate-600 px-3">Debit</th>
 <th className="h-9 text-right text-[11px] font-semibold text-slate-600 px-3">Credit</th>
 <th className="h-9 text-left text-[11px] font-semibold text-slate-600 px-3">Notes</th>
 <th className="h-9 text-right text-[11px] font-semibold text-slate-600 px-3 w-12"></th>
 </tr>
 </thead>
 <tbody>
 {lines.map((line, idx) => (
 <tr key={idx} className="bg-white border-t border-slate-50">
 <td className="px-3 py-2 text-[13px]">{line.accountName || "—"}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums text-[13px] text-emerald-700">
 {line.debit > 0 ? formatOperationalCurrency(line.debit) : "—"}
 </td>
 <td className="px-3 py-2 text-right font-mono tabular-nums text-[13px] text-rose-700">
 {line.credit > 0 ? formatOperationalCurrency(line.credit) : "—"}
 </td>
 <td className="px-3 py-2 text-[11px] text-slate-500">
 {line.description || "—"}
 </td>
 <td className="px-3 py-2 text-right">
 <button
 type="button"
 className="operational-button is-ghost h-7 w-7 p-0"
 onClick={() => removeLine(idx)}
 aria-label="Hapus baris"
 >
 <Trash2 size={13} />
 </button>
 </td>
 </tr>
 ))}
 <tr className="bg-slate-900 text-white">
 <td className="px-3 py-2 font-semibold text-[11px] uppercase">Totals</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums text-[13px] font-semibold">{formatOperationalCurrency(totalDebit)}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums text-[13px] font-semibold">{formatOperationalCurrency(totalCredit)}</td>
 <td colSpan={2}></td>
 </tr>
 </tbody>
 </table>
 </div>
 )}
 </div>

 <OperationalButton
 variant="primary"
 className="w-full"
 disabled={!isBalanced || createJournalMutation.isPending}
 onClick={handleSubmit}
 >
 {createJournalMutation.isPending ? "Posting..." : "Post Journal Entry"}
 </OperationalButton>
 </div>
 </DialogContent>
 </Dialog>
 <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Konfirmasi</DialogTitle>
 </DialogHeader>
 <p>Apakah Anda yakin ingin menyimpan data ini?</p>
 <DialogFooter>
 <button type="button" className="operational-button is-secondary" onClick={() => setShowConfirm(false)}>Batal</button>
 <button type="button" className="operational-button is-primary" onClick={confirmSubmit}>Ya, Simpan</button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </OperationalPageShell>
 );
}