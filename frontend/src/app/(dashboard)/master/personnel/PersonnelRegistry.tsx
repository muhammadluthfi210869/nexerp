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
import { useMutation } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
  Eye,
  Edit2,
  KeyRound,
  ShieldAlert,
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
  DnaBadge,
  DnaDetailDrawer,
  DnaTable,
  useDnaToast,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
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
        api.get("/users").then(unwrapResponse),
        api.get("/roles").then(unwrapResponse),
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
  // ponytail: `hakAkses` holds a UserRole slug (SCM, COMMERCIAL, ...), not a display label —
  // POST /users validates `roles` against the Prisma enum. `kodeNip`, `phone` and `divisi`
  // are display-only: the users table has no column for them and CreateUserDto has no field,
  // so this form shows them but does not persist them. Add when the master needs them.
  const [userForm, setUserForm] = useState({
    kodeNip: "",
    nama: "",
    email: "",
    phone: "",
    hakAkses: "COMMERCIAL",
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
      hakAkses: "COMMERCIAL",
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

  const saveUserMut = useMutation({
    mutationFn: async () => {
      // Only these three keys exist on the `users` table (CreateUserDto/UpdateUserDto).
      const payload = {
        email: userForm.email.trim(),
        fullName: userForm.nama.trim(),
        roles: [userForm.hakAkses],
        status: userForm.status,
      };
      const res = editingUser
        ? await api.patch(`/users/${editingUser.id}`, {
            fullName: payload.fullName,
            roles: payload.roles,
            status: payload.status,
          })
        : await api.post("/users", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      toast.success(
        editingUser
          ? `Data personil ${userForm.nama} berhasil diperbarui.`
          : `Personil baru ${userForm.nama} berhasil didaftarkan.`,
      );
      setIsUserModalOpen(false);
      setEditingUser(null);
      loadPersonnelData();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteUserMut = useMutation({
    // DELETE /users/:id deactivates the account (status INACTIVE + deletedAt); it does not
    // remove the row, so the toast says so.
    mutationFn: async (id: string) => unwrapResponse(await api.delete(`/users/${id}`)),
    onSuccess: () => {
      toast.success(`Akun ${userToDelete?.nama} berhasil dinonaktifkan.`);
      setUserToDelete(null);
      loadPersonnelData();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const handleSaveUser = () => {
    if (!userForm.nama.trim() || !userForm.email.trim()) {
      toast.error("Nama lengkap dan email korporat wajib diisi!");
      return;
    }
    saveUserMut.mutate();
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUserMut.mutate(userToDelete.id);
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
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold uppercase tracking-wider select-none">
                  <DnaTh className="px-3.5 py-2.5 w-[50px] text-center text-slate-400">#</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">NIP</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Nama Personel</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Email</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px]">No. Telepon</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">Divisi / Departemen</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px] text-center">Hak Akses</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px] text-center">Status</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[90px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {isLoading ? (
                  <DnaTableRow>
                    <DnaTd colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                      Memuat data personil...
                    </DnaTd>
                  </DnaTableRow>
                ) : errorState ? (
                  <DnaTableRow>
                    <DnaTd colSpan={9} className="p-12 text-center text-rose-500 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <span>{errorState}</span>
                        <DnaButton size="sm" variant="secondary" onClick={loadPersonnelData}>
                          Coba Lagi
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ) : paginatedUsers.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                      Tidak ada personel yang sesuai filter pencarian.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  paginatedUsers.map((u, idx) => {
                    return (
                      <DnaTableRow
                        key={u.id}
                        className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                        onClick={() => {
                          setViewingUser(u);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <DnaTd className="px-3.5 py-2.5 text-center text-slate-400 tabular-nums text-[11.5px] tabular-nums">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Code code={u.kodeNip} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{u.nama}</span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-700 line-clamp-1">{u.email}</span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 tabular-nums text-[11.5px] text-slate-600">
                          {u.phone}
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-800 line-clamp-1">{u.divisi}</span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-center">
                          <DnaBadge
                            variant={
                              u.hakAkses.includes("Admin")
                                ? "purple"
                                : u.hakAkses.includes("Head")
                                ? "warning"
                                : "info"
                            }
                          >
                            {u.hakAkses}
                          </DnaBadge>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-center">
                          <DnaBadge variant={u.status === "ACTIVE" ? "success" : "neutral"}>
                            {u.status}
                          </DnaBadge>
                        </DnaTd>
                        <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <DnaButton
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              onClick={() => {
                                setViewingUser(u);
                                setIsDetailModalOpen(true);
                              }}
                              title="Lihat Detail Profil"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </DnaButton>
                            <DnaCell.Actions
                              onEdit={() => handleOpenEditUser(u)}
                              onDelete={() => setUserToDelete(u)}
                            />
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
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
            <DnaTable className="table-fixed w-full">
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                  <DnaTh className="p-3 w-10 text-slate-400">#</DnaTh>
                  <DnaTh className="p-3 w-[26%]">NAMA ROLE & KODE</DnaTh>
                  <DnaTh className="p-3 w-[20%]">TINGKAT OTORITAS</DnaTh>
                  <DnaTh className="p-3 w-[38%]">DESKRIPSI & RUANG LINGKUP</DnaTh>
                  <DnaTh className="p-3 text-center w-[16%]">TOTAL PENGGUNA</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {rolesList.map((r, idx) => (
                  <DnaTableRow key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="p-3 text-slate-400 tabular-nums text-[11px]">{idx + 1}</DnaTd>
                    <DnaTd className="p-3">
                      <div className="font-bold text-slate-900 truncate">{r.namaRole}</div>
                      <div className="tabular-nums text-[11px] text-blue-600 font-semibold">{r.kodeRole}</div>
                    </DnaTd>
                    <DnaTd className="p-3">
                      <DnaBadge
                        variant={
                          r.levelOtoritas.includes("Executive")
                            ? "purple"
                            : r.levelOtoritas.includes("Head")
                            ? "warning"
                            : "info"
                        }
                      >
                        {r.levelOtoritas}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="p-3 text-slate-600 text-[11px] truncate">
                      {r.deskripsi}
                    </DnaTd>
                    <DnaTd className="p-3 text-center">
                      <span className="font-semibold text-slate-900 px-2 py-0.5 bg-slate-100 rounded tabular-nums text-[11px]">
                        {r.totalPengguna} Staf
                      </span>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── DETAIL DRAWER PENGGUNA (Golden Rule 5) ── */}
      <DnaDetailDrawer
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={viewingUser?.nama || "Detail Staf & Kredensial"}
        subtitle={`NIP: ${viewingUser?.kodeNip || "-"} • Departemen: ${viewingUser?.divisi || "-"}`}
        badge={
          viewingUser?.status === "ACTIVE" ? (
            <DnaBadge variant="success">AKUN AKTIF</DnaBadge>
          ) : (
            <DnaBadge variant="neutral">NON-AKTIF</DnaBadge>
          )
        }
        tabs={[
          {
            id: "profile",
            label: "Profil & Kredensial",
            content: viewingUser ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shadow-xs">
                    {viewingUser.nama.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{viewingUser.nama}</h4>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-[11px] font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                        NIP: {viewingUser.kodeNip}
                      </span>
                      <DnaBadge variant={viewingUser.status === "ACTIVE" ? "success" : "neutral"}>
                        {viewingUser.status}
                      </DnaBadge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Departemen / Divisi</span>
                    <span className="font-semibold text-slate-800">{viewingUser.divisi}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Hak Akses / Peran</span>
                    <DnaBadge variant="info">{viewingUser.hakAkses}</DnaBadge>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Email Korporat</span>
                    <span className="tabular-nums text-slate-700">{viewingUser.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Nomor WhatsApp</span>
                    <span className="tabular-nums text-slate-700">{viewingUser.phone}</span>
                  </div>
                </div>
              </div>
            ) : null,
          },
          {
            id: "security",
            label: "Otoritas & Keamanan",
            content: viewingUser ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Status Autentikasi 2-Faktor</span>
                    <DnaBadge variant="success">Aktif (OTP / App)</DnaBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Tingkat Hak Akses</span>
                    <span className="tabular-nums text-slate-600">Enterprise Standard</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Sesi Login Terakhir</span>
                    <span className="tabular-nums text-slate-500">Hari ini, 08:30 WIB</span>
                  </div>
                </div>
              </div>
            ) : null,
          },
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<KeyRound className="w-3.5 h-3.5 text-amber-600" />}
              onClick={() => {
                toast.success(`Tautan reset password dikirim ke ${viewingUser?.email}`);
              }}
            >
              Reset Kata Sandi
            </DnaButton>
            <div className="flex items-center gap-2">
              <DnaButton
                variant="secondary"
                size="sm"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (viewingUser) {
                    setIsDetailModalOpen(false);
                    handleOpenEditUser(viewingUser);
                  }
                }}
              >
                Sunting Data
              </DnaButton>
              <DnaButton variant="primary" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Selesai
              </DnaButton>
            </div>
          </div>
        }
      />

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
              options={rolesList.map((r) => ({ value: r.kodeRole, label: r.namaRole }))}
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
            <DnaButton variant="primary" loading={saveUserMut.isPending} onClick={handleSaveUser}>
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
