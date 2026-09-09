"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
  Printer
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
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface EmployeeCandidate {
  id: string;
  name: string;
  position: string;
  department: "PRODUKSI" | "QC_QA" | "RND" | "FINANCE" | "BUSDEV" | "WAREHOUSE";
  appliedDate: string;
  stage: "SCREENING" | "INTERVIEW_HR" | "INTERVIEW_USER" | "OFFERING" | "HIRED";
  experience: string;
  phone: string;
}

const FALLBACK_CANDIDATES: EmployeeCandidate[] = [
  { id: "1", name: "Rian Saputra, S.Farm", position: "Formulator R&D Skincare", department: "RND", appliedDate: "2026-09-05", stage: "INTERVIEW_USER", experience: "3 thn Lab Kosmetik", phone: "0812-4455-6677" },
  { id: "2", name: "Siti Rahmawati, S.Si", position: "Analis Kimia QC Mikrobiologi", department: "QC_QA", appliedDate: "2026-09-03", stage: "OFFERING", experience: "2 thn Lab Pengujian", phone: "0813-8899-0011" },
  { id: "3", name: "Bayu Pratama, S.T", position: "Supervisor Mixing & Bulk", department: "PRODUKSI", appliedDate: "2026-09-01", stage: "HIRED", experience: "5 thn Manufaktur Farmasi", phone: "0811-2233-4455" },
  { id: "4", name: "Dewi Lestari, S.E", position: "Senior Account Executive BusDev", department: "BUSDEV", appliedDate: "2026-08-28", stage: "INTERVIEW_HR", experience: "4 thn B2B Maklon", phone: "0856-7788-9900" },
];

export default function HrRecruitmentPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pegawai & Rekrutmen (Talent Acquisition & Employees)"
        description="Manajemen pipeline rekrutmen kandidat, lowongan kerja pabrik kosmetik, dan database profil pegawai aktif."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Total Pegawai Aktif: 124 Karyawan</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-1.5" />
              Buka Lowongan / Input Pelamar
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Karyawan Aktif"
          value="124 Orang"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          delta={{ value: "+3 Karyawan Baru", isPositive: true }}
          subtext="Headcount Manufaktur & Office"
          variant="info"
        />
        <DnaStatCard
          label="Pelamar Aktif (Pipeline)"
          value="16 Kandidat"
          icon={<Briefcase className="w-5 h-5 text-purple-600" />}
          delta={{ value: "4 Lowongan Buka", isPositive: true }}
          subtext="Screening s/d Offering"
          variant="purple"
        />
        <DnaStatCard
          label="Jadwal Interview Minggu Ini"
          value="6 Sesi"
          icon={<Calendar className="w-5 h-5 text-amber-600" />}
          delta={{ value: "HR & User Panel", isPositive: true }}
          subtext="Lab R&D dan Line Produksi"
          variant="warning"
        />
        <DnaStatCard
          label="Retensi Karyawan (12 Bln)"
          value="96.8%"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Turnover Rendah", isPositive: true }}
          subtext="Benchmarking Industri Baik"
          variant="success"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Pipeline Pelamar & Rekrutmen Terkini"
        badge={<DnaBadge variant="default">{FALLBACK_CANDIDATES.length} Pelamar</DnaBadge>}
        customToolbar={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kandidat / posisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Nama Kandidat</th>
                <th className="px-3.5 py-3">Posisi Dilamar</th>
                <th className="px-3.5 py-3">Departemen</th>
                <th className="px-3.5 py-3">Pengalaman</th>
                <th className="px-3.5 py-3">Kontak WA</th>
                <th className="px-3.5 py-3">Tgl Daftar</th>
                <th className="px-3.5 py-3 text-center">Tahapan Seleksi</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FALLBACK_CANDIDATES.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{c.name}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-blue-700">{c.position}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                      {c.department}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600">{c.experience}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600">{c.phone}</td>
                  <td className="px-3.5 py-2.5 text-slate-500">{c.appliedDate}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        c.stage === "HIRED"
                          ? "success"
                          : c.stage === "OFFERING"
                          ? "purple"
                          : c.stage.includes("INTERVIEW")
                          ? "info"
                          : "default"
                      }
                    >
                      {c.stage.replace(/_/g, " ")}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaButton
                      variant="primary"
                      size="sm"
                      onClick={() => toast.success(`Detail rekrutmen ${c.name} dibuka`)}
                    >
                      Review
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Input Data Pelamar / Posisi Rekrutmen Baru"
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap Kandidat</label>
            <input type="text" placeholder="e.g. Amanda Putri, S.Farm" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Posisi Lowongan</label>
              <input type="text" placeholder="e.g. QC Inspector" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Departemen</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white">
                <option value="PRODUKSI">Produksi Manufaktur</option>
                <option value="QC_QA">Quality Control & QA</option>
                <option value="RND">R&D Lab & Formulasi</option>
                <option value="FINANCE">Finance & Accounting</option>
                <option value="BUSDEV">Business Development</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nomor WhatsApp</label>
            <input type="text" placeholder="0812-xxxx-xxxx" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => {
                toast.success("Data kandidat berhasil ditambahkan!");
                setIsCreateModalOpen(false);
              }}
            >
              Simpan Kandidat
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
