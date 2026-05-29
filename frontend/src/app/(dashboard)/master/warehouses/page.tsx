"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MapPin,
  User,
  Activity,
  Edit2,
  CheckCircle2,
  Warehouse as WarehouseIcon,
  Layers,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { DnaInput } from "@/components/dna/DnaInput";
import { StatCard } from "@/components/dna/StatCard";
import { TableShell } from "@/components/layout/TableShell";

type Warehouse = {
  id: string;
  name: string;
  pic_name: string;
  description: string;
  phone: string;
  province: string;
  city: string;
  address: string;
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    pic_name: "",
    description: "",
    phone: "",
    province: "",
    city: "",
    address: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
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
      setFormData({ name: "", pic_name: "", description: "", phone: "", province: "", city: "", address: "" });
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
      phone: warehouse.phone || "",
      province: warehouse.province || "",
      city: warehouse.city || "",
      address: warehouse.address || "",
    });
    setIsModalOpen(true);
  };

  const toggleStatus = async (warehouse: Warehouse) => {
    try {
      await api.patch(`/master/warehouses/${warehouse.id}`, {
        status: warehouse.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      toast.success(`Warehouse ${warehouse.status === "ACTIVE" ? "deactivated" : "activated"}`);
      fetchWarehouses();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (warehouse: Warehouse) => {
    try {
      await api.delete(`/master/warehouses/${warehouse.id}`);
      toast.success("Warehouse deleted successfully");
      fetchWarehouses();
    } catch (err) {
      toast.error("Failed to delete warehouse");
    }
  };

  const filteredWarehouses = warehouses.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.pic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = warehouses.filter(w => w.status === "ACTIVE").length;
  const totalLocations = warehouses.reduce((acc, w) => acc + (w._count?.locations || 0), 0);
  const picCount = new Set(warehouses.map(w => w.pic_name)).size;

  return (
    <TableShell
      title="Physical"
      titleAccent="Warehouses"
      subtitle="Manage storage centers and designated stock locations"
      actions={
        <DnaButton
          variant="primary"
          icon={<Plus />}
          onClick={() => {
            setEditingWarehouse(null);
            setFormData({ name: "", pic_name: "", description: "", phone: "", province: "", city: "", address: "" });
            setIsModalOpen(true);
          }}
        >
          Add Warehouse
        </DnaButton>
      }
      filters={
        <div className="flex items-center gap-3 w-full">
          <DnaInput
            icon={<Search />}
            placeholder="Search by name or PIC..."
            className="md:w-72"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <DnaButton variant="outline" icon={<Activity />}>Real-time Audit</DnaButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--card-gap)]">
        <StatCard label="Active Warehouses" value={activeCount} subValue="Operational Centers" icon={<WarehouseIcon />} />
        <StatCard label="Total Locations" value={totalLocations} subValue="Storage Bins" icon={<MapPin />} />
        <StatCard label="Operational PICs" value={picCount} subValue="Assigned Managers" icon={<User />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--card-gap)]">
        {loading ? (
          <div className="col-span-full h-48 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider bg-white border border-[var(--border-color)] rounded-2xl animate-pulse">
            Scanning storage centers...
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="col-span-full h-48 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider bg-white border border-[var(--border-color)] rounded-2xl">
            No warehouses registered
          </div>
        ) : (
          filteredWarehouses.map((warehouse) => (
            <div key={warehouse.id} className="bg-white border border-[var(--border-color)] rounded-2xl shadow-card hover:shadow-xl transition-all group overflow-hidden flex flex-col">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <WarehouseIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{warehouse.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-400">
                        <User className="w-3 h-3" />
                        <span>{warehouse.pic_name || "Unassigned"}</span>
                      </div>
                    </div>
                  </div>
                  <DnaBadge status={warehouse.status === "ACTIVE" ? "success" : "default"}>
                    {warehouse.status}
                  </DnaBadge>
                </div>

                <p className="mt-4 text-[11px] font-bold text-slate-400 leading-relaxed line-clamp-2">
                  {warehouse.description || "Establish storage protocols and safety measures for this warehouse."}
                </p>

                {(warehouse.phone || warehouse.province || warehouse.city || warehouse.address) && (
                  <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold text-slate-500">
                    {warehouse.phone && <span>📞 {warehouse.phone}</span>}
                    {warehouse.city && <span>📍 {[warehouse.city, warehouse.province].filter(Boolean).join(", ")}</span>}
                  </div>
                )}

                <div className="mt-6 flex items-center gap-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-sky-600 rounded-lg">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Locations</p>
                      <p className="text-sm font-black text-slate-900">{warehouse._count?.locations || 0}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-400 uppercase tracking-wider">Utilization</span>
                      <span className="text-slate-900">0%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full w-[0%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 px-6 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity border-t border-slate-100">
                <DnaButton variant="ghost" onClick={() => handleEdit(warehouse)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                </DnaButton>
                <DnaButton variant="ghost" onClick={() => toggleStatus(warehouse)}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  {warehouse.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </DnaButton>
                <DnaButton variant="ghost" onClick={() => handleDelete(warehouse)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                </DnaButton>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-slate-800 text-white">
            <DialogTitle className="text-sm font-black uppercase tracking-tight">
              {editingWarehouse ? "Update Warehouse" : "Register Warehouse"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Warehouse Name</label>
              <input
                placeholder="e.g. Main Hub - Bahan Baku A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PIC Name</label>
              <input
                placeholder="Head of Warehouse"
                value={formData.pic_name}
                onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</label>
              <input
                placeholder="Location details or storage specialty"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Contact & Location</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone</label>
                  <input
                    placeholder="021-12345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Province</label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  >
                    <option value="">Select Province</option>
                    <option value="Aceh">Aceh</option>
                    <option value="Sumatera Utara">Sumatera Utara</option>
                    <option value="Sumatera Barat">Sumatera Barat</option>
                    <option value="Riau">Riau</option>
                    <option value="Jambi">Jambi</option>
                    <option value="Sumatera Selatan">Sumatera Selatan</option>
                    <option value="Bengkulu">Bengkulu</option>
                    <option value="Lampung">Lampung</option>
                    <option value="Kepulauan Bangka Belitung">Kepulauan Bangka Belitung</option>
                    <option value="Kepulauan Riau">Kepulauan Riau</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="DI Yogyakarta">DI Yogyakarta</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Banten">Banten</option>
                    <option value="Bali">Bali</option>
                    <option value="Nusa Tenggara Barat">Nusa Tenggara Barat</option>
                    <option value="Nusa Tenggara Timur">Nusa Tenggara Timur</option>
                    <option value="Kalimantan Barat">Kalimantan Barat</option>
                    <option value="Kalimantan Tengah">Kalimantan Tengah</option>
                    <option value="Kalimantan Selatan">Kalimantan Selatan</option>
                    <option value="Kalimantan Timur">Kalimantan Timur</option>
                    <option value="Kalimantan Utara">Kalimantan Utara</option>
                    <option value="Sulawesi Utara">Sulawesi Utara</option>
                    <option value="Sulawesi Tengah">Sulawesi Tengah</option>
                    <option value="Sulawesi Selatan">Sulawesi Selatan</option>
                    <option value="Sulawesi Tenggara">Sulawesi Tenggara</option>
                    <option value="Gorontalo">Gorontalo</option>
                    <option value="Sulawesi Barat">Sulawesi Barat</option>
                    <option value="Maluku">Maluku</option>
                    <option value="Maluku Utara">Maluku Utara</option>
                    <option value="Papua">Papua</option>
                    <option value="Papua Barat">Papua Barat</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">City</label>
                  <input
                    placeholder="e.g. Jakarta Selatan"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Address</label>
                  <input
                    placeholder="Jl. Contoh No. 123"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 gap-3">
              <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</DnaButton>
              <DnaButton variant="primary" type="submit">
                {editingWarehouse ? "Save Changes" : "Confirm Warehouse"}
              </DnaButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menyimpan data ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableShell>
  );
}
