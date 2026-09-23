"use client";

import React, { useState, useMemo } from "react";
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
  DollarSign
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
  DnaCell
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
  const [activeTab, setActiveTab] = useState<string>("employees");
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

  const filteredEmployees = useMemo(() => {
    return INITIAL_EMPLOYEES.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.nik.toLowerCase().includes(searchQuery.toLowerCase()) || e.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === "ALL" || e.department.includes(deptFilter);
      return matchSearch && matchDept;
    });
  }, [searchQuery, deptFilter]);

  const filteredCandidates = useMemo(() => {
    return INITIAL_CANDIDATES.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === "ALL" || c.department.includes(deptFilter);
      return matchSearch && matchDept;
    });
  }, [searchQuery, deptFilter]);

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
        tabs={[
          { id: "employees", label: "Database Pegawai Aktif", count: INITIAL_EMPLOYEES.length },
          { id: "pipeline", label: "Pipeline Seleksi Pelamar", count: INITIAL_CANDIDATES.length },
          { id: "openings", label: "Lowongan Kerja Buka", count: INITIAL_OPENINGS.length }
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
              {activeTab === "openings" && `${INITIAL_OPENINGS.length} Formasi Buka`}
            </div>
          </div>
        }
      >
        {/* TAB 1: EMPLOYEES TABLE */}
        {activeTab === "employees" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-3.5 py-2.5 w-[110px]">NIK</th>
                  <th className="px-3.5 py-2.5">Nama Pegawai</th>
                  <th className="px-3.5 py-2.5">Jabatan & Departemen</th>
                  <th className="px-3.5 py-2.5 text-center w-[130px]">Tipe Kontrak</th>
                  <th className="px-3.5 py-2.5 w-[110px]">Tgl Masuk</th>
                  <th className="px-3.5 py-2.5 w-[130px]">No. Telepon</th>
                  <th className="px-3.5 py-2.5">Email</th>
                  <th className="px-3.5 py-2.5 text-right w-[130px]">Gaji Pokok</th>
                  <th className="px-3.5 py-2.5 text-center w-[90px]">Status</th>
                  <th className="px-3.5 py-2.5 text-center w-[70px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3.5 py-8 text-center text-xs text-slate-400">
                      Tidak ada pegawai yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Code>{emp.nik}</DnaCell.Code>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-semibold text-slate-900">{emp.name}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.NaturalPair
                          primary={emp.role}
                          secondary={emp.department}
                        />
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <DnaBadge variant={emp.contractType.includes("Tetap") ? "success" : "purple"}>
                          {emp.contractType}
                        </DnaBadge>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-mono text-[11.5px] text-slate-600">{emp.joinDate}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-mono text-[11.5px] text-slate-700">{emp.phone}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-600">{emp.email}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <DnaCell.Numeric value={emp.basicSalary} prefix="Rp " />
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <DnaBadge variant={emp.status === "AKTIF" ? "success" : "neutral"}>
                          {emp.status}
                        </DnaBadge>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEmployee(emp)}
                          title="Lihat Profil Pegawai"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                        </DnaButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CANDIDATE PIPELINE */}
        {activeTab === "pipeline" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-3.5 py-2.5">Nama Pelamar</th>
                  <th className="px-3.5 py-2.5">Posisi & Departemen</th>
                  <th className="px-3.5 py-2.5 w-[130px]">No. Telepon</th>
                  <th className="px-3.5 py-2.5">Email</th>
                  <th className="px-3.5 py-2.5">Pengalaman Kerja</th>
                  <th className="px-3.5 py-2.5">Pendidikan</th>
                  <th className="px-3.5 py-2.5 w-[110px]">Tgl Melamar</th>
                  <th className="px-3.5 py-2.5 text-right w-[100px]">Match</th>
                  <th className="px-3.5 py-2.5 text-center w-[130px]">Tahapan Seleksi</th>
                  <th className="px-3.5 py-2.5 text-center w-[70px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3.5 py-8 text-center text-xs text-slate-400">
                      Tidak ada pelamar yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((cnd) => (
                    <tr key={cnd.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-semibold text-slate-900">{cnd.name}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.NaturalPair
                          primary={cnd.position}
                          secondary={cnd.department}
                        />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-mono text-[11.5px] text-slate-700">{cnd.phone}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-600">{cnd.email}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-800">{cnd.experience}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-600">{cnd.education}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-mono text-[11.5px] text-slate-600">{cnd.appliedDate}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <DnaCell.Numeric
                          value={cnd.matchScore}
                          suffix="%"
                          className="font-bold text-emerald-700"
                        />
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
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
                      <td className="px-3.5 py-2.5 text-center">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.success("Maju ke tahap seleksi berikutnya: " + cnd.name)}
                          title="Update Tahap Seleksi"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-purple-600"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
                        </DnaButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: JOB OPENINGS */}
        {activeTab === "openings" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-3.5 py-2.5">Posisi Lowongan</th>
                  <th className="px-3.5 py-2.5">Divisi / Departemen</th>
                  <th className="px-3.5 py-2.5 text-center w-[130px]">Tipe Kontrak</th>
                  <th className="px-3.5 py-2.5 text-right w-[140px]">Kebutuhan Formasi</th>
                  <th className="px-3.5 py-2.5 text-right w-[140px]">Pelamar Masuk</th>
                  <th className="px-3.5 py-2.5 w-[130px]">Batas Deadline</th>
                  <th className="px-3.5 py-2.5 text-center w-[100px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INITIAL_OPENINGS.map((job) => (
                  <tr key={job.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-semibold text-slate-900">{job.title}</DnaCell.Text>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Text className="text-slate-700">{job.department}</DnaCell.Text>
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <DnaBadge variant={job.type === "Full-Time" ? "info" : "secondary"}>
                        {job.type}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric value={job.openings} suffix=" Orang" />
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric value={job.applicantsCount} suffix=" Pelamar" className="font-semibold text-purple-700" />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-mono text-[11.5px] text-slate-600">{job.deadline}</DnaCell.Text>
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <DnaBadge variant="success">{job.status}</DnaBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <DnaButton variant="primary" size="md" type="submit">
              Simpan Master Pegawai
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
                    <span className="font-mono text-slate-800">{selectedEmployee.joinDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gaji Pokok Tercatat</span>
                    <span className="font-bold text-slate-900 font-mono">{formatRupiah(selectedEmployee.basicSalary)}</span>
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
                      <span className="font-mono text-[11px]">{selectedEmployee.email}</span>
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
