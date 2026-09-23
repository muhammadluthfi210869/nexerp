"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileCheck,
  FlaskConical,
  UserCircle,
  Calendar,
  Building2,
  Tag,
  ShieldCheck,
  Send,
  Clock,
  Moon,
  Bookmark,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DnaPageHeader,
  DnaCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaBadge,
  DnaConfirmDialog,
  useDnaToast,
} from "@/components/dna";

type FormType = "hki" | "bpom" | "halal";

const FORM_CONFIGS: Record<
  FormType,
  {
    badgeVariant: "purple" | "info" | "success";
    title: string;
    subtitle: string;
    submitLabel: string;
    fields: { label: string; name: string; icon: any; placeholder: string; required?: boolean; type?: string }[];
  }
> = {
  hki: {
    badgeVariant: "purple",
    title: "PENDAFTARAN HKI & MEREK DAGANG",
    subtitle: "Inisialisasi pendaftaran nama brand, logo grafis, dan perlindungan kelas kosmetik ke DJKI Kemenkumham",
    submitLabel: "Daftarkan Berkas HKI",
    fields: [
      { label: "Nomor Permohonan / ID HKI *", name: "hkiId", icon: Tag, placeholder: "e.g. IPT20240001", required: true },
      { label: "Nama Brand / Merek *", name: "brandName", icon: ShieldCheck, placeholder: "e.g. Nex White Aesthetic", required: true },
      { label: "Kelas Merek (Klasifikasi Nice) *", name: "type", icon: FileCheck, placeholder: "e.g. Kelas 3 (Kosmetika)", required: true },
      { label: "Nama Klien / Pemilik Hak *", name: "clientName", icon: Building2, placeholder: "e.g. PT Nex Industri Kosmetika", required: true },
      { label: "Tanggal Pengajuan Permohonan *", name: "applicationDate", icon: Calendar, type: "date", placeholder: "", required: true },
      { label: "Estimasi Selesai / Kadaluarsa", name: "expiryDate", icon: Clock, type: "date", placeholder: "" },
    ],
  },
  bpom: {
    badgeVariant: "info",
    title: "PENGAJUAN NOTIFIKASI BPOM KOSMETIK",
    subtitle: "Pendaftaran formula, klaim kosmetik, dan pemenuhan berkas dossier produk ke Badan POM RI",
    submitLabel: "Daftarkan Berkas BPOM",
    fields: [
      { label: "Nomor Notifikasi / Kode BPOM *", name: "bpomId", icon: Tag, placeholder: "e.g. NA18240001234", required: true },
      { label: "Nama Produk Lengkap *", name: "productName", icon: FlaskConical, placeholder: "e.g. Anti-Aging Barrier Serum 30ml", required: true },
      { label: "Kategori Produk Kosmetik *", name: "category", icon: FileCheck, placeholder: "e.g. Skin Care / Wajah", required: true },
      { label: "Nama Klien Maklon *", name: "clientName", icon: Building2, placeholder: "e.g. PT Artha Prima Estetika", required: true },
      { label: "Tanggal Pengajuan Notifikasi *", name: "applicationDate", icon: Calendar, type: "date", placeholder: "", required: true },
      { label: "Batas Akhir Berlaku (3 Tahun)", name: "expiryDate", icon: Clock, type: "date", placeholder: "" },
    ],
  },
  halal: {
    badgeVariant: "success",
    title: "SERTIFIKASI HALAL PRODUK (BPJPH / MUI)",
    subtitle: "Pencatatan ketertelusuran bahan baku halal, sistem jaminan produk halal (SJPH), dan sertifikat resmi",
    submitLabel: "Daftarkan Berkas Halal",
    fields: [
      { label: "Nomor Sertifikat Halal *", name: "halalId", icon: Tag, placeholder: "e.g. ID0011000000012345", required: true },
      { label: "Nama Produk / Varian *", name: "productName", icon: Moon, placeholder: "e.g. Brightening Facial Wash", required: true },
      { label: "Pabrik / Manufaktur *", name: "manufacturer", icon: Building2, placeholder: "e.g. Pabrik Dreamlab Sidoarjo", required: true },
      { label: "Kategori Produk *", name: "category", icon: FileCheck, placeholder: "e.g. Kosmetika & Perawatan Diri", required: true },
      { label: "Tanggal Terbit Sertifikat *", name: "applicationDate", icon: Calendar, type: "date", placeholder: "", required: true },
      { label: "Batas Akhir Berlaku (4 Tahun)", name: "expiryDate", icon: Clock, type: "date", placeholder: "" },
    ],
  },
};

export default function ComplianceInputPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { success, error: toastError } = useDnaToast();
  const [activeTab, setActiveTab] = useState<FormType>("hki");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{ type: FormType; data: any } | null>(null);

  const { data: staffs } = useQuery({
    queryKey: ["legal-staffs"],
    queryFn: async () => {
      const resp = await api.get("/legality/staffs");
      return resp.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ type, data }: { type: FormType; data: any }) => {
      return api.post(`/legality/${type}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      queryClient.invalidateQueries({ queryKey: ["halal-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      success(`Berkas ${activeTab.toUpperCase()} berhasil didaftarkan ke audit log.`);
      setTimeout(() => {
        router.push("/legality/records");
      }, 1000);
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.message || "Gagal mendaftarkan berkas legalitas.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const rawData = Object.fromEntries(formData.entries());

    const payload = {
      ...rawData,
      applicationDate: rawData.applicationDate ? new Date(rawData.applicationDate as string).toISOString() : new Date().toISOString(),
      expiryDate: rawData.expiryDate ? new Date(rawData.expiryDate as string).toISOString() : null,
    };

    setPendingSubmit({ type: activeTab, data: payload });
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    if (!pendingSubmit) return;
    mutation.mutate(pendingSubmit);
    setShowConfirm(false);
  };

  const staffOptions = (staffs || []).map((s: any) => ({
    label: `${s.name} (${s.department || "Legal"})`,
    value: s.id,
  }));

  const config = FORM_CONFIGS[activeTab];

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. PAGE HEADER DENGAN TABS TERPADU (Golden Rule 2) ── */}
      <DnaPageHeader
        backLink={{ href: "/legality/records", label: "Kembali ke Arsip Legalitas" }}
        title="PORTAL PENDAFTARAN REGULASI & SERTIFIKASI"
        badge={<DnaBadge variant="info">ENTRY PORTAL</DnaBadge>}
        subtitle="Registrasi berkas HKI Merek, izin edar Notifikasi BPOM, dan sertifikasi Halal ke siklus audit resmi"
        tabs={[
          {
            key: "hki",
            label: "Pendaftaran HKI Merek",
            icon: <Bookmark className="w-3.5 h-3.5" />,
          },
          {
            key: "bpom",
            label: "Notifikasi BPOM Kosmetik",
            icon: <FlaskConical className="w-3.5 h-3.5" />,
          },
          {
            key: "halal",
            label: "Sertifikasi Halal MUI",
            icon: <Moon className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as FormType)}
      />

      {/* ── 02. ENTERPRISE FORM CARD ── */}
      <div className="max-w-4xl mx-auto">
        <DnaCard>
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DnaBadge variant={config.badgeVariant}>{activeTab.toUpperCase()}</DnaBadge>
                <h3 className="text-base font-bold text-slate-900">{config.title}</h3>
              </div>
              <p className="text-xs text-slate-500">{config.subtitle}</p>
            </div>
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileText className="w-3.5 h-3.5" />}
              onClick={() => router.push("/legality/records")}
            >
              Lihat Arsip Terdaftar
            </DnaButton>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {config.fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {f.label}
                  </label>
                  <DnaInput
                    name={f.name}
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    required={f.required}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIC Staf Pengurus *
                </label>
                <DnaSelect
                  name="picId"
                  placeholder="Pilih Staf Legal Penanggung Jawab"
                  options={
                    staffOptions.length > 0
                      ? staffOptions
                      : [
                          { label: "Ratna (Regulatory Affairs)", value: "staff-01" },
                          { label: "Budi (HKI Specialist)", value: "staff-02" },
                          { label: "Dewi (Halal Assurance Officer)", value: "staff-03" },
                        ]
                  }
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Dokumen akan otomatis diverifikasi ke Master Timeline Kepatuhan Audit</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">OSS RBA & BPOM Integrated</span>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <DnaButton
                variant="secondary"
                type="button"
                onClick={() => router.push("/legality/records")}
              >
                Batal
              </DnaButton>
              <DnaButton
                type="submit"
                variant="primary"
                disabled={mutation.isPending}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                {mutation.isPending ? "Mendaftarkan..." : config.submitLabel}
              </DnaButton>
            </div>
          </form>
        </DnaCard>
      </div>

      {/* Confirmation Dialog */}
      <DnaConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        title="Konfirmasi Pendaftaran Regulasi"
        description={`Apakah Anda yakin ingin mendaftarkan berkas ${activeTab.toUpperCase()} ini ke audit log kepatuhan?`}
        confirmText="Ya, Daftarkan Sekarang"
        variant="primary"
      />
    </div>
  );
}
