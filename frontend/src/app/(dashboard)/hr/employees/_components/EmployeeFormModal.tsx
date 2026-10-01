"use client";

import React, { useState, useEffect } from "react";
import {
  DnaButton,
  DnaInput,
  DnaSelect,
} from "@/components/dna";
import { X, UserCog, DollarSign, Briefcase } from "lucide-react";
import { EmployeeItem, EmployeeFormData } from "../_types/employee.types";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => void;
  isSubmitting: boolean;
  editingEmployee: EmployeeItem | null;
}

const DIVISIONS = [
  "PRODUCTION",
  "QC",
  "WAREHOUSE",
  "BD",
  "RND",
  "SCM",
  "FINANCE",
  "MANAGEMENT",
];

export function EmployeeFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingEmployee,
}: EmployeeFormModalProps) {
  const [activeTab, setActiveTab] = useState<"BIO" | "JABATAN" | "UPAH">("BIO");
  const [form, setForm] = useState<EmployeeFormData>({
    name: "",
    nik: "",
    birthDate: "",
    gender: "Laki-laki",
    phone: "",
    address: "",
    bpjsKesehatan: "",
    bpjsKetenagakerjaan: "",
    joinedAt: new Date().toISOString().split("T")[0],
    contractEnd: "",
    contractType: "PKWT",
    division: "PRODUCTION",
    position: "Staff Operasional",
    baseSalary: "4500000",
    positionAllowance: "500000",
    transportFlat: "300000",
    transportTentativeDaily: "25000",
  });

  useEffect(() => {
    if (editingEmployee) {
      setForm({
        name: editingEmployee.name || "",
        nik: editingEmployee.nik || "",
        birthDate: editingEmployee.birthDate ? editingEmployee.birthDate.split("T")[0] : "",
        gender: editingEmployee.gender || "Laki-laki",
        phone: editingEmployee.phone || "",
        address: editingEmployee.address || "",
        bpjsKesehatan: editingEmployee.bpjsKesehatan || "",
        bpjsKetenagakerjaan: editingEmployee.bpjsKetenagakerjaan || "",
        joinedAt: editingEmployee.joinedAt ? editingEmployee.joinedAt.split("T")[0] : new Date().toISOString().split("T")[0],
        contractEnd: editingEmployee.contractEnd ? editingEmployee.contractEnd.split("T")[0] : "",
        contractType: (editingEmployee.contractType as any) || "PKWT",
        division: editingEmployee.division || "PRODUCTION",
        position: editingEmployee.position || "Staff",
        baseSalary: editingEmployee.baseSalary || "4500000",
        positionAllowance: editingEmployee.positionAllowance || "500000",
        transportFlat: editingEmployee.transportFlat || "300000",
        transportTentativeDaily: editingEmployee.transportTentativeDaily || "25000",
      });
    } else {
      setForm({
        name: "",
        nik: "",
        birthDate: "",
        gender: "Laki-laki",
        phone: "",
        address: "",
        bpjsKesehatan: "",
        bpjsKetenagakerjaan: "",
        joinedAt: new Date().toISOString().split("T")[0],
        contractEnd: "",
        contractType: "PKWT",
        division: "PRODUCTION",
        position: "Staff Operasional",
        baseSalary: "4500000",
        positionAllowance: "500000",
        transportFlat: "300000",
        transportTentativeDaily: "25000",
      });
    }
  }, [editingEmployee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {editingEmployee ? `Edit Data Pegawai: ${editingEmployee.name}` : "Pendaftaran Pegawai Baru"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Kelola identitas, kontrak PKWT, dan rincian upah tetap & transport
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
          <button
            type="button"
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "BIO"
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            onClick={() => setActiveTab("BIO")}
          >
            1. Biodata & Pribadi
          </button>
          <button
            type="button"
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "JABATAN"
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            onClick={() => setActiveTab("JABATAN")}
          >
            2. Jabatan & Kontrak PKWT
          </button>
          <button
            type="button"
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "UPAH"
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            onClick={() => setActiveTab("UPAH")}
          >
            3. Upah & Tunjangan
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === "BIO" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nama Lengkap *</label>
                  <DnaInput
                    required
                    placeholder="Nama lengkap pegawai"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nomor Induk Kependudukan (NIK)</label>
                  <DnaInput
                    placeholder="16 digit NIK KTP"
                    value={form.nik}
                    onChange={(e) => setForm({ ...form, nik: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tanggal Lahir</label>
                  <DnaInput
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Jenis Kelamin</label>
                  <DnaSelect
                    value={form.gender}
                    onChange={(val) => setForm({ ...form, gender: val })}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </DnaSelect>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">No. WhatsApp / HP</label>
                  <DnaInput
                    placeholder="08..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">No. BPJS Kesehatan</label>
                  <DnaInput
                    placeholder="Nomor kartu BPJS Kesehatan"
                    value={form.bpjsKesehatan}
                    onChange={(e) => setForm({ ...form, bpjsKesehatan: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">No. BPJS Ketenagakerjaan</label>
                  <DnaInput
                    placeholder="Nomor kartu BPJS TK / KPJ"
                    value={form.bpjsKetenagakerjaan}
                    onChange={(e) => setForm({ ...form, bpjsKetenagakerjaan: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Alamat Domisili</label>
                <DnaInput
                  placeholder="Alamat lengkap tempat tinggal"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === "JABATAN" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Divisi Operasional *</label>
                  <DnaSelect
                    value={form.division}
                    onChange={(val) => setForm({ ...form, division: val })}
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </DnaSelect>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Jabatan / Role *</label>
                  <DnaInput
                    required
                    placeholder="Misal: Operator Mixing / QA Specialist"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tipe Kontrak *</label>
                  <DnaSelect
                    value={form.contractType}
                    onChange={(val) => setForm({ ...form, contractType: val as any })}
                  >
                    <option value="PKWT">PKWT (Kontrak Tertentu)</option>
                    <option value="PKWTT">PKWTT / Tetap</option>
                    <option value="INTERN">Magang / Intern</option>
                  </DnaSelect>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tanggal Masuk (Join) *</label>
                  <DnaInput
                    type="date"
                    required
                    value={form.joinedAt}
                    onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tanggal Berakhir Kontrak</label>
                  <DnaInput
                    type="date"
                    value={form.contractEnd}
                    onChange={(e) => setForm({ ...form, contractEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "UPAH" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  I. Upah Tetap (Fixed Wages)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Gaji Pokok (Rp) *</label>
                    <DnaInput
                      type="number"
                      required
                      value={form.baseSalary}
                      onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tunjangan Jabatan (Rp)</label>
                    <DnaInput
                      type="number"
                      value={form.positionAllowance}
                      onChange={(e) => setForm({ ...form, positionAllowance: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  II. Tunjangan Transportasi (2 Kolom: Flat & Tentatif)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Transport Flat Bulanan (Rp)</label>
                    <DnaInput
                      type="number"
                      value={form.transportFlat}
                      onChange={(e) => setForm({ ...form, transportFlat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Transport Tentatif Harian (Rp/hari hadir)</label>
                    <DnaInput
                      type="number"
                      value={form.transportTentativeDaily}
                      onChange={(e) => setForm({ ...form, transportTentativeDaily: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              * Perubahan upah akan otomatis diperhitungkan saat kalkulasi payroll bulanan
            </span>
            <div className="flex items-center gap-2">
              <DnaButton type="button" variant="secondary" onClick={onClose}>
                Batal
              </DnaButton>
              <DnaButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Data Karyawan"}
              </DnaButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
