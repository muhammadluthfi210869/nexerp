"use client";

import React from "react";
import { Users, Building2, Sparkles, Clock } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";

interface GuestKpiCardsProps {
  totalGuests: number;
  countBranded: number;
  countKlinik: number;
  countPemula: number;
}

export function GuestKpiCards({
  totalGuests,
  countBranded,
  countKlinik,
  countPemula,
}: GuestKpiCardsProps) {
  return (
    <DnaKpiGrid
      cards={[
        {
          key: "TOTAL",
          title: "TOTAL TAMU TERDAFTAR",
          value: `${totalGuests} Tamu`,
          deltaText: "Calon mitra maklon tercatat",
          isDeltaPositive: true,
          icon: <Users className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "BRANDED",
          title: "KLIEN BRAND ESTABLISHED",
          value: `${countBranded} Klien`,
          deltaText: "Segmen brand berkembang",
          isDeltaPositive: true,
          icon: <Building2 className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          key: "KLINIK",
          title: "KLINIK KECANTIKAN",
          value: `${countKlinik} Klinik`,
          deltaText: "Dokter & aesthetic clinic",
          isDeltaPositive: true,
          icon: <Sparkles className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "PEMULA",
          title: "KLIEN PEMULA & DISTRIBUTOR",
          value: `${countPemula} Mitra`,
          deltaText: "Edukasi formula & MOQ plan",
          isDeltaPositive: true,
          icon: <Clock className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
      ]}
    />
  );
}
