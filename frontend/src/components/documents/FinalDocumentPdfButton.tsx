"use client";

import React from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { DnaButton } from "@/components/dna";
import { toast } from "sonner";

interface FinalDocumentPdfButtonProps {
  documentType: string;
  documentNumber: string;
  data: Record<string, any>;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
  showIcon?: boolean;
}

export function FinalDocumentPdfButton({
  documentType,
  documentNumber,
  data,
  variant = "outline",
  size = "sm",
  label,
  showIcon = true,
}: FinalDocumentPdfButtonProps) {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.post(
        "/document-automation/pdf",
        {
          documentType,
          documentNumber,
          data,
        },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${documentNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download failed:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DnaButton
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={downloading}
      icon={
        showIcon ? (
          downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Printer className="h-3.5 w-3.5" />
          )
        ) : undefined
      }
    >
      {downloading ? "Generating..." : label || "Print PDF"}
    </DnaButton>
  );
}
