"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Layers,
  PackageCheck,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Warehouse,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaTable,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  DnaModal,
  DnaInput,
  DnaCell,
  useDnaToast,
} from "@/components/dna";
import Link from "next/link";

interface MaterialRequisitionItem {
  id: string;
  code: string;
  date: string;
  spkCode: string;
  batchNumber: string;
  customerName: string;
  brandName: string;
  productName: string;
  requestType: "RAW_MATERIAL" | "PRIMARY_PACKAGING" | "SECONDARY_PACKAGING";
  totalItems: number;
  itemsSummary: string;
  sourceWarehouse: string;
  status: "DRAFT" | "SUBMITTED" | "PARTIALLY_ISSUED" | "FULLY_ISSUED";
  requestedBy: string;
  issuedBy?: string;
  notes?: string;
}

const TYPE_CONFIG: Record<string, { label: string; badge: "info" | "purple" | "warning" }> = {
  RAW_MATERIAL: { label: "Bahan Baku", badge: "info" },
  PRIMARY_PACKAGING: { label: "Kemas Primer", badge: "purple" },
  SECONDARY_PACKAGING: { label: "Kemas Sekunder", badge: "warning" },
};

const STATUS_CONFIG: Record<string, { label: string; badge: "default" | "warning" | "info" | "success" }> = {
  DRAFT: { label: "Draft SPB", badge: "default" },
  SUBMITTED: { label: "Diajukan", badge: "warning" },
  PARTIALLY_ISSUED: { label: "Sebagian", badge: "info" },
  FULLY_ISSUED: { label: "Selesai Rilis", badge: "success" },
};

export default function MaterialRequisitionPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailModalItem, setDetailModalItem] = useState<MaterialRequisitionItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Form states for Create SPB
  const [formSpk, setFormSpk] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formType, setFormType] = useState<"RAW_MATERIAL" | "PRIMARY_PACKAGING" | "SECONDARY_PACKAGING">("RAW_MATERIAL");
  const [formWarehouse, setFormWarehouse] = useState("WH-01 (Gudang Bahan Baku)");
  const [formItems, setFormItems] = useState("");
  const [formRequester, setFormRequester] = useState("Hendra Wijaya");
  const [formNotes, setFormNotes] = useState("");

  const { data: serverRequisitions, isLoading } = useQuery<MaterialRequisitionItem[]>({
    queryKey: ["production-material-requisitions"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/requisitions");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped.map((item: any, idx: number) => ({
            id: item.id || `spb-${idx}`,
            code: item.code || item.spbNumber || `SPB-PRD-2026-${String(idx + 1).padStart(4, "0")}`,
            date: item.date ? String(item.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            spkCode: item.spkCode || item.workOrder?.woNumber || "SPK-2026-0001",
            batchNumber: item.batchNumber || item.workOrder?.batchNumber || "BATCH-2026-0001",
            customerName: item.customerName || item.workOrder?.lead?.clientName || "PT Cantika Jelita",
            brandName: item.brandName || item.workOrder?.lead?.brandName || "GlowGoddess",
            productName: item.productName || item.workOrder?.lead?.productInterest || "Brightening Serum 30ml",
            requestType: (item.requestType || "RAW_MATERIAL") as MaterialRequisitionItem["requestType"],
            totalItems: Number(item.totalItems) || (Array.isArray(item.items) ? item.items.length : 3),
            itemsSummary: item.itemsSummary || (Array.isArray(item.items) ? item.items.map((i: any) => i.material?.name || i.materialName).filter(Boolean).join(", ") : "Niacinamide, Aqua, Glycerin"),
            sourceWarehouse: item.sourceWarehouse || "WH-01 (Gudang Bahan Baku)",
            status: (item.status || "SUBMITTED") as MaterialRequisitionItem["status"],
            requestedBy: item.requestedBy || "Hendra Wijaya",
            issuedBy: item.issuedBy || undefined,
            notes: item.notes || "",
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch requisitions", err);
      }
      return [];
    },
  });

  const [localRequisitions, setLocalRequisitions] = useState<MaterialRequisitionItem[]>([
    {
      id: "spb-demo-1",
      code: "SPB-PRD-2026-0001",
      date: "2026-09-02",
      spkCode: "SPK-2026-0043",
      batchNumber: "BATCH-890123",
      customerName: "PT Glow Skin Global",
      brandName: "Glow Skin",
      productName: "Acne Clarifying Serum 30ml",
      requestType: "RAW_MATERIAL",
      totalItems: 4,
      itemsSummary: "Centella Extract, Niacinamide, Aqua, Glycerin",
      sourceWarehouse: "WH-01 (Gudang Bahan Baku)",
      status: "SUBMITTED",
      requestedBy: "Hendra Wijaya",
      notes: "Prioritas batch utama.",
    },
    {
      id: "spb-demo-2",
      code: "SPB-PRD-2026-0002",
      date: "2026-09-03",
      spkCode: "SPK-2026-0044",
      batchNumber: "BATCH-890124",
      customerName: "CV Cantika Ayu",
      brandName: "Cantika Beauty",
      productName: "Hydrating Barrier Toner 100ml",
      requestType: "PRIMARY_PACKAGING",
      totalItems: 2,
      itemsSummary: "Botol Toner 100ml Doff, Cap Flip Top Gold",
      sourceWarehouse: "WH-02 (Gudang Kemas)",
      status: "FULLY_ISSUED",
      requestedBy: "Siti Rahma",
      notes: "Selesai ditimbang dan dirilis gudang.",
    },
  ]);

  const requisitions = useMemo(() => {
    return [...localRequisitions, ...(serverRequisitions || [])];
  }, [localRequisitions, serverRequisitions]);

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      if (selectedStatus !== "ALL" && r.status !== selectedStatus) return false;
      if (selectedType !== "ALL" && r.requestType !== selectedType) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = r.code.toLowerCase().includes(q);
        const matchSpk = r.spkCode.toLowerCase().includes(q);
        const matchBatch = r.batchNumber.toLowerCase().includes(q);
        const matchProduct = r.productName.toLowerCase().includes(q);
        const matchBrand = r.brandName.toLowerCase().includes(q);
        const matchCustomer = r.customerName.toLowerCase().includes(q);
        if (!matchCode && !matchSpk && !matchBatch && !matchProduct && !matchBrand && !matchCustomer) return false;
      }
      return true;
    });
  }, [requisitions, selectedStatus, selectedType, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequisitions.slice(start, start + pageSize);
  }, [filteredRequisitions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRequisitions.length / pageSize) || 1;

  const totalSubmitted = requisitions.filter((r) => r.status === "SUBMITTED").length;
  const totalIssued = requisitions.filter((r) => r.status === "FULLY_ISSUED").length;
  const rawMaterialReqs = requisitions.filter((r) => r.requestType === "RAW_MATERIAL").length;

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSpk || !formProduct) {
      toast.error("Validasi Gagal", "Harap lengkapi No. SPK dan nama produk.");
      return;
    }

    const newReq: MaterialRequisitionItem = {
      id: `spb-${Date.now()}`,
      code: `SPB-PRD-2026-${String(requisitions.length + 95).padStart(4, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      spkCode: formSpk,
      batchNumber: `BATCH-${String(Date.now()).slice(-6)}`,
      customerName: formCustomer || "Klien Internal",
      brandName: formBrand || "Aurora Glow",
      productName: formProduct,
      requestType: formType,
      totalItems: formItems.split(",").filter((i) => i.trim()).length || 1,
      itemsSummary: formItems || "Bahan Formulir Baru",
      sourceWarehouse: formWarehouse,
      status: "SUBMITTED",
      requestedBy: formRequester,
      notes: formNotes,
    };

    setLocalRequisitions((prev) => [newReq, ...prev]);
    setIsCreateModalOpen(false);
    setFormSpk("");
    setFormProduct("");
    setFormItems("");
    setFormNotes("");
    toast.success("SPB Berhasil Diterbitkan", `Surat Permintaan ${newReq.code} berhasil diajukan.`);
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. PAGE HEADER (CLEAN & BALANCED) ── */}
      <DnaPageHeader
        title="PERMINTAAN BAHAN BAKU & KEMAS (SPB)"
        badge={<DnaBadge variant="info">SPB FLOW</DnaBadge>}
        subtitle="Surat Permintaan Barang (SPB) terkait SPK aktif untuk alokasi penimbangan bahan baku & pengeluaran kemasan dari gudang"
      />

      {/* ── 02. CANONICAL CLEAN KPI CARDS (NO TINT, ONLY COLORED ICONS) ── */}
      <DnaKpiGrid
        cards={[
          {
            key: "MENUNGGU",
            title: "MENUNGGU PENGELUARAN",
            value: `${totalSubmitted} SPB`,
            subtext: "Antrian Pengambilan Gudang",
            icon: <Clock className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
          },
          {
            key: "RILIS",
            title: "TELAH DIKELUARKAN",
            value: `${totalIssued} SPB`,
            subtext: "Fulfillment 100% Lengkap",
            icon: <PackageCheck className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            key: "RAW",
            title: "PERMINTAAN BAHAN BAKU",
            value: `${rawMaterialReqs} SPB`,
            subtext: "WH-01 (Gudang Bahan)",
            icon: <Layers className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            key: "SHORTAGE",
            title: "STATUS DEFISIT / SHORTAGE",
            value: "0 Item",
            subtext: "Stok Bahan Mencukupi",
            icon: <CheckCircle2 className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
        ]}
      />

      {/* ── 03. MODULAR DATA TABLE CARD (ZERO-DISTANCE TOOLBAR + ATOMIC COLUMNS) ── */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari No. SPB, SPK, Produk, Brand, Pelanggan...",
          filterColumns: [
            {
              key: "status",
              label: "Status SPB",
              type: "select",
              options: ["SUBMITTED", "FULLY_ISSUED", "PARTIALLY_ISSUED", "DRAFT"],
            },
            {
              key: "type",
              label: "Tipe Bahan",
              type: "select",
              options: ["RAW_MATERIAL", "PRIMARY_PACKAGING", "SECONDARY_PACKAGING"],
            },
          ],
          selectedColumn: selectedStatus !== "ALL" ? "status" : "type",
          onSelectColumn: () => {},
          filterValue: selectedStatus !== "ALL" ? selectedStatus : selectedType,
          onFilterValueChange: (val) => {
            if (["SUBMITTED", "FULLY_ISSUED", "PARTIALLY_ISSUED", "DRAFT"].includes(val)) {
              setSelectedStatus(val);
              setSelectedType("ALL");
            } else if (["RAW_MATERIAL", "PRIMARY_PACKAGING", "SECONDARY_PACKAGING"].includes(val)) {
              setSelectedType(val);
              setSelectedStatus("ALL");
            } else {
              setSelectedStatus("ALL");
              setSelectedType("ALL");
            }
            setCurrentPage(1);
          },
          actionButton: {
            label: "Buat SPB Baru",
            onClick: () => setIsCreateModalOpen(true),
            icon: <Plus className="w-4 h-4" />,
          },
          extraActions: (
            <Link href="/warehouse/stok">
              <DnaButton variant="secondary" size="sm">
                <Warehouse className="w-3.5 h-3.5 mr-1.5" />
                Cek Stok Gudang
              </DnaButton>
            </Link>
          ),
        }}
        paginationProps={{
          currentPage,
          totalPages,
          totalEntries: filteredRequisitions.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      >
        <DnaTable className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
              <th className="p-3.5 w-10 text-slate-400 text-center">#</th>
              <th className="p-3.5 w-[160px]">NO. SPB</th>
              <th className="p-3.5 w-[110px]">TANGGAL</th>
              <th className="p-3.5 w-[140px]">NO. SPK</th>
              <th className="p-3.5 w-[130px]">NO. BATCH</th>
              <th className="p-3.5">PRODUK</th>
              <th className="p-3.5 w-[160px]">KLIEN / BRAND</th>
              <th className="p-3.5 w-[130px]">TIPE BAHAN</th>
              <th className="p-3.5 w-[150px]">PEMOHON</th>
              <th className="p-3.5 w-[120px]">STATUS</th>
              <th className="p-3.5 w-12 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400">
                  Tidak ada SPB yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const typeInfo = TYPE_CONFIG[item.requestType] || TYPE_CONFIG.RAW_MATERIAL;
                const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, badge: "default" };

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => {
                      setDetailModalItem(item);
                      setIsDetailDrawerOpen(true);
                    }}
                  >
                    <td className="p-3.5 text-center text-slate-400 font-mono text-[11px] tabular-nums">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="p-3.5">
                      <DnaCell.Code value={item.code} />
                    </td>
                    <td className="p-3.5">
                      <DnaCell.Date value={item.date} />
                    </td>
                    <td className="p-3.5 font-mono text-[11.5px] font-semibold text-blue-700">
                      {item.spkCode}
                    </td>
                    <td className="p-3.5 font-mono text-[11.5px] text-slate-600">
                      {item.batchNumber}
                    </td>
                    <td className="p-3.5">
                      <DnaCell.Text primary={item.productName} />
                    </td>
                    <td className="p-3.5">
                      <span className="text-[12px] font-medium text-slate-700">{item.customerName}</span>
                    </td>
                    <td className="p-3.5">
                      <DnaCell.Badge status={typeInfo.label} />
                    </td>
                    <td className="p-3.5">
                      <DnaCell.Avatar name={item.requestedBy} />
                    </td>
                    <td className="p-3.5">
                      <DnaCell.Badge status={statusInfo.label} />
                    </td>
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setDetailModalItem(item);
                          setIsDetailDrawerOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                        title="Lihat Detail SPB"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

      {/* ── 04. MODAL BUAT SPB BARU ── */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Surat Permintaan Barang (SPB) Produksi"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateRequisition}>
              Ajukan SPB
            </DnaButton>
          </div>
        }
      >
        <form onSubmit={handleCreateRequisition} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                No. SPK Terkait <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                placeholder="SPK-2026-0043"
                value={formSpk}
                onChange={(e) => setFormSpk(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Nama Produk <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                placeholder="Centella Soothing Cream"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Tipe Permintaan</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="RAW_MATERIAL">Bahan Baku (Aktif & Basis)</option>
                <option value="PRIMARY_PACKAGING">Bahan Kemas Primer (Botol/Jar)</option>
                <option value="SECONDARY_PACKAGING">Bahan Kemas Sekunder (Box/Segel)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Gudang Sumber</label>
              <DnaInput
                value={formWarehouse}
                onChange={(e) => setFormWarehouse(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Nama Klien / Pelanggan</label>
              <DnaInput
                placeholder="PT Cantika Jelita"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Nama Brand</label>
              <DnaInput
                placeholder="GlowGoddess"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Ringkasan Item Material (Pisahkan dengan koma)</label>
            <DnaInput
              placeholder="Centella Extract 5kg, Glycerin 10kg, Carbomer 2kg..."
              value={formItems}
              onChange={(e) => setFormItems(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Catatan Instruksi</label>
            <DnaInput
              placeholder="Instruksi penimbangan bejana atau ruang staging..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
        </form>
      </DnaModal>

      {/* ── 05. QUICK PEEK DRAWER ── */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={detailModalItem?.code || "Detail Permintaan Bahan"}
        subtitle={detailModalItem ? `${detailModalItem.productName} • ${detailModalItem.spkCode}` : undefined}
        badge={detailModalItem ? <DnaBadge variant={STATUS_CONFIG[detailModalItem.status]?.badge || "default"}>{STATUS_CONFIG[detailModalItem.status]?.label}</DnaBadge> : undefined}
        tabs={[
          {
            id: "summary",
            label: "Ringkasan SPB",
            content: detailModalItem ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-900">{detailModalItem.code}</span>
                    <span className="font-mono text-slate-500">{detailModalItem.date}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{detailModalItem.productName}</p>
                  <p className="text-slate-600">{detailModalItem.customerName} ({detailModalItem.brandName})</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Gudang Pengeluaran</span>
                    <p className="font-semibold text-slate-900">{detailModalItem.sourceWarehouse}</p>
                    <span className="text-[10px] text-slate-400">Tipe: {detailModalItem.requestType}</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Pemohon</span>
                    <p className="font-semibold text-slate-900">{detailModalItem.requestedBy}</p>
                    <span className="text-[10px] text-slate-400">Tim Produksi Pabrik</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700">Rincian Item Material:</span>
                  <p className="text-slate-800 leading-relaxed font-mono">{detailModalItem.itemsSummary}</p>
                </div>
              </div>
            ) : null,
          },
        ]}
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>
              Tutup
            </DnaButton>
            <Link href="/warehouse/stok">
              <DnaButton variant="primary">
                <Warehouse className="w-4 h-4 mr-1.5" />
                Cek Gudang
              </DnaButton>
            </Link>
          </div>
        }
      />
    </div>
  );
}
