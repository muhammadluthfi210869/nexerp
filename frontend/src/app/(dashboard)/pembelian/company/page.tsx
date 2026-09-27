"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaCard,
  DnaFormSection,
  DnaInput,
  DnaTextarea,
  DnaButton,
  DnaBadge,
  DnaErrorState,
  DnaLoadingSkeleton,
} from "@/components/dna";
import { Building2, MapPin, Save, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface OrganizationConfig {
  companyName: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
}

const EMPTY: OrganizationConfig = {
  companyName: "",
  legalName: "",
  taxId: "",
  address: "",
  phone: "",
  email: "",
};

export default function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OrganizationConfig>(EMPTY);

  const { data, isLoading, isError, refetch } = useQuery<OrganizationConfig>({
    queryKey: ["system-organization-config"],
    queryFn: async () => {
      try {
        const res = await api.get("/system/config/organization");
        const payload = res.data?.data || res.data || {};
        return {
          companyName: payload.companyName || "",
          legalName: payload.legalName || "",
          taxId: payload.taxId || "",
          address: payload.address || "",
          phone: payload.phone || "",
          email: payload.email || "",
        };
      } catch {
        return EMPTY;
      }
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: OrganizationConfig) => {
      const res = await api.patch("/system/config/organization", payload);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-organization-config"] });
      toast.success("Konfigurasi organisasi berhasil disimpan.");
    },
    onError: (error) => {
      const { message } = extractApiError(error);
      toast.error(message || "Gagal menyimpan konfigurasi organisasi.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <DnaPageContainer>
        <DnaPageHeader
          title="Profil Perusahaan"
          description="Identitas badan hukum dan kontak resmi organisasi."
          badge={<DnaBadge variant="neutral">SCR-050 / SYS-CMP</DnaBadge>}
        />
        <DnaLoadingSkeleton rows={6} />
      </DnaPageContainer>
    );
  }

  if (isError) {
    return (
      <DnaPageContainer>
        <DnaPageHeader
          title="Profil Perusahaan"
          description="Identitas badan hukum dan kontak resmi organisasi."
          badge={<DnaBadge variant="neutral">SCR-050 / SYS-CMP</DnaBadge>}
        />
        <DnaErrorState
          title="Gagal Memuat Profil Perusahaan"
          message="Tidak dapat mengambil data dari /system/config/organization."
          onRetry={() => refetch()}
        />
      </DnaPageContainer>
    );
  }

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Profil Perusahaan"
        description="Identitas badan hukum dan kontak resmi organisasi (tersimpan di system config)."
        badge={<DnaBadge variant="neutral">SCR-050 / SYS-CMP</DnaBadge>}
        actions={
          <DnaButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saveMutation.isPending ? "Menyimpan..." : "Simpan Profil Perusahaan"}
          </DnaButton>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <DnaCard title="Identitas Legal & Badan Hukum" icon={Building2}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DnaFormSection title="Nama Legal Perusahaan (PT)">
                <DnaInput
                  value={form.legalName}
                  onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                  placeholder="Belum diisi"
                />
              </DnaFormSection>
              <DnaFormSection title="Nama Komersial / Brand">
                <DnaInput
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Belum diisi"
                />
              </DnaFormSection>
              <DnaFormSection title="Nomor Pokok Wajib Pajak (NPWP)">
                <DnaInput
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  placeholder="Belum diisi"
                  className="tabular-nums"
                />
              </DnaFormSection>
            </div>
          </div>
        </DnaCard>

        <DnaCard title="Kontak & Alamat Resmi" icon={MapPin}>
          <div className="space-y-4">
            <DnaFormSection title="Alamat Resmi Terdaftar">
              <DnaTextarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Belum diisi"
              />
            </DnaFormSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DnaFormSection title="Nomor Telepon Kantor">
                <DnaInput
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Belum diisi"
                  icon={<Phone className="w-4 h-4" />}
                />
              </DnaFormSection>
              <DnaFormSection title="Email Korespondensi Resmi">
                <DnaInput
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Belum diisi"
                  icon={<Mail className="w-4 h-4" />}
                />
              </DnaFormSection>
            </div>
          </div>
        </DnaCard>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-900">
          <strong className="block mb-1">Catatan cakupan data</strong>
          Halaman ini hanya menampilkan field yang benar-benar tersimpan di backend
          (<code className="font-mono">/system/config/organization</code>): nama legal,
          nama komersial, NPWP, alamat, telepon, dan email. Field lain (NIB, KBLI, tagline,
          situs web, nomor CPKB/Halal/PBF, alamat pabrik &amp; gudang terpisah, rekening bank,
          penandatangan invoice) belum memiliki penyimpanan di backend sehingga tidak lagi
          ditampilkan agar tidak menyesatkan.
        </div>
      </form>
    </DnaPageContainer>
  );
}