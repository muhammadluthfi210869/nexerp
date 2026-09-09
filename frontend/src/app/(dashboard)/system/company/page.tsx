"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaCard,
  DnaFormSection,
  DnaInput,
  DnaTextarea,
  DnaButton,
  DnaBadge,
} from "@/components/dna";
import {
  Building2,
  MapPin,
  Landmark,
  Save,
  Award,
} from "lucide-react";
import { toast } from "sonner";

export default function CompanyProfilePage() {
  const [company, setCompany] = useState({
    legalName: "PT Diva Arya Mandiri",
    brandName: "Aureon Beauty & Cosmetic Lab",
    tagline: "Integrated Cosmetics & Personal Care Manufacturing Solution",
    nib: "0220108921829",
    npwp: "01.234.567.8-012.000",
    kbli: "20422 - Industri Kosmetika Untuk Manusia",
    email: "info@divaaryamandiri.co.id",
    phone: "+62 21 8934 5678",
    website: "https://www.aureonlab.co.id",
    cpkbNumber: "CPKB-GOL-A-2023-0881",
    halalCertNumber: "ID00410000289100522",
    bpomPermit: "BPOM-PBF-KOS-2022-491",
    headOffice: "Gedung Aureon Tower Lt. 8, Jl. TB Simatupang No. 12, Cilandak, Jakarta Selatan 12430",
    factoryAddress: "Kawasan Industri Jababeka Tahap III, Blok C-18 No. 4, Cikarang Utara, Bekasi, Jawa Barat 17530",
    warehouseAddress: "Pergudangan Sentra Prima Blok B-04, Jl. Diponegoro KM 38, Tambun Selatan, Bekasi 17510",
    bcaAccount: "8010-928-111 (KCP Cikarang)",
    mandiriAccount: "167-00-981273-1 (KC Jababeka)",
    invoiceSigner: "Muhammad Luthfi, S.E., Ak.",
    invoiceSignerRole: "Direktur Keuangan & Operasional",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profil perusahaan & data legalitas berhasil diperbarui.");
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Profil Perusahaan"
        subtitle="Identitas badan hukum, sertifikasi CPKB/Halal, lokasi pabrik, dan rekening resmi invoice"
        badge={<DnaBadge variant="green">Identitas Korporat</DnaBadge>}
        actions={
          <DnaButton variant="primary" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1.5" />
            Simpan Profil Perusahaan
          </DnaButton>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        <DnaCard title="Identitas Legal & Badan Hukum" icon={Building2}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DnaFormSection title="Nama Legal Perusahaan (PT)">
                <DnaInput
                  value={company.legalName}
                  onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
                  required
                />
              </DnaFormSection>
              <DnaFormSection title="Nama Komersial / Brand">
                <DnaInput
                  value={company.brandName}
                  onChange={(e) => setCompany({ ...company, brandName: e.target.value })}
                  required
                />
              </DnaFormSection>
              <DnaFormSection title="Nomor Pokok Wajib Pajak (NPWP 16 Digit)">
                <DnaInput
                  value={company.npwp}
                  onChange={(e) => setCompany({ ...company, npwp: e.target.value })}
                  required
                  className="font-mono"
                />
              </DnaFormSection>
              <DnaFormSection title="Nomor Induk Berusaha (NIB)">
                <DnaInput
                  value={company.nib}
                  onChange={(e) => setCompany({ ...company, nib: e.target.value })}
                  required
                  className="font-mono"
                />
              </DnaFormSection>
              <DnaFormSection title="Klasifikasi Baku Lapangan Usaha (KBLI)">
                <DnaInput
                  value={company.kbli}
                  onChange={(e) => setCompany({ ...company, kbli: e.target.value })}
                  required
                />
              </DnaFormSection>
              <DnaFormSection title="Slogan / Tagline Perusahaan">
                <DnaInput
                  value={company.tagline}
                  onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                />
              </DnaFormSection>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border/30">
              <DnaFormSection title="Email Korespondensi Resmi">
                <DnaInput
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                />
              </DnaFormSection>
              <DnaFormSection title="Nomor Telepon Kantor">
                <DnaInput
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                />
              </DnaFormSection>
              <DnaFormSection title="Situs Web Resmi">
                <DnaInput
                  value={company.website}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                />
              </DnaFormSection>
            </div>
          </div>
        </DnaCard>

        <DnaCard title="Legalitas & Sertifikasi Regulasi" icon={Award}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Sertifikat CPKB BPOM</span>
                  <DnaBadge variant="green">Golongan A</DnaBadge>
                </div>
                <DnaInput
                  value={company.cpkbNumber}
                  onChange={(e) => setCompany({ ...company, cpkbNumber: e.target.value })}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">Standar Cara Pembuatan Kosmetika yang Baik (BPOM RI).</p>
              </div>

              <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Sertifikat Halal BPJPH</span>
                  <DnaBadge variant="green">Grade A / Sangat Baik</DnaBadge>
                </div>
                <DnaInput
                  value={company.halalCertNumber}
                  onChange={(e) => setCompany({ ...company, halalCertNumber: e.target.value })}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">Sertifikasi Halal LPPOM-MUI & BPJPH Kemenag RI.</p>
              </div>

              <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Izin PBF / Fasilitas Produksi</span>
                  <DnaBadge variant="blue">Aktif Permanen</DnaBadge>
                </div>
                <DnaInput
                  value={company.bpomPermit}
                  onChange={(e) => setCompany({ ...company, bpomPermit: e.target.value })}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">Izin Operasional Sarana Produksi dari Badan POM.</p>
              </div>
            </div>
          </div>
        </DnaCard>

        <DnaCard title="Alamat Fasilitas Operasional" icon={MapPin}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DnaFormSection title="Kantor Pusat (Head Office)">
                <DnaTextarea
                  rows={3}
                  value={company.headOffice}
                  onChange={(e) => setCompany({ ...company, headOffice: e.target.value })}
                />
              </DnaFormSection>

              <DnaFormSection title="Pabrik Manufaktur (Plant)">
                <DnaTextarea
                  rows={3}
                  value={company.factoryAddress}
                  onChange={(e) => setCompany({ ...company, factoryAddress: e.target.value })}
                />
              </DnaFormSection>

              <DnaFormSection title="Gudang Distribusi (Warehouse)">
                <DnaTextarea
                  rows={3}
                  value={company.warehouseAddress}
                  onChange={(e) => setCompany({ ...company, warehouseAddress: e.target.value })}
                />
              </DnaFormSection>
            </div>
          </div>
        </DnaCard>

        <DnaCard title="Kop Surat, Rekening Bank Resmi & Penandatangan" icon={Landmark}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DnaFormSection title="Rekening Bank BCA (Tertera di Invoice)">
                <DnaInput
                  value={company.bcaAccount}
                  onChange={(e) => setCompany({ ...company, bcaAccount: e.target.value })}
                  placeholder="a/n PT Diva Arya Mandiri"
                />
              </DnaFormSection>

              <DnaFormSection title="Rekening Bank Mandiri (Tertera di Invoice)">
                <DnaInput
                  value={company.mandiriAccount}
                  onChange={(e) => setCompany({ ...company, mandiriAccount: e.target.value })}
                  placeholder="a/n PT Diva Arya Mandiri"
                />
              </DnaFormSection>

              <DnaFormSection title="Nama Penanggung Jawab Tanda Tangan Dokumen">
                <DnaInput
                  value={company.invoiceSigner}
                  onChange={(e) => setCompany({ ...company, invoiceSigner: e.target.value })}
                />
              </DnaFormSection>

              <DnaFormSection title="Jabatan Penanggung Jawab">
                <DnaInput
                  value={company.invoiceSignerRole}
                  onChange={(e) => setCompany({ ...company, invoiceSignerRole: e.target.value })}
                />
              </DnaFormSection>
            </div>
          </div>
        </DnaCard>
      </form>
    </DnaPageContainer>
  );
}
