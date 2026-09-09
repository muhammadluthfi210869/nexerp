"use client";

import React, { useState, useEffect } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaCell,
  DnaCrudModal,
  DnaInput,
  DnaSelect,
  DnaCurrencyInput,
  CoaSelect,
  formatRupiah,
} from "@/components/dna";
import { Plus, Building2, CreditCard, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountType: "BANK" | "CASH" | "PETTY_CASH";
  currency: string;
  currentBalance: number;
  glAccountCode: string;
  isActive: boolean;
}

const INITIAL_ACCOUNTS: BankAccount[] = [
  {
    id: "bank-1",
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "541-0988-121",
    accountName: "PT Karya Impian Laboratoris (Operasional)",
    accountType: "BANK",
    currency: "IDR",
    currentBalance: 1250000000,
    glAccountCode: "11300",
    isActive: true,
  },
  {
    id: "bank-2",
    bankName: "Bank Mandiri",
    accountNumber: "132-00-987654-1",
    accountName: "PT Karya Impian Laboratoris (Payroll)",
    accountType: "BANK",
    currency: "IDR",
    currentBalance: 420000000,
    glAccountCode: "11310",
    isActive: true,
  },
  {
    id: "cash-1",
    bankName: "Brankas Utama Pabrik",
    accountNumber: "CASH-MAIN",
    accountName: "Kas Operasional Pabrik",
    accountType: "CASH",
    currency: "IDR",
    currentBalance: 35000000,
    glAccountCode: "11100",
    isActive: true,
  },
  {
    id: "petty-1",
    bankName: "Petty Cash Finance Lab",
    accountNumber: "CASH-PETTY",
    accountName: "Kas Kecil R&D & Operasional",
    accountType: "PETTY_CASH",
    currency: "IDR",
    currentBalance: 12500000,
    glAccountCode: "11200",
    isActive: true,
  },
];

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const totalBalance = accounts.reduce((acc, a) => acc + (a.isActive ? a.currentBalance : 0), 0);
  const totalBank = accounts.filter((a) => a.accountType === "BANK").reduce((acc, a) => acc + a.currentBalance, 0);
  const totalCash = accounts.filter((a) => a.accountType !== "BANK").reduce((acc, a) => acc + a.currentBalance, 0);

  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    accountType: "BANK" as "BANK" | "CASH" | "PETTY_CASH",
    currency: "IDR",
    initialBalance: 0,
    glAccountCode: "11300",
  });

  const handleCreate = () => {
    const newAcc: BankAccount = {
      id: "acc-" + Date.now(),
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      accountName: formData.accountName,
      accountType: formData.accountType,
      currency: formData.currency,
      currentBalance: formData.initialBalance,
      glAccountCode: formData.glAccountCode,
      isActive: true,
    };
    setAccounts([newAcc, ...accounts]);
    setIsModalOpen(false);
    setFormData({
      bankName: "",
      accountNumber: "",
      accountName: "",
      accountType: "BANK",
      currency: "IDR",
      initialBalance: 0,
      glAccountCode: "11300",
    });
  };

  const filtered = accounts.filter(
    (a) =>
      a.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.accountName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Kelola Kas & Rekening Bank"
        subtitle="Master rekening giro perbankan, kas operasional pabrik, dan buku kas kecil (Batch 3C)"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Kas & Bank" }]}
        actions={
          <DnaButton variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> + Rekening Baru
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Likuiditas Kas & Bank"
          value={formatRupiah(totalBalance)}
          variant="emerald"
          icon={<Building2 className="h-4 w-4" />}
          delta={{ value: "Konsolidasi Semua Rekening", isPositive: true }}
        />
        <DnaStatCard
          label="Saldo Giro Perbankan"
          value={formatRupiah(totalBank)}
          variant="blue"
          icon={<CreditCard className="h-4 w-4" />}
          delta={{ value: "2 Rekening Aktif", isPositive: true }}
        />
        <DnaStatCard
          label="Saldo Kas Tunai / Brankas"
          value={formatRupiah(totalCash)}
          variant="amber"
          icon={<Wallet className="h-4 w-4" />}
          delta={{ value: "Pabrik & Petty Cash", isPositive: true }}
        />
        <DnaStatCard
          label="Rekening Terdaftar"
          value={accounts.length.toString()}
          variant="slate"
          delta={{ value: "Semua Aktif", isPositive: true }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari nama bank, nomor rekening, atau pemegang rekening..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Nama Bank / Kas</th>
                <th className="px-4 py-3">Nomor Rekening</th>
                <th className="px-4 py-3">Atas Nama</th>
                <th className="px-4 py-3">Tipe Rekening</th>
                <th className="px-4 py-3">Mapping Akun COA</th>
                <th className="px-4 py-3 text-right">Saldo Berjalan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{acc.bankName}</div>
                    <div className="text-[11px] text-slate-400">{acc.currency} (Indonesian Rupiah)</div>
                  </td>
                  <td className="px-4 py-3">
                    <DnaCell.Code value={acc.accountNumber} />
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{acc.accountName}</td>
                  <td className="px-4 py-3">
                    <DnaBadge
                      variant={
                        acc.accountType === "BANK" ? "blue" : acc.accountType === "CASH" ? "amber" : "purple"
                      }
                    >
                      {acc.accountType}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                      {acc.glAccountCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(acc.currentBalance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge variant={acc.isActive ? "emerald" : "slate"}>
                      {acc.isActive ? "Aktif" : "Non-Aktif"}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaButton
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setAccounts(
                          accounts.map((a) => (a.id === acc.id ? { ...a, isActive: !a.isActive } : a))
                        )
                      }
                    >
                      {acc.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      <DnaCrudModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Registrasi Rekening Kas / Bank Baru"
        subtitle="Tambahkan rekening bank resmi perusahaan dan hubungkan dengan bagan akun COA"
        onSave={handleCreate}
        saveText="Simpan Rekening"
      >
        <div className="space-y-4">
          <DnaInput
            label="Nama Bank / Kas *"
            placeholder="Misal: Bank Mandiri Operasional"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <DnaInput
              label="Nomor Rekening *"
              placeholder="Misal: 132-00-123456-7"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            />
            <div>
              <label className="text-[12px] font-medium text-slate-700">Tipe Rekening *</label>
              <select
                value={formData.accountType}
                onChange={(e) =>
                  setFormData({ ...formData, accountType: e.target.value as "BANK" | "CASH" | "PETTY_CASH" })
                }
                className="w-full mt-1.5 px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white"
              >
                <option value="BANK">Rekening Bank (Giro/Tabungan)</option>
                <option value="CASH">Kas Tunai (Brankas Pabrik)</option>
                <option value="PETTY_CASH">Kas Kecil (Petty Cash)</option>
              </select>
            </div>
          </div>

          <DnaInput
            label="Nama Pemegang Rekening (Atas Nama) *"
            placeholder="Misal: PT Karya Impian Laboratoris"
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
          />

          <DnaCurrencyInput
            label="Saldo Awal (Pembukaan)"
            value={formData.initialBalance}
            onChange={(val) => setFormData({ ...formData, initialBalance: val })}
          />

          <CoaSelect
            label="Mapping Akun COA Neraca *"
            value={formData.glAccountCode}
            onChange={(code) => setFormData({ ...formData, glAccountCode: code })}
            typeFilter="ASSET"
          />
        </div>
      </DnaCrudModal>
    </DnaPageContainer>
  );
}
