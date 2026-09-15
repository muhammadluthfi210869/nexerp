"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Plus,
  PackageCheck,
  Truck,
  ClipboardCheck,
  ShieldCheck,
  MoreVertical,
  AlertTriangle,
  FileSearch,
} from "lucide-react";
import { DnaButton, DnaBadge, DnaInput, DnaStatCard, DnaDataTableCard, DnaModal, DnaSelect, DnaCell } from "@/components/dna";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/empty-state";

// SPEC: SCR-SCM-REC-001 — Goods Receipt (Penerimaan Barang) with 3-Pilar Gudang
// 3-Pilar Gudang invariant: qtyGood + qtyReject + qtyFree === qtyReceived
// (current GRN list view; full 3-Pilar input is in the inbound form payload)

export default function ReceivingPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState("");
  const [doRef, setDoRef] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [taxTreatment, setTaxTreatment] = useState("PPN_11");

  const { data: purchaseOrders } = useQuery({
    queryKey: ["approved-po"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return (unwrapResponse(res) || [])
        .filter((po: any) => po.status === 'ORDERED' || po.status === 'PARTIAL')
        .map((po: any) => ({
          id: po.poNumber || po.id,
          vendor: po.supplier?.name || '-',
          items: (po.items || []).map((i: any) => ({
            name: i.material?.name || '-',
            qty: Number(i.quantity || 0),
            unit: i.material?.unit || 'PCS',
          })),
        }));
    }
  });

  const { data: receipts, isLoading } = useQuery({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/scm/inbounds");
      // 3-pilar gudang: aggregate qtyBagus/qtyReject/qtyFree from inbound items.
      // Bagus = QC GOOD, Reject = QC REJECT, Free = QUARANTINE (in transit).
      const toNum = (v: any) => Number(v ?? 0);
      return (unwrapResponse(res) || []).map((grn: any) => {
        const items = grn.items || [];
        let qtyBagus = 0, qtyReject = 0, qtyFree = 0;
        for (const it of items) {
          const q = toNum(it.qtyActual);
          if (it.qcStatus === 'GOOD') qtyBagus += q;
          else if (it.qcStatus === 'REJECT') qtyReject += q;
          else qtyFree += q;
        }
        const hasItems = items.length > 0;
        return {
          id: grn.inboundNumber || grn.id,
          poId: grn.po?.poNumber || grn.poId || '-',
          vendor: grn.po?.supplier?.name || '-',
          date: grn.receivedAt ? new Date(grn.receivedAt).toISOString().split('T')[0] : '-',
          status: grn.status === 'APPROVED' ? 'VERIFIED' : 'PENDING',
          qc: grn.status === 'APPROVED' ? 'PASSED' : 'WAITING',
          qtyBagus,
          qtyReject,
          qtyFree,
          hasItems,
        };
      });
    }
  });

  const createGRNMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/inbounds", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("GRN registered. Waiting for QC Lab verification.");
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["approved-po"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to register GRN.");
    }
  });

  const arrivalsToday = receipts?.filter((r: any) => r.date === new Date().toISOString().split('T')[0]).length || 0;
  const awaitingQc = receipts?.filter((r: any) => r.qc === 'WAITING').length || 0;
  const verifiedMtd = receipts?.filter((r: any) => r.status === 'VERIFIED').length || 0;
  const rejected = receipts?.filter((r: any) => r.status === 'REJECTED' || r.qc === 'FAILED').length || 0;

  const poOptions = (purchaseOrders || []).map((po: any) => ({ label: `${po.id} — ${po.vendor}`, value: po.id }));

  return (
    <DashboardShell
      title="PENERIMAAN"
      titleAccent="BARANG"
      subtitle="Verifikasi logistik masuk & serah terima QC"
      actions={
        <DnaButton variant="primary" size="lg" icon={<Plus className="h-5 w-5 stroke-[3px]" />} onClick={() => setIsModalOpen(true)}>
          Daftarkan Kedatangan
        </DnaButton>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DnaStatCard label="Kedatangan Hari Ini" value={arrivalsToday} icon={<Truck />} variant="blue" />
        <DnaStatCard label="Menunggu QC" value={awaitingQc} icon={<FileSearch />} variant="amber" />
        <DnaStatCard label="Terverifikasi (MTD)" value={verifiedMtd} icon={<ShieldCheck />} variant="emerald" />
        <DnaStatCard label="Ditolak" value={rejected} icon={<AlertTriangle />} variant="rose" />
      </div>

      <DnaDataTableCard
        title="Daftar Penerimaan Barang (GRN)"
        count={receipts?.length || 0}
        searchPlaceholder="Cari ID GRN / PO / Vendor..."
      >
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
              <th className="p-3.5">ID GRN</th>
              <th className="p-3.5">PO Asal</th>
              <th className="p-3.5">Pemasok</th>
              <th className="p-3.5 text-center">3-Pilar Gudang<br/><span className="text-[9px] font-medium text-slate-400">(Bagus / Reject / Free)</span></th>
              <th className="p-3.5 text-center">Status QC</th>
              <th className="p-3.5 text-center">Siklus</th>
              <th className="p-3.5 text-right">Verifikasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!isLoading && (!receipts || receipts.length === 0) ? (
              <tr>
                <td colSpan={7} className="p-6">
                  <EmptyState
                    icon={<PackageCheck className="h-8 w-8 text-slate-300" />}
                    title="Belum Ada Penerimaan"
                    description="Belum ada barang yang diterima. Daftarkan kedatangan baru untuk memulai."
                    action={
                      <DnaButton variant="primary" onClick={() => setIsModalOpen(true)}>
                        Daftarkan Kedatangan
                      </DnaButton>
                    }
                  />
                </td>
              </tr>
            ) : (receipts || []).map((receipt: any) => (
              <tr key={receipt.id} className="hover:bg-slate-50/80">
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 uppercase italic">{receipt.id}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{receipt.date}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3.5"><DnaCell.Text primary={receipt.poId} /></td>
                <td className="p-3.5"><DnaCell.Text primary={receipt.vendor} /></td>
                <td className="p-3.5 text-center">
                  {receipt.hasItems ? (
                    <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <ShieldCheck className="h-3 w-3" /> {receipt.qtyBagus}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                        <AlertTriangle className="h-3 w-3" /> {receipt.qtyReject}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                        <FileSearch className="h-3 w-3" /> {receipt.qtyFree}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </td>
                <td className="p-3.5 text-center">
                  <DnaBadge status={
                    receipt.qc === 'PASSED' ? 'success' :
                    receipt.qc === 'WAITING' ? 'warning' : 'critical'
                  }>
                    {receipt.qc}
                  </DnaBadge>
                </td>
                <td className="p-3.5 text-center">
                  <DnaBadge status={receipt.status === 'VERIFIED' ? 'info' : 'default'}>
                    {receipt.status}
                  </DnaBadge>
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex justify-end gap-2">
                    <DnaButton variant="ghost" size="sm" icon={<FileSearch className="h-3 w-3" />}>
                      Inspeksi
                    </DnaButton>
                    <DnaButton variant="ghost" size="icon" icon={<MoreVertical className="h-4 w-4" />} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DnaDataTableCard>

      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Penerimaan Barang Baru (GRN)"
        subtitle="Inventory Integrity Protocol v2.4"
        size="2xl"
        footer={
          <>
            <DnaButton variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</DnaButton>
            <DnaButton
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={createGRNMutation.isPending}
              onClick={() => {
                const selectedPo = purchaseOrders?.find((po: any) => po.id === selectedPO);
                createGRNMutation.mutate({
                  poId: selectedPO,
                  warehouseId: undefined,
                  items: (selectedPo?.items || []).map((i: any) => ({
                    materialId: i.id || i.name,
                    qtyActual: Number(i.qty || 0),
                  })),
                });
              }}
            >
              {createGRNMutation.isPending ? 'MENGIRIM...' : 'Simpan Kedatangan'}
            </DnaButton>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <DnaSelect
              label="Hubungkan ke PO"
              placeholder="Cari PO Aktif..."
              value={selectedPO}
              onChange={setSelectedPO}
              options={poOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <DnaInput label="No. DO / Referensi" placeholder="No. Pengiriman Vendor" value={doRef} onChange={(e) => setDoRef(e.target.value)} />
            <DnaInput label="No. Faktur (Invoice)" placeholder="F-2400-XXXXX" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <DnaInput label="Tanggal Kedatangan" type="datetime-local" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
            <DnaSelect
              label="Perlakuan Pajak"
              value={taxTreatment}
              onChange={setTaxTreatment}
              options={[
                { label: 'NON TAXABLE', value: 'NON_TAX' },
                { label: 'PPN 11%', value: 'PPN_11' },
              ]}
            />
          </div>

          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight">QC Handshake Required</p>
                <p className="text-xs font-black text-blue-700 mt-0.5">Verification will be routed to QC Lab.</p>
              </div>
            </div>
            <DnaBadge status="info" className="bg-white">
              Gate 1: Registry
            </DnaBadge>
          </div>
        </div>
      </DnaModal>
    </DashboardShell>
  );
}
