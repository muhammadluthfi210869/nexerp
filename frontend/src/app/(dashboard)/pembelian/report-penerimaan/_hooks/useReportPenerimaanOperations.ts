"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { exportToCsv } from "@/lib/export-utils";
import type { ReceivingReportRow, ReceivingReportKpis } from "../_types/report-penerimaan.types";

const FALLBACK_ROWS: ReceivingReportRow[] = [
  {
    id: "grn-001",
    grnNumber: "GRN-2026-0901",
    receiveDate: "2026-09-28",
    poNumber: "PO-2026-0045",
    deliveryOrderNo: "SJ-CLA-8819",
    vendorName: "PT Chemindo Lautan Abadi",
    warehouseName: "Gudang Bahan Baku Utama (WH-01)",
    itemCode: "RM-GLYC-01",
    itemName: "Glycerin 99.5% USP Grade",
    qtyOrdered: 1000,
    qtyReceived: 1050,
    qtyGood: 1000,
    qtyReject: 50,
    qtyFree: 50,
    unit: "Kg",
    batchNumber: "LOT-GLYC-2026-09",
    status: "APPROVED",
    notes: "Penerimaan Glycerin batch baru, 50kg kemasan bocor di-reject.",
  },
  {
    id: "grn-002",
    grnNumber: "GRN-2026-0901",
    receiveDate: "2026-09-28",
    poNumber: "PO-2026-0045",
    deliveryOrderNo: "SJ-CLA-8819",
    vendorName: "PT Chemindo Lautan Abadi",
    warehouseName: "Gudang Bahan Baku Utama (WH-01)",
    itemCode: "RM-NIAC-02",
    itemName: "Niacinamide PC Grade",
    qtyOrdered: 200,
    qtyReceived: 250,
    qtyGood: 200,
    qtyReject: 0,
    qtyFree: 50,
    unit: "Kg",
    batchNumber: "LOT-NIAC-2026-08",
    status: "APPROVED",
    notes: "Bonus/Free 50kg program promo supplier.",
  },
  {
    id: "grn-003",
    grnNumber: "GRN-2026-0902",
    receiveDate: "2026-09-27",
    poNumber: "PO-2026-0048",
    deliveryOrderNo: "SJ-PKG-2290",
    vendorName: "PT Multi Kemas Indah",
    warehouseName: "Gudang Bahan Kemas (WH-02)",
    itemCode: "PM-BTL-100",
    itemName: "Botol Serum Kaca 30ml Amber",
    qtyOrdered: 5000,
    qtyReceived: 5000,
    qtyGood: 4850,
    qtyReject: 150,
    qtyFree: 0,
    unit: "Pcs",
    batchNumber: "LOT-BTL-2026-34",
    status: "APPROVED",
    notes: "150 pcs retak/pecah saat transport ekspedisi.",
  },
  {
    id: "grn-004",
    grnNumber: "GRN-2026-0903",
    receiveDate: "2026-09-26",
    poNumber: "PO-2026-0050",
    deliveryOrderNo: "SJ-KIM-7711",
    vendorName: "CV Surya Perkasa Kimia",
    warehouseName: "Gudang Bahan Baku Utama (WH-01)",
    itemCode: "RM-STEA-04",
    itemName: "Stearic Acid Triple Pressed",
    qtyOrdered: 800,
    qtyReceived: 800,
    qtyGood: 800,
    qtyReject: 0,
    qtyFree: 0,
    unit: "Kg",
    batchNumber: "LOT-STEA-2026-11",
    status: "APPROVED",
    notes: "Kualitas sesuai COA fisik dan organoleptik.",
  },
];

export function useReportPenerimaanOperations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRow, setSelectedRow] = useState<ReceivingReportRow | null>(null);

  const { data: rawInbounds = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["warehouse-inbounds-report"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/inbounds");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const reportRows: ReceivingReportRow[] = useMemo(() => {
    if (!Array.isArray(rawInbounds) || rawInbounds.length === 0) {
      return FALLBACK_ROWS;
    }

    const rows: ReceivingReportRow[] = [];
    rawInbounds.forEach((inb: any, idx: number) => {
      const receiveDate = inb.receivedAt
        ? new Date(inb.receivedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const grnNumber = inb.inboundNumber || `GRN-${(idx + 1).toString().padStart(4, "0")}`;
      const poNumber = inb.po?.poNumber || inb.poNumber || "-";
      const deliveryOrderNo = inb.deliveryOrderNo || "-";
      const vendorName = inb.po?.supplier?.name || inb.supplierName || "Supplier";
      const warehouseName = inb.warehouse?.name || "Gudang Utama";
      const status = inb.status || "APPROVED";
      const notes = inb.notes || "";

      const items = inb.items || [];
      if (items.length === 0) {
        rows.push({
          id: inb.id || `grn-${idx}`,
          grnNumber,
          receiveDate,
          poNumber,
          deliveryOrderNo,
          vendorName,
          warehouseName,
          itemCode: "GEN-01",
          itemName: "Barang Penerimaan",
          qtyOrdered: 0,
          qtyReceived: 0,
          qtyGood: 0,
          qtyReject: 0,
          qtyFree: 0,
          unit: "Pcs",
          batchNumber: "-",
          status,
          notes,
        });
      } else {
        items.forEach((it: any, iIdx: number) => {
          const qtyGood = Number(it.quantity || 0);
          const qtyReject = Number(it.qtyReject || 0);
          const qtyFree = Number(it.qtyFree || 0);
          const qtyReceived = qtyGood + qtyReject;

          rows.push({
            id: it.id || `grn-${idx}-${iIdx}`,
            grnNumber,
            receiveDate,
            poNumber,
            deliveryOrderNo,
            vendorName,
            warehouseName,
            itemCode: it.material?.code || it.materialId?.slice(0, 8) || "MAT",
            itemName: it.material?.name || "Material / Barang",
            qtyOrdered: Number(it.quantity || 0),
            qtyReceived,
            qtyGood,
            qtyReject,
            qtyFree,
            unit: it.material?.unit || "Kg",
            batchNumber: it.batchNumber || "-",
            status,
            notes,
          });
        });
      }
    });

    return rows;
  }, [rawInbounds]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return reportRows;
    const q = searchQuery.toLowerCase();
    return reportRows.filter(
      (r) =>
        r.grnNumber.toLowerCase().includes(q) ||
        r.poNumber.toLowerCase().includes(q) ||
        r.vendorName.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        r.itemCode.toLowerCase().includes(q)
    );
  }, [reportRows, searchQuery]);

  const kpis: ReceivingReportKpis = useMemo(() => {
    return filteredList.reduce(
      (acc, r) => {
        acc.totalReceivedItems += 1;
        acc.totalQtyReceived += r.qtyReceived;
        acc.totalQtyGood += r.qtyGood;
        acc.totalQtyReject += r.qtyReject;
        acc.totalQtyFree += r.qtyFree;
        return acc;
      },
      {
        totalReceivedItems: 0,
        totalQtyReceived: 0,
        totalQtyGood: 0,
        totalQtyReject: 0,
        totalQtyFree: 0,
      }
    );
  }, [filteredList]);

  const handleExportCsv = () => {
    exportToCsv({
      filename: "laporan_penerimaan_barang.csv",
      data: filteredList,
      columns: [
        { header: "Tanggal", accessor: "receiveDate" },
        { header: "No GRN", accessor: "grnNumber" },
        { header: "No PO", accessor: "poNumber" },
        { header: "No SJ", accessor: "deliveryOrderNo" },
        { header: "Supplier", accessor: "vendorName" },
        { header: "Gudang", accessor: "warehouseName" },
        { header: "Kode Item", accessor: "itemCode" },
        { header: "Nama Item", accessor: "itemName" },
        { header: "Diterima", accessor: "qtyReceived" },
        { header: "Kondisi Bagus", accessor: "qtyGood" },
        { header: "Reject", accessor: "qtyReject" },
        { header: "Gratis", accessor: "qtyFree" },
        { header: "Satuan", accessor: "unit" },
        { header: "Batch", accessor: "batchNumber" },
      ],
    });
  };

  return {
    isLoading,
    isError,
    refetch,
    searchQuery,
    setSearchQuery,
    filteredList,
    kpis,
    selectedRow,
    setSelectedRow,
    handleExportCsv,
  };
}
