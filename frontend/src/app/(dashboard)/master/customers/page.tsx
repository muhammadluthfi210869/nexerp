"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  UserCircle, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck, 
  ArrowUpRight,
  MoreVertical,
  Activity,
  CreditCard,
  MapPin,
  ChevronRight,
  Zap,
  Layers,
  CheckCircle2
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
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
  clientName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: "ACTIVE" | "INACTIVE";
  type: string | null;
  categoryId: string | null;
  category?: { name: string } | null;
  creditLimit: number;
  taxId: string | null;
};

export default function MasterCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    email: "",
    phone: "",
    address: "",
    status: "ACTIVE",
    categoryId: "",
    creditLimit: 0,
    taxId: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custRes, catRes] = await Promise.all([
        api.get("/master/customers"),
        api.get("/master/categories?type=CUSTOMER"),
      ]);
      setCustomers(custRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error("Failed to sync customer ecosystem");
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
      if (editingCustomer) {
        await api.patch(`/master/customers/${editingCustomer.id}`, formData);
        toast.success("Strategic partner record updated");
      } else {
        await api.post("/master/customers", formData);
        toast.success("New commercial partner registered");
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      fetchData();
    } catch (err) {
      toast.error("Constraint violation in partner registration");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-12 space-y-16 animate-in fade-in duration-1000 bg-base min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-6">
           <div className="flex items-center gap-4">
              <div className="h-12 w-1.5 bg-brand-orange rounded-full shadow-[0_0_15px_rgba(246,145,30,0.5)]" />
              <span className="text-[11px] font-heading font-black uppercase tracking-[0.5em] text-brand-orange italic">Commercial Partner Registry v4.2</span>
           </div>
           <h1 className="text-7xl font-heading font-black tracking-[calc(-0.05em)] text-brand-black uppercase italic leading-[0.9]">
             Global <br />
             <span className="text-brand-orange">Client Hub</span>
           </h1>
           <p className="text-text-muted font-black uppercase tracking-[0.2em] text-[11px] max-w-xl leading-relaxed italic opacity-60 pl-1">
             Synchronized repository of brand owners and B2B commercial entities with real-time credit monitoring.
           </p>
        </div>

        <div className="flex gap-6">
           <Button variant="outline" className="h-20 px-10 border-none bg-white text-brand-black rounded-[2rem] font-heading font-black uppercase tracking-tight text-[10px] shadow-2xl hover:bg-brand-black hover:text-white transition-all duration-500 italic">
              <Globe className="mr-3 h-5 w-5" /> Export Global Map
           </Button>
           <Button 
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ name: "", clientName: "", email: "", phone: "", address: "", status: "ACTIVE", categoryId: "", creditLimit: 0, taxId: "" });
              setIsModalOpen(true);
            }}
            className="h-20 px-12 bg-brand-black hover:bg-brand-orange text-white rounded-[2rem] shadow-2xl transition-all duration-500 font-heading font-black uppercase tracking-tight text-xs border-none group italic"
           >
              <Plus className="mr-3 h-6 w-6 stroke-[3px] group-hover:rotate-90 transition-transform duration-500" />
              Onboard Partner
           </Button>
        </div>
      </div>

      {/* Analytics HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {[
          { label: "Partner Registry", count: customers.length, icon: Building2, color: "text-brand-orange", bg: "bg-brand-orange/10" },
          { label: "Active Revenue", count: customers.filter(c => c.status === 'ACTIVE').length, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Strategic Segments", count: categories.length, icon: Layers, color: "text-brand-blue", bg: "bg-brand-blue/10" },
          { label: "Tax Compliance", count: 100, icon: ShieldCheck, color: "text-brand-orange", bg: "bg-brand-orange/10", unit: "%" },
        ].map((stat, i) => (
          <Card key={i} className="glass-premium rounded-[3rem] border-none shadow-2xl p-8 flex items-center gap-6 group hover:translate-y-[-8px] transition-all duration-500 border border-white/10 relative overflow-hidden">
             <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-20 -mr-16 -mt-16", stat.bg)} />
             <div className={cn("h-16 w-16 rounded-[1.5rem] bg-white border flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform relative z-10", stat.color)}>
               <stat.icon className="h-8 w-8 stroke-[2.5px]" />
             </div>
             <div className="relative z-10 flex flex-col">
               <p className="text-[9px] font-heading font-black uppercase tracking-[0.3em] text-text-muted italic opacity-60 leading-none mb-1">{stat.label}</p>
               <p className="text-4xl font-heading font-black italic tracking-[calc(-0.05em)] text-brand-black leading-none">{stat.count}{stat.unit}</p>
             </div>
          </Card>
        ))}
      </div>

      {/* Control Bar */}
      <div className="glass-premium rounded-[2.5rem] p-6 flex flex-col lg:flex-row items-center gap-10 border border-white/10 shadow-3xl bg-white/40">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-hover:text-brand-orange transition-colors" />
          <Input 
            placeholder="SCAN PARTNER ID OR SEARCH CLIENT ENTITY..." 
            className="h-16 w-full pl-16 pr-8 bg-white border-none rounded-[1.5rem] font-heading font-black text-[10px] uppercase tracking-tight shadow-xl shadow-brand-black/5 italic border border-white/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-6">
           <Button variant="outline" className="h-16 px-10 rounded-[1.5rem] bg-brand-black text-white border-none shadow-2xl hover:bg-brand-orange transition-all duration-500 font-heading font-black text-[10px] uppercase tracking-tight italic flex items-center gap-4">
              <Zap className="h-5 w-5" /> Pulse Sync
           </Button>
        </div>
      </div>

      {/* Customer Matrix Table */}
      <Card className="glass-premium border-none shadow-[0_0_80px_rgba(0,0,0,0.1)] rounded-[4rem] overflow-hidden border border-white/10 bg-white/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-10 pl-12 font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Partner Identity</TableHead>
                <TableHead className="font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Classification</TableHead>
                <TableHead className="font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Contact Protocol</TableHead>
                <TableHead className="font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40 text-center">Protocol Status</TableHead>
                <TableHead className="w-[150px] text-right pr-12 font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Cmd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/5">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full mx-auto mb-6 shadow-2xl"></div>
                    <p className="font-heading font-black text-text-muted uppercase text-[10px] tracking-[0.4em] italic opacity-40">Initializing Matrix...</p>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group hover:bg-surface/50 transition-all duration-500 border-none">
                  <TableCell className="py-10 pl-12">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-[1.5rem] bg-brand-black text-white flex items-center justify-center shadow-2xl shadow-brand-black/20 group-hover:bg-brand-orange transition-colors duration-500">
                          <Building2 className="h-8 w-8" />
                       </div>
                       <div className="flex flex-col gap-1">
                          <span className="font-heading font-black text-brand-black tracking-tight text-xl uppercase italic leading-none">{customer.clientName}</span>
                          <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] italic">{customer.taxId || "NO_TAX_ID_REGISTERED"}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white border-border/5 text-text-muted font-heading font-black text-[9px] px-5 py-2 rounded-full italic tracking-tight shadow-sm uppercase group-hover:border-brand-orange/20 transition-colors">
                      {customer.category?.name || "Tier 1 Partner"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                       <div className="flex items-center gap-3 text-[10px] font-heading font-black text-text-muted uppercase tracking-tight italic group-hover:text-brand-black transition-colors">
                          <Mail className="h-3 w-3 text-brand-orange" /> {customer.email || "---"}
                       </div>
                       <div className="flex items-center gap-3 text-[10px] font-heading font-black text-text-muted uppercase tracking-tight italic group-hover:text-brand-black transition-colors">
                          <Phone className="h-3 w-3 text-brand-blue" /> {customer.phone || "---"}
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                     <Badge 
                        className={cn(
                          "rounded-full px-6 py-2 font-heading font-black text-[9px] tracking-tight italic border-none shadow-xl",
                          customer.status === 'ACTIVE' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-brand-black text-white shadow-brand-black/20"
                        )}
                      >
                        {customer.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-12">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 h-12 w-12 rounded-xl bg-white border border-border/5 shadow-xl text-text-muted hover:bg-brand-orange hover:text-white duration-500"
                      onClick={() => {
                        setEditingCustomer(customer);
                        setFormData({
                          name: customer.name,
                          clientName: customer.clientName,
                          email: customer.email || "",
                          phone: customer.phone || "",
                          address: customer.address || "",
                          status: customer.status,
                          categoryId: customer.categoryId || "",
                          creditLimit: customer.creditLimit,
                          taxId: customer.taxId || "",
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Strategic Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-base rounded-[4rem] border-none shadow-[0_0_120px_rgba(0,0,0,0.3)] p-0 overflow-hidden">
          <DialogHeader className="p-12 bg-brand-black text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/20 rounded-full blur-[80px] -mr-40 -mt-40" />
             <div className="flex items-center gap-6 relative z-10">
                <div className="p-5 bg-white/10 rounded-[2rem] border border-white/20 shadow-2xl">
                  <UserCircle className="h-10 w-10 text-brand-orange stroke-[3px]" />
                </div>
                <div>
                  <DialogTitle className="text-4xl font-heading font-black text-white tracking-tighter italic uppercase leading-none">
                    {editingCustomer ? "Refactor Partner" : "Register Partner"}
                  </DialogTitle>
                  <p className="text-[10px] font-heading font-black text-white/40 uppercase tracking-[0.4em] mt-4 italic">B2B Commercial Ledger Protocol v4.2</p>
                </div>
             </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="p-12 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Entity Registered Name</label>
                <Input 
                  placeholder="e.g. PT GLOBAL SYNERGY" 
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="h-16 bg-surface border-none rounded-2xl font-heading font-black text-brand-black text-xl px-8 shadow-inner uppercase italic"
                  autoFocus
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Strategic Taxonomy</label>
                <Select value={formData.categoryId || ""} onValueChange={(v) => setFormData({...formData, categoryId: v || ""})}>
                  <SelectTrigger className="h-16 bg-surface border-none rounded-2xl font-heading font-black italic px-8 text-brand-black shadow-inner">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {categories.map(c => <SelectItem key={c.id} value={c.id} className="font-heading font-black uppercase text-[10px] tracking-tight italic">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Primary Contact Email</label>
                <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-14 bg-surface border-none rounded-xl font-heading font-black italic px-6 shadow-inner" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Commercial Tax ID (NPWP)</label>
                <Input value={formData.taxId} onChange={(e) => setFormData({...formData, taxId: e.target.value})} className="h-14 bg-surface border-none rounded-xl font-heading font-black italic px-6 shadow-inner uppercase" />
              </div>
            </div>

            <div className="p-10 bg-brand-orange rounded-[3rem] space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <CreditCard className="h-32 w-32 text-white" />
              </div>
              <h3 className="text-xs font-heading font-black text-white/70 uppercase flex items-center gap-4 italic relative z-10 tracking-[0.2em]">
                <ShieldCheck className="h-4 w-4 text-white stroke-[3px]" />
                Financial Liability Registry
              </h3>
              <div className="grid grid-cols-2 gap-10 relative z-10">
                <div className="space-y-3">
                  <label className="text-[9px] font-heading font-black text-white/40 uppercase tracking-[0.3em] ml-2 italic">Max Exposure (Credit Limit)</label>
                  <Input 
                    type="number" 
                    value={formData.creditLimit} 
                    onChange={(e) => setFormData({...formData, creditLimit: Number(e.target.value)})} 
                    className="h-16 bg-white/10 border border-white/20 rounded-2xl font-heading font-black text-white text-2xl px-8 shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                   <label className="text-[9px] font-heading font-black text-white/40 uppercase tracking-[0.3em] ml-2 italic">Commercial Status</label>
                   <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v as any})}>
                    <SelectTrigger className="h-16 bg-white/10 border border-white/20 rounded-2xl font-heading font-black italic px-8 text-white shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="ACTIVE" className="font-heading font-black uppercase text-[10px] tracking-tight italic">ACTIVE PROTOCOL</SelectItem>
                      <SelectItem value="INACTIVE" className="font-heading font-black uppercase text-[10px] tracking-tight italic">INACTIVE ARCHIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-8 flex gap-6">
              <Button type="button" variant="ghost" className="h-16 px-10 rounded-2xl font-heading font-black text-text-muted uppercase text-[10px] tracking-tight italic hover:text-brand-black" onClick={() => setIsModalOpen(false)}>Discard Registry</Button>
              <Button type="submit" className="flex-1 bg-brand-black hover:bg-brand-orange text-white rounded-[2rem] shadow-2xl h-24 font-heading font-black uppercase tracking-[0.2em] italic text-sm border-none transition-all duration-500">
                {editingCustomer ? "Commit Strategic Update" : "Onboard Strategic Partner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

