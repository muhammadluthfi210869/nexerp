"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Package,
  Truck,
  Users,
  Zap,
  Globe,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  description: string;
  type: "GOODS" | "SUPPLIER" | "CUSTOMER";
  isActive: boolean;
  updatedAt: string;
};

export default function MasterCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"GOODS" | "SUPPLIER" | "CUSTOMER">("GOODS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "GOODS" as "GOODS" | "SUPPLIER" | "CUSTOMER",
  });

  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/master/categories?type=${activeTab}`);
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.patch(`/master/categories/${editingCategory.id}`, formData);
        toast.success("Category updated successfully");
      } else {
        await api.post("/master/categories", { ...formData, type: activeTab });
        toast.success("Category created successfully");
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "", type: activeTab });
      fetchCategories();
    } catch (err) {
      toast.error("Failed to save category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      type: category.type,
    });
    setIsModalOpen(true);
  };

  const toggleStatus = async (category: Category) => {
    try {
      await api.patch(`/master/categories/${category.id}`, { isActive: !category.isActive });
      toast.success(`Category ${category.isActive ? "deactivated" : "activated"}`);
      fetchCategories();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-12 space-y-16 animate-in fade-in duration-1000 bg-base min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-6">
           <div className="flex items-center gap-4">
              <div className="h-12 w-1.5 bg-brand-orange rounded-full shadow-[0_0_15px_rgba(246,145,30,0.5)]" />
              <span className="text-[11px] font-heading font-black uppercase tracking-[0.5em] text-brand-orange italic">Foundational Taxonomy Protocol</span>
           </div>
           <h1 className="text-7xl font-heading font-black tracking-[calc(-0.05em)] text-brand-black uppercase italic leading-[0.9]">
             Master <br />
             <span className="text-brand-orange">Categories</span>
           </h1>
           <p className="text-text-muted font-black uppercase tracking-[0.2em] text-[11px] max-w-xl leading-relaxed italic opacity-60 pl-1">
             Define the core classification logic for the ERP ecosystem. Essential for analytics and reporting synchronization.
           </p>
        </div>

        <Button 
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: "", description: "", type: activeTab });
            setIsModalOpen(true);
          }}
          className="h-20 px-12 bg-brand-black hover:bg-brand-orange text-white rounded-[2rem] shadow-2xl transition-all duration-500 font-heading font-black uppercase tracking-tight text-xs border-none group italic"
        >
          <Plus className="mr-3 h-6 w-6 stroke-[3px] group-hover:rotate-90 transition-transform duration-500" />
          Add Category Protocol
        </Button>
      </div>

      {/* HUD Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: "Goods Categories", count: categories.filter(c => c.type === "GOODS").length, icon: Package, color: "text-brand-orange", bg: "bg-brand-orange/10" },
          { label: "Supplier Network", count: categories.filter(c => c.type === "SUPPLIER").length, icon: Truck, color: "text-brand-orange", bg: "bg-brand-orange/10" },
          { label: "Customer Registry", count: categories.filter(c => c.type === "CUSTOMER").length, icon: Users, color: "text-brand-orange", bg: "bg-brand-orange/10" },
        ].map((stat, i) => (
          <Card key={i} className="glass-premium rounded-[3rem] border-none shadow-2xl p-10 flex items-center gap-8 group hover:translate-y-[-8px] transition-all duration-500 border border-white/10 relative overflow-hidden">
             <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-20 -mr-16 -mt-16", stat.bg)} />
             <div className={cn("h-20 w-20 rounded-[2rem] bg-white border flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform relative z-10", stat.color)}>
               <stat.icon className="h-10 w-10 stroke-[2.5px]" />
             </div>
             <div className="relative z-10 flex flex-col gap-1">
               <p className="text-[10px] font-heading font-black uppercase tracking-[0.4em] text-text-muted italic opacity-60 leading-none">{stat.label}</p>
               <p className="text-5xl font-heading font-black italic tracking-[calc(-0.05em)] text-brand-black leading-none">{stat.count < 10 ? `0${stat.count}` : stat.count}</p>
             </div>
          </Card>
        ))}
      </div>

      {/* Main Registry Terminal */}
      <Card className="glass-premium border-none shadow-[0_0_80px_rgba(0,0,0,0.1)] rounded-[4rem] overflow-hidden border border-white/10 bg-white/40">
        <Tabs defaultValue="GOODS" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="p-10 border-b border-border/5 flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-surface/30">
            <TabsList className="bg-brand-black/5 p-2 rounded-[2rem] h-16">
              <TabsTrigger value="GOODS" className="rounded-full px-8 font-heading font-black text-[10px] uppercase tracking-tight italic data-[state=active]:bg-brand-orange data-[state=active]:text-white transition-all duration-500 h-full">GOODS</TabsTrigger>
              <TabsTrigger value="SUPPLIER" className="rounded-full px-8 font-heading font-black text-[10px] uppercase tracking-tight italic data-[state=active]:bg-brand-orange data-[state=active]:text-white transition-all duration-500 h-full">SUPPLIERS</TabsTrigger>
              <TabsTrigger value="CUSTOMER" className="rounded-full px-8 font-heading font-black text-[10px] uppercase tracking-tight italic data-[state=active]:bg-brand-orange data-[state=active]:text-white transition-all duration-500 h-full">CUSTOMERS</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-6">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-hover:text-brand-orange transition-colors" />
                <Input 
                  placeholder="SEARCH TAXONOMY..." 
                  className="h-14 w-80 pl-16 pr-8 bg-white border-none rounded-[1.5rem] font-heading font-black text-[10px] uppercase tracking-tight shadow-xl shadow-brand-black/5 italic border border-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-14 w-14 rounded-[1.5rem] bg-white border-none shadow-xl shadow-brand-black/5 hover:bg-brand-black hover:text-white transition-all duration-500 group">
                <Filter className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="m-0">
            <Table>
              <TableHeader className="bg-surface/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-10 pl-12 font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Classification Name</TableHead>
                  <TableHead className="font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Audit Description</TableHead>
                  <TableHead className="w-[180px] font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] text-center italic opacity-40">Lifecycle Status</TableHead>
                  <TableHead className="w-[150px] text-right pr-12 font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Command</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-32 text-center">
                      <div className="animate-spin w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full mx-auto mb-6 shadow-2xl"></div>
                      <p className="font-heading font-black text-text-muted uppercase text-[10px] tracking-[0.4em] italic opacity-40">Synchronizing Registry...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-32 text-center italic text-text-muted/40 font-heading font-black uppercase text-[10px] tracking-[0.4em]">Segment clean. Awaiting new definitions.</TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id} className="group hover:bg-surface/50 transition-all duration-500 border-none">
                      <TableCell className="py-10 pl-12">
                        <div className="flex items-center gap-6">
                           <div className="h-14 w-14 rounded-[1.25rem] bg-brand-black text-white flex items-center justify-center shadow-2xl shadow-brand-black/20 group-hover:bg-brand-orange transition-colors duration-500">
                              <Zap className="h-6 w-6" />
                           </div>
                           <div className="flex flex-col gap-1">
                              <span className="font-heading font-black text-brand-black tracking-tight text-xl uppercase italic leading-none">{category.name}</span>
                              <span className="text-[10px] font-black text-text-muted uppercase tracking-tight opacity-40">Updated: {new Date(category.updatedAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted font-heading font-black uppercase text-[11px] italic opacity-40 group-hover:opacity-100 transition-opacity leading-relaxed max-w-md">
                        {category.description || "NO ARCHIVE DESCRIPTION PROTOCOL ATTACHED."}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          className={cn(
                            "rounded-full px-6 py-2 cursor-pointer transition-all duration-500 font-heading font-black text-[9px] tracking-tight italic border-none shadow-xl",
                            category.isActive ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-brand-black text-white shadow-brand-black/20"
                          )}
                          onClick={() => toggleStatus(category)}
                        >
                          {category.isActive ? "PROTOCOL ACTIVE" : "REGISTRY INACTIVE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-12">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white border border-border/5 shadow-xl text-text-muted hover:bg-brand-orange hover:text-white transition-all duration-500" onClick={() => handleEdit(category)}>
                            <Edit2 className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white border border-border/5 shadow-xl text-text-muted hover:bg-rose-600 hover:text-white transition-all duration-500" onClick={() => toggleStatus(category)}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-base rounded-[4rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.25)] p-0 overflow-hidden">
          <DialogHeader className="p-12 bg-brand-black text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/20 rounded-full blur-[80px] -mr-32 -mt-32" />
             <DialogTitle className="text-4xl font-heading font-black text-white tracking-tighter italic uppercase leading-none relative z-10">
               {editingCategory ? "Update Registry" : "New Definition"}
             </DialogTitle>
             <p className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.4em] mt-6 italic opacity-60 relative z-10">Foundational Data Protocol v4.0</p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-12 space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Category Identification Name</label>
              <Input 
                placeholder="e.g. RAW MATERIAL HIGH-VELOCITY" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-16 bg-surface border-none rounded-2xl font-heading font-black text-brand-black placeholder:text-text-muted/30 italic px-8 shadow-inner uppercase"
                autoFocus
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Audit Description Protocol (Optional)</label>
              <Input 
                placeholder="DEFINE ARCHIVE PURPOSE..." 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-16 bg-surface border-none rounded-2xl font-heading font-black text-brand-black placeholder:text-text-muted/30 italic px-8 shadow-inner"
              />
            </div>
            <DialogFooter className="pt-8 flex gap-6">
              <Button type="button" variant="ghost" className="h-16 px-8 rounded-2xl font-heading font-black text-text-muted uppercase text-[10px] tracking-tight italic hover:text-brand-black" onClick={() => setIsModalOpen(false)}>Discard Registry</Button>
              <Button type="submit" className="flex-1 bg-brand-black hover:bg-brand-orange text-white rounded-[2rem] shadow-2xl h-20 font-heading font-black uppercase tracking-[0.2em] italic text-xs border-none transition-all duration-500">
                {editingCategory ? "Commit Update" : "Initialize Registry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

