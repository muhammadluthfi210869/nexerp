"use client";
export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Beaker,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  OperationalDataTable,
  OperationalPageShell,
  getOperationalStatusLabel,
} from "@/components/operational";

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

  const categories = [
    { value: "ALL", label: "All Categories" },
    { value: "ALLOWED", label: "Allowed" },
    { value: "RESTRICTED", label: "Restricted" },
    { value: "PROHIBITED", label: "Prohibited" },
    { value: "PRESERVATIVE", label: "Preservative" },
    { value: "COLORANT", label: "Colorant" },
    { value: "UV_FILTER", label: "UV Filter" },
  ];

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

  const categoryTone = (category: string) => {
    switch (category) {
      case "ALLOWED":
        return "success";
      case "RESTRICTED":
        return "pending";
      case "PROHIBITED":
        return "danger";
      case "PRESERVATIVE":
      case "COLORANT":
        return "purple";
      case "UV_FILTER":
        return "process";
      default:
        return "neutral";
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "inciName",
        header: "Ingredient Profile",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center border shrink-0 ${
                row.original.category === "PROHIBITED"
                  ? "bg-rose-50 text-rose-500 border-rose-100"
                  : row.original.category === "RESTRICTED"
                    ? "bg-amber-50 text-amber-500 border-amber-100"
                    : "bg-slate-50 text-slate-400 border-slate-100"
              }`}
            >
              <Beaker className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-medium text-slate-900 uppercase tracking-tight">
                {row.original.inciName}
              </span>
              <span className="text-[10px] text-slate-400">
                CAS: {row.original.casNumber || "—"}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Safety Category",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-start">
            <span className={`operational-status-badge is-${categoryTone(row.original.category)}`}>
              {row.original.category || "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "maxConcentration",
        header: () => <div className="text-center">Max Conc.</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="text-center text-[13px] font-medium tabular-nums text-slate-900">
            {row.original.maxConcentration ? (
              `${row.original.maxConcentration}%`
            ) : (
              <span className="text-[10px] uppercase text-slate-400">No Limit</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "regulatory",
        header: "Regulatory Notes",
        cell: ({ row }: { row: { original: any } }) => (
          <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[300px]">
            {row.original.prohibitedContext ||
              row.original.warningText ||
              "General cosmetic usage allowed."}
          </p>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              className="operational-button is-ghost h-8 w-8 p-0"
              onClick={() => handleEdit(row.original)}
              aria-label="Edit ingredient"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="operational-button is-danger h-8 w-8 p-0"
              onClick={() => {
                if (confirm("Are you sure?")) deleteMutation.mutate(row.original.id);
              }}
              aria-label="Delete ingredient"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [deleteMutation],
  );

  return (
    <OperationalPageShell
      title="Master INCI"
      subtitle="International chemical standards & concentration limits."
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            className="operational-button is-secondary"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Import</span>
          </button>
          <button
            type="button"
            className="operational-button is-primary"
            onClick={() => {
              setEditingItem(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Ingredient</span>
          </button>
        </div>
      }
    >
      <div className="operational-stack">
        <section className="operational-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="operational-input-wrap w-full lg:w-[400px]">
              <span className="operational-input-icon">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search INCI or CAS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === cat.value
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                      : "text-slate-400 hover:text-slate-600 border border-transparent"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <OperationalDataTable
          data={(incis ?? []) as any[]}
          columns={columns as any}
          getRowId={(row: any) => row.id}
          loading={isLoading}
          emptyMessage="No chemical standards found matching your criteria."
          toolbar={
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {incis?.length ?? 0} entri
            </span>
          }
          searchPlaceholder="Cari INCI atau CAS..."
        />
      </div>

      {/* Add / Edit Dialog */}
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
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              if (editingItem) updateMutation.mutate({ ...data, id: editingItem.id });
              else createMutation.mutate(data);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="operational-field">
                <span>INCI Name</span>
                <Input name="inciName" defaultValue={editingItem?.inciName} required />
              </div>
              <div className="operational-field">
                <span>CAS Number</span>
                <Input name="casNumber" defaultValue={editingItem?.casNumber} />
              </div>
              <div className="operational-field">
                <span>Category</span>
                <select
                  name="category"
                  defaultValue={editingItem?.category || "ALLOWED"}
                  className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[12px] font-bold uppercase"
                >
                  {categories.slice(1).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="operational-field">
                <span>Max Concentration (%)</span>
                <Input
                  name="maxConcentration"
                  type="number"
                  step="0.01"
                  defaultValue={editingItem?.maxConcentration}
                />
              </div>
            </div>
            <div className="operational-field">
              <span>Prohibited Context / Warning Text</span>
              <textarea
                name="prohibitedContext"
                defaultValue={editingItem?.prohibitedContext}
                placeholder="Context when prohibited, e.g. not to be used in aerosol formulations..."
                className="min-h-20 rounded-lg bg-slate-50 border border-slate-200 text-[12px] font-bold italic px-3 py-2"
              />
            </div>
            <DialogFooter className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="operational-button is-secondary"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="operational-button is-primary">
                Save Ingredient
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Regulatory Import</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upload a valid JSON file containing INCI ingredients array to perform batch
              updates on chemical standard compliance limits.
            </p>
            <label className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleBulkImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-8 w-8 text-slate-300 mb-2 pointer-events-none" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Select JSON File
              </span>
            </label>
          </div>
          <DialogFooter className="flex justify-end pt-2">
            <button
              type="button"
              className="operational-button is-secondary"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}