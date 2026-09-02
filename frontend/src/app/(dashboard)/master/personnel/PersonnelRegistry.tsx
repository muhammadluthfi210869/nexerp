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
} from "lucide-react";
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
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DnaInput } from "@/components/dna/DnaInput";
import { StatCard } from "@/components/dna/StatCard";
import { TableShell } from "@/components/layout/TableShell";

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
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
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

  const linkedCount = employees.filter(e => e.userId).length;

  return (
    <TableShell
      title="Personnel"
      titleAccent="Registry Hub"
      subtitle="Human Capital Ledger — Global staff directory and departmental hierarchy synchronization"
      actions={
        <DnaButton
          variant="primary"
          icon={<Plus />}
          onClick={() => {
            setEditingEmployee(null);
            setFormData({ fullName: "", employeeId: "", position: "", phone: "", departmentId: "" });
            setIsModalOpen(true);
          }}
        >
          Onboard Personnel
        </DnaButton>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--card-gap)]">
        <StatCard label="Active Staff" value={employees.length} subValue="Total Employees" icon={<UserCheck />} />
        <StatCard label="Departments" value={departments.length || 0} subValue="Operational Units" icon={<Building2 />} />
        <StatCard label="System Access" value={linkedCount} subValue="Users with Clearance" icon={<Lock />} />
      </div>

      <TableWrapper
        filters={
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <span className="status-dot bg-blue-500" />
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                  Personnel Directory
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  {filteredEmployees.length} Records
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DnaInput
                icon={<Search />}
                placeholder="Search by name or ID..."
                className="md:w-56"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Staff Identity</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Position / Unit</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Contact</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4 text-center">System Link</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Syncing HRIS...</p>
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="group hover:bg-slate-50/30 border-b border-slate-50">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors text-sm font-black uppercase">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-black text-slate-900 text-xs uppercase block">{emp.fullName}</span>
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">{emp.employeeId}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-black text-slate-900 uppercase">{emp.position}</span>
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">{emp.department?.name || "Operations"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <Phone className="w-3 h-3" /> {emp.phone || "---"}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    {emp.userId ? (
                      <DnaBadge status="success">
                        <Shield className="w-3 h-3" /> Linked
                      </DnaBadge>
                    ) : (
                      <DnaBadge status="default">Off-Network</DnaBadge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DnaButton
                      variant="ghost"
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
                      <Fingerprint className="w-3.5 h-3.5" />
                    </DnaButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableWrapper>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-slate-800 text-white">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600/20 rounded-xl">
                <UserIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-black uppercase tracking-tight">
                  {editingEmployee ? "Edit Profile" : "Onboard Staff"}
                </DialogTitle>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-1">Personnel Asset Protocol</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  placeholder="e.g. JOHN DOE"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Staff ID</label>
                <input
                  placeholder="EMP-2024-XXX"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Department</label>
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v || "" })}>
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-xs font-bold uppercase">{d.name}</SelectItem>)}
                    {departments.length === 0 && <SelectItem value="default" className="text-xs font-bold uppercase">Operations</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Position</label>
                <input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone / WhatsApp</label>
              <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
            </div>

            <DialogFooter className="pt-4 gap-3">
              <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>Discard</DnaButton>
              <DnaButton variant="primary" type="submit">
                {editingEmployee ? "Update" : "Onboard"}
                <ChevronRight className="w-4 h-4" />
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
