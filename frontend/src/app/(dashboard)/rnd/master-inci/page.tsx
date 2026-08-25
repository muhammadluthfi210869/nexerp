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
  OperationalDataTable,
  OperationalField,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "ALL", label: "All Categories", tone: "neutral" as const },
  { value: "ALLOWED", label: "Allowed", tone: "success" as const },
  { value: "RESTRICTED", label: "Restricted", tone: "pending" as const },
  { value: "PROHIBITED", label: "Prohibited", tone: "danger" as const },
  { value: "PRESERVATIVE", label: "Preservative", tone: "process" as const },
  { value: "COLORANT", label: "Colorant", tone: "process" as const },
  { value: "UV_FILTER", label: "UV Filter", tone: "process" as const },
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

  const categoryToneMap = useMemo(() => {
    const m: Record<string, "neutral" | "success" | "pending" | "danger" | "process"> = {};
    CATEGORIES.forEach((c) => (m[c.value] = c.tone));
    return m;
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "inciName",
        header: "Ingredient Profile",
        cell: ({ row }: { row: { original: any } }) => (
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
              <h4 className="text-[13px] font-semibold text-slate-900">{row.original.inciName}</h4>
              <span className="text-[11px] text-slate-500">CAS: {row.original.casNumber || "N/A"}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Safety Category",
        cell: ({ row }: { row: { original: any } }) => {
          const cat = row.original.category;
          const tone = categoryToneMap[cat] ?? "neutral";
          return (
            <OperationalStatusBadge status={tone}>{cat ?? "—"}</OperationalStatusBadge>
          );
        },
      },
      {
        accessorKey: "maxConcentration",
        header: () => <div className="text-center">Max Conc.</div>,
        cell: ({ getValue }: { getValue: () => number | null }) => (
          <div className="text-center text-[13px] font-medium text-slate-900">
            {getValue() ? `${getValue()}%` : <span className="text-slate-400">No Limit</span>}
          </div>
        ),
      },
      {
        accessorKey: "prohibitedContext",
        header: "Regulatory Notes",
        cell: ({ row }: { row: { original: any } }) => (
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
        cell: ({ row }: { row: { original: any } }) => (
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
    [categoryToneMap],
  );

  const filters = (
    <div className="flex flex-col lg:flex-row gap-4 items-center w-full">
      <div className="relative w-full lg:w-[400px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <OperationalField label="">
          <input
            placeholder="Cari INCI atau CAS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 bg-slate-50 border-slate-200 focus:bg-white"
          />
        </OperationalField>
      </div>

      <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase whitespace-nowrap transition-all",
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
  );

  return (
    <OperationalPageShell
      title="Master INCI"
      subtitle="International Nomenclature of Cosmetic Ingredients"
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsImportDialogOpen(true)}
            className="operational-button is-secondary"
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
            className="operational-button is-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Bahan</span>
          </button>
        </div>
      }
    >
      <div className="operational-stack">
        <OperationalPanel>{filters}</OperationalPanel>

        <OperationalDataTable
          data={incis ?? []}
          columns={columns as any}
          getRowId={(row: any) => row.id}
          searchPlaceholder="Cari INCI, CAS, atau catatan..."
          emptyMessage="Belum ada data INCI."
          loading={isLoading}
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
              <OperationalField label="INCI Name">
                <input
                  name="inciName"
                  defaultValue={editingItem?.inciName}
                  required
                  className="bg-slate-50 border-slate-200"
                />
              </OperationalField>
              <OperationalField label="CAS Number">
                <input
                  name="casNumber"
                  defaultValue={editingItem?.casNumber}
                  className="bg-slate-50 border-slate-200"
                />
              </OperationalField>
              <OperationalField label="Category">
                <select
                  name="category"
                  defaultValue={editingItem?.category || "ALLOWED"}
                  className="bg-slate-50 border-slate-200"
                >
                  {CATEGORIES.slice(1).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </OperationalField>
              <OperationalField label="Max Concentration (%)">
                <input
                  name="maxConcentration"
                  type="number"
                  step="0.01"
                  defaultValue={editingItem?.maxConcentration}
                  className="bg-slate-50 border-slate-200"
                />
              </OperationalField>
            </div>
            <OperationalField label="Prohibited Context">
              <textarea
                name="prohibitedContext"
                defaultValue={editingItem?.prohibitedContext}
                className="bg-slate-50 border-slate-200 min-h-[80px] resize-none"
              />
            </OperationalField>
            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={() => setIsAddDialogOpen(false)}
                className="operational-button is-secondary"
              >
                Batal
              </button>
              <button type="submit" className="operational-button is-primary">
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
              className="operational-button is-secondary"
            >
              Tutup
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
