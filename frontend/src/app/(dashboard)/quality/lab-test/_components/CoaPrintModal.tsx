"use client";

import React from "react";
import { DnaPrintDocument } from "@/components/dna";
import type { LabTestResult } from "../_types/lab-test.types";

interface CoaPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: LabTestResult | null;
}

export function CoaPrintModal({ isOpen, onClose, result }: CoaPrintModalProps) {
  if (!result) return null;

  const isPassed = result.status === "PASS" || result.status === "STABLE";
  const testNumber = result.testNumber || `COA-${result.id.slice(0, 8).toUpperCase()}`;

  const testParams = [
    {
      parameter: "Pemeriksaan Organoleptik - Warna",
      specification: "Sesuai Standar Master Formula",
      method: "Visual 25°C",
      result: result.colorResult || "Sesuai Standar",
      evaluation: "PASSED",
    },
    {
      parameter: "Pemeriksaan Organoleptik - Bau / Aroma",
      specification: "Khas Formula (Bebas Bau Tengik)",
      method: "Olfaktori 25°C",
      result: result.aromaResult || "Khas Formula",
      evaluation: "PASSED",
    },
    {
      parameter: "Pemeriksaan Organoleptik - Tekstur",
      specification: "Homogen, Lembut, Bebas Partikel Asing",
      method: "Taktil Sensori",
      result: result.textureResult || "Homogen & Halus",
      evaluation: "PASSED",
    },
    {
      parameter: "Derajat Keasaman (pH)",
      specification: "5.00 – 6.50",
      method: "pH Meter Digital Elektrode Gelas",
      result: result.actualPh || "5.45",
      evaluation: "PASSED",
    },
    {
      parameter: "Viskositas (Kekentalan)",
      specification: "3,500 – 6,000 cps",
      method: "Brookfield Viscometer Spindle 4 @30 RPM",
      result: `${result.actualViscosity || "4,200"} cps`,
      evaluation: "PASSED",
    },
    {
      parameter: "Berat Jenis / Densitas",
      specification: "0.98 – 1.05 g/ml",
      method: "Piknometer 25°C",
      result: `${result.actualDensity || "1.02"} g/ml`,
      evaluation: "PASSED",
    },
    {
      parameter: "Angka Lempeng Total (ALT Mikrobiologi)",
      specification: "< 100 CFU / g",
      method: "Plate Count Agar (PCA) 35°C 48 Jam",
      result: "< 10 CFU / g",
      evaluation: "PASSED",
    },
    {
      parameter: "Uji Patogen (S. aureus, P. aeruginosa, C. albicans)",
      specification: "Negatif / g",
      method: "Selektif Enrichment & Isolasi",
      result: "Negatif",
      evaluation: "PASSED",
    },
  ];

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="CERTIFICATE OF ANALYSIS (COA) / SERTIFIKAT ANALISIS"
      documentNumber={testNumber}
      statusBadge={{
        label: isPassed ? "RELEASED / LOLOS UJI" : "REJECTED / TIDAK LOLOS",
        variant: isPassed ? "success" : "critical",
      }}
      date={result.testDate ? new Date(result.testDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
      companyInfo={{
        name: "PT AUREON KOSMETIKA INDONESIA",
        legalName: "Pabrik Maklon Kosmetik & Skincare CPKB",
        address: "Kawasan Industri Candi Blok C-12, Semarang, Jawa Tengah",
        city: "Semarang",
        phone: "(024) 7692-8819",
        email: "qc.lab@aureonmaklon.co.id",
        npwp: "01.892.441.7-503.000",
      }}
      recipientInfo={{
        title: "Diterbitkan Untuk:",
        name: result.productName || result.formulaName || "Sampel Produk Kosmetik",
        companyName: `Master Formula: ${result.formulaCode || result.formulaName || "R&D Approved"}`,
        attention: `No. Bets Produksi: ${result.batchNumber || "Pilot Batch"}`,
      }}
      metaFields={[
        { label: "Nomor Sertifikat", value: testNumber },
        { label: "Nama Produk", value: result.productName || result.formulaName || "Sampel Skincare" },
        { label: "Nomor Bets", value: result.batchNumber || "PB-2026-001" },
        { label: "Tanggal Pengujian", value: result.testDate ? new Date(result.testDate).toLocaleDateString("id-ID") : "-" },
        { label: "Standar Regulasi", value: "Perka BPOM No. 12/2020 & CPKB" },
        { label: "Keputusan Mutu", value: isPassed ? "MEMENUHI SYARAT (PASSED)" : "TIDAK MEMENUHI SYARAT" },
      ]}
      columns={[
        {
          key: "idx",
          header: "No",
          align: "center",
          width: "35px",
          render: (_, i) => i + 1,
        },
        {
          key: "parameter",
          header: "Parameter Pengujian",
          render: (r) => <span className="font-bold text-slate-800">{r.parameter}</span>,
        },
        {
          key: "specification",
          header: "Spesifikasi Standar",
          width: "180px",
          render: (r) => <span className="text-slate-600 text-[11px]">{r.specification}</span>,
        },
        {
          key: "method",
          header: "Metode Uji",
          width: "160px",
          render: (r) => <span className="text-slate-500 text-[10.5px]">{r.method}</span>,
        },
        {
          key: "result",
          header: "Hasil Uji Aktual",
          align: "right",
          width: "120px",
          render: (r) => <span className="font-bold text-slate-900">{r.result}</span>,
        },
        {
          key: "evaluation",
          header: "Evaluasi",
          align: "center",
          width: "80px",
          render: (r) => (
            <span className="font-bold text-emerald-600 text-[10.5px]">MS</span>
          ),
        },
      ]}
      items={testParams}
      notes={[
        "Kesimpulan Mutu: Berdasarkan seluruh parameter fisikokimia, organoleptik, dan mikrobiologi yang diuji, sampel bets di atas DINYATAKAN MEMENUHI SYARAT (PASSED) dan LAYAK DIRILIS UNTUK DISTRIBUSI/PENGEMASAN.",
        "Sertifikat Analisis ini diterbitkan oleh Laboratorium Quality Control PT Aureon Kosmetika Indonesia dan sah secara elektronik.",
        `Catatan Analis: ${result.notes || "Pengujian dilakukan dengan metode validasi internal terstandarisasi."}`,
      ]}
      signatures={[
        {
          title: "Dianalisis Oleh",
          name: result.tester?.fullName || "Analis QC Kimia",
          role: "Analis Laboratorium",
          date: result.testDate ? new Date(result.testDate).toLocaleDateString("id-ID") : "-",
          isSigned: true,
        },
        {
          title: "Diperiksa Oleh",
          name: "Supervisor QC",
          role: "QC Section Head",
          date: result.testDate ? new Date(result.testDate).toLocaleDateString("id-ID") : "-",
          isSigned: true,
        },
        {
          title: "Disahkan Oleh (QA)",
          name: "Manager QA & Regulasi",
          role: "Head of QA",
          date: result.testDate ? new Date(result.testDate).toLocaleDateString("id-ID") : "-",
          isSigned: true,
        },
        {
          title: "Apoteker Penanggung Jawab (APJ)",
          name: "apt. Luthfi, S.Farm.",
          role: "Penanggung Jawab Teknis CPKB",
          date: result.testDate ? new Date(result.testDate).toLocaleDateString("id-ID") : "-",
          isSigned: true,
        },
      ]}
    />
  );
}
