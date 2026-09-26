"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Mail,
  MessageSquare,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle,
} from "lucide-react";
import {
  DnaPageHeader,
  DashboardCard,
  DnaBadge,
  DnaButton,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { api } from "@/lib/api";

interface TemplateItem {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  format?: string;
  subject?: string;
  body?: string;
  channel?: string;
  active?: boolean;
}

export default function TemplatesPage() {
  const { toast } = useDnaToast();
  const [activeTab, setActiveTab] = useState<"DOCUMENTS" | "EMAIL" | "SMS">("DOCUMENTS");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async (tab: "DOCUMENTS" | "EMAIL" | "SMS") => {
    try {
      setLoading(true);
      let endpoint = "/templates";
      if (tab === "EMAIL") endpoint = "/email-templates";
      if (tab === "SMS") endpoint = "/sms-templates";

      const res = await api.get(endpoint);
      const data = res.data?.data || res.data || [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({
        title: "Gagal memuat template",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6 p-6">
      <DnaPageHeader
        title="Template Dokumen & Komunikasi"
        description="Kelola tata letak cetak PDF, naskah email transaksi, dan pesan otomatis WhatsApp."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pengaturan" },
          { label: "Template" },
        ]}
        actions={
          <DnaButton
            variant="outline"
            size="sm"
            onClick={() => fetchTemplates(activeTab)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Muat Ulang
          </DnaButton>
        }
      />

      <div className="flex items-center gap-2 border-b pb-2">
        <DnaButton
          variant={activeTab === "DOCUMENTS" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("DOCUMENTS")}
        >
          <FileText className="w-4 h-4 mr-2" />
          Dokumen Cetak & PDF
        </DnaButton>
        <DnaButton
          variant={activeTab === "EMAIL" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("EMAIL")}
        >
          <Mail className="w-4 h-4 mr-2" />
          Template Email
        </DnaButton>
        <DnaButton
          variant={activeTab === "SMS" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("SMS")}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Template WhatsApp / SMS
        </DnaButton>
      </div>

      <DashboardCard
        label={
          activeTab === "DOCUMENTS"
            ? "Katalog Template Dokumen Resmi"
            : activeTab === "EMAIL"
            ? "Template Email Transaksional"
            : "Template Pesan WhatsApp Otomatis"
        }
      >
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Memuat daftar template...
          </div>
        ) : templates.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Tidak ada template ditemukan pada kategori ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="px-4 py-3">Nama Template</DnaTh>
                  <DnaTh className="px-4 py-3">Kode / Tipe</DnaTh>
                  <DnaTh className="px-4 py-3">Kanal / Format</DnaTh>
                  <DnaTh className="px-4 py-3">Status</DnaTh>
                  <DnaTh className="px-4 py-3 text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {templates.map((t) => (
                  <DnaTableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                    <DnaTd className="px-4 py-3 font-medium text-foreground">
                      {t.name || t.title}
                      {t.subject && (
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                          Subjek: {t.subject}
                        </span>
                      )}
                      {t.body && (
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5 truncate max-w-md">
                          Isi: {t.body}
                        </span>
                      )}
                    </DnaTd>
                    <DnaTd className="px-4 py-3 tabular-nums text-xs">
                      {t.type || t.id}
                    </DnaTd>
                    <DnaTd className="px-4 py-3">
                      <DnaBadge variant="info">
                        {t.format || t.channel || "STANDARD"}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Aktif
                      </span>
                    </DnaTd>
                    <DnaTd className="px-4 py-3 text-right">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Preview Template",
                            description: `Template ${t.name || t.title} siap digunakan pada generator dokumen.`,
                          });
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
