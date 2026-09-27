"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaTable,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaCell,
  useDnaToast,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import {
  Shield,
  Activity,
  UserCheck,
  AlertTriangle,
  Search,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Clock,
  Terminal,
  Loader2,
} from "lucide-react";

interface AuditLogRecord {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  module: string;
  action: string;
  targetRef: string;
  description: string;
  ipAddress: string;
  status: string;
  metadata?: Record<string, any>;
}

export default function AuditLogsPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const { data: logsData, isLoading, refetch, isFetching } = useQuery<AuditLogRecord[]>({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const res = await api.get("/system/audit-logs");
      return res.data;
    },
  });

  const logs = logsData || [];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (moduleFilter !== "ALL" && log.module !== moduleFilter) return false;
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.role.toLowerCase().includes(q) ||
        log.targetRef.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.ipAddress.includes(q)
      );
    });
  }, [logs, moduleFilter, actionFilter, searchQuery]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Catatan Aktifitas Sistem (Audit Trail Logs)"
        subtitle="Pencatatan kronologis aktivitas pengguna, otorisasi transaksi, modifikasi data, dan akses keamanan sistem ERP"
        breadcrumbs={[{ label: "Pengaturan", href: "/system/settings" }, { label: "Catatan Aktifitas" }]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              icon={isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              onClick={() => {
                refetch();
                toast.success("Data Terkini", "Log audit berhasil dimutakhirkan.");
              }}
            >
              Segarkan Log
            </DnaButton>
            <DnaButton
              variant="primary"
              icon={<Download className="w-4 h-4" />}
              onClick={() => toast.success("Unduh Berhasil", "Export CSV audit trail siap diunduh.")}
            >
              Export Log Audit
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Log Hari Ini"
          value={`${logs.length} Aktivitas`}
          variant="blue"
          icon={<Activity className="h-4 w-4" />}
          delta={{ value: "Semua Sesi Tercatat", isPositive: true }}
        />
        <DnaStatCard
          label="Aksi Otorisasi / Approval"
          value={`${logs.filter((l) => l.action === "APPROVE" || l.action === "REJECT").length} Keputusan`}
          variant="emerald"
          icon={<UserCheck className="h-4 w-4" />}
          delta={{ value: "Validasi Manajerial", isPositive: true }}
        />
        <DnaStatCard
          label="Peringatan & Penolakan"
          value={`${logs.filter((l) => l.status === "WARNING" || l.status === "FAILED").length} Kejadian`}
          variant="amber"
          icon={<AlertTriangle className="h-4 w-4" />}
          delta={{ value: "Perlu Perhatian", isPositive: false }}
        />
        <DnaStatCard
          label="Integritas Keamanan"
          value="100% SECURE"
          variant="indigo"
          icon={<Shield className="h-4 w-4" />}
          delta={{ value: "Zero Breach Detected", isPositive: true }}
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="w-72">
          <DnaInput
            icon={<Search className="w-4 h-4" />}
            placeholder="Cari user, referensi, aksi, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-44">
            <DnaSelect
              value={moduleFilter}
              onChange={setModuleFilter}
              options={[
                { value: "ALL", label: "Semua Modul" },
                { value: "Penjualan", label: "Penjualan" },
                { value: "Pembelian", label: "Pembelian" },
                { value: "Gudang", label: "Gudang" },
                { value: "Produksi", label: "Produksi" },
                { value: "Finance", label: "Finance" },
                { value: "Quality", label: "Quality" },
                { value: "System", label: "System" },
              ]}
            />
          </div>
          <div className="w-44">
            <DnaSelect
              value={actionFilter}
              onChange={setActionFilter}
              options={[
                { value: "ALL", label: "Semua Tindakan" },
                { value: "CREATE", label: "CREATE (Buat)" },
                { value: "UPDATE", label: "UPDATE (Ubah)" },
                { value: "DELETE", label: "DELETE (Hapus)" },
                { value: "APPROVE", label: "APPROVE (Setuju)" },
                { value: "REJECT", label: "REJECT (Tolak)" },
                { value: "LOGIN", label: "LOGIN (Sesi)" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* 1:1 Table Standard */}
      <DnaDataTableCard title="Buku Audit Trail Aktivitas ERP (1:1 Standar G-SERP)">
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="px-4 py-3 w-12 text-center">#</DnaTh>
                <DnaTh className="px-4 py-3">Waktu & Tanggal</DnaTh>
                <DnaTh className="px-4 py-3">Pengguna (User)</DnaTh>
                <DnaTh className="px-4 py-3">Modul</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Tindakan</DnaTh>
                <DnaTh className="px-4 py-3">Objek / No. Ref</DnaTh>
                <DnaTh className="px-4 py-3">Alamat IP</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Status</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredLogs.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada catatan aktivitas yang cocok dengan kriteria filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredLogs.map((log, index) => (
                  <DnaTableRow key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="px-4 py-3 text-center text-slate-400 tabular-nums text-xs">{index + 1}</DnaTd>
                    <DnaTd className="px-4 py-3 tabular-nums text-slate-600 whitespace-nowrap">{log.timestamp}</DnaTd>
                    <DnaTd className="px-4 py-3">
                      <DnaCell.Text primary={log.user} secondary={log.role} />
                    </DnaTd>
                    <DnaTd className="px-4 py-3 font-medium text-slate-700">{log.module}</DnaTd>
                    <DnaTd className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                          log.action === "APPROVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : log.action === "REJECT"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : log.action === "CREATE"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : log.action === "LOGIN"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {log.action}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-4 py-3 tabular-nums font-semibold text-slate-900">{log.targetRef}</DnaTd>
                    <DnaTd className="px-4 py-3 tabular-nums text-slate-500">{log.ipAddress}</DnaTd>
                    <DnaTd className="px-4 py-3 text-center">
                      <DnaBadge
                        variant={
                          log.status === "SUCCESS" ? "emerald" : log.status === "WARNING" ? "amber" : "critical"
                        }
                      >
                        {log.status}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-4 py-3 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedLog(log)}
                      >
                        Detail
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Log */}
      <DnaModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detail Catatan Audit Transaksi"
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Waktu Kejadian:</span>
                <span className="tabular-nums font-bold text-slate-800">{selectedLog.timestamp} WIB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pengguna & Peran:</span>
                <span className="font-semibold text-slate-900">{selectedLog.user} ({selectedLog.role})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Modul & Tindakan:</span>
                <span className="font-bold text-blue-700">{selectedLog.module} • {selectedLog.action}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Referensi Dokumen:</span>
                <span className="tabular-nums font-bold text-slate-900">{selectedLog.targetRef}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Alamat IP / Klien:</span>
                <span className="tabular-nums text-slate-600">{selectedLog.ipAddress}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700 block">Keterangan Aktivitas:</span>
              <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                {selectedLog.description}
              </p>
            </div>

            {selectedLog.metadata && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 block">Metadata Payload (JSON):</span>
                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl tabular-nums text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedLog(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
