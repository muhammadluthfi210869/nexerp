import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { SamplePayment, VerifyPaymentPayload } from "../_types/bayar-sample.types";

export function useBayarSampleOperations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SamplePayment | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const {
    data: samples,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<SamplePayment[]>({
    queryKey: ["bussdev-samples-payment"],
    queryFn: async () => {
      const resp = await api.get("/bussdev/samples");
      return resp.data
        .filter((s: any) => s.status !== "CANCELLED")
        .map((s: any) => ({
          id: s.id,
          code: s.code,
          customerName: s.customerName,
          totalAmount: Number(s.totalAmount || s.unitPrice * s.qty),
          paidAmount: Number(s.paidAmount || 0),
          remainingAmount: Number(s.remainingAmount || s.unitPrice * s.qty),
          paymentStatus: s.paymentStatus || "UNPAID",
        }));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ sampleId, formData }: VerifyPaymentPayload) => {
      const resp = await api.post("/finance/verify-payment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return resp.data;
    },
    onSuccess: () => {
      toast.success("Pembayaran sample berhasil diverifikasi!");
      queryClient.invalidateQueries({ queryKey: ["bussdev-samples-payment"] });
      setIsModalOpen(false);
      setSelectedSample(null);
      setPaymentFile(null);
    },
    onError: (err: any) => {
      toast.error("Verifikasi gagal", {
        description: err?.response?.data?.message || err.message,
      });
    },
  });

  const filteredSamples =
    samples?.filter(
      (s) =>
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const totalOutstanding =
    samples?.reduce((sum, s) => sum + s.remainingAmount, 0) || 0;
  const totalPaid =
    samples?.reduce((sum, s) => sum + s.paidAmount, 0) || 0;
  const awaitingPayment =
    samples?.filter((s) => s.remainingAmount > 0).length || 0;

  const handleOpenPaymentModal = (sample: SamplePayment) => {
    setSelectedSample(sample);
    setPaymentFile(null);
    setIsModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsModalOpen(false);
    setSelectedSample(null);
    setPaymentFile(null);
  };

  const handleConfirmPayment = (formData: FormData) => {
    if (!selectedSample) return;
    verifyMutation.mutate({
      sampleId: selectedSample.id,
      formData,
    });
  };

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ["bussdev-samples-payment"] });
  };

  const errorMessage = [401, 403].includes(
    (queryError as { response?: { status?: number } })?.response?.status ?? 0
  )
    ? "Akses ditolak â€” Anda tidak memiliki izin ke pembayaran sample"
    : "Gagal memuat data sample";

  return {
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    selectedSample,
    setSelectedSample,
    paymentFile,
    setPaymentFile,
    samples,
    isLoading,
    isError,
    errorMessage,
    verifyMutation,
    filteredSamples,
    totalOutstanding,
    totalPaid,
    awaitingPayment,
    handleOpenPaymentModal,
    handleClosePaymentModal,
    handleConfirmPayment,
    handleRetry,
  };
}
