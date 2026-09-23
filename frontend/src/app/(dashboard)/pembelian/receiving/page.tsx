"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Plus,
  PackageCheck,
  Truck,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  Eye,
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
  DnaDetailDrawer,
  useDnaToast,
  DnaLoadingSkeleton,
  DnaEmptyState,
} from "@/components/dna";

export default function ReceivingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Penerimaan Barang...</div>}>
      <ReceivingContent />
    </Suspense>
  );
}

function ReceivingContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useDnaToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState("");
  const [doRef, setDoRef] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [taxTreatment, setTaxTreatment] = useState("PPN_11");

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const { data: purchaseOrders } = useQuery({
    queryKey: ["approved-po"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return (unwrapResponse(res) || [])
        .filter((po: any) => po.status === "ORDERED" || po.status === "PARTIAL")
        .map((po: any) => ({
          id: po.poNumber || po.id,
          vendor: po.supplier?.name || "-",
          items: (po.items || []).map((i: any) => ({
            name: i.material?.name || "-",
            qty: Number(i.quantity || 0),
            unit: i.material?.unit || "PCS",
          })),
        }));
    },
  });

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/scm/inbounds");
      const toNum = (v: any) => Number(v ?? 0);
      return (unwrapResponse(res) || []).map((grn: any) => {
        const items = grn.items || [];
        let qtyBagus = 0,
          qtyReject = 0,
          qtyFree = 0;
        for (const it of items) {
          const q = toNum(it.qtyActual);
          if (it.qcStatus === "GOOD") qtyBagus += q;
          else if (it.qcStatus === "REJECT") qtyReject += q;
          else qtyFree += q;
        }
        return {
          id: grn.inboundNumber || grn.id,
          poId: grn.po?.poNumber || grn.poId || "-",
          vendor: grn.po?.supplier?.name || grn.supplier?.name || grn.vendorName || "-",
          date: grn.receivedAt ? new Date(grn.receivedAt).toISOString().split("T")[0] : "-",
          status: grn.status === "APPROVED" ? "VERIFIED" : "PENDING",
          qc: grn.status === "APPROVED" ? "PASSED" : "WAITING",
          qtyBagus,
          qtyReject,
          qtyFree,
          items: items.map((it: any) => ({
            name: it.material?.name || it.itemName || "Material",
            qtyActual: toNum(it.qtyActual),
            qcStatus: it.qcStatus || "PENDING",
          })),
        };
      });
    },
  });

  const createGRNMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/inbounds", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Kedatangan GRN berhasil didaftarkan. Menunggu verifikasi QC Lab.");
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["approved-po"] });
      setIsModalOpen(false);
      setSelectedPO("");
      setDoRef("");
      setInvoiceNo("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mendaftarkan GRN.");
    },
  });

  const arrivalsToday = receipts?.filter((r: any) => r.date === new Date().toISOString().split("T")[0]).length || 0;
  const awaitingQc = receipts?.filter((r: any) => r.qc === "WAITING").length || 0;
  const verifiedMtd = receipts?.filter((r: any) => r.status === "VERIFIED").length || 0;
  const rejected = receipts?.filter((r: any) => r.status === "REJECTED" || r.qc === "FAILED").length || 0;

  const poOptions = (purchaseOrders || []).map((po: any) => ({ label: `${po.id} — ${po.vendor}`, value: po.id }));

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r: any) => {
      const matchSearch =
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.poId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.vendor.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL"
          ? true
          : activeTab === "WAITING_QC"
          ? r.qc === "WAITING"
          : activeTab === "VERIFIED"
          ? r.status === "VERIFIED"
          : activeTab === "REJECTED"
          ? r.status === "REJECTED" || r.qc === "FAILED"
          : true;

      return matchSearch && matchTab;
    });
  }, [receipts, searchQuery, activeTab]);

  return (
    <DnaPageContainer>
      {/* Header with Unified Tabs */}
      <DnaPageHeader
        title="Penerimaan Barang (Goods Receipt / GRN)"
        description="Pencatatan logistik masuk, serah terima QC lab 3-pilar fisik gudang (Bagus, Reject, Free)."
        badge={<DnaBadge variant="neutral">SCR-038 / SCM-REC</DnaBadge>}
        tabs={[
          { key: "ALL", label: "Semua Kedatangan", count: receipts.length },
          { key: "WAITING_QC", label: "Menunggu QC", count: awaitingQc },
          { key: "VERIFIED", label: "Terverifikasi", count: verifiedMtd },
          { key: "REJECTED", label: "Ditolak", count: rejected },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            + Daftarkan Kedatangan
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Kedatangan Hari Ini"
          value={`${arrivalsToday} GRN`}
          icon={<Truck className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="Menunggu Verifikasi QC"
          value={`${awaitingQc} GRN`}
          icon={<FileSearch className="w-5 h-5 text-amber-500" />}
          variant={awaitingQc > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Terverifikasi (MTD)"
          value={`${verifiedMtd} GRN`}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="Ditolak / Gagal QC"
          value={`${rejected} GRN`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          variant={rejected > 0 ? "critical" : "default"}
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchProps: {
              value: searchQuery,
              onChange: setSearchQuery,
              placeholder: "Cari ID GRN, PO, Pemasok...",
            },
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <th className="px-4 py-2.5 w-[160px]">No. GRN</th>
                  <th className="px-4 py-2.5 w-[150px]">No. Purchase Order</th>
                  <th className="px-4 py-2.5 w-[110px]">Tgl Terima</th>
                  <th className="px-4 py-2.5 min-w-[180px]">Supplier / Vendor</th>
                  <th className="px-4 py-2.5 w-[120px] text-right">Qty Bagus</th>
                  <th className="px-4 py-2.5 w-[110px] text-right">Qty Reject</th>
                  <th className="px-4 py-2.5 w-[120px] text-center">Status QC</th>
                  <th className="px-4 py-2.5 w-[120px] text-center">Status Siklus</th>
                  <th className="pr-4 py-2.5 w-[70px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center">
                      <DnaEmptyState
                        title="Belum Ada Penerimaan Barang"
                        description="Belum ada barang yang diterima pada filter ini."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((row: any) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedReceipt(row)}
                      className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-2.5">
                        <DnaCell.Code code={row.id} />
                      </td>
                      <td className="px-4 py-2.5">
                        <DnaCell.Code code={row.poId} />
                      </td>
                      <td className="px-4 py-2.5">
                        <DnaCell.Text text={row.date} />
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{row.vendor}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        <span className="text-[12px] font-semibold text-emerald-700">
                          {row.qtyBagus.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        <span className={`text-[12px] font-semibold ${row.qtyReject > 0 ? "text-rose-600" : "text-slate-400"}`}>
                          {row.qtyReject.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <DnaBadge
                          variant={
                            row.qc === "PASSED"
                              ? "success"
                              : row.qc === "WAITING"
                              ? "warning"
                              : "critical"
                          }
                        >
                          {row.qc === "PASSED" ? "Lolos QC" : row.qc === "WAITING" ? "Menunggu QC" : "Gagal QC"}
                        </DnaBadge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <DnaBadge variant={row.status === "VERIFIED" ? "info" : "neutral"}>
                          {row.status === "VERIFIED" ? "Terverifikasi" : "Pending"}
                        </DnaBadge>
                      </td>
                      <td className="pr-4 py-2.5 text-right">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            onClick={() => setSelectedReceipt(row)}
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </DnaButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      )}

      {/* DnaDetailDrawer for Quick Inspection */}
      <DnaDetailDrawer
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt?.id || "Rincian Penerimaan Barang"}
        subtitle={selectedReceipt ? `Supplier: ${selectedReceipt.vendor} • PO: ${selectedReceipt.poId}` : undefined}
        badge={
          selectedReceipt ? (
            <DnaBadge variant={selectedReceipt.qc === "PASSED" ? "success" : "warning"}>
              QC: {selectedReceipt.qc}
            </DnaBadge>
          ) : undefined
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500">Status Siklus: {selectedReceipt?.status}</span>
            <DnaButton variant="outline" size="sm" onClick={() => setSelectedReceipt(null)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedReceipt && (
          <div className="space-y-5 text-xs">
            {/* 3-Pilar Grid Breakdown */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-center">
                <span className="text-slate-500 block text-[11px]">Bagus (Lolos QC)</span>
                <span className="font-bold text-emerald-700 font-mono text-lg">{selectedReceipt.qtyBagus}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-500 block text-[11px]">Reject (Cacat)</span>
                <span className="font-bold text-rose-700 font-mono text-lg">{selectedReceipt.qtyReject}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-500 block text-[11px]">Free (Bonus HPP 0)</span>
                <span className="font-bold text-amber-700 font-mono text-lg">{selectedReceipt.qtyFree}</span>
              </div>
            </div>

            {/* Inbound Items */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Item Material Diterima
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Nama Material</th>
                      <th className="py-2.5 px-3 text-right">Qty Aktual</th>
                      <th className="py-2.5 px-3 text-center">Status QC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {(selectedReceipt.items || []).map((it: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">{it.name}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{it.qtyActual}</td>
                        <td className="py-2 px-3 text-center">
                          <DnaBadge variant={it.qcStatus === "GOOD" ? "success" : "warning"}>
                            {it.qcStatus}
                          </DnaBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Pendaftaran Kedatangan GRN */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Penerimaan Barang Baru (GRN)"
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              disabled={createGRNMutation.isPending}
              onClick={() => {
                const selectedPoObj = purchaseOrders?.find((po: any) => po.id === selectedPO);
                createGRNMutation.mutate({
                  poId: selectedPO,
                  warehouseId: undefined,
                  items: (selectedPoObj?.items || []).map((i: any) => ({
                    materialId: i.id || i.name,
                    qtyActual: Number(i.qty || 0),
                  })),
                });
              }}
            >
              {createGRNMutation.isPending ? "Menyimpan..." : "Simpan Kedatangan"}
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Hubungkan ke PO Aktif *</label>
            <DnaSelect
              placeholder="Cari PO Aktif..."
              value={selectedPO}
              onChange={setSelectedPO}
              options={poOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. DO / Surat Jalan Pengiriman</label>
              <DnaInput placeholder="Contoh: SJ-2026-0041" value={doRef} onChange={(e) => setDoRef(e.target.value)} />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. Faktur Vendor (Jika Ada)</label>
              <DnaInput placeholder="Contoh: INV-9901" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal & Waktu Kedatangan</label>
              <DnaInput type="datetime-local" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Perlakuan Pajak</label>
              <DnaSelect
                value={taxTreatment}
                onChange={setTaxTreatment}
                options={[
                  { label: "NON TAXABLE", value: "NON_TAX" },
                  { label: "PPN 11%", value: "PPN_11" },
                ]}
              />
            </div>
          </div>

          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-blue-900">Verifikasi QC Terintegrasi</p>
                <p className="text-[10px] text-blue-700">Setelah disimpan, kedatangan otomatis masuk ke antrean uji lab QC.</p>
              </div>
            </div>
            <DnaBadge variant="info">Gate 1: Inbound</DnaBadge>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
