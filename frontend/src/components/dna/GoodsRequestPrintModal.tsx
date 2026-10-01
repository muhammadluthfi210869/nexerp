"use client";

import React from "react";
import { DnaPrintDocument, PrintCompanyInfo } from "./DnaPrintDocument";

export interface GoodsRequestItem {
  itemCode: string;
  itemName: string;
  unit: string;
  qtyRequested: number;
  qtyApproved?: number;
  qtyIssued?: number;
  qtyUsed?: number;
  qtyReturned?: number;
  qtyDifference?: number;
}

export interface GoodsRequestData {
  requestNumber: string;
  requestDate: string;
  status: string;
  requestingDept: string;
  sourceWarehouse: string;
  createdBy: string;
  notes?: string;
  items: GoodsRequestItem[];
}

interface GoodsRequestPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GoodsRequestData | null;
  companyInfo?: PrintCompanyInfo;
}

export function GoodsRequestPrintModal({
  isOpen,
  onClose,
  data,
  companyInfo,
}: GoodsRequestPrintModalProps) {
  if (!data) return null;

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      orientation="landscape"
      documentType="PERMINTAAN BARANG (GOODS REQUISITION)"
      documentNumber={data.requestNumber}
      statusBadge={{
        label: data.status,
        variant: data.status === "APPROVED" ? "success" : "warning",
      }}
      date={data.requestDate}
      companyInfo={companyInfo}
      recipientInfo={{
        title: "Departemen Peminta:",
        name: data.requestingDept,
        companyName: `Gudang Penyedia: ${data.sourceWarehouse}`,
        attention: `Pembuat: ${data.createdBy}`,
      }}
      metaFields={[
        { label: "Gudang Penyedia", value: data.sourceWarehouse },
        { label: "PIC Pembuat", value: data.createdBy },
        { label: "Catatan", value: data.notes || "-" },
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
          width: "95px",
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
          key: "qtyRequested",
          header: "Qty Diminta",
          align: "right",
          width: "90px",
          render: (r) => (
            <span className="font-bold">
              {Number(r.qtyRequested || 0).toLocaleString("id-ID")}
            </span>
          ),
        },
        {
          key: "qtyApproved",
          header: "Qty Disetujui",
          align: "right",
          width: "90px",
          render: (r) => Number(r.qtyApproved || 0).toLocaleString("id-ID"),
        },
        {
          key: "qtyIssued",
          header: "Qty Dikeluarkan",
          align: "right",
          width: "95px",
          render: (r) => Number(r.qtyIssued || 0).toLocaleString("id-ID"),
        },
        {
          key: "qtyUsed",
          header: "Qty Digunakan",
          align: "right",
          width: "90px",
          render: (r) => Number(r.qtyUsed || 0).toLocaleString("id-ID"),
        },
        {
          key: "qtyReturned",
          header: "Qty Dikembalikan",
          align: "right",
          width: "105px",
          render: (r) => Number(r.qtyReturned || 0).toLocaleString("id-ID"),
        },
        {
          key: "qtyDifference",
          header: "Qty Selisih",
          align: "right",
          width: "85px",
          render: (r) => (
            <span className="font-bold text-slate-900">
              {Number(r.qtyDifference || 0).toLocaleString("id-ID")}
            </span>
          ),
        },
      ]}
      items={data.items}
      notes={data.notes}
      signatures={[
        {
          title: "Pembuat,",
          name: data.createdBy,
          role: "Staff Peminta",
        },
        {
          title: "Disetujui Oleh,",
          name: "Supervisor Gudang",
          role: "Head of Warehouse",
        },
      ]}
    />
  );
}
