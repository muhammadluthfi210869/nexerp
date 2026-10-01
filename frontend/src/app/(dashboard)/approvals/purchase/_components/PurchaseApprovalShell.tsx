"use client";

import React, { useMemo } from "react";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaBadge,
  DnaCell,
} from "@/components/dna";
import type { PurchaseApprovalItem } from "../_types/purchase.types";

export interface PurchaseApprovalShellProps {
  items: PurchaseApprovalItem[];
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string, reason: string) => Promise<any>;
}

export function PurchaseApprovalShell({
  items,
  onApprove,
  onReject,
}: PurchaseApprovalShellProps) {
  const columns: ApprovalColumn<PurchaseApprovalItem>[] = useMemo(
    () => [
      {
        header: "Nomor PO",
        accessor: "code",
        sortable: true,
        render: (item) => <DnaCell.Code value={item.code} />,
      },
      {
        header: "Supplier & Gudang Tujuan",
        accessor: "supplier",
        sortable: true,
        render: (item) => <DnaCell.Text primary={item.supplier} secondary={item.warehouse} />,
      },
      {
        header: "Pemohon",
        accessor: "requesterName",
        render: (item) => (
          <DnaCell.Text primary={item.requesterName} secondary={item.creatorRole} />
        ),
      },
      {
        header: "Termin & Tgl",
        accessor: "date",
        render: (item) => <DnaCell.Text primary={item.paymentTerm} secondary={`Tgl: ${item.date}`} />,
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

  const buildDetailData = (item: PurchaseApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Persetujuan Purchase Order: ${item.supplier}`,
    category: "PENGADAAN PEMBELIAN",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.supplier,
    partnerLabel: "Supplier Vendor",
    warehouseName: item.warehouse,
    totalAmount: item.totalAmount,
    notes: item.notes,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "PO tercatat di sistem oleh Procurement",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Otorisasi purchase order",
        actor: "Menunggu keputusan approver",
        role: "Management",
        timestamp: item.status === "PENDING" ? "Menunggu eksekusi" : item.date,
        status:
          item.status === "APPROVED"
            ? "completed"
            : item.status === "REJECTED"
            ? "failed"
            : "pending",
      },
    ],
  });

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PEMBELIAN (PURCHASE ORDER)"
      subtitle="Verifikasi dan otorisasi pengadaan purchase order, plafon harga vendor supplier, dan jadwal kedatangan gudang."
      categoryBadge="PEMBELIAN ~4"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Pembelian" },
      ]}
      items={items}
      columns={columns}
      getDetailData={buildDetailData}
      onApprove={onApprove}
      onReject={onReject}
      searchPlaceholder="Cari nomor PO, nama vendor supplier, pemohon..."
    />
  );
}
