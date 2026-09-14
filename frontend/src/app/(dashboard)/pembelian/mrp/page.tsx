"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaTabNav } from "@/components/dna";
import { BarChart4, Layers } from "lucide-react";

const KebutuhanPage = dynamic(() => import("../kebutuhan/page"), {
  loading: () => <div className="h-96 bg-slate-50 rounded-2xl animate-pulse" />,
});
const RangkumanPage = dynamic(() => import("../rangkuman-kebutuhan/page"), {
  loading: () => <div className="h-96 bg-slate-50 rounded-2xl animate-pulse" />,
});

// SPEC: SCR-SCM-MRP-002 — Material Requirement Planning hub dengan tab Kebutuhan / Rangkuman

export default function MRPPage() {
  const [tab, setTab] = useState<"kebutuhan" | "rangkuman">("kebutuhan");

  return (
    <DashboardShell
      title="PERENCANAAN"
      titleAccent="MATERIAL"
      subtitle="Perencanaan kebutuhan bahan baku & kemasan"
    >
      <DnaTabNav
        tabs={[
          { id: "kebutuhan", label: "Kebutuhan Barang", icon: BarChart4 },
          { id: "rangkuman", label: "Rangkuman Kebutuhan", icon: Layers },
        ]}
        activeTab={tab}
        onTabChange={(k) => setTab(k as "kebutuhan" | "rangkuman")}
        className="mb-6"
      />

      <div>
        {tab === "kebutuhan" && <KebutuhanPage />}
        {tab === "rangkuman" && <RangkumanPage />}
      </div>
    </DashboardShell>
  );
}
