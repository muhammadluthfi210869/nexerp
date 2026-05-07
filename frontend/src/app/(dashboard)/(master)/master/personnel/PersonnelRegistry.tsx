"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  User as UserIcon, 
  Shield, 
  Phone, 
  ChevronRight,
  UserCheck,
  Building2,
  Lock,
  Zap,
  Fingerprint,
  Award
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Department = { id: string; name: string };

type Employee = {
  id: string;
  fullName: string;
  employeeId: string;
  position: string;
  phone: string | null;
  departmentId: string;
  department?: Department;
  userId: string | null;
  status: "ACTIVE" | "INACTIVE";
};

interface PersonnelRegistryProps {
  initialEmployees: Employee[];
  initialDepartments: Department[];
}

export function PersonnelRegistry({ initialEmployees, initialDepartments }: PersonnelRegistryProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    position: "",
    phone: "",
    departmentId: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        api.get("/hr/employees"),
        api.get("/master/departments"),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data || []);
    } catch (err) {
      toast.error("Personnel registry sync failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.patch(`/hr/employees/${editingEmployee.id}`, formData);
        toast.success("Personnel record updated");
      } else {
        await api.post("/hr/employees", formData);
        toast.success("New staff member onboarded");
      }
      setIsModalOpen(false);
      setEditingEmployee(null);
      fetchData();
    } catch (err) {
      toast.error("Integrity error in personnel registration");
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-12 space-y-16 animate-in fade-in duration-1000 bg-base min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-6">
           <div className="flex items-center gap-4">
              <div className="h-12 w-1.5 bg-brand-orange rounded-full shadow-[0_0_15px_rgba(246,145,30,0.5)]" />
              <span className="text-[11px] font-heading font-black uppercase tracking-[0.5em] text-brand-orange italic">Human Capital Ledger v4.2</span>
           </div>
           <h1 className="text-7xl font-heading font-black tracking-[calc(-0.05em)] text-brand-black uppercase italic leading-[0.9]">
             Personnel <br />
             <span className="text-brand-orange">Registry Hub</span>
           </h1>
           <p className="text-text-muted font-black uppercase tracking-[0.2em] text-[11px] max-w-xl leading-relaxed italic opacity-60 pl-1">
             Global staff directory and departmental hierarchy synchronization. Linking personnel to PIC-level operational tasks.
           </p>
        </div>

        <div className="flex gap-6">
           <Button variant="outline" className="h-20 px-10 border-none bg-white text-brand-black rounded-[2rem] font-heading font-black uppercase tracking-tight text-[10px] shadow-2xl hover:bg-brand-black hover:text-white transition-all duration-500 italic">
              <Award className="mr-3 h-5 w-5" /> View Org Chart
           </Button>
           <Button 
            onClick={() => {
              setEditingEmployee(null);
              setFormData({ fullName: "", employeeId: "", position: "", phone: "", departmentId: "" });
              setIsModalOpen(true);
            }}
            className="h-20 px-12 bg-brand-black hover:bg-brand-orange text-white rounded-[2rem] shadow-2xl transition-all duration-500 font-heading font-black uppercase tracking-tight text-xs border-none group italic"
           >
              <Plus className="mr-3 h-6 w-6 stroke-[3px] group-hover:rotate-90 transition-transform duration-500" />
              Onboard Personnel
           </Button>
        </div>
      </div>

      {/* Analytics HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: "Active Staff Count", count: employees.length, icon: UserCheck, color: "text-brand-orange", bg: "bg-brand-orange/10" },
          { label: "Operational Depts", count: departments.length || 0, icon: Building2, color: "text-brand-blue", bg: "bg-brand-blue/10" },
          { label: "System Clearance", count: employees.filter(e => e.userId).length, icon: Lock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
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

      {/* Registry Table Terminal */}
      <Card className="glass-premium border-none shadow-[0_0_80px_rgba(0,0,0,0.1)] rounded-[4rem] overflow-hidden border border-white/10 bg-white/40">
        <div className="p-10 border-b border-border/5 flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-surface/30">
           <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-hover:text-brand-orange transition-colors" />
            <Input 
              placeholder="SEARCH BY STAFF NAME OR ID..." 
              className="h-16 w-full pl-16 pr-8 bg-white border-none rounded-[2rem] font-heading font-black text-[10px] uppercase tracking-tight shadow-xl shadow-brand-black/5 italic border border-white/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-6">
             <Button variant="outline" className="h-16 px-10 rounded-[1.5rem] bg-brand-black text-white border-none shadow-2xl hover:bg-brand-orange transition-all duration-500 font-heading font-black text-[10px] uppercase tracking-tight italic flex items-center gap-4">
                <Zap className="h-5 w-5" /> Pulse Audit
             </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-10 pl-12 font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Staff Identity</TableHead>
                <TableHead className="font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Position / Unit</TableHead>
                <TableHead className="font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Contact Protocol</TableHead>
                <TableHead className="font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40 text-center">System Link</TableHead>
                <TableHead className="w-[150px] text-right pr-12 font-heading font-black text-text-muted uppercase tracking-[0.3em] text-[9px] italic opacity-40">Cmd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/5">
              {loading && employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full mx-auto mb-6 shadow-2xl"></div>
                    <p className="font-heading font-black text-text-muted uppercase text-[10px] tracking-[0.4em] italic opacity-40">Syncing HRIS...</p>
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="group hover:bg-surface/50 transition-all duration-500 border-none">
                  <TableCell className="py-10 pl-12">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-[1.5rem] bg-brand-black text-white flex items-center justify-center shadow-2xl shadow-brand-black/20 group-hover:bg-brand-orange transition-colors duration-500 text-2xl font-heading font-black italic">
                          {emp.fullName.charAt(0)}
                       </div>
                       <div className="flex flex-col gap-1">
                          <span className="font-heading font-black text-brand-black tracking-tight text-xl uppercase italic leading-none">{emp.fullName}</span>
                          <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] italic">{emp.employeeId}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-heading font-black text-brand-black uppercase italic leading-none tracking-tight group-hover:text-brand-orange transition-colors">{emp.position}</span>
                      <span className="text-[9px] font-heading font-black text-brand-blue uppercase tracking-[0.2em] italic opacity-60">{emp.department?.name || "OPERATIONS UNIT"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-[10px] font-heading font-black text-text-muted uppercase tracking-tight italic group-hover:text-brand-black transition-colors">
                       <Phone className="h-3 w-3 text-brand-orange" /> {emp.phone || "---"}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {emp.userId ? (
                      <Badge className="bg-emerald-500 text-white border-none font-heading font-black text-[9px] tracking-tight italic px-6 py-2 rounded-full shadow-xl shadow-emerald-500/20">
                        <Shield className="w-3 h-3 mr-2 stroke-[3px]" /> LINKED
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-text-muted border-border/5 font-heading font-black text-[9px] tracking-tight italic px-6 py-2 rounded-full uppercase opacity-40">
                        OFF-NETWORK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-12">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 h-12 w-12 rounded-xl bg-white border border-border/5 shadow-xl text-text-muted hover:bg-brand-orange hover:text-white duration-500"
                      onClick={() => {
                        setEditingEmployee(emp);
                        setFormData({
                          fullName: emp.fullName,
                          employeeId: emp.employeeId,
                          position: emp.position,
                          phone: emp.phone || "",
                          departmentId: emp.departmentId,
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      <Fingerprint className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-base rounded-[4rem] border-none shadow-[0_0_120px_rgba(0,0,0,0.3)] p-0 overflow-hidden">
          <DialogHeader className="p-12 bg-brand-black text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/20 rounded-full blur-[80px] -mr-40 -mt-40" />
             <div className="flex items-center gap-6 relative z-10">
                <div className="p-5 bg-white/10 rounded-[2rem] border-none shadow-2xl">
                  <UserIcon className="h-10 w-10 text-brand-orange stroke-[3px]" />
                </div>
                <div>
                  <DialogTitle className="text-4xl font-heading font-black text-white tracking-tighter italic uppercase leading-none">
                    {editingEmployee ? "Refactor Profile" : "Onboard Staff"}
                  </DialogTitle>
                  <p className="text-[10px] font-heading font-black text-white/40 uppercase tracking-[0.4em] mt-4 italic">Personnel Asset Protocol v4.2</p>
                </div>
             </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="p-12 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Legal Full Name</label>
                <Input 
                  placeholder="e.g. JOHN DOE X-GEN" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-16 bg-surface border-none rounded-2xl font-heading font-black text-brand-black text-xl px-8 shadow-inner uppercase italic"
                  autoFocus
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Global Staff ID</label>
                <Input 
                  placeholder="EMP-2024-XXX" 
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="h-16 bg-surface border-none rounded-2xl font-heading font-black text-brand-black text-xl px-8 shadow-inner uppercase font-sans italic"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Operational Unit</label>
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({...formData, departmentId: v || ""})}>
                  <SelectTrigger className="h-16 bg-surface border-none rounded-2xl font-heading font-black italic px-8 text-brand-black shadow-inner">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {departments.map(d => <SelectItem key={d.id} value={d.id} className="font-heading font-black uppercase text-[10px] tracking-tight italic">{d.name}</SelectItem>)}
                    {departments.length === 0 && <SelectItem value="default" className="font-heading font-black uppercase text-[10px] tracking-tight italic">Operations</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Functional Position</label>
                <Input value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="h-16 bg-surface border-none rounded-2xl font-heading font-black text-brand-black text-xl px-8 shadow-inner uppercase italic" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-heading font-black text-text-muted uppercase tracking-[0.3em] ml-2 italic opacity-50">Primary Contact (WhatsApp/Phone)</label>
              <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-16 bg-surface border-none rounded-2xl font-heading font-black text-brand-black text-xl px-8 shadow-inner italic" />
            </div>

            <DialogFooter className="pt-8 flex gap-6">
              <Button type="button" variant="ghost" className="h-16 px-10 rounded-2xl font-heading font-black text-text-muted uppercase text-[10px] tracking-tight italic hover:text-brand-black" onClick={() => setIsModalOpen(false)}>Discard Profile</Button>
              <Button type="submit" className="flex-1 bg-brand-black hover:bg-brand-orange text-white rounded-[2rem] shadow-2xl h-24 font-heading font-black uppercase tracking-[0.2em] italic text-sm border-none transition-all duration-500">
                {editingEmployee ? "Commit Record Refactor" : "Authorize Onboarding"}
                <ChevronRight className="w-6 h-6 ml-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

