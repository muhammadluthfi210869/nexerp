"use client";

import React, { useState } from "react";
import {
  Users,
  Briefcase,
  UserPlus,
  Search,
  Filter,
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
  FileText
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaTabNav,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast
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

const INITIAL_EMPLOYEES: Employee[] = [
  { id: "EMP-001", nik: "KIL-2022-001", name: "Budi Santoso, S.T", department: "Produksi Mixing", role: "Supervisor Produksi", joinDate: "2022-01-15", contractType: "PKWTT (Tetap)", status: "AKTIF", email: "budi.santoso@kalopsia.id", phone: "0812-3344-5566", basicSalary: 6500000 },
  { id: "EMP-002", nik: "KIL-2023-014", name: "Rian Saputra, S.Farm", department: "R&D Formulasi", role: "Senior Formulator Skincare", joinDate: "2023-03-01", contractType: "PKWTT (Tetap)", status: "AKTIF", email: "rian.s@kalopsia.id", phone: "0812-4455-6677", basicSalary: 8000000 },
  { id: "EMP-003", nik: "KIL-2023-022", name: "Siti Rahmawati, S.Si", department: "QC Mikrobiologi", role: "Analis Kimia & QC Inspector", joinDate: "2023-06-10", contractType: "PKWT (Kontrak)", status: "AKTIF", email: "siti.rahma@kalopsia.id", phone: "0813-8899-0011", basicSalary: 5500000 },
  { id: "EMP-004", nik: "KIL-2024-005", name: "Dewi Lestari, S.E", department: "BusDev Maklon", role: "Senior Account Executive", joinDate: "2024-01-08", contractType: "PKWTT (Tetap)", status: "AKTIF", email: "dewi.lestari@kalopsia.id", phone: "0856-7788-9900", basicSalary: 7000000 },
  { id: "EMP-005", nik: "KIL-2024-031", name: "Ahmad Dani", department: "Gudang Inbound", role: "Staff Warehouse Material", joinDate: "2024-05-20", contractType: "PKWT (Kontrak)", status: "AKTIF", email: "ahmad.dani@kalopsia.id", phone: "0819-1122-3344", basicSalary: 4800000 },
  { id: "EMP-006", nik: "KIL-2025-012", name: "dr. Amanda Putri, M.Biomed", department: "QA & APJ", role: "Apoteker Penanggung Jawab", joinDate: "2025-02-01", contractType: "PKWTT (Tetap)", status: "AKTIF", email: "amanda.putri@kalopsia.id", phone: "0811-9988-7766", basicSalary: 11000000 },
];

const INITIAL_CANDIDATES: Candidate[] = [
  { id: "CND-01", name: "Agung Wicaksono, S.T", position: "Operator Mesin Filling Auto", department: "Produksi Filling", appliedDate: "2026-09-07", stage: "INTERVIEW_USER", experience: "2 Thn Operator Pabrik Kosmetik", education: "D3 Teknik Mesin", phone: "0812-7788-9900", email: "agung.w@gmail.com", matchScore: 92 },
  { id: "CND-02", name: "Nurul Hidayati, S.Farm", position: "Junior R&D Formulator", department: "R&D Formulasi", appliedDate: "2026-09-05", stage: "OFFERING", experience: "1 Thn Lab Emulsi & Toner", education: "S1 Farmasi", phone: "0813-2233-4455", email: "nurul.h@gmail.com", matchScore: 96 },
  { id: "CND-03", name: "Fajar Pratama, S.Kom", position: "Digital Marketing Specialist", department: "Marketing", appliedDate: "2026-09-04", stage: "SCREENING", experience: "3 Thn Agency Ads Meta/TikTok", education: "S1 Sistem Informasi", phone: "0878-3344-5566", email: "fajar.p@gmail.com", matchScore: 85 },
  { id: "CND-04", name: "Citra Kirana, S.M", position: "HR Admin & General Affairs", department: "HR & GA", appliedDate: "2026-09-02", stage: "INTERVIEW_HR", experience: "2 Thn Admin Payroll & BPJS", education: "S1 Manajemen SDM", phone: "0857-1122-3344", email: "citra.k@gmail.com", matchScore: 89 },
];

const INITIAL_OPENINGS: JobOpening[] = [
  { id: "JOB-01", title: "Operator Mesin Filling & Coding Auto", department: "Produksi Filling", type: "Full-Time", openings: 2, applicantsCount: 8, deadline: "2026-09-25", status: "OPEN" },
  { id: "JOB-02", title: "Junior R&D Formulator Kosmetik", department: "R&D Formulasi", type: "Full-Time", openings: 1, applicantsCount: 12, deadline: "2026-09-20", status: "OPEN" },
  { id: "JOB-03", title: "Digital Marketing Specialist", department: "Marketing", type: "Full-Time", openings: 1, applicantsCount: 15, deadline: "2026-09-30", status: "OPEN" },
  { id: "JOB-04", title: "Staff Warehouse Material (Inbound)", department: "Warehouse", type: "Kontrak", openings: 2, applicantsCount: 6, deadline: "2026-10-05", status: "OPEN" },
];

export default function HrRecruitmentPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<"employees" | "pipeline" | "openings">("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form states
  const [newEmp, setNewEmp] = useState({
    name: "",
    department: "Produksi Mixing",
    role: "",
    contractType: "PKWT (Kontrak)" as const,
    phone: "",
    email: "",
    basicSalary: 5000000
  });

  const filteredEmployees = INITIAL_EMPLOYEES.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.nik.toLowerCase().includes(searchQuery.toLowerCase()) || e.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === "ALL" || e.department.includes(deptFilter);
    return matchSearch && matchDept;
  });

  const filteredCandidates = INITIAL_CANDIDATES.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === "ALL" || c.department.includes(deptFilter);
    return matchSearch && matchDept;
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.role) {
      toast.error("Nama dan Jabatan wajib diisi!");
      return;
    }
    toast.success("Karyawan baru berhasil didaftarkan ke Master HR!");
    setIsEmployeeModalOpen(false);
    setNewEmp({ name: "", department: "Produksi Mixing", role: "", contractType: "PKWT (Kontrak)", phone: "", email: "", basicSalary: 5000000 });
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pegawai & Rekrutmen (Talent Acquisition & Employees)"
        description="Master database pegawai aktif pabrik manufaktur, manajemen pipeline seleksi kandidat pelamar, dan pembukaan lowongan kerja."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Total 124 Pegawai Terdaftar</span>
          </div>
        }
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
          value="124 Orang"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          delta={{ value: "+3 Orang Bulan Ini", isPositive: true }}
          subtext="Manufaktur, R&D & Office"
          variant="info"
        />
        <DnaStatCard
          label="Pelamar Dalam Pipeline"
          value={INITIAL_CANDIDATES.length + " Kandidat"}
          icon={<Briefcase className="w-5 h-5 text-purple-600" />}
          delta={{ value: "4 Lowongan Buka", isPositive: true }}
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

      {/* TAB NAVIGATION */}
      <DnaTabNav
        tabs={[
          { id: "employees", label: "Database Pegawai Aktif", icon: Users, count: INITIAL_EMPLOYEES.length },
          { id: "pipeline", label: "Pipeline Seleksi Pelamar", icon: Briefcase, count: INITIAL_CANDIDATES.length },
          { id: "openings", label: "Lowongan Kerja Buka", icon: Building2, count: INITIAL_OPENINGS.length }
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, NIK, jabatan, atau skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">Semua Departemen</option>
              <option value="Produksi">Produksi & Manufaktur</option>
              <option value="R&D">R&D Formulasi</option>
              <option value="QC">Quality Control / QA</option>
              <option value="BusDev">BusDev & Sales</option>
              <option value="Gudang">Warehouse & Logistik</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: EMPLOYEES TABLE */}
      {activeTab === "employees" && (
        <DnaDataTableCard
          title="Daftar Master Pegawai Aktif"
          badge={<DnaBadge variant="info">{filteredEmployees.length} Pegawai</DnaBadge>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">NIK & Profil</th>
                  <th className="px-3.5 py-3">Departemen & Jabatan</th>
                  <th className="px-3.5 py-3">Tipe Kontrak</th>
                  <th className="px-3.5 py-3">Tgl Bergabung</th>
                  <th className="px-3.5 py-3">Kontak & Email</th>
                  <th className="px-3.5 py-3 text-right">Gaji Pokok</th>
                  <th className="px-3.5 py-3 text-center">Status</th>
                  <th className="px-3.5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{emp.nik}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-slate-800">{emp.role}</div>
                      <div className="text-[11px] text-slate-500">{emp.department}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <DnaBadge variant={emp.contractType.includes("Tetap") ? "success" : "purple"}>
                        {emp.contractType}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 font-medium text-slate-700">
                      {emp.joinDate}
                    </td>
                    <td className="px-3.5 py-3 text-slate-600">
                      <div>{emp.phone}</div>
                      <div className="text-[11px] text-slate-400">{emp.email}</div>
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(emp.basicSalary)}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <DnaBadge variant="success">{emp.status}</DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEmployee(emp)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Profil
                      </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      )}

      {/* TAB 2: CANDIDATE PIPELINE */}
      {activeTab === "pipeline" && (
        <DnaDataTableCard
          title="Pipeline Seleksi Calon Karyawan"
          badge={<DnaBadge variant="purple">{filteredCandidates.length} Pelamar</DnaBadge>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">Nama Pelamar</th>
                  <th className="px-3.5 py-3">Posisi Dilamar</th>
                  <th className="px-3.5 py-3">Pengalaman & Edukasi</th>
                  <th className="px-3.5 py-3">Tgl Melamar</th>
                  <th className="px-3.5 py-3 text-center">Match Score</th>
                  <th className="px-3.5 py-3 text-center">Tahapan Seleksi</th>
                  <th className="px-3.5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((cnd) => (
                  <tr key={cnd.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3">
                      <div className="font-bold text-slate-900">{cnd.name}</div>
                      <div className="text-[11px] text-slate-500">{cnd.phone} • {cnd.email}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-slate-800">{cnd.position}</div>
                      <div className="text-[11px] text-slate-500">{cnd.department}</div>
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">
                      <div>{cnd.experience}</div>
                      <div className="text-[11px] text-slate-400">{cnd.education}</div>
                    </td>
                    <td className="px-3.5 py-3 text-slate-600 font-medium">
                      {cnd.appliedDate}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {cnd.matchScore}%
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <DnaBadge
                        variant={
                          cnd.stage === "OFFERING" ? "success" :
                          cnd.stage === "INTERVIEW_USER" ? "purple" :
                          cnd.stage === "INTERVIEW_HR" ? "info" : "default"
                        }
                      >
                        {cnd.stage}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="secondary"
                          size="sm"
                          onClick={() => toast.success("Maju ke tahap berikutnya: " + cnd.name)}
                        >
                          <ChevronRight className="w-3.5 h-3.5 mr-1" />
                          Update
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      )}

      {/* TAB 3: JOB OPENINGS */}
      {activeTab === "openings" && (
        <DnaDataTableCard
          title="Daftar Kebutuhan Formasi & Lowongan Terbuka"
          badge={<DnaBadge variant="info">{INITIAL_OPENINGS.length} Lowongan</DnaBadge>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {INITIAL_OPENINGS.map((job) => (
              <div key={job.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-400 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {job.department}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{job.title}</h4>
                  </div>
                  <DnaBadge variant="success">{job.status}</DnaBadge>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    <span>Kebutuhan: </span>
                    <strong className="text-slate-900">{job.openings} Formasi</strong>
                  </div>
                  <div>
                    <span>Pelamar: </span>
                    <strong className="text-purple-700">{job.applicantsCount} Orang</strong>
                  </div>
                  <div>
                    <span>Deadline: </span>
                    <strong className="text-slate-700">{job.deadline}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DnaDataTableCard>
      )}

      {/* MODAL: TAMBAH PEGAWAI BARU */}
      <DnaModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title="Registrasi Karyawan Baru (Master HR)"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
              <input
                type="text"
                required
                placeholder="cth: Rian Saputra, S.Farm"
                value={newEmp.name}
                onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Departemen *</label>
              <select
                value={newEmp.department}
                onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Produksi Mixing">Produksi Mixing (Ruahan)</option>
                <option value="Produksi Filling">Produksi Filling (Primer)</option>
                <option value="Produksi Packaging">Produksi Packaging (Sekunder)</option>
                <option value="R&D Formulasi">R&D Formulasi</option>
                <option value="QC Mikrobiologi">QC & QA</option>
                <option value="BusDev Maklon">BusDev & Marketing</option>
                <option value="Warehouse Material">Warehouse & Logistik</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan / Role *</label>
              <input
                type="text"
                required
                placeholder="cth: Formulator Skincare"
                value={newEmp.role}
                onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Kontrak *</label>
              <select
                value={newEmp.contractType}
                onChange={(e) => setNewEmp({ ...newEmp, contractType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="PKWT (Kontrak)">PKWT (Kontrak 1 Tahun)</option>
                <option value="PKWTT (Tetap)">PKWTT (Karyawan Tetap)</option>
                <option value="Probation">Probation (Percobaan 3 Bulan)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="text"
                placeholder="0812-xxxx-xxxx"
                value={newEmp.phone}
                onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gaji Pokok Awal (IDR)</label>
              <input
                type="number"
                value={newEmp.basicSalary}
                onChange={(e) => setNewEmp({ ...newEmp, basicSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <DnaButton variant="secondary" size="md" type="button" onClick={() => setIsEmployeeModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" type="submit">
              Simpan Master Pegawai
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL: DETAIL PROFIL PEGAWAI */}
      <DnaModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title={"Profil Karyawan: " + (selectedEmployee?.name || "")}
        maxWidth="max-w-lg"
      >
        {selectedEmployee && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-base">
                {selectedEmployee.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{selectedEmployee.name}</h4>
                <div className="text-slate-500 font-mono">{selectedEmployee.nik} • {selectedEmployee.role}</div>
                <div className="mt-1">
                  <DnaBadge variant="success">{selectedEmployee.status}</DnaBadge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="p-2.5 border border-slate-100 rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">Departemen</span>
                <span className="font-semibold text-slate-800">{selectedEmployee.department}</span>
              </div>
              <div className="p-2.5 border border-slate-100 rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">Status Ikatan Kerja</span>
                <span className="font-semibold text-slate-800">{selectedEmployee.contractType}</span>
              </div>
              <div className="p-2.5 border border-slate-100 rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">Tanggal Masuk</span>
                <span className="font-semibold text-slate-800">{selectedEmployee.joinDate}</span>
              </div>
              <div className="p-2.5 border border-slate-100 rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">Gaji Pokok Terdaftar</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedEmployee.basicSalary)}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-slate-700">
              <div className="font-semibold text-blue-900 mb-1">Kontak & Jalur Komunikasi</div>
              <div>Telepon / WA: {selectedEmployee.phone}</div>
              <div>Email Perusahaan: {selectedEmployee.email}</div>
            </div>

            <div className="flex justify-end pt-2">
              <DnaButton variant="secondary" size="md" onClick={() => setSelectedEmployee(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
