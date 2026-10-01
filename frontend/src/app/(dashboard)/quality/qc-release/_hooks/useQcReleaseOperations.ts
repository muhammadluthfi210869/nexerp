import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import { QcReleaseBatchItem } from "../_types/qc-release.types";

export function useQcReleaseOperations() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals & Drawer state
  const [releaseModalItem, setReleaseModalItem] = useState<QcReleaseBatchItem | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<QcReleaseBatchItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Form states for APJ Release
  const [apjName, setApjName] = useState("apt. Siti Rahmawati, S.Farm");
  const [apjSipa, setApjSipa] = useState("19920815/SIPA_32.73/2022/2044");
  const [apjNotes, setApjNotes] = useState(
    "Seluruh parameter fisika-kimia, mikrobiologi, dan organoleptik telah diverifikasi memenuhi spesifikasi CPKB."
  );
  const [agreeCheck, setAgreeCheck] = useState(false);

  const { data: serverBatches, refetch, isLoading } = useQuery({
    queryKey: ["production-qc-release-batches"],
    queryFn: async () => {
      try {
        const res = await api.get("/qc/release/batches");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped as QcReleaseBatchItem[];
        }
      } catch (err) {
        console.warn("Failed to fetch QC release batches", err);
      }
      return [] as QcReleaseBatchItem[];
    }
  });

  const batches = serverBatches || [];

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (activeTab === "QUARANTINE" && b.status !== "QUARANTINE") return false;
      if (activeTab === "RELEASED" && b.status !== "RELEASED") return false;
      if (activeTab === "INVESTIGATION" && b.status !== "INVESTIGATION") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchBatch = b.batchNumber.toLowerCase().includes(q);
        const matchSpk = b.spkCode.toLowerCase().includes(q);
        const matchProduct = b.productName.toLowerCase().includes(q);
        const matchBrand = b.brandName.toLowerCase().includes(q);
        const matchCustomer = b.customerName.toLowerCase().includes(q);
        if (!matchBatch && !matchSpk && !matchProduct && !matchBrand && !matchCustomer) return false;
      }
      return true;
    });
  }, [batches, activeTab, searchQuery]);

  const quarantineCount = batches.filter((b) => b.status === "QUARANTINE").length;
  const releasedCount = batches.filter((b) => b.status === "RELEASED").length;
  const investigationCount = batches.filter((b) => b.status === "INVESTIGATION").length;

  const handleOpenReleaseModal = (item: QcReleaseBatchItem) => {
    setReleaseModalItem(item);
    setAgreeCheck(false);
  };

  const handleCloseReleaseModal = () => {
    setReleaseModalItem(null);
  };

  const handleOpenDetailDrawer = (item: QcReleaseBatchItem) => {
    setDetailModalItem(item);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
  };

  const handleExportExcel = () => {
    exportToCsv({
      filename: `qc-apj-batch-release-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Rilis Batch Produk Jadi (APJ Release)",
      data: filteredBatches,
      columns: [
        { header: "Nomor Batch", accessor: "batchNumber" },
        { header: "Kode SPK", accessor: "spkCode" },
        { header: "Nama Produk", accessor: "productName" },
        { header: "Brand", accessor: "brandName" },
        { header: "Customer", accessor: "customerName" },
        { header: "Jumlah Output", accessor: "outputQty" },
        { header: "Kategori", accessor: "category" },
        { header: "Status QC", accessor: "status" },
        { header: "Tgl Selesai", accessor: "completionDate" },
        { header: "No. CoA", accessor: (b) => b.coaNumber || "-" },
      ],
    });
  };

  const handleExecuteRelease = async () => {
    if (!releaseModalItem) return;
    if (!agreeCheck) {
      toast.error("Validasi APJ Diperlukan", "Harap centang konfirmasi kepatuhan CPKB sebelum merilis batch.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/qc/release", {
        batchNumber: releaseModalItem.batchNumber,
        workOrderId: releaseModalItem.id,
        releaseQty: releaseModalItem.outputQty,
        apjName,
        apjSipa,
        notes: apjNotes,
      });
      const data = unwrapResponse(res);
      const coaCode = data?.coaNumber || `COA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-001`;

      await refetch();
      setReleaseModalItem(null);
      setIsDetailDrawerOpen(false);
      setAgreeCheck(false);
      toast.success("Batch Berhasil Dirilis APJ", `Batch ${releaseModalItem.batchNumber} telah dirilis resmi (${coaCode}) ke Gudang WH-03.`);
    } catch (err: any) {
      toast.error("Gagal Rilis Batch", err?.response?.data?.message || err?.message || "Terjadi kesalahan saat memproses rilis APJ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isSubmitting,
    releaseModalItem,
    setReleaseModalItem,
    detailModalItem,
    setDetailModalItem,
    isDetailDrawerOpen,
    setIsDetailDrawerOpen,
    apjName,
    setApjName,
    apjSipa,
    setApjSipa,
    apjNotes,
    setApjNotes,
    agreeCheck,
    setAgreeCheck,
    isLoading,
    batches,
    filteredBatches,
    quarantineCount,
    releasedCount,
    investigationCount,
    handleOpenReleaseModal,
    handleCloseReleaseModal,
    handleOpenDetailDrawer,
    handleCloseDetailDrawer,
    handleExportExcel,
    handleExecuteRelease,
  };
}

export type QcReleaseOperations = ReturnType<typeof useQcReleaseOperations>;
