"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaTabNav } from "@/components/dna";
import { BarChart4, Layers } from "lucide-react";

const KebutuhanPage = dynamic(() => import("../kebutuhan-barang/page"), {
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
          { key: "kebutuhan", label: "Kebutuhan Barang", icon: <BarChart4 className="w-4 h-4" /> },
          { key: "rangkuman", label: "Rangkuman Kebutuhan", icon: <Layers className="w-4 h-4" /> },
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
