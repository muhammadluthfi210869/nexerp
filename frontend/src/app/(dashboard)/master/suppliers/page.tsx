"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Truck, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  ShieldCheck,
  Star,
  ExternalLink,
  ChevronRight,
  MoreHorizontal
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Category = { id: string; name: string };

type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  city: string;
  district: string;
  addressDetail: string;
  term_of_payment: number;
  performanceScore: number;
  categoryId: string;
  category?: Category;
};

export default function MasterSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    province: "",
    city: "",
    district: "",
    addressDetail: "",
    term_of_payment: 0,
    categoryId: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppRes, catRes] = await Promise.all([
        api.get("/master/suppliers"),
        api.get("/master/categories?type=SUPPLIER"),
      ]);
      setSuppliers(suppRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error("Failed to fetch supply chain data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.patch(`/master/suppliers/${editingSupplier.id}`, formData);
        toast.success("Supplier profile updated");
      } else {
        await api.post("/master/suppliers", formData);
        toast.success("New vendor onboarded successfully");
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
      fetchData();
    } catch (err) {
      toast.error("Error in vendor registration");
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Vendor Ecosystem</h1>
          <p className="text-slate-500">Scale your procurement with qualified, categorized suppliers.</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100"
          onClick={() => {
            setEditingSupplier(null);
            setFormData({ 
              name: "", 
              contact: "", 
              phone: "", 
              email: "", 
              address: "", 
              province: "",
              city: "",
              district: "",
              addressDetail: "",
              term_of_payment: 0, 
              categoryId: "" 
            });
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Onboard New Vendor
        </Button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full h-40 flex items-center justify-center text-slate-400">Syncing vendors...</div>
        ) : filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Truck className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none font-bold">
                    {supplier.category?.name || "Uncategorized"}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-1">{supplier.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Primary PIC: {supplier.contact || "N/A"}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="p-1.5 bg-slate-50 rounded-lg"><Phone className="w-3.5 h-3.5" /></div>
                    {supplier.phone || "---"}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="p-1.5 bg-slate-50 rounded-lg"><Mail className="w-3.5 h-3.5" /></div>
                    {supplier.email || "---"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Net Terms</p>
                    <p className="text-lg font-black text-slate-900">{supplier.term_of_payment} Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Performance</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-lg font-black text-slate-900">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50/80 p-4 flex items-center justify-between border-t border-slate-100">
                <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" onClick={() => {
                  setEditingSupplier(supplier);
                  setFormData({
                    name: supplier.name,
                    contact: supplier.contact || "",
                    phone: supplier.phone || "",
                    email: supplier.email || "",
                    address: supplier.address || "",
                    province: supplier.province || "",
                    city: supplier.city || "",
                    district: supplier.district || "",
                    addressDetail: supplier.addressDetail || "",
                    term_of_payment: supplier.term_of_payment,
                    categoryId: supplier.categoryId || "",
                  });
                  setIsModalOpen(true);
                }}>
                  View Profile
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">
              {editingSupplier ? "Edit Vendor Profile" : "Onboard New Vendor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Company Name</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-11 bg-slate-50 border-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Category</label>
                <Select value={formData.categoryId || ""} onValueChange={(v) => setFormData({...formData, categoryId: v || ""})}>
                  <SelectTrigger className="h-11 bg-slate-50 border-none">
                    <SelectValue placeholder="Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">PIC Name</label>
                <Input value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="h-11 bg-slate-50 border-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Phone</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-11 bg-slate-50 border-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Term of Payment</label>
                <Input type="number" value={formData.term_of_payment} onChange={(e) => setFormData({...formData, term_of_payment: Number(e.target.value)})} className="h-11 bg-slate-50 border-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Official Email</label>
              <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-11 bg-slate-50 border-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Province</label>
                <Input value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})} className="h-11 bg-slate-50 border-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">City</label>
                <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="h-11 bg-slate-50 border-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">District</label>
                <Input value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="h-11 bg-slate-50 border-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Address Detail</label>
                <Input value={formData.addressDetail} onChange={(e) => setFormData({...formData, addressDetail: e.target.value})} className="h-11 bg-slate-50 border-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Full Address (Legacy Search)</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="h-11 bg-slate-50 border-none" />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Discard</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]">
                {editingSupplier ? "Update Profile" : "Register Vendor"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

