import React from "react";
import { Clock, CheckCircle2, Calendar, Users } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface TicketsKpiCardsProps {
  pendingCount: number;
  approvedCount: number;
  splCount: number;
}

export const TicketsKpiCards: React.FC<TicketsKpiCardsProps> = ({
  pendingCount,
  approvedCount,
  splCount,
}) => {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Menunggu Approval Manager"
        value={pendingCount + " Tiket"}
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        delta={{ value: "Perlu Verifikasi", isPositive: false }}
        subtext="Review Atasan & HR"
        variant="warning"
      />
      <DnaStatCard
        label="Cuti Disetujui (Bulan Ini)"
        value={approvedCount + " Tiket"}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        delta={{ value: "Quota Terjaga", isPositive: true }}
        subtext="Total Hari Kerja Cuti"
        variant="success"
      />
      <DnaStatCard
        label="Surat Perintah Lembur (SPL)"
        value={splCount + " Sesi"}
        icon={<Calendar className="w-5 h-5 text-purple-600" />}
        subtext="Kebutuhan Target Batch Manufaktur"
        variant="purple"
      />
      <DnaStatCard
        label="Sisa Kuota Cuti Karyawan"
        value="Rata-rata 8.5 Hari"
        icon={<Users className="w-5 h-5 text-blue-600" />}
        subtext="Hak Cuti Tahunan 12 Hari/Thn"
        variant="info"
      />
    </DnaKpiGrid>
  );
};
