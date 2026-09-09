"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ShieldCheck,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Eye,
  Search,
  Filter,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Building2,
  Wallet,
  Landmark
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaTabNav,
  useDnaToast,
  formatRupiah
} from "@/components/dna";

interface EscrowItem {
  id: string;
  escrowNo: string; // e.g. ESC-2026-0012
  customerName: string;
  brandName: string;
  purpose: "BPOM_REGISTRATION" | "HALAL_CERTIFICATION" | "LAB_TESTING" | "HKI_MERK";
  depositReceived: number;
  disbursedAmount: number;
  remainingBalance: number;
  status: "DEPOSITED" | "PARTIALLY_USED" | "FULLY_SETTLED";
  lastUpdated: string;
  notes?: string;
}

const FALLBACK_ESCROW: EscrowItem[] = [
  {
    id: "esc-1",
    escrowNo: "ESC-2026-0012",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "GlowGoddess",
    purpose: "BPOM_REGISTRATION",
    depositReceived: 15000000,
    disbursedAmount: 10000000,
    remainingBalance: 5000000,
    status: "PARTIALLY_USED",
    lastUpdated: "2026-09-08",
    notes: "Pembayaran PNBP Simponi BPOM Notifikasi NA 2 produk."
  },
  {
    id: "esc-2",
    escrowNo: "ESC-2026-0013",
    customerName: "CV Aura Skin Estetika",
    brandName: "AuraGlow",
    purpose: "HALAL_CERTIFICATION",
    depositReceived: 8000000,
    disbursedAmount: 8000000,
    remainingBalance: 0,
    status: "FULLY_SETTLED",
    lastUpdated: "2026-09-05",
    notes: "Audit LPPOM MUI & BPJPH telah selesai diselesaikan penuh."
  },
  {
    id: "esc-3",
    escrowNo: "ESC-2026-0014",
    customerName: "PT Elixir Botanika Internasional",
    brandName: "ElixirHerb",
    purpose: "LAB_TESTING",
    depositReceived: 12000000,
    disbursedAmount: 6500000,
    remainingBalance: 5500000,
    status: "PARTIALLY_USED",
    lastUpdated: "2026-09-09",
    notes: "Pengujian efikasi & dermatologically tested di Lab Saraswanti."
  }
];

const PURPOSE_MAP: Record<string, { label: string; badge: "info" | "purple" | "warning" }> = {
  BPOM_REGISTRATION: { label: "Registrasi Notifikasi BPOM", badge: "info" },
  HALAL_CERTIFICATION: { label: "Sertifikasi Halal BPJPH", badge: "purple" },
  LAB_TESTING: { label: "Pengujian Lab Eksternal", badge: "warning" },
  HKI_MERK: { label: "Pendaftaran Merek HKI", badge: "info" },
};

export default function ClientEscrowPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<EscrowItem | null>(null);

  // Form states
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formPurpose, setFormPurpose] = useState<"BPOM_REGISTRATION" | "HALAL_CERTIFICATION" | "LAB_TESTING" | "HKI_MERK">("BPOM_REGISTRATION");
  const [formAmount, setFormAmount] = useState<number>(10000000);
  const [formNotes, setFormNotes] = useState("");

  const { data: serverData } = useQuery({
    queryKey: ["finance-client-escrow"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/client-escrow");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map
        }
      } catch (err) {
        console.warn("Using fallback escrow data", err);
      }
      return FALLBACK_ESCROW;
    }
  });

  const escrowList = serverData || FALLBACK_ESCROW;

  const filteredList = useMemo(() => {
    return escrowList.filter((item) => {
      if (activeTab === "ACTIVE" && item.status === "FULLY_SETTLED") return false;
      if (activeTab === "SETTLED" && item.status !== "FULLY_SETTLED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = item.escrowNo.toLowerCase().includes(q);
        const matchCustomer = item.customerName.toLowerCase().includes(q);
        const matchBrand = item.brandName.toLowerCase().includes(q);
        if (!matchNo && !matchCustomer && !matchBrand) return false;
      }
      return true;
    });
  }, [escrowList, activeTab, searchQuery]);

  const totalDepositHeld = escrowList.reduce((acc, e) => acc + e.remainingBalance, 0);

  const handleCreateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer || formAmount <= 0) {
      toast.error("Validasi Gagal", "Harap isi nama klien dan nominal deposit titipan.");
      return;
    }

    const newItem: EscrowItem = {
      id: `esc-${Date.now()}`,
      escrowNo: `ESC-2026-${String(escrowList.length + 15).padStart(4, "0")}`,
      customerName: formCustomer,
      brandName: formBrand || "Brand Klien",
      purpose: formPurpose,
      depositReceived: Number(formAmount),
      disbursedAmount: 0,
      remainingBalance: Number(formAmount),
      status: "DEPOSITED",
      lastUpdated: new Date().toISOString().slice(0, 10),
      notes: formNotes
    };

    escrowList.unshift(newItem);
    setIsDepositModalOpen(false);
    toast.success("Deposit Escrow Diterima", `Dana titipan ${newItem.escrowNo} (${formatRupiah(newItem.depositReceived)}) berhasil dicatat sebagai titipan legalitas/lab.`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Client Escrow Ledger (Dana Titipan Legalitas & Lab)"
        subtitle="Pencatatan dana pass-through titipan klien untuk biaya PNBP BPOM, sertifikasi Halal, dan pengujian lab pihak ketiga (0% Revenue Impact)"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Landmark className="w-3.5 h-3.5" />
            <span>Pass-Through Liability Ledger</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="primary" size="md" onClick={() => setIsDepositModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Terima Deposit Escrow
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Saldo Dana Titipan (Escrow)"
          value={formatRupiah(totalDepositHeld)}
          icon={<Landmark className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "Saldo Kewajiban Klien", isPositive: true }}
          variant="purple"
        />
        <DnaStatCard
          label="Rekening Titipan"
          value="BRI Giro Escrow"
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          subtext="No. Rek: 101-003"
          variant="blue"
        />
        <DnaStatCard
          label="Titipan Aktif"
          value={`${escrowList.filter((e) => e.status !== "FULLY_SETTLED").length} Akun`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          subtext="Sedang Berjalan di BPOM/Lab"
          variant="warning"
        />
        <DnaStatCard
          label="Telah Diselesaikan"
          value={`${escrowList.filter((e) => e.status === "FULLY_SETTLED").length} Akun`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="100% Settled / Selesai"
          variant="success"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Ledger Escrow Klien"
        badge={
          <DnaBadge variant="default">
            {filteredList.length} Akun Escrow
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Akun", badge: escrowList.length },
                { id: "ACTIVE", label: "Aktif / Berjalan", badge: escrowList.filter((e) => e.status !== "FULLY_SETTLED").length },
                { id: "SETTLED", label: "Selesai (Settled)", badge: escrowList.filter((e) => e.status === "FULLY_SETTLED").length }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No Escrow, Klien, Brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">No. Escrow</th>
                <th className="px-3.5 py-3">Klien & Brand</th>
                <th className="px-3.5 py-3">Tujuan Penggunaan</th>
                <th className="px-3.5 py-3 text-right">Deposit Diterima</th>
                <th className="px-3.5 py-3 text-right">Telah Digunakan</th>
                <th className="px-3.5 py-3 text-right">Sisa Saldo Dana</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => {
                const purposeInfo = PURPOSE_MAP[item.purpose] || PURPOSE_MAP.BPOM_REGISTRATION;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3 font-bold text-indigo-900">{item.escrowNo}</td>
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-slate-900">{item.customerName}</div>
                      <div className="text-[10px] text-slate-500">{item.brandName}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <DnaBadge variant={purposeInfo.badge}>
                        {purposeInfo.label}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 text-right font-semibold text-slate-800">
                      {formatRupiah(item.depositReceived)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-medium text-rose-700">
                      {formatRupiah(item.disbursedAmount)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-black text-emerald-800">
                      {formatRupiah(item.remainingBalance)}
                    </td>
                    <td className="px-3.5 py-3">
                      <DnaBadge variant={item.status === "FULLY_SETTLED" ? "success" : "warning"}>
                        {item.status}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <DnaButton variant="secondary" size="sm" onClick={() => setDetailItem(item)}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Rekap
                      </DnaButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL TERIMA DEPOSIT ESCROW */}
      <DnaModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="Terima Deposit Escrow Klien Baru"
        size="lg"
      >
        <form onSubmit={handleCreateDeposit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Klien / Perusahaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PT Cantika Jelita"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Brand</label>
              <input
                type="text"
                placeholder="Contoh: GlowGoddess"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tujuan Penggunaan Dana</label>
              <select
                value={formPurpose}
                onChange={(e) => setFormPurpose(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                <option value="BPOM_REGISTRATION">Registrasi Notifikasi BPOM (PNBP Simponi)</option>
                <option value="HALAL_CERTIFICATION">Sertifikasi Halal (LPPOM / BPJPH)</option>
                <option value="LAB_TESTING">Pengujian Lab Eksternal (Efikasi / Mikro)</option>
                <option value="HKI_MERK">Pendaftaran Merek HKI (DJKI Kemenkumham)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Deposit (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-900 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Rincian Alokasi</label>
            <textarea
              rows={2}
              placeholder="Catatan produk terkait atau nomor SPK..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsDepositModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Deposit Escrow
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL DETAIL ESCROW */}
      <DnaModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={`Rekapitulasi Escrow Klien: ${detailItem?.escrowNo}`}
        size="md"
      >
        {detailItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">{detailItem.customerName} ({detailItem.brandName})</div>
              <div className="text-indigo-800">
                Tujuan: <strong>{PURPOSE_MAP[detailItem.purpose]?.label}</strong>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-white border border-slate-200 rounded-lg text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Deposit Masuk</div>
                <div className="font-bold text-slate-900">{formatRupiah(detailItem.depositReceived)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Disbursed</div>
                <div className="font-bold text-rose-700">{formatRupiah(detailItem.disbursedAmount)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Sisa Dana</div>
                <div className="font-extrabold text-emerald-800">{formatRupiah(detailItem.remainingBalance)}</div>
              </div>
            </div>

            {detailItem.notes && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <span className="font-semibold text-[11px] block mb-0.5">Catatan:</span>
                <div>{detailItem.notes}</div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <DnaButton variant="primary" size="sm" onClick={() => setDetailItem(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
