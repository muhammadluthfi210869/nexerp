"use client";

import React from "react";
import { Building2, Layers, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import type { SupplierKpiFilterType } from "../_types/supplier.types";

interface SupplierKpiCardsProps {
  totalSuppliers: number;
  rawMaterialSuppliers: number;
  packagingSuppliers: number;
  pkpSuppliers: number;
}

export function SupplierKpiCards({
  totalSuppliers,
  rawMaterialSuppliers,
  packagingSuppliers,
  pkpSuppliers,
}: SupplierKpiCardsProps) {
  return (
    <DnaKpiGrid
      cards={[
        {
          key: "ALL",
          title: "TOTAL REKANAN AKTIF",
          value: totalSuppliers.toLocaleString("id-ID"),
          icon: <Building2 className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "BBK",
          title: "VENDOR BAHAN BAKU",
          value: `${rawMaterialSuppliers} Vendor`,
          icon: <Layers className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          key: "KEMASAN",
          title: "VENDOR KEMASAN (PRIMER/SEKUNDER)",
          value: `${packagingSuppliers} Vendor`,
          icon: <Building2 className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
        {
          key: "PKP",
          title: "REKANAN PKP (PPN 11%)",
          value: `${pkpSuppliers} Vendor`,
          icon: <CheckCircle2 className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
      ]}
    />
  );
}
