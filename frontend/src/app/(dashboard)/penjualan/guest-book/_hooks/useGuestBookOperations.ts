"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useDnaToast } from "@/components/dna";
import { api } from "@/lib/api";
import type { GuestBookEntry, GuestBookFormData, GuestBookCategory } from "../_types/guest-book.types";

const INITIAL_FORM_DATA: GuestBookFormData = {
  clientName: "",
  instansi: "",
  phone: "",
  city: "Jakarta Selatan",
  productInterest: "Serum Retinol 30ml",
  moqPlan: "1000",
  targetMarket: "Wanita Dewasa",
  category: "BRANDED",
  busDev: "Irma Safarina",
};

const DRAFT_STORAGE_KEY = "nexerp_guest_book_draft";

export function useGuestBookOperations() {
  const toast = useDnaToast();
  const searchParams = useSearchParams();

  const [guests, setGuests] = useState<GuestBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<GuestBookEntry | null>(null);

  // Form input with auto-save draft
  const [formData, setFormData] = useState<GuestBookFormData>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          return { ...INITIAL_FORM_DATA, ...JSON.parse(savedDraft) };
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_FORM_DATA;
  });

  // Save draft whenever formData changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      } catch {
        // ignore quota errors
      }
    }
  }, [formData]);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any[]>("/guests");
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped: GuestBookEntry[] = data.map((item, idx) => ({
        id: item.id || `gb-${idx}`,
        no: idx + 1,
        dateTime: item.visitDate
          ? new Date(item.visitDate).toISOString().slice(0, 16).replace("T", " ")
          : new Date(item.createdAt || Date.now()).toISOString().slice(0, 16).replace("T", " "),
        clientName: item.clientName || "â€”",
        instansi: item.instansi || "â€”",
        meetingPic: item.bd?.fullName || item.meetingWith || item.busDev || "BusDev Maklon",
        contact: item.phoneNo || item.phone || "â€”",
        city: item.city || "Jakarta",
        productInterest: item.productInterest || "Produk Maklon",
        moq: item.moqPlan || item.moq || 1000,
        targetMarket: item.targetMarket || "Umum",
        category: (item.category as GuestBookCategory) || "BRANDED",
      }));
      setGuests(mapped);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat buku tamu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Unique cities for filter
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      if (g.city && g.city.trim()) {
        set.add(g.city.trim());
      }
    });
    return Array.from(set);
  }, [guests]);

  // Unique months for filter (format YYYY-MM)
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      if (g.dateTime) {
        const yyyymm = g.dateTime.slice(0, 7);
        if (yyyymm) set.add(yyyymm);
      }
    });
    return Array.from(set).sort().reverse();
  }, [guests]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        g.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.instansi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.productInterest.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.meetingPic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.contact.includes(searchQuery);

      const matchCategory = categoryFilter === "ALL" || g.category === categoryFilter;
      const matchCity = cityFilter === "ALL" || g.city.toLowerCase() === cityFilter.toLowerCase();
      const matchMonth = monthFilter === "ALL" || (g.dateTime && g.dateTime.startsWith(monthFilter));

      return matchSearch && matchCategory && matchCity && matchMonth;
    });
  }, [guests, searchQuery, categoryFilter, cityFilter, monthFilter]);

  const handleSave = async () => {
    if (!formData.clientName.trim() || !formData.phone.trim() || !formData.instansi.trim()) {
      toast.error("Mohon lengkapi nama klien, kontak WhatsApp, dan nama perusahaan/brand!");
      return;
    }

    setSaving(true);
    try {
      await api.post("/guests", {
        clientName: formData.clientName.trim(),
        instansi: formData.instansi.trim(),
        productInterest: formData.productInterest.trim() || undefined,
        moqPlan: parseInt(formData.moqPlan, 10) || 1000,
        category: formData.category,
        phoneNo: formData.phone.trim(),
        city: formData.city.trim(),
        targetMarket: formData.targetMarket.trim() || undefined,
        visitDate: new Date().toISOString(),
      });

      toast.success("Catatan kunjungan tamu berhasil disimpan!");
      setIsModalOpen(false);
      setFormData(INITIAL_FORM_DATA);
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      await fetchGuests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal menyimpan buku tamu");
    } finally {
      setSaving(false);
    }
  };

  const countAll = guests.length;
  const countBranded = guests.filter((g) => g.category === "BRANDED").length;
  const countKlinik = guests.filter((g) => g.category === "KLINIK").length;
  const countPemula = guests.filter((g) => g.category === "PEMULA").length;
  const countDistributor = guests.filter((g) => g.category === "DISTRIBUTOR").length;

  return {
    guests,
    loading,
    saving,
    error,
    categoryFilter,
    setCategoryFilter,
    cityFilter,
    setCityFilter,
    cityOptions,
    monthFilter,
    setMonthFilter,
    monthOptions,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    selectedGuest,
    setSelectedGuest,
    formData,
    setFormData,
    filteredGuests,
    fetchGuests,
    handleSave,
    countAll,
    countBranded,
    countKlinik,
    countPemula,
    countDistributor,
    toast,
  };
}

export type UseGuestBookOperationsReturn = ReturnType<typeof useGuestBookOperations>;
