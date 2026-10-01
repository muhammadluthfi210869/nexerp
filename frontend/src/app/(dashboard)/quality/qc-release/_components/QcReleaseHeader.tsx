import React from "react";
import Link from "next/link";
import { FileSpreadsheet, Building2 } from "lucide-react";
import { DnaPageHeader, DnaBadge, DnaButton } from "@/components/dna";

interface QcReleaseHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalCount: number;
  quarantineCount: number;
  investigationCount: number;
  releasedCount: number;
  onExport: () => void;
}

export function QcReleaseHeader({
  activeTab,
  onTabChange,
  totalCount,
  quarantineCount,
  investigationCount,
  releasedCount,
  onExport,
}: QcReleaseHeaderProps) {
  return (
    <DnaPageHeader
      title="Inspeksi QC & Gerbang Rilis APJ"
      description="Gerbang Karantina Mutu CPKB: Verifikasi mikrobiologi, fisika-kimia, dan otorisasi e-signature Apoteker Penanggung Jawab."
      badge={<DnaBadge variant="neutral">APJ-RELEASE</DnaBadge>}
      breadcrumbs={[
        { label: "Produksi Pabrik", href: "/production" },
        { label: "Quality Assurance", href: "/quality/qc-release" },
        { label: "Gerbang Rilis APJ", href: "/quality/qc-release" }
      ]}
      tabs={[
        { id: "ALL", label: `Semua Batch (${totalCount})` },
        { id: "QUARANTINE", label: `Menunggu Rilis (${quarantineCount})` },
        { id: "INVESTIGATION", label: `Inkubasi Mikro (${investigationCount})` },
        { id: "RELEASED", label: `Lolos Rilis (${releasedCount})` }
      ]}
      activeTab={activeTab}
      onTabChange={onTabChange}
      actions={
        <div className="flex items-center gap-2">
          <DnaButton
            variant="secondary"
            onClick={onExport}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Export Excel
          </DnaButton>
          <Link href="/warehouse/stok">
            <DnaButton variant="primary">
              <Building2 className="w-4 h-4 mr-1.5" />
              Gudang WH-03
            </DnaButton>
          </Link>
        </div>
      }
    />
  );
}
