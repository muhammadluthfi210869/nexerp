"use client";

import React from "react";
import { DnaPrintDocument, PrintCompanyInfo } from "./DnaPrintDocument";

export interface StockOpnameItem {
  itemCode: string;
  itemName: string;
  unit: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  notes?: string;
}

export interface StockOpnameData {
  opnameNumber: string;
  date: string;
  warehouseName: string;
  createdBy: string;
  notes?: string;
  items: StockOpnameItem[];
}

interface StockOpnamePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StockOpnameData | null;
  companyInfo?: PrintCompanyInfo;
}

export function StockOpnamePrintModal({
  isOpen,
  onClose,
  data,
  companyInfo,
}: StockOpnamePrintModalProps) {
  if (!data) return null;

  let totalSys = 0;
  let totalAct = 0;
  let diffPos = 0;
  let diffNeg = 0;

  data.items.forEach((it) => {
    totalSys += Number(it.systemStock || 0);
    totalAct += Number(it.actualStock || 0);
    const d = Number(it.difference || 0);
    if (d > 0) diffPos += d;
    if (d < 0) diffNeg += d;
  });

  const totalDiff = totalAct - totalSys;

  const summarySection = (
    <div className="my-3 p-3 bg-slate-50 border border-slate-300 rounded-lg text-[10px] print:bg-transparent">
      <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
        Ringkasan Rekonsiliasi Opname Fisik:
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          Total Item Dihitung: <strong>{data.items.length} SKU</strong>
          <br />
          Total Stok Sistem:{" "}
          <strong>{totalSys.toLocaleString("id-ID")}</strong>
        </div>
        <div>
          Selisih Positif (+):{" "}
          <strong className="text-emerald-700">
            +{diffPos.toLocaleString("id-ID")}
          </strong>
          <br />
          Selisih Negatif (-):{" "}
          <strong className="text-rose-700">
            {diffNeg.toLocaleString("id-ID")}
          </strong>
        </div>
        <div>
          Total Stok Fisik Aktual:{" "}
          <strong>{totalAct.toLocaleString("id-ID")}</strong>
          <br />
          Net Total Selisih:{" "}
          <strong
            className={totalDiff < 0 ? "text-rose-700" : "text-emerald-700"}
          >
            {totalDiff > 0 ? "+" : ""}
            {totalDiff.toLocaleString("id-ID")}
          </strong>
        </div>
      </div>
    </div>
  );

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      orientation="landscape"
      documentType="LEMBAR REKONSILIASI STOCK OPNAME"
      documentNumber={data.opnameNumber}
      statusBadge={{
        label: "Opname Fisik Selesai",
        variant: "neutral",
      }}
      date={data.date}
      companyInfo={companyInfo}
      recipientInfo={{
        title: "Lokasi Gudang:",
        name: data.warehouseName,
        companyName: `Pelaksana: ${data.createdBy}`,
        attention: `Dokumen: ${data.opnameNumber}`,
      }}
      metaFields={[
        { label: "Gudang", value: data.warehouseName },
        { label: "Petugas Penghitung", value: data.createdBy },
        { label: "Catatan Opname", value: data.notes || "-" },
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
          width: "100px",
          render: (r) => (
            <span className="font-mono font-bold text-slate-800">
              {r.itemCode}
            </span>
          ),
        },
        {
          key: "itemName",
          header: "Nama Barang",
          render: (r) => (
            <div className="font-semibold text-slate-900">{r.itemName}</div>
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
          key: "systemStock",
          header: "Stok Sistem",
          align: "right",
          width: "110px",
          render: (r) => Number(r.systemStock || 0).toLocaleString("id-ID"),
        },
        {
          key: "actualStock",
          header: "Stok Fisik",
          align: "right",
          width: "110px",
          render: (r) => Number(r.actualStock || 0).toLocaleString("id-ID"),
        },
        {
          key: "difference",
          header: "Selisih",
          align: "right",
          width: "100px",
          render: (r) => {
            const diff = Number(r.difference || 0);
            return (
              <span
                className={`font-bold ${
                  diff < 0
                    ? "text-rose-700"
                    : diff > 0
                    ? "text-emerald-700"
                    : "text-slate-800"
                }`}
              >
                {diff > 0 ? "+" : ""}
                {diff.toLocaleString("id-ID")}
              </span>
            );
          },
        },
        {
          key: "notes",
          header: "Keterangan",
          render: (r) => (
            <span className="text-slate-600 text-[10px]">
              {r.notes || "-"}
            </span>
          ),
        },
      ]}
      items={data.items}
      customSections={summarySection}
      notes={data.notes}
      signatures={[
        {
          title: "Dihitung Oleh,",
          name: data.createdBy,
          role: "Pelaksana Opname",
        },
        {
          title: "Diverifikasi Oleh,",
          name: "Auditor Persediaan",
          role: "Inventory Controller",
        },
      ]}
    />
  );
}
