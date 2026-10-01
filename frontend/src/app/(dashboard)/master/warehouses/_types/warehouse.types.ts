export interface MasterWarehouseItem {
  id: string;
  kodeGudang: string;
  namaGudang: string;
  lokasi: string;
  provinsi: string;
  telepon: string;
  picName: string;
  tipePenyimpanan:
    | "Suhu Ruang (Ambient)"
    | "Cool Storage (15-25°C)"
    | "Chiller (2-8°C)"
    | "Flammable / Precursor";
  totalBinLocations: number;
  status: "ACTIVE" | "INACTIVE";
  alamatLengkap: string;
}

export interface WarehouseAccessItem {
  id: string;
  userId: string;
  namaPersonel: string;
  email: string;
  phone: string;
  hakAkses: string;
  gudangAkses: string[]; // List of gudang names
  warehouseIds?: string[]; // List of warehouse IDs
}

export interface AccessUserOption {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface WarehouseFormData {
  kodeGudang: string;
  namaGudang: string;
  lokasi: string;
  provinsi: string;
  telepon: string;
  picName: string;
  tipePenyimpanan: MasterWarehouseItem["tipePenyimpanan"];
  totalBinLocations: number;
  status: "ACTIVE" | "INACTIVE";
  alamatLengkap: string;
}
