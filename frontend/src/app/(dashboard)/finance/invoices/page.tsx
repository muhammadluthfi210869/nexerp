"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  UserCheck,
  CreditCard,
  Mail,
  Download,
  AlertTriangle,
  Zap,
  Eye,
  FileSpreadsheet
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import { FinalDocumentPdfButton } from "@/components/documents/FinalDocumentPdfButton";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
  source: string;
  type: string;
  clientName: string;
  brandName: string;
  items: any[];
}

export default function InvoicingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useDnaToast();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      return (resp.data || []).map((inv: any) => ({
        id: inv.invoiceNumber,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customerName || inv.so?.lead?.clientName || "Unknown",
        date: new Date(inv.issuedAt || inv.createdAt).toISOString().split("T")[0],
        dueDate: new Date(inv.dueDate).toISOString().split("T")[0],
        amount: Number(inv.amountDue || inv.totalAmount || 0),
        status: inv.status,
        source: inv.type === "DP" ? "DP Invoice" : "Final Invoice",
        type: inv.type,
        clientName: inv.customerName || inv.so?.lead?.clientName || "Unknown",
        brandName: inv.so?.brandName || "",
        items: inv.so?.items || [],
      }));
    },
  });

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <DnaBadge variant="success">Lunas (Paid)</DnaBadge>;
      case "OVERDUE":
        return <DnaBadge variant="critical">Jatuh Tempo</DnaBadge>;
      case "PARTIAL":
        return <DnaBadge variant="warning">Sebagian</DnaBadge>;
      default:
        return <DnaBadge variant="default">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Faktur Penjualan (Invoicing AR)"
        description="Penerbitan faktur tagihan pelanggan, penagihan uang muka DP, dan rekonsiliasi piutang dagang."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Accounts Receivable</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Laporan piutang diexport ke Excel")}
            >
              Export Ledger
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Zap className="w-4 h-4" />}
              onClick={() => toast.info("Fitur Batch Billing sedang disiapkan")}
            >
              Batch Billing
            </DnaButton>
          </div>
        }
      />

      {/* KPI Stats */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Piutang Berjalan"
          value="Rp 170.000.000"
          subtext="Rp 45.0M Overdue 14 Hari"
          icon={<CreditCard className="w-5 h-5 text-blue-600" />}
          variant="info"
        />
        <DnaStatCard
          label="Penerimaan Kas (MTD)"
          value="Rp 89.200.000"
          subtext="65% Target Penerimaan Bulan Ini"
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          variant="success"
        />
        <DnaStatCard
          label="Menunggu Verifikasi"
          value="4 Faktur"
          subtext="Persetujuan Direktur Keuangan"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          variant="warning"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery: searchTerm,
          onSearchChange: setSearchTerm,
          searchPlaceholder: "Cari No Invoice, Klien, Pelanggan...",
        }}
      >
        <DnaTable>
          <DnaTableHead>
            <tr>
              <DnaTh className="w-[140px]">No. Invoice</DnaTh>
              <DnaTh className="w-[110px]">Tgl Terbit</DnaTh>
              <DnaTh className="w-[110px]">Jatuh Tempo</DnaTh>
              <DnaTh>Klien & Brand</DnaTh>
              <DnaTh align="center" className="w-[130px]">Tipe Faktur</DnaTh>
              <DnaTh align="right" className="w-[140px]">Total Tagihan</DnaTh>
              <DnaTh align="center" className="w-[130px]">Status</DnaTh>
              <DnaTh align="right" className="w-[110px]">Aksi</DnaTh>
            </tr>
          </DnaTableHead>
          <DnaTableBody>
            {filteredInvoices.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={8} className="py-12 text-center text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada faktur tagihan yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredInvoices.map((inv) => (
                <DnaTableRow key={inv.id}>
                  {/* Kolom 1: No. Invoice */}
                  <DnaTd>
                    <DnaCell.Code value={inv.invoiceNumber} />
                  </DnaTd>

                  {/* Kolom 2: Tgl Terbit */}
                  <DnaTd className="text-slate-600 whitespace-nowrap">
                    {inv.date}
                  </DnaTd>

                  {/* Kolom 3: Jatuh Tempo */}
                  <DnaTd className="text-slate-600 whitespace-nowrap">
                    {inv.dueDate}
                  </DnaTd>

                  {/* Kolom 4: Klien & Brand */}
                  <DnaTd>
                    <DnaCell.DoubleText
                      primary={inv.customer}
                      secondary={inv.brandName ? `Brand: ${inv.brandName}` : "-"}
                    />
                  </DnaTd>

                  {/* Kolom 5: Tipe Faktur */}
                  <DnaTd align="center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {inv.source}
                    </span>
                  </DnaTd>

                  {/* Kolom 6: Total Tagihan */}
                  <DnaTd align="right">
                    <DnaCell.Currency value={inv.amount} />
                  </DnaTd>

                  {/* Kolom 7: Status */}
                  <DnaTd align="center">
                    {getStatusBadge(inv.status)}
                  </DnaTd>

                  {/* Kolom 8: Aksi */}
                  <DnaTd align="right">
                    <div className="flex items-center justify-end gap-1">
                      <FinalDocumentPdfButton
                        documentType={inv.type === "DP" ? "INVOICE_DP" : "INVOICE_FINAL"}
                        documentNumber={inv.invoiceNumber}
                        data={{
                          clientName: inv.clientName,
                          brandName: inv.brandName,
                          soNumber: inv.id,
                          amount: inv.amount,
                          items: inv.items,
                          dueDate: inv.dueDate,
                          notes: `${inv.source} for ${inv.clientName}`,
                        }}
                      />
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Mail className="w-3.5 h-3.5" />}
                        onClick={() => toast.success(`Email faktur dikirim ke ${inv.customer}`)}
                      />
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
