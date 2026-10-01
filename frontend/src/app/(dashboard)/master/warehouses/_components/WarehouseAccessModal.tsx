"use client";

import React from "react";
import { DnaModal, DnaSelect, DnaButton } from "@/components/dna";
import type {
  MasterWarehouseItem,
  WarehouseAccessItem,
  AccessUserOption,
} from "../_types/warehouse.types";

interface WarehouseAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccess: WarehouseAccessItem | null;
  accessTargetUserId: string;
  setAccessTargetUserId: (val: string) => void;
  selectedWarehouseIdsForUser: string[];
  setSelectedWarehouseIdsForUser: (ids: string[]) => void;
  accessUsers: AccessUserOption[];
  warehousesList: MasterWarehouseItem[];
  accessList: WarehouseAccessItem[];
  isPending: boolean;
  onSave: () => void;
}

export function WarehouseAccessModal({
  isOpen,
  onClose,
  editingAccess,
  accessTargetUserId,
  setAccessTargetUserId,
  selectedWarehouseIdsForUser,
  setSelectedWarehouseIdsForUser,
  accessUsers,
  warehousesList,
  accessList,
  isPending,
  onSave,
}: WarehouseAccessModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingAccess
          ? `Otorisasi Akses: ${editingAccess.namaPersonel}`
          : "Otorisasi Akses Gudang"
      }
      description="Pilih gudang mana saja yang dapat diakses oleh personel ini untuk transaksi mutasi barang"
      size="md"
    >
      <div className="space-y-4 py-2 text-xs">
        <DnaSelect
          label="Personel Penerima Akses *"
          value={accessTargetUserId || editingAccess?.userId || ""}
          onChange={(val) => {
            setAccessTargetUserId(val);
            const found = accessList.find((a) => a.userId === val);
            setSelectedWarehouseIdsForUser(found ? [...(found.warehouseIds || [])] : []);
          }}
          options={accessUsers.map((u) => ({
            value: u.id,
            label: `${u.fullName} â€” ${u.email}`,
          }))}
          placeholder="Pilih personel..."
        />

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-700">
          Personel:{" "}
          <strong className="text-slate-900">
            {accessUsers.find(
              (u) => u.id === (accessTargetUserId || editingAccess?.userId)
            )?.fullName ||
              editingAccess?.namaPersonel ||
              "â€”"}
          </strong>{" "}
          â€¢ Jabatan:{" "}
          <strong className="text-blue-600">
            {accessUsers.find(
              (u) => u.id === (accessTargetUserId || editingAccess?.userId)
            )?.role ||
              editingAccess?.hakAkses ||
              "â€”"}
          </strong>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Daftar Gudang yang Diizinkan:
            </span>
            <span className="text-[11px] text-slate-500">
              {selectedWarehouseIdsForUser.length} dari {warehousesList.length} gudang
              dipilih
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50/50 rounded-lg border border-slate-200">
            {warehousesList.map((wh) => {
              const isChecked = selectedWarehouseIdsForUser.includes(wh.id);
              return (
                <label
                  key={wh.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border ${
                    isChecked
                      ? "bg-blue-50/80 border-blue-200 text-blue-900 font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWarehouseIdsForUser([
                          ...selectedWarehouseIdsForUser,
                          wh.id,
                        ]);
                      } else {
                        setSelectedWarehouseIdsForUser(
                          selectedWarehouseIdsForUser.filter((id) => id !== wh.id)
                        );
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium">{wh.namaGudang}</span>
                    <span className="text-[9.5px] text-slate-400">{wh.lokasi}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            loading={isPending}
            onClick={onSave}
          >
            Simpan Otorisasi Akses
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
