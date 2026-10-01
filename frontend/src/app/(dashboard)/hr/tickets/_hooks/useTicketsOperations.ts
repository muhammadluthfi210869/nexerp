"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import type { HrTicketItem, NewTicketFormState, EmployeeOption } from "../_types/tickets.types";

const INITIAL_FORM_STATE: NewTicketFormState = {
  employeeId: "",
  type: "LEAVE",
  startDate: "2026-09-20",
  endDate: "2026-09-21",
  reason: "",
};

export function useTicketsOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HrTicketItem | null>(null);

  // Live queries
  const { data: rawTickets = [], isLoading } = useQuery({
    queryKey: ["hr-tickets"],
    queryFn: async () => {
      const res = await api.get("/hr/tickets");
      return res.data;
    },
  });

  const { data: rawEmployees = [] } = useQuery({
    queryKey: ["hr-employees"],
    queryFn: async () => {
      const res = await api.get("/hr/employees");
      return res.data;
    },
  });

  const employees: EmployeeOption[] = Array.isArray(rawEmployees) ? rawEmployees : [];

  const tickets: HrTicketItem[] = useMemo(() => {
    if (!rawTickets || !Array.isArray(rawTickets) || rawTickets.length === 0) return [];
    return rawTickets.map((t: any, idx: number) => {
      const sDate = t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : "-";
      const eDate = t.endDate ? new Date(t.endDate).toISOString().slice(0, 10) : sDate;
      const durationDays =
        t.startDate && t.endDate
          ? Math.max(
              1,
              Math.round(
                (new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 1;

      return {
        id: t.id || `tck-${idx}`,
        ticketNo: t.id
          ? `REQ-LV-${String(t.id).slice(0, 6).toUpperCase()}`
          : `REQ-LV-${idx + 1}`,
        empId:
          t.employee?.employeeId ||
          t.employee?.nik ||
          t.employeeId ||
          `EMP-${idx + 1}`,
        empName: t.employee?.name || t.employee?.fullName || "Karyawan",
        department: t.employee?.department || "Operasional",
        type: t.type || "LEAVE",
        startDate: sDate,
        endDate: eDate,
        duration: `${durationDays} Hari`,
        reason: t.reason || "-",
        approver: t.approver?.name || "Manager",
        status: t.status || "PENDING",
      };
    });
  }, [rawTickets]);

  // Form states
  const [newTicket, setNewTicket] = useState<NewTicketFormState>(INITIAL_FORM_STATE);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/hr/tickets", payload)).data;
    },
    onSuccess: () => {
      toast.success("Pengajuan tiket berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["hr-tickets"] });
      setIsCreateModalOpen(false);
      setNewTicket({
        employeeId: employees[0]?.id || "",
        type: "LEAVE",
        startDate: "2026-09-20",
        endDate: "2026-09-21",
        reason: "",
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat pengajuan tiket!");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return (await api.patch(`/hr/tickets/${id}`, { status })).data;
    },
    onSuccess: (_, vars) => {
      toast.success(
        `Tiket berhasil di-${vars.status === "APPROVED" ? "setujui" : "tolak"}!`
      );
      queryClient.invalidateQueries({ queryKey: ["hr-tickets"] });
      setSelectedTicket(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal memperbarui status tiket!");
    },
  });

  const pendingCount = tickets.filter((t) => t.status === "PENDING").length;
  const approvedCount = tickets.filter((t) => t.status === "APPROVED").length;
  const splCount = tickets.filter(
    (t) => t.type === "OVERTIME" || t.type === "LEMBUR_PRODUKSI"
  ).length;

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === "ALL" || t.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [tickets, searchQuery, typeFilter]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const empId = newTicket.employeeId || employees[0]?.id;
    if (!empId) {
      toast.error("Pilih karyawan terlebih dahulu!");
      return;
    }
    if (!newTicket.reason.trim()) {
      toast.error("Alasan pengajuan wajib diisi!");
      return;
    }
    createMutation.mutate({
      employeeId: empId,
      type: newTicket.type,
      startDate: new Date(newTicket.startDate).toISOString(),
      endDate: new Date(newTicket.endDate).toISOString(),
      reason: newTicket.reason,
    });
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handlePrintRecap = () => {
    window.print();
  };

  const handleExportExcel = () => {
    toast.success("Exporting Log Tiket ke Excel...");
  };

  const handlePrintApprovalSheet = () => {
    toast.success("Mencetak lembar persetujuan...");
  };

  return {
    // State
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedTicket,
    setSelectedTicket,
    newTicket,
    setNewTicket,
    employees,
    tickets,
    filteredTickets,
    isLoading,

    // Metrics
    pendingCount,
    approvedCount,
    splCount,

    // Actions
    handleCreateTicket,
    handleUpdateStatus,
    handlePrintRecap,
    handleExportExcel,
    handlePrintApprovalSheet,
    isCreating: createMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
