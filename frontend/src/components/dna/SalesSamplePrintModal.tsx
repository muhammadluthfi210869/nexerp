"use client";

import React from "react";
import { DnaPrintDocument, PrintCompanyInfo } from "./DnaPrintDocument";

export interface SalesSampleData {
  sampleCode: string;
  date: string;
  status: string;
  customerName: string;
  createdBy: string;
  formulator: string;
  netto: string;
  form: string;
  color: string;
  flavor: string;
  description: string;
  target?: string;
  reference?: string;
  materialRequest?: string;
  claim?: string;
  revision: string;
  products?: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
}

interface SalesSamplePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SalesSampleData | null;
  companyInfo?: PrintCompanyInfo;
}

export function SalesSamplePrintModal({
  isOpen,
  onClose,
  data,
  companyInfo,
}: SalesSamplePrintModalProps) {
  if (!data) return null;

  const sensorySection = (
    <div className="space-y-3 my-3 text-[10.5px]">
      <div>
        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5">
          Detail Karakteristik Produk
        </div>
        <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded">
          <div>
            Form: <strong>{data.form || "Krim"}</strong>
          </div>
          <div>
            Color: <strong>{data.color || "Beige Light"}</strong>
          </div>
          <div className="col-span-2">
            Flavor / Aroma: <strong>{data.flavor || "Sesuai R&D"}</strong>
          </div>
        </div>
      </div>

      <div>
        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5">
          Deskripsi & Spesifikasi Sensori
        </div>
        <div className="p-3 bg-white border border-slate-300 rounded space-y-2">
          <div className="whitespace-pre-wrap text-slate-800">
            {data.description}
          </div>
          {data.target && (
            <div className="pt-1.5 border-t border-slate-200">
              <span className="font-bold text-slate-700">Target Look: </span>
              {data.target}
            </div>
          )}
          {data.reference && (
            <div className="pt-1.5 border-t border-slate-200">
              <span className="font-bold text-slate-700">Referensi Pasar: </span>
              {data.reference}
            </div>
          )}
          {data.materialRequest && (
            <div className="pt-1.5 border-t border-slate-200">
              <span className="font-bold text-slate-700">Material Request: </span>
              {data.materialRequest}
            </div>
          )}
          {data.claim && (
            <div className="pt-1.5 border-t border-slate-200">
              <span className="font-bold text-slate-700">Klaim Produk: </span>
              {data.claim}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="SALES SAMPLE"
      documentNumber={data.sampleCode}
      statusBadge={{
        label: data.status,
        variant: "neutral",
      }}
      date={data.date}
      companyInfo={companyInfo}
      recipientInfo={{
        title: "Pelanggan & Formulator:",
        name: data.customerName,
        companyName: `Formulator: ${data.formulator}`,
        attention: `Netto: ${data.netto} | Revisi: ${data.revision}`,
      }}
      metaFields={[
        { label: "Dibuat Oleh", value: data.createdBy },
        { label: "Formulator R&D", value: data.formulator },
        { label: "Status Revisi", value: data.revision },
      ]}
      columns={[]}
      items={[]}
      customSections={sensorySection}
      signatures={[
        {
          title: "Dibuat oleh,",
          name: data.createdBy,
          role: "Commercial / Sales PIC",
        },
      ]}
    />
  );
}
