"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Printer,
  ArrowLeft,
  Barcode,
  FlaskConical,
  Layers,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
} from "@/components/dna";
import Link from "next/link";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

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
  apjSignatureUrl: string | null;
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

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "—";

export default function SpkPrintablePage() {
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>("");

  // Batch record list — the SPK/EBMR document is rendered from real batch data.
  const {
    data: batchRecords,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useQuery<any[]>({
    queryKey: ["production-batch-records"],
    queryFn: async () => {
      const res = await api.get("/production/batch-records");
      const body = unwrapResponse<any>(res);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const activeBatchNo = selectedBatchNo || batchRecords?.[0]?.batchNo || "";

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useQuery<any>({
    queryKey: ["production-batch-record-detail", activeBatchNo],
    enabled: !!activeBatchNo,
    queryFn: async () => {
      const res = await api.get(`/production/batch-records/${activeBatchNo}/detail`);
      return unwrapResponse<any>(res);
    },
  });

  const data: SpkDocumentData | null = useMemo(() => {
    if (!detail) return null;

    const workOrder = detail.workOrders?.[0];
    const schedules: any[] = workOrder?.schedules ?? [];
    const lead = detail.so?.lead;

    const materials = schedules.flatMap((sch) => sch.stepDetails ?? []);
    const totalTheoretical = materials.reduce(
      (sum, det) => sum + Number(det.qtyTheoretical || 0),
      0,
    );
    const totalActual = materials.reduce(
      (sum, det) => sum + Number(det.qtyActual || 0),
      0,
    );

    return {
      spkCode: detail.batchNo,
      batchNumber: detail.batchNo,
      soCode: detail.so?.soNumber || "—",
      issueDate: fmtDate(detail.apjReleasedAt || detail.createdAt),
      targetDate: fmtDate(workOrder?.targetCompletion),
      customerName: lead?.clientName || "—",
      brandName: lead?.brandName || "—",
      productName: lead?.productInterest || "—",
      bpomNa: "—",
      category: "—",
      nettoPerPcs: "—",
      targetQtyPcs: Number(workOrder?.targetQty || 0),
      baseResultKg: totalTheoretical,
      upscalePct: 0,
      upscaleResultKg: totalActual,
      formulaCode: detail.formula?.code || detail.formula?.name || "—",
      formulaVersion: detail.formula?.version
        ? `Rev ${detail.formula.version}`
        : "—",
      apjSignatureUrl: detail.apjSignatureUrl ?? null,
      rawMaterials: materials.map((det, idx) => ({
        code: det.materialCode || det.material?.code || `RM-${idx + 1}`,
        inciName: det.material?.name || "—",
        tradeName: det.material?.name || "—",
        phase: det.category || "RAW",
        percentage:
          totalTheoretical > 0
            ? (Number(det.qtyTheoretical || 0) / totalTheoretical) * 100
            : 0,
        standardKg: Number(det.qtyTheoretical || 0),
        upscaleKg: Number(det.qtyActual || 0),
        lotWarehouse: det.material?.batchNumber || "—",
      })),
      steps: schedules.map((sch, idx) => ({
        stepNo: idx + 1,
        stage: `${sch.stage} · ${sch.scheduleNumber}`,
        instruction: `Target ${Number(sch.targetQty || 0).toLocaleString()} unit pada mesin ${sch.machine?.name || "—"}.`,
        criticalParams: `Hasil tercatat: ${Number(sch.resultQty || 0).toLocaleString()} unit`,
        operatorRole: sch.status || "SCHEDULED",
      })),
    };
  }, [detail]);

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
          tabs={(batchRecords ?? []).slice(0, 6).map((b) => ({
            id: b.batchNo,
            label: b.batchNo,
          }))}
          activeTab={activeBatchNo}
          onTabChange={setSelectedBatchNo}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/production/work-orders">
                <DnaButton variant="secondary" size="md">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Kembali ke SPK List
                </DnaButton>
              </Link>
              <DnaButton variant="primary" size="md" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Dokumen
              </DnaButton>
            </div>
          }
        />
      </div>

      {listLoading || detailLoading ? (
        <DnaLoadingSkeleton rows={6} className="max-w-5xl mx-auto" />
      ) : listError || detailError ? (
        <DnaErrorState
          title="Gagal Memuat Batch Record"
          message="Dokumen SPK tidak dapat dimuat dari server."
          onRetry={() => (listError ? refetchList() : refetchDetail())}
          className="max-w-5xl mx-auto"
        />
      ) : !data ? (
        <DnaEmptyState
          title="Belum Ada Batch Record Dirilis"
          description="Dokumen SPK/EBMR dibuat otomatis dari batch record produksi. Belum ada batch record yang tersedia di sistem."
          className="max-w-5xl mx-auto"
        />
      ) : (
      /* PRINTABLE EBMR DOCUMENT WRAPPER */
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
            <div className="text-[10px] tabular-nums text-slate-600">BATCH MANUFACTURING RECORD (EBMR)</div>
            <div className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] tabular-nums font-bold">
              {data.spkCode}
            </div>
          </div>
        </div>

        {/* INFORMASI UTAMA BATCH & PRODUK */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-6">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Nomor Batch Produksi</div>
            <div className="font-extrabold text-blue-800 tabular-nums text-sm">{data.batchNumber}</div>
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
            <div className="font-bold text-slate-900">{data.productName} • <span className="tabular-nums text-blue-700">{data.bpomNa}</span></div>
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
            <span className="text-[10px] tabular-nums text-slate-500">Formula Ref: {data.formulaCode} ({data.formulaVersion})</span>
          </div>

          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300">Kode</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300">Nama INCI / Kimia</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300">Fase</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300 text-right">%</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300 text-right">Standar (Kg)</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300 text-right bg-blue-50/60 font-black">Upscale (Kg)</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300">Lot Gudang</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-slate-300 text-center">Paraf Timbang</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {data.rawMaterials.map((rm, idx) => (
                <DnaTableRow key={idx} className="hover:bg-slate-50">
                  <DnaTd className="px-2.5 py-1.5 border-r border-slate-200 tabular-nums text-[10px]">{rm.code}</DnaTd>
                  <DnaTd className="px-2.5 py-1.5 border-r border-slate-200">
                    <div className="font-semibold text-slate-900">{rm.tradeName}</div>
                    <div className="text-[9px] text-slate-500 italic">{rm.inciName}</div>
                  </DnaTd>
                  <DnaTd className="px-2.5 py-1.5 border-r border-slate-200 font-medium text-slate-700">{rm.phase}</DnaTd>
                  <DnaTd className="px-2.5 py-1.5 border-r border-slate-200 text-right font-medium">{rm.percentage.toFixed(2)}%</DnaTd>
                  <DnaTd className="px-2.5 py-1.5 border-r border-slate-200 text-right text-slate-600">{rm.standardKg.toFixed(3)}</DnaTd>
                  <DnaTd className="px-2.5 py-1.5 border-r border-slate-200 text-right font-bold text-blue-900 bg-blue-50/40">
                    {rm.upscaleKg.toFixed(3)}
                  </DnaTd>
                  <DnaTd className="px-2.5 py-1.5 border-r border-slate-200 tabular-nums text-[10px] text-slate-600">{rm.lotWarehouse}</DnaTd>
                  <DnaTd className="px-2.5 py-1.5 text-center text-slate-300 tabular-nums">______</DnaTd>
                </DnaTableRow>
              ))}
              <DnaTableRow className="bg-slate-100 font-bold text-[11px]">
                <DnaTd colSpan={3} className="px-2.5 py-2 border-r border-slate-300 text-right uppercase">Total Formula</DnaTd>
                <DnaTd className="px-2.5 py-2 border-r border-slate-300 text-right">100.00%</DnaTd>
                <DnaTd className="px-2.5 py-2 border-r border-slate-300 text-right">{data.baseResultKg.toFixed(2)} Kg</DnaTd>
                <DnaTd className="px-2.5 py-2 border-r border-slate-300 text-right font-black text-blue-900 bg-blue-100/60">
                  {data.upscaleResultKg.toFixed(2)} Kg
                </DnaTd>
                <DnaTd colSpan={2} className="px-2.5 py-2 text-center text-[10px] text-slate-500">Toleransi loss timbang max ±0.05%</DnaTd>
              </DnaTableRow>
            </DnaTableBody>
          </DnaTable>
        </div>

        {/* TABEL 2: SOP & LEMBAR VERIFIKASI TAHAPAN CPKB */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-700" />
            <span>2. Instruksi Manufaktur & Lembar Verifikasi Tahapan CPKB</span>
          </h2>

          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="px-2 py-2 border-b border-r border-slate-300 w-8 text-center">#</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300 w-36">Tahapan Proses</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300">Instruksi Kerja & Parameter Kritis</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-r border-slate-300 w-36">Penanggung Jawab</DnaTh>
                <DnaTh className="px-2.5 py-2 border-b border-slate-300 w-28 text-center">Paraf & Jam</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {data.steps.map((st) => (
                <DnaTableRow key={st.stepNo} className="hover:bg-slate-50">
                  <DnaTd className="px-2 py-2 border-r border-slate-200 text-center font-bold text-slate-600">{st.stepNo}</DnaTd>
                  <DnaTd className="px-2.5 py-2 border-r border-slate-200 font-bold text-slate-900">{st.stage}</DnaTd>
                  <DnaTd className="px-2.5 py-2 border-r border-slate-200">
                    <div className="text-slate-800 font-medium">{st.instruction}</div>
                    <div className="text-[10px] text-indigo-800 font-semibold mt-0.5">Spesifikasi: {st.criticalParams}</div>
                  </DnaTd>
                  <DnaTd className="px-2.5 py-2 border-r border-slate-200 font-medium text-slate-700 text-[10px]">{st.operatorRole}</DnaTd>
                  <DnaTd className="px-2.5 py-2 text-center text-slate-300 tabular-nums text-[10px]">
                    <div>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">___:___ WIB</div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        </div>

        {/* LEMBAR TANDA TANGAN & PENGESAHAN AKHIR */}
        <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 text-xs">
          <div className="text-[11px] font-bold text-slate-800 uppercase mb-3 border-b border-slate-200 pb-1">
            Lembar Otorisasi & Pelepasan Batch Produksi
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-2 bg-white border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Dibuat Oleh (R&D / PPC)</div>
              <div className="h-12 flex items-center justify-center text-slate-300 tabular-nums">[ TTD ]</div>
              <div className="font-bold text-slate-400">_____________</div>
              <div className="text-[9px] text-slate-400">PPC &amp; Formulator</div>
            </div>

            <div className="p-2 bg-white border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Disetujui (Kepala Produksi)</div>
              <div className="h-12 flex items-center justify-center text-slate-300 tabular-nums">[ TTD ]</div>
              <div className="font-bold text-slate-400">_____________</div>
              <div className="text-[9px] text-slate-400">Plant Production Head</div>
            </div>

            <div className="p-2 bg-white border border-slate-200 rounded">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Diperiksa (In-Process QC)</div>
              <div className="h-12 flex items-center justify-center text-slate-300 tabular-nums">[ TTD ]</div>
              <div className="font-bold text-slate-400">_____________</div>
              <div className="text-[9px] text-slate-400">QA / QC Inspector</div>
            </div>

            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
              <div className="text-[10px] text-emerald-800 font-bold uppercase">Rilis Akhir (APJ)</div>
              <div className="h-12 flex items-center justify-center text-emerald-400 tabular-nums">[ TTD &amp; STEMPEL ]</div>
              <div className="font-bold text-emerald-900">{data.apjSignatureUrl ? "Sudah dirilis (tanda tangan digital terlampir)" : "_____________"}</div>
              <div className="text-[9px] text-emerald-700 tabular-nums">Identitas APJ tidak diekspos endpoint batch record</div>
            </div>
          </div>
        </div>
      </div>
      )}
    </DnaPageContainer>
  );
}
