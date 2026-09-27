"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  FileText,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaDetailDrawer,
  DnaInput,
  useDnaToast,
  DnaLoadingSkeleton,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

export default function ChangeRequestsPage() {
  const queryClient = useQueryClient();
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["change-requests"],
    queryFn: async () => (await api.get("/system/change-requests")).data || [],
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/system/change-request", form),
    onSuccess: () => {
      toast.success("Permintaan perubahan berhasil diajukan.");
      queryClient.invalidateQueries({ queryKey: ["change-requests"] });
      setIsModalOpen(false);
      setForm({ title: "", description: "", priority: "MEDIUM" });
    },
    onError: () => toast.error("Gagal mengirim permintaan perubahan."),
  });

  const pendingCount = (requests as any[]).filter((r: any) => !r.status || r.status === "PENDING").length;
  const doneCount = (requests as any[]).filter((r: any) => r.status === "DONE").length;

  const filteredRequests = useMemo(() => {
    return (requests as any[]).filter((req: any) => {
      const matchSearch =
        (req.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL"
          ? true
          : activeTab === "PENDING"
          ? !req.status || req.status === "PENDING"
          : activeTab === "DONE"
          ? req.status === "DONE"
          : true;

      return matchSearch && matchTab;
    });
  }, [requests, searchQuery, activeTab]);

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Tabs */}
      <DnaPageHeader
        title="Daftar Request Perubahan"
        description="Ajukan tiket perubahan spesifikasi modul, penyesuaian alur SCM, dan fitur pengadaan."
        badge={<DnaBadge variant="neutral">SYS-CHG-REQ</DnaBadge>}
        tabs={[
          { key: "ALL", label: "Semua Request", count: requests.length },
          { key: "PENDING", label: "Menunggu Review", count: pendingCount },
          { key: "DONE", label: "Selesai", count: doneCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            variant="primary"
            size="sm"
          >
            + Ajukan Perubahan
          </DnaButton>
        }
      />

      {/* Main Table Card */}
      {isLoading ? (
        <DnaLoadingSkeleton rows={4} />
      ) : (
        <DnaDataTableCard
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari permintaan perubahan..."
        >
          <div className="w-full">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-3 px-4 w-[45%]">JUDUL & DESKRIPSI</DnaTh>
                  <DnaTh className="py-3 px-4 w-[20%]">TANGGAL & PRIORITAS</DnaTh>
                  <DnaTh className="py-3 px-4 text-center w-[20%]">STATUS</DnaTh>
                  <DnaTh className="py-3 px-4 text-right w-[15%]">AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredRequests.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={4} className="py-8 text-center">
                      <DnaEmptyState
                        title="Belum Ada Permintaan Perubahan"
                        description="Belum ada tiket perubahan sistem yang diajukan pada filter ini."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredRequests.map((req: any) => (
                    <DnaTableRow
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <DnaTd className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block truncate">
                          {req.title}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {req.description}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4">
                        <span className="text-[11px] tabular-nums text-slate-600 block">
                          {req.createdAt || "-"}
                        </span>
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 mt-0.5">
                          {req.priority || "MEDIUM"}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-center">
                        <DnaBadge
                          variant={
                            req.status === "DONE"
                              ? "success"
                              : req.status === "REJECTED"
                              ? "critical"
                              : "warning"
                          }
                        >
                          {req.status || "PENDING"}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedRequest(req)}
                          >
                            Detail
                          </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* DnaDetailDrawer for Request Details */}
      <DnaDetailDrawer
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest?.title || "Rincian Permintaan Perubahan"}
        subtitle={selectedRequest ? `Prioritas: ${selectedRequest.priority || "MEDIUM"} • ${selectedRequest.createdAt || ""}` : undefined}
        badge={
          selectedRequest ? (
            <DnaBadge
              variant={
                selectedRequest.status === "DONE"
                  ? "success"
                  : selectedRequest.status === "REJECTED"
                  ? "critical"
                  : "warning"
              }
            >
              {selectedRequest.status || "PENDING"}
            </DnaBadge>
          ) : undefined
        }
        footer={
          <div className="flex items-center justify-end w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedRequest && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Judul Permintaan</span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedRequest.title}</h4>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] mb-1">Deskripsi & Catatan Kebutuhan</span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedRequest.description}</p>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Ajukan Request Baru */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Form Pengajuan Perubahan ERP"
        description="Jelaskan kebutuhan penyesuaian fungsionalitas sistem ERP untuk ditinjau oleh tim engineering."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!form.title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Mengirim..." : "Kirim Permintaan"}
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Judul Perubahan *</label>
            <DnaInput
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Tambah filter multi-supplier pada menu Faktur..."
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Deskripsi Lengkap *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full h-28 bg-white border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Jelaskan alasan dan detail alur perubahan yang diinginkan..."
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Tingkat Prioritas</label>
            <select
              aria-label="Prioritas"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="LOW">Rendah (Backlog Enhancement)</option>
              <option value="MEDIUM">Sedang (Sprint Berikutnya)</option>
              <option value="HIGH">Tinggi (Kebutuhan Operasional)</option>
              <option value="CRITICAL">Kritis (Sistem Terkendala)</option>
            </select>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
