"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  BookUser,
  FlaskConical,
  Package,
  RefreshCw,
  ArrowUpRight,
  ChevronDown,
  Loader2,
  Search,
  Users,
  Target,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import {
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
} from "@/components/operational";
import { OperationalPageShell } from "@/components/operational/OperationalUI";
import {
  MetricCard,
  CanonicalMetricGrid,
  DataTable,
  StatusBadge,
  mapStatus,
} from "@/components/canonical";
import type { ColumnDef } from "@tanstack/react-table";
import { StageConfirmDialog } from "@/components/bussdev/StageConfirmDialog";
import { SAMPLE_STAGES, PRODUCTION_STAGES } from "@/components/bussdev/pipeline-constants";
import { cn, formatCurrency } from "@/lib/utils";

// ── Buku Tamu Tab ──

function BukuTamuContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: guests = [] } = useQuery({
    queryKey: ["client-manager-guests"],
    queryFn: async () => {
      try { return (await api.get("/guests")).data ?? []; } catch { return []; }
    },
  });

  const { data: intakeLeads = [] } = useQuery({
    queryKey: ["bussdev-leads-group", "guest"],
    queryFn: async () => {
      try { return (await api.get<any[]>("/bussdev/leads/group/guest?mine=true")).data ?? []; } catch { return []; }
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (guestId: string) => api.post(`/bussdev/guest/${guestId}/convert`),
    onSuccess: () => {
      toast.success("Tamu berhasil dikonversi menjadi Sales Lead!");
      queryClient.invalidateQueries({ queryKey: ["client-manager-guests"] });
      queryClient.invalidateQueries({ queryKey: ["bussdev-leads-group"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal konversi"),
  });

  const merged = useMemo(
    () => [
      ...(guests as any[]).map((g: any) => ({
        id: g.id,
        type: "guest" as const,
        clientName: g.clientName,
        contactInfo: g.contactInfo,
        productInterest: g.productInterest,
        date: g.visitDate,
      })),
      ...(intakeLeads as any[]).map((l: any) => ({
        id: l.id,
        type: "lead" as const,
        clientName: l.clientName,
        contactInfo: l.contactInfo || "—",
        productInterest: l.productInterest,
        date: l.createdAt,
      })),
    ],
    [guests, intakeLeads],
  );

  const filtered = useMemo(
    () => merged.filter((item) =>
      item.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productInterest?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [merged, searchQuery],
  );

  const guestCount = (guests as any[]).length;
  const leadCount = (intakeLeads as any[]).length;
  const totalCount = merged.length;

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "source",
      header: "Sumber",
      accessorFn: (row) => row.type,
      cell: ({ getValue }) => {
        const t = getValue() as string;
        return (
          <StatusBadge variant={t === "guest" ? "warning" : "info"}>
            {t === "guest" ? "TAMU" : "INTAKE"}
          </StatusBadge>
        );
      },
    },
    {
      id: "name",
      header: "Nama",
      accessorKey: "clientName",
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-900">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      id: "contact",
      header: "Kontak",
      accessorKey: "contactInfo",
      cell: ({ getValue }) => (
        <span className="text-slate-600">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      id: "product",
      header: "Produk",
      accessorKey: "productInterest",
      cell: ({ getValue }) => (
        <span className="text-blue-600 font-medium">
          {(String(getValue() ?? "—")).toUpperCase()}
        </span>
      ),
    },
    {
      id: "date",
      header: "Tanggal",
      accessorFn: (row) => row.date,
      cell: ({ getValue }) => {
        const d = getValue() as string | undefined;
        return (
          <span className="tabular-nums text-slate-600">
            {d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
          </span>
        );
      },
    },
    {
      id: "action",
      header: () => <div className="text-right">Aksi</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        if (item.type === "guest") {
          return (
            <div className="text-right">
              <button
                type="button"
                onClick={() => convertMutation.mutate(item.id)}
                disabled={convertMutation.isPending}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowUpRight className="h-3 w-3" />
                Konversi
              </button>
            </div>
          );
        }
        return <span className="text-[11px] text-blue-600 font-medium">SUDAH LEAD</span>;
      },
    },
  ], [convertMutation]);

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Total Tamu" value={guestCount} helper="Buku Tamu" icon={<BookUser />} variant="info" />
        <MetricCard label="Total Lead" value={leadCount} helper="Sudah Intake" icon={<Users />} variant="neutral" />
        <MetricCard label="Gabungan" value={totalCount} helper="Gabung Tamu + Lead" icon={<Target />} variant="neutral" />
      </CanonicalMetricGrid>

      <DataTable
        title="Registry Tamu & Intake Lead"
        searchPlaceholder="Cari tamu / lead..."
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        enableSearch={false}
        emptyMessage="Belum ada tamu atau lead"
        emptyDescription="Tamu yang berkunjung akan muncul di sini setelah didaftarkan."
      />
    </div>
  );
}

// ── Sample Tab ──

function SampleContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [nextStage, setNextStage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: analytics } = useQuery({
    queryKey: ["bussdev-analytics", "sample"],
    queryFn: async () => {
      try { return (await api.get("/bussdev/analytics/sample")).data; } catch { return null; }
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["bussdev-leads-group", "sample"],
    queryFn: async () => {
      try { return (await api.get<any[]>("/bussdev/leads/group/sample?mine=true")).data ?? []; } catch { return []; }
    },
  });

  const filtered = useMemo(
    () => (leads as any[]).filter((l) =>
      l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.brandName?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [leads, searchQuery],
  );

  const activeSamples = analytics?.activeSamples ?? filtered.length;
  const sampleApproved = analytics?.sampleApproved ?? filtered.filter((l) => l.status === "APPROVED").length;
  const dealRate = analytics?.conversionToProd ?? 0;

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "client",
      header: "Client & Brand",
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div>
            <p className="text-[13px] font-medium text-slate-900">{o.clientName}</p>
            {o.brandName ? <p className="text-[11px] text-slate-500">{o.brandName}</p> : null}
          </div>
        );
      },
    },
    {
      id: "interest",
      header: "Interest",
      accessorKey: "productInterest",
      cell: ({ getValue }) => (
        <span className="text-blue-600 font-medium text-[12px]">
          {(String(getValue() ?? "—")).toUpperCase()}
        </span>
      ),
    },
    {
      id: "value",
      header: () => <div className="text-right">Est. Value</div>,
      accessorKey: "estimatedValue",
      cell: ({ getValue }) => (
        <span className="tabular-nums text-[13px] font-medium text-slate-900">
          {formatCurrency(Number(getValue() ?? 0))}
        </span>
      ),
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      accessorKey: "status",
      cell: ({ getValue }) => (
        <div className="text-center">
          <StatusBadge variant={mapStatus(getValue() as string)}>
            {String(getValue() ?? "—")}
          </StatusBadge>
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Sample Aktif" value={activeSamples} helper="Sedang di R&D" icon={<FlaskConical />} variant="warning" />
        <MetricCard label="Sample Approved" value={sampleApproved} helper="App. Rate" icon={<CheckCircle2 />} variant="success" />
        <MetricCard label="Deal Rate" value={`${dealRate}%`} helper="Sample → Deal" icon={<TrendingUp />} variant="info" />
      </CanonicalMetricGrid>

      <DataTable
        title="Sample Stream"
        searchPlaceholder="Cari brand / client..."
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        enableSearch={false}
        emptyMessage="Belum ada sample lead"
        emptyDescription="Lead yang masuk fase sample akan muncul di sini."
      />

      <StageConfirmDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        lead={selectedLead}
        targetStage={nextStage}
      />
    </div>
  );
}

// ── Production Tab ──

function ProductionContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading] = useState(false);

  const { data: analytics } = useQuery({
    queryKey: ["bussdev-analytics", "production"],
    queryFn: async () => {
      try { return (await api.get("/bussdev/analytics/production")).data; } catch { return null; }
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["bussdev-leads-group", "production"],
    queryFn: async () => {
      try { return (await api.get<any[]>("/bussdev/leads/group/production?mine=true")).data ?? []; } catch { return []; }
    },
  });

  const filtered = useMemo(
    () => (leads as any[]).filter((l) =>
      l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.brandName?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [leads, searchQuery],
  );

  const conversionRate = analytics?.conversionRate ?? 0;
  const onTime = analytics?.onTimeDelivery ?? "—";

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "client",
      header: "Client & Brand",
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div>
            <p className="text-[13px] font-medium text-slate-900">{o.clientName}</p>
            {o.brandName ? <p className="text-[11px] text-slate-500">{o.brandName}</p> : null}
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: ({ getValue }) => (
        <span className="text-slate-700">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      id: "moq",
      header: () => <div className="text-right">MOQ</div>,
      accessorKey: "moq",
      cell: ({ getValue }) => (
        <span className="tabular-nums text-[13px] font-medium text-slate-900">
          {Number(getValue() ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      accessorKey: "status",
      cell: ({ getValue }) => (
        <div className="text-center">
          <StatusBadge variant={mapStatus(getValue() as string)}>
            {String(getValue() ?? "—")}
          </StatusBadge>
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Conversion Rate" value={`${conversionRate}%`} helper="Leads → Deal" icon={<Target />} variant="success" />
        <MetricCard label="On-Time Delivery" value={onTime} helper="SLA Compliance" icon={<CheckCircle2 />} variant="info" />
        <MetricCard label="Total Lead" value={filtered.length} helper="Fase Produksi" icon={<Package />} variant="neutral" />
      </CanonicalMetricGrid>

      <DataTable
        title="Batch Stream"
        searchPlaceholder="Cari brand / client..."
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        enableSearch={false}
        loading={isLoading}
        emptyMessage="Belum ada production lead"
        emptyDescription="Lead yang masuk fase produksi akan muncul di sini."
      />
    </div>
  );
}

// ── Repeat Order Tab ──

const FU_CONFIG: Record<string, { label: string; variant: "default" | "warning" | "info" | "destructive" }> = {
  NOT_FOLLOWED_UP: { label: "Belum FU", variant: "default" },
  FU_1: { label: "FU 1", variant: "warning" },
  FU_2: { label: "FU 2", variant: "info" },
  FU_3: { label: "FU 3", variant: "destructive" },
};

function ROContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ["bussdev-leads-group", "ro"],
    queryFn: async () => {
      try { return (await api.get<any[]>("/bussdev/leads/group/ro?mine=true")).data ?? []; } catch { return []; }
    },
  });

  const updateFuMutation = useMutation({
    mutationFn: async ({ leadId, fuStatus }: { leadId: string; fuStatus: string }) => {
      return (await api.patch("/bussdev/lead/" + leadId + "/follow-up", { fuStatus })).data;
    },
    onSuccess: () => {
      toast.success("Status follow-up diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["bussdev-leads-group"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui status FU"),
  });

  const filtered = useMemo(
    () => (leads as any[]).filter((l) =>
      l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.brandName?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [leads, searchQuery],
  );

  const activeRo = filtered.filter((l) => l.orderCount > 0).length;
  const totalSpent = filtered.reduce((sum: number, l: any) => sum + Number(l.planOmset || l.estimatedValue || 0), 0);

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "client",
      header: "Brand & Client",
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div>
            <p className="text-[13px] font-medium text-slate-900">{o.clientName}</p>
            {o.brandName ? <p className="text-[11px] text-slate-500">({o.brandName})</p> : null}
          </div>
        );
      },
    },
    {
      id: "interest",
      header: "Interest",
      accessorKey: "productInterest",
      cell: ({ getValue }) => (
        <span className="text-blue-600 font-medium text-[12px]">
          {(String(getValue() ?? "—")).toUpperCase()}
        </span>
      ),
    },
    {
      id: "orders",
      header: () => <div className="text-center">Orders</div>,
      cell: ({ row }) => {
        const oc = row.original.orderCount || 0;
        return <span className="tabular-nums text-[13px] font-medium">{oc}x</span>;
      },
    },
    {
      id: "spent",
      header: () => <div className="text-right">Total Spent</div>,
      cell: ({ row }) => (
        <span className="tabular-nums text-[13px] font-medium text-slate-900">
          {formatCurrency(Number(row.original.planOmset || row.original.estimatedValue || 0))}
        </span>
      ),
    },
    {
      id: "loyalty",
      header: () => <div className="text-center">Loyalty</div>,
      cell: ({ row }) => {
        const oc = row.original.orderCount || 0;
        const level = oc >= 3 ? "GOLD" : oc >= 1 ? "SILVER" : "BRONZE";
        return (
          <div className="text-center">
            <StatusBadge variant={oc >= 3 ? "warning" : oc >= 1 ? "info" : "default"}>
              {level}
            </StatusBadge>
          </div>
        );
      },
    },
    {
      id: "fu",
      header: () => <div className="text-center">Follow Up</div>,
      cell: ({ row }) => {
        const fu = (row.original.fuStatus || "NOT_FOLLOWED_UP") as string;
        const cfg = FU_CONFIG[fu] ?? FU_CONFIG.NOT_FOLLOWED_UP;
        return (
          <div className="text-center">
            <StatusBadge variant={cfg.variant}>{cfg.label}</StatusBadge>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Active RO Clients" value={activeRo} helper="Repeat Order" icon={<RefreshCw />} variant="success" />
        <MetricCard label="Total Spent" value={formatCurrency(totalSpent)} helper="Akumulasi" icon={<DollarSign />} variant="info" />
        <MetricCard label="Avg / Client" value={activeRo > 0 ? formatCurrency(totalSpent / activeRo) : "—"} helper="Per Client" icon={<Target />} variant="neutral" />
      </CanonicalMetricGrid>

      <DataTable
        title="Analisis Loyalty Stream"
        searchPlaceholder="Cari partner VIP / brand..."
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        enableSearch={false}
        emptyMessage="Belum ada repeat order"
        emptyDescription="Lead yang sudah repeat order akan muncul di sini."
      />
    </div>
  );
}

// ── Main Client Manager Page ──

export default function ClientManagerPage() {
  const [tab, setTab] = useState("buku-tamu");

  return (
    <OperationalPageShell
      title="Client Manager"
      subtitle="Pipeline per fase: Buku Tamu → Sample → Produksi → Repeat Order"
    >
      <OperationalTabs value={tab} onValueChange={setTab}>
        <OperationalTabsList>
          <OperationalTabsTrigger value="buku-tamu">
            <BookUser className="h-4 w-4" />
            Buku Tamu
          </OperationalTabsTrigger>
          <OperationalTabsTrigger value="sample">
            <FlaskConical className="h-4 w-4" />
            Sample
          </OperationalTabsTrigger>
          <OperationalTabsTrigger value="produksi">
            <Package className="h-4 w-4" />
            Produksi
          </OperationalTabsTrigger>
          <OperationalTabsTrigger value="ro">
            <RefreshCw className="h-4 w-4" />
            Repeat Order
          </OperationalTabsTrigger>
        </OperationalTabsList>
        <OperationalTabsContent value="buku-tamu">
          <BukuTamuContent />
        </OperationalTabsContent>
        <OperationalTabsContent value="sample">
          <SampleContent />
        </OperationalTabsContent>
        <OperationalTabsContent value="produksi">
          <ProductionContent />
        </OperationalTabsContent>
        <OperationalTabsContent value="ro">
          <ROContent />
        </OperationalTabsContent>
      </OperationalTabs>
    </OperationalPageShell>
  );
}
