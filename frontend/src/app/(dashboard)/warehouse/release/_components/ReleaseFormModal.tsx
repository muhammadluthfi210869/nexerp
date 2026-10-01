import React from "react";
import { Send } from "lucide-react";
import {
  DnaModal,
  DnaButton,
  DnaSelect,
  DnaInput,
  DnaTextarea,
} from "@/components/dna";

interface ReleaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  readyOrders: any[];
  selectedSoNumber: string;
  onSelectSoNumber: (val: string) => void;
  shipDate: string;
  onShipDateChange: (val: string) => void;
  courierName: string;
  onCourierNameChange: (val: string) => void;
  vehicleOrTrackingNo: string;
  onVehicleOrTrackingNoChange: (val: string) => void;
  destinationAddress: string;
  onDestinationAddressChange: (val: string) => void;
  onSubmit: () => void;
}

export function ReleaseFormModal({
  isOpen,
  onClose,
  readyOrders,
  selectedSoNumber,
  onSelectSoNumber,
  shipDate,
  onShipDateChange,
  courierName,
  onCourierNameChange,
  vehicleOrTrackingNo,
  onVehicleOrTrackingNoChange,
  destinationAddress,
  onDestinationAddressChange,
  onSubmit,
}: ReleaseFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Surat Jalan Pengiriman Baru"
      description="Penerbitan surat jalan pengeluaran barang jadi dari gudang ekspedisi."
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<Send className="w-4 h-4" />}
            onClick={onSubmit}
          >
            Terbitkan Surat Jalan
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Pilih Sales Order (SO) *</label>
            <DnaSelect
              aria-label="Pilih SO"
              value={selectedSoNumber}
              onChange={onSelectSoNumber}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="">-- Pilih Sales Order --</option>
              {readyOrders.map((so: any) => (
                <option key={so.soNumber || so.id} value={so.soNumber || so.id}>
                  {so.soNumber} - {so.clientName} ({so.brandName})
                </option>
              ))}
            </DnaSelect>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Tanggal Pengiriman *</label>
            <DnaInput
              type="date"
              value={shipDate}
              onChange={(e) => onShipDateChange(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Nama Ekspedisi / Kurir *</label>
            <DnaInput
              type="text"
              placeholder="Contoh: JNE Cargo / Armada Internal"
              value={courierName}
              onChange={(e) => onCourierNameChange(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">No. Kendaraan / Resi Ekspedisi</label>
            <DnaInput
              type="text"
              placeholder="Contoh: B 9821 TBC / TRACK-88129"
              value={vehicleOrTrackingNo}
              onChange={(e) => onVehicleOrTrackingNoChange(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Alamat Lengkap Tujuan</label>
          <DnaTextarea
            rows={2}
            placeholder="Masukkan alamat pengiriman gudang customer..."
            value={destinationAddress}
            onChange={(e) => onDestinationAddressChange(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg p-2"
          />
        </div>
      </div>
    </DnaModal>
  );
}
