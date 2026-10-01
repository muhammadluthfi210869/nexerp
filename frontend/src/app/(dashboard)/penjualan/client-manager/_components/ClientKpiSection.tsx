"use client";

import React from "react";
import {
  FlaskConical,
  Package,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Layers,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { GroupKey, formatJuta } from "../_types/client-manager.types";

interface ClientKpiSectionProps {
  activeTab: GroupKey;
  sampleLeadsCount: number;
  sampleValue: number;
  sampleMoq: number;
  sampleApproved: number;
  productionLeadsCount: number;
  productionValue: number;
  productionSpk: number;
  productionLocked: number;
  roLeadsCount: number;
  roValue: number;
  roRepeat: number;
  roRetention: number;
}

export function ClientKpiSection({
  activeTab,
  sampleLeadsCount,
  sampleValue,
  sampleMoq,
  sampleApproved,
  productionLeadsCount,
  productionValue,
  productionSpk,
  productionLocked,
  roLeadsCount,
  roValue,
  roRepeat,
  roRetention,
}: ClientKpiSectionProps) {
  if (activeTab === "sample") {
    return (
      <DnaKpiGrid
        cards={[
          {
            key: "TOTAL",
            title: "TOTAL KLIEN SAMPLE",
            value: `${sampleLeadsCount} Klien`,
            deltaText: "Status CONTACTED s/d SAMPLE_APPROVED",
            isDeltaPositive: true,
            icon: <FlaskConical className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            key: "VALUE",
            title: "POTENSI NILAI (ESTIMASI)",
            value: formatJuta(sampleValue),
            deltaText: "Sum estimatedValue lead sample",
            isDeltaPositive: true,
            icon: <DollarSign className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            key: "MOQ",
            title: "TOTAL RENCANA MOQ",
            value: `${sampleMoq.toLocaleString("id-ID")} pcs`,
            deltaText: "Sum field moq lead sample",
            isDeltaPositive: true,
            icon: <Package className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
          },
          {
            key: "CONVERSION",
            title: "SAMPLE DISETUJUI",
            value: `${sampleApproved} / ${sampleLeadsCount}`,
            deltaText: "Status SAMPLE_APPROVED",
            isDeltaPositive: true,
            icon: <TrendingUp className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
          },
        ]}
      />
    );
  }

  if (activeTab === "production") {
    return (
      <DnaKpiGrid
        cards={[
          {
            key: "TOTAL",
            title: "TOTAL PROJEK PRODUKSI",
            value: `${productionLeadsCount} Projek`,
            deltaText: "SPK_SIGNED / PRODUCTION_PLAN / READY_TO_SHIP",
            isDeltaPositive: true,
            icon: <Layers className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            key: "KONTRAK",
            title: "NILAI KONTRAK (ESTIMASI)",
            value: formatJuta(productionValue),
            deltaText: "Sum estimatedValue lead produksi",
            isDeltaPositive: true,
            icon: <DollarSign className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            key: "SPK",
            title: "SPK TERUNGGAH",
            value: `${productionSpk} / ${productionLeadsCount}`,
            deltaText: "Lead dengan berkas spkFileUrl",
            isDeltaPositive: true,
            icon: <CheckCircle2 className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
          },
          {
            key: "FORMULA",
            title: "FORMULA TERKUNCI",
            value: `${productionLocked} Projek`,
            deltaText: "Flag isFormulaLocked",
            isDeltaPositive: true,
            icon: <RefreshCw className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
          },
        ]}
      />
    );
  }

  if (activeTab === "ro") {
    return (
      <DnaKpiGrid
        cards={[
          {
            key: "TOTAL",
            title: "TOTAL KLIEN WON DEAL",
            value: `${roLeadsCount} Klien`,
            deltaText: "Status WON_DEAL",
            isDeltaPositive: true,
            icon: <RefreshCw className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            key: "OMZET",
            title: "NILAI ESTIMASI KLIEN RO",
            value: formatJuta(roValue),
            deltaText: "Sum estimatedValue klien WON_DEAL",
            isDeltaPositive: true,
            icon: <DollarSign className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            key: "REPEAT",
            title: "ORDER ULANG (BATCH > 1)",
            value: `${roRepeat} Klien`,
            deltaText: "Field orderCount lebih dari 1",
            isDeltaPositive: true,
            icon: <Calendar className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
          },
          {
            key: "RETENTION",
            title: "RASIO ORDER ULANG",
            value: `${roRetention}%`,
            deltaText: "orderCount > 1 dibagi total WON_DEAL",
            isDeltaPositive: true,
            icon: <TrendingUp className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
          },
        ]}
      />
    );
  }

  return null;
}
