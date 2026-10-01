"use client";

import React, { useMemo } from "react";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaBadge,
  DnaCell,
} from "@/components/dna";
import type { SalesSampleApprovalItem } from "../_types/sales-sample.types";

export interface SalesSampleApprovalShellProps {
  items: SalesSampleApprovalItem[];
  getDetailData: (item: SalesSampleApprovalItem) => ApprovalDetailData;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export function SalesSampleApprovalShell({
  items,
  getDetailData,
  onApprove,
  onReject,
}: SalesSampleApprovalShellProps) {
  const columns: ApprovalColumn<SalesSampleApprovalItem>[] = useMemo(
    () => [
      {
        header: "No. Sample",
        accessor: "code",
        sortable: true,
        render: (item) => <DnaCell.Code value={item.code} />,
      },
      {
        header: "Klien & Brand",
        accessor: "client",
        sortable: true,
        render: (item) => (
          <DnaCell.NaturalPair primary={item.client} secondary={item.brand} />
        ),
      },
      {
        header: "Nama Produk & Revisi",
        accessor: "productName",
        render: (item) => (
          <DnaCell.NaturalPair primary={item.productName} secondary={item.revision} />
        ),
      },
      {
        header: "Formulator & Sales",
        accessor: "formulator",
        render: (item) => (
          <DnaCell.NaturalPair primary={item.formulator} secondary={`PIC: ${item.salesPic}`} />
        ),
      },
      {
        header: "Target Fungsi",
        accessor: "targetFunction",
        render: (item) => (
          <p className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">{item.targetFunction}</p>
        ),
      },
      {
        header: "Status",
        accessor: "status",
        align: "center",
        render: (item) => (
          <DnaBadge
            variant={
              item.status === "APPROVED"
                ? "success"
                : item.status === "REJECTED"
                ? "critical"
                : "warning"
            }
          >
            {item.status === "APPROVED"
              ? "DISETUJUI"
              : item.status === "REJECTED"
              ? "DITOLAK"
              : "MENUNGGU"}
          </DnaBadge>
        ),
      },
    ],
    []
  );

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PENJUALAN SAMPLE (R&D)"
      subtitle="Validasi formulasi sampel kosmetik, klaim uji klinis, kesesuaian regulasi BPOM, dan persetujuan pengiriman prototipe ke klien."
      categoryBadge="PENJUALAN SAMPLE ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Penjualan Sample" },
      ]}
      items={items}
      columns={columns}
      getDetailData={getDetailData}
      onApprove={onApprove}
      onReject={onReject}
      searchPlaceholder="Cari nomor sample, nama produk, brand, formulator..."
    />
  );
}
