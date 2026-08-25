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
  Fingerprint,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import {
  OperationalMetricGrid,
  OperationalMetricCard,
  OperationalPanel,
  OperationalInput,
  OperationalField,
  OperationalButton,
  OperationalDataTable,
  OperationalStatusBadge,
} from "@/components/operational/OperationalUI";

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

  const columns: ColumnDef<Employee>[] = [
    {
      id: "identity",
      header: "Staff Identity",
      accessorFn: (row) => row.fullName,
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center text-sm font-black uppercase">
            {row.original.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-black text-slate-900 text-xs uppercase">{row.original.fullName}</div>
            <div className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">{row.original.employeeId}</div>
          </div>
        </div>
      ),
    },
    {
      id: "position",
      header: "Position / Unit",
      accessorFn: (row) => row.position,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-black text-slate-900 uppercase">{row.original.position}</span>
          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">
            {row.original.department?.name || "Operations"}
          </span>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      accessorFn: (row) => row.phone || "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <Phone className="w-3 h-3" /> {row.original.phone || "—"}
        </div>
      ),
    },
    {
      id: "link",
      header: "System Link",
      accessorFn: (row) => row.userId,
      cell: ({ row }) => (
        row.original.userId ? (
          <OperationalStatusBadge status="success">
            <Shield className="w-3 h-3" /> Linked
          </OperationalStatusBadge>
        ) : (
          <OperationalStatusBadge status="neutral">Off-Network</OperationalStatusBadge>
        )
      ),
    },
    {
      id: "actions",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => (
        <OperationalButton
          variant="ghost"
          onClick={() => {
            setEditingEmployee(row.original);
            setFormData({
              fullName: row.original.fullName,
              employeeId: row.original.employeeId,
              position: row.original.position,
              phone: row.original.phone || "",
              departmentId: row.original.departmentId,
            });
            setIsModalOpen(true);
          }}
        >
          <Fingerprint className="w-3.5 h-3.5" />
        </OperationalButton>
      ),
    },
  ];

  return (
    <OperationalMigrationShell
      title="Data Personel"
      subtitle="Direktori staf dan sinkronisasi struktur departemen"
      actions={
        <OperationalButton
          variant="primary"
          onClick={() => {
            setEditingEmployee(null);
            setFormData({ fullName: "", employeeId: "", position: "", phone: "", departmentId: "" });
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Onboard Personnel</span>
        </OperationalButton>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Active Staff"
            value={employees.length}
            helper="Total Employees"
            icon={<UserCheck className="h-4 w-4" />}
            tone="green"
          />
          <OperationalMetricCard
            label="Departments"
            value={departments.length || 0}
            helper="Operational Units"
            icon={<Building2 className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="System Access"
            value={linkedCount}
            helper="Users with Clearance"
            icon={<Lock className="h-4 w-4" />}
            tone="purple"
          />
        </OperationalMetricGrid>

        <OperationalPanel className="flex items-center justify-between gap-4 w-full">
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
            <OperationalInput
              icon={<Search className="h-4 w-4" />}
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-72"
            />
          </div>
        </OperationalPanel>

        <OperationalDataTable
          data={filteredEmployees}
          columns={columns as any}
          getRowId={(row: Employee) => row.id}
          searchPlaceholder=""
          enableSearch={false}
          enableColumnVisibility={false}
          loading={loading}
          emptyMessage="Syncing HRIS..."
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <UserIcon className="w-6 h-6 text-blue-400" />
              <div>
                <DialogTitle>
                  {editingEmployee ? "Edit Profile" : "Onboard Staff"}
                </DialogTitle>
                <DialogDescription>Personnel Asset Protocol</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="operational-stack">
            <div className="grid grid-cols-2 gap-4">
              <OperationalField label="Full Name">
                <input
                  placeholder="e.g. JOHN DOE"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  autoFocus
                />
              </OperationalField>
              <OperationalField label="Staff ID">
                <input
                  placeholder="EMP-2024-XXX"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </OperationalField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <OperationalField label="Department">
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v || "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    {departments.length === 0 && <SelectItem value="default">Operations</SelectItem>}
                  </SelectContent>
                </Select>
              </OperationalField>
              <OperationalField label="Position">
                <input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
              </OperationalField>
            </div>

            <OperationalField label="Phone / WhatsApp">
              <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </OperationalField>

            <DialogFooter className="gap-3">
              <OperationalButton variant="secondary" onClick={() => setIsModalOpen(false)}>Discard</OperationalButton>
              <OperationalButton variant="primary" type="submit">
                {editingEmployee ? "Update" : "Onboard"}
                <ChevronRight className="w-4 h-4" />
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
