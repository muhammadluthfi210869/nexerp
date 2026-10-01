import React from "react";
import { ApprovalPageShell, type ApprovalColumn, type ApprovalDetailData } from "@/components/dna";
import type { GoodsRequestApprovalItem } from "../_types/goods-request.types";

interface GoodsRequestApprovalShellProps {
  items: GoodsRequestApprovalItem[];
  columns: ApprovalColumn<GoodsRequestApprovalItem>[];
  getDetailData: (item: GoodsRequestApprovalItem) => ApprovalDetailData;
  onApprove: (id: string, notes?: string) => Promise<void> | void;
  onReject: (id: string, reason: string) => Promise<void> | void;
}

export function GoodsRequestApprovalShell({
  items,
  columns,
  getDetailData,
  onApprove,
  onReject,
}: GoodsRequestApprovalShellProps) {
  return (
    <ApprovalPageShell
      title="PERSETUJUAN PERMINTAAN BARANG (MATERIAL REQUISITION)"
      subtitle="Validasi bon pengeluaran bahan baku, kemasan, dan transfer antar gudang untuk kelancaran eksekusi batch produksi SPK."
      categoryBadge="PERMINTAAN BARANG ~6"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Permintaan Barang" },
      ]}
      items={items}
      columns={columns}
      getDetailData={getDetailData}
      onApprove={onApprove}
      onReject={onReject}
      searchPlaceholder="Cari nomor bon, ref sales order, keterangan..."
    />
  );
}
