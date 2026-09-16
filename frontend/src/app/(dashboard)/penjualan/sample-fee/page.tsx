"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaCell,
  DnaModal,
  DnaInput,
  formatRupiah,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { Plus, Eye, CheckCircle2, Clock, XCircle, Search, DollarSign } from "lucide-react";

interface SampleFeeRecord {
  id: string;
  feeNo: string;
  clientName: string;
  date: string;
  amount: number;
  status: "RECEIVED" | "OFFSET" | "EXPIRED";
  offsetTo: string;
  jobOrderRef: string;
  notes?: string;
}

const SAMPLE_FEES: SampleFeeRecord[] = [
  {
    id: "sf-1",
    feeNo: "SF-202609-001",
    clientName: "PT Cantika Jelita Nusantara",
    date: "2026-09-01",
    amount: 1500000,
    status: "OFFSET",
    offsetTo: "DP-PRD-2026-088",
    jobOrderRef: "JO-SMP-001",
    notes: "Offset ke DP PO Produksi Batch 1"
  },
  {
    id: "sf-2",
    feeNo: "SF-202609-002",
    clientName: "M. Setyo (Anasera)",
    date: "2026-09-03",
    amount: 750000,
    status: "RECEIVED",
    offsetTo: "—",
    jobOrderRef: "JO-SMP-002",
    notes: "Biaya riset 2 varian massage cream"
  },
  {
    id: "sf-3",
    feeNo: "SF-202609-003",
    clientName: "Rizka (Skin Haven)",
    date: "2026-09-05",
    amount: 500000,
    status: "RECEIVED",
    offsetTo: "—",
    jobOrderRef: "JO-SMP-003",
    notes: "Biaya sample soothing gel aloe"
  },
  {
    id: "sf-4",
    feeNo: "SF-202608-012",
    clientName: "Bapak Tommy Lee",
    date: "2026-08-10",
    amount: 500000,
    status: "EXPIRED",
    offsetTo: "—",
    jobOrderRef: "JO-SMP-091",
    notes: "Klien tidak lanjut PO melebihi masa validitas 30 hari"
  }
];

export default function SampleFeePaymentPage() {
  const [data, setData] = useState<SampleFeeRecord[]>(SAMPLE_FEES);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SampleFeeRecord | null>(null);

  // Form State
  const [formClient, setFormClient] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formAmount, setFormAmount] = useState("500000");
  const [formBank, setFormBank] = useState("BCA Operasional (029-1122-334)");
  const [formJobRef, setFormJobRef] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const filtered = data.filter(
    (d) =>
      d.feeNo.toLowerCase().includes(search.toLowerCase()) ||
      d.clientName.toLowerCase().includes(search.toLowerCase()) ||
      d.jobOrderRef.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceived = data.filter((d) => d.status === "RECEIVED").reduce((acc, c) => acc + c.amount, 0);
  const totalOffset = data.filter((d) => d.status === "OFFSET").reduce((acc, c) => acc + c.amount, 0);
  const totalExpired = data.filter((d) => d.status === "EXPIRED").reduce((acc, c) => acc + c.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: SampleFeeRecord = {
      id: `sf-${Date.now()}`,
      feeNo: `SF-202609-${String(data.length + 1).padStart(3, "0")}`,
      clientName: formClient,
      date: formDate,
      amount: parseFloat(formAmount) || 0,
      status: "RECEIVED",
      offsetTo: "—",
      jobOrderRef: formJobRef || `JO-SMP-${String(data.length + 1).padStart(3, "0")}`,
      notes: formNotes,
    };
    setData([newRecord, ...data]);
    setIsModalOpen(false);
    setFormClient("");
    setFormNotes("");
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pembayaran & Komitmen Sample Fee"
        subtitle="Pencatatan pembayaran fee riset sample, pelacakan masa berlaku (validity), dan mekanisme offset ke DP produksi"
        breadcrumbs={[{ label: "Penjualan", href: "/sales" }, { label: "Sample Fee" }]}
        actions={
          <DnaButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            + Buat Sample Fee
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Sample Fee Aktif"
          value={formatRupiah(totalReceived)}
          icon={<DollarSign className="w-4 h-4" />}
          delta={{ value: `${data.filter((d) => d.status === "RECEIVED").length} Sample Belum Offset`, isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Telah Di-Offset ke DP"
          value={formatRupiah(totalOffset)}
          icon={<CheckCircle2 className="w-4 h-4" />}
          delta={{ value: "Kompensasi ke Kontrak Produksi", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Sample Fee Expired"
          value={formatRupiah(totalExpired)}
          icon={<XCircle className="w-4 h-4" />}
          delta={{ value: "Hangus / Diakui Pendapatan Non-Refund", isPositive: false }}
          variant="danger"
        />
        <DnaStatCard
          label="Total Transaksi Fee"
          value={`${data.length} Transaksi`}
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: "Akumulasi Siklus Sample", isPositive: true }}
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Komitmen & Offset Sample Fee"
        count={filtered.length}
        totalItems={data.length}
        actions={
          <div className="w-64">
            <DnaInput
              placeholder="Cari no fee, klien, job order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Sample Fee No</th>
                <th className="px-4 py-3">Prospective Client / Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Offset To</th>
                <th className="px-4 py-3">Job Order Ref</th>
                <th className="px-4 py-3 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-blue-600">{item.feeNo}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.clientName}</td>
                  <td className="px-4 py-3 text-slate-600">{item.date}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge
                      variant={
                        item.status === "OFFSET"
                          ? "emerald"
                          : item.status === "RECEIVED"
                          ? "blue"
                          : "neutral"
                      }
                    >
                      {item.status}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{item.offsetTo}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{item.jobOrderRef}</td>
                  <td className="px-4 py-3 text-right">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedRecord(item)}
                    >
                      Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail */}
      <DnaModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Detail Sample Fee: ${selectedRecord?.feeNo || ""}`}
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Nomor Fee</span>
                <span className="font-mono font-bold text-slate-800">{selectedRecord.feeNo}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Tanggal Pembayaran</span>
                <span className="font-medium text-slate-800">{selectedRecord.date}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Klien / Prospek</span>
                <span className="font-semibold text-slate-900">{selectedRecord.clientName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Nominal Komitmen</span>
                <span className="font-mono font-bold text-blue-600">{formatRupiah(selectedRecord.amount)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Referensi Job Order</span>
                <span className="font-mono text-slate-700">{selectedRecord.jobOrderRef}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Status Penggunaan</span>
                <DnaBadge
                  variant={
                    selectedRecord.status === "OFFSET"
                      ? "emerald"
                      : selectedRecord.status === "RECEIVED"
                      ? "blue"
                      : "neutral"
                  }
                >
                  {selectedRecord.status}
                </DnaBadge>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Offset ke Kontrak DP</span>
              <p className="font-mono text-slate-700 mt-1">{selectedRecord.offsetTo}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Catatan Operasional</span>
              <p className="text-slate-600 mt-1">{selectedRecord.notes || "—"}</p>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedRecord(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Buat Fee */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Penerimaan Sample Fee"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Prospective Client / Customer *
            </label>
            <DnaInput
              placeholder="Ketik nama klien atau calon brand..."
              value={formClient}
              onChange={(e) => setFormClient(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Tanggal Pembayaran *</label>
              <DnaInput
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Nominal Fee (Rp) *</label>
              <DnaInput
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Rekening Bank Tujuan *</label>
            <select
              value={formBank}
              onChange={(e) => setFormBank(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
            >
              <option value="BCA Operasional (029-1122-334)">BCA Operasional (029-1122-334)</option>
              <option value="Mandiri Bisnis (137-00-9821-44)">Mandiri Bisnis (137-00-9821-44)</option>
              <option value="BNI Maklon (088-234-5678)">BNI Maklon (088-234-5678)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Referensi Job Order Sample</label>
            <DnaInput
              placeholder="Contoh: JO-SMP-004"
              value={formJobRef}
              onChange={(e) => setFormJobRef(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Catatan Tambahan</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              placeholder="Catatan formulasi atau target kompensasi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Data
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </DnaPageContainer>
  );
}
