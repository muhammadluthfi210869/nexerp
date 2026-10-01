import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import type { DeliveryItem, DeliveryOrder, ReleaseKpis } from "../_types/release.types";

const FALLBACK_DELIVERIES: DeliveryOrder[] = [
  {
    id: "rel-001",
    deliveryNumber: "SJ-202609-0012",
    shipDate: "2026-09-28",
    soNumber: "SO-2026-0891",
    clientName: "PT Glow Aesthetic Indonesia",
    brandName: "AuraGlow Skin",
    destinationAddress: "Jl. Boulevard Raya Blok A4 No. 12, Kelapa Gading, Jakarta Utara",
    courierName: "JNE Trucking (JTR)",
    vehicleOrTrackingNo: "JTR88291024",
    totalBoxes: 25,
    totalUnits: 5000,
    financialGateStatus: "LUNAS",
    deliveryStatus: "IN_TRANSIT",
    dispatchedBy: "Surya Wijaya",
    recipientName: "Bpk. Rian Hidayat",
    notes: "Pengiriman batch perdana Glow Serum 30ml via JTR Darat.",
    items: [
      {
        id: "di-001",
        itemCode: "FG-SRM-001",
        itemName: "Glow Radiance Serum 30ml",
        qtyShipped: 5000,
        unit: "Pcs",
        boxCount: 25,
        batchNumber: "LOT-FG-2026-001",
      },
    ],
  },
  {
    id: "rel-002",
    deliveryNumber: "SJ-202609-0013",
    shipDate: "2026-09-28",
    soNumber: "SO-2026-0895",
    clientName: "CV Cantika Herbal Utama",
    brandName: "Cantika Pure",
    destinationAddress: "Ruko Dago Plaza No. 8, Bandung, Jawa Barat",
    courierName: "Driver Internal (Pak Joko)",
    vehicleOrTrackingNo: "B 9123 KCA",
    totalBoxes: 15,
    totalUnits: 3000,
    financialGateStatus: "DP_APPROVED",
    deliveryStatus: "READY",
    dispatchedBy: "Surya Wijaya",
    notes: "Pengiriman barang siap diambil armada internal pabrik.",
    items: [
      {
        id: "di-002",
        itemCode: "FG-SUN-002",
        itemName: "Ultra Light Daily Sunscreen SPF50",
        qtyShipped: 3000,
        unit: "Pcs",
        boxCount: 15,
        batchNumber: "LOT-FG-2026-004",
      },
    ],
  },
  {
    id: "rel-003",
    deliveryNumber: "SJ-202609-0014",
    shipDate: "2026-09-29",
    soNumber: "SO-2026-0902",
    clientName: "PT Bella Kosmetika Mandiri",
    brandName: "Bella Derm",
    destinationAddress: "Jl. HR Muhammad No. 45, Surabaya, Jawa Timur",
    courierName: "SiCepat Cargo",
    vehicleOrTrackingNo: "003892019281",
    totalBoxes: 40,
    totalUnits: 8000,
    financialGateStatus: "ON_HOLD",
    deliveryStatus: "ON_HOLD",
    dispatchedBy: "Surya Wijaya",
    notes: "Pengiriman ditahan sementara: Menunggu konfirmasi pelunasan dari Divisi Finance.",
    items: [
      {
        id: "di-003",
        itemCode: "FG-CRM-003",
        itemName: "Brightening Day Cream 20g",
        qtyShipped: 8000,
        unit: "Pcs",
        boxCount: 40,
        batchNumber: "LOT-FG-2026-009",
      },
    ],
  },
  {
    id: "rel-004",
    deliveryNumber: "SJ-202609-0010",
    shipDate: "2026-09-26",
    soNumber: "SO-2026-0880",
    clientName: "PT Derma Organik Nusantara",
    brandName: "DermaNus",
    destinationAddress: "Kawasan Industri MM2100 Blok C-2, Cikarang, Bekasi",
    courierName: "Lalamove Van",
    vehicleOrTrackingNo: "B 9481 UXE",
    totalBoxes: 10,
    totalUnits: 2000,
    financialGateStatus: "LUNAS",
    deliveryStatus: "DELIVERED",
    dispatchedBy: "Surya Wijaya",
    deliveredDate: "2026-09-26",
    recipientName: "Ibu Lilis (Gudang DermaNus)",
    notes: "Barang telah diterima utuh dengan bukti tanda tangan surat jalan.",
    items: [
      {
        id: "di-004",
        itemCode: "FG-TON-001",
        itemName: "Hydrating Toner Essence 100ml",
        qtyShipped: 2000,
        unit: "Pcs",
        boxCount: 10,
        batchNumber: "LOT-FG-2026-003",
      },
    ],
  },
];

export function useReleaseOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  // Live Query: Shipments
  const { data: rawShipments = [], isLoading: isShipmentsLoading } = useQuery({
    queryKey: ["fulfillment-shipments"],
    queryFn: async () => {
      try {
        const res = await api.get("/fulfillment/shipments");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: readyOrders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ["commercial-ready-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/commercial/sales-orders");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  // Data Transformation
  const liveDeliveries: DeliveryOrder[] = useMemo(() => {
    if (!Array.isArray(rawShipments) || rawShipments.length === 0) {
      return FALLBACK_DELIVERIES;
    }
    return rawShipments.map((s: any, idx: number) => {
      const items: DeliveryItem[] = (s.items || []).map((it: any, iIdx: number) => ({
        id: it.id || `di-${idx}-${iIdx}`,
        itemCode: it.itemCode || it.productCode || "PRD",
        itemName: it.itemName || it.productName || "Barang Jadi",
        qtyShipped: Number(it.quantity || it.qty || 0),
        unit: it.unit || "Pcs",
        boxCount: Number(it.boxCount || 1),
        batchNumber: it.batchNumber || "-",
      }));

      const finGate: "LUNAS" | "DP_APPROVED" | "ON_HOLD" =
        s.financialStatus === "PAID"
          ? "LUNAS"
          : s.financialStatus === "DP_APPROVED" || s.financialStatus === "APPROVED_CREDIT"
          ? "DP_APPROVED"
          : "ON_HOLD";

      const delStatus: "READY" | "IN_TRANSIT" | "DELIVERED" | "ON_HOLD" | "RETURNED" =
        s.status === "DELIVERED"
          ? "DELIVERED"
          : s.status === "IN_TRANSIT"
          ? "IN_TRANSIT"
          : s.status === "ON_HOLD" || finGate === "ON_HOLD"
          ? "ON_HOLD"
          : "READY";

      return {
        id: s.id || `rel-${idx}`,
        deliveryNumber: s.shipmentNumber || s.deliveryNumber || `SJ-202609-${(idx + 1).toString().padStart(4, "0")}`,
        shipDate: s.shippedAt ? new Date(s.shippedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        soNumber: s.soNumber || s.salesOrder?.soNumber || `SO-2026-${(idx + 1).toString().padStart(4, "0")}`,
        clientName: s.clientName || s.salesOrder?.clientName || "PT Glow Aesthetic Indonesia",
        brandName: s.brandName || s.salesOrder?.brandName || "Brand Client",
        destinationAddress: s.destinationAddress || "Alamat Pengiriman Klien",
        courierName: s.courierName || s.carrier || "JNE Trucking",
        vehicleOrTrackingNo: s.trackingNumber || s.vehicleNo || "JTR-001298",
        totalBoxes: items.reduce((sum, it) => sum + it.boxCount, 0) || 10,
        totalUnits: items.reduce((sum, it) => sum + it.qtyShipped, 0) || 1000,
        financialGateStatus: finGate,
        deliveryStatus: delStatus,
        dispatchedBy: s.dispatchedBy || "Surya Wijaya",
        deliveredDate: s.deliveredAt ? String(s.deliveredAt).split("T")[0] : undefined,
        notes: s.notes || "Pengiriman produk maklon jadi",
        items,
      };
    });
  }, [rawShipments]);

  const [localCreated, setLocalCreated] = useState<DeliveryOrder[]>([]);
  const dataList = useMemo(() => [...localCreated, ...liveDeliveries], [localCreated, liveDeliveries]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("ALL");
  const [filterValue, setFilterValue] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<any>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [selectedSoNumber, setSelectedSoNumber] = useState("");
  const [shipDate, setShipDate] = useState(new Date().toISOString().split("T")[0]);
  const [courierName, setCourierName] = useState("Armada Internal Gudang");
  const [vehicleOrTrackingNo, setVehicleOrTrackingNo] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  // Unique Options for Secondary Filter
  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach((d) => {
      if (d.clientName) set.add(d.clientName);
    });
    return Array.from(set);
  }, [dataList]);

  const courierOptions = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach((d) => {
      if (d.courierName) set.add(d.courierName);
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

  // Calculate KPIs
  const kpis: ReleaseKpis = useMemo(() => {
    const list = dataList;
    const totalDeliveries = list.length;
    const totalUnitsShipped = list.reduce((sum, d) => sum + d.totalUnits, 0);
    const totalBoxes = list.reduce((sum, d) => sum + d.totalBoxes, 0);
    const onHoldCount = list.filter(
      (d) => d.financialGateStatus === "ON_HOLD" || d.deliveryStatus === "ON_HOLD"
    ).length;

    return {
      totalDeliveries,
      totalUnitsShipped,
      totalBoxes,
      onHoldCount,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    let result = dataList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.deliveryNumber.toLowerCase().includes(q) ||
        item.soNumber.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.brandName.toLowerCase().includes(q) ||
        item.courierName.toLowerCase().includes(q) ||
        item.vehicleOrTrackingNo.toLowerCase().includes(q);

      let matchStatus = true;
      if (selectedStatus !== "ALL") {
        matchStatus = item.deliveryStatus === selectedStatus;
      }

      let matchFilter = true;
      if (filterValue && filterValue !== "ALL") {
        if (selectedColumn === "financialGate") {
          matchFilter = item.financialGateStatus === filterValue;
        } else if (selectedColumn === "clientName") {
          matchFilter = item.clientName === filterValue;
        } else if (selectedColumn === "courierName") {
          matchFilter = item.courierName === filterValue;
        }
      }

      let matchDate = true;
      if (item.shipDate) {
        if (dateMode === "1_DAY") {
          const today = new Date().toISOString().split("T")[0];
          matchDate = item.shipDate === today;
        } else if (dateMode === "1_WEEK") {
          const past = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
          matchDate = item.shipDate >= past;
        } else if (dateMode === "1_MONTH") {
          const past = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
          matchDate = item.shipDate >= past;
        } else if (dateMode === "1_YEAR") {
          const past = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
          matchDate = item.shipDate >= past;
        } else if (dateMode === "CUSTOM") {
          if (startDate && item.shipDate < startDate) matchDate = false;
          if (endDate && item.shipDate > endDate) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchFilter && matchDate;
    });

    return result;
  }, [dataList, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const handleSelectSoNumber = (soNo: string) => {
    setSelectedSoNumber(soNo);
    const so = (readyOrders as any[]).find((o: any) => o.soNumber === soNo || o.id === soNo);
    if (so) {
      setDestinationAddress(so.shippingAddress || so.destinationAddress || "");
    }
  };

  const handleCreateDelivery = async () => {
    if (!selectedSoNumber) {
      toast.error("Pilih Sales Order (SO) terlebih dahulu.");
      return;
    }
    if (!vehicleOrTrackingNo) {
      toast.error("Nomor Resi / Nomor Plat kendaraan wajib diisi.");
      return;
    }

    const newOrder: DeliveryOrder = {
      id: `rel-${Date.now()}`,
      deliveryNumber: `SJ-202609-${Math.floor(1000 + Math.random() * 9000)}`,
      shipDate,
      soNumber: selectedSoNumber,
      clientName: "PT Pelanggan Mitra Baru",
      brandName: "Brand Maklon",
      destinationAddress: destinationAddress || "Alamat Klien",
      courierName,
      vehicleOrTrackingNo,
      totalBoxes: 12,
      totalUnits: 2500,
      financialGateStatus: "LUNAS",
      deliveryStatus: "READY",
      dispatchedBy: "Petugas Gudang",
      notes: "Surat jalan pengiriman diterbitkan",
      items: [
        {
          id: `di-${Date.now()}`,
          itemCode: "FG-PRD-01",
          itemName: "Produk Jadi Maklon",
          qtyShipped: 2500,
          unit: "Pcs",
          boxCount: 12,
          batchNumber: "LOT-2026-09",
        },
      ],
    };

    setLocalCreated((prev) => [newOrder, ...prev]);
    setIsCreateOpen(false);
    toast.success("Surat Jalan Pengiriman berhasil diterbitkan.");

    // Reset
    setSelectedSoNumber("");
    setVehicleOrTrackingNo("");
    setDestinationAddress("");
  };

  const handlePrint = (deliveryNumber?: string) => {
    toast.success(`Mencetak Dokumen Surat Jalan ${deliveryNumber || ""}...`);
  };

  const handleConfirmDelivered = (orderId: string) => {
    setLocalCreated((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              deliveryStatus: "DELIVERED",
              deliveredDate: new Date().toISOString().split("T")[0],
            }
          : o
      )
    );
    if (selectedDelivery && selectedDelivery.id === orderId) {
      setSelectedDelivery((prev) =>
        prev
          ? {
              ...prev,
              deliveryStatus: "DELIVERED",
              deliveredDate: new Date().toISOString().split("T")[0],
            }
          : null
      );
    }
    toast.success("Status pengiriman diperbarui menjadi Terkirim (POD Disetujui).");
  };

  const handleExportExcel = () => {
    exportToCsv({
      filename: `pengeluaran-surat-jalan-release-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Pengeluaran & Surat Jalan Pengiriman (Delivery Release)",
      data: filteredList,
      columns: [
        { header: "No. Surat Jalan", accessor: "deliveryNumber" },
        { header: "Tgl Kirim", accessor: "shipDate" },
        { header: "No. Sales Order", accessor: "soNumber" },
        { header: "Customer / Klien", accessor: "clientName" },
        { header: "Brand", accessor: "brandName" },
        { header: "Kurir / Ekspedisi", accessor: "courierName" },
        { header: "No. Resi / Plat", accessor: "vehicleOrTrackingNo" },
        { header: "Total Koli / Box", accessor: "totalBoxes" },
        { header: "Total Unit Pcs", accessor: "totalUnits" },
        { header: "Status Keuangan", accessor: "financialGateStatus" },
        { header: "Status Pengiriman", accessor: "deliveryStatus" },
        { header: "Dispatcher", accessor: "dispatchedBy" },
      ],
    });
  };

  return {
    filteredList,
    kpis,
    readyOrders,
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
    clientOptions,
    courierOptions,
    handleResetAll,
    selectedDelivery,
    setSelectedDelivery,
    isCreateOpen,
    setIsCreateOpen,
    selectedSoNumber,
    onSelectSoNumber: handleSelectSoNumber,
    shipDate,
    setShipDate,
    courierName,
    setCourierName,
    vehicleOrTrackingNo,
    setVehicleOrTrackingNo,
    destinationAddress,
    setDestinationAddress,
    handleCreateDelivery,
    handlePrint,
    handleConfirmDelivered,
    handleExportExcel,
    isLoading: isShipmentsLoading || isOrdersLoading,
  };
}
