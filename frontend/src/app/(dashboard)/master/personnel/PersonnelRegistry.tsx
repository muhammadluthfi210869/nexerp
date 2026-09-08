"use client";

/**
 * Personnel Registry — Consolidated (Daftar + Kelola)
 *
 * Per Batch 6.3 user feedback: legacy ERP punya Personnel + Kelola Personnel
 * as 2 pages. Kita consolidated jadi 1 page dengan 2 tabs:
 *   - Tab 1: DAFTAR PERSONIL (read-only directory)
 *   - Tab 2: KELOLA PERSONIL (CRUD with Onboard Staff)
 *
 * This is the inner client component. The server page.tsx wraps it with
 * Suspense + initial SSR fetch.
 */

import { useState } from "react";
import {
  Plus,
  User as UserIcon,
  Shield,
  Phone,
  UserCheck,
  Building2,
  Lock,
  Edit2,
  Trash2,
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
import {
  MasterPageShell,
  type MasterStatItem,
  type MasterTab,
} from "@/components/dna";

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

const EMPTY_FORM = {
  fullName: "",
  employeeId: "",
  position: "",
  phone: "",
  departmentId: "",
};

export function PersonnelRegistry({ initialEmployees, initialDepartments }: PersonnelRegistryProps) {
  // Consolidated tabs
  const [activeTab, setActiveTab] = useState<"DAFTAR" | "KELOLA">("DAFTAR");

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        api.get("/hr/employees"),
        api.get("/master/departments"),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data || []);
    } catch {
      toast.error("Personnel registry sync failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: { preventDefault: () => void }): void => {
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
      setFormData({ ...EMPTY_FORM });
      fetchData();
    } catch {
      toast.error("Integrity error in personnel registration");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/hr/employees/${id}`);
      toast.success("Personnel deleted");
      setDeletingId(null);
      fetchData();
    } catch {
      toast.error("Failed to delete personnel");
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      fullName: emp.fullName,
      employeeId: emp.employeeId,
      position: emp.position,
      phone: emp.phone || "",
      departmentId: emp.departmentId,
    });
    setIsModalOpen(true);
  };

  // Stats
  const totalEmployees = employees.length;
  const linkedCount = employees.filter((e) => e.userId).length;
  const unlinkedCount = totalEmployees - linkedCount;

  const stats: [MasterStatItem, MasterStatItem, MasterStatItem, MasterStatItem] = [
    { variant: "neutral", label: "Total Pegawai", value: totalEmployees, subtext: "Seluruh staff terdaftar", icon: <UserCheck /> },
    { variant: "blue", label: "Departemen", value: departments.length, subtext: "Unit operasional", icon: <Building2 /> },
    { variant: "emerald", label: "Linked User", value: linkedCount, subtext: "Punya akses sistem", icon: <Shield /> },
    { variant: "amber", label: "Off-Network", value: unlinkedCount, subtext: "Belum linked ke user", icon: <Lock /> },
  ];

  const tabs: [MasterTab, MasterTab] = [
    { key: "DAFTAR", label: "Daftar Pegawai", count: totalEmployees },
    { key: "KELOLA", label: "Kelola Pegawai", count: linkedCount },
  ];

  // ── Reusable Employee Table ──
  const EmployeeTable = ({ showActions }: { showActions: boolean }) => (
    <TableWrapper>
      <Table>
        <TableHeader className="bg-slate-50/75">
          <TableRow className="hover:bg-transparent border-slate-200">
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Staff Identity</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Posisi / Unit</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Kontak</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 text-center">System Link</TableHead>
            {showActions && (
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 text-center w-24">Aksi</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 5 : 4} className="py-20 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Syncing HRIS...</p>
              </TableCell>
            </TableRow>
          ) : filteredEmployees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 5 : 4} className="py-12 text-center text-slate-400">
                Tidak ada pegawai.
              </TableCell>
            </TableRow>
          ) : (
            filteredEmployees.map((emp) => (
              <TableRow key={emp.id} className="group hover:bg-slate-50/80 border-b border-slate-100">
                <TableCell className="px-4 py-3.5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center text-sm font-bold uppercase">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs uppercase block">{emp.fullName}</span>
                      <span className="text-[11px] text-blue-600">{emp.employeeId}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-900 uppercase">{emp.position}</span>
                    <span className="text-[11px] text-blue-600">{emp.department?.name || "Operations"}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Phone className="w-3 h-3" /> {emp.phone || "---"}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-center">
                  {emp.userId ? (
                    <DnaBadge status="success">
                      <Shield className="w-3 h-3 mr-1" /> Linked
                    </DnaBadge>
                  ) : (
                    <DnaBadge status="default">Off-Network</DnaBadge>
                  )}
                </TableCell>
                {showActions && (
                  <TableCell className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(emp)}
                        className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(emp.id)}
                        className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableWrapper>
  );

  const daftarContent = <EmployeeTable showActions={false} />;

  const kelolaContent = (
    <>
      <div className="flex items-center justify-end mb-3">
        <DnaButton
          variant="primary"
          icon={<Plus />}
          onClick={() => {
            setEditingEmployee(null);
            setFormData({ ...EMPTY_FORM });
            setIsModalOpen(true);
          }}
        >
          Tambah Pegawai
        </DnaButton>
      </div>
      <EmployeeTable showActions={true} />
    </>
  );

  return (
    <>
      <MasterPageShell
        title="PERSONIL"
        badge={<DnaBadge status="info">HR</DnaBadge>}
        subtitle="Master kepegawaian. Tab Daftar = lihat semua personil. Tab Kelola = CRUD."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as "DAFTAR" | "KELOLA")}
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nama atau employee ID..."
        daftarContent={daftarContent}
        kelolaContent={kelolaContent}
      />

      {/* Modal: Add/Edit Employee */}
      <Dialog open={isModalOpen} onOpenChange={(o) => { setIsModalOpen(o); if (!o) setEditingEmployee(null); }}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-slate-800 text-white">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600/20 rounded-xl">
                <UserIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold uppercase tracking-tight">
                  {editingEmployee ? "Edit Pegawai" : "Tambah Pegawai"}
                </DialogTitle>
                <p className="text-[11px] text-white/60 uppercase tracking-wider mt-1">Personnel Asset Protocol</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap *</label>
                <input
                  placeholder="e.g. JOHN DOE"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee ID *</label>
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
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Departemen</label>
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v || "" })}>
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Pilih departemen" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {departments.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs font-bold uppercase">{d.name}</SelectItem>)}
                    {departments.length === 0 && <SelectItem value="default" className="text-xs font-bold uppercase">Operations</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Posisi</label>
                <input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Telepon / WhatsApp</label>
              <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
            </div>

            <DialogFooter className="pt-4 gap-3">
              <DnaButton variant="outline" onClick={() => { setIsModalOpen(false); setEditingEmployee(null); }}>Batal</DnaButton>
              <DnaButton variant="primary" type="submit">
                {editingEmployee ? "Simpan" : "Tambah"}
              </DnaButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Submit */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menyimpan data pegawai ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pegawai</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menghapus pegawai ini dari master data?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setDeletingId(null)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={() => deletingId && handleDelete(deletingId)}>Ya, Hapus</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
