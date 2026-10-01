import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import type { StockItem, StokKpis } from "../_types/stok.types";

const FALLBACK_STOCKS: StockItem[] = [
  {
    id: "stk-001",
    itemCode: "RM-GLYC-01",
    itemName: "Glycerin 99.5% USP Grade",
    specifications: "Cosmetic Grade USP/BP Purity 99.5%",
    category: "Bahan Baku",
    typeCode: "RAW_MATERIAL",
    warehouse: "Gudang Bahan Baku Utama (WH-01)",
    rackLocation: "RACK-A1-02",
    qtyOnHand: 1250,
    unit: "Kg",
    safetyStock: 300,
    fifoUnitCost: 28000,
    totalValuation: 35000000,
    status: "AMAN",
    batchNumber: "LOT-GLYC-2026-09",
    expiryDate: "2028-09-15",
  },
  {
    id: "stk-002",
    itemCode: "RM-NIAC-02",
    itemName: "Niacinamide PC Grade",
    specifications: "Vitamin B3 Powder Active Brightening",
    category: "Bahan Baku",
    typeCode: "RAW_MATERIAL",
    warehouse: "Gudang Bahan Baku Utama (WH-01)",
    rackLocation: "RACK-A2-05",
    qtyOnHand: 45,
    unit: "Kg",
    safetyStock: 100,
    fifoUnitCost: 450000,
    totalValuation: 20250000,
    status: "LOW_STOCK",
    batchNumber: "LOT-NIAC-2026-08",
    expiryDate: "2027-12-30",
  },
  {
    id: "stk-003",
    itemCode: "PK-BTL-100",
    itemName: "Botol Serum Dropper Amber 30ml",
    specifications: "Glass Bottle Amber UV Protection + Gold Pipette",
    category: "Bahan Kemas",
    typeCode: "PACKAGING",
    warehouse: "Gudang Kemasan (WH-02)",
    rackLocation: "BIN-KM-04",
    qtyOnHand: 8500,
    unit: "Pcs",
    safetyStock: 2000,
    fifoUnitCost: 4200,
    totalValuation: 35700000,
    status: "AMAN",
    batchNumber: "LOT-BTL-2026-07",
    expiryDate: "2030-01-01",
  },
  {
    id: "stk-004",
    itemCode: "PK-BOX-01",
    itemName: "Dus Outer Serum Brightening",
    specifications: "Ivory 350gsm Doff Lamination + Hotprint Gold",
    category: "Bahan Kemas",
    typeCode: "PACKAGING",
    warehouse: "Gudang Kemasan (WH-02)",
    rackLocation: "BIN-KM-12",
    qtyOnHand: 0,
    unit: "Pcs",
    safetyStock: 1500,
    fifoUnitCost: 1200,
    totalValuation: 0,
    status: "OUT_OF_STOCK",
    batchNumber: "LOT-BOX-2026-05",
  },
  {
    id: "stk-005",
    itemCode: "FG-SRM-001",
    itemName: "Glow Radiance Serum 30ml",
    specifications: "Finished Goods Packaged & Batch Tested BPOM NA182101001",
    category: "Barang Jadi",
    typeCode: "FINISHED_GOODS",
    warehouse: "Gudang Barang Jadi (WH-03)",
    rackLocation: "RACK-FG-01",
    qtyOnHand: 3400,
    unit: "Pcs",
    safetyStock: 500,
    fifoUnitCost: 32500,
    totalValuation: 110500000,
    status: "AMAN",
    batchNumber: "LOT-FG-2026-001",
    expiryDate: "2028-06-20",
  },
  {
    id: "stk-006",
    itemCode: "FG-SUN-002",
    itemName: "Ultra Light Daily Sunscreen SPF50",
    specifications: "Finished Goods Hybrid Sunscreen 50g BPOM NA182201002",
    category: "Barang Jadi",
    typeCode: "FINISHED_GOODS",
    warehouse: "Gudang Barang Jadi (WH-03)",
    rackLocation: "RACK-FG-03",
    qtyOnHand: 180,
    unit: "Pcs",
    safetyStock: 400,
    fifoUnitCost: 48000,
    totalValuation: 8640000,
    status: "LOW_STOCK",
    batchNumber: "LOT-FG-2026-004",
    expiryDate: "2028-08-10",
  },
];

export function useStokOperations() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("category");
  const [filterValue, setFilterValue] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<any>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  const { data: rawCatalog = [], isLoading } = useQuery({
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

  const stockList: StockItem[] = useMemo(() => {
    if (!Array.isArray(rawCatalog) || rawCatalog.length === 0) {
      return FALLBACK_STOCKS;
    }
    return rawCatalog.map((mat: any, idx: number) => {
      const stock = Number(mat.stockQty || mat.currentStock || 0);
      const minLevel = Number(mat.minLevel || mat.safetyStock || 0);
      const unitPrice = Number(mat.unitPrice || mat.fifoCost || mat.hpp || 0);
      const valuation = stock * unitPrice;
      const status: "AMAN" | "LOW_STOCK" | "OUT_OF_STOCK" =
        stock === 0 ? "OUT_OF_STOCK" : stock < minLevel ? "LOW_STOCK" : "AMAN";

      const typeCode =
        mat.type === "RAW_MATERIAL"
          ? "RAW_MATERIAL"
          : mat.type === "PACKAGING"
          ? "PACKAGING"
          : "FINISHED_GOODS";

      const category =
        typeCode === "RAW_MATERIAL"
          ? "Bahan Baku"
          : typeCode === "PACKAGING"
          ? "Bahan Kemas"
          : "Barang Jadi";

      return {
        id: mat.id || `stk-live-${idx}`,
        itemCode: mat.code || mat.sku || `SKU-${idx + 1}`,
        itemName: mat.name || "Material Item",
        specifications: mat.description || mat.specification || "-",
        category,
        typeCode,
        warehouse:
          mat.inventories?.[0]?.location?.warehouse?.name ||
          mat.warehouseName ||
          "Gudang Utama CPKB",
        rackLocation:
          mat.inventories?.[0]?.location?.name || mat.rackLocation || "RACK-GEN",
        unit: mat.unit || "Pcs",
        qtyOnHand: stock,
        safetyStock: minLevel,
        fifoUnitCost: unitPrice,
        totalValuation: valuation,
        status,
        batchNumber: mat.batchNumber || `LOT-${idx + 1}`,
        expiryDate: mat.expiryDate ? new Date(mat.expiryDate).toISOString().split("T")[0] : undefined,
      };
    });
  }, [rawCatalog]);

  const warehouseOptions = useMemo(() => {
    const set = new Set<string>();
    stockList.forEach((s) => {
      if (s.warehouse) set.add(s.warehouse);
    });
    return Array.from(set);
  }, [stockList]);

  const filteredStocks = useMemo(() => {
    return stockList
      .filter((item) => {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          item.itemCode.toLowerCase().includes(q) ||
          item.itemName.toLowerCase().includes(q) ||
          (item.specifications && item.specifications.toLowerCase().includes(q)) ||
          item.warehouse.toLowerCase().includes(q) ||
          item.rackLocation.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);

        if (!matchSearch) return false;

        // 1. Dedicated Status Filter
        if (statusFilter && statusFilter !== "ALL") {
          if (item.status !== statusFilter) return false;
        }

        // 2. Secondary Column Filter
        if (filterValue && filterValue !== "ALL") {
          if (selectedColumn === "category" && item.category !== filterValue) return false;
          if (selectedColumn === "warehouse" && item.warehouse !== filterValue) return false;
        }

        // 3. Date Filter (Expiry / Batch)
        if (dateMode !== "ALL" && item.expiryDate) {
          if (startDate && item.expiryDate < startDate) return false;
          if (endDate && item.expiryDate > endDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedColumn === "stock_qty") {
          if (filterValue === "NUM_DESC") return b.qtyOnHand - a.qtyOnHand;
          if (filterValue === "NUM_ASC") return a.qtyOnHand - b.qtyOnHand;
        }
        if (selectedColumn === "valuation") {
          if (filterValue === "NUM_DESC") return b.totalValuation - a.totalValuation;
          if (filterValue === "NUM_ASC") return a.totalValuation - b.totalValuation;
        }
        return 0;
      });
  }, [stockList, searchQuery, statusFilter, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const handleResetAll = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSelectedColumn("category");
    setFilterValue("ALL");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
    setWarehouseFilter("ALL");
  };

  const kpis: StokKpis = useMemo(() => {
    const totalValuation = filteredStocks.reduce((acc, r) => acc + r.totalValuation, 0);
    const totalPhysicalQty = filteredStocks.reduce((acc, r) => acc + r.qtyOnHand, 0);
    const lowStockCount = filteredStocks.filter(
      (r) => r.status === "LOW_STOCK" || r.status === "OUT_OF_STOCK"
    ).length;

    return {
      totalValuation,
      totalSkus: filteredStocks.length,
      totalPhysicalQty,
      lowStockCount,
    };
  }, [filteredStocks]);

  const handleExportExcel = () => {
    exportToCsv({
      filename: `stok-barang-bahan-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Stok Barang & Bahan",
      data: filteredStocks,
      columns: [
        { header: "Kode Barang", accessor: "itemCode" },
        { header: "Nama Barang", accessor: "itemName" },
        { header: "Kategori", accessor: "category" },
        { header: "Gudang", accessor: "warehouse" },
        { header: "Lokasi Rak", accessor: "rackLocation" },
        { header: "Qty Fisik", accessor: "qtyOnHand" },
        { header: "Satuan", accessor: "unit" },
        { header: "Harga Pokok (FIFO)", accessor: "fifoUnitCost" },
        { header: "Total Valuasi", accessor: "totalValuation" },
        { header: "Status", accessor: "status" },
        { header: "Nomor Batch", accessor: "batchNumber" },
        { header: "Tgl Kadaluarsa", accessor: "expiryDate" },
      ],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return {
    stockList,
    filteredStocks,
    kpis,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
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
    warehouseFilter,
    setWarehouseFilter,
    warehouseOptions,
    handleResetAll,
    selectedItem,
    setSelectedItem,
    handleExportExcel,
    handlePrint,
  };
}

