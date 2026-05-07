"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  MapPin, 
  User, 
  Activity, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Warehouse as WarehouseIcon,
  Layers
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Warehouse = {
  id: string;
  name: string;
  pic_name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  _count: {
    locations: number;
  };
};

export default function MasterWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    pic_name: "",
    description: "",
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/master/warehouses");
      setWarehouses(res.data);
    } catch (err) {
      toast.error("Failed to fetch warehouses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await api.patch(`/master/warehouses/${editingWarehouse.id}`, formData);
        toast.success("Warehouse updated successfully");
      } else {
        await api.post("/master/warehouses", formData);
        toast.success("Warehouse created successfully");
      }
      setIsModalOpen(false);
      setEditingWarehouse(null);
      setFormData({ name: "", pic_name: "", description: "" });
      fetchWarehouses();
    } catch (err) {
      toast.error("Failed to save warehouse");
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      pic_name: warehouse.pic_name || "",
      description: warehouse.description || "",
    });
    setIsModalOpen(true);
  };

  const toggleStatus = async (warehouse: Warehouse) => {
    try {
      await api.patch(`/master/warehouses/${warehouse.id}`, { 
        status: warehouse.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" 
      });
      toast.success(`Warehouse ${warehouse.status === "ACTIVE" ? "deactivated" : "activated"}`);
      fetchWarehouses();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.pic_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Physical Warehouses</h1>
          <p className="text-slate-500">Manage storage centers and designated stock locations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => {
              setEditingWarehouse(null);
              setFormData({ name: "", pic_name: "", description: "" });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {/* Stats HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Warehouses", count: warehouses.filter(w => w.status === "ACTIVE").length, icon: WarehouseIcon, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Locations", count: warehouses.reduce((acc, w) => acc + (w._count?.locations || 0), 0), icon: MapPin, color: "text-sky-600", bg: "bg-sky-50" },
          { label: "Operational PICs", count: new Set(warehouses.map(w => w.pic_name)).size, icon: User, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1 text-slate-900">{stat.count}</h3>
                </div>
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name or PIC..." 
            className="pl-10 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-slate-200">
          <Activity className="w-4 h-4 mr-2" />
          Real-time Audit
        </Button>
      </div>

      {/* Warehouse Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full h-64 flex items-center justify-center text-slate-400 animate-pulse bg-white rounded-3xl border border-dashed border-slate-200">
            Scanning storage centers...
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="col-span-full h-64 flex items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            No warehouses registered yet.
          </div>
        ) : (
          filteredWarehouses.map((warehouse) => (
            <Card key={warehouse.id} className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-md hover:shadow-2xl transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <WarehouseIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{warehouse.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                          <User className="w-3 h-3" />
                          <span>{warehouse.pic_name || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      className={`rounded-full px-3 py-1 ${warehouse.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {warehouse.status}
                    </Badge>
                  </div>
                  
                  <p className="mt-4 text-slate-500 text-sm leading-relaxed line-clamp-2">
                    {warehouse.description || "Establish storage protocols and safety measures for this warehouse."}
                  </p>

                  <div className="mt-6 flex items-center gap-6 border-t border-slate-100 pt-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Locations</p>
                        <p className="text-lg font-bold text-slate-900">{warehouse._count?.locations || 0}</p>
                      </div>
                    </div>
                    {/* Placeholder for capacity/usage */}
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 font-semibold uppercase">Utilization</span>
                        <span className="text-slate-900 font-bold">0%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full w-[0%]" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50/50 p-4 px-6 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(warehouse)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600" onClick={() => toggleStatus(warehouse)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {warehouse.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {editingWarehouse ? "Update Warehouse" : "Register Warehouse"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Warehouse Name</label>
              <Input 
                placeholder="e.g. Main Hub - Bahan Baku A" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 h-12"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">PIC Name</label>
              <Input 
                placeholder="Head of Warehouse" 
                value={formData.pic_name}
                onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <Input 
                placeholder="Location details or storage specialty" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 h-12"
              />
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
                {editingWarehouse ? "Save Changes" : "Confirm Warehouse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

