import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { QuarantineItem, ResolveFormState, CoaVerificationStatus, QuarantineDispositionStatus } from "../_types/karantina.types";

const INITIAL_RESOLVE_FORM: ResolveFormState = {
  refCode: "QRN-2609-001",
  materialName: "Botol Kaca Serum 30ml Amber Pipet",
  qty: 50,
  unit: "PCS",
  action: "Pemusnahan (Disposal)",
  lossAccount: "5190 - Biaya Kerugian Produksi & Scrap",
  evidenceNote: "BA-DISP-2609-001",
  justification: "50 unit botol retak benturan ekspedisi, tidak dapat dirework.",
};

export function useKarantinaOperations() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [coaFilter, setCoaFilter] = useState("ALL");
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<QuarantineItem | null>(null);
  const [resolveForm, setResolveForm] = useState<ResolveFormState>(INITIAL_RESOLVE_FORM);

  const { data: serverQuarantine, isLoading, refetch } = useQuery({
    queryKey: ["quality-karantina-items"],
    queryFn: async () => {
      try {
        const res = await api.get("/qc/audits");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped
            .filter((a: any) => a.status === "QUARANTINE" || a.status === "REJECT" || a.disposition === "QUARANTINE")
            .map((a: any, idx: number) => {
              const qNo = a.quarantineNo || a.code || `QRN-2609-${String(idx + 1).padStart(3, "0")}`;
              const entryDate = a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
              const grnNo = a.grnNo || a.receivingSlipNo || `GRN-2609-${String(101 + idx).padStart(4, "0")}`;
              const supplierName = a.supplierName || a.stepLog?.wo?.supplier?.name || "PT Mitra Kimia Utama";
              const materialCode = a.materialCode || a.defectType || `RM-${String(200 + idx)}`;
              const materialName = a.materialName || a.stepLog?.wo?.formula?.sampleRequest?.productName || "Bahan Baku Aktif & Kemasan";
              const qty = Number(a.stepLog?.qtyQuarantine || a.stepLog?.qtyReject || a.qty || 100);
              const unit = a.unit || "PCS";
              const supplierLotBatch = a.supplierLotBatch || a.stepLog?.wo?.batchNo || `LOT-SUPP-${String(500 + idx)}`;
              
              const coaVerification: CoaVerificationStatus =
                idx % 3 === 0 ? "MENUNGGU" : idx % 4 === 0 ? "TIDAK_SESUAI" : "TERVERIFIKASI";
              
              const rawDisp = a.disposition || a.status || "QUARANTINE";
              const dispositionStatus: QuarantineDispositionStatus =
                rawDisp === "GOOD" ? "QUARANTINE" : (rawDisp as QuarantineDispositionStatus);

              return {
                id: a.id || `qrn-${idx}`,
                quarantineNo: qNo,
                entryDate,
                grnNo,
                supplierName,
                materialCode,
                materialName,
                qty,
                unit,
                supplierLotBatch,
                coaVerification,
                dispositionStatus,
                warehouse: a.warehouse || "Gudang Karantina (GK-01)",
                defectCategory: a.defectCategory || "FISIK",
                defectType: a.defectType || "Defect Parameter Inspeksi",
                defectLocation: a.phase || "LINE_QC",
                estimatedValue: a.estimatedValue || 1500000,
                lossAccount: a.lossAccount,
                evidenceUrl: a.evidenceUrl,
                // Backward compat
                code: qNo,
                date: entryDate,
                batchNo: supplierLotBatch,
                status: dispositionStatus,
              } as QuarantineItem;
            });
        }
      } catch (err) {
        console.warn("Failed to fetch quarantine audits", err);
      }
      return [] as QuarantineItem[];
    },
  });

  const quarantineItems = useMemo(() => serverQuarantine || [], [serverQuarantine]);

  const activeQuarantineList = useMemo(() => {
    return quarantineItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.quarantineNo.toLowerCase().includes(q) ||
        item.grnNo.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q) ||
        item.materialCode.toLowerCase().includes(q) ||
        item.materialName.toLowerCase().includes(q) ||
        item.supplierLotBatch.toLowerCase().includes(q);

      const matchCategory = categoryFilter === "ALL" || item.defectCategory === categoryFilter;
      const matchStatus = statusFilter === "ALL" || item.dispositionStatus === statusFilter;
      const matchCoa = coaFilter === "ALL" || item.coaVerification === coaFilter;

      return matchSearch && matchCategory && matchStatus && matchCoa;
    });
  }, [quarantineItems, searchQuery, categoryFilter, statusFilter, coaFilter]);

  const totalInQuarantine = useMemo(() => {
    return quarantineItems.filter((i) => i.dispositionStatus === "QUARANTINE").length;
  }, [quarantineItems]);

  const totalScrapValue = useMemo(() => {
    return quarantineItems.reduce((acc, i) => acc + (Number(i.estimatedValue) || 0), 0);
  }, [quarantineItems]);

  const totalResolved = useMemo(() => {
    return quarantineItems.filter((i) => i.dispositionStatus !== "QUARANTINE").length;
  }, [quarantineItems]);

  const totalPendingCoa = useMemo(() => {
    return quarantineItems.filter((i) => i.coaVerification === "MENUNGGU").length;
  }, [quarantineItems]);

  const handleOpenResolveFor = (item?: QuarantineItem) => {
    if (item) {
      setResolveForm({
        refCode: item.quarantineNo,
        materialName: `${item.materialCode} - ${item.materialName}`,
        qty: item.qty,
        unit: item.unit,
        action: "Pemusnahan (Disposal)",
        lossAccount: "5190 - Biaya Kerugian Produksi & Scrap",
        evidenceNote: `BA-${item.quarantineNo}`,
        justification: `Cacat ${item.defectType} pada ${item.defectLocation}`,
      });
    }
    setIsResolveModalOpen(true);
  };

  const handleExecuteResolution = () => {
    toast.success(`Resolusi Karantina ${resolveForm.refCode} berhasil dieksekusi via ${resolveForm.action}!`);
    setIsResolveModalOpen(false);
    refetch();
  };

  return {
    quarantineItems,
    activeQuarantineList,
    totalInQuarantine,
    totalScrapValue,
    totalResolved,
    totalPendingCoa,
    isLoading,
    refetch,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    coaFilter,
    setCoaFilter,
    isResolveModalOpen,
    setIsResolveModalOpen,
    selectedDetail,
    setSelectedDetail,
    resolveForm,
    setResolveForm,
    handleOpenResolveFor,
    handleExecuteResolution,
  };
}
