import React from "react";
import { Lock } from "lucide-react";
import {
  DnaModal,
  DnaButton,
  DnaSelect,
  DnaInput,
  DnaTextarea,
} from "@/components/dna";
import type { NewSessionFormState, WarehouseOption } from "../_types/opname.types";

interface WarehouseOpnameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  newSessionForm: NewSessionFormState;
  setNewSessionForm: React.Dispatch<React.SetStateAction<NewSessionFormState>>;
  warehouseList: WarehouseOption[];
  onSubmit: () => void;
}

export function WarehouseOpnameFormModal({
  isOpen,
  onClose,
  newSessionForm,
  setNewSessionForm,
  warehouseList,
  onSubmit,
}: WarehouseOpnameFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Mulai Sesi Stok Opname Baru"
      description="Inisiasi sesi audit fisik dengan pembekuan transaksi mutasi stok di gudang terpilih."
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            onClick={onSubmit}
          >
            <Lock className="w-4 h-4 mr-1.5" />
            Bekukan Stok & Mulai Opname
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-zinc-700 font-semibold mb-1">Pilih Gudang Target Opname *</label>
          <DnaSelect
            aria-label="Pilih Gudang"
            value={newSessionForm.warehouseId}
            onChange={(val) => setNewSessionForm({ ...newSessionForm, warehouseId: val })}
            className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white"
          >
            {warehouseList.length === 0 ? (
              <option value="">Tidak ada gudang aktif</option>
            ) : (
              warehouseList.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))
            )}
          </DnaSelect>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Lead Auditor *</label>
            <DnaInput
              type="text"
              value={newSessionForm.auditorLead}
              onChange={(e) => setNewSessionForm({ ...newSessionForm, auditorLead: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Anggota Tim Auditor</label>
            <DnaInput
              type="text"
              value={newSessionForm.auditorTeam}
              onChange={(e) => setNewSessionForm({ ...newSessionForm, auditorTeam: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2"
            />
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-semibold text-amber-900 block">Inventory Freeze (Bekukan Mutasi)</span>
            <span className="text-[11px] text-amber-800">Kunci transaksi barang masuk/keluar di gudang ini selama audit</span>
          </div>
          <input
            type="checkbox"
            checked={newSessionForm.freezeInventory}
            onChange={(e) => setNewSessionForm({ ...newSessionForm, freezeInventory: e.target.checked })}
            className="h-4 w-4 accent-zinc-900 rounded border-zinc-300"
          />
        </div>

        <div>
          <label className="block text-zinc-700 font-semibold mb-1">Catatan Pelaksanaan Sesi</label>
          <DnaTextarea
            rows={2}
            placeholder="Jadwal audit, shift tim, atau instruksi khusus..."
            value={newSessionForm.notes}
            onChange={(e) => setNewSessionForm({ ...newSessionForm, notes: e.target.value })}
            className="w-full text-xs border border-zinc-300 rounded-lg p-2"
          />
        </div>
      </div>
    </DnaModal>
  );
}
