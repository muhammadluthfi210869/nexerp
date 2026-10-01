import React from "react";
import { ClipboardList, Clock, Boxes, Warehouse } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { RequisitionKpis } from "../_types/requisition.types";

interface RequisitionKpiCardsProps {
  kpis: RequisitionKpis;
}

export const RequisitionKpiCards: React.FC<RequisitionKpiCardsProps> = ({ kpis }) => {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Permintaan"
        value={`${kpis.total} Dokumen`}
        icon={<ClipboardList className="w-5 h-5 text-indigo-600" />}
        delta={{ value: "+3 minggu ini", isPositive: true }}
      />
      <DnaStatCard
        label="Menunggu Persetujuan"
        value={`${kpis.pending} Dokumen`}
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        variant={kpis.pending > 0 ? "warning" : "default"}
      />
      <DnaStatCard
        label="Disetujui & Siap Serah"
        value={`${kpis.approved} Dokumen`}
        icon={<Boxes className="w-5 h-5 text-emerald-600" />}
      />
      <DnaStatCard
        label="Total Unit Diminta"
        value={`${kpis.totalItemsCount.toLocaleString("id-ID")} Qty`}
        icon={<Warehouse className="w-5 h-5 text-blue-600" />}
      />
    </DnaKpiGrid>
  );
};
