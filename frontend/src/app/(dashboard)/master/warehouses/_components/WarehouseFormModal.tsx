"use client";

import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaButton,
} from "@/components/dna";
import type {
  MasterWarehouseItem,
  WarehouseFormData,
} from "../_types/warehouse.types";

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWarehouse: MasterWarehouseItem | null;
  warehouseForm: WarehouseFormData;
  setWarehouseForm: React.Dispatch<React.SetStateAction<WarehouseFormData>>;
  isPending: boolean;
  onSave: () => void;
}

export function WarehouseFormModal({
  isOpen,
  onClose,
  editingWarehouse,
  warehouseForm,
  setWarehouseForm,
  isPending,
  onSave,
}: WarehouseFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingWarehouse
          ? `Sunting Gudang: ${editingWarehouse.namaGudang}`
          : "Tambah Gudang Baru"
      }
      description="Lengkapi spesifikasi titik simpan gudang, penanggung jawab (PIC), dan kondisi suhu"
      size="lg"
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Kode Gudang (Auto)</label>
            <DnaInput
              value={warehouseForm.kodeGudang || "AUTO"}
              readOnly
              className="bg-zinc-100 text-zinc-600 font-mono cursor-not-allowed"
              placeholder="WH-AUTO"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Nama Gudang *</label>
            <DnaInput
              value={warehouseForm.namaGudang}
              onChange={(e) =>
                setWarehouseForm({ ...warehouseForm, namaGudang: e.target.value })
              }
              placeholder="e.g. Gudang Bahan Baku Utama"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DnaInput
            label="PIC Gudang"
            value={warehouseForm.picName}
            onChange={(e) =>
              setWarehouseForm({ ...warehouseForm, picName: e.target.value })
            }
            placeholder="Nama penanggung jawab..."
          />
          <DnaInput
            label="Nomor Telepon Gudang"
            value={warehouseForm.telepon}
            onChange={(e) =>
              setWarehouseForm({ ...warehouseForm, telepon: e.target.value })
            }
            placeholder="08123456789"
          />
          <DnaSelect
            label="Tipe Suhu / Karakteristik *"
            value={warehouseForm.tipePenyimpanan}
            onChange={(val) =>
              setWarehouseForm({
                ...warehouseForm,
                tipePenyimpanan: val as MasterWarehouseItem["tipePenyimpanan"],
              })
            }
            options={[
              { value: "Suhu Ruang (Ambient)", label: "Suhu Ruang (Ambient)" },
              { value: "Cool Storage (15-25Â°C)", label: "Cool Storage (15-25Â°C)" },
              { value: "Chiller (2-8Â°C)", label: "Chiller (2-8Â°C)" },
              { value: "Flammable / Precursor", label: "Flammable / Precursor" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DnaInput
            label="Wilayah / Kota *"
            value={warehouseForm.lokasi}
            onChange={(e) =>
              setWarehouseForm({ ...warehouseForm, lokasi: e.target.value })
            }
            placeholder="Kab. Sidoarjo"
          />
          <DnaInput
            label="Provinsi"
            value={warehouseForm.provinsi}
            onChange={(e) =>
              setWarehouseForm({ ...warehouseForm, provinsi: e.target.value })
            }
            placeholder="Jawa Timur"
          />
        </div>

        <DnaTextarea
          label="Alamat Lengkap Fasilitas Gudang *"
          value={warehouseForm.alamatLengkap}
          onChange={(e) =>
            setWarehouseForm({ ...warehouseForm, alamatLengkap: e.target.value })
          }
          placeholder="Kawasan industri, nama blok, nomor gudang, patokan..."
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" loading={isPending} onClick={onSave}>
            Simpan Data Gudang
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
