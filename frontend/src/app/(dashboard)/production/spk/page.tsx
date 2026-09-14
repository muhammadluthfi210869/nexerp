"use client";

import React, { useState } from "react";
import {
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  Building2,
  Barcode,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  FlaskConical,
  Package,
  ShieldCheck,
  Award,
  Sparkles,
  Download
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast
} from "@/components/dna";
import Link from "next/link";

interface SpkDocumentData {
  spkCode: string;
  batchNumber: string;
  soCode: string;
  issueDate: string;
  targetDate: string;
  customerName: string;
  brandName: string;
  productName: string;
  bpomNa: string;
  category: string;
  nettoPerPcs: string;
  targetQtyPcs: number;
  baseResultKg: number;
  upscalePct: number;
  upscaleResultKg: number;
  formulaCode: string;
  formulaVersion: string;
  rawMaterials: {
    code: string;
    inciName: string;
    tradeName: string;
    phase: string;
    percentage: number;
    standardKg: number;
    upscaleKg: number;
    lotWarehouse: string;
  }[];
  steps: {
    stepNo: number;
    stage: string;
    instruction: string;
    criticalParams: string;
    operatorRole: string;
  }[];
}

const SPK_DATABASE: Record<string, SpkDocumentData> = {
  "SPK-2026-0042": {
    spkCode: "SPK-2026-0042",
    batchNumber: "BATCH-GLW-0909",
    soCode: "SO-2026-0188",
    issueDate: "2026-09-08",
    targetDate: "2026-09-12",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "GlowGoddess",
    productName: "Niacinamide 10% Brightening Serum",
    bpomNa: "NA18241900124",
    category: "Skincare",
    nettoPerPcs: "30 ml",
    targetQtyPcs: 5000,
    baseResultKg: 150.0,
    upscalePct: 3.0,
    upscaleResultKg: 154.5,
    formulaCode: "FORM-NIAC-V4.1",
    formulaVersion: "Rev 4.1 (CPKB Approved)",
    rawMaterials: [
      { code: "RM-AQ-001", inciName: "Aqua (Deionized Water)", tradeName: "Purified Water", phase: "Fase A (Basis)", percentage: 76.5, standardKg: 114.75, upscaleKg: 118.19, lotWarehouse: "LOT-AQ-260901" },
      { code: "RM-GLY-002", inciName: "Glycerin 99.7% USP", tradeName: "Glycerin USP", phase: "Fase A (Basis)", percentage: 5.0, standardKg: 7.50, upscaleKg: 7.73, lotWarehouse: "LOT-GLY-260815" },
      { code: "RM-BTY-003", inciName: "Butylene Glycol", tradeName: "1,3-Butanediol", phase: "Fase A (Basis)", percentage: 3.0, standardKg: 4.50, upscaleKg: 4.64, lotWarehouse: "LOT-BG-260720" },
      { code: "RM-HYA-004", inciName: "Sodium Hyaluronate", tradeName: "Hyaluronic Acid Multi-MW", phase: "Fase A (Basis)", percentage: 0.5, standardKg: 0.75, upscaleKg: 0.77, lotWarehouse: "LOT-HA-260810" },
      { code: "RM-NIA-005", inciName: "Niacinamide (Vitamin B3)", tradeName: "Niacinamide PC Grade", phase: "Fase B (Zat Aktif)", percentage: 10.0, standardKg: 15.00, upscaleKg: 15.45, lotWarehouse: "LOT-NIA-260828" },
      { code: "RM-ARB-006", inciName: "Alpha-Arbutin", tradeName: "Alpha-Arbutin Pure", phase: "Fase B (Zat Aktif)", percentage: 2.0, standardKg: 3.00, upscaleKg: 3.09, lotWarehouse: "LOT-ARB-260714" },
      { code: "RM-ALN-007", inciName: "Allantoin", tradeName: "Allantoin USP", phase: "Fase B (Zat Aktif)", percentage: 0.2, standardKg: 0.30, upscaleKg: 0.31, lotWarehouse: "LOT-ALN-260630" },
      { code: "RM-PRV-008", inciName: "Phenoxyethanol (and) Ethylhexylglycerin", tradeName: "Euxyl PE 9010", phase: "Fase C (Pengawet)", percentage: 0.8, standardKg: 1.20, upscaleKg: 1.24, lotWarehouse: "LOT-PE-260819" },
      { code: "RM-DIS-009", inciName: "Disodium EDTA", tradeName: "Disodium EDTA", phase: "Fase A (Basis)", percentage: 0.05, standardKg: 0.075, upscaleKg: 0.08, lotWarehouse: "LOT-EDTA-260512" },
      { code: "RM-XAN-010", inciName: "Xanthan Gum (Clear Grade)", tradeName: "Rheocare XGN", phase: "Fase A (Basis)", percentage: 0.35, standardKg: 0.525, upscaleKg: 0.54, lotWarehouse: "LOT-XAN-260805" },
      { code: "RM-CA-011", inciName: "Citric Acid (pH Adjuster)", tradeName: "Citric Acid Anhydrous", phase: "Fase D (Adjuster)", percentage: 1.6, standardKg: 2.40, upscaleKg: 2.47, lotWarehouse: "LOT-CA-260701" }
    ],
    steps: [
      { stepNo: 1, stage: "Penimbangan (Weighing)", instruction: "Timbang seluruh bahan di ruang timbang steril kelas C sesuai lot alokasi.", criticalParams: "Akurasi timbang ±0.1g, label identitas batch pada wadah", operatorRole: "Petugas Timbang & QC" },
      { stepNo: 2, stage: "Mixing Fase A (Bejana 500L)", instruction: "Masukkan Deionized Water ke bejana. Dispersikan Xanthan Gum & Disodium EDTA dengan Agitator 800 RPM hingga larut sempurna.", criticalParams: "Suhu 30-35°C, Agitator 800 RPM, Waktu 20 menit", operatorRole: "Operator Mixing" },
      { stepNo: 3, stage: "Mixing Fase B (Zat Aktif)", instruction: "Tambahkan Niacinamide 10% dan Alpha-Arbutin secara perlahan. Nyalakan homogenizer pada 2500 RPM sampai larutan jernih homogen.", criticalParams: "Suhu < 40°C, Homogenizer 2500 RPM, Waktu 15 menit", operatorRole: "Operator Mixing & IPC" },
      { stepNo: 4, stage: "Finishing & Preservative", instruction: "Tambahkan Euxyl PE 9010. Lakukan pengukuran pH aktual (target 5.2 - 5.8) dan viskositas (target 1000 - 1500 cPs).", criticalParams: "Target pH: 5.4, Viskositas: 1200 cPs", operatorRole: "QC In-Process" },
      { stepNo: 5, stage: "Filling Kemasan Primer", instruction: "Salurkan ruahan tersaring ke Line Filling Rotary 2. Isi ke botol pipet 30ml amber dengan uji tara berkala tiap 30 menit.", criticalParams: "Tare: 46.5g, Netto: 30.2g ±0.5g, Torsi: 1.8 Nm", operatorRole: "Operator Filling" },
      { stepNo: 6, stage: "Packaging Sekunder", instruction: "Pasang inner folding box emboss gold, leaflet cara pakai, dan segel hologram keaslian. Masukkan ke master carton 48 pcs.", criticalParams: "Scan Barcode NA BPOM OK, Hologram Rapi", operatorRole: "Operator Packaging" },
      { stepNo: 7, stage: "Rilis Karantina APJ", instruction: "Evaluasi hasil mikrobiologi 3x24 jam dan terbitkan Certificate of Analysis (CoA) rilis resmi.", criticalParams: "ALT < 10 CFU/g, Bebas Patogen, Tanda Tangan SIPA APJ", operatorRole: "Apoteker Penanggung Jawab (APJ)" }
    ]
  },
  "SPK-2026-0043": {
    spkCode: "SPK-2026-0043",
    batchNumber: "BATCH-AURA-0910",
    soCode: "SO-2026-0190",
    issueDate: "2026-09-09",
    targetDate: "2026-09-11",
    customerName: "CV Aura Skin Estetika",
    brandName: "AuraGlow",
    productName: "Centella Asiatica Soothing Gel Cream",
    bpomNa: "NA18240105581",
    category: "Skincare",
    nettoPerPcs: "50 gr",
    targetQtyPcs: 3000,
    baseResultKg: 150.0,
    upscalePct: 5.0,
    upscaleResultKg: 157.5,
    formulaCode: "FORM-CENT-V3.2",
    formulaVersion: "Rev 3.2 (Emulgel Base)",
    rawMaterials: [
      { code: "RM-AQ-001", inciName: "Aqua (Deionized Water)", tradeName: "Purified Water", phase: "Fase Air", percentage: 70.0, standardKg: 105.00, upscaleKg: 110.25, lotWarehouse: "LOT-AQ-260901" },
      { code: "RM-CENT-002", inciName: "Centella Asiatica Leaf Extract", tradeName: "Cica Extract 10:1", phase: "Fase Aktif", percentage: 5.0, standardKg: 7.50, upscaleKg: 7.88, lotWarehouse: "LOT-CICA-260812" },
      { code: "RM-CARB-003", inciName: "Carbomer 940", tradeName: "Carbopol 940", phase: "Fase Gelling", percentage: 0.8, standardKg: 1.20, upscaleKg: 1.26, lotWarehouse: "LOT-CARB-260719" },
      { code: "RM-TEA-004", inciName: "Triethanolamine 99%", tradeName: "TEA Pure", phase: "Fase Netralisasi", percentage: 0.7, standardKg: 1.05, upscaleKg: 1.10, lotWarehouse: "LOT-TEA-260625" }
    ],
    steps: [
      { stepNo: 1, stage: "Penimbangan", instruction: "Timbang bahan sesuai formula upscale 157.5 Kg.", criticalParams: "Validasi timbang", operatorRole: "Petugas Timbang" },
      { stepNo: 2, stage: "Mixing & Emulsi", instruction: "Kembangkan Carbomer pada suhu 70°C, netralisasi dengan TEA hingga terbentuk gel bening.", criticalParams: "Suhu 70°C, pH 5.6", operatorRole: "Operator Mixing" },
      { stepNo: 3, stage: "Filling Jar", instruction: "Pengisian ke acrylic pot jar 50gr.", criticalParams: "Netto 50.0g ±0.5g", operatorRole: "Operator Filling" },
      { stepNo: 4, stage: "Rilis APJ", instruction: "Pelepasan batch resmi ke Gudang Produk Jadi WH-03.", criticalParams: "CoA terbit", operatorRole: "APJ" }
    ]
  }
};

export default function SpkPrintablePage() {
  const toast = useDnaToast();
  const [selectedSpkCode, setSelectedSpkCode] = useState<string>("SPK-2026-0042");

  const data = SPK_DATABASE[selectedSpkCode] || SPK_DATABASE["SPK-2026-0042"];

  const handlePrint = () => {
    window.print();
  };

  return (
    <DnaPageContainer>
      <div className="print:hidden">
        <DnaPageHeader
          title="Dokumen Resmi SPK (Electronic Batch Record - EBMR)"
          subtitle="Lembar instruksi kerja manufaktur dan verifikasi tahapan standar Cara Pembuatan Kosmetika yang Baik (CPKB)"
          badge={
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Barcode className="w-3.5 h-3.5" />
              <span>Official CPKB Document</span>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href="/production/work-orders">
                <DnaButton variant="secondary" size="md">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Kembali ke SPK List
                </DnaButton>
              </Link>
              <select
                value={selectedSpkCode}
                onChange={(e) => setSelectedSpkCode(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                <option value="SPK-2026-0042">SPK-2026-0042 (Niacinamide Serum)</option>
                <option value="SPK-2026-0043">SPK-2026-0043 (Centella Cream)</option>
              </select>
              <DnaButton variant="primary" size="md" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Dokumen (Print / PDF)
              </DnaButton>
            </div>
          }
        />
      </div>

      {/* PRINTABLE EBMR DOCUMENT WRAPPER */}
      <div className="bg-white border border-slate-300 rounded-xl p-8 max-w-5xl mx-auto text-slate-900 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0">
        {/* KOP SURAT RESMI PABRIK MAKLON */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                NX
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight uppercase">PT AUREON NEXERP MANUFACTURING LAB</h1>
                <p className="text-[10px] text-slate-500 font-medium">Cosmetics Manufacturing & R&D Center • CPKB Certified License No: 442/CPKB/BPOM/2023</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-600">
              Kawasan Industri Kosmetika Terpadu Blok B-08, Jawa Barat • Telp: (021) 8990-2100 • Email: qa.production@nexerp.id
            </p>
          </div>

          <div className="text-right space-y-1">
            <div className="text-sm font-black text-slate-900 uppercase">SURAT PERINTAH KERJA (SPK)</div>
            <div className="text-[10px] font-mono text-slate-600">BATCH MANUFACTURING RECORD (EBMR)</div>
            <div className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-bold">
              {data.spkCode}
            </div>
          </div>
        </div>

        {/* INFORMASI UTAMA BATCH & PRODUK */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-6">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Nomor Batch Produksi</div>
            <div className="font-extrabold text-blue-800 font-mono text-sm">{data.batchNumber}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">No. Sales Order</div>
            <div className="font-semibold text-slate-900">{data.soCode}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Tanggal Terbit SPK</div>
            <div className="font-medium text-slate-800">{data.issueDate}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Target Selesai Rilis</div>
            <div className="font-medium text-slate-800">{data.targetDate}</div>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Nama Klien & Brand</div>
            <div className="font-bold text-slate-900">{data.customerName} ({data.brandName})</div>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Nama Produk & Nomor Notifikasi BPOM</div>
            <div className="font-bold text-slate-900">{data.productName} • <span className="font-mono text-blue-700">{data.bpomNa}</span></div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Kategori & Netto</div>
            <div className="font-semibold text-slate-900">{data.category} • {data.nettoPerPcs}</div>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Target Output (PCS)</div>
            <div className="font-extrabold text-slate-900">{data.targetQtyPcs.toLocaleString()} PCS</div>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Base Result (Teoritis)</div>
            <div className="font-semibold text-slate-800">{data.baseResultKg.toFixed(2)} Kg</div>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Hasil Upscale (+{data.upscalePct}%)</div>
            <div className="font-extrabold text-emerald-800">{data.upscaleResultKg.toFixed(2)} Kg</div>
          </div>
        </div>

        {/* TABEL 1: KOMPOSISI BAHAN BAKU & FORMULA TER-UPSCALE */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-blue-700" />
              <span>1. Formula Komposisi & Penimbangan Bahan (BOM Upscaled)</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Formula Ref: {data.formulaCode} ({data.formulaVersion})</span>
          </div>

          <table className="w-full text-left text-[11px] border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-2.5 py-2 border-b border-r border-slate-300">Kode</th>
                <th className="px-2.5 py-2 border-b border-r border-slate-300">Nama INCI / Kimia</th>
                <th className="px-2.5 py-2 border-b border-r border-slate-300">Fase</th>
                <th className="px-2.5 py-2 border-b border-r border-slate-300 text-right">%</th>
                <th className="px-2.5 py-2 border-b border-r border-slate-300 text-right">Standar (Kg)</th>
                <th className="px-2.5 py-2 border-b border-r border-slate-300 text-right bg-blue-50/60 font-black">Upscale (Kg)</th>
                <th className="px-2.5 py-2 border-b border-r border-slate-300">Lot Gudang</th>
                <th className="px-2.5 py-2 border-b border-slate-300 text-center">Paraf Timbang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.rawMaterials.map((rm, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-2.5 py-1.5 border-r border-slate-200 font-mono text-[10px]">{rm.code}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200">
                    <div className="font-semibold text-slate-900">{rm.tradeName}</div>
                    <div className="text-[9px] text-slate-500 italic">{rm.inciName}</div>
                  </td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 font-medium text-slate-700">{rm.phase}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right font-medium">{rm.percentage.toFixed(2)}%</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right text-slate-600">{rm.standardKg.toFixed(3)}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right font-bold text-blue-900 bg-blue-50/40">
                    {rm.upscaleKg.toFixed(3)}
                  </td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 font-mono text-[10px] text-slate-600">{rm.lotWarehouse}</td>
                  <td className="px-2.5 py-1.5 text-center text-slate-300 font-mono">______</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold text-[11px]">
                <td colSpan={3} className="px-2.5 py-2 border-r border-slate-300 text-right uppercase">Total Formula</td>
                <td className="px-2.5 py-2 border-r border-slate-300 text-right">100.00%</td>
                <td className="px-2.5 py-2 border-r border-slate-300 text-right">{data.baseResultKg.toFixed(2)} Kg</td>
                <td className="px-2.5 py-2 border-r border-slate-300 text-right font-black text-blue-900 bg-blue-100/60">
                  {data.upscaleResultKg.toFixed(2)} Kg
                </td>
                <td colSpan={2} className="px-2.5 py-2 text-center text-[10px] text-slate-500">Toleransi loss timbang max ±0.05%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TABEL 2: SOP & LEMBAR VERIFIKASI TAHAPAN CPKB */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-700" />
            <span>2. Instruksi Manufaktur & Lembar Verifikasi Tahapan CPKB</span>
          </h2>

          <table className="w-full text-left text-[11px] border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-2 py-2 border-b border-r border-slate-300 w-8 text-center">#</th>
                <th className="px-2.5 py-2 border-b border-r border-slate-300 w-36">Tahapan Proses</th>
                <th className="px-2.5 py-2 border-b border-r border-slate-300">Instruksi Kerja & Parameter Kritis</th>
                <th className="px-2.5 py-2 border-b border-r border-slate-300 w-36">Penanggung Jawab</th>
                <th className="px-2.5 py-2 border-b border-slate-300 w-28 text-center">Paraf & Jam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.steps.map((st) => (
                <tr key={st.stepNo} className="hover:bg-slate-50">
                  <td className="px-2 py-2 border-r border-slate-200 text-center font-bold text-slate-600">{st.stepNo}</td>
                  <td className="px-2.5 py-2 border-r border-slate-200 font-bold text-slate-900">{st.stage}</td>
                  <td className="px-2.5 py-2 border-r border-slate-200">
                    <div className="text-slate-800 font-medium">{st.instruction}</div>
                    <div className="text-[10px] text-indigo-800 font-semibold mt-0.5">Spesifikasi: {st.criticalParams}</div>
                  </td>
                  <td className="px-2.5 py-2 border-r border-slate-200 font-medium text-slate-700 text-[10px]">{st.operatorRole}</td>
                  <td className="px-2.5 py-2 text-center text-slate-300 font-mono text-[10px]">
                    <div>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">___:___ WIB</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LEMBAR TANDA TANGAN & PENGESAHAN AKHIR */}
        <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 text-xs">
          <div className="text-[11px] font-bold text-slate-800 uppercase mb-3 border-b border-slate-200 pb-1">
            Lembar Otorisasi & Pelepasan Batch Produksi
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-2 bg-white border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Dibuat Oleh (R&D / PPC)</div>
              <div className="h-12 flex items-center justify-center text-slate-300 font-mono">[ TTD ]</div>
              <div className="font-bold text-slate-800">Hendra Wijaya</div>
              <div className="text-[9px] text-slate-400">PPC & Formulator</div>
            </div>

            <div className="p-2 bg-white border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Disetujui (Kepala Produksi)</div>
              <div className="h-12 flex items-center justify-center text-slate-300 font-mono">[ TTD ]</div>
              <div className="font-bold text-slate-800">Budi Santoso</div>
              <div className="text-[9px] text-slate-400">Plant Production Head</div>
            </div>

            <div className="p-2 bg-white border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Diperiksa (In-Process QC)</div>
              <div className="h-12 flex items-center justify-center text-slate-300 font-mono">[ TTD ]</div>
              <div className="font-bold text-slate-800">Ahmad Fauzi</div>
              <div className="text-[9px] text-slate-400">QA / QC Inspector</div>
            </div>

            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
              <div className="text-[10px] text-emerald-800 font-bold uppercase">Rilis Akhir (APJ)</div>
              <div className="h-12 flex items-center justify-center text-emerald-400 font-mono">[ TTD & STEMPEL ]</div>
              <div className="font-bold text-emerald-900">apt. Siti Rahmawati, S.Farm</div>
              <div className="text-[9px] text-emerald-700 font-mono">SIPA: 19920815/SIPA_32.73/2022</div>
            </div>
          </div>
        </div>
      </div>
    </DnaPageContainer>
  );
}
