"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Search, 
  Plus, 
  Upload, 
  Edit2, 
  Trash2,
  Beaker
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
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, DnaBadge, DnaButton } from "@/components/dna";

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
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/legality/master-inci", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-inci"] });
      toast.success("INCI added to regulatory brain");
      setIsAddDialogOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/legality/master-inci/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-inci"] });
      toast.success("Regulatory limits updated");
      setIsAddDialogOpen(false);
      setEditingItem(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/legality/master-inci/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-inci"] });
      toast.success("Ingredient removed");
    }
  });

  const bulkImportMutation = useMutation({
    mutationFn: (data: any[]) => api.post("/legality/master-inci/bulk", { data }),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ["master-inci"] });
      toast.success(`Import Success: ${resp.data.importedCount} added, ${resp.data.updatedCount} updated`);
      setIsImportDialogOpen(false);
    }
  });

  const categories = [
    { value: "ALL", label: "All Categories", color: "bg-slate-100 text-slate-600" },
    { value: "ALLOWED", label: "Allowed", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { value: "RESTRICTED", label: "Restricted", color: "bg-amber-50 text-amber-600 border-amber-100" },
    { value: "PROHIBITED", label: "Prohibited", color: "bg-rose-50 text-rose-600 border-rose-100" },
    { value: "PRESERVATIVE", label: "Preservative", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
    { value: "COLORANT", label: "Colorant", color: "bg-purple-50 text-purple-600 border-purple-100" },
    { value: "UV_FILTER", label: "UV Filter", color: "bg-blue-50 text-blue-600 border-blue-100" },
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

  const getDnaCategoryBadge = (category: string) => {
    switch (category) {
      case "ALLOWED": return <DnaBadge status="success">ALLOWED</DnaBadge>;
      case "RESTRICTED": return <DnaBadge status="warning">RESTRICTED</DnaBadge>;
      case "PROHIBITED": return <DnaBadge status="critical">PROHIBITED</DnaBadge>;
      case "PRESERVATIVE": return <DnaBadge status="purple">PRESERVATIVE</DnaBadge>;
      case "COLORANT": return <DnaBadge status="purple">COLORANT</DnaBadge>;
      case "UV_FILTER": return <DnaBadge status="info">UV FILTER</DnaBadge>;
      default: return <DnaBadge status="default">{category}</DnaBadge>;
    }
  };

  return (
    <DashboardShell
      title="MASTER"
      titleAccent="INCI"
      subtitle="International chemical standards & concentration limits."
      actions={
        <div className="flex gap-3">
          <DnaButton 
            variant="outline" 
            onClick={() => setIsImportDialogOpen(true)}
            icon={<Upload />}
          >
            Bulk Import
          </DnaButton>
          <DnaButton 
            variant="primary"
            onClick={() => { setEditingItem(null); setIsAddDialogOpen(true); }}
            icon={<Plus />}
          >
            Add Ingredient
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-slide-in">
        {/* Data Grid with TableWrapper */}
        <TableWrapper
          filters={
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between w-full">
              {/* Search Input */}
              <div className="relative w-full lg:w-[400px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="SEARCH INCI OR CAS..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Category Filters Switches */}
              <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategoryFilter(cat.value)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight whitespace-nowrap transition-all cursor-pointer",
                      categoryFilter === cat.value 
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                        : "text-slate-400 hover:text-slate-600 border border-transparent"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">INGREDIENT PROFILE</th>
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">SAFETY CATEGORY</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">MAX CONC.</th>
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">REGULATORY NOTES</th>
                  <th className="px-4 py-4 text-right text-table-header text-slate-400 uppercase tracking-widest">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Synchronizing chemical database...
                    </td>
                  </tr>
                ) : !incis || incis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      No chemical standards found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  incis.map((item: any) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center border shrink-0 transition-colors",
                            item.category === "PROHIBITED" ? "bg-rose-50 text-rose-500 border-rose-100" :
                            item.category === "RESTRICTED" ? "bg-amber-50 text-amber-500 border-amber-100" :
                            "bg-slate-50 text-slate-400 border-slate-100"
                          )}>
                            <Beaker className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic">{item.inciName}</h4>
                            <span className="text-[8px] font-bold text-slate-300 font-sans mt-0.5 block leading-none">CAS: {item.casNumber || "N/A"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getDnaCategoryBadge(item.category)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.maxConcentration ? (
                          <span className="text-[13px] font-black text-slate-900 italic leading-none">{item.maxConcentration}%</span>
                        ) : (
                          <span className="text-slate-300 font-bold italic text-[9px] uppercase leading-none">No Limit</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[300px]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase italic line-clamp-1">
                          {item.prohibitedContext || item.warningText || "General cosmetic usage allowed."}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <DnaButton 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEdit(item)} 
                            icon={<Edit2 className="w-3.5 h-3.5" />} 
                          />
                          <DnaButton 
                            size="sm" 
                            variant="danger" 
                            onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(item.id); }} 
                            icon={<Trash2 className="w-3.5 h-3.5" />} 
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableWrapper>
      </div>

      {/* Dialogs remain functional but styled cleaner */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl p-0 overflow-hidden border border-slate-100 shadow-2xl">
          <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              {editingItem ? "EDIT REGULATORY LIMIT" : "ADD NEW INGREDIENT"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const data = Object.fromEntries(formData.entries());
            if (editingItem) updateMutation.mutate({ ...data, id: editingItem.id });
            else createMutation.mutate(data);
          }} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-wider text-slate-400">INCI Name</Label>
                <Input name="inciName" defaultValue={editingItem?.inciName} required className="rounded-xl h-11 bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-wider text-slate-400">CAS Number</Label>
                <Input name="casNumber" defaultValue={editingItem?.casNumber} className="rounded-xl h-11 bg-slate-50 border-slate-200 font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Category</Label>
                <select name="category" defaultValue={editingItem?.category || "ALLOWED"} className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold uppercase cursor-pointer">
                  {categories.slice(1).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Max Concentration (%)</Label>
                <Input name="maxConcentration" type="number" step="0.01" defaultValue={editingItem?.maxConcentration} className="rounded-xl h-11 bg-slate-50 border-slate-200" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Prohibited Context / Warning Text</Label>
              <textarea name="prohibitedContext" defaultValue={editingItem?.prohibitedContext} className="w-full h-20 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold italic focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none" placeholder="Context when prohibited, e.g. not to be used in aerosol formulations..." />
            </div>
            <DialogFooter className="pt-4 flex gap-2 justify-end">
              <DnaButton type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>CANCEL</DnaButton>
              <DnaButton type="submit" variant="primary">SAVE INGREDIENT</DnaButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-blue-600 text-white">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter leading-none">
              BULK REGULATORY IMPORT
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
              Upload a valid JSON file containing INCI ingredients array to perform batch updates on chemical standard compliance limits.
            </p>
            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
              <input 
                type="file" 
                accept=".json" 
                onChange={handleBulkImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-300 mb-2 pointer-events-none" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">Select JSON File</span>
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex justify-end">
            <DnaButton variant="outline" onClick={() => setIsImportDialogOpen(false)}>CLOSE</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
