"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Upload, 
  FileJson, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2,
  AlertTriangle,
  Beaker,
  History,
  Download,
  Info
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  return (
    <div className="bg-white min-h-screen">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-1 bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Regulatory Brain</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
            Master <span className="text-blue-600">INCI</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">International chemical standards & concentration limits.</p>
        </div>

        <div className="flex gap-3">
            <Button 
                variant="outline" 
                onClick={() => setIsImportDialogOpen(true)}
                className="h-12 px-6 rounded-xl border-slate-200 hover:bg-slate-50 font-bold gap-2 transition-all"
            >
                <Upload className="w-4 h-4 text-blue-600" /> Bulk Import
            </Button>
            <Button 
                onClick={() => { setEditingItem(null); setIsAddDialogOpen(true); }}
                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg shadow-blue-600/10 transition-all"
            >
                <Plus className="w-5 h-5" /> Add Ingredient
            </Button>
        </div>
      </header>

      <main>
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center justify-between">
            <div className="relative w-full lg:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="Search INCI or CAS..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
            </div>

            <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setCategoryFilter(cat.value)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight whitespace-nowrap transition-all",
                            categoryFilter === cat.value 
                                ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                                : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Data Grid */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="p-6 text-[10px] font-black uppercase tracking-tight text-slate-400">Ingredient Profile</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-tight text-slate-400">Safety Category</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Max Conc.</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-tight text-slate-400">Regulatory Notes</th>
                            <th className="p-6 text-right text-[10px] font-black uppercase tracking-tight text-slate-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <AnimatePresence mode="popLayout">
                            {incis?.map((item: any, idx: number) => (
                                <motion.tr 
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center border",
                                                item.category === "PROHIBITED" ? "bg-rose-50 text-rose-500 border-rose-100" :
                                                item.category === "RESTRICTED" ? "bg-amber-50 text-amber-500 border-amber-100" :
                                                "bg-slate-50 text-slate-400 border-slate-100"
                                            )}>
                                                <Beaker className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{item.inciName}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 font-sans">CAS: {item.casNumber || "N/A"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <Badge variant="outline" className={cn(
                                            "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-tight",
                                            categories.find(c => c.value === item.category)?.color
                                        )}>
                                            {item.category}
                                        </Badge>
                                    </td>
                                    <td className="p-6 text-center">
                                        {item.maxConcentration ? (
                                            <span className="text-lg font-black text-slate-900 italic">{item.maxConcentration}%</span>
                                        ) : (
                                            <span className="text-slate-300 font-bold italic text-xs uppercase">No Limit</span>
                                        )}
                                    </td>
                                    <td className="p-6 max-w-[300px]">
                                        <p className="text-[11px] font-medium text-slate-500 italic line-clamp-1">
                                            {item.prohibitedContext || item.warningText || "General cosmetic usage allowed."}
                                        </p>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} className="h-9 w-9 rounded-lg hover:bg-white border border-transparent hover:border-slate-200">
                                                <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(item.id); }} className="h-9 w-9 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100">
                                                <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
      </main>

      {/* Dialogs remain functional but styled cleaner */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 border-b border-slate-100 bg-slate-50/50">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                    {editingItem ? "Edit Regulatory Limit" : "Add New Ingredient"}
                </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(formData.entries());
                if (editingItem) updateMutation.mutate({ ...data, id: editingItem.id });
                else createMutation.mutate(data);
            }} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">INCI Name</Label>
                        <Input name="inciName" defaultValue={editingItem?.inciName} required className="rounded-xl bg-slate-50 border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">CAS Number</Label>
                        <Input name="casNumber" defaultValue={editingItem?.casNumber} className="rounded-xl bg-slate-50 border-slate-200 font-sans" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Category</Label>
                        <select name="category" defaultValue={editingItem?.category || "ALLOWED"} className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold uppercase">
                            {categories.slice(1).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Max Concentration (%)</Label>
                        <Input name="maxConcentration" type="number" step="0.01" defaultValue={editingItem?.maxConcentration} className="rounded-xl bg-slate-50 border-slate-200" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Prohibited Context</Label>
                    <textarea name="prohibitedContext" defaultValue={editingItem?.prohibitedContext} className="w-full h-20 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium" />
                </div>
                <DialogFooter className="pt-4 flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                    <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">Save Ingredient</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

