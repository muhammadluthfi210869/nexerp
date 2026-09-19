"use client";

/**
 * Master Pengguna & Personel — Unified Enterprise Data Hub
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 47-50)
 * dan MASTER_DATA/USERS.csv.
 *
 * Visual DNA Golden Reference Architecture:
 * - 0 raw @/components/ui imports (Strict ADR-007)
 * - Light Enterprise Theme: bg-[#F8FAFC]
 * - DnaPageHeader with integrated 2 tabs (Daftar Pengguna & Personel, Hak Akses & Role)
 * - DnaKpiGrid with 4 interactive KPI metric cards
 * - DnaDataTableCard with 2-level filter toolbar + sorting & pagination
 * - Standardized cells: DnaCell.Code, DnaCell.Text, DnaCell.Badge, DnaCell.Avatar, DnaCell.Actions
 * - Clean DnaModal dialogs for View, Edit, and Create
 */

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  Plus,
  Briefcase,
  Building2,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  Phone,
  Shield,
  UserCheck,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaConfirmDialog,
  DnaCell,
  useDnaToast,
} from "@/components/dna";

// ── Types ──
export interface MasterUserItem {
  id: string;
  kodeNip: string;
  nama: string;
  email: string;
  phone: string;
  hakAkses: string;
  divisi: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface MasterRoleItem {
  id: string;
  kodeRole: string;
  namaRole: string;
  levelOtoritas: "Executive / Super" | "Department Head" | "Operational Staff" | "Read Only";
  deskripsi: string;
  totalPengguna: number;
}

// ── Seed Data from USERS.csv ──
export function PersonnelRegistry() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "roles" ? "roles" : "users"
  );

  useEffect(() => {
    if (tabParam === "roles" || tabParam === "users") {
      setActiveTab(tabParam);
    }
    if (searchParams.get("action") === "create") {
      handleOpenCreateUser();
    }
  }, [tabParam, searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/master/personnel?tab=${tabId}`);
  };

  // ── States ──
  const [usersList, setUsersList] = useState<MasterUserItem[]>([]);
  const [rolesList, setRolesList] = useState<MasterRoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  const loadPersonnelData = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const [uRes, rRes] = await Promise.all([
        fetch("/api/v1/users").then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          return r.json();
        }),
        fetch("/api/v1/roles").then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          return r.json();
        }),
      ]);

      const rawUsers = Array.isArray(uRes) ? uRes : uRes?.items || [];
      const items: MasterUserItem[] = rawUsers.map((u: any, idx: number) => ({
        id: u.id,
        kodeNip: u.kodeNip || String(idx + 1).padStart(3, "0"),
        nama: u.fullName || u.nama || u.email,
        email: u.email,
        phone: u.phone || "-",
        hakAkses: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : (u.hakAkses || "SCM"),
        divisi: u.division || u.divisi || "Commercial / Sales",
        status: u.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      }));
      setUsersList(items);

      const rawRoles = Array.isArray(rRes) ? rRes : [];
      const roles: MasterRoleItem[] = rawRoles.map((r: any, idx: number) => ({
        id: r.id || `r-${idx}`,
        kodeRole: r.slug || r.kodeRole || r.name,
        namaRole: r.name || r.namaRole,
        levelOtoritas: r.permissions?.includes("*") ? "Executive / Super" : "Operational Staff",
        deskripsi: r.description || r.deskripsi || "Hak akses operasional modul",
        totalPengguna: items.filter((u) => u.hakAkses === (r.slug || r.name)).length,
      }));
      setRolesList(roles);
    } catch (err: any) {
      setErrorState(err.message || "Gagal memuat data personil dari server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPersonnelData();
  }, []);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string>("ALL");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>("divisi");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<MasterUserItem | null>(null);
  const [editingUser, setEditingUser] = useState<MasterUserItem | null>(null);
  const [userToDelete, setUserToDelete] = useState<MasterUserItem | null>(null);

  // Form User
  const [userForm, setUserForm] = useState({
    kodeNip: "",
    nama: "",
    email: "",
    phone: "",
    hakAkses: "Business Development",
    divisi: "Commercial / Sales",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // ── Stats ──
  const totalUsers = usersList.length;
  const activeCommercial = usersList.filter((u) => u.divisi.includes("Commercial")).length;
  const activeProduction = usersList.filter((u) => u.divisi.includes("Produksi") || u.divisi.includes("Gudang")).length;
  const activeRnd = usersList.filter((u) => u.divisi.includes("R&D")).length;

  // ── Filtered & Sorted Users Pipeline ──
  const filteredUsers = useMemo(() => {
    return usersList
      .filter((item) => {
        // 1. KPI Filter
        if (selectedKpiFilter === "Commercial" && !item.divisi.includes("Commercial")) return false;
        if (selectedKpiFilter === "Produksi" && !item.divisi.includes("Produksi") && !item.divisi.includes("Gudang")) return false;
        if (selectedKpiFilter === "R&D" && !item.divisi.includes("R&D")) return false;

        // 2. Toolbar Filter
        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "divisi" && !item.divisi.includes(filterColumnValue)) {
            return false;
          }
          if (selectedFilterColumn === "role" && item.hakAkses !== filterColumnValue) {
            return false;
          }
          if (selectedFilterColumn === "status" && item.status !== filterColumnValue) {
            return false;
          }
        }

        // 3. Global Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = item.kodeNip.toLowerCase().includes(q);
          const matchName = item.nama.toLowerCase().includes(q);
          const matchEmail = item.email.toLowerCase().includes(q);
          const matchDivisi = item.divisi.toLowerCase().includes(q);
          const matchAkses = item.hakAkses.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchEmail && !matchDivisi && !matchAkses) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortColumn) return 0;
        const dir = sortDirection === "asc" ? 1 : -1;
        switch (sortColumn) {
          case "kodeNip":
            return dir * a.kodeNip.localeCompare(b.kodeNip);
          case "nama":
            return dir * a.nama.localeCompare(b.nama);
          case "email":
            return dir * a.email.localeCompare(b.email);
          case "divisi":
            return dir * a.divisi.localeCompare(b.divisi);
          case "hakAkses":
            return dir * a.hakAkses.localeCompare(b.hakAkses);
          case "status":
            return dir * a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
  }, [
    usersList,
    selectedKpiFilter,
    selectedFilterColumn,
    filterColumnValue,
    searchQuery,
    sortColumn,
    sortDirection,
  ]);

  // Pagination Slice
  const totalEntries = filteredUsers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // ── Selection Handlers ──
  const toggleSelectAll = () => {
    if (selectedRowIds.length === paginatedUsers.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(paginatedUsers.map((u) => u.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ── Sort Toggle ──
  const handleHeaderSortToggle = (col: string) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  // ── KPI Click Filter Toggle ──
  const handleKpiClick = (filterKey: string) => {
    setSelectedKpiFilter((prev) => (prev === filterKey ? "ALL" : filterKey));
    setCurrentPage(1);
  };

  // ── Modal Handlers ──
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      kodeNip: String(usersList.length + 1).padStart(3, "0"),
      nama: "",
      email: "",
      phone: "",
      hakAkses: "Business Development",
      divisi: "Commercial / Sales",
      status: "ACTIVE",
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (item: MasterUserItem) => {
    setEditingUser(item);
    setUserForm({
      kodeNip: item.kodeNip,
      nama: item.nama,
      email: item.email,
      phone: item.phone,
      hakAkses: item.hakAkses,
      divisi: item.divisi,
      status: item.status,
    });
    setIsUserModalOpen(true);
  };

  const handleOpenViewUser = (item: MasterUserItem) => {
    setViewingUser(item);
    setIsDetailModalOpen(true);
  };

  const handleSaveUser = () => {
    if (!userForm.nama.trim() || !userForm.kodeNip.trim() || !userForm.email.trim()) {
      toast.error("Nama lengkap, NIP, dan email korporat wajib diisi!");
      return;
    }

    if (editingUser) {
      setUsersList((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...userForm } : u))
      );
      toast.success(`Data personil ${userForm.nama} (NIP ${userForm.kodeNip}) berhasil diperbarui.`);
    } else {
      const newItem: MasterUserItem = {
        id: `u-${Date.now()}`,
        ...userForm,
      };
      setUsersList((prev) => [...prev, newItem]);
      toast.success(`Personil baru ${newItem.nama} berhasil didaftarkan.`);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
    toast.success(`Akun ${userToDelete.nama} berhasil dinonaktifkan / dihapus.`);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. MODULAR PAGE HEADER ── */}
      <DnaPageHeader
        backLink={{ href: "/master", label: "Kembali ke Master Hub" }}
        title="MASTER DATA PENGGUNA & PERSONEL"
        tabs={[
          {
            key: "users",
            label: "Daftar Pengguna & Personel",
            count: usersList.length,
            icon: <Users className="w-3.5 h-3.5" />,
          },
          {
            key: "roles",
            label: "Hak Akses & Role",
            count: rolesList.length,
            icon: <ShieldCheck className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* ── TAB 1: DAFTAR PENGGUNA ── */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* ── 02. MODULAR 4 KPI METRIC CARDS ── */}
          <DnaKpiGrid
            cards={[
              {
                key: "ALL",
                title: "TOTAL PERSONEL AKTIF",
                value: totalUsers.toLocaleString("id-ID"),
                subtext: "Karyawan & akun terotorisasi sistem",
                icon: <Users className="w-4 h-4" />,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                isSelected: selectedKpiFilter === "ALL",
                onClick: () => handleKpiClick("ALL"),
              },
              {
                key: "Commercial",
                title: "COMMERCIAL / SALES",
                value: activeCommercial.toLocaleString("id-ID"),
                subtext: "Frontliner sales & pipeline CRM klien",
                icon: <Briefcase className="w-4 h-4" />,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                isSelected: selectedKpiFilter === "Commercial",
                onClick: () => handleKpiClick("Commercial"),
              },
              {
                key: "Produksi",
                title: "OPERASIONAL & PABRIK",
                value: activeProduction.toLocaleString("id-ID"),
                subtext: "Produksi mixing, filling, dan gudang",
                icon: <Building2 className="w-4 h-4" />,
                iconBg: "bg-cyan-50",
                iconColor: "text-cyan-600",
                isSelected: selectedKpiFilter === "Produksi",
                onClick: () => handleKpiClick("Produksi"),
              },
              {
                key: "R&D",
                title: "LABORATORIUM (R&D)",
                value: activeRnd.toLocaleString("id-ID"),
                subtext: "Formulator kosmetik & analis mutu",
                icon: <Sparkles className="w-4 h-4" />,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                isSelected: selectedKpiFilter === "R&D",
                onClick: () => handleKpiClick("R&D"),
              },
            ]}
          />

          {/* ── 03. MODULAR DATA TABLE CARD ── */}
          <DnaDataTableCard
            toolbarProps={{
              searchQuery,
              onSearchChange: setSearchQuery,
              searchPlaceholder: "Cari NIP, nama personel, email, divisi, role...",
              filterColumns: [
                {
                  key: "divisi",
                  label: "Departemen / Divisi",
                  type: "select",
                  options: [
                    "Commercial / Sales",
                    "Produksi",
                    "Gudang & Logistik",
                    "R&D / QC Laboratory",
                    "SCM & Purchasing",
                    "Finance & Tax",
                    "Human Resource",
                    "Executive / Management",
                  ],
                },
                {
                  key: "status",
                  label: "Status Akun",
                  type: "select",
                  options: ["ACTIVE", "INACTIVE"],
                },
              ],
              selectedColumn: selectedFilterColumn,
              onSelectColumn: (col) => {
                setSelectedFilterColumn(col);
                setFilterColumnValue("ALL");
              },
              filterValue: filterColumnValue,
              onFilterValueChange: setFilterColumnValue,
              actionButton: {
                label: "Tambah Pengguna",
                onClick: handleOpenCreateUser,
              },
            }}
            paginationProps={{
              currentPage,
              totalPages,
              totalEntries,
              pageSize,
              onPageChange: setCurrentPage,
            }}
          >
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                  {/* Select All Checkbox */}
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedUsers.length > 0 && selectedRowIds.length === paginatedUsers.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 w-10 text-slate-400">#</th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[100px]"
                    onClick={() => handleHeaderSortToggle("kodeNip")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>NIP / KODE</span>
                      {sortColumn === "kodeNip" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[240px]"
                    onClick={() => handleHeaderSortToggle("nama")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>NAMA LENGKAP & EMAIL</span>
                      {sortColumn === "nama" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[170px]"
                    onClick={() => handleHeaderSortToggle("divisi")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>DIVISI / DEPARTEMEN</span>
                      {sortColumn === "divisi" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[180px]"
                    onClick={() => handleHeaderSortToggle("hakAkses")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>HAK AKSES / PERAN</span>
                      {sortColumn === "hakAkses" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 min-w-[130px]">TELEPON / WA</th>
                  <th
                    className="p-3.5 text-center cursor-pointer hover:bg-slate-100/60 min-w-[90px]"
                    onClick={() => handleHeaderSortToggle("status")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>STATUS</span>
                      {sortColumn === "status" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-right w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                      Memuat data personil...
                    </td>
                  </tr>
                ) : errorState ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-rose-500 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <span>{errorState}</span>
                        <DnaButton size="sm" variant="secondary" onClick={loadPersonnelData}>
                          Coba Lagi
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                      Tidak ada personel yang sesuai filter pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u, idx) => {
                    const isSelected = selectedRowIds.includes(u.id);
                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isSelected ? "bg-blue-50/40" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(u.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        {/* Number */}
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {/* NIP */}
                        <td className="p-3.5">
                          <DnaCell.Code value={u.kodeNip} onClick={() => handleOpenViewUser(u)} />
                        </td>
                        {/* Nama & Email (Avatar Cell) */}
                        <td className="p-3.5">
                          <DnaCell.Avatar
                            name={u.nama}
                            subtext={u.email}
                          />
                        </td>
                        {/* Divisi */}
                        <td className="p-3.5">
                          <DnaCell.Text primary={u.divisi} />
                        </td>
                        {/* Hak Akses / Peran */}
                        <td className="p-3.5">
                          <DnaCell.Badge
                            label={u.hakAkses}
                            status={
                              u.hakAkses.includes("Admin")
                                ? "blue"
                                : u.hakAkses.includes("Head")
                                ? "orange"
                                : u.hakAkses.includes("Lead")
                                ? "purple"
                                : "slate"
                            }
                          />
                        </td>
                        {/* Telepon */}
                        <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                          {u.phone}
                        </td>
                        {/* Status */}
                        <td className="p-3.5 text-center">
                          <DnaCell.Badge
                            label={u.status}
                            status={u.status === "ACTIVE" ? "success" : "slate"}
                          />
                        </td>
                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <DnaCell.Actions
                            onView={() => handleOpenViewUser(u)}
                            onEdit={() => handleOpenEditUser(u)}
                            onDelete={() => setUserToDelete(u)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── TAB 2: HAK AKSES & ROLE ── */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <DnaDataTableCard
            toolbarProps={{
              searchQuery: "",
              onSearchChange: () => {},
              searchPlaceholder: "Cari hak akses...",
              filterColumns: [],
              selectedColumn: "",
              onSelectColumn: () => {},
              filterValue: "ALL",
              onFilterValueChange: () => {},
            }}
          >
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                  <th className="p-3.5 w-10 text-slate-400">#</th>
                  <th className="p-3.5 min-w-[130px]">KODE ROLE</th>
                  <th className="p-3.5 min-w-[220px]">NAMA HAK AKSES</th>
                  <th className="p-3.5 min-w-[180px]">TINGKAT OTORITAS</th>
                  <th className="p-3.5 min-w-[320px]">DESKRIPSI & RUANG LINGKUP</th>
                  <th className="p-3.5 text-center min-w-[110px]">TOTAL PENGGUNA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rolesList.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="p-3.5">
                      <DnaCell.Code value={r.kodeRole} />
                    </td>
                    <td className="p-3.5">
                      <DnaCell.Text primary={r.namaRole} />
                    </td>
                    <td className="p-3.5">
                      <DnaCell.Badge
                        label={r.levelOtoritas}
                        status={
                          r.levelOtoritas.includes("Executive")
                            ? "purple"
                            : r.levelOtoritas.includes("Head")
                            ? "orange"
                            : "blue"
                        }
                      />
                    </td>
                    <td className="p-3.5 text-slate-600 leading-relaxed text-[11px]">
                      {r.deskripsi}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="font-semibold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-md font-mono text-[11px]">
                        {r.totalPengguna} Staf
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── MODAL VIEW DETAIL USER ── */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Staf & Kredensial"
        subtitle={viewingUser ? `${viewingUser.nama} (NIP: ${viewingUser.kodeNip})` : ""}
        size="md"
      >
        {viewingUser && (
          <div className="space-y-6 py-2 text-xs">
            {/* Header Profil Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shadow-xs">
                {viewingUser.nama.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">{viewingUser.nama}</h4>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                    NIP {viewingUser.kodeNip}
                  </span>
                  <DnaCell.Badge
                    label={viewingUser.status}
                    status={viewingUser.status === "ACTIVE" ? "success" : "slate"}
                  />
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Departemen / Divisi
                </span>
                <span className="font-semibold text-slate-800 text-sm">{viewingUser.divisi}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Hak Akses / Peran
                </span>
                <DnaCell.Badge
                  label={viewingUser.hakAkses}
                  status="blue"
                />
              </div>
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Email Korporat
                </span>
                <span className="font-mono text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {viewingUser.email}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Nomor WhatsApp
                </span>
                <span className="font-mono text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {viewingUser.phone}
                </span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <DnaButton
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEditUser(viewingUser);
                }}
              >
                Sunting Data
              </DnaButton>
              <DnaButton variant="primary" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* ── MODAL TAMBAH / EDIT PENGGUNA ── */}
      <DnaModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? `Sunting Personel: ${editingUser.nama}` : "Tambah Pengguna Baru"}
        subtitle="Lengkapi identitas staf, nomor induk pegawai (NIP), penugasan departemen, dan hak akses"
        size="lg"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Kode / NIP *"
              value={userForm.kodeNip}
              onChange={(e) => setUserForm({ ...userForm, kodeNip: e.target.value })}
              placeholder="e.g. 025"
            />
            <DnaInput
              label="Nama Lengkap Staf *"
              value={userForm.nama}
              onChange={(e) => setUserForm({ ...userForm, nama: e.target.value })}
              placeholder="e.g. Ahmad Fauzi"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Email Korporat *"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="nama@dreamlab.id"
            />
            <DnaInput
              label="Nomor Telepon / WhatsApp *"
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              placeholder="08123456789"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaSelect
              label="Hak Akses / Peran *"
              value={userForm.hakAkses}
              onChange={(val) => setUserForm({ ...userForm, hakAkses: val })}
              options={rolesList.map((r) => ({ value: r.namaRole, label: r.namaRole }))}
            />
            <DnaSelect
              label="Divisi / Departemen *"
              value={userForm.divisi}
              onChange={(val) => setUserForm({ ...userForm, divisi: val })}
              options={[
                { value: "Commercial / Sales", label: "Commercial / Sales" },
                { value: "R&D / QC Laboratory", label: "R&D / QC Laboratory" },
                { value: "Produksi", label: "Produksi" },
                { value: "Gudang & Logistik", label: "Gudang & Logistik" },
                { value: "SCM & Purchasing", label: "SCM & Purchasing" },
                { value: "Finance & Tax", label: "Finance & Tax" },
                { value: "Human Resource", label: "Human Resource" },
                { value: "Executive / Management", label: "Executive / Management" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <DnaButton variant="secondary" onClick={() => setIsUserModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveUser}>
              Simpan Data Pengguna
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* Confirmation Dialog Delete */}
      <DnaConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Hapus / Nonaktifkan Pengguna?"
        description={`Apakah Anda yakin ingin menonaktifkan akun ${userToDelete?.nama} (NIP ${userToDelete?.kodeNip})? Staf ini tidak akan dapat login ke sistem lagi.`}
        confirmText="Nonaktifkan Akun"
        variant="critical"
      />
    </div>
  );
}
