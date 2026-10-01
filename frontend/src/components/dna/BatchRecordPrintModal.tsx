"use client";

import React from "react";
import { DnaPrintDocument, PrintCompanyInfo } from "./DnaPrintDocument";

export interface BatchRecordData {
  batchNumber: string;
  date: string;
  status: string;
  soCode?: string;
  salesDate?: string;
  customerName?: string;
  category?: string;
  createdBy: string;
  productName: string;
  productCode: string;
  formulaCode?: string;
  unit?: string;
  statusHistory?: Array<{
    description: string;
    by: string;
    date: string;
  }>;
}

interface BatchRecordPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BatchRecordData | null;
  companyInfo?: PrintCompanyInfo;
}

export function BatchRecordPrintModal({
  isOpen,
  onClose,
  data,
  companyInfo,
}: BatchRecordPrintModalProps) {
  if (!data) return null;

  const history = data.statusHistory?.length
    ? data.statusHistory
    : [
        {
          description: `Batch Record dibuat dengan status ${data.status}`,
          by: data.createdBy,
          date: data.date,
        },
      ];

  const historySection = (
    <div className="my-3">
      <div className="font-bold text-slate-900 text-[11px] mb-1.5">
        Riwayat Status
      </div>
      <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300 font-bold">
            <th className="p-1.5">Keterangan</th>
            <th className="p-1.5 w-32 text-center">Oleh</th>
            <th className="p-1.5 w-28 text-center">Tanggal</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h, i) => (
            <tr key={i} className="border-b border-slate-200">
              <td className="p-1.5">{h.description}</td>
              <td className="p-1.5 text-center">{h.by}</td>
              <td className="p-1.5 text-center">{h.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="BATCH RECORD"
      documentNumber={data.batchNumber}
      statusBadge={{
        label: data.status,
        variant: data.status === "COMPLETED" ? "success" : "neutral",
      }}
      date={data.date}
      companyInfo={companyInfo}
      recipientInfo={{
        title: "Informasi Sales:",
        name: data.customerName || "-",
        companyName: `Kode Sales: ${data.soCode || "-"} (Tgl: ${data.salesDate || "-"})`,
        attention: `Kategori: ${data.category || "Produk Baru"}`,
      }}
      metaFields={[
        { label: "Dibuat Oleh", value: data.createdBy },
        { label: "Kode Sales", value: data.soCode || "-" },
        { label: "Kategori Order", value: data.category || "Produk Baru" },
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
          width: "120px",
          render: () => (
            <span className="font-mono font-bold text-slate-800">
              {data.productCode}
            </span>
          ),
        },
        {
          key: "productName",
          header: "Nama Barang",
          render: () => (
            <div>
              <div className="font-bold text-slate-900">{data.productName}</div>
              {data.formulaCode && (
                <div className="text-[9.5px] text-slate-500">
                  {data.formulaCode}
                </div>
              )}
            </div>
          ),
        },
        {
          key: "unit",
          header: "Satuan",
          align: "center",
          width: "80px",
          render: () => data.unit || "pcs",
        },
      ]}
      items={[data]}
      customSections={historySection}
      signatures={[
        {
          title: "Dibuat oleh,",
          name: data.createdBy,
          role: "Production Admin",
        },
      ]}
    />
  );
}
