"use client";

import React from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { DnaButton } from "@/components/dna";

interface DocumentPdfButtonProps {
  draftId: string;
  draftNumber: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function DocumentPdfButton({
  draftId,
  draftNumber,
  variant = "outline",
  size = "sm",
}: DocumentPdfButtonProps) {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get(
        `/document-automation/drafts/${draftId}/pdf`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${draftNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download failed:", error);
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
        downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )
      }
    >
      {downloading ? "Generating..." : "PDF"}
    </DnaButton>
  );
}
