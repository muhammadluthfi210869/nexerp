"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput, DnaSelect } from "@/components/dna";
import type { SalesTargetItem } from "../_types/sales-target.types";
import { MONTHS_ID } from "../_types/sales-target.types";
import type { useSalesTargetOperations } from "../_hooks/useSalesTargetOperations";

interface TargetFormModalProps {
  ops?: ReturnType<typeof useSalesTargetOperations>;
  isOpen?: boolean;
  onClose?: () => void;
  editingTarget?: SalesTargetItem | null;
  formUserId?: string;
  setFormUserId?: (value: string) => void;
  userOptions?: { value: string; label: string }[];
  formMonth?: number;
  setFormMonth?: (value: number) => void;
  formYear?: number;
  setFormYear?: (value: number) => void;
  formNominal?: string;
  setFormNominal?: (value: string) => void;
  formNotes?: string;
  setFormNotes?: (value: string) => void;
  onSave?: () => void;
  isPending?: boolean;
}

export function TargetFormModal(props: TargetFormModalProps) {
  const isOpen = props.isOpen ?? props.ops?.isTargetModalOpen ?? false;
  const onClose = props.onClose ?? (() => props.ops?.setIsTargetModalOpen(false));
  const editingTarget = props.editingTarget !== undefined ? props.editingTarget : (props.ops?.editingTarget ?? null);
  const formUserId = props.formUserId ?? props.ops?.formUserId ?? "";
  const setFormUserId = props.setFormUserId ?? props.ops?.setFormUserId ?? (() => {});
  const userOptions = props.userOptions ?? props.ops?.userOptions ?? [];
  const formMonth = props.formMonth ?? props.ops?.formMonth ?? 1;
  const setFormMonth = props.setFormMonth ?? props.ops?.setFormMonth ?? (() => {});
  const formYear = props.formYear ?? props.ops?.formYear ?? 2026;
  const setFormYear = props.setFormYear ?? props.ops?.setFormYear ?? (() => {});
  const formNominal = props.formNominal ?? props.ops?.formNominal ?? "";
  const setFormNominal = props.setFormNominal ?? props.ops?.setFormNominal ?? (() => {});
  const formNotes = props.formNotes ?? props.ops?.formNotes ?? "";
  const setFormNotes = props.setFormNotes ?? props.ops?.setFormNotes ?? (() => {});
  const onSave = props.onSave ?? props.ops?.handleSaveTarget ?? (() => {});
  const isPending = props.isPending ?? props.ops?.saveTargetMutation.isPending ?? false;

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTarget ? `Sunting Target: ${editingTarget.marketingName}` : "Alokasikan Target Penjualan Baru"}
      subtitle="Tetapkan kuota nominal omzet target per bulan untuk staf Sales & Business Development"
      size="md"
    >
      <div className="space-y-4 py-2 text-xs">
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Pilih Personel Marketing / Sales PIC *</label>
          <DnaSelect
            value={formUserId}
            onChange={(val) => setFormUserId(val)}
            options={userOptions}
            disabled={!!editingTarget}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Bulan *</label>
            <DnaSelect
              value={formMonth.toString()}
              onChange={(val) => setFormMonth(Number(val))}
              options={MONTHS_ID.map((m, idx) => ({
                value: (idx + 1).toString(),
                label: m,
              }))}
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tahun *</label>
            <DnaSelect
              value={formYear.toString()}
              onChange={(val) => setFormYear(Number(val))}
              options={[2024, 2025, 2026, 2027, 2028].map((y) => ({
                value: y.toString(),
                label: y.toString(),
              }))}
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Nominal Target Omzet (Rp) *</label>
          <DnaInput
            placeholder="e.g. 500000000"
            type="number"
            value={formNominal}
            onChange={(e) => setFormNominal(e.target.value)}
            required
          />
          {formNominal && Number(formNominal) > 0 && (
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
              Terbaca: Rp {Number(formNominal).toLocaleString("id-ID")}
            </span>
          )}
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Catatan Operasional / Strategi</label>
          <DnaInput
            placeholder="Misal: Fokus closing maklon skincare derma Q1"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onSave}
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : "Simpan Target"}
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
