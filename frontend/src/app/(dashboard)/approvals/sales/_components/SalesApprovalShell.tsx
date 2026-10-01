"use client";

import React, { useMemo } from "react";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaBadge,
  DnaCell,
} from "@/components/dna";
import type { SalesOrderApprovalItem } from "../_types/sales.types";

export interface SalesApprovalShellProps {
  items: SalesOrderApprovalItem[];
  getDetailData: (item: SalesOrderApprovalItem) => ApprovalDetailData;
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string) => Promise<any>;
}

export function SalesApprovalShell({
  items,
  getDetailData,
  onApprove,
  onReject,
}: SalesApprovalShellProps) {
  const columns: ApprovalColumn<SalesOrderApprovalItem>[] = useMemo(
    () => [
      {
        header: "Nomor SO",
        accessor: "code",
        sortable: true,
        render: (item) => <DnaCell.Code value={item.code} />,
      },
      {
        header: "Klien & Brand",
        accessor: "customer",
        sortable: true,
        render: (item) => <DnaCell.Text primary={item.customer} secondary={item.brand} />,
      },
      {
        header: "Item / Qty",
        accessor: "itemsCount",
        align: "right",
        render: (item) => (
          <DnaCell.Number value={item.quantity} suffix={`qty â€¢ ${item.itemsCount} item`} />
        ),
      },
      {
        header: "Invoice DP",
        accessor: "dpStatus",
        align: "center",
        render: (item) => (
          <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
            {item.dpStatus}
          </span>
        ),
      },
      {
        header: "Tanggal / Jatuh Tempo",
        accessor: "date",
        render: (item) => (
          <DnaCell.Text primary={item.date} secondary={`Jatuh tempo: ${item.dueDate}`} />
        ),
      },
      {
        header: "Total Nominal",
        accessor: "totalAmount",
        align: "right",
        sortable: true,
        render: (item) => <DnaCell.Currency value={item.totalAmount} />,
      },
      {
        header: "Status",
        accessor: "status",
        align: "center",
        render: (item) => (
          <DnaBadge
            status={
              item.status === "APPROVED"
                ? "SUCCESS"
                : item.status === "REJECTED"
                ? "DANGER"
                : "WARNING"
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
    [],
  );

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PENJUALAN PRODUK (SALES ORDER)"
      subtitle="Otorisasi pemesanan maklon klien, verifikasi plafon kredit piutang (AR), dan penerbitan Surat Perintah Kerja (SPK) produksi."
      categoryBadge="PENJUALAN PRODUK ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Penjualan Produk" },
      ]}
      items={items}
      columns={columns}
      getDetailData={getDetailData}
      onApprove={onApprove}
      onReject={onReject}
      searchPlaceholder="Cari nomor SO, nama pelanggan, brand..."
    />
  );
}
