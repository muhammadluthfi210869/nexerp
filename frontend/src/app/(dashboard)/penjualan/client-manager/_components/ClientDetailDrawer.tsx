"use client";

import React from "react";
import { Link2, FileText } from "lucide-react";
import { DnaDetailDrawer, DnaButton } from "@/components/dna";
import {
  LeadRow,
  SalesOrderRow,
  GroupKey,
  formatRupiah,
  formatDate,
  STAGE_LABEL,
  stageVariant,
} from "../_types/client-manager.types";

function ScopeNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-900">
      <strong className="block mb-1">Catatan cakupan data</strong>
      {children}
    </div>
  );
}

interface ClientDetailDrawerProps {
  selectedLead: LeadRow | null;
  selectedGroup: GroupKey;
  drawerOrders: SalesOrderRow[];
  onClose: () => void;
}

export function ClientDetailDrawer({
  selectedLead,
  selectedGroup,
  drawerOrders,
  onClose,
}: ClientDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedLead}
      onClose={onClose}
      title={selectedLead ? selectedLead.clientName : "Detail Klien"}
      subtitle={selectedLead ? `${selectedLead.brandName} â€¢ ${selectedLead.productInterest}` : undefined}
      badge={selectedLead?.status}
      badgeVariant={
        selectedLead?.status === "WON_DEAL"
          ? "success"
          : selectedLead?.status === "LOST" || selectedLead?.status === "ABORTED"
          ? "danger"
          : "primary"
      }
      actions={
        <DnaButton variant="outline" onClick={onClose}>
          Tutup
        </DnaButton>
      }
    >
      {selectedLead && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">
                Nilai Estimasi
              </span>
              <span className="font-bold text-emerald-600 tabular-nums">
                {formatRupiah(selectedLead.estimatedValue)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Rencana MOQ</span>
              <span className="font-bold text-slate-800 tabular-nums">
                {selectedLead.moq.toLocaleString("id-ID")} pcs
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">
                Rencana Omset
              </span>
              <span className="font-bold text-slate-800 tabular-nums">
                {formatRupiah(selectedLead.planOmset)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">PIC BusDev</span>
              <span className="font-bold text-slate-800">{selectedLead.picName}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Kontak</span>
              <span className="text-slate-800 font-medium">{selectedLead.contactInfo}</span>
              <div className="text-slate-500">{selectedLead.email || "Email belum dicatat"}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Alamat</span>
              <span className="text-slate-800 font-medium">
                {[selectedLead.district, selectedLead.city, selectedLead.province]
                  .filter(Boolean)
                  .join(", ") || "â€”"}
              </span>
              <div className="text-slate-500">{selectedLead.addressDetail || "Detail alamat belum dicatat"}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Sumber Lead</span>
              <span className="text-slate-800 font-medium">{selectedLead.source}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">HKI</span>
              <span className="text-slate-800 font-medium">
                {selectedLead.hkiMode}
                {selectedLead.hkiProgress ? ` â€¢ ${selectedLead.hkiProgress}` : ""}
              </span>
              <div className="text-slate-500">Revisi logo: {selectedLead.logoRevision}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Dibuat / Diperbarui</span>
              <span className="text-slate-800 font-medium tabular-nums">
                {formatDate(selectedLead.createdAt)} â†’ {formatDate(selectedLead.updatedAt)}
              </span>
              <div className="text-slate-500">Tahap terakhir: {formatDate(selectedLead.lastStageAt)}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Order</span>
              <span className="text-slate-800 font-medium tabular-nums">
                {selectedLead.orderCount} order tercatat
              </span>
              <div className="text-slate-500">
                Formula terkunci: {selectedLead.isFormulaLocked ? "Ya" : "Tidak"} â€¢ Jadi produksi:{" "}
                {formatDate(selectedLead.convertedToProdAt)}
              </div>
            </div>
          </div>

          {selectedLead.spkFileUrl && (
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Berkas SPK</span>
              <a
                href={selectedLead.spkFileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:underline break-all"
              >
                <Link2 className="w-3.5 h-3.5 shrink-0" />
                {selectedLead.spkFileUrl}
              </a>
            </div>
          )}

          {drawerOrders.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Sales Order
              </h4>
              <div className="space-y-2">
                {drawerOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                  >
                    <div>
                      <span className="font-bold text-slate-700 tabular-nums">{o.orderNumber}</span>
                      <div className="text-slate-500">
                        {o.quantity.toLocaleString("id-ID")} pcs â€¢{" "}
                        {formatDate(o.transactionDate)} â†’ {formatDate(o.dueDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 tabular-nums">
                        {formatRupiah(o.totalAmount)}
                      </div>
                      <div className="text-slate-500">{o.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedLead.latestSample && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Permintaan Sample Terakhir
              </h4>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-700 tabular-nums">
                    {selectedLead.latestSample.sampleCode}
                  </span>
                  <div className="text-slate-500">{selectedLead.latestSample.productName}</div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageVariant(
                    selectedLead.latestSample.stage
                  )}`}
                >
                  {STAGE_LABEL[selectedLead.latestSample.stage] || selectedLead.latestSample.stage}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-500">
                <span>Revisi: {selectedLead.latestSample.revisionCount}</span>
                <span>Kirim: {formatDate(selectedLead.latestSample.shippedAt)}</span>
                <span>Target: {formatDate(selectedLead.latestSample.targetDeadline)}</span>
                <span>
                  Rating klien:{" "}
                  {selectedLead.latestSample.clientRating !== null
                    ? `${selectedLead.latestSample.clientRating}/5`
                    : "â€”"}
                </span>
              </div>
              {selectedLead.latestSample.clientComment && (
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {selectedLead.latestSample.clientComment}
                </p>
              )}
            </div>
          )}

          {selectedLead.latestActivity && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Aktivitas Terakhir
              </h4>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">{selectedLead.latestActivity.activityType}</span>
                <span className="text-slate-400 tabular-nums">
                  {formatDate(selectedLead.latestActivity.createdAt)}
                </span>
              </div>
              <p className="text-slate-600">{selectedLead.latestActivity.notes}</p>
              {selectedLead.latestActivity.amount !== null && (
                <p className="text-emerald-600 font-semibold tabular-nums">
                  Nilai: {formatRupiah(selectedLead.latestActivity.amount)}
                </p>
              )}
            </div>
          )}

          {selectedLead.notes && (
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Catatan Lead
              </span>
              <p className="text-amber-950 leading-relaxed font-medium whitespace-pre-wrap">
                {selectedLead.notes}
              </p>
            </div>
          )}

          <ScopeNote>
            Kolom yang sebelumnya tampil sebagai contoh â€” riwayat Sample 1 / Revisi 1 / Revisi 2 (NPF &
            tanggal kirim), budget closing, tanggal target DP, profil karakter klien, rekomendasi Head BD,
            serta checklist 16 milestone alur produksi (Desain Logo, HKI, BPOM Merk/NA, MOU, Desain Kemasan,
            Approval Desain, Bahan Baku, Pelunasan, Mixing, Bahan Kemas, Filling, Label, Box, Packing,
            Delivery) â€” tidak memiliki penyimpanan di backend, sehingga tidak ditampilkan di sini.
            Beberapa di antaranya hanya punya padanan sebagian: HKI â†’ <code className="font-mono">hkiMode</code>/
            <code className="font-mono">hkiProgress</code>, pelunasan â†’ status invoice pada Sales Order, dan
            tahap produksi â†’ <code className="font-mono">/production/*</code>.
            {selectedGroup === "ro" && " Data RO dibaca dari lead berstatus WON_DEAL (bukan tabel batch terpisah)."}
          </ScopeNote>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
