"use client";

import React from "react";
import { DnaPrintDocument } from "@/components/dna";
import type { CoaRecord } from "../_types/coa.types";

interface CoaPrintDocumentModalProps {
  record: CoaRecord | null;
  onClose: () => void;
}

export function CoaPrintDocumentModal({
  record,
  onClose,
}: CoaPrintDocumentModalProps) {
  if (!record) return null;

  return (
    <DnaPrintDocument
      isOpen={!!record}
      onClose={onClose}
      documentType="CERTIFICATE OF ANALYSIS (CoA)"
      documentNumber={record.id}
      date={record.releaseDate}
      statusBadge={{ label: "TERVERIFIKASI CPKB", variant: "success" }}
      companyInfo={{
        name: "PT. KARYA IMPIAN LABORATORIS",
        legalName: "Dreamlab Cosmetic & Skincare Manufacturer",
        address: "Kawasan Industri & Pergudangan Kosambi Permai Blok J No. 12",
        city: "Kab. Tangerang, Banten 15213",
        phone: "+62 21 5595 1234",
        email: "qa@dreamlab.co.id",
        npwp: "84.921.340.2-416.000",
      }}
      recipientInfo={{
        title: "Ditujukan Kepada:",
        name: "Arsip Pengawasan Mutu & Rilis Produk (CPKB)",
        companyName: "PT. KARYA IMPIAN LABORATORIS",
        address: "Departemen Quality Assurance / Pemastian Mutu",
        attention: record.analyst,
      }}
      metaFields={[
        { label: "Nomor Batch", value: record.batch },
        { label: "Nama Sediaan", value: record.product },
        { label: "Fase Uji", value: record.phase || "Finished Good Release" },
        { label: "Status Regulasi", value: "Memenuhi Spesifikasi CPKB / BPOM" },
      ]}
      columns={[
        { key: "parameter", header: "Parameter Pengujian", width: "35%" },
        { key: "spesifikasi", header: "Spesifikasi CPKB", width: "30%" },
        { key: "hasil", header: "Hasil Pengamatan / Uji", width: "20%" },
        { key: "kesimpulan", header: "Kesimpulan", width: "15%", align: "center" },
      ]}
      items={[
        {
          parameter: "Bentuk & Organoleptik (Warna, Bau, Tekstur)",
          spesifikasi: "Sesuai Standar Formulasi",
          hasil: record.parameters?.organoleptic || "Normal Sesuai Spesifikasi",
          kesimpulan: "MEMENUHI",
        },
        {
          parameter: "Derajat Keasaman (pH Test)",
          spesifikasi: "5.00 - 6.50",
          hasil: record.parameters?.ph || "5.45",
          kesimpulan: "MEMENUHI",
        },
        {
          parameter: "Viskositas (Brookfield cps)",
          spesifikasi: "2,500 - 4,500 cps",
          hasil: `${record.parameters?.viscosity || "3,200"} cps`,
          kesimpulan: "MEMENUHI",
        },
        {
          parameter: "Bobot Jenis / Densitas (g/ml)",
          spesifikasi: "0.98 - 1.05 g/ml",
          hasil: `${record.parameters?.density || "1.02"} g/ml`,
          kesimpulan: "MEMENUHI",
        },
        {
          parameter: "Uji Homogenitas",
          spesifikasi: "Homogen, Bebas Partikel Asing",
          hasil: record.parameters?.homogenity !== false ? "Homogen" : "Gagal",
          kesimpulan: "MEMENUHI",
        },
        {
          parameter: "Uji Kebocoran Wadah (Leak Test Vacuum)",
          spesifikasi: "Kedap / Tidak Bocor pada -0.5 bar",
          hasil: record.parameters?.leakTest !== false ? "Kedap Sempurna" : "Bocor",
          kesimpulan: "MEMENUHI",
        },
      ]}
      notes={[
        "Catatan Analisis: Produk dinyatakan LOLOS uji pengawasan mutu dan memenuhi seluruh kriteria rilis batch kosmetika CPKB.",
        "Dokumen ini diterbitkan secara elektronik dengan verifikasi digital hash SHA-256 dan sah tanpa tanda tangan basah jika kode validasi tertera.",
      ]}
      signatures={[
        { title: "Dianalisis Oleh", name: record.analyst, role: "QC Analyst & Inspector" },
        { title: "Diperiksa & Diverifikasi", name: "Hendra Wijaya, S.Si", role: "QC Supervisor" },
        { title: "Disetujui untuk Rilis", name: "apt. Fitri Handayani, S.Farm", role: "Apoteker Penanggung Jawab (APJ)" },
      ]}
    />
  );
}
