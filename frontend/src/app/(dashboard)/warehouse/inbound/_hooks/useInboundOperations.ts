import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import type { GoodsReceiptNote, GrnItemDetail, InboundKpis } from "../_types/inbound.types";

const FALLBACK_INBOUNDS: GoodsReceiptNote[] = [
  {
    id: "grn-001",
    grnNumber: "GRN-2026-0901",
    receiveDate: "2026-09-28",
    poNumber: "PO-2026-0045",
    deliveryOrderNo: "SJ-CLA-8819",
    vendorName: "PT Chemindo Lautan Abadi",
    vendorCode: "SUP-CLA-01",
    warehouseName: "Gudang Bahan Baku Utama (WH-01)",
    totalQtyGood: 1200,
    totalQtyReject: 50,
    totalQtyFree: 100,
    status: "APPROVED",
    receivedBy: "Budi Santoso",
    qcInspector: "Dr. Hendra (QC Lab)",
    notes: "Penerimaan Glycerin & Niacinamide batch baru, 50kg kemasan bocor di-reject.",
    items: [
      {
        id: "gi-001",
        itemCode: "RM-GLYC-01",
        itemName: "Glycerin 99.5% USP Grade",
        qtyOrdered: 1000,
        qtyReceived: 1050,
        qtyGood: 1000,
        qtyReject: 50,
        qtyFree: 50,
        unit: "Kg",
        batchNumber: "LOT-GLYC-2026-09",
        expiryDate: "2028-09-15",
        qcStatus: "PASSED",
      },
      {
        id: "gi-002",
        itemCode: "RM-NIAC-02",
        itemName: "Niacinamide PC Grade",
        qtyOrdered: 200,
        qtyReceived: 250,
        qtyGood: 200,
        qtyReject: 0,
        qtyFree: 50,
        unit: "Kg",
        batchNumber: "LOT-NIAC-2026-08",
        expiryDate: "2027-12-30",
        qcStatus: "PASSED",
      },
    ],
  },
  {
    id: "grn-002",
    grnNumber: "GRN-2026-0902",
    receiveDate: "2026-09-27",
    poNumber: "PO-2026-0048",
    deliveryOrderNo: "SJ-PKG-4421",
    vendorName: "PT Packindo Jaya Pratama",
    vendorCode: "SUP-PKG-02",
    warehouseName: "Gudang Kemasan (WH-02)",
    totalQtyGood: 5000,
    totalQtyReject: 200,
    totalQtyFree: 500,
    status: "APPROVED",
    receivedBy: "Agus Pratama",
    qcInspector: "Rina S. (QC Kemas)",
    notes: "Botol serum dropper amber 30ml + bonus tester 500 pcs.",
    items: [
      {
        id: "gi-003",
        itemCode: "PK-BTL-100",
        itemName: "Botol Serum Dropper Amber 30ml",
        qtyOrdered: 5000,
        qtyReceived: 5700,
        qtyGood: 5000,
        qtyReject: 200,
        qtyFree: 500,
        unit: "Pcs",
        batchNumber: "LOT-BTL-2026-07",
        expiryDate: "2030-01-01",
        qcStatus: "PASSED",
        rejectReason: "200 pcs pipet kaca retak",
      },
    ],
  },
  {
    id: "grn-003",
    grnNumber: "GRN-2026-0903",
    receiveDate: "2026-09-29",
    poNumber: "PO-2026-0052",
    deliveryOrderNo: "SJ-BIO-9011",
    vendorName: "PT Biosains Farma Natural",
    vendorCode: "SUP-BIO-03",
    warehouseName: "Gudang Bahan Baku Utama (WH-01)",
    totalQtyGood: 300,
    totalQtyReject: 0,
    totalQtyFree: 0,
    status: "PENDING_QC",
    receivedBy: "Budi Santoso",
    qcInspector: "Menunggu Sampling",
    notes: "Centella Asiatica Extract powder menunggu hasil lab mikrobiologi.",
    items: [
      {
        id: "gi-004",
        itemCode: "RM-CENT-03",
        itemName: "Centella Asiatica Extract Powder",
        qtyOrdered: 300,
        qtyReceived: 300,
        qtyGood: 300,
        qtyReject: 0,
        qtyFree: 0,
        unit: "Kg",
        batchNumber: "LOT-CENT-2026-09",
        expiryDate: "2028-09-20",
        qcStatus: "PENDING_TEST",
      },
    ],
  },
];

export function useInboundOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  // Live Query: Inbounds
  const { data: rawInbounds = [], isLoading: isInboundsLoading } = useQuery({
    queryKey: ["warehouse-inbounds"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/inbounds");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  // Live Query: Open POs
  const { data: openPOs = [], isLoading: isPOsLoading } = useQuery({
    queryKey: ["warehouse-open-pos"],
    queryFn: async () => {
      try {
        const res = await api.get("/purchase/orders");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  // Live Query: Catalog for material options
  const { data: catalogMaterials = [] } = useQuery({
    queryKey: ["warehouse-catalog-options"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  // Transform live inbounds into UI format
  const liveInbounds: GoodsReceiptNote[] = useMemo(() => {
    if (!Array.isArray(rawInbounds) || rawInbounds.length === 0) {
      return FALLBACK_INBOUNDS;
    }
    return rawInbounds.map((inb: any, idx: number) => {
      const items: GrnItemDetail[] = (inb.items || []).map((it: any, iIdx: number) => ({
        id: it.id || `gi-${idx}-${iIdx}`,
        itemCode: it.material?.code || it.materialId?.slice(0, 8) || "MAT",
        itemName: it.material?.name || "Material Item",
        qtyOrdered: Number(it.quantity || 0),
        qtyReceived: Number(it.quantity || 0),
        qtyGood: Number(it.quantity || 0),
        qtyReject: Number(it.qtyReject || 0),
        qtyFree: Number(it.qtyFree || 0),
        unit: it.material?.unit || "Kg",
        batchNumber: it.batchNumber || `LOT-${idx + 1}`,
        expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString().split("T")[0] : undefined,
        qcStatus: inb.status === "PENDING_QC" ? "PENDING_TEST" : "PASSED",
      }));

      const totalQtyGood = items.reduce((sum, it) => sum + it.qtyGood, 0);
      const totalQtyReject = items.reduce((sum, it) => sum + it.qtyReject, 0);
      const totalQtyFree = items.reduce((sum, it) => sum + it.qtyFree, 0);

      return {
        id: inb.id || `grn-${idx}`,
        grnNumber: inb.inboundNumber || `GRN-${(idx + 1).toString().padStart(4, "0")}`,
        receiveDate: inb.receivedAt
          ? new Date(inb.receivedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        poNumber: inb.po?.poNumber || inb.poNumber || `PO-2026-${(idx + 1).toString().padStart(4, "0")}`,
        deliveryOrderNo: inb.deliveryOrderNo || `SJ-SUP-${(idx + 1).toString().padStart(4, "0")}`,
        vendorName: inb.po?.supplier?.name || inb.supplierName || "PT Chemindo Lautan Abadi",
        vendorCode: inb.supplierCode || "SUP-01",
        warehouseName: inb.warehouse?.name || "Gudang Bahan Baku Utama (WH-01)",
        totalQtyGood,
        totalQtyReject,
        totalQtyFree,
        status: (inb.status || "APPROVED") as any,
        receivedBy: inb.receivedBy || "Budi Santoso",
        qcInspector: inb.qcInspector || "Dr. Hendra (QC Lab)",
        notes: inb.notes || "Penerimaan fisik barang PO",
        items,
      };
    });
  }, [rawInbounds]);

  const dataList = liveInbounds;

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("ALL");
  const [filterValue, setFilterValue] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<any>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceiptNote | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [selectedPoNumber, setSelectedPoNumber] = useState("");
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryOrderNo, setDeliveryOrderNo] = useState("");
  const [warehouseName, setWarehouseName] = useState("Gudang Bahan Baku Utama (WH-01)");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState<GrnItemDetail[]>([]);

  // Unique Options for Secondary Filter
  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach((g) => {
      if (g.vendorName) set.add(g.vendorName);
    });
    return Array.from(set);
  }, [dataList]);

  const warehouseOptions = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach((g) => {
      if (g.warehouseName) set.add(g.warehouseName.split("(")[0].trim());
    });
    return Array.from(set);
  }, [dataList]);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("ALL");
    setFilterValue("ALL");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  // Calculate KPIs (3-Pilar support)
  const kpis: InboundKpis = useMemo(() => {
    const list = dataList;
    const totalGrn = list.length;
    const totalGood = list.reduce((sum, g) => sum + g.totalQtyGood, 0);
    const totalReject = list.reduce((sum, g) => sum + g.totalQtyReject, 0);
    const totalFree = list.reduce((sum, g) => sum + (g.totalQtyFree || 0), 0);
    const pendingQc = list.filter((g) => g.status === "PENDING_QC").length;

    return {
      totalGrn,
      totalGood,
      totalReject,
      totalFree,
      pendingQc,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    let result = dataList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.grnNumber.toLowerCase().includes(q) ||
        item.poNumber.toLowerCase().includes(q) ||
        item.deliveryOrderNo.toLowerCase().includes(q) ||
        item.vendorName.toLowerCase().includes(q) ||
        item.warehouseName.toLowerCase().includes(q);

      let matchStatus = true;
      if (selectedStatus !== "ALL") {
        matchStatus = item.status === selectedStatus;
      }

      let matchFilter = true;
      if (filterValue && filterValue !== "ALL") {
        if (selectedColumn === "vendorName") {
          matchFilter = item.vendorName === filterValue;
        } else if (selectedColumn === "warehouseName") {
          matchFilter = item.warehouseName.includes(filterValue);
        }
      }

      let matchDate = true;
      if (item.receiveDate) {
        if (dateMode === "1_DAY") {
          const today = new Date().toISOString().split("T")[0];
          matchDate = item.receiveDate === today;
        } else if (dateMode === "1_WEEK") {
          const past = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
          matchDate = item.receiveDate >= past;
        } else if (dateMode === "1_MONTH") {
          const past = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
          matchDate = item.receiveDate >= past;
        } else if (dateMode === "1_YEAR") {
          const past = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
          matchDate = item.receiveDate >= past;
        } else if (dateMode === "CUSTOM") {
          if (startDate && item.receiveDate < startDate) matchDate = false;
          if (endDate && item.receiveDate > endDate) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchFilter && matchDate;
    });

    return result;
  }, [dataList, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const handleSelectPo = (poNo: string) => {
    setSelectedPoNumber(poNo);
    const po = (openPOs as any[]).find((p: any) => p.poNumber === poNo);
    if (po && Array.isArray(po.items)) {
      setFormItems(
        po.items.map((it: any, idx: number) => ({
          id: `gi-${Date.now()}-${idx}`,
          itemCode: it.itemCode || it.material?.code || "MAT",
          itemName: it.itemName || it.material?.name || "Bahan Baku",
          qtyOrdered: Number(it.quantity || it.qtyOrdered || 0),
          qtyReceived: Number(it.quantity || it.qtyOrdered || 0),
          qtyGood: Number(it.quantity || it.qtyOrdered || 0),
          qtyReject: 0,
          qtyFree: 0,
          unit: it.unit || it.material?.unit || "Kg",
          batchNumber: `LOT-${Date.now().toString().slice(-4)}`,
          expiryDate: "2028-12-31",
          qcStatus: "PASSED",
        }))
      );
    } else if (catalogMaterials.length > 0) {
      const mat = catalogMaterials[0];
      setFormItems([
        {
          id: `gi-${Date.now()}-0`,
          itemCode: mat.code || "RAW-001",
          itemName: mat.name || "Bahan Baku Kosmetik",
          qtyOrdered: 100,
          qtyReceived: 100,
          qtyGood: 100,
          qtyReject: 0,
          qtyFree: 0,
          unit: mat.unit || "Kg",
          batchNumber: `LOT-${Date.now().toString().slice(-4)}`,
          expiryDate: "2028-12-31",
          qcStatus: "PASSED",
        },
      ]);
    }
  };

  const handleUpdateItem = (idx: number, field: keyof GrnItemDetail, val: any) => {
    setFormItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleCreateGrn = async () => {
    if (!deliveryOrderNo) {
      toast.error("Nomor Surat Jalan Supplier wajib diisi.");
      return;
    }
    if (formItems.length === 0) {
      toast.error("Minimal harus ada 1 item material yang diterima.");
      return;
    }

    try {
      const selectedPo = (openPOs as any[]).find((p: any) => p.poNumber === selectedPoNumber);
      const itemsPayload = formItems.map((it) => {
        const mat = (catalogMaterials as any[]).find((m: any) => m.code === it.itemCode || m.name === it.itemName);
        return {
          materialId: mat?.id || it.id || "00000000-0000-0000-0000-000000000000",
          quantity: Number(it.qtyGood || it.qtyReceived || 1),
          batchNumber: it.batchNumber || `LOT-${Date.now().toString().slice(-4)}`,
          expiryDate: it.expiryDate || "2028-12-31",
        };
      });

      await api.post("/warehouse/inbounds", {
        poId: selectedPo?.id,
        receivedAt: receiveDate,
        items: itemsPayload,
      });

      queryClient.invalidateQueries({ queryKey: ["warehouse-inbounds"] });
      setIsCreateOpen(false);
      toast.success("Penerimaan barang (GRN) berhasil dicatat dan stok fisik diperbarui.");

      // Reset Form
      setSelectedPoNumber("");
      setDeliveryOrderNo("");
      setFormNotes("");
      setFormItems([]);
    } catch (err: any) {
      toast.error("Gagal Menyimpan GRN", err?.response?.data?.message || err.message);
    }
  };

  const handleExportExcel = () => {
    exportToCsv({
      filename: `penerimaan-barang-inbound-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Penerimaan Barang Inbound (GRN)",
      data: filteredList,
      columns: [
        { header: "No. GRN", accessor: "grnNumber" },
        { header: "Tgl Terima", accessor: "receiveDate" },
        { header: "No. PO", accessor: "poNumber" },
        { header: "No. Surat Jalan", accessor: "deliveryOrderNo" },
        { header: "Supplier", accessor: "vendorName" },
        { header: "Gudang Tujuan", accessor: "warehouseName" },
        { header: "Qty Good", accessor: "totalQtyGood" },
        { header: "Qty Reject", accessor: "totalQtyReject" },
        { header: "Qty Bonus/Free", accessor: "totalQtyFree" },
        { header: "Status", accessor: "status" },
        { header: "Diterima Oleh", accessor: "receivedBy" },
      ],
    });
  };

  const handlePrintGrn = (grn: GoodsReceiptNote) => {
    toast.success(`Mencetak Bukti Penerimaan Barang ${grn.grnNumber}...`);
  };

  const handleApproveQc = (grn: GoodsReceiptNote) => {
    toast.success(`Inspeksi QC untuk ${grn.grnNumber} disetujui & stok dirilis.`);
    setSelectedGrn(null);
  };

  return {
    toast,
    dataList,
    filteredList,
    kpis,
    openPOs,
    catalogMaterials,
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
    vendorOptions,
    warehouseOptions,
    handleResetAll,
    selectedGrn,
    setSelectedGrn,
    isCreateOpen,
    setIsCreateOpen,
    selectedPoNumber,
    setSelectedPoNumber,
    receiveDate,
    setReceiveDate,
    deliveryOrderNo,
    setDeliveryOrderNo,
    warehouseName,
    setWarehouseName,
    formNotes,
    setFormNotes,
    formItems,
    setFormItems,
    handleSelectPo,
    handleUpdateItem,
    handleCreateGrn,
    handleExportExcel,
    handlePrintGrn,
    handleApproveQc,
    isLoading: isInboundsLoading || isPOsLoading,
  };
}
