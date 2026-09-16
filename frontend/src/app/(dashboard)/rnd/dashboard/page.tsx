"use client";

import React, { useState, useMemo, Suspense } from "react";
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowUpRight,
  Layers,
  Palette,
  FileText,
  DollarSign
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast
} from "@/components/dna";
import Link from "next/link";

interface FormulatorWorkload {
  id: string;
  name: string;
  specialty: string;
  sampleMasuk: number;
  sampleDisetujui: number;
  approvalRate: number;
}

const INITIAL_FORMULATORS: FormulatorWorkload[] = [
  {
    id: "f-1",
    name: "Apt. Dedi Kurniawan, S.Farm",
    specialty: "Serum & Active Treatments",
    sampleMasuk: 6,
    sampleDisetujui: 4,
    approvalRate: 66.7
  },
  {
    id: "f-2",
    name: "Dr. Maya Sp.KK",
    specialty: "Barrier Repair & Creams",
    sampleMasuk: 4,
    sampleDisetujui: 3,
    approvalRate: 75.0
  },
  {
    id: "f-3",
    name: "Aisyah Putri, S.Si",
    specialty: "Bodycare & Cleansers",
    sampleMasuk: 3,
    sampleDisetujui: 2,
    approvalRate: 66.7
  },
  {
    id: "f-4",
    name: "Budi Prakoso, S.Farm",
    specialty: "Lip & Decorative Cosmetics",
    sampleMasuk: 1,
    sampleDisetujui: 1,
    approvalRate: 100.0
  }
];

function RndDashboardContent() {
  const [formulators] = useState<FormulatorWorkload[]>(INITIAL_FORMULATORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("THIS_MONTH");
  const toast = useDnaToast();

  const filteredFormulators = useMemo(() => {
    return formulators.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [formulators, searchQuery]);

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Dasbor R&D & Formulasi"
        description="Monitoring beban kerja formulator lab, approval rate sampel maklon, dan throughput formulasi (G-SERP Parity)."
        breadcrumbs={[
          { label: "Operasional", href: "/dashboard-rnd" },
          { label: "Dasbor R&D", href: "/dashboard-rnd" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/formulation">
              <DnaButton variant="secondary">
                <Layers className="w-4 h-4 mr-1.5" />
                Kelola Formula
              </DnaButton>
            </Link>
            <Link href="/design-manage">
              <DnaButton variant="secondary">
                <Palette className="w-4 h-4 mr-1.5" />
                Desain Kemasan
              </DnaButton>
            </Link>
            <Link href="/batch-record">
              <DnaButton variant="primary">
                <FileText className="w-4 h-4 mr-1.5" />
                Batch Record
              </DnaButton>
            </Link>
          </div>
        }
      />

      {/* 2. 7 KPI Cards (1:1 G-SERP Row 22) */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL BARANG / FORMULA"
          value="6.116 Item"
          subValue="INCI & Master Formula"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="PERMINTAAN SAMPLE (PENDING)"
          value="0 Permintaan"
          subValue="Antrian Uji Formulasi"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="SAMPLE DIPROSES (APPROVED)"
          value="261 Sample"
          subValue="Dalam Trial Lab"
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="SAMPLE SELESAI"
          value="474 Sample"
          subValue="Terkirim ke Klien"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sampel Masuk Bulan Ini</p>
            <p className="text-xl font-bold text-slate-800 mt-1">14 Sample</p>
          </div>
          <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <FlaskConical className="w-5 h-5" />
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disetujui Klien (Done)</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">10 Sample</p>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approval Rate Formulasi</p>
            <p className="text-xl font-bold text-purple-600 mt-1">71.4%</p>
          </div>
          <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* 3. Filter & Formulator Table (1:1 G-SERP Exact 3 Columns) */}
      <DnaDataTableCard
        title="Distribusi Beban Kerja Formulator Lab"
        description="Pelacakan jumlah sampel masuk dan persetujuan deal formula per person in charge (PIC)."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nama formulator..."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="THIS_MONTH">Periode: Bulan Ini</option>
              <option value="LAST_MONTH">Periode: Bulan Lalu</option>
              <option value="YTD">Periode: Year-to-Date</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama Formulator</th>
                <th className="py-3 px-4 text-center">Sampel Masuk</th>
                <th className="py-3 px-4 text-center">Disetujui</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFormulators.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    Tidak ada data formulator.
                  </td>
                </tr>
              ) : (
                filteredFormulators.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row.name}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">{row.sampleMasuk}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                      <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {row.sampleDisetujui}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}

export default function RndDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Memuat Dasbor R&D...</div>}>
      <RndDashboardContent />
    </Suspense>
  );
}
