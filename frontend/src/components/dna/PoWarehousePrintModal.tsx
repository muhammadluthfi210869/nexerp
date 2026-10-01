"use client";

import React from "react";
import { DnaPrintDocument, PrintCompanyInfo } from "./DnaPrintDocument";

export interface PoWarehouseData {
  poNumber: string;
  orderDate: string;
  dueDate?: string;
  vendorName: string;
  vendorAddress?: string;
  vendorPhone?: string;
  warehouseName: string;
  warehouseAddress?: string;
  warehousePhone?: string;
  notes?: string;
  items: Array<{
    itemCode?: string;
    itemName: string;
    qty: number;
    unit?: string;
  }>;
}

interface PoWarehousePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PoWarehouseData | null;
  companyInfo?: PrintCompanyInfo;
}

export function PoWarehousePrintModal({
  isOpen,
  onClose,
  data,
  companyInfo,
}: PoWarehousePrintModalProps) {
  if (!data) return null;

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="PURCHASE ORDER — WAREHOUSE COPY"
      documentNumber={data.poNumber}
      statusBadge={{
        label: "Warehouse Copy (Non-Price)",
        variant: "neutral",
      }}
      date={data.orderDate}
      dueDate={data.dueDate}
      companyInfo={companyInfo}
      recipientInfo={{
        title: "Supplier / Vendor:",
        name: data.vendorName,
        address: data.vendorAddress,
        phone: data.vendorPhone,
      }}
      metaFields={[
        { label: "Gudang Penerima", value: data.warehouseName },
        { label: "Alamat Gudang", value: data.warehouseAddress || "-" },
        { label: "Kontak Gudang", value: data.warehousePhone || "-" },
      ]}
      columns={[
        {
          key: "idx",
          header: "No",
          align: "center",
          width: "35px",
          render: (_, i) => i + 1,
        },
        {
          key: "itemCode",
          header: "Kode Barang",
          width: "110px",
          render: (r) => (
            <span className="font-mono font-bold text-slate-800">
              {r.itemCode || "-"}
            </span>
          ),
        },
        {
          key: "itemName",
          header: "Nama Barang & Spesifikasi",
          render: (r) => (
            <div className="font-semibold text-slate-900">{r.itemName}</div>
          ),
        },
        {
          key: "qty",
          header: "Kuantitas Masuk",
          align: "right",
          width: "120px",
          render: (r) => (
            <span className="font-bold text-slate-900">
              {Number(r.qty || 0).toLocaleString("id-ID")} {r.unit || "pcs"}
            </span>
          ),
        },
      ]}
      items={data.items}
      notes={data.notes}
      signatures={[
        {
          title: "Diterima Oleh,",
          name: "Petugas Gudang (Inbound)",
          role: "Warehouse Staff",
        },
      ]}
    />
  );
}
