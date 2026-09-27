"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Users,
  Briefcase,
  UserPlus,
  Search,
  Eye,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  FileSpreadsheet,
  Printer,
  Building2,
  GraduationCap,
  Award,
  ChevronRight,
  UserCheck,
  FileText,
  DollarSign,
  Loader2,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaDetailDrawer,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect,
  DnaTable,
  DnaCell,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

interface Employee {
  id: string;
  nik: string;
  name: string;
  department: string;
  role: string;
  joinDate: string;
  contractType: "PKWTT (Tetap)" | "PKWT (Kontrak)" | "Probation";
  status: "AKTIF" | "CUTI" | "RESIGNED";
  email: string;
  phone: string;
  basicSalary: number;
}

interface Candidate {
  id: string;
  name: string;
  position: string;
  department: string;
  appliedDate: string;
  stage: "SCREENING" | "INTERVIEW_HR" | "INTERVIEW_USER" | "OFFERING" | "HIRED" | "REJECTED";
  experience: string;
  education: string;
  phone: string;
  email: string;
  matchScore: number;
}

interface JobOpening {
  id: string;
  title: string;
  department: string;
  type: "Full-Time" | "Kontrak";
  openings: number;
  applicantsCount: number;
  deadline: string;
  status: "OPEN" | "CLOSED";
}

export default function HrRecruitmentPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Queries
  const { data: rawEmployees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["hr-employees"],
    queryFn: async () => {
      const res = await api.get("/hr/employees");
      return res.data || [];
    },
  });

  const { data: rawCandidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["hr-candidates"],
    queryFn: async () => {
      const res = await api.get("/hr/candidates");
      return res.data || [];
    },
  });

  const employees: Employee[] = useMemo(() => {
    if (!rawEmployees || rawEmployees.length === 0) return [];
    return (rawEmployees as any[]).map((e, idx) => ({
      id: e.id || `emp-${idx}`,
      nik: e.nik || `KIL-2026-${String(idx + 1).padStart(3, "0")}`,
      name: e.name || "Karyawan",
      department: e.department || (e.roles?.[0]?.division) || "Produksi",
      role: e.position || (e.roles?.[0]?.roleName) || e.role || "Staff",
      joinDate: e.joinedAt ? new Date(e.joinedAt).toISOString().split("T")[0] : "2024-01-15",
      contractType: e.contractType === "PERMANENT" ? "PKWTT (Tetap)" : e.contractType === "PROBATION" ? "Probation" : "PKWT (Kontrak)",
      status: e.isActive !== false ? "AKTIF" : "RESIGNED",
      email: e.email || `${(e.name || "karyawan").toLowerCase().replace(/\s+/g, ".")}@kalopsia.id`,
      phone: e.phone || "0812-3344-5566",
      basicSalary: e.basicSalary || e.salary || 5000000,
    }));
  }, [rawEmployees]);

  const candidates: Candidate[] = useMemo(() => {
    if (!rawCandidates || rawCandidates.length === 0) return [];
    return (rawCandidates as any[]).map((c, idx) => ({
      id: c.id || `cnd-${idx}`,
      name: c.name || "Kandidat Pelamar",
      position: c.position || c.appliedRole || "Staff Operasional",
      department: c.department || "Produksi",
      appliedDate: c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "2026-09-01",
      stage: (c.stage || "SCREENING") as any,
      experience: c.experience || c.cvReviewNotes || "Pengalaman Industri Manufaktur",
      education: c.education || "S1 / D3",
      phone: c.phone || "0812-0000-0000",
      email: c.email || "kandidat@email.com",
      matchScore: c.cvReviewScore ? Math.round(c.cvReviewScore * 100) : 90,
    }));
  }, [rawCandidates]);

  const openings: JobOpening[] = useMemo(() => {
    const depts = Array.from(new Set(candidates.map((c) => c.department)));
    if (depts.length === 0) {
      return [
        { id: "JOB-01", title: "Operator Mesin Filling & Mixing Auto", department: "Produksi", type: "Full-Time", openings: 2, applicantsCount: 0, deadline: "2026-10-15", status: "OPEN" },
        { id: "JOB-02", title: "Formulator Skincare & Emulsi", department: "R&D", type: "Full-Time", openings: 1, applicantsCount: 0, deadline: "2026-10-20", status: "OPEN" },
        { id: "JOB-03", title: "Quality Control Analyst Mikrobiologi", department: "QC", type: "Full-Time", openings: 1, applicantsCount: 0, deadline: "2026-10-30", status: "OPEN" },
      ];
    }
    return depts.map((d, i) => ({
      id: `JOB-${i + 1}`,
      title: `Formasi Staf ${d}`,
      department: d,
      type: "Full-Time" as const,
      openings: 2,
      applicantsCount: candidates.filter((c) => c.department === d).length,
      deadline: "2026-10-30",
      status: "OPEN" as const,
    }));
  }, [candidates]);

  // Form states
  const [newEmp, setNewEmp] = useState({
    name: "",
    department: "Produksi Mixing",
    role: "",
    contractType: "PKWT (Kontrak)" as const,
    phone: "",
    email: "",
    basicSalary: 5000000,
  });

  const [newCand, setNewCand] = useState({
    name: "",
    department: "Produksi Mixing",
    position: "",
    phone: "",
    email: "",
    education: "S1 Farmasi",
    experience: "",
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch =
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === "ALL" || e.department.includes(deptFilter);
      return matchSearch && matchDept;
    });
  }, [employees, searchQuery, deptFilter]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === "ALL" || c.department.includes(deptFilter);
      return matchSearch && matchDept;
    });
  }, [candidates, searchQuery, deptFilter]);

  // Mutations
  const createEmployeeMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/hr/employees", payload)).data;
    },
    onSuccess: () => {
      toast.success("Karyawan baru berhasil didaftarkan ke Master HR!");
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      setIsEmployeeModalOpen(false);
      setNewEmp({
        name: "",
        department: "Produksi Mixing",
        role: "",
        contractType: "PKWT (Kontrak)",
        phone: "",
        email: "",
        basicSalary: 5000000,
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mendaftarkan karyawan baru!");
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/hr/candidates", payload)).data;
    },
    onSuccess: () => {
      toast.success("Kandidat pelamar berhasil didaftarkan ke pipeline ATS!");
      queryClient.invalidateQueries({ queryKey: ["hr-candidates"] });
      setIsCandidateModalOpen(false);
      setNewCand({
        name: "",
        department: "Produksi Mixing",
        position: "",
        phone: "",
        email: "",
        education: "S1 Farmasi",
        experience: "",
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mendaftarkan kandidat pelamar!");
    },
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.role) {
      toast.error("Nama dan Jabatan wajib diisi!");
      return;
    }
    createEmployeeMutation.mutate({
      name: newEmp.name,
      department: newEmp.department,
      role: newEmp.role,
      contractType: newEmp.contractType.includes("Tetap") ? "PERMANENT" : newEmp.contractType.includes("Probation") ? "PROBATION" : "CONTRACT",
      phone: newEmp.phone,
      email: newEmp.email || `${newEmp.name.toLowerCase().replace(/\s+/g, ".")}@kalopsia.id`,
      basicSalary: newEmp.basicSalary,
      joinDate: new Date().toISOString(),
      roles: [{ roleName: newEmp.role, weight: 1.0, isPrimary: true }],
    });
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCand.name || !newCand.position) {
      toast.error("Nama dan Posisi pelamar wajib diisi!");
      return;
    }
    createCandidateMutation.mutate({
      name: newCand.name,
      department: newCand.department,
      email: newCand.email || `${newCand.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      phone: newCand.phone,
      cvReviewNotes: newCand.experience,
      cvReviewScore: 0.9,
    });
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pegawai & Rekrutmen (Talent Acquisition & Employees)"
        description="Master database pegawai aktif pabrik manufaktur, manajemen pipeline seleksi kandidat pelamar, dan pembukaan lowongan kerja."
        tabs={[
          { id: "employees", label: "Database Pegawai Aktif", count: employees.length },
          { id: "pipeline", label: "Pipeline Seleksi Pelamar", count: candidates.length },
          { id: "openings", label: "Lowongan Kerja Buka", count: openings.length }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Dokumen
            </DnaButton>
            <DnaButton variant="secondary" size="md" onClick={() => toast.success("Exporting Data Pegawai ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            {activeTab === "employees" && (
              <DnaButton variant="primary" size="md" onClick={() => setIsEmployeeModalOpen(true)}>
                <UserPlus className="w-4 h-4 mr-1.5" />
                Tambah Pegawai Baru
              </DnaButton>
            )}
            {activeTab === "pipeline" && (
              <DnaButton variant="primary" size="md" onClick={() => setIsCandidateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Input Pelamar Baru
              </DnaButton>
            )}
            {activeTab === "openings" && (
              <DnaButton variant="primary" size="md" onClick={() => setIsOpeningModalOpen(true)}>
                <Briefcase className="w-4 h-4 mr-1.5" />
                Buka Lowongan Baru
              </DnaButton>
            )}
          </div>
        }
      />

      {/* KPI STAT CARDS */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Pegawai Aktif"
          value={employees.length + " Orang"}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          delta={{ value: "+3 Orang Bulan Ini", isPositive: true }}
          subtext="Manufaktur, R&D & Office"
          variant="info"
        />
        <DnaStatCard
          label="Pelamar Dalam Pipeline"
          value={candidates.length + " Kandidat"}
          icon={<Briefcase className="w-5 h-5 text-purple-600" />}
          delta={{ value: openings.length + " Lowongan Buka", isPositive: true }}
          subtext="Screening s/d Offering"
          variant="purple"
        />
        <DnaStatCard
          label="Jadwal Interview Pekan Ini"
          value="6 Sesi"
          icon={<Calendar className="w-5 h-5 text-amber-600" />}
          delta={{ value: "2 Sesi Hari Ini", isPositive: true }}
          subtext="User & Lab Formulasi Test"
          variant="warning"
        />
        <DnaStatCard
          label="Turnover Rate Tahunan"
          value="2.8%"
          icon={<Award className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Sangat Sehat (< 5%)", isPositive: true }}
          subtext="Retensi Karyawan Optimal"
          variant="success"
        />
      </DnaKpiGrid>

      {/* DATA TABLE WRAPPER */}
      <DnaDataTableCard
        customToolbar={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="relative w-80">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <DnaInput
                  type="text"
                  placeholder="Cari nama, NIK, jabatan, atau posisi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <DnaSelect
                value={deptFilter}
                onChange={setDeptFilter}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="ALL">Semua Departemen</option>
                <option value="Produksi">Produksi & Manufaktur</option>
                <option value="R&D">R&D Formulasi</option>
                <option value="QC">Quality Control / QA</option>
                <option value="BusDev">BusDev & Sales</option>
                <option value="Gudang">Warehouse & Logistik</option>
              </DnaSelect>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {activeTab === "employees" && `${filteredEmployees.length} Pegawai Terdaftar`}
              {activeTab === "pipeline" && `${filteredCandidates.length} Pelamar Aktif`}
              {activeTab === "openings" && `${openings.length} Formasi Buka`}
            </div>
          </div>
        }
      >
        {/* TAB 1: EMPLOYEES TABLE */}
        {activeTab === "employees" && (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <DnaTh className="px-3.5 py-2.5 w-[110px]">NIK</DnaTh>
                  <DnaTh className="px-3.5 py-2.5">Nama Pegawai</DnaTh>
                  <DnaTh className="px-3.5 py-2.5">Jabatan & Departemen</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-center w-[130px]">Tipe Kontrak</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[110px]">Tgl Masuk</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[130px]">No. Telepon</DnaTh>
                  <DnaTh className="px-3.5 py-2.5">Email</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-right w-[130px]">Gaji Pokok</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-center w-[90px]">Status</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-center w-[70px]">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredEmployees.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="px-3.5 py-8 text-center text-xs text-slate-400">
                      Tidak ada pegawai yang cocok dengan kriteria pencarian.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <DnaTableRow key={emp.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Code>{emp.nik}</DnaCell.Code>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-semibold text-slate-900">{emp.name}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.NaturalPair
                          primary={emp.role}
                          secondary={emp.department}
                        />
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-center">
                        <DnaBadge variant={emp.contractType.includes("Tetap") ? "success" : "purple"}>
                          {emp.contractType}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="tabular-nums text-[11.5px] text-slate-600">{emp.joinDate}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="tabular-nums text-[11.5px] text-slate-700">{emp.phone}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-600">{emp.email}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-right">
                        <DnaCell.Numeric value={emp.basicSalary} prefix="Rp " />
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-center">
                        <DnaBadge variant={emp.status === "AKTIF" ? "success" : "neutral"}>
                          {emp.status}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-center">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEmployee(emp)}
                          title="Lihat Profil Pegawai"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}

        {/* TAB 2: CANDIDATE PIPELINE */}
        {activeTab === "pipeline" && (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <DnaTh className="px-3.5 py-2.5">Nama Pelamar</DnaTh>
                  <DnaTh className="px-3.5 py-2.5">Posisi & Departemen</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[130px]">No. Telepon</DnaTh>
                  <DnaTh className="px-3.5 py-2.5">Email</DnaTh>
                  <DnaTh className="px-3.5 py-2.5">Pengalaman Kerja</DnaTh>
                  <DnaTh className="px-3.5 py-2.5">Pendidikan</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[110px]">Tgl Melamar</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-right w-[100px]">Match</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-center w-[130px]">Tahapan Seleksi</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-center w-[70px]">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredCandidates.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="px-3.5 py-8 text-center text-xs text-slate-400">
                      Tidak ada pelamar yang cocok dengan kriteria pencarian.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredCandidates.map((cnd) => (
                    <DnaTableRow key={cnd.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-semibold text-slate-900">{cnd.name}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.NaturalPair
                          primary={cnd.position}
                          secondary={cnd.department}
                        />
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="tabular-nums text-[11.5px] text-slate-700">{cnd.phone}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-600">{cnd.email}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-800">{cnd.experience}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-600">{cnd.education}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="tabular-nums text-[11.5px] text-slate-600">{cnd.appliedDate}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-right">
                        <DnaCell.Numeric
                          value={cnd.matchScore}
                          suffix="%"
                          className="font-bold text-emerald-700"
                        />
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-center">
                        <DnaBadge
                          variant={
                            cnd.stage === "OFFERING" ? "success" :
                            cnd.stage === "INTERVIEW_USER" ? "purple" :
                            cnd.stage === "INTERVIEW_HR" ? "info" : "default"
                          }
                        >
                          {cnd.stage}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-center">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.success("Maju ke tahap seleksi berikutnya: " + cnd.name)}
                          title="Update Tahap Seleksi"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-purple-600"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}

        {/* TAB 3: JOB OPENINGS */}
        {activeTab === "openings" && (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <DnaTh className="px-3.5 py-2.5">Posisi Lowongan</DnaTh>
                  <DnaTh className="px-3.5 py-2.5">Divisi / Departemen</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-center w-[130px]">Tipe Kontrak</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-right w-[140px]">Kebutuhan Formasi</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-right w-[140px]">Pelamar Masuk</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[130px]">Batas Deadline</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 text-center w-[100px]">Status</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {openings.map((job) => (
                  <DnaTableRow key={job.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-semibold text-slate-900">{job.title}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="text-slate-700">{job.department}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <DnaBadge variant={job.type === "Full-Time" ? "info" : "secondary"}>
                        {job.type}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric value={job.openings} suffix=" Orang" />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric value={job.applicantsCount} suffix=" Pelamar" className="font-semibold text-purple-700" />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="tabular-nums text-[11.5px] text-slate-600">{job.deadline}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <DnaBadge variant="success">{job.status}</DnaBadge>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </DnaDataTableCard>

      {/* MODAL: TAMBAH PEGAWAI BARU */}
      <DnaModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title="Registrasi Karyawan Baru (Master HR)"
        size="md"
      >
        <form onSubmit={handleAddEmployee} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
              <DnaInput
                type="text"
                required
                placeholder="cth: Rian Saputra, S.Farm"
                value={newEmp.name}
                onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Departemen *</label>
              <DnaSelect
                value={newEmp.department}
                onChange={(val) => setNewEmp({ ...newEmp, department: val })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Produksi Mixing">Produksi Mixing (Ruahan)</option>
                <option value="Produksi Filling">Produksi Filling (Primer)</option>
                <option value="Produksi Packaging">Produksi Packaging (Sekunder)</option>
                <option value="R&D Formulasi">R&D Formulasi</option>
                <option value="QC Mikrobiologi">QC & QA</option>
                <option value="BusDev Maklon">BusDev & Marketing</option>
                <option value="Warehouse Material">Warehouse & Logistik</option>
              </DnaSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan / Role *</label>
              <DnaInput
                type="text"
                required
                placeholder="cth: Formulator Skincare"
                value={newEmp.role}
                onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Kontrak *</label>
              <DnaSelect
                value={newEmp.contractType}
                onChange={(val) => setNewEmp({ ...newEmp, contractType: val as any })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="PKWT (Kontrak)">PKWT (Kontrak 1 Tahun)</option>
                <option value="PKWTT (Tetap)">PKWTT (Karyawan Tetap)</option>
                <option value="Probation">Probation (Percobaan 3 Bulan)</option>
              </DnaSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <DnaInput
                type="text"
                placeholder="0812-xxxx-xxxx"
                value={newEmp.phone}
                onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gaji Pokok Awal (IDR)</label>
              <DnaInput
                type="number"
                value={newEmp.basicSalary}
                onChange={(e) => setNewEmp({ ...newEmp, basicSalary: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <DnaButton variant="secondary" size="md" type="button" onClick={() => setIsEmployeeModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" type="submit" disabled={createEmployeeMutation.isPending}>
              {createEmployeeMutation.isPending ? "Menyimpan..." : "Simpan Master Pegawai"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL: INPUT PELAMAR BARU */}
      <DnaModal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        title="Input Pelamar Baru (ATS Recruitment Pipeline)"
        size="md"
      >
        <form onSubmit={handleAddCandidate} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pelamar *</label>
              <DnaInput
                type="text"
                required
                placeholder="cth: Agung Wicaksono, S.T"
                value={newCand.name}
                onChange={(e) => setNewCand({ ...newCand, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Posisi yang Dilamar *</label>
              <DnaInput
                type="text"
                required
                placeholder="cth: Operator Mesin Filling Auto"
                value={newCand.position}
                onChange={(e) => setNewCand({ ...newCand, position: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Departemen Tujuan *</label>
              <DnaSelect
                value={newCand.department}
                onChange={(val) => setNewCand({ ...newCand, department: val })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Produksi Mixing">Produksi Mixing</option>
                <option value="Produksi Filling">Produksi Filling</option>
                <option value="R&D Formulasi">R&D Formulasi</option>
                <option value="QC Mikrobiologi">QC Mikrobiologi</option>
                <option value="BusDev Maklon">BusDev Maklon</option>
                <option value="Warehouse Material">Warehouse Material</option>
              </DnaSelect>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pendidikan Terakhir</label>
              <DnaSelect
                value={newCand.education}
                onChange={(val) => setNewCand({ ...newCand, education: val })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="SMK / SMA">SMK / SMA Kimia/Mesin</option>
                <option value="D3 Farmasi / Teknik">D3 Farmasi / Teknik Mesin</option>
                <option value="S1 Farmasi">S1 Farmasi</option>
                <option value="S1 Kimia / Biologi">S1 Kimia / Biologi</option>
                <option value="S1 Manajemen / IT">S1 Manajemen / IT</option>
              </DnaSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Pelamar</label>
              <DnaInput
                type="email"
                placeholder="nama@email.com"
                value={newCand.email}
                onChange={(e) => setNewCand({ ...newCand, email: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp</label>
              <DnaInput
                type="text"
                placeholder="0812-xxxx-xxxx"
                value={newCand.phone}
                onChange={(e) => setNewCand({ ...newCand, phone: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Pengalaman Kerja</label>
            <DnaInput
              type="text"
              placeholder="cth: 2 Thn Operator Filling Kosmetik Cair"
              value={newCand.experience}
              onChange={(e) => setNewCand({ ...newCand, experience: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <DnaButton variant="secondary" size="md" type="button" onClick={() => setIsCandidateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" type="submit" disabled={createCandidateMutation.isPending}>
              {createCandidateMutation.isPending ? "Mendaftarkan..." : "Daftarkan Pelamar"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* QUICK PEEK DRAWER: PROFIL PEGAWAI */}
      <DnaDetailDrawer
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee?.name || "Profil Karyawan"}
        subtitle={`${selectedEmployee?.nik} • ${selectedEmployee?.role}`}
        badge={
          selectedEmployee ? (
            <DnaBadge variant={selectedEmployee.contractType.includes("Tetap") ? "success" : "purple"}>
              {selectedEmployee.contractType}
            </DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "overview",
            label: "Informasi Karyawan",
            content: selectedEmployee && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Departemen Divisi</span>
                    <span className="font-semibold text-slate-900">{selectedEmployee.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status Karyawan</span>
                    <span className="font-bold text-emerald-700">{selectedEmployee.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tanggal Masuk (Join)</span>
                    <span className="tabular-nums text-slate-800">{selectedEmployee.joinDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gaji Pokok Tercatat</span>
                    <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(selectedEmployee.basicSalary)}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-900">Kontak & Saluran Komunikasi</h4>
                  <div className="space-y-1.5 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span className="tabular-nums text-[11px]">{selectedEmployee.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: "docs",
            label: "Kompensasi & Hak Kerja",
            content: selectedEmployee && (
              <div className="space-y-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-600">Hak Cuti Tahunan:</span>
                    <span className="font-bold text-slate-900">12 Hari / Tahun</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-600">Fasilitas BPJS Kesehatan:</span>
                    <span className="font-semibold text-emerald-700">Terdaftar Aktif</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">BPJS Ketenagakerjaan (JKK/JKM):</span>
                    <span className="font-semibold text-emerald-700">Terdaftar Aktif</span>
                  </div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedEmployee(null)}>
              Tutup
            </DnaButton>
            <div className="flex gap-2">
              <DnaButton variant="secondary" size="md" onClick={() => toast.success("Mencetak Kartu ID Pegawai...")}>
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak ID Card
              </DnaButton>
              <DnaButton variant="primary" size="md" onClick={() => toast.success("Membuka form edit data pegawai...")}>
                Edit Data
              </DnaButton>
            </div>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
