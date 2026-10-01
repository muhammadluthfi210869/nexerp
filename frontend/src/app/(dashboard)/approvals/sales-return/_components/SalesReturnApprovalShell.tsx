"use client";

import React, { useMemo } from "react";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaBadge,
  DnaCell,
} from "@/components/dna";
import type { SalesReturnApprovalItem } from "../_types/sales-return.types";

export interface SalesReturnApprovalShellProps {
  items: SalesReturnApprovalItem[];
  getDetailData: (item: SalesReturnApprovalItem) => ApprovalDetailData;
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string, reason: string) => Promise<any>;
}

export function SalesReturnApprovalShell({
  items,
  getDetailData,
  onApprove,
  onReject,
}: SalesReturnApprovalShellProps) {
  const columns: ApprovalColumn<SalesReturnApprovalItem>[] = useMemo(
    () => [
      {
        header: "Sales Order",
        accessor: "soNumber",
        sortable: true,
        render: (item) => <DnaCell.Code value={item.soNumber} subtitle={`Retur: ${item.code}`} />,
      },
      {
        header: "Klien & Brand",
        accessor: "customer",
        sortable: true,
        render: (item) => <DnaCell.Text primary={item.customer} secondary={item.brand} />,
      },
      {
        header: "Qty Retur",
        accessor: "totalQty",
        align: "right",
        sortable: true,
        render: (item) => <DnaCell.Number value={item.totalQty} suffix={`qty â€¢ ${item.itemCount} item`} />,
      },
      {
        header: "Gudang",
        accessor: "warehouse",
        render: (item) => (
          <span className="text-xs text-slate-600 whitespace-nowrap">{item.warehouse}</span>
        ),
      },
      {
        header: "Status Backend",
        accessor: "rawStatus",
        align: "center",
        render: (item) => (
          <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
            {item.rawStatus}
          </span>
        ),
      },
      {
        header: "Tanggal",
        accessor: "date",
        sortable: true,
        render: (item) => <DnaCell.Date value={item.date} />,
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
      title="PERSETUJUAN RETUR PENJUALAN"
      subtitle="Otorisasi penerimaan kembali barang jadi dari pelanggan, verifikasi penyebab cacat produk, dan penerbitan nota kredit (Credit Memo)."
      categoryBadge="RETUR PENJUALAN ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Retur Penjualan" },
      ]}
      items={items}
      columns={columns}
      getDetailData={getDetailData}
      onApprove={onApprove}
      onReject={onReject}
      searchPlaceholder="Cari nomor SO, nama pelanggan, catatan..."
    />
  );
}
