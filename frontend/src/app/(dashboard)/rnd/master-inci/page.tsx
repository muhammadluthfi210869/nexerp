"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 Search,
 Plus,
 Upload,
 Beaker,
 Edit2,
 Trash2,
} from "lucide-react";
import {
 PageShell,
 DataTable,
 StatusBadge,
 mapStatus,
 SectionCard,
 SectionCardContent,
} from "@/components/canonical";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

const CATEGORIES = [
 { value: "ALL", label: "All Categories", variant: "default" as const },
 { value: "ALLOWED", label: "Allowed", variant: "success" as const },
 { value: "RESTRICTED", label: "Restricted", variant: "warning" as const },
 { value: "PROHIBITED", label: "Prohibited", variant: "destructive" as const },
 { value: "PRESERVATIVE", label: "Preservative", variant: "info" as const },
 { value: "COLORANT", label: "Colorant", variant: "info" as const },
 { value: "UV_FILTER", label: "UV Filter", variant: "info" as const },
];

export default function MasterInciPage() {
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState("");
 const [categoryFilter, setCategoryFilter] = useState("ALL");
 const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
 const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
 const [editingItem, setEditingItem] = useState<any>(null);

 const { data: incis, isLoading } = useQuery({
 queryKey: ["master-inci", searchTerm, categoryFilter],
 queryFn: async () => {
 const params = new URLSearchParams();
 if (searchTerm) params.append("search", searchTerm);
 if (categoryFilter !== "ALL") params.append("category", categoryFilter);
 const resp = await api.get(`/legality/master-inci?${params.toString()}`);
 return resp.data;
 },
 });

 const createMutation = useMutation({
 mutationFn: (data: any) => api.post("/legality/master-inci", data),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["master-inci"] });
 toast.success("INCI added to regulatory brain");
 setIsAddDialogOpen(false);
 },
 });

 const updateMutation = useMutation({
 mutationFn: (data: any) => api.patch(`/legality/master-inci/${data.id}`, data),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["master-inci"] });
 toast.success("Regulatory limits updated");
 setIsAddDialogOpen(false);
 setEditingItem(null);
 },
 });

 const deleteMutation = useMutation({
 mutationFn: (id: string) => api.delete(`/legality/master-inci/${id}`),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["master-inci"] });
 toast.success("Ingredient removed");
 },
 });

 const bulkImportMutation = useMutation({
 mutationFn: (data: any[]) => api.post("/legality/master-inci/bulk", { data }),
 onSuccess: (resp) => {
 queryClient.invalidateQueries({ queryKey: ["master-inci"] });
 toast.success(`Import Success: ${resp.data.importedCount} added, ${resp.data.updatedCount} updated`);
 setIsImportDialogOpen(false);
 },
 });

 const handleEdit = (item: any) => {
 setEditingItem(item);
 setIsAddDialogOpen(true);
 };

 const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = (event) => {
 try {
 const json = JSON.parse(event.target?.result as string);
 bulkImportMutation.mutate(json);
 } catch (err) {
 toast.error("Invalid file format. Upload valid JSON.");
 }
 };
 reader.readAsText(file);
 };

 const columns = useMemo<ColumnDef<any, any>[]>(
 () => [
 {
 accessorKey: "inciName",
 header: "Ingredient Profile",
 cell: ({ row }) => (
 <div className="flex items-center gap-3">
 <span
 className={cn(
 "h-9 w-9 rounded-lg flex items-center justify-center border",
 row.original.category === "PROHIBITED"
 ? "bg-rose-50 text-rose-500 border-rose-100"
 : row.original.category === "RESTRICTED"
 ? "bg-amber-50 text-amber-500 border-amber-100"
 : "bg-slate-50 text-slate-400 border-slate-100",
 )}
 >
 <Beaker className="h-4 w-4" />
 </span>
 <div>
 <h4 className="text-[13px] font-medium text-slate-900">{row.original.inciName}</h4>
 <span className="text-[11px] text-slate-500">CAS: {row.original.casNumber || "N/A"}</span>
 </div>
 </div>
 ),
 },
 {
 accessorKey: "category",
 header: "Safety Category",
 cell: ({ row }) => (
 <StatusBadge variant={mapStatus(row.original.category)}>
 {row.original.category ?? "—"}
 </StatusBadge>
 ),
 },
 {
 accessorKey: "maxConcentration",
 header: () => <div className="text-center">Max Conc.</div>,
 cell: ({ getValue }) => (
 <div className="text-center text-[13px] font-medium text-slate-900">
 {getValue() ? `${getValue()}%` : <span className="text-slate-400">No Limit</span>}
 </div>
 ),
 },
 {
 accessorKey: "prohibitedContext",
 header: "Regulatory Notes",
 cell: ({ row }) => (
 <p className="text-[12px] text-slate-500 line-clamp-1 max-w-[300px]">
 {row.original.prohibitedContext ||
 row.original.warningText ||
 "General cosmetic usage allowed."}
 </p>
 ),
 },
 {
 id: "actions",
 header: () => <div className="text-right">Aksi</div>,
 cell: ({ row }) => (
 <div className="flex justify-end gap-1">
 <button
 type="button"
 onClick={() => handleEdit(row.original)}
 className="h-9 w-9 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white flex items-center justify-center"
 aria-label="Edit"
 >
 <Edit2 className="h-3.5 w-3.5 text-slate-400" />
 </button>
 <button
 type="button"
 onClick={() => {
 if (confirm("Are you sure?")) deleteMutation.mutate(row.original.id);
 }}
 className="h-9 w-9 rounded-lg border border-transparent hover:border-rose-100 hover:bg-rose-50 flex items-center justify-center"
 aria-label="Hapus"
 >
 <Trash2 className="h-3.5 w-3.5 text-slate-400" />
 </button>
 </div>
 ),
 },
 ],
 [],
 );

 return (
 <PageShell
 title="Master INCI"
 subtitle="International Nomenclature of Cosmetic Ingredients"
 actions={
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => setIsImportDialogOpen(true)}
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
 >
 <Upload className="h-4 w-4" />
 <span>Bulk Import</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setEditingItem(null);
 setIsAddDialogOpen(true);
 }}
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700"
 >
 <Plus className="h-4 w-4" />
 <span>Tambah Bahan</span>
 </button>
 </div>
 }
 >
 <div className="flex flex-col gap-6">
 <SectionCard>
 <SectionCardContent>
 <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center w-full">
 <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400 w-full lg:w-[400px]">
 <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
 <input
 type="search"
 placeholder="Cari INCI atau CAS..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700 placeholder:text-slate-400"
 />
 </label>

 <div className="flex gap-1.5 p-1 bg-slate-50 rounded-lg border border-[#E2E8F0] overflow-x-auto no-scrollbar">
 {CATEGORIES.map((cat) => (
 <button
 key={cat.value}
 onClick={() => setCategoryFilter(cat.value)}
 className={cn(
 "px-3 py-1.5 rounded-md text-[10px] font-medium uppercase whitespace-nowrap transition-all",
 categoryFilter === cat.value
 ? "bg-white text-blue-600 shadow-sm border border-slate-200"
 : "text-slate-500 hover:text-slate-700",
 )}
 >
 {cat.label}
 </button>
 ))}
 </div>
 </div>
 </SectionCardContent>
 </SectionCard>

 <DataTable
 data={incis ?? []}
 columns={columns}
 getRowId={(row: any) => row.id}
 searchPlaceholder="Cari INCI, CAS, atau catatan..."
 emptyMessage="Belum ada data INCI."
 loading={isLoading}
 enableSearch={false}
 />
 </div>

 <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>
 {editingItem ? "Edit Regulatory Limit" : "Add New Ingredient"}
 </DialogTitle>
 </DialogHeader>
 <form
 onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target as HTMLFormElement);
 const data = Object.fromEntries(formData.entries());
 if (editingItem) updateMutation.mutate({ ...data, id: editingItem.id });
 else createMutation.mutate(data);
 }}
 className="space-y-4"
 >
 <div className="grid grid-cols-2 gap-4">
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-medium text-slate-700">INCI Name</label>
 <input
 name="inciName"
 defaultValue={editingItem?.inciName}
 required
 className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-medium text-slate-700">CAS Number</label>
 <input
 name="casNumber"
 defaultValue={editingItem?.casNumber}
 className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-medium text-slate-700">Category</label>
 <select
 name="category"
 defaultValue={editingItem?.category || "ALLOWED"}
 className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
 >
 {CATEGORIES.slice(1).map((c) => (
 <option key={c.value} value={c.value}>
 {c.label}
 </option>
 ))}
 </select>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-medium text-slate-700">Max Concentration (%)</label>
 <input
 name="maxConcentration"
 type="number"
 step="0.01"
 defaultValue={editingItem?.maxConcentration}
 className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
 />
 </div>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-medium text-slate-700">Prohibited Context</label>
 <textarea
 name="prohibitedContext"
 defaultValue={editingItem?.prohibitedContext}
 className="min-h-[80px] px-3 py-2 rounded-lg border border-[#E2E8F0] bg-slate-50 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
 />
 </div>
 <DialogFooter className="gap-2">
 <button
 type="button"
 onClick={() => setIsAddDialogOpen(false)}
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
 >
 Batal
 </button>
 <button
 type="submit"
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700"
 >
 Simpan Bahan
 </button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>

 <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle>Bulk Import INCI</DialogTitle>
 </DialogHeader>
 <div className="space-y-3 py-2">
 <p className="text-[13px] text-slate-600">
 Unggah file JSON berisi array bahan kosmetik.
 </p>
 <input
 type="file"
 accept="application/json"
 onChange={handleBulkImport}
 className="w-full text-[13px] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:text-slate-700"
 />
 </div>
 <DialogFooter className="gap-2">
 <button
 type="button"
 onClick={() => setIsImportDialogOpen(false)}
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
 >
 Tutup
 </button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </PageShell>
 );
}
