"use client";

import { useState, useEffect } from "react";

// Mock initial data based on the dashboard image
const INITIAL_GRANULAR_DATA = [
  {
    id: 1,
    customer: "Nex BEAUTY",
    npf: "NPF-2024-001",
    leadDate: "2024-05-15",
    daysRun: 45,
    notes: "Sampel v2 sudah disetujui, sedang menunggu konfirmasi PO final dari Owner Mandiri.",
    moq: "10,000 Pcs",
    omset: "Rp 250 Jt",
    rev1: { date: "2024-05-20", status: "APPRO..." },
    rev2: { date: "2024-06-01", status: "APPRO..." },
    hki: "PROGRESS",
    logo: "NOT STARTED",
    kms: "not started",
    dsn: "not started",
    val: "not started",
    nego: "DRAFT KONTRAK",
    negoProgress: 4,
    status: "DEAL",
    realisasi: "-",
    stage: "NEGOTIATION"
  },
  {
    id: 2,
    customer: "BEAUTY STORE HUB",
    npf: "NPF-2024-002",
    leadDate: "2024-06-10",
    daysRun: 12,
    notes: "Revisi sampel kedua masih belum cocok di ketebalan formula, chemist sedang ajust ulang.",
    moq: "5,000 Pcs",
    omset: "Rp 120 Jt",
    rev1: { date: "2024-06-15", status: "PENDING" },
    hki: "NOT STARTED",
    logo: "NOT STARTED",
    kms: "done",
    dsn: "progress",
    val: "not started",
    nego: "NEGO MOQ",
    negoProgress: 2,
    status: "PROCESS",
    realisasi: "-",
    stage: "SAMPLE_REQUESTED"
  }
];

export function useGranularData() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("granular_pipeline_mock");
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData(INITIAL_GRANULAR_DATA);
      localStorage.setItem("granular_pipeline_mock", JSON.stringify(INITIAL_GRANULAR_DATA));
    }
  }, []);

  const updateLead = (leadId: number, updates: any) => {
    const newData = data.map(l => l.id === leadId ? { ...l, ...updates } : l);
    setData(newData);
    localStorage.setItem("granular_pipeline_mock", JSON.stringify(newData));
    // Trigger storage event for other tabs/pages
    window.dispatchEvent(new Event("storage_sync"));
  };

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem("granular_pipeline_mock");
      if (saved) setData(JSON.parse(saved));
    };
    window.addEventListener("storage_sync", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("storage_sync", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  return { data, updateLead };
}

