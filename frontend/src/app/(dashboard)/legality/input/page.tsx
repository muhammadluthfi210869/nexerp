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
import { DnaButton } from "@/components/dna";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  OperationalButton,
  OperationalField,
  OperationalInput,
  OperationalPageShell,
  OperationalPanel,
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
} from "@/components/operational";

type SubmissionType = "hki" | "bpom" | "halal";

export default function ComplianceInput() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: staffs } = useQuery({
    queryKey: ["legal-staffs"],
    queryFn: async () => {
      const resp = await api.get("/legality/staffs");
      return resp.data;
    },
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{ type: SubmissionType; data: any } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ type, data }: { type: SubmissionType; data: any }) => {
      return api.post(`/legality/${type}`, data);
    },
    onSuccess: () => {
      toast.success("Record berhasil diajukan.");
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      router.push("/legality/records");
    },
    onError: (err) => {
      toast.error("Gagal mengajukan record. Periksa koneksi Anda.");
      console.error(err);
    },
  });

  const handleSubmit = async (e: React.FormEvent, type: SubmissionType) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
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
      toast.error("Pengajuan gagal. Periksa data dan koneksi Anda.");
    }
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    if (!pendingSubmit) return;
    const { type, data: payload } = pendingSubmit;

    try {
      const labelMap: Record<SubmissionType, string> = {
        hki: "HKI",
        bpom: "BPOM",
        halal: "Halal",
      };
      toast.loading(`Mengajukan record ${labelMap[type]}...`, { id: "submit-toast" });
      await mutation.mutateAsync({ type, data: payload });
      toast.success(`Record ${labelMap[type]} berhasil didaftarkan!`, { id: "submit-toast" });
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      setTimeout(() => {
        router.push("/legality/records");
      }, 1500);
    } catch (error) {
      console.error("GAGAL SUBMIT:", error);
      toast.error("Pengajuan gagal. Periksa data dan koneksi Anda.", { id: "submit-toast" });
    }
  };

  return (
    <OperationalPageShell
      title="Portal Compliance"
      subtitle="Daftarkan HKI Branding atau registrasi BPOM ke siklus audit"
    >
      <OperationalTabs defaultValue="hki">
        <OperationalTabsList>
          <OperationalTabsTrigger value="hki">HKI Branding</OperationalTabsTrigger>
          <OperationalTabsTrigger value="bpom">BPOM Product</OperationalTabsTrigger>
          <OperationalTabsTrigger value="halal">Halal Cert</OperationalTabsTrigger>
        </OperationalTabsList>

        <OperationalTabsContent value="hki" className="mt-3">
          <OperationalPanel>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900">HKI Branding Registry</h3>
            </div>
            <form onSubmit={(e) => handleSubmit(e, "hki")} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OperationalField label="HKI ID / Application Number">
                <OperationalInput name="hkiId" required placeholder="Contoh: IPT20240001" />
              </OperationalField>
              <OperationalField label="Brand Name">
                <OperationalInput name="brandName" required placeholder="Contoh: Nex White" />
              </OperationalField>
              <OperationalField label="Type / Class">
                <OperationalInput name="type" required placeholder="Contoh: Cosmetic Class 3" />
              </OperationalField>
              <OperationalField label="Client Name">
                <OperationalInput name="clientName" required placeholder="Contoh: PT Nex Industri" />
              </OperationalField>
              <OperationalField label="Application Date">
                <OperationalInput name="applicationDate" type="date" required />
              </OperationalField>
              <OperationalField label="Expiry Date (Opsional)">
                <OperationalInput name="expiryDate" type="date" />
              </OperationalField>
              <OperationalField label="Assigned PIC">
                <select
                  name="picId"
                  required
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Pilih PIC Officer</option>
                  {staffs?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} - {s.department}</option>
                  ))}
                </select>
              </OperationalField>
              <div className="md:col-span-2 mt-2 flex justify-end border-t border-slate-100 pt-3">
                <OperationalButton type="submit" variant="primary" disabled={mutation.isPending}>
                  <Send className="h-4 w-4" />
                  {mutation.isPending ? "Mengajukan..." : "Ajukan Record HKI"}
                </OperationalButton>
              </div>
            </form>
          </OperationalPanel>
        </OperationalTabsContent>

        <OperationalTabsContent value="bpom" className="mt-3">
          <OperationalPanel>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-emerald-50 text-emerald-600">
                <FileCheck className="h-4 w-4" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900">BPOM Product Registry</h3>
            </div>
            <form onSubmit={(e) => handleSubmit(e, "bpom")} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OperationalField label="BPOM ID / NI Number">
                <OperationalInput name="bpomId" required placeholder="Contoh: NA18240001" />
              </OperationalField>
              <OperationalField label="Product Name">
                <OperationalInput name="productName" required placeholder="Contoh: Anti-Aging Serum" />
              </OperationalField>
              <OperationalField label="Category">
                <OperationalInput name="category" required placeholder="Contoh: Skin Care" />
              </OperationalField>
              <OperationalField label="Client Name">
                <OperationalInput name="clientName" required placeholder="Contoh: PT Artha Prima" />
              </OperationalField>
              <OperationalField label="Application Date">
                <OperationalInput name="applicationDate" type="date" required />
              </OperationalField>
              <OperationalField label="Expiry Date (Opsional)">
                <OperationalInput name="expiryDate" type="date" />
              </OperationalField>
              <OperationalField label="Assigned PIC">
                <select
                  name="picId"
                  required
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Pilih PIC Officer</option>
                  {staffs?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} - {s.department}</option>
                  ))}
                </select>
              </OperationalField>
              <div className="md:col-span-2 mt-2 flex justify-end border-t border-slate-100 pt-3">
                <OperationalButton type="submit" variant="primary" disabled={mutation.isPending}>
                  <Send className="h-4 w-4" />
                  {mutation.isPending ? "Mengajukan..." : "Ajukan Record BPOM"}
                </OperationalButton>
              </div>
            </form>
          </OperationalPanel>
        </OperationalTabsContent>

        <OperationalTabsContent value="halal" className="mt-3">
          <OperationalPanel>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                <Moon className="h-4 w-4" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900">Halal Certification Registry</h3>
            </div>
            <form onSubmit={(e) => handleSubmit(e, "halal")} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OperationalField label="Halal ID / Certificate Number">
                <OperationalInput name="halalId" required placeholder="Contoh: ID001100000001" />
              </OperationalField>
              <OperationalField label="Product Name">
                <OperationalInput name="productName" required placeholder="Contoh: Serum Whitening" />
              </OperationalField>
              <OperationalField label="Manufacturer">
                <OperationalInput name="manufacturer" required placeholder="Contoh: PT Nex Industri" />
              </OperationalField>
              <OperationalField label="Category">
                <OperationalInput name="category" required placeholder="Contoh: Kosmetik" />
              </OperationalField>
              <OperationalField label="Application Date">
                <OperationalInput name="applicationDate" type="date" required />
              </OperationalField>
              <OperationalField label="Expiry Date (Opsional)">
                <OperationalInput name="expiryDate" type="date" />
              </OperationalField>
              <OperationalField label="Assigned PIC">
                <select
                  name="picId"
                  required
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Pilih PIC Officer</option>
                  {staffs?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} - {s.department}</option>
                  ))}
                </select>
              </OperationalField>
              <div className="md:col-span-2 mt-2 flex justify-end border-t border-slate-100 pt-3">
                <OperationalButton type="submit" variant="primary" disabled={mutation.isPending}>
                  <Send className="h-4 w-4" />
                  {mutation.isPending ? "Mengajukan..." : "Ajukan Record Halal"}
                </OperationalButton>
              </div>
            </form>
          </OperationalPanel>
        </OperationalTabsContent>
      </OperationalTabs>

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
    </OperationalPageShell>
  );
}
