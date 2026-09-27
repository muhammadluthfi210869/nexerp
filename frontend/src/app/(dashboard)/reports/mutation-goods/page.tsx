"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowRightLeft,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";

interface MutationRecord {
  id: string;
  date: string;
  docNumber: string;
  type: string;
  materialName: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
  unit: string;
  notes: string;
}

const TYPE_LABEL: Record<string, string> = {
  INBOUND: "Masuk (Inbound)",
  OUTBOUND: "Keluar (Outbound)",
  INTERNAL_MOVE: "Mutasi Antar Gudang",
  ADJUSTMENT: "Penyesuaian Stok",
  DISPOSAL: "Pemusnahan",
  RETURN: "Retur Barang",
};

export default function ReportMutationGoodsPage() {
  const { toast } = useDnaToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports-mutation-goods"],
    queryFn: async () => {
      try {
        const res = await api.get("/reports/mutation-goods");
        return res.data;
      } catch {
        const res2 = await api.get("/warehouse/transactions");
        return res2.data;
      }
    },
  });

  // ponytail: running balance derived per material from the transaction list.
  // Ceiling: only the 100 most recent transactions the API returns.
  // Upgrade path: a per-material ledger endpoint (GET /warehouse/history/:materialId).
  const mutations: MutationRecord[] = useMemo(() => {
    const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    const ordered = [...raw].sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const running: Record<string, number> = {};
    const withBalance = ordered.map((t: any) => {
      const materialId = t.materialId || "UNKNOWN";
      const qty = Number(t.quantity ?? 0);
      const isOut =
        t.type === "OUTBOUND" || t.type === "DISPOSAL";
      running[materialId] = (running[materialId] ?? 0) + (isOut ? -qty : qty);
      return { t, balance: running[materialId] };
    });

    return withBalance
      .map(({ t, balance }) => {
        const qty = Number(t.quantity ?? 0);
        const isOut = t.type === "OUTBOUND" || t.type === "DISPOSAL";
        return {
          id: t.id,
          date: t.createdAt ? String(t.createdAt).split("T")[0] : "-",
          docNumber: t.referenceNo || "-",
          type: t.type || "UNKNOWN",
          materialName: t.material?.name || "-",
          qtyIn: isOut ? 0 : qty,
          qtyOut: isOut ? qty : 0,
          balance,
          unit: t.material?.unit || "",
          notes: t.notes || "-",
        };
      })
      .reverse();
  }, [data]);

  const typeOptions = useMemo(
    () => Array.from(new Set(mutations.map((m) => m.type))).sort(),
    [mutations],
  );

  const filteredData = mutations.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.docNumber.toLowerCase().includes(q) ||
      item.materialName.toLowerCase().includes(q) ||
      item.notes.toLowerCase().includes(q);
    const matchType = typeFilter === "ALL" || item.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalIn = filteredData.reduce((sum, m) => sum + m.qtyIn, 0);
  const totalOut = filteredData.reduce((sum, m) => sum + m.qtyOut, 0);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INBOUND":
        return <DnaBadge variant="success">{TYPE_LABEL[type]}</DnaBadge>;
      case "OUTBOUND":
      case "DISPOSAL":
        return <DnaBadge variant="critical">{TYPE_LABEL[type]}</DnaBadge>;
      case "INTERNAL_MOVE":
        return <DnaBadge variant="info">{TYPE_LABEL[type]}</DnaBadge>;
      case "ADJUSTMENT":
        return <DnaBadge variant="warning">{TYPE_LABEL[type]}</DnaBadge>;
      case "RETURN":
        return <DnaBadge variant="critical">{TYPE_LABEL[type]}</DnaBadge>;
      default:
        return <DnaBadge variant="default">{type}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="Laporan Mutasi Keluar & Masuk Barang"
        description="Buku jurnal riwayat pergerakan stok, transfer internal, penerimaan bahan, dan pengiriman barang jadi dari ledger transaksi gudang"
        actions={
          <DnaButton
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              toast({
                title: "Ekspor Mutasi Barang",
                description: "Mengunduh file Excel Laporan Mutasi Barang...",
                variant: "success"
              });
            }}
          >
            Ekspor Excel
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Transaksi Mutasi"
          value={filteredData.length.toString()}
          icon={<ArrowRightLeft className="w-5 h-5 text-indigo-600" />}
          variant="info"
          subtext="Pergerakan stok tercatat"
        />
        <DnaStatCard
          label="Total Kuantitas Masuk"
          value={totalIn.toLocaleString("id-ID")}
          icon={<ArrowDownRight className="w-5 h-5 text-emerald-600" />}
          variant="success"
          subtext="Inbound, retur & transfer masuk"
        />
        <DnaStatCard
          label="Total Kuantitas Keluar"
          value={totalOut.toLocaleString("id-ID")}
          icon={<ArrowUpRight className="w-5 h-5 text-rose-600" />}
          variant={totalOut > 0 ? "warning" : "default"}
          subtext="Outbound & pemakaian produksi"
        />
        <DnaStatCard
          label="Barang Bergerak"
          value={`${new Set(filteredData.map((m) => m.materialName)).size} Item`}
          icon={<RefreshCw className="w-5 h-5 text-blue-600" />}
          variant="info"
          subtext="Material unik dalam periode"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        toolbarProps={{
          searchQuery: searchTerm,
          onSearchChange: setSearchTerm,
          searchPlaceholder: "Cari no dokumen, nama barang, catatan...",
          extraActions: (
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Semua Tipe Transaksi</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t] || t}
                  </option>
                ))}
              </select>
            </div>
          ),
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="px-4 py-3 h-[40px] w-[110px]">Tanggal</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[150px]">No. Dokumen</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-center w-[170px]">Tipe Transaksi</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Barang</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Masuk</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Keluar</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[120px]">Saldo Berjalan</DnaTh>
                <DnaTh className="px-4 py-3 h-[40px]">Keterangan</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={8} className="py-12 text-center text-slate-400">
                    Memuat data mutasi barang...
                  </DnaTd>
                </DnaTableRow>
              ) : isError ? (
                <DnaTableRow>
                  <DnaTd colSpan={8} className="py-12 text-center">
                    <p className="text-rose-600 mb-3">Gagal memuat laporan mutasi barang dari server.</p>
                    <DnaButton variant="secondary" size="sm" onClick={() => refetch()}>
                      Coba Lagi
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ) : filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={8} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada transaksi mutasi sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item) => (
                  <DnaTableRow
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors group h-[48px]"
                  >
                    <DnaTd className="px-4 py-2 text-slate-600 whitespace-nowrap">
                      {item.date}
                    </DnaTd>

                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={item.docNumber} />
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-center">
                      {getTypeBadge(item.type)}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-slate-900 font-medium truncate max-w-[200px]">
                      {item.materialName}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      {item.qtyIn > 0 ? (
                        <span className="font-semibold text-emerald-700 tabular-nums text-[12px]">
                          +{item.qtyIn.toLocaleString("id-ID")} {item.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      {item.qtyOut > 0 ? (
                        <span className="font-semibold text-rose-700 tabular-nums text-[12px]">
                          -{item.qtyOut.toLocaleString("id-ID")} {item.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={item.balance}
                        unit={item.unit}
                      />
                    </DnaTd>

                    <DnaTd className="px-4 py-2 text-slate-600 truncate max-w-[200px]">
                      {item.notes}
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </div>
  );
}