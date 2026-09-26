"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  useDnaToast,
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

export default function BankAccountsPage() {
  const qc = useQueryClient();
  const toast = useDnaToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rawAccounts = [], isLoading } = useQuery<any[]>({
    queryKey: ["finance-bank-accounts"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/bank-accounts");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const accounts: BankAccount[] = useMemo(() => {
    return rawAccounts.map((a: any) => ({
      id: a.id,
      bankName: a.bankName || a.accountCode || "Bank",
      accountNumber: a.accountNumber || "-",
      accountName: a.notes || a.bankName || "Rekening Operasional",
      accountType: (a.accountType || "BANK") as "BANK" | "CASH" | "PETTY_CASH",
      currency: a.currencyCode || a.currency || "IDR",
      currentBalance: Number(a.currentBalance || a.initialBalance || 0),
      glAccountCode: a.glAccountId || a.glAccountCode || "1110",
      isActive: a.isActive !== false,
    }));
  }, [rawAccounts]);

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

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/finance/bank-accounts", payload),
    onSuccess: () => {
      toast.success("Rekening kas/bank berhasil ditambahkan");
      qc.invalidateQueries({ queryKey: ["finance-bank-accounts"] });
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
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat rekening kas/bank");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/finance/bank-accounts/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-bank-accounts"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mengubah status rekening");
    },
  });

  const handleCreate = () => {
    if (!formData.bankName || !formData.accountNumber) {
      toast.error("Nama bank dan nomor rekening wajib diisi");
      return;
    }
    const accountCode = `${formData.bankName.slice(0, 4).toUpperCase()}-${formData.accountNumber.slice(-4)}`;
    createMutation.mutate({
      accountCode,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      accountType: formData.accountType,
      currencyCode: formData.currency,
      initialBalance: Number(formData.initialBalance),
      notes: formData.accountName,
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

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari nama bank, nomor rekening, atau pemegang rekening...",
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh>Nama Bank / Kas</DnaTh>
                <DnaTh className="w-[140px]">Nomor Rekening</DnaTh>
                <DnaTh>Atas Nama</DnaTh>
                <DnaTh align="center" className="w-[120px]">Tipe Rekening</DnaTh>
                <DnaTh className="w-[120px]">Mapping COA</DnaTh>
                <DnaTh align="right" className="w-[150px]">Saldo Berjalan</DnaTh>
                <DnaTh align="center" className="w-[110px]">Status</DnaTh>
                <DnaTh align="center" className="w-[110px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filtered.map((acc) => (
                <DnaTableRow key={acc.id} className="group">
                  {/* Kolom 1: Nama Bank / Kas (1 Natural Pair) */}
                  <DnaTd>
                    <DnaCell.Text
                      primary={acc.bankName}
                      secondary={`${acc.currency} (Indonesian Rupiah)`}
                    />
                  </DnaTd>

                  {/* Kolom 2: Nomor Rekening */}
                  <DnaTd>
                    <DnaCell.Code value={acc.accountNumber} />
                  </DnaTd>

                  {/* Kolom 3: Atas Nama */}
                  <DnaTd isPrimary className="truncate max-w-[200px]">
                    {acc.accountName}
                  </DnaTd>

                  {/* Kolom 4: Tipe Rekening */}
                  <DnaTd align="center">
                    <DnaBadge
                      variant={
                        acc.accountType === "BANK" ? "info" : acc.accountType === "CASH" ? "warning" : "purple"
                      }
                    >
                      {acc.accountType}
                    </DnaBadge>
                  </DnaTd>

                  {/* Kolom 5: Mapping Akun COA */}
                  <DnaTd>
                    <DnaCell.Code value={acc.glAccountCode} />
                  </DnaTd>

                  {/* Kolom 6: Saldo Berjalan */}
                  <DnaTd align="right">
                    <DnaCell.Currency value={acc.currentBalance} className="font-semibold text-slate-900" />
                  </DnaTd>

                  {/* Kolom 7: Status */}
                  <DnaTd align="center">
                    <DnaBadge variant={acc.isActive ? "success" : "default"}>
                      {acc.isActive ? "Aktif" : "Non-Aktif"}
                    </DnaBadge>
                  </DnaTd>

                  {/* Kolom 8: Aksi */}
                  <DnaTd align="center">
                    <DnaButton
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        toggleMutation.mutate({ id: acc.id, isActive: !acc.isActive })
                      }
                      disabled={toggleMutation.isPending}
                    >
                      {acc.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
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
<DnaSelect 
                value={formData.accountType}
                onChange={(value) =>
                  setFormData({ ...formData, accountType: value as "BANK" | "CASH" | "PETTY_CASH" })
                }
                className="w-full mt-1.5 px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white"
              >
                <option value="BANK">Rekening Bank (Giro/Tabungan)</option>
                <option value="CASH">Kas Tunai (Brankas Pabrik)</option>
                <option value="PETTY_CASH">Kas Kecil (Petty Cash)</option>
              </DnaSelect>
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
