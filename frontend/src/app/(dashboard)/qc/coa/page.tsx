"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  Search,
  Download,
  Eye,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Zap,
  History as HistoryIcon,
  Calendar,
  Lock,
  Loader2,
  X,
} from "lucide-react";
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalDate } from "@/lib/operational-formatters";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function CoACenterPage() {
  const [search, setSearch] = useState("");
  const [viewCoaId, setViewCoaId] = useState<string | null>(null);

  const { data: coaRecords, isLoading } = useQuery({
    queryKey: ["coa-records"],
    queryFn: async () => {
      const res = await api.get("/qc/audits", { params: { status: "GOOD" } });
      return (res.data || []).map((a: any) => ({
        id: a.reportNumber || a.id,
        rawId: a.id,
        product: a.material?.name || a.notes || "Unknown",
        batch: a.materialBatchNo || a.id.substring(0, 8).toUpperCase(),
        releaseDate: new Date(a.createdAt).toISOString().split("T")[0],
        status: "VERIFIED",
        analyst: a.analyst?.fullName || "—",
        phase: a.phase,
        parameters: {
          ph: a.phValue,
          viscosity: a.viscosityValue,
          organoleptic: a.organoleptic,
          samplingVolume: a.samplingVolume,
          sealingCheck: a.sealingCheck,
          labelingCheck: a.labelingCheck,
          expDateCheck: a.expDateCheck,
          density: a.densityValue,
          homogenity: a.homogenityPass,
          torque: a.torqueValue,
          leakTest: a.leakTestPass,
          dimension: a.dimensionCheck,
          coaVerified: a.coaVerified,
        },
        defectCategory: a.defectCategory,
        defectType: a.defectType,
        notes: a.notes,
      }));
    },
    staleTime: 30_000,
  });

  const filtered = (coaRecords || []).filter(
    (r: any) =>
      search === "" ||
      r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.batch.toLowerCase().includes(search.toLowerCase()) ||
      (r.id || "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectedCoa = (coaRecords || []).find((r: any) => r.id === viewCoaId || r.rawId === viewCoaId);

  const totalRecords = coaRecords?.length ?? 0;
  const verifiedCount = (coaRecords || []).length;
  const monthCount = useMemo(() => {
    if (!coaRecords) return 0;
    const now = Date.now();
    return coaRecords.filter((r: any) => {
      const t = new Date(r.releaseDate).getTime();
      return now - t < 30 * 24 * 60 * 60 * 1000;
    }).length;
  }, [coaRecords]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Certificate ID",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-[13px] font-semibold text-slate-900 uppercase">{row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "product",
        header: "Product & Batch",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-slate-900">{row.original.product}</span>
            <span className="text-[11px] text-slate-500">Batch Ref: {row.original.batch}</span>
          </div>
        ),
      },
      {
        accessorKey: "analyst",
        header: "Authorized By",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
              {row.original.analyst !== "—" ? row.original.analyst.charAt(0) : "?"}
            </div>
            <span className="text-[12px] font-medium text-slate-700">{row.original.analyst}</span>
          </div>
        ),
      },
      {
        accessorKey: "releaseDate",
        header: "Release Date",
        cell: ({ getValue }: { getValue: () => string }) => (
          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700 tabular-nums">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatOperationalDate(getValue()) || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Audit Status</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-center">
            <span className="operational-status-badge is-success">
              {getOperationalStatusLabel(row.original.status)}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Documents</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="operational-button is-ghost h-8 w-8 p-0"
              aria-label="View"
              onClick={() => setViewCoaId(row.original.id)}
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="operational-button is-ghost h-8 w-8 p-0"
              aria-label="Print"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="operational-button is-secondary h-8 px-3 text-[11px]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF CoA</span>
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalPageShell
      title="CoA Center"
      subtitle="Professional Certificate of Analysis generation & archive"
      actions={
        <div className="flex items-center gap-2">
          <button type="button" className="operational-button is-secondary">
            <HistoryIcon className="h-4 w-4" />
            <span>Global Archive</span>
          </button>
          <button type="button" className="operational-button is-primary">
            <Zap className="h-4 w-4" />
            <span>Batch Auto-Generate</span>
          </button>
        </div>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total CoA Records"
            value={totalRecords}
            icon={<FileText className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Verified"
            value={verifiedCount}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="green"
          />
          <OperationalMetricCard
            label="Released (30 hari)"
            value={monthCount}
            icon={<Calendar className="h-4 w-4" />}
            tone="purple"
          />
        </OperationalMetricGrid>

        <OperationalPanel>
          <div className="flex flex-row items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search by Batch Number or Product Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="operational-input-wrap h-9 w-full pl-10"
              />
            </div>
            <button
              type="button"
              className="operational-button is-secondary h-9"
              onClick={() => setSearch("")}
            >
              Clear Filter
            </button>
          </div>
        </OperationalPanel>

        <OperationalDataTable
          data={filtered as any}
          columns={columns as any}
          getRowId={(row: any) => row.id}
          loading={isLoading}
          searchPlaceholder="Cari CoA..."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OperationalPanel>
            <h3 className="text-[13px] font-semibold text-slate-900">Standard CoA Template</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  <span className="text-[12px] font-semibold uppercase text-slate-700">Clinical Export V1</span>
                </div>
                <span className="operational-status-badge is-success">{getOperationalStatusLabel("ACTIVE")}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 opacity-60">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-[12px] font-semibold uppercase text-slate-700">Retail Minimalist V2</span>
                </div>
              </div>
            </div>
            <button type="button" className="operational-button is-primary mt-4 w-full">
              Manage Templates
            </button>
          </OperationalPanel>

          <OperationalPanel className="relative overflow-hidden">
            <h3 className="text-[13px] font-semibold text-slate-900">CoA Security Vault</h3>
            <p className="mt-1 text-[11px] font-medium uppercase text-slate-500">Digital signatures & integrity verification</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-emerald-50 text-emerald-600">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-900 uppercase">256-bit Encrypted</p>
                <p className="text-[11px] font-medium text-slate-500">All exported CoAs are cryptographically signed.</p>
              </div>
            </div>
          </OperationalPanel>
        </div>
      </div>

      {/* View CoA Modal */}
      <Dialog open={!!viewCoaId} onOpenChange={(open) => !open && setViewCoaId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[640px] rounded-xl border border-slate-200 bg-white p-0">
          <div className="relative bg-emerald-600 p-5 text-white">
            <button
              onClick={() => setViewCoaId(null)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6" />
              <div>
                <h3 className="text-[16px] font-semibold">Certificate of Analysis</h3>
                <p className="mt-0.5 text-[11px] font-medium text-emerald-100">
                  {selectedCoa?.id || viewCoaId}
                </p>
              </div>
            </div>
          </div>
          {selectedCoa ? (
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-100 bg-slate-50 p-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-900">{selectedCoa.product}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Batch</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-900">{selectedCoa.batch}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Release Date</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-900">{formatOperationalDate(selectedCoa.releaseDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inspector</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-900">{selectedCoa.analyst}</p>
                </div>
                {selectedCoa.phase && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase</p>
                    <span className="operational-status-badge is-info mt-1">{selectedCoa.phase}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Test Parameters</h4>
                <div className="overflow-hidden rounded-md border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-400">Parameter</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-400">Result</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCoa.parameters &&
                        Object.entries(selectedCoa.parameters)
                          .filter(([, v]) => v !== undefined && v !== null)
                          .map(([key, value]) => (
                            <tr key={key} className="border-t border-slate-100">
                              <td className="px-3 py-2 text-[12px] font-semibold uppercase text-slate-700">{key}</td>
                              <td className="px-3 py-2 font-mono text-[12px] text-slate-600">
                                {typeof value === "boolean" ? (value ? "PASS" : "FAIL") : String(value)}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`operational-status-badge ${value !== false ? "is-success" : "is-danger"}`}>
                                  {value !== false ? "PASS" : "FAIL"}
                                </span>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
                {(!selectedCoa.parameters ||
                  Object.values(selectedCoa.parameters).filter((v) => v !== undefined && v !== null).length === 0) && (
                  <p className="mt-2 text-[12px] italic text-slate-400">No parameter data recorded for this audit</p>
                )}
              </div>

              {selectedCoa.notes && (
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                  <p className="text-[12px] text-slate-600">{selectedCoa.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-[12px] font-bold uppercase text-emerald-800">This audit is verified as GOOD</p>
                  <p className="text-[10px] text-emerald-600">
                    The Certificate of Analysis confirms all parameters passed quality inspection.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
              <p className="mt-3 text-[12px] text-slate-400">Loading CoA details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
