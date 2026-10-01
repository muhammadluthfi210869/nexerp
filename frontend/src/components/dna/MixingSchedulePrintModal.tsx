"use client";

import React from "react";
import { DnaPrintDocument, PrintCompanyInfo } from "./DnaPrintDocument";

export interface MixingScheduleData {
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
  nettoPerPcs: number;
  baseResultMl: number;
  upscalePercent: number;
  hasilUpscaleMl: number;
}

interface MixingSchedulePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MixingScheduleData | null;
  companyInfo?: PrintCompanyInfo;
}

export function MixingSchedulePrintModal({
  isOpen,
  onClose,
  data,
  companyInfo,
}: MixingSchedulePrintModalProps) {
  if (!data) return null;

  const detailSection = (
    <div className="space-y-4 my-3 text-[10.5px]">
      <div>
        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
          Detail Produksi
        </div>
        <table className="w-full border-collapse border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2 w-48 font-bold bg-slate-50">Target Qty (PCS)</td>
              <td className="p-2 font-bold text-slate-900">
                {Number(data.targetQtyPcs || 0).toLocaleString("id-ID")} PCS
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-bold bg-slate-50">Netto per PCS</td>
              <td className="p-2">
                {Number(data.nettoPerPcs || 0).toLocaleString("id-ID")} ml
              </td>
            </tr>
            <tr>
              <td className="p-2 font-bold bg-slate-50">Base Result</td>
              <td className="p-2 font-semibold">
                {Number(data.baseResultMl || 0).toLocaleString("id-ID")} ml
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
          Perhitungan Upscale
        </div>
        <table className="w-full border-collapse border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2 w-48 font-bold bg-slate-50">Upscale (%)</td>
              <td className="p-2 font-bold">
                {Number(data.upscalePercent || 0).toFixed(2)}%
              </td>
            </tr>
            <tr>
              <td className="p-2 font-bold bg-slate-50">Hasil Upscale</td>
              <td className="p-2 font-black text-blue-700 print:text-black">
                {Number(data.hasilUpscaleMl || 0).toLocaleString("id-ID")} ml
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded text-[9.5px] font-mono text-slate-600">
          <strong>Formula:</strong> Base Result + (Base Result × Upscale %) ={" "}
          {Number(data.baseResultMl || 0).toLocaleString("id-ID")} + (
          {Number(data.baseResultMl || 0).toLocaleString("id-ID")} ×{" "}
          {Number(data.upscalePercent || 0).toFixed(2)}%) ={" "}
          <strong>
            {Number(data.hasilUpscaleMl || 0).toLocaleString("id-ID")} ml
          </strong>
        </div>
      </div>
    </div>
  );

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="JADWAL MIXING"
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
        attention: `Kode Batch: ${data.batchCode} | SO: ${data.soCode}`,
      }}
      metaFields={[
        { label: "Dibuat Oleh", value: data.createdBy },
        { label: "Kode Batch", value: data.batchCode },
        { label: "Kategori", value: data.category || "Produk Baru" },
      ]}
      columns={[]}
      items={[]}
      customSections={detailSection}
      signatures={[
        {
          title: "Dibuat oleh,",
          name: data.createdBy,
          role: "Operator Mixing",
        },
      ]}
    />
  );
}
