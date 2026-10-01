"use client";

import React from "react";
import { DnaPrintDocument } from "@/components/dna";
import type { ProductionScheduleItem } from "../_types/schedule.types";
import { STAGE_CONFIG, STATUS_CONFIG } from "../_types/schedule.types";

interface SpkPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ProductionScheduleItem | null;
}

export function SpkPrintModal({ isOpen, onClose, schedule }: SpkPrintModalProps) {
  if (!schedule) return null;

  const stageInfo = STAGE_CONFIG[schedule.stage] || { label: schedule.stage };
  const statusInfo = STATUS_CONFIG[schedule.status] || { label: schedule.status };

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="SURAT PERINTAH KERJA (SPK) PRODUKSI"
      documentNumber={schedule.spkCode}
      statusBadge={{
        label: `${stageInfo.label} — ${statusInfo.label}`,
        variant:
          schedule.status === "COMPLETED"
            ? "success"
            : schedule.status === "IN_PROGRESS"
            ? "warning"
            : "neutral",
      }}
      date={schedule.startDate}
      dueDate={schedule.endDate}
      companyInfo={{
        name: "PT AUREON KOSMETIKA INDONESIA",
        legalName: "Pabrik Maklon Kosmetik & Skincare CPKB",
        address: "Kawasan Industri Candi Blok C-12, Semarang, Jawa Tengah",
        city: "Semarang",
        phone: "(024) 7692-8819",
        email: "production@aureonmaklon.co.id",
        npwp: "01.892.441.7-503.000",
      }}
      recipientInfo={{
        title: "Perintah Pelaksanaan Kepada:",
        name: `Lini Produksi — ${stageInfo.label}`,
        companyName: `Mesin: ${schedule.machineName}`,
        attention: `Operator: ${schedule.operator}`,
      }}
      metaFields={[
        { label: "Nomor SPK", value: schedule.spkCode },
        { label: "Kode Jadwal", value: schedule.code },
        { label: "Referensi SO", value: schedule.soNumber },
        { label: "Pelanggan / Klien", value: `${schedule.customerName} (${schedule.brandName})` },
        { label: "Tahapan Line", value: stageInfo.label },
        { label: "Mesin / Ruang", value: schedule.machineName },
      ]}
      columns={[
        {
          key: "idx",
          header: "No",
          align: "center",
          width: "40px",
          render: (_: any, i: number) => i + 1,
        },
        {
          key: "productName",
          header: "Nama Produk & Spesifikasi Formula",
          render: () => (
            <div>
              <div className="font-bold text-slate-800">{schedule.productName}</div>
              <div className="text-[10px] text-slate-500">
                Brand: {schedule.brandName} • Standar Mutu CPKB BPOM
              </div>
            </div>
          ),
        },
        {
          key: "targetQty",
          header: "Target Batch Qty",
          align: "right",
          width: "140px",
          render: () => `${schedule.targetQty.toLocaleString("id-ID")} ${schedule.unit}`,
        },
        {
          key: "stage",
          header: "Tahapan",
          align: "center",
          width: "120px",
          render: () => stageInfo.label,
        },
        {
          key: "progress",
          header: "Status Progress",
          align: "center",
          width: "120px",
          render: () => `${schedule.progressPct}% Selesai`,
        },
      ]}
      items={[schedule]}
      summaryRows={[
        {
          label: "Total Volume Batch Produksi",
          value: `${schedule.targetQty.toLocaleString("id-ID")} ${schedule.unit}`,
          isBold: true,
          isHighlight: true,
        },
      ]}
      notes={[
        "1. Seluruh tahapan pengerjaan wajib mematuhi panduan Good Manufacturing Practice (CPKB).",
        "2. Operator wajib melakukan sanitasi ruangan & mesin sebelum dan sesudah batch dimulai.",
        "3. Lolos uji In-Process Control (IPC) oleh Quality Control (QC) adalah syarat mutlak rilis ke tahap berikutnya.",
        `4. Catatan Khusus: ${schedule.notes || "Pengerjaan sesuai SOP standar pabrik."}`,
      ]}
      signatures={[
        {
          title: "Dibuat (PPIC)",
          name: "Perencana Produksi",
          role: "PPIC Dept",
          date: schedule.startDate,
          isSigned: true,
        },
        {
          title: "Disetujui (Spv Produksi)",
          name: "Production Spv",
          role: "Supervisor Lini",
          date: schedule.startDate,
          isSigned: true,
        },
        {
          title: "Diperiksa (QC In-Process)",
          name: "QA/QC Inspector",
          role: "Quality Control",
          date: schedule.startDate,
          isSigned: true,
        },
        {
          title: "Diterima (Operator Lini)",
          name: schedule.operator,
          role: "Operator Pelaksana",
          date: schedule.startDate,
          isSigned: true,
        },
      ]}
    />
  );
}
