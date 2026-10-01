"use client";

import React from "react";
import { DnaPrintDocument, PrintCompanyInfo } from "./DnaPrintDocument";

export interface PackagingItem {
  code: string;
  name: string;
  qty: number;
  unit: string;
  notes?: string;
}

export interface PackagingScheduleData {
  scheduleCode: string;
  date: string;
  status: string;
  batchCode: string;
  soCode: string;
  customerName: string;
  productName: string;
  category?: string;
  createdBy: string;
  targetQtyPcs: number;
  secondaryPackaging: PackagingItem[];
}

interface PackagingSchedulePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PackagingScheduleData | null;
  companyInfo?: PrintCompanyInfo;
}

export function PackagingSchedulePrintModal({
  isOpen,
  onClose,
  data,
  companyInfo,
}: PackagingSchedulePrintModalProps) {
  if (!data) return null;

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="JADWAL PACKAGING"
      documentNumber={data.scheduleCode}
      statusBadge={{
        label: data.status,
        variant: "neutral",
      }}
      date={data.date}
      companyInfo={companyInfo}
      recipientInfo={{
        title: "Informasi Batch Record:",
        name: data.customerName,
        companyName: `Produk: ${data.productName}`,
        attention: `Batch: ${data.batchCode} | SO: ${data.soCode}`,
      }}
      metaFields={[
        { label: "Dibuat Oleh", value: data.createdBy },
        { label: "Target Produksi", value: `${data.targetQtyPcs.toLocaleString("id-ID")} PCS` },
        { label: "Kategori", value: data.category || "Produk Baru" },
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
          key: "code",
          header: "Kode Kemasan",
          width: "110px",
          render: (r) => (
            <span className="font-mono font-bold text-slate-800">{r.code}</span>
          ),
        },
        {
          key: "name",
          header: "Nama Kemasan Sekunder",
          render: (r) => (
            <div className="font-semibold text-slate-900">{r.name}</div>
          ),
        },
        {
          key: "qty",
          header: "Qty",
          align: "right",
          width: "80px",
          render: (r) => (
            <span className="font-bold">
              {Number(r.qty || 0).toLocaleString("id-ID")}
            </span>
          ),
        },
        {
          key: "unit",
          header: "Satuan",
          align: "center",
          width: "60px",
          render: (r) => r.unit,
        },
        {
          key: "notes",
          header: "Catatan",
          render: (r) => (
            <span className="text-slate-600 text-[10px]">{r.notes || "-"}</span>
          ),
        },
      ]}
      items={data.secondaryPackaging}
      signatures={[
        {
          title: "Dibuat oleh,",
          name: data.createdBy,
          role: "Staff Packaging",
        },
      ]}
    />
  );
}
