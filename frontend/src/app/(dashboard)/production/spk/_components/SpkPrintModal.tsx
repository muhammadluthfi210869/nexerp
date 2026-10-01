"use client";

import React from "react";
import { DnaPrintDocument } from "@/components/dna";
import { SpkItem, SPK_STATUS_CONFIG } from "../_types/spk.types";

interface SpkPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SpkItem | null;
}

export function SpkPrintModal({ isOpen, onClose, item }: SpkPrintModalProps) {
  if (!item) return null;

  const batchWeightKg = ((item.orderQty * 50) / 1000).toFixed(1); // Estimasi netto 50g per pcs

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="SURAT PERINTAH KERJA (SPK) PRODUKSI & DISPENSING"
      documentNumber={item.spkCode}
      statusBadge={{
        label: SPK_STATUS_CONFIG[item.status]?.label || item.status,
        variant: item.status === "COMPLETED" ? "success" : item.status === "IN_PROGRESS" ? "warning" : "neutral",
      }}
      date={item.issueDate}
      dueDate={item.targetDate}
      companyInfo={{
        name: "PT AUREON KOSMETIKA INDONESIA",
        legalName: "Pabrik Formulasi & Manufaktur Kosmetik Standar CPKB Golongan A",
        address: "Kawasan Industri Candi Blok C-12, Semarang, Jawa Tengah 50181",
        city: "Semarang",
        phone: "(024) 7692-8819",
        email: "production@aureonmaklon.co.id",
        npwp: "01.892.441.7-503.000",
      }}
      recipientInfo={{
        title: "Perintah Pelaksanaan Lini Pabrik:",
        name: `Lini Produksi: ${item.machineLine}`,
        companyName: `Pelanggan: ${item.customerName} (${item.brandName})`,
        address: `Alokasi Mesin: ${item.machineLine} • Supervisor: ${item.supervisor}`,
        attention: `Standar Mutu: CPKB BPOM RI • No. Dokumen: DOK-CPKB/SPK/${item.spkCode.replace(/[^a-zA-Z0-9]/g, "")}`,
      }}
      metaFields={[
        { label: "Nomor SPK / Batch", value: item.spkCode },
        { label: "Nomor SO Referensi", value: item.soNumber },
        { label: "Nama Produk Jadi", value: item.productName },
        { label: "Kategori Sediaan", value: item.category },
        { label: "Target Output Kuantiti", value: `${item.orderQty.toLocaleString("id-ID")} ${item.unit} (± ${batchWeightKg} Kg)` },
        { label: "Batas Akhir Selesai", value: item.targetDate },
      ]}
      columns={[
        { key: "no", header: "No", width: "35px", align: "center", render: (_: any, i: number) => i + 1 },
        { key: "tahap", header: "Tahapan Alur Proses CPKB", align: "left" },
        { key: "mesin", header: "Mesin / Ruangan", width: "130px", align: "left" },
        { key: "parameter", header: "Parameter Kritis & Batas Standar Mutu", align: "left" },
        { key: "output", header: "Target Output", width: "110px", align: "right" },
        { key: "status", header: "Status", width: "85px", align: "center" },
      ]}
      items={[
        {
          tahap: "1. Penimbangan & Dispensing Raw Material",
          mesin: "Ruang Timbang Kelas D",
          parameter: "Akurasi timbangan digital ±0.05g, verifikasi COA & Exp Date aktif",
          output: `100% BOM Terverifikasi`,
          status: "Selesai",
        },
        {
          tahap: "2. Mixing & Emulsifikasi Homogenizer",
          mesin: item.machineLine,
          parameter: "Suhu fase 75-80°C, Homogenizer 3000 RPM selama 40 menit, Vakum -0.8 bar",
          output: `${batchWeightKg} Kg Bulk`,
          status: "Berjalan",
        },
        {
          tahap: "3. In-Process Control (IPC) Fisika/Kimia",
          mesin: "Laboratorium QC Floor",
          parameter: "Uji pH (5.5 - 6.5), Viskositas (3,500 - 4,500 cPs), Berat jenis, Homogenitas",
          output: "Lolos Lab IPC",
          status: "Standar",
        },
        {
          tahap: "4. Filling & Primary Sealing",
          mesin: "Clean Room Kelas C",
          parameter: "Netto seragam ±0.5g, sealing kedap udara suhu 180°C, no leaker",
          output: `${item.orderQty.toLocaleString("id-ID")} Pcs`,
          status: "Siap",
        },
        {
          tahap: "5. Coding Batch, Labelling & Box Packing",
          mesin: "Conveyor Line Sekunder",
          parameter: "Tercetak jelas No. Batch, Exp Date, No. BPOM NA, packing box rapi",
          output: `${item.orderQty.toLocaleString("id-ID")} Pcs`,
          status: "Antrean",
        },
      ]}
      customSections={
        <div className="space-y-3.5 print:space-y-2.5">
          {/* 1. Formulasi Bill of Materials (BOM) Dispensing */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 print:bg-white print:border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
              <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-800">
                1. Bill of Materials (BOM) & Lembar Verifikasi Penimbangan Bahan
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                SOP-DISP-01 &bull; Ruang Penimbangan Bersih
              </span>
            </div>
            <table className="w-full text-[9.5px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-1.5 text-center w-8 border-r border-slate-300">#</th>
                  <th className="p-1.5 text-left border-r border-slate-300">Kode Bahan</th>
                  <th className="p-1.5 text-left border-r border-slate-300">Nama Bahan Baku (INCI / Function)</th>
                  <th className="p-1.5 text-center border-r border-slate-300 w-24">No. Lot / Batch</th>
                  <th className="p-1.5 text-right border-r border-slate-300 w-16">% Formula</th>
                  <th className="p-1.5 text-right border-r border-slate-300 w-24">Std Timbang (Kg)</th>
                  <th className="p-1.5 text-center border-r border-slate-300 w-24">Aktual Timbang</th>
                  <th className="p-1.5 text-center w-16">Paraf</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">1</td>
                  <td className="p-1.5 font-mono border-r border-slate-200">RM-AQ-001</td>
                  <td className="p-1.5 font-medium border-r border-slate-200">Deionized Water (Aqua Purificata)</td>
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">LOT-202603-01</td>
                  <td className="p-1.5 text-right border-r border-slate-200">72.50%</td>
                  <td className="p-1.5 text-right font-bold border-r border-slate-200">{((Number(batchWeightKg) * 72.5) / 100).toFixed(2)}</td>
                  <td className="p-1.5 text-center border-r border-slate-200 bg-slate-50 print:bg-white">[ .......... ]</td>
                  <td className="p-1.5 text-center">[ ... ]</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">2</td>
                  <td className="p-1.5 font-mono border-r border-slate-200">RM-GL-014</td>
                  <td className="p-1.5 font-medium border-r border-slate-200">Vegetable Glycerin 99.7% USP</td>
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">LOT-202602-88</td>
                  <td className="p-1.5 text-right border-r border-slate-200">8.00%</td>
                  <td className="p-1.5 text-right font-bold border-r border-slate-200">{((Number(batchWeightKg) * 8.0) / 100).toFixed(2)}</td>
                  <td className="p-1.5 text-center border-r border-slate-200 bg-slate-50 print:bg-white">[ .......... ]</td>
                  <td className="p-1.5 text-center">[ ... ]</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">3</td>
                  <td className="p-1.5 font-mono border-r border-slate-200">RM-NC-007</td>
                  <td className="p-1.5 font-medium border-r border-slate-200">Niacinamide PC Grade (Vitamin B3)</td>
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">LOT-202601-45</td>
                  <td className="p-1.5 text-right border-r border-slate-200">5.00%</td>
                  <td className="p-1.5 text-right font-bold border-r border-slate-200">{((Number(batchWeightKg) * 5.0) / 100).toFixed(2)}</td>
                  <td className="p-1.5 text-center border-r border-slate-200 bg-slate-50 print:bg-white">[ .......... ]</td>
                  <td className="p-1.5 text-center">[ ... ]</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">4</td>
                  <td className="p-1.5 font-mono border-r border-slate-200">RM-HA-021</td>
                  <td className="p-1.5 font-medium border-r border-slate-200">Sodium Hyaluronate (Multi-molecular)</td>
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">LOT-202603-12</td>
                  <td className="p-1.5 text-right border-r border-slate-200">2.00%</td>
                  <td className="p-1.5 text-right font-bold border-r border-slate-200">{((Number(batchWeightKg) * 2.0) / 100).toFixed(2)}</td>
                  <td className="p-1.5 text-center border-r border-slate-200 bg-slate-50 print:bg-white">[ .......... ]</td>
                  <td className="p-1.5 text-center">[ ... ]</td>
                </tr>
                <tr>
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">5</td>
                  <td className="p-1.5 font-mono border-r border-slate-200">RM-CB-003</td>
                  <td className="p-1.5 font-medium border-r border-slate-200">Centella Asiatica (Cica) Leaf Extract</td>
                  <td className="p-1.5 text-center font-mono border-r border-slate-200">LOT-202602-09</td>
                  <td className="p-1.5 text-right border-r border-slate-200">12.50%</td>
                  <td className="p-1.5 text-right font-bold border-r border-slate-200">{((Number(batchWeightKg) * 12.5) / 100).toFixed(2)}</td>
                  <td className="p-1.5 text-center border-r border-slate-200 bg-slate-50 print:bg-white">[ .......... ]</td>
                  <td className="p-1.5 text-center">[ ... ]</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Critical Process Parameters (CPP) & Line Clearance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 print:bg-white text-[9.5px]">
              <div className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
                2. Parameter Kritis Mesin (CPP)
              </div>
              <ul className="space-y-1 text-slate-700">
                <li className="flex justify-between"><span>Suhu Fase Pemanasan:</span><span className="font-bold">75°C - 80°C</span></li>
                <li className="flex justify-between"><span>Kecepatan Homogenizer:</span><span className="font-bold">2,800 - 3,200 RPM</span></li>
                <li className="flex justify-between"><span>Waktu Emulsifikasi:</span><span className="font-bold">35 Menit (Vakum Aktif)</span></li>
                <li className="flex justify-between"><span>Standar IPC pH Akhir:</span><span className="font-bold">5.50 - 6.50 (@25°C)</span></li>
                <li className="flex justify-between"><span>Standar Viskositas:</span><span className="font-bold">3,500 - 4,500 cPs</span></li>
              </ul>
            </div>

            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 print:bg-white text-[9.5px]">
              <div className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
                3. Checklist Line Clearance CPKB
              </div>
              <ul className="space-y-1 text-slate-700">
                <li className="flex justify-between"><span>1. Ruangan bersih bebas batch lain:</span><span className="font-bold text-emerald-700">[ √ ] Terverifikasi</span></li>
                <li className="flex justify-between"><span>2. Timbangan terkalibrasi harian:</span><span className="font-bold text-emerald-700">[ √ ] Terverifikasi</span></li>
                <li className="flex justify-between"><span>3. Mesin disanitasi alkohol 70%:</span><span className="font-bold text-emerald-700">[ √ ] Terverifikasi</span></li>
                <li className="flex justify-between"><span>4. Label status BERSIH terpasang:</span><span className="font-bold text-emerald-700">[ √ ] Terpasang</span></li>
                <li className="flex justify-between"><span>5. Operator APD lengkap (masker/sarung):</span><span className="font-bold text-emerald-700">[ √ ] Sesuai SOP</span></li>
              </ul>
            </div>
          </div>
        </div>
      }
      notes={[
        item.notes || "Instruksi Khusus: Patuhi SOP penimbangan dan sanitasi mesin CPKB kelas C/D.",
        "Setiap deviasi parameter suhu / pH wajib dihentikan sementara dan dilaporkan kepada Apoteker Penanggung Jawab (APJ) QA.",
        "Dokumen SPK ini merupakan lampiran wajib yang harus dilekatkan pada Catatan Pengolahan Batch (Digital Batch Record).",
      ]}
      signatures={[
        { title: "Dibuat Oleh", role: "PPIC Planner", name: "Rina Wijaya, S.T.", isSigned: true, date: item.issueDate },
        { title: "Ditimbang Oleh", role: "Dispensing Operator", name: "Budi Santoso", isSigned: true, date: item.issueDate },
        { title: "Dilaksanakan Oleh", role: "Supervisor Produksi", name: item.supervisor, isSigned: true, date: item.issueDate },
        { title: "Disetujui & Diverifikasi", role: "QA Manager / APJ", name: "apt. Hendra Kusuma, S.Farm.", isSigned: true, date: item.issueDate },
      ]}
      paperMode="A4"
    />
  );
}
