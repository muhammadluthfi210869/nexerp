"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DnaInput, DnaButton, DnaBadge } from "@/components/dna";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Phone,
  DollarSign,
  ShieldCheck,
  Calculator,
} from "lucide-react";

import {
  OperationalButton,
  OperationalField,
  OperationalInput,
  OperationalPageShell,
  OperationalPanel,
} from "@/components/operational";
import { useAuth } from "@/hooks/useAuth";

const SOURCES = ["Instagram", "TikTok", "TikTok Ads", "Referral", "Website", "Offline Event", "WhatsApp"];
const CATEGORIES = ["SKINCARE", "BODYCARE", "BABYCARE", "HAIRCARE", "DECORATIVE", "PARFUM"];

export default function LeadIntakePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedPic, setSelectedPic] = useState<string | null>("AUTO");
  const [moq, setMoq] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const isAdmin = user?.roles?.includes("SUPER_ADMIN");

  const { data: staffs } = useQuery({
    queryKey: ["bussdev-staffs"],
    queryFn: async () => {
      const res = await api.get("/bussdev/staffs");
      return res.data;
    },
  });

  React.useEffect(() => {
    if (staffs && user && !isAdmin) {
      const myStaff = staffs.find((s: any) => s.userId === user.id);
      if (myStaff) {
        setSelectedPic(myStaff.id);
      }
    }
  }, [staffs, user, isAdmin]);

  const createLeadMutation = useMutation({
    mutationFn: async (newLead: any) => {
      const res = await api.post("/bussdev/lead", newLead);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Lead berhasil didaftarkan.");
      queryClient.invalidateQueries({ queryKey: ["bussdev-leads"] });
      window.location.href = "/bussdev/pipeline";
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Pendaftaran gagal.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    const moqVal = Number(rawData.moq) || 0;
    const unitPriceVal = Number(rawData.unitPrice) || 0;
    const computedValue = moqVal * unitPriceVal;

    if (computedValue <= 0) {
      toast.error("MOQ dan HPP harus diisi.");
      return;
    }

    setPendingFormData({
      ...rawData,
      moq: moqVal,
      unitPrice: unitPriceVal,
      estimatedValue: computedValue,
      picId: (selectedPic === "AUTO" || !selectedPic) ? undefined : selectedPic,
    });
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    if (pendingFormData) {
      createLeadMutation.mutate(pendingFormData);
    }
  };

  return (
    <OperationalPageShell
      title="Intake Klien"
      subtitle="Pendaftaran prospek & penugasan workload BusDev"
      actions={
        <DnaBadge status="default" className="bg-white border-slate-200 text-slate-500">
          Pendaftaran Lead
        </DnaBadge>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form
          id="intake-form"
          onSubmit={handleSubmit}
          className="lg:col-span-2 flex flex-col gap-4"
        >
          <OperationalPanel>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900">Identitas Klien</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OperationalField label="Nama Klien / Entitas">
                <DnaInput id="clientName" name="clientName" required placeholder="PT. Nama Klien" className="h-9 rounded-md border-slate-200 text-[12px] font-medium" />
              </OperationalField>
              <OperationalField label="Identitas Brand">
                <DnaInput id="brandName" name="brandName" placeholder="Nama Brand" className="h-9 rounded-md border-slate-200 text-[12px] font-medium" />
              </OperationalField>
              <OperationalField label="Kontak">
                <DnaInput id="contactInfo" name="contactInfo" required placeholder="+62" icon={<Phone className="h-4 w-4" />} className="h-9 rounded-md border-slate-200 text-[12px] font-medium" />
              </OperationalField>
            </div>
          </OperationalPanel>

          <OperationalPanel>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-600">
                <Calculator className="h-4 w-4" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900">Analisis Peluang</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OperationalField label="Sumber Lead">
                <Select name="source" required>
                  <SelectTrigger className="h-9 rounded-md border border-slate-200 bg-white text-[12px] font-medium text-slate-700">
                    <SelectValue placeholder="Pilih sumber" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </OperationalField>
              <OperationalField label="Minat Produk">
                <DnaInput id="productInterest" name="productInterest" required placeholder="Contoh: Serum" className="h-9 rounded-md border-slate-200 text-[12px] font-medium" />
              </OperationalField>
              <OperationalField label="Kategori Produk">
                <Select name="category" required>
                  <SelectTrigger className="h-9 rounded-md border border-slate-200 bg-white text-[12px] font-medium text-slate-700">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </OperationalField>

              <OperationalField label="Estimasi MOQ (Pcs)">
                <DnaInput id="moq" name="moq" type="number" required placeholder="Contoh: 1000" className="h-9 rounded-md border-slate-200 text-[12px] font-medium" value={moq} onChange={(e) => setMoq(e.target.value)} />
              </OperationalField>
              <OperationalField label="HPP / Harga Satuan (Rp)">
                <DnaInput id="unitPrice" name="unitPrice" type="number" required placeholder="Contoh: 150000" icon={<DollarSign className="h-4 w-4" />} className="h-9 rounded-md border-slate-200 text-[12px] font-medium" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
              </OperationalField>
              <OperationalField label="Nilai Estimasi (MOQ × HPP)">
                <DnaInput
                  id="estimatedValue"
                  name="estimatedValue"
                  value={(() => {
                    const m = Number(moq);
                    const u = Number(unitPrice);
                    if (!Number.isFinite(m) || !Number.isFinite(u)) return "—";
                    const total = m * u;
                    if (!Number.isFinite(total) || total <= 0) return "—";
                    return total.toLocaleString();
                  })()}
                  readOnly
                  icon={<Calculator className="h-4 w-4 text-blue-500" />}
                  className="h-9 rounded-md border-blue-100 bg-blue-50/50 text-blue-900 text-[12px] font-semibold"
                />
              </OperationalField>
            </div>

            <div className="mt-4">
              <OperationalField label="Brief / Kebutuhan">
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Catatan tambahan..."
                  className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white p-3 text-[12px] font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </OperationalField>
            </div>
          </OperationalPanel>
        </form>

        <aside className="lg:col-span-1 flex flex-col gap-4 lg:sticky lg:top-4 self-start">
          <OperationalPanel>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900">Penugasan Internal</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block text-[11px] font-medium text-slate-600">PIC</Label>
                <Select
                  name="picId"
                  value={selectedPic || ""}
                  onValueChange={(val) => val && setSelectedPic(val)}
                >
                  <SelectTrigger className="h-9 rounded-md border border-slate-200 bg-white text-[12px] font-medium text-slate-700">
                    <SelectValue placeholder="Mendeteksi..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Auto-balance</SelectItem>
                    {staffs?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <OperationalButton
                type="button"
                variant="primary"
                onClick={() => (document.getElementById('intake-form') as HTMLFormElement)?.requestSubmit()}
                disabled={createLeadMutation.isPending}
                className="w-full"
              >
                {createLeadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Daftarkan Lead
              </OperationalButton>
            </div>
          </OperationalPanel>

          <OperationalPanel>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <h3 className="text-[13px] font-semibold text-slate-900">Protokol SLA</h3>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
              Respons harus dimulai dalam 24 jam setelah pengiriman.
            </p>
          </OperationalPanel>
        </aside>
      </div>

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
