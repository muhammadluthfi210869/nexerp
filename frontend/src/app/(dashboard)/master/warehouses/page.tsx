"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MapPin,
  Phone,
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

import { api } from "@/lib/api";
import { toast } from "sonner";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import {
  OperationalMetricGrid,
  OperationalMetricCard,
  OperationalPanel,
  OperationalInput,
  OperationalField,
  OperationalButton,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational/OperationalUI";

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
    <OperationalMigrationShell
      title="Data Gudang"
      subtitle="Pusat penyimpanan, lokasi stok, dan penanggung jawab"
      actions={
        <OperationalButton
          variant="primary"
          onClick={() => {
            setEditingWarehouse(null);
            setFormData({ name: "", pic_name: "", description: "", phone: "", province: "", city: "", address: "" });
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Gudang</span>
        </OperationalButton>
      }
      filters={
        <div className="flex items-center gap-3 w-full">
          <OperationalInput
            icon={<Search className="h-4 w-4" />}
            placeholder="Cari nama atau PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:w-72"
          />
          <OperationalButton variant="secondary">
            <Activity className="h-4 w-4" />
            <span>Audit Real-time</span>
          </OperationalButton>
        </div>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Gudang Aktif"
            value={activeCount}
            helper="Pusat operasional"
            icon={<WarehouseIcon className="h-4 w-4" />}
            tone="green"
          />
          <OperationalMetricCard
            label="Total Lokasi"
            value={totalLocations}
            helper="Lokasi penyimpanan"
            icon={<MapPin className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="PIC Operasional"
            value={picCount}
            helper="Penanggung jawab"
            icon={<User className="h-4 w-4" />}
            tone="purple"
          />
        </OperationalMetricGrid>

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
              <OperationalPanel key={warehouse.id} className="flex flex-col !p-0 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                        <WarehouseIcon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{warehouse.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-400">
                          <User className="w-3 h-3" />
                          <span>{warehouse.pic_name || "Belum Ditentukan"}</span>
                        </div>
                      </div>
                    </div>
                    <OperationalStatusBadge status={warehouse.status === "ACTIVE" ? "success" : "neutral"}>
                      {getOperationalStatusLabel(warehouse.status)}
                    </OperationalStatusBadge>
                  </div>

                  <p className="mt-4 text-[11px] font-bold text-slate-400 leading-relaxed line-clamp-2">
                    {warehouse.description || "Informasi fungsi penyimpanan dan prosedur gudang belum diisi."}
                  </p>

                  {(warehouse.phone || warehouse.province || warehouse.city || warehouse.address) && (
                    <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold text-slate-500">
                      {warehouse.phone && <span><Phone className="w-3.5 h-3.5 text-slate-400" /> {warehouse.phone}</span>}
                      {warehouse.city && <span><MapPin className="w-3.5 h-3.5 text-slate-400" /> {[warehouse.city, warehouse.province].filter(Boolean).join(", ")}</span>}
                    </div>
                  )}

                  <div className="mt-6 flex items-center gap-6 border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 text-sky-600 rounded-lg">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lokasi</p>
                        <p className="text-sm font-black text-slate-900">{warehouse._count?.locations || 0}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-slate-400 uppercase tracking-wider">Utilisasi</span>
                        <span className="text-slate-900">0%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-[0%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 px-6 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity border-t border-slate-100">
                  <OperationalButton variant="ghost" onClick={() => handleEdit(warehouse)}>
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </OperationalButton>
                  <OperationalButton variant="ghost" onClick={() => toggleStatus(warehouse)}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {warehouse.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </OperationalButton>
                  <OperationalButton variant="ghost" onClick={() => handleDelete(warehouse)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                  </OperationalButton>
                </div>
              </OperationalPanel>
            ))
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Update Warehouse" : "Register Warehouse"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="operational-stack">
            <OperationalField label="Warehouse Name">
              <input
                placeholder="e.g. Main Hub - Bahan Baku A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </OperationalField>
            <OperationalField label="PIC Name">
              <input
                placeholder="Head of Warehouse"
                value={formData.pic_name}
                onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
              />
            </OperationalField>
            <OperationalField label="Description">
              <input
                placeholder="Location details or storage specialty"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </OperationalField>
            <div className="operational-section-title mt-4">
              <span>Contact & Location</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <OperationalField label="Phone">
                <input
                  placeholder="021-12345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </OperationalField>
              <OperationalField label="Province">
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
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
              </OperationalField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <OperationalField label="City">
                <input
                  placeholder="e.g. Jakarta Selatan"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </OperationalField>
              <OperationalField label="Address">
                <input
                  placeholder="Jl. Contoh No. 123"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </OperationalField>
            </div>
            <DialogFooter className="gap-3">
              <OperationalButton variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</OperationalButton>
              <OperationalButton variant="primary" type="submit">
                {editingWarehouse ? "Save Changes" : "Confirm Warehouse"}
              </OperationalButton>
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
            <OperationalButton variant="secondary" onClick={() => setShowConfirm(false)}>Batal</OperationalButton>
            <OperationalButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</OperationalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalMigrationShell>
  );
}
