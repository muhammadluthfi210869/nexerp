"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  DnaCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTabNav,
  DnaModal,
} from "@/components/dna";

// SPEC: SCR-LEG-INPUT-001 — Compliance Entry Portal (HKI / BPOM / Halal) tabs with date inputs

type FormType = 'hki' | 'bpom' | 'halal';

const FORM_CONFIGS: Record<FormType, { dotColor: string; title: string; submitLabel: string; fields: any[] }> = {
  hki: {
    dotColor: "bg-blue-600",
    title: "HKI BRANDING REGISTRY",
    submitLabel: "FILE HKI RECORD",
    fields: [
      { label: "HKI ID / Application Number", name: "hkiId", icon: <Tag className="w-4 h-4 text-slate-400" />, placeholder: "e.g. IPT20240001", required: true },
      { label: "Brand Name", name: "brandName", icon: <ShieldCheck className="w-4 h-4 text-slate-400" />, placeholder: "e.g. Nex White", required: true },
      { label: "Type / Class", name: "type", icon: <FileCheck className="w-4 h-4 text-slate-400" />, placeholder: "e.g. Cosmetic Class 3", required: true },
      { label: "Client Name", name: "clientName", icon: <Building2 className="w-4 h-4 text-slate-400" />, placeholder: "e.g. PT Nex Industri", required: true },
      { label: "Application Date", name: "applicationDate", icon: <Calendar className="w-4 h-4 text-slate-400" />, type: "date", required: true },
      { label: "Expiry Date (Optional)", name: "expiryDate", icon: <Clock className="w-4 h-4 text-slate-400" />, type: "date" },
    ],
  },
  bpom: {
    dotColor: "bg-emerald-600",
    title: "BPOM PRODUCT REGISTRY",
    submitLabel: "FILE BPOM RECORD",
    fields: [
      { label: "BPOM ID / NI Number", name: "bpomId", icon: <Tag className="w-4 h-4 text-slate-400" />, placeholder: "e.g. NA18240001", required: true },
      { label: "Product Name", name: "productName", icon: <FlaskConical className="w-4 h-4 text-slate-400" />, placeholder: "e.g. Anti-Aging Serum", required: true },
      { label: "Category", name: "category", icon: <FileCheck className="w-4 h-4 text-slate-400" />, placeholder: "e.g. Skin Care", required: true },
      { label: "Client Name", name: "clientName", icon: <Building2 className="w-4 h-4 text-slate-400" />, placeholder: "e.g. PT Artha Prima", required: true },
      { label: "Application Date", name: "applicationDate", icon: <Calendar className="w-4 h-4 text-slate-400" />, type: "date", required: true },
      { label: "Expiry Date (Optional)", name: "expiryDate", icon: <Clock className="w-4 h-4 text-slate-400" />, type: "date" },
    ],
  },
  halal: {
    dotColor: "bg-emerald-700",
    title: "HALAL CERTIFICATION REGISTRY",
    submitLabel: "FILE HALAL RECORD",
    fields: [
      { label: "Halal ID / Certificate Number", name: "halalId", icon: <Tag className="w-4 h-4 text-slate-400" />, placeholder: "e.g. ID001100000001", required: true },
      { label: "Product Name", name: "productName", icon: <Moon className="w-4 h-4 text-slate-400" />, placeholder: "e.g. Serum Whitening", required: true },
      { label: "Manufacturer", name: "manufacturer", icon: <Building2 className="w-4 h-4 text-slate-400" />, placeholder: "e.g. PT Nex Industri", required: true },
      { label: "Category", name: "category", icon: <FileCheck className="w-4 h-4 text-slate-400" />, placeholder: "e.g. Kosmetik", required: true },
      { label: "Application Date", name: "applicationDate", icon: <Calendar className="w-4 h-4 text-slate-400" />, type: "date", required: true },
      { label: "Expiry Date (Optional)", name: "expiryDate", icon: <Clock className="w-4 h-4 text-slate-400" />, type: "date" },
    ],
  },
};

export default function ComplianceInput() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FormType>("hki");

  const { data: staffs } = useQuery({
    queryKey: ["legal-staffs"],
    queryFn: async () => {
      const resp = await api.get("/legality/staffs");
      return resp.data;
    }
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{ type: FormType; data: any } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ type, data }: { type: FormType; data: any }) => {
      return api.post(`/legality/${type}`, data);
    },
    onSuccess: () => {
      toast.success("Record filed successfully in Auditory Log");
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      router.push("/legality/records");
    },
    onError: (err) => {
      toast.error("Failed to file record. Check connection.");
      console.error(err);
    }
  });

  const handleSubmit = async (e: React.FormEvent, type: FormType) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const rawData = Object.fromEntries(formData.entries());

      const payload = {
        ...rawData,
        applicationDate: new Date(rawData.applicationDate as string).toISOString(),
        expiryDate: rawData.expiryDate ? new Date(rawData.expiryDate as string).toISOString() : null,
      };

      setPendingSubmit({ type, data: payload });
      setShowConfirm(true);
    } catch (error) {
      console.error("GAGAL SUBMIT:", error);
      toast.error("Submission failed. Please check your data and connection.");
    }
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    if (!pendingSubmit) return;
    const { type, data: payload } = pendingSubmit;

    try {
      console.log("PAYLOAD DIKIRIM:", payload);
      toast.loading(`Filing ${type.toUpperCase()} record...`, { id: "submit-toast" });
      await mutation.mutateAsync({ type, data: payload });
      toast.success(`${type.toUpperCase()} record registered successfully!`, { id: "submit-toast" });
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      setTimeout(() => {
        router.push("/legality/records");
      }, 1500);
    } catch (error) {
      console.error("GAGAL SUBMIT:", error);
      toast.error("Submission failed. Please check your data and connection.", { id: "submit-toast" });
    }
  };

  const staffOptions = (staffs || []).map((s: any) => ({ label: `${s.name} - ${s.department}`, value: s.id }));
  const config = FORM_CONFIGS[activeTab];

  return (
    <DashboardShell
      title="COMPLIANCE"
      titleAccent="ENTRY PORTAL"
      subtitle="Initialize new HKI Branding or BPOM Product registration into the audit cycle."
    >
      <DnaTabNav
        tabs={[
          { key: "hki", label: "HKI BRANDING" },
          { key: "bpom", label: "BPOM PRODUCT" },
          { key: "halal", label: "HALAL CERT" },
        ]}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as FormType)}
        className="mb-6"
      />

      <DnaCard>
        <div className="flex items-center gap-2 mb-4">
          <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">{config.title}</h3>
        </div>
        <form onSubmit={(e) => handleSubmit(e, activeTab)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.fields.map((f) => (
              <DnaInput
                key={f.name}
                name={f.name}
                label={f.label}
                type={f.type || "text"}
                placeholder={f.placeholder}
                required={f.required}
                icon={f.icon}
              />
            ))}
            <DnaSelect
              label={<><UserCircle className="w-4 h-4 inline" /> Assigned PIC</>}
              name="picId"
              placeholder="Select PIC Officer"
              options={staffOptions}
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <DnaButton
              type="submit"
              disabled={mutation.isPending}
              variant="primary"
              icon={<Send />}
            >
              {mutation.isPending ? "FILING..." : config.submitLabel}
            </DnaButton>
          </div>
        </form>
      </DnaCard>

      <DnaModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Konfirmasi"
        subtitle="Apakah Anda yakin ingin menyimpan data ini?"
        size="sm"
        footer={
          <>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </>
        }
      />
    </DashboardShell>
  );
}
