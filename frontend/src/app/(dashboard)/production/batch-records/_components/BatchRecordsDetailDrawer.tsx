"use client";

import React from "react";
import { FlaskConical, CheckCircle2, ShieldCheck, ArrowRight, Printer } from "lucide-react";
import { DnaInspectionModal, DnaBadge, DnaButton } from "@/components/dna";
import { BatchRecordItem, BMR_STATUS_CONFIG } from "../_types/batch-records.types";

interface BatchRecordsDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: BatchRecordItem | null;
  onPrint?: (item: BatchRecordItem) => void;
}

export function BatchRecordsDetailDrawer({
  isOpen,
  onClose,
  item,
  onPrint,
}: BatchRecordsDetailDrawerProps) {
  if (!item) return null;

  const statusInfo = BMR_STATUS_CONFIG[item.qcReleaseStatus] || {
    label: item.qcReleaseStatus,
    badge: "default",
  };

  const badgeVariant =
    statusInfo.badge === "success"
      ? "success"
      : statusInfo.badge === "warning"
      ? "warning"
      : statusInfo.badge === "danger"
      ? "critical"
      : "info";

  return (
    <DnaInspectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Batch Record (BMR CPKB)"
      documentCode={item.batchRecordCode}
      subtitle={`Produk: ${item.productName} • Formulasi: ${item.formulaRef} • SPK: ${item.spkRef}`}
      statusBadge={
        <DnaBadge variant={badgeVariant as any}>
          {statusInfo.label}
        </DnaBadge>
      }
      metrics={[
        {
          label: "Ukuran Batch Bulk",
          value: `${item.batchSizeKg.toLocaleString("id-ID")} Kg`,
          variant: "brand",
        },
        {
          label: "Realisasi Yield",
          value: `${item.yieldPct}%`,
          variant: item.yieldPct >= 95 ? "success" : "warning",
        },
        {
          label: "Estimasi Output Jadi",
          value: `${(item.targetPcs || 5000).toLocaleString("id-ID")} Pcs`,
          variant: "neutral",
        },
        {
          label: "Tgl Mulai Olah",
          value: item.startDate,
          variant: "neutral",
        },
      ]}
      referenceDocuments={[
        {
          label: "Surat Perintah Kerja (SPK)",
          code: item.spkRef,
          href: `/production/schedule`,
        },
        {
          label: "Formula Repository",
          code: item.formulaRef,
          href: `/samples/repository`,
        },
        {
          label: "Klien Maklon & Brand",
          code: `${item.customerName || "Klien Maklon"} (${item.brandName || "Brand"})`,
          href: `/penjualan/client-manager`,
        },
      ]}
      onPrint={() => {
        if (onPrint) onPrint(item);
      }}
      primaryAction={{
        label: "Verifikasi QC Lab",
        icon: <ShieldCheck className="w-4 h-4" />,
        onClick: () => {
          window.location.href = "/quality/lab-test";
        },
        variant: "primary",
      }}
    >
      <div className="space-y-5 text-xs">
        {/* CPKB Compliance & APJ Header Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Standar CPKB & Pengawasan Teknis
            </span>
            <span className="font-bold text-slate-900 text-sm block">{item.productName}</span>
            <span className="text-slate-500 text-[11px]">
              Formulator / APJ: <strong className="text-slate-800">{item.formulatorPic}</strong> • SPK:{" "}
              <strong className="text-slate-800">{item.spkRef}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200 text-xs">
              {item.formulaRef}
            </span>
          </div>
        </div>

        {/* 6-Stage Process Breakdown for Cosmetic Manufacturing */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Alur Tahapan Pengolahan & Kontrol Parameter Kritis (BMR)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">1. Penimbangan (Dispensing)</span>
              <p className="font-semibold text-slate-800">Bahan Baku Terverifikasi</p>
              <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Akurasi timbangan ±0.1%
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">2. Peleburan & Mixing</span>
              <p className="font-semibold text-slate-800">Suhu 70°C - 75°C (40 RPM)</p>
              <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Fase minyak & air homogen
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">3. Emulsifikasi Vakum</span>
              <p className="font-semibold text-slate-800">3000 RPM (-0.8 Bar)</p>
              <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Tekstur halus bebas gelembung
              </span>
            </div>
          </div>
        </div>

        {/* Formulator Notes */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
            Catatan Formulator / APJ:
          </span>
          <p className="text-slate-600 italic">
            {item.notes || "Proses mixing dan homogenisasi sesuai SOP BMR CPKB. Parameter pH, viskositas, dan stabilitas fisik memenuhi standar rilis QC."}
          </p>
        </div>
      </div>
    </DnaInspectionModal>
  );
}

