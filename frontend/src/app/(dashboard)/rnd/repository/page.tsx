"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  FlaskConical,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
  Filter,
} from "lucide-react";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import {
  OperationalDataTable,
  OperationalField,
  OperationalPanel,
  OperationalStatusBadge,
} from "@/components/operational";

const STATUS_TONE: Record<string, "success" | "neutral"> = {
  RELEASED: "success",
  ARCHIVED: "neutral",
};

export default function RndRepositoryPage() {
  const { data: formulas, isLoading } = useQuery({
    queryKey: ["master-formulas"],
    queryFn: async () => {
      const res = await api.get("/rnd/formulas", { params: { status: "ARCHIVED" } });
      return res.data.map((f: any) => ({
        id: f.formulaCode || f.id,
        name: f.sampleRequest?.productName || "—",
        category: "Skincare",
        version: `v${f.version || 1}`,
        status: f.status || "ARCHIVED",
        stability: f.labTestResults?.length > 0 ? (f.labTestResults.some((r: any) => r.stability40C === "UNSTABLE") ? "UNSTABLE" : "STABLE") : "N/A",
        updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString().split('T')[0] : "—",
        pic: f.lockedBy?.fullName || "—",
        sampleCode: f.sampleRequest?.sampleCode || "—",
        createdBy: f.lockedBy?.fullName || "—",
        releasedAt: f.updatedAt ? new Date(f.updatedAt).toISOString().split('T')[0] : "—",
        activeVersion: `v${f.version || 1}`,
      }));
    },
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Formula ID",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <FlaskConical className="h-3.5 w-3.5" />
            </span>
            <span className="text-[13px] font-medium text-slate-900">{row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Product Name",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="space-y-1">
            <p className="text-[13px] font-medium text-slate-900">{row.original.name}</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {row.original.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                {row.original.activeVersion}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Chemist",
        cell: ({ getValue }: { getValue: () => string }) => (
          <span className="text-[13px] text-slate-700">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "releasedAt",
        header: "Release Date",
        cell: ({ getValue }: { getValue: () => string }) => (
          <span className="text-[13px] text-slate-500">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }: { row: { original: any } }) => {
          const status = row.original.status;
          const tone = STATUS_TONE[status] ?? "neutral";
          return (
            <div className="flex items-center justify-center gap-2">
              <OperationalStatusBadge status={tone}>{status}</OperationalStatusBadge>
              {status === "RELEASED" && (
                <span
                  className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100"
                  title="Integrity Verified"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: () => (
          <div className="flex justify-end">
            <button type="button" className="operational-button is-secondary h-8 px-3 text-[11px]">
              Audit Trace
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <OperationalMigrationShell title="Arsip Formula" subtitle="Basis data formula produk yang telah disetujui">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-[11px] font-medium text-slate-400">Membuka arsip...</p>
        </div>
      </OperationalMigrationShell>
    );
  }

  return (
    <OperationalMigrationShell
      title="Arsip Formula"
      subtitle="Basis data formula produk yang telah disetujui"
      actions={
        <div className="flex gap-2">
          <button type="button" className="operational-button is-secondary">
            <Filter className="h-4 w-4" />
            <span>Filter Library</span>
          </button>
          <button type="button" className="operational-button is-primary">
            <span>Export Master List</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <OperationalField label="Cari">
          <input
            placeholder="Cari nama, ID, atau bahan aktif..."
            className="bg-white border border-slate-200 rounded-lg text-sm font-medium"
          />
        </OperationalField>

        {(!formulas || formulas.length === 0) ? (
          <OperationalPanel className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <FlaskConical className="h-12 w-12 text-slate-300" />
            <p className="text-[13px] font-medium text-slate-500">Belum ada formula terarsip</p>
            <p className="text-[11px] text-slate-400">Formula yang disetujui akan muncul di sini</p>
          </OperationalPanel>
        ) : (
          <OperationalDataTable
            data={formulas}
            columns={columns as any}
            getRowId={(row: any) => row.id}
            searchPlaceholder="Cari nama, ID, atau chemist..."
            emptyMessage="Belum ada formula terarsip"
          />
        )}

        <OperationalPanel className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-slate-900 leading-none mb-1.5">
                Integritas Akses Vault
              </h3>
              <p className="text-[11px] text-slate-500">
                Enkripsi aktif: AES-256. Semua percobaan akses tercatat di log audit sistem.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-500">Sinkron Database: Terverifikasi</span>
          </div>
        </OperationalPanel>
      </div>
    </OperationalMigrationShell>
  );
}
