"use client";

import React from "react";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DataCard } from "@/components/dna/DataCard";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { PageSection } from "@/components/dna/PageSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataSource {
  model: string;
  fields: string[];
}

interface ConfigField {
  name: string;
  type: string;
  description: string;
  default?: string;
}

type ColumnFormat = "currency" | "number" | "badge" | "text";

interface PreviewColumn {
  key: string;
  label: string;
  format?: ColumnFormat;
}

export interface AutomationShellProps {
  title: string;
  subtitle?: string;
  division: string;
  fase: number;
  dataReady: boolean;
  needsConfig?: boolean;
  isAI?: boolean;
  dataSources: readonly DataSource[];
  configFields?: readonly ConfigField[];
  previewData: readonly Record<string, any>[];
  previewColumns: readonly PreviewColumn[];
  children?: React.ReactNode;
  customTab?: { label: string; content: React.ReactNode };
}

const faseStatus: Record<number, "default" | "info" | "success" | "purple" | "warning" | "critical"> = {
  0: "default",
  1: "info",
  2: "success",
  3: "purple",
  4: "warning",
  5: "critical",
};

const badgeForValue = (val: string): "success" | "warning" | "critical" => {
  const v = String(val).toLowerCase();
  if (v === "aman" || v === "low" || v === "good" || v === "ready" || v === "excellent" || v === "✅") return "success";
  if (v === "warning" || v === "medium" || v === "below" || v === "warning" || v === "⚠️" || v === "stable") return "warning";
  return "critical";
};

export function AutomationShell({
  title, subtitle, division, fase, dataReady, needsConfig, isAI,
  dataSources, configFields, previewData, previewColumns, children, customTab,
}: AutomationShellProps) {
  const hasConfig = configFields && configFields.length > 0;

  return (
    <DashboardShell
      title={title}
      titleAccent={division}
      subtitle={subtitle || `Fase ${fase} · ${division} · ${dataReady ? "Data Ready" : "Needs Config"}`}
    >
      <div className="flex gap-2 mb-2 flex-wrap">
        <DnaBadge status={isAI ? "purple" : "success"}>
          {isAI ? "AI / Hybrid" : "Non-AI"}
        </DnaBadge>
        <DnaBadge status={dataReady ? "success" : "warning"}>
          {dataReady ? "Data Ready — No New Input" : "Needs Configuration"}
        </DnaBadge>
        <DnaBadge status={faseStatus[fase] || "info"}>Fase {fase}</DnaBadge>
        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{division}</Badge>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="how-it-works">
          <TabsList>
            <TabsTrigger value="how-it-works">Cara Kerja</TabsTrigger>
            <TabsTrigger value="data-source">Data Source</TabsTrigger>
            {hasConfig && <TabsTrigger value="config">Config</TabsTrigger>}
            <TabsTrigger value="preview">Preview</TabsTrigger>
            {customTab && <TabsTrigger value="custom">{customTab.label}</TabsTrigger>}
          </TabsList>

          <TabsContent value="how-it-works" className="mt-4">
            <Card>
              <CardContent className="p-8">
                {children && <div className="mb-6">{children}</div>}
                <PageSection title="Data Flow">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-6 rounded-2xl w-full">
                      {dataSources.slice(0, 3).map((ds, i) => (
                        <React.Fragment key={ds.model}>
                          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-[11px] font-bold text-slate-700">{ds.model}</p>
                          </div>
                          {i < Math.min(dataSources.length, 3) - 1 && (
                            <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                      <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-200 shadow-sm">
                        <p className="text-[11px] font-bold">{title}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl border border-blue-200 shadow-sm">
                        <p className="text-[11px] font-bold">Output / Notifikasi</p>
                      </div>
                    </div>
                  </div>
                </PageSection>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data-source" className="mt-4">
            <Card>
              <CardContent className="p-8">
                <p className="text-[13px] text-slate-600 mb-5">
                  Automation ini menggunakan data yang <strong>sudah ada</strong> di database saat ini.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model / Table</TableHead>
                      <TableHead>Fields Digunakan</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataSources.map((ds) => (
                      <TableRow key={ds.model}>
                        <TableCell className="font-mono text-[13px] font-semibold">{ds.model}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {ds.fields.map((f) => (
                              <Badge key={f} variant="secondary" className="text-[10px] font-mono">{f}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DnaBadge status="success">EXISTS</DnaBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {hasConfig && (
            <TabsContent value="config" className="mt-4">
              <Card>
                <CardContent className="p-8">
                  <p className="text-[13px] text-slate-600 mb-5">
                    Konfigurasi minimal yang perlu disetel (satu kali):
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Deskripsi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configFields.map((cf) => (
                        <TableRow key={cf.name}>
                          <TableCell className="font-mono font-semibold">{cf.name}</TableCell>
                          <TableCell><Badge variant="outline" className="font-mono">{cf.type}</Badge></TableCell>
                          <TableCell className="font-mono text-slate-500">{cf.default || "-"}</TableCell>
                          <TableCell className="text-[13px]">{cf.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="p-8">
                <p className="text-[13px] text-slate-600 mb-5">
                  Preview hasil output automation (mock data):
                </p>
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {previewColumns.map((col) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={previewColumns.length} className="text-center py-8 text-slate-400">
                            Belum ada data preview
                          </TableCell>
                        </TableRow>
                      ) : (
                        previewData.map((row, i) => (
                          <TableRow key={i}>
                            {previewColumns.map((col) => (
                              <TableCell key={col.key}>
                                {col.format === "currency"
                                  ? `Rp ${Number(row[col.key]).toLocaleString("id-ID")}`
                                  : col.format === "number"
                                  ? Number(row[col.key]).toLocaleString("id-ID")
                                  : col.format === "badge"
                                  ? <DnaBadge status={badgeForValue(String(row[col.key]))}>{String(row[col.key])}</DnaBadge>
                                  : String(row[col.key])
                                }
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {customTab && (
            <TabsContent value="custom" className="mt-4">
              <Card>
                <CardContent className="p-8">{customTab.content}</CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <DataCard>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-amber-800 mb-1">Backend Integration</p>
            <p className="text-[12px] text-amber-700 leading-relaxed">
              <strong>Prototype:</strong> Saat ini pakai mock data. Untuk production, ganti data static
              dengan panggilan API via <code className="bg-amber-100 px-1 rounded">react-query</code>.
              Backend logic sudah siap — data sudah ada di model yang tercantum di tab "Data Source".
            </p>
          </div>
        </div>
      </DataCard>
    </DashboardShell>
  );
}
