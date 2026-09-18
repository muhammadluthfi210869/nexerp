"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";

interface AuditLogRecord {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  module: "Penjualan" | "Pembelian" | "Gudang" | "Produksi" | "Finance" | "Quality" | "System";
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "LOGIN";
  targetRef: string;
  description: string;
  ipAddress: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
  metadata?: Record<string, any>;
}

const INITIAL_LOGS: AuditLogRecord[] = [
  {
    id: "log-101",
    timestamp: "2026-09-16 15:10:24",
    user: "dr. Rian Pratama",
    role: "Apoteker Penanggung Jawab (APJ)",
    module: "Quality",
    action: "APPROVE",
    targetRef: "APJ-REL-2026-004",
    description: "Otorisasi Rilis Batch Produk Jadi Sunscreen SPF 50",
    ipAddress: "192.168.1.45",
    status: "SUCCESS",
    metadata: { batch: "FG-GLOW-SUN50", nie: "NA18261700192", lotQty: 20000 },
  },
  {
    id: "log-102",
    timestamp: "2026-09-16 14:45:12",
    user: "Fitri Handayani",
    role: "Sales Executive",
    module: "Penjualan",
    action: "CREATE",
    targetRef: "SO-2026-0512",
    description: "Pembuatan Sales Order Baru PT Glow Skin Global",
    ipAddress: "192.168.1.18",
    status: "SUCCESS",
    metadata: { client: "PT Glow Skin Global", totalAmount: 347000000 },
  },
  {
    id: "log-103",
    timestamp: "2026-09-16 13:30:00",
    user: "Ahmad Subarjo",
    role: "Warehouse Head",
    module: "Gudang",
    action: "UPDATE",
    targetRef: "TRF-2026-0002",
    description: "Konfirmasi Penerimaan Mutasi Bahan Kemas ke Gudang Produksi",
    ipAddress: "192.168.1.88",
    status: "SUCCESS",
    metadata: { origin: "Gudang Kemasan", destination: "Gudang Produksi" },
  },
  {
    id: "log-104",
    timestamp: "2026-09-16 12:15:44",
    user: "Budi Hermawan",
    role: "Commercial Director",
    module: "Penjualan",
    action: "REJECT",
    targetRef: "SO-2026-0499",
    description: "Penolakan SO karena Plafon Piutang Melebihi Batas Limit",
    ipAddress: "192.168.1.12",
    status: "WARNING",
    metadata: { client: "CV Sinar Kosmetika Utama", overdueDays: 18 },
  },
  {
    id: "log-105",
    timestamp: "2026-09-16 11:05:30",
    user: "Siti Rahmawati",
    role: "Finance AP Specialist",
    module: "Finance",
    action: "APPROVE",
    targetRef: "PO-2026-004",
    description: "Verifikasi Invoice Pembelian Bahan Baku PT Chemindo",
    ipAddress: "192.168.1.22",
    status: "SUCCESS",
    metadata: { invoiceAmount: 14000000, supplier: "PT Chemindo Natural" },
  },
  {
    id: "log-106",
    timestamp: "2026-09-16 09:12:10",
    user: "admin.it",
    role: "System Administrator",
    module: "System",
    action: "LOGIN",
    targetRef: "AUTH-SESSION-892",
    description: "Autentikasi Berhasil via SSO 2FA Google Workspace",
    ipAddress: "192.168.1.5",
    status: "SUCCESS",
    metadata: { authMethod: "OIDC_2FA", browser: "Chrome 128 / Windows" },
  },
  {
    id: "log-107",
    timestamp: "2026-09-16 08:30:15",
    user: "Hendri Kurniawan",
    role: "Mixing Operator",
    module: "Produksi",
    action: "UPDATE",
    targetRef: "SCH-MIX-2026-001",
    description: "Update Realisasi Tangki Mixing Tank 01 Suhu 75°C",
    ipAddress: "192.168.2.14",
    status: "SUCCESS",
    metadata: { temperature: "75C", rpm: "1200", durationMinutes: 45 },
  },
];

export default function AuditLogsPage() {
  const toast = useDnaToast();
  const [logs, setLogs] = useState<AuditLogRecord[]>(INITIAL_LOGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

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
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => toast.success("Data Terkini", "Log audit berhasil dimutakhirkan.")}
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
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Waktu & Tanggal</th>
                <th className="px-4 py-3">Pengguna (User)</th>
                <th className="px-4 py-3">Modul</th>
                <th className="px-4 py-3 text-center">Tindakan</th>
                <th className="px-4 py-3">Objek / No. Ref</th>
                <th className="px-4 py-3">Alamat IP</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada catatan aktivitas yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3">
                      <DnaCell.Text primary={log.user} secondary={log.role} />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{log.module}</td>
                    <td className="px-4 py-3 text-center">
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
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{log.targetRef}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-center">
                      <DnaBadge
                        variant={
                          log.status === "SUCCESS" ? "emerald" : log.status === "WARNING" ? "amber" : "danger"
                        }
                      >
                        {log.status}
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedLog(log)}
                      >
                        Detail
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
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
                <span className="font-mono font-bold text-slate-800">{selectedLog.timestamp} WIB</span>
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
                <span className="font-mono font-bold text-slate-900">{selectedLog.targetRef}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Alamat IP / Klien:</span>
                <span className="font-mono text-slate-600">{selectedLog.ipAddress}</span>
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
                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
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
