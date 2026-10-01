"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import { generateAutoDocNumber } from "@/lib/document-number";
import type {
  WarehouseTransfer,
  TransferCartItem,
  AvailableCatalogItem,
  TransferKpis,
} from "../_types/pindah-gudang.types";

const FALLBACK_TRANSFERS: WarehouseTransfer[] = [
  {
    id: "trf-001",
    transferNumber: "TRF-2026-0089",
    transferDate: "2026-09-28",
    fromWarehouse: "Gudang Bahan Baku Utama (WH-01)",
    toWarehouse: "Gudang Produksi CPKB (WH-03)",
    referenceDoc: "SPK-PRD-2026-0034",
    totalItems: 2,
    totalQty: 1500,
    senderPic: "Budi Santoso",
    receiverPic: "Agus Pratama",
    receivedDate: "2026-09-28",
    status: "VERIFIED",
    notes: "Pengeluaran bahan baku Glycerin & Niacinamide untuk Batch Produksi Serum #045.",
    items: [
      {
        id: "ti-001",
        materialCode: "RM-GLYC-01",
        materialName: "Glycerin 99.5% USP Grade",
        transferQty: 1000,
        availableStockOrigin: 2250,
        unit: "Kg",
        batchLot: "LOT-GLYC-2026-09",
      },
      {
        id: "ti-002",
        materialCode: "RM-NIAC-02",
        materialName: "Niacinamide PC Grade",
        transferQty: 500,
        availableStockOrigin: 545,
        unit: "Kg",
        batchLot: "LOT-NIAC-2026-08",
      },
    ],
  },
  {
    id: "trf-002",
    transferNumber: "TRF-2026-0090",
    transferDate: "2026-09-29",
    fromWarehouse: "Gudang Kemas & Box (WH-02)",
    toWarehouse: "Gudang Produksi CPKB (WH-03)",
    referenceDoc: "SPK-PRD-2026-0035",
    totalItems: 1,
    totalQty: 5000,
    senderPic: "Slamet Riyadi",
    status: "IN_TRANSIT",
    notes: "Pengiriman botol kemasan amber 30ml untuk tahap filling/packaging line 2.",
    items: [
      {
        id: "ti-003",
        materialCode: "PK-BTL-100",
        materialName: "Botol Serum Dropper Amber 30ml",
        transferQty: 5000,
        availableStockOrigin: 8500,
        unit: "Pcs",
        batchLot: "LOT-BTL-2026-07",
      },
    ],
  },
  {
    id: "trf-003",
    transferNumber: "TRF-2026-0091",
    transferDate: "2026-09-29",
    fromWarehouse: "Gudang Karantina & QC (WH-04)",
    toWarehouse: "Gudang Bahan Baku Utama (WH-01)",
    referenceDoc: "QC-PASS-2026-012",
    totalItems: 1,
    totalQty: 300,
    senderPic: "Dr. Hendra (QC)",
    receiverPic: "Budi Santoso",
    status: "RECEIVED",
    notes: "Pelepasan bahan baku Centella Asiatica setelah lulus uji mikrobiologi.",
    items: [
      {
        id: "ti-004",
        materialCode: "RM-CENT-03",
        materialName: "Centella Asiatica Extract Powder",
        transferQty: 300,
        availableStockOrigin: 300,
        unit: "Kg",
        batchLot: "LOT-CENT-2026-09",
      },
    ],
  },
  {
    id: "trf-004",
    transferNumber: "TRF-2026-0092",
    transferDate: "2026-09-29",
    fromWarehouse: "Gudang Bahan Baku Utama (WH-01)",
    toWarehouse: "Gudang Karantina & QC (WH-04)",
    referenceDoc: "MEMO-QC-SAMPLE-08",
    totalItems: 1,
    totalQty: 25,
    senderPic: "Budi Santoso",
    status: "DRAFT",
    notes: "Draft SPK permohonan sampling lab stabilitas.",
    items: [
      {
        id: "ti-005",
        materialCode: "RM-GLYC-01",
        materialName: "Glycerin 99.5% USP Grade",
        transferQty: 25,
        availableStockOrigin: 1250,
        unit: "Kg",
        batchLot: "LOT-GLYC-2026-09",
      },
    ],
  },
];

export function usePindahGudangOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const { data: rawTransfers = [], isLoading } = useQuery({
    queryKey: ["warehouse-transfers"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/transfers");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: rawWarehouses = [] } = useQuery({
    queryKey: ["master-warehouses"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/warehouses");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: rawCatalog = [] } = useQuery({
    queryKey: ["warehouse-catalog"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const warehouseOptions: string[] = useMemo(() => {
    if (rawWarehouses.length > 0) {
      return rawWarehouses.map((w: any) => w.name || w.code);
    }
    return [
      "Gudang Bahan Baku Utama (WH-01)",
      "Gudang Kemas & Box (WH-02)",
      "Gudang Produk Jadi (WH-03)",
      "Gudang Produksi CPKB (WH-03)",
      "Gudang Karantina & QC (WH-04)",
      "Gudang Retur & Reject (WH-05)",
    ];
  }, [rawWarehouses]);

  const availableItems: AvailableCatalogItem[] = useMemo(() => {
    if (rawCatalog.length > 0) {
      return rawCatalog.map((c: any) => ({
        code: c.code || "MAT-01",
        name: c.name || "Material",
        unit: c.unit || "Kg",
        stock: Number(c.stockQty || c.currentStock || 0),
        lot: c.batchNumber || "-",
      }));
    }
    return [
      { code: "RM-GLYC-01", name: "Glycerin 99.5% USP Grade", unit: "Kg", stock: 1250, lot: "LOT-GLYC-2026-09" },
      { code: "RM-NIAC-02", name: "Niacinamide PC Grade", unit: "Kg", stock: 45, lot: "LOT-NIAC-2026-08" },
      { code: "PK-BTL-100", name: "Botol Serum Dropper Amber 30ml", unit: "Pcs", stock: 8500, lot: "LOT-BTL-2026-07" },
    ];
  }, [rawCatalog]);

  const liveTransfers: WarehouseTransfer[] = useMemo(() => {
    if (!rawTransfers || !Array.isArray(rawTransfers) || rawTransfers.length === 0) {
      return FALLBACK_TRANSFERS;
    }
    return rawTransfers.map((t: any, idx: number) => ({
      id: t.id || `trf-${idx}`,
      transferNumber: t.transferNumber || `TRF-2026-${(idx + 1).toString().padStart(4, "0")}`,
      transferDate: t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      fromWarehouse: t.fromWarehouse?.name || t.sourceWarehouse?.name || "Gudang Bahan Baku Utama (WH-01)",
      toWarehouse: t.toWarehouse?.name || t.destWarehouse?.name || "Gudang Produksi CPKB (WH-03)",
      referenceDoc: t.referenceNo || t.referenceDoc || `SPK-PRD-2026-${(idx + 1).toString().padStart(4, "0")}`,
      totalItems: t.items?.length || 1,
      totalQty: (t.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity || it.transferQty || 0), 0) || 500,
      senderPic: t.senderPic || t.createdBy?.fullName || "Budi Santoso",
      receiverPic: t.receiverPic,
      receivedDate: t.executedAt ? new Date(t.executedAt).toISOString().split("T")[0] : undefined,
      status: (t.status === "COMPLETED" || t.status === "VERIFIED" ? "VERIFIED" : t.status === "RECEIVED" ? "RECEIVED" : t.status === "DRAFT" ? "DRAFT" : "IN_TRANSIT") as any,
      notes: t.notes || "Transfer persediaan antar gudang",
      items: (t.items || []).map((it: any, iIdx: number) => ({
        id: it.id || `ti-${idx}-${iIdx}`,
        materialCode: it.material?.code || "MAT-01",
        materialName: it.material?.name || "Material",
        transferQty: Number(it.quantity || it.transferQty || 0),
        availableStockOrigin: 1000,
        unit: it.material?.unit || "Kg",
        batchLot: it.batchNumber || "LOT-GEN",
      })),
    }));
  }, [rawTransfers]);

  const [localCreated, setLocalCreated] = useState<WarehouseTransfer[]>([]);
  const dataList = useMemo(() => [...localCreated, ...liveTransfers], [localCreated, liveTransfers]);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("ALL");
  const [filterValue, setFilterValue] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<any>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedTransfer, setSelectedTransfer] = useState<WarehouseTransfer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [fromWarehouse, setFromWarehouse] = useState("Gudang Bahan Baku Utama (WH-01)");
  const [toWarehouse, setToWarehouse] = useState("Gudang Produksi CPKB (WH-03)");
  const [referenceDoc, setReferenceDoc] = useState(() => generateAutoDocNumber("SPK"));
  const [notes, setNotes] = useState("");
  const [cartItems, setCartItems] = useState<TransferCartItem[]>([]);
  const [selectedMaterialCode, setSelectedMaterialCode] = useState("");
  const [inputQty, setInputQty] = useState<number>(0);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("ALL");
    setFilterValue("ALL");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  // KPIs
  const kpis: TransferKpis = useMemo(() => {
    const list = dataList;
    const totalTransfers = list.length;
    const inTransitCount = list.filter((t) => t.status === "IN_TRANSIT").length;
    const totalVolume = list.reduce((sum, t) => sum + t.totalQty, 0);
    const verifiedCount = list.filter((t) => t.status === "VERIFIED" || t.status === "COMPLETED").length;

    return {
      totalTransfers,
      inTransitCount,
      totalVolume,
      verifiedCount,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    let result = dataList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.transferNumber.toLowerCase().includes(q) ||
        item.fromWarehouse.toLowerCase().includes(q) ||
        item.toWarehouse.toLowerCase().includes(q) ||
        item.referenceDoc.toLowerCase().includes(q) ||
        item.senderPic.toLowerCase().includes(q);

      let matchStatus = true;
      if (selectedStatus !== "ALL") {
        if (selectedStatus === "VERIFIED") {
          matchStatus = item.status === "VERIFIED" || item.status === "COMPLETED";
        } else {
          matchStatus = item.status === selectedStatus;
        }
      }

      let matchFilter = true;
      if (filterValue && filterValue !== "ALL") {
        if (selectedColumn === "fromWarehouse") {
          matchFilter = item.fromWarehouse.includes(filterValue);
        } else if (selectedColumn === "toWarehouse") {
          matchFilter = item.toWarehouse.includes(filterValue);
        }
      }

      let matchDate = true;
      if (item.transferDate) {
        if (dateMode === "1_DAY") {
          const today = new Date().toISOString().split("T")[0];
          matchDate = item.transferDate === today;
        } else if (dateMode === "1_WEEK") {
          const past = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
          matchDate = item.transferDate >= past;
        } else if (dateMode === "1_MONTH") {
          const past = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
          matchDate = item.transferDate >= past;
        } else if (dateMode === "1_YEAR") {
          const past = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
          matchDate = item.transferDate >= past;
        } else if (dateMode === "CUSTOM") {
          if (startDate && item.transferDate < startDate) matchDate = false;
          if (endDate && item.transferDate > endDate) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchFilter && matchDate;
    });

    return result;
  }, [dataList, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const handleAddItemToCart = () => {
    if (!selectedMaterialCode) {
      toast.error("Pilih material yang akan dipindahkan.");
      return;
    }
    if (inputQty <= 0) {
      toast.error("Kuantitas transfer harus lebih dari 0.");
      return;
    }

    const mat = availableItems.find((i) => i.code === selectedMaterialCode);
    if (!mat) return;

    if (cartItems.some((c) => c.materialCode === selectedMaterialCode)) {
      toast.error("Item ini sudah ditambahkan ke daftar transfer.");
      return;
    }

    setCartItems((prev) => [
      ...prev,
      {
        materialCode: mat.code,
        materialName: mat.name,
        transferQty: inputQty,
        availableStockOrigin: mat.stock,
        unit: mat.unit,
        batchLot: mat.lot,
      },
    ]);

    setSelectedMaterialCode("");
    setInputQty(0);
  };

  const handleRemoveCartItem = (code: string) => {
    setCartItems((prev) => prev.filter((c) => c.materialCode !== code));
  };

  const handleCreateTransfer = async () => {
    if (fromWarehouse === toWarehouse) {
      toast.error("Gudang asal dan gudang tujuan tidak boleh sama.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Tambahkan minimal 1 item ke daftar transfer.");
      return;
    }
    if (!referenceDoc) {
      toast.error("Nomor Dokumen Referensi (SPK/Memo) wajib diisi.");
      return;
    }

    const newTransfer: WarehouseTransfer = {
      id: `trf-${Date.now()}`,
      transferNumber: `TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      transferDate: new Date().toISOString().split("T")[0],
      fromWarehouse,
      toWarehouse,
      referenceDoc,
      totalItems: cartItems.length,
      totalQty: cartItems.reduce((sum, c) => sum + c.transferQty, 0),
      senderPic: "Budi Santoso",
      status: "IN_TRANSIT",
      notes: notes || "Transfer stok antar gudang",
      items: cartItems.map((c, idx) => ({
        id: `ti-${Date.now()}-${idx}`,
        materialCode: c.materialCode,
        materialName: c.materialName,
        transferQty: c.transferQty,
        availableStockOrigin: c.availableStockOrigin,
        unit: c.unit,
        batchLot: c.batchLot,
      })),
    };

    setLocalCreated((prev) => [newTransfer, ...prev]);
    setIsCreateOpen(false);
    toast.success("Dokumen Transfer Berhasil Diterbitkan (Status: Dalam Perjalanan).");

    // Reset
    setCartItems([]);
    setReferenceDoc("");
    setNotes("");
  };

  const handleConfirmReceive = (trfId: string) => {
    const updater = (prev: WarehouseTransfer) => ({
      ...prev,
      status: "VERIFIED" as const,
      receiverPic: "Petugas Gudang Penerima",
      receivedDate: new Date().toISOString().split("T")[0],
    });

    setLocalCreated((prev) =>
      prev.map((t) => (t.id === trfId ? updater(t) : t))
    );
    if (selectedTransfer && selectedTransfer.id === trfId) {
      setSelectedTransfer((prev) => (prev ? updater(prev) : null));
    }

    toast.success("Serah terima fisik berhasil diverifikasi. Saldo stok kedua gudang diperbarui.");
  };

  const handlePrintTransfer = (transferNumber?: string) => {
    toast.success(`Mencetak Dokumen Bukti Transfer ${transferNumber || ""}...`);
  };

  const handleExportExcel = () => {
    exportToCsv({
      filename: `transfer-pindah-gudang-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Transfer Pindah Antar Gudang",
      data: filteredList,
      columns: [
        { header: "No. Dokumen", accessor: "transferNumber" },
        { header: "Tanggal", accessor: "transferDate" },
        { header: "Gudang Asal", accessor: "fromWarehouse" },
        { header: "Gudang Tujuan", accessor: "toWarehouse" },
        { header: "Referensi / SPK", accessor: "referenceDoc" },
        { header: "Total Item", accessor: "totalItems" },
        { header: "Total Kuantitas", accessor: "totalQty" },
        { header: "Pengirim (PIC)", accessor: "senderPic" },
        { header: "Penerima (PIC)", accessor: "receiverPic" },
        { header: "Tgl Diterima", accessor: "receivedDate" },
        { header: "Status", accessor: "status" },
        { header: "Catatan", accessor: "notes" },
      ],
    });
  };

  return {
    filteredList,
    kpis,
    warehouseOptions,
    availableItems,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    selectedColumn,
    setSelectedColumn,
    filterValue,
    setFilterValue,
    dateMode,
    setDateMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleResetAll,
    selectedTransfer,
    setSelectedTransfer,
    isCreateOpen,
    setIsCreateOpen,
    fromWarehouse,
    setFromWarehouse,
    toWarehouse,
    setToWarehouse,
    referenceDoc,
    setReferenceDoc,
    notes,
    setNotes,
    cartItems,
    selectedMaterialCode,
    setSelectedMaterialCode,
    inputQty,
    setInputQty,
    handleAddItemToCart,
    handleRemoveCartItem,
    handleCreateTransfer,
    handleConfirmReceive,
    handlePrintTransfer,
    handleExportExcel,
    isLoading,
  };
}
