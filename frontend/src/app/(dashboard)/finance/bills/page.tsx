"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  Search,
  CreditCard,
  AlertCircle,
  Truck,
  Receipt,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Eye,
  FileText
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaInput,
  DnaSelect,
  DnaModal,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaCell,
} from "@/components/dna";

interface Bill {
  id: string;
  vendor: string;
  date: string;
  dueDate: string;
  total: number;
  status: string;
}

export default function VendorBillsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const toast = useDnaToast();
  const [billForm, setBillForm] = useState({ vendorId: "", billRef: "", issueDate: "", dueDate: "", amount: 0 });

  const createBillMutation = useMutation({
    mutationFn: async () => api.post("/finance/bills", billForm),
    onSuccess: () => {
      toast.success("Tagihan supplier berhasil dicatat ke buku hutang.");
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      setIsModalOpen(false);
      setBillForm({ vendorId: "", billRef: "", issueDate: "", dueDate: "", amount: 0 });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Gagal mencatat tagihan supplier."),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/scm/vendors");
      return res.data || [];
    },
  });

  const { data: bills = [], isLoading } = useQuery<Bill[]>({
    queryKey: ["vendor-bills"],
    queryFn: async () => {
      const resp = await api.get("/finance/bills");
      return (resp.data || []).map((b: any) => ({
        id: b.billNumber,
        // An invoice whose supplierId is null — the live case for every row on
        // 2026-09-26 — sends vendorName: null, and the search filter below calls
        // .toLowerCase() on it. Without a string here the screen threw as soon as
        // anyone searched for a vendor, which is what its placeholder invites.
        vendor: b.vendorName || "Vendor tidak diketahui",
        date: new Date(b.createdAt).toISOString().split("T")[0],
        dueDate: new Date(b.dueDate).toISOString().split("T")[0],
        total: Number(b.totalAmount),
        status: b.status,
      }));
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["finance-stats"],
    queryFn: async () => {
      const resp = await api.get("/finance/dashboard/advanced");
      return resp.data?.metrics;
    },
  });

  const filteredBills = bills.filter(
    (b) =>
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <DnaBadge variant="success">Lunas</DnaBadge>;
      case "PARTIAL":
        return <DnaBadge variant="warning">Sebagian</DnaBadge>;
      case "UNPAID":
      case "OVERDUE":
        return <DnaBadge variant="critical">Belum Bayar</DnaBadge>;
      default:
        return <DnaBadge variant="default">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Tagihan Supplier (Vendor Bills AP)"
        description="Pencatatan kewajiban hutang dagang, jadwal jatuh tempo pembayaran faktur, dan verifikasi AP."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-semibold">
            <Receipt className="w-3.5 h-3.5" />
            <span>Accounts Payable</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Laporan hutang diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              + Catat Tagihan Baru
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Hutang Dagang (AP)"
          value={`Rp ${(stats?.apTotal || 0).toLocaleString("id-ID")}`}
          icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
          variant="warning"
          subtext="Akumulasi tagihan supplier berjalan"
        />
        <DnaStatCard
          label="Beban Operasional Bulanan"
          value={`Rp ${(stats?.expense || 0).toLocaleString("id-ID")}`}
          icon={<CreditCard className="w-5 h-5 text-amber-600" />}
          variant="default"
          subtext="Biaya utilitas & pabrik MTD"
        />
        <DnaStatCard
          label="Piutang Belum Tertagih"
          value={`Rp ${(stats?.uncollected || 0).toLocaleString("id-ID")}`}
          icon={<Truck className="w-5 h-5 text-blue-600" />}
          variant="info"
          subtext="Saldo AR belum dilunasi klien"
        />
        <DnaStatCard
          label="Penerimaan Kas (MTD)"
          value={`Rp ${(stats?.cashIn || 0).toLocaleString("id-ID")}`}
          icon={<Receipt className="w-5 h-5 text-emerald-600" />}
          variant="success"
          subtext="Kas masuk bersih bulan ini"
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery: searchTerm,
          onSearchChange: setSearchTerm,
          searchPlaceholder: "Cari No Tagihan, Nama Vendor Supplier...",
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="w-[140px]">No. Tagihan</DnaTh>
                <DnaTh className="w-[110px]">Tgl Terbit</DnaTh>
                <DnaTh className="w-[110px]">Jatuh Tempo</DnaTh>
                <DnaTh>Vendor Supplier</DnaTh>
                <DnaTh align="center" className="w-[130px]">Tipe Tagihan</DnaTh>
                <DnaTh align="right" className="w-[140px]">Total Hutang</DnaTh>
                <DnaTh align="center" className="w-[130px]">Status</DnaTh>
                <DnaTh align="right" className="w-[90px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredBills.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada tagihan supplier yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredBills.map((bill) => (
                  <DnaTableRow
                    key={bill.id}
                    className="group"
                  >
                    {/* Kolom 1: No. Tagihan */}
                    <DnaTd>
                      <DnaCell.Code value={bill.id} />
                    </DnaTd>

                    {/* Kolom 2: Tgl Terbit */}
                    <DnaTd>
                      <DnaCell.Date value={bill.date} />
                    </DnaTd>

                    {/* Kolom 3: Jatuh Tempo */}
                    <DnaTd>
                      <DnaCell.Date value={bill.dueDate} />
                    </DnaTd>

                    {/* Kolom 4: Vendor Supplier */}
                    <DnaTd isPrimary>
                      <DnaCell.Text primary={bill.vendor} />
                    </DnaTd>

                    {/* Kolom 5: Tipe Tagihan */}
                    <DnaTd align="center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        Hutang Bahan / AP
                      </span>
                    </DnaTd>

                    {/* Kolom 6: Total Hutang */}
                    <DnaTd align="right">
                      <DnaCell.Currency value={bill.total} />
                    </DnaTd>

                    {/* Kolom 7: Status */}
                    <DnaTd align="center">
                      {getStatusBadge(bill.status)}
                    </DnaTd>

                    {/* Kolom 8: Aksi */}
                    <DnaTd align="right">
                      <div className="flex items-center justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
                          onClick={() => toast.info(`Verifikasi dokumen tagihan ${bill.id}`)}
                          title="Verifikasi Tagihan"
                        />
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Buat Tagihan */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Tagihan Supplier Baru"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Pilih Vendor Supplier *</label>
            <DnaSelect
              value={billForm.vendorId}
              onChange={(val) => setBillForm({ ...billForm, vendorId: val })}
              options={vendors.map((v: any) => ({ label: v.name, value: v.id || "" }))}
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nomor Referensi Faktur Supplier *</label>
            <DnaInput
              placeholder="e.g. INV/SUP/2026/089"
              value={billForm.billRef}
              onChange={(e) => setBillForm({ ...billForm, billRef: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal Terbit *</label>
              <DnaInput
                type="date"
                value={billForm.issueDate}
                onChange={(e) => setBillForm({ ...billForm, issueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Jatuh Tempo *</label>
              <DnaInput
                type="date"
                value={billForm.dueDate}
                onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Total Tagihan (IDR) *</label>
            <DnaInput
              type="number"
              placeholder="0"
              value={billForm.amount || ""}
              onChange={(e) => setBillForm({ ...billForm, amount: Number(e.target.value) })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <DnaButton variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              onClick={() => createBillMutation.mutate()}
              disabled={createBillMutation.isPending}
            >
              {createBillMutation.isPending ? "Menyimpan..." : "Simpan Tagihan"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
