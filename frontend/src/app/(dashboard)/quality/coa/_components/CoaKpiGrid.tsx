"use client";

import React from "react";
import { FileText, ShieldCheck, Lock } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface CoaKpiGridProps {
  totalCoa: number;
  verifiedCoa: number;
}

export function CoaKpiGrid({ totalCoa, verifiedCoa }: CoaKpiGridProps) {
  return (
    <DnaKpiGrid cols={3}>
      <DnaStatCard
        label="TOTAL SERTIFIKAT CoA"
        value={`${totalCoa} Dokumen`}
        subValue="Tersimpan di Sistem Mutu"
        icon={<FileText className="w-5 h-5 text-blue-600" />}
      />
      <DnaStatCard
        label="TERVERIFIKASI (SIAP RILIS)"
        value={`${verifiedCoa} Dokumen`}
        subValue="Lolos Seluruh Parameter Audit"
        icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
      />
      <DnaStatCard
        label="KEAMANAN TANDA TANGAN"
        value="SHA-256"
        subValue="Enkripsi Tervalidasi BPOM"
        icon={<Lock className="w-5 h-5 text-indigo-600" />}
      />
    </DnaKpiGrid>
  );
}
