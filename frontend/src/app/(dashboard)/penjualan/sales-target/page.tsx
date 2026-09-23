"use client";

import React, { useState, Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Target,
  Plus,
  Search,
  Calendar,
  User,
  TrendingUp,
  Award,
  ShieldCheck,
  Users,
  Coins,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaCell,
  DnaModal,
  DnaDetailDrawer,
  DnaButton,
  DnaInput,
  useDnaToast,
} from "@/components/dna";

interface SalesTargetItem {
  id: string;
  picName: string;
  picEmail: string;
  role: string;
  month: number;
  year: number;
  nominalTarget: number;
  realizedRevenue: number;
  notes?: string;
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const INITIAL_TARGETS: SalesTargetItem[] = [
  {
    id: "st-01",
    picName: "Andi Pratama",
    picEmail: "andi.pratama@kil.co.id",
    role: "Senior BusDev Maklon",
    month: 3,
    year: 2026,
    nominalTarget: 500000000,
    realizedRevenue: 475000000,
    notes: "Fokus maklon skincare brand C-Jelita Herbal & derma series.",
  },
  {
    id: "st-02",
    picName: "Siti Rahma",
    picEmail: "siti.rahma@kil.co.id",
    role: "Account Executive",
    month: 3,
    year: 2026,
    nominalTarget: 400000000,
    realizedRevenue: 320000000,
    notes: "Follow up repeat order moisturizer gel & sunscreen.",
  },
  {
    id: "st-03",
    picName: "Budi Santoso",
    picEmail: "budi.santoso@kil.co.id",
    role: "Account Executive",
    month: 3,
    year: 2026,
    nominalTarget: 350000000,
    realizedRevenue: 285000000,
    notes: "Closing klien klinik kecantikan DermaGleam Pro.",
  },
  {
    id: "st-04",
    picName: "Mega Utami",
    picEmail: "mega.utami@kil.co.id",
    role: "Junior BusDev",
    month: 3,
    year: 2026,
    nominalTarget: 250000000,
    realizedRevenue: 100000000,
    notes: "Pipeline calon brand owner baru dari guest book seminar.",
  },
];

function SalesTargetContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [targets, setTargets] = useState<SalesTargetItem[]>(INITIAL_TARGETS);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [detailTarget, setDetailTarget] = useState<SalesTargetItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("Account Executive");
  const [formNominal, setFormNominal] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const periodTargets = useMemo(() => {
    return targets.filter((t) => t.month === selectedMonth && t.year === selectedYear);
  }, [targets, selectedMonth, selectedYear]);

  const filteredTargets = useMemo(() => {
    return periodTargets.filter((t) => {
      const pct = Math.round((t.realizedRevenue / (t.nominalTarget || 1)) * 100);
      let matchesTab = true;
      if (activeTab === "reached") matchesTab = pct >= 100;
      else if (activeTab === "ontrack") matchesTab = pct >= 70 && pct < 100;
      else if (activeTab === "under") matchesTab = pct < 70;

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        t.picName.toLowerCase().includes(q) ||
        t.picEmail.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [periodTargets, activeTab, searchTerm]);

  const countAll = periodTargets.length;
  const countReached = periodTargets.filter((t) => Math.round((t.realizedRevenue / (t.nominalTarget || 1)) * 100) >= 100).length;
  const countOnTrack = periodTargets.filter((t) => {
    const p = Math.round((t.realizedRevenue / (t.nominalTarget || 1)) * 100);
    return p >= 70 && p < 100;
  }).length;
  const countUnder = periodTargets.filter((t) => Math.round((t.realizedRevenue / (t.nominalTarget || 1)) * 100) < 70).length;

  const totalTargetPeriod = periodTargets.reduce((sum, t) => sum + t.nominalTarget, 0);
  const totalRealizedPeriod = periodTargets.reduce((sum, t) => sum + t.realizedRevenue, 0);
  const avgAchievement =
    totalTargetPeriod > 0 ? Math.round((totalRealizedPeriod / totalTargetPeriod) * 100) : 0;

  // Best Performer
  const topPerformer = [...periodTargets].sort(
    (a, b) => b.realizedRevenue / (b.nominalTarget || 1) - a.realizedRevenue / (a.nominalTarget || 1)
  )[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formNominal || Number(formNominal) <= 0) {
      toast.error("Validasi Gagal", "Harap isi nama PIC dan nominal target dengan benar.");
      return;
    }

    const newTarget: SalesTargetItem = {
      id: `st-${Date.now()}`,
      picName: formName,
      picEmail: formEmail || `${formName.toLowerCase().replace(/\s+/g, ".")}@kil.co.id`,
      role: formRole,
      month: selectedMonth,
      year: selectedYear,
      nominalTarget: Number(formNominal),
      realizedRevenue: 0,
      notes: formNotes,
    };

    setTargets([newTarget, ...targets]);
    toast.success("Target Ditambahkan", `Alokasi target Rp ${Number(formNominal).toLocaleString("id-ID")} untuk ${formName} ditetapkan.`);
    setIsCreateOpen(false);

    // Reset Form
    setFormName("");
    setFormEmail("");
    setFormNominal("");
    setFormNotes("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header with Unified Tabs */}
      <DnaPageHeader
        title="TARGET PENJUALAN BUSDEV"
        description="Penetapan kuota omzet bulanan tim Business Development maklon kosmetik, monitoring realisasi revenue faktur terbayar, dan evaluasi performa Account Executive."
        tabs={[
          { key: "all", label: "Semua AE", count: countAll },
          { key: "reached", label: "Tercapai", count: countReached },
          { key: "ontrack", label: "On Track (70-99%)", count: countOnTrack },
          { key: "under", label: "Di Bawah Target", count: countUnder },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Alokasikan Target Baru
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: `Target Omzet ${MONTHS_ID[selectedMonth - 1]} ${selectedYear}`,
            value: `Rp ${(totalTargetPeriod / 1000000000).toFixed(2)} M`,
            subtitle: `${countAll} Account Executive`,
            trend: "Target Konsolidasi",
            icon: Target,
            variant: "blue",
          },
          {
            label: "Realisasi Revenue Aktual",
            value: `Rp ${(totalRealizedPeriod / 1000000000).toFixed(2)} M`,
            subtitle: "Dari pelunasan invoice maklon",
            trend: "Arus kas masuk",
            icon: Coins,
            variant: "emerald",
          },
          {
            label: "Rata-Rata Pencapaian",
            value: `${avgAchievement}%`,
            subtitle: avgAchievement >= 80 ? "Sangat Baik (On Target)" : "Perlu Percepatan",
            trend: "Closing rate tim",
            icon: TrendingUp,
            variant: avgAchievement >= 80 ? "purple" : "amber",
          },
          {
            label: "Top Performer Bulan Ini",
            value: topPerformer ? topPerformer.picName : "-",
            subtitle: topPerformer
              ? `${Math.round((topPerformer.realizedRevenue / topPerformer.nominalTarget) * 100)}% kuota tercapai`
              : "Belum ada data",
            trend: "Peringkat 1",
            icon: Award,
            variant: "purple",
          },
        ]}
      />

      {/* Main Table Card */}
      <DnaDataTableCard
        count={filteredTargets.length}
        totalItems={countAll}
        toolbarProps={{
          searchPlaceholder: "Cari PIC atau jabatan...",
          searchValue: searchTerm,
          onSearchChange: setSearchTerm,
        }}
        actions={
          <div className="flex items-center gap-2">
            <select
              className="text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS_ID.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="w-full">
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-[25%]">Account Executive & Email</th>
                <th className="py-3 px-3 w-[18%]">Jabatan & Periode</th>
                <th className="py-3 px-3 w-[17%] text-right">Target Omzet</th>
                <th className="py-3 px-3 w-[17%] text-right">Realisasi Revenue</th>
                <th className="py-3 px-3 w-[13%] text-center">Pencapaian</th>
                <th className="py-3 px-3 w-[10%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTargets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Target className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada target pada periode ini</p>
                    <p className="text-xs text-slate-400">Pilih bulan lain atau klik Alokasikan Target Baru.</p>
                  </td>
                </tr>
              ) : (
                filteredTargets.map((t) => {
                  const pct = Math.round((t.realizedRevenue / (t.nominalTarget || 1)) * 100);
                  const isSuccess = pct >= 100;
                  const isOnTrack = pct >= 70;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900 truncate">{t.picName}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{t.picEmail}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-slate-800 font-medium truncate">{t.role}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{MONTHS_ID[t.month - 1]} {t.year}</p>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <p className="font-mono font-bold text-slate-900">
                          Rp {t.nominalTarget.toLocaleString("id-ID")}
                        </p>
                        <p className="text-[10px] text-slate-400">Kuota</p>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <p className="font-mono font-bold text-emerald-600">
                          Rp {t.realizedRevenue.toLocaleString("id-ID")}
                        </p>
                        <p className="text-[10px] text-slate-400">Realized</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-bold text-xs ${
                              isSuccess ? "text-emerald-600" : isOnTrack ? "text-blue-600" : "text-amber-600"
                            }`}
                          >
                            {pct}%
                          </span>
                          <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-0.5">
                            <div
                              className={`h-full rounded-full ${
                                isSuccess ? "bg-emerald-500" : isOnTrack ? "bg-blue-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailTarget(t)}
                          >
                            Detail
                          </DnaButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Drawer Detail Target PIC */}
      <DnaDetailDrawer
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.picName || "Detail Target BusDev"}
        subtitle={detailTarget ? `${detailTarget.role} • ${MONTHS_ID[detailTarget.month - 1]} ${detailTarget.year}` : undefined}
        badge={
          detailTarget ? (
            <DnaCell.Badge
              status={
                detailTarget.realizedRevenue >= detailTarget.nominalTarget
                  ? "success"
                  : "info"
              }
              label={
                detailTarget.realizedRevenue >= detailTarget.nominalTarget
                  ? "Tercapai"
                  : "On Track"
              }
            />
          ) : undefined
        }
        actions={
          detailTarget ? (
            <div className="flex items-center justify-end w-full">
              <DnaButton variant="secondary" onClick={() => setDetailTarget(null)}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {detailTarget && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Omzet:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  Rp {detailTarget.nominalTarget.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Realisasi Penjualan:</span>
                <span className="font-mono text-sm">Rp {detailTarget.realizedRevenue.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-700">
                <span>Kekurangan Kuota (Gap):</span>
                <span className="font-bold text-rose-600 font-mono">
                  Rp{" "}
                  {Math.max(0, detailTarget.nominalTarget - detailTarget.realizedRevenue).toLocaleString(
                    "id-ID"
                  )}
                </span>
              </div>
            </div>

            {detailTarget.notes && (
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 text-xs text-slate-700">
                <span className="font-bold block mb-1 text-slate-600">Fokus Akun & Strategi:</span>
                {detailTarget.notes}
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Alokasikan Target Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Alokasikan Target Penjualan Baru"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Account Executive / PIC *</label>
            <DnaInput
              placeholder="Contoh: Rian Pratama"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Email Kantor</label>
              <DnaInput
                placeholder="rian.pratama@kil.co.id"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jabatan</label>
              <select
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
              >
                <option value="Account Executive">Account Executive</option>
                <option value="Senior BusDev Maklon">Senior BusDev Maklon</option>
                <option value="Junior BusDev">Junior BusDev</option>
                <option value="Key Account Manager">Key Account Manager</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Nominal Kuota Target Omzet (Rp) *
            </label>
            <DnaInput
              type="number"
              placeholder="Contoh: 300000000"
              value={formNominal}
              onChange={(e) => setFormNominal(e.target.value)}
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Periode alokasi: {MONTHS_ID[selectedMonth - 1]} {selectedYear}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Catatan Portofolio Klien</label>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Contoh: Pipeline fokus akun klinik estetik Jawa Barat."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Tetapkan Kuota Target
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}

export default function SalesTargetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Memuat Target Penjualan...</div>}>
      <SalesTargetContent />
    </Suspense>
  );
}
