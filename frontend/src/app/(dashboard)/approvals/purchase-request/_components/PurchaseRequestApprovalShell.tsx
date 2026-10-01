import React from "react";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
} from "@/components/dna";
import type { PurchaseRequestApprovalItem } from "../_types/purchase-request.types";

interface PurchaseRequestApprovalShellProps {
  items: PurchaseRequestApprovalItem[];
  columns: ApprovalColumn<PurchaseRequestApprovalItem>[];
  getDetailData: (item: PurchaseRequestApprovalItem) => ApprovalDetailData;
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string, reason: string) => Promise<any>;
}

export function PurchaseRequestApprovalShell({
  items,
  columns,
  getDetailData,
  onApprove,
  onReject,
}: PurchaseRequestApprovalShellProps) {
  return (
    <ApprovalPageShell
      title="PERSETUJUAN PERMINTAAN PEMBELIAN (PURCHASE REQUEST)"
      subtitle="Validasi surat permintaan pembelian (PR) internal divisi, verifikasi anggaran belanja OPEX/CAPEX, dan penerbitan PO ke supplier."
      categoryBadge="PERMINTAAN PEMBELIAN ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Permintaan Pembelian" },
      ]}
      items={items}
      columns={columns}
      getDetailData={getDetailData}
      onApprove={onApprove}
      onReject={onReject}
      searchPlaceholder="Cari nomor PR, gudang pemohon, justifikasi..."
    />
  );
}
