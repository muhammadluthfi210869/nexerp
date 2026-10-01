"use client";

import React from "react";
import { FileSpreadsheet, Clock, Package, DollarSign } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

interface OrderKpiCardsProps {
  totalOrders: number;
  totalPending: number;
  totalInProd: number;
  totalOmzet: number;
  totalReleased: number;
}

export function OrderKpiCards({
  totalOrders,
  totalPending,
  totalInProd,
  totalOmzet,
  totalReleased,
}: OrderKpiCardsProps) {
  return (
    <DnaKpiGrid
      cards={[
        {
          key: "ALL",
          title: "TOTAL SALES ORDERS",
          value: `${totalOrders} Order`,
          deltaText: "Kontrak aktif terdaftar",
          isDeltaPositive: true,
          icon: <FileSpreadsheet className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "PENDING",
          title: "MENUNGGU APPROVAL",
          value: `${totalPending} SO`,
          deltaText: "Verifikasi kontrak & DP",
          isDeltaPositive: false,
          icon: <Clock className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
        {
          key: "IN_PROD",
          title: "DALAM PRODUKSI PABRIK",
          value: `${totalInProd} SO`,
          deltaText: "Mixing / filling / packing",
          isDeltaPositive: true,
          icon: <Package className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          key: "OMZET",
          title: "TOTAL OMZET BERJALAN",
          value: formatCurrency(totalOmzet),
          deltaText: `${totalReleased} SO Siap Kirim (RELEASED)`,
          isDeltaPositive: true,
          icon: <DollarSign className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
      ]}
    />
  );
}
