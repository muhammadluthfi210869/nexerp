"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Pencil,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardCard, DnaButton, StatCard } from "@/components/dna";
import { api } from "@/lib/api";
import { ALL_PROJECT_MONITORING, ProjectMonitoringItem } from "@/lib/rnd-mock-data";
import { isRndHeadAccount } from "@/lib/rnd-access";
import { cn } from "@/lib/utils";
import {
  RND_PICS,
  BUSDEV_OPTIONS,
  PM_STATUSES,
  PM_CATEGORIES,
  TYPOGRAPHY,
  CHIP_CLASSES,
  STATUS_STYLES,
} from "@/components/rnd/rnd-constants";
import {
  InlineSelect,
  InlineText,
  InlineNumber,
  SaveDot,
  FloatingQuickSelect,
} from "@/components/rnd/rnd-table-shared";
import { FloatingEditModal, FieldConfig } from "@/components/rnd/rnd-edit-modal";
import { ConfirmModal, toast } from "@/components/rnd/rnd-modal";

const DAY = 86400000;

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const calcDays = (item: ProjectMonitoringItem) =>
  item.tglSelesai
    ? Math.max(0, Math.ceil((new Date(item.tglSelesai).getTime() - new Date(item.tglNpfMasuk).getTime()) / DAY))
    : Math.max(1, Math.ceil((today().getTime() - new Date(item.tglNpfMasuk).getTime()) / DAY));

// ── Labels untuk expanded row ──
const FIELD_LABELS: Record<string, string> = {
  category: "Category", noNpf: "No. SPF", busdev: "Busdev",
  tglNpfMasuk: "Tgl NPF Masuk", tglSelesai: "Tgl Selesai",
  totalPengerjaanSample: "Total Hari", revisionCount: "Revisi",
  trialCount: "Trial", folderFormula: "Folder Formula", notes: "Notes",
};
const DETAIL_FIELDS = ["category", "noNpf", "busdev", "tglNpfMasuk", "tglSelesai", "totalPengerjaanSample", "revisionCount", "trialCount", "folderFormula", "notes"] as const;

// ═══════════════════════════════════════════════════════════════
// HEAD R&D TRACKER TAB — API Fetching
// ═══════════════════════════════════════════════════════════════
type HeadTrackerItem = {
  id: string; date: string; strategicTask: string; teamSupport: string;
  approvalGiven: string; innovationConcept: string; escalationHandled: string;
  notes: string;
};

function HeadRndTrackerTab({ autoOpen }: { autoOpen?: boolean }) {
  const [data, setData] = useState<HeadTrackerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(!!autoOpen);
  const [quickForm, setQuickForm] = useState({
    date: new Date().toISOString().slice(0, 10), strategicTask: "", teamSupport: "",
    approvalGiven: "", innovationConcept: "", escalationHandled: "", notes: "",
  });
  // Edit mode: null = create, string = id of entry being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/rnd/head-tracker");
      setData((res.data || []).map((ht: any) => ({
        id: ht.id,
        date: ht.date?.slice(0, 10) || "",
        strategicTask: ht.strategicTask || "",
        teamSupport: ht.teamSupport || "",
        approvalGiven: ht.approvalGiven || "",
        innovationConcept: ht.innovationConcept || "",
        escalationHandled: ht.escalationHandled || "",
        notes: ht.notes || "",
      })));
    } catch {
      setData([
        { id:"HT-1", date:"2026-07-01", strategicTask:"Review pipeline Q3 dan alokasi resources", teamSupport:"Weekly sync Panca & Yaya — progress 80%", approvalGiven:"Approve formula sunscreen SPF 45 untuk production trial", innovationConcept:"Proposal encapsulasi retinol untuk anti-aging series", escalationHandled:"Resolve — BPOM document delay karena supplier baru", notes:"" },
        { id:"HT-2", date:"2026-07-08", strategicTask:"Evaluasi KPI bulan Juni dan target Juli", teamSupport:"1:1 coaching Yaya — performance improvement plan", approvalGiven:"Approve budget lab equipment upgrade Q3", innovationConcept:"Inisiasi research peptide-based moisturizer", escalationHandled:"Client Mujiati — revisi minor, on track", notes:"Perlu follow up sample room capacity" },
        { id:"HT-3", date:"2026-07-15", strategicTask:"Koordinasi dengan Busdev untuk prioritas client", teamSupport:"Matchmaking client-projects untuk workload balance", approvalGiven:"Approve hire 1 R&D staff untuk team parfum", innovationConcept:"Blueprint lab digitalization — QR untuk batch tracking", escalationHandled:"Resolve — bottleneck homogenizer, jadwal shift diatur ulang", notes:"Rencana implementasi QR batch tracking mulai Agustus" },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleQuickAdd = useCallback(async () => {
    try {
      const payload: any = {};
      Object.entries(quickForm).forEach(([k, v]) => { if (v) payload[k] = v; });

      if (editingId) {
        // Update existing entry
        await api.patch(`/rnd/head-tracker/${editingId}`, payload);
      } else {
        // Create new entry
        await api.post("/rnd/head-tracker", payload);
      }
      await fetchData();
    } catch {
      setData(prev => {
        if (editingId) {
          // Optimistic update
          return prev.map(d => d.id === editingId ? { ...d, ...quickForm } : d);
        }
        return [{ id: "NEW-" + Date.now(), ...quickForm }, ...prev];
      });
    }
    setShowQuickAdd(false);
    setEditingId(null);
    setQuickForm({ date: new Date().toISOString().slice(0, 10), strategicTask: "", teamSupport: "", approvalGiven: "", innovationConcept: "", escalationHandled: "", notes: "" });
  }, [quickForm, fetchData, editingId]);

  const openEdit = useCallback((item: HeadTrackerItem) => {
    setQuickForm({
      date: item.date,
      strategicTask: item.strategicTask,
      teamSupport: item.teamSupport,
      approvalGiven: item.approvalGiven,
      innovationConcept: item.innovationConcept,
      escalationHandled: item.escalationHandled,
      notes: item.notes,
    });
    setEditingId(item.id);
    setShowQuickAdd(true);
  }, []);

  const cancelForm = useCallback(() => {
    setShowQuickAdd(false);
    setEditingId(null);
    setQuickForm({ date: new Date().toISOString().slice(0, 10), strategicTask: "", teamSupport: "", approvalGiven: "", innovationConcept: "", escalationHandled: "", notes: "" });
  }, []);

  // Derived stats from data
  const totalApprovals = data.filter(d => d.approvalGiven).length;
  const totalInnovations = data.filter(d => d.innovationConcept).length;
  const totalEscalations = data.filter(d => d.escalationHandled).length;

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/rnd/head-tracker/${id}`);
      setData(prev => prev.filter(d => d.id !== id));
      toast("success", "Entry berhasil dihapus");
    } catch (err) {
      console.error(`Failed to delete head tracker entry ${id}:`, err);
      toast("error", "Gagal menghapus entry. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ open: false, id: null });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Quick Add / Edit ── */}
      {showQuickAdd && (
        <div className="rounded-[24px] border-2 border-dashed border-purple-200 bg-purple-50/60 p-4">
          <p className={TYPOGRAPHY.statLabel + " mb-3 flex items-center gap-2"}>
            {editingId ? <Pencil size={12} /> : <Plus size={12} />}
            {editingId ? "Edit Entry — Head R&amp;D Activity" : "New Entry — Head R&amp;D Activity"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Date</p>
              <input type="date" value={quickForm.date} onChange={e => setQuickForm(p => ({ ...p, date: e.target.value }))}
                className="h-8 w-full rounded-lg border border-purple-200 bg-white px-3 text-[12px] outline-none" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Strategic Task</p>
              <input value={quickForm.strategicTask} onChange={e => setQuickForm(p => ({ ...p, strategicTask: e.target.value }))} placeholder="Pekerjaan strategis..."
                className="h-8 w-full rounded-lg border border-purple-200 bg-white px-3 text-[12px] font-semibold outline-none" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Team Support</p>
              <input value={quickForm.teamSupport} onChange={e => setQuickForm(p => ({ ...p, teamSupport: e.target.value }))} placeholder="Support ke staff..."
                className="h-8 w-full rounded-lg border border-purple-200 bg-white px-3 text-[12px] outline-none" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Approval Given</p>
              <input value={quickForm.approvalGiven} onChange={e => setQuickForm(p => ({ ...p, approvalGiven: e.target.value }))} placeholder="Keputusan/approval..."
                className="h-8 w-full rounded-lg border border-purple-200 bg-white px-3 text-[12px] outline-none" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Innovation Concept</p>
              <input value={quickForm.innovationConcept} onChange={e => setQuickForm(p => ({ ...p, innovationConcept: e.target.value }))} placeholder="Konsep inovasi..."
                className="h-8 w-full rounded-lg border border-purple-200 bg-white px-3 text-[12px] outline-none" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Escalation Handled</p>
              <input value={quickForm.escalationHandled} onChange={e => setQuickForm(p => ({ ...p, escalationHandled: e.target.value }))} placeholder="Eskalasi masalah..."
                className="h-8 w-full rounded-lg border border-purple-200 bg-white px-3 text-[12px] outline-none" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Notes</p>
              <textarea value={quickForm.notes} onChange={e => setQuickForm(p => ({ ...p, notes: e.target.value }))} placeholder="Catatan..."
                className="h-16 w-full rounded-lg border border-purple-200 bg-white px-3 text-[12px] outline-none resize-none" />
            </div>
          </div>
          <div className="flex gap-2 items-end justify-end mt-3">
            <button onClick={cancelForm}
              className="h-8 px-4 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-600 transition">Batal</button>
            <button onClick={handleQuickAdd}
              className="h-8 px-4 rounded-lg bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 transition flex items-center gap-1.5">
              {editingId ? <><Pencil size={12} /> Update</> : <><Plus size={12} /> Simpan</>}
            </button>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-[20px] border border-slate-100 bg-white p-4">
          <p className={TYPOGRAPHY.statLabel}>Total Entries</p>
          <p className="text-[24px] font-black mt-1">{data.length}</p>
          <p className="text-[10px] text-slate-400">Bulan ini</p>
        </div>
        <div className="rounded-[20px] border border-slate-100 bg-white p-4">
          <p className={TYPOGRAPHY.statLabel}>Approvals</p>
          <p className="text-[24px] font-black mt-1 text-blue-600">{totalApprovals}</p>
          <p className="text-[10px] text-slate-400">Given</p>
        </div>
        <div className="rounded-[20px] border border-slate-100 bg-white p-4">
          <p className={TYPOGRAPHY.statLabel}>Innovations</p>
          <p className="text-[24px] font-black mt-1 text-purple-600">{totalInnovations}</p>
          <p className="text-[10px] text-slate-400">New concepts</p>
        </div>
        <div className="rounded-[20px] border border-slate-100 bg-white p-4">
          <p className={TYPOGRAPHY.statLabel}>Escalations</p>
          <p className="text-[24px] font-black mt-1 text-emerald-600">{totalEscalations}</p>
          <p className="text-[10px] text-slate-400">Resolved</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[24px] border border-slate-100 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className={TYPOGRAPHY.statLabel}>Weekly Head R&D Activity Log</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left">
            <colgroup>
              <col className="w-24" />
              <col className="w-[180px]" />
              <col className="w-[160px]" />
              <col className="w-[160px]" />
              <col className="w-[160px]" />
              <col className="w-[160px]" />
              <col className="w-12" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100">
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Date</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Strategic Task</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Team Support</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Approval Given</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Innovation Concept</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Escalation Handled</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}></th>
              </tr>
            </thead>
            <tbody>
              {data.map((ht) => (
                <tr key={ht.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition group">
                  <td className="px-3 py-3 text-[12px] font-bold text-slate-700">{ht.date}</td>
                  <td className="px-3 py-3">
                    <span className="text-[12px] font-bold text-slate-900 block">{ht.strategicTask}</span>
                  </td>
                  <td className="px-3 py-3 text-[11px] font-medium text-slate-700">{ht.teamSupport}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-md bg-blue-50 border border-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700">
                      {ht.approvalGiven}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-md bg-purple-50 border border-purple-100 px-2 py-1 text-[11px] font-bold text-purple-700">
                      {ht.innovationConcept}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[11px] font-medium text-slate-700">{ht.escalationHandled}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => openEdit(ht)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition hover:bg-purple-50 hover:text-purple-600 group-hover:opacity-100"
                        title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button type="button" onClick={() => setConfirmDelete({ open: true, id: ht.id })}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                        title="Hapus">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm Delete Modal untuk Head Tracker ── */}
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => confirmDelete.id ? handleDelete(confirmDelete.id) : {}}
        title="Hapus Entry"
        message="Apakah Anda yakin ingin menghapus entry Head Tracker ini?"
        confirmLabel={isDeleting ? "Menghapus..." : "Hapus"}
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}

export default function ProjectMonitoringClient() {
  const [data, setData] = useState<ProjectMonitoringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedPic, setSelectedPic] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [quickStatus, setQuickStatus] = useState<{ id: string; value: string; rect?: DOMRect } | null>(null);
  const [tab, setTab] = useState<"projects" | "head">("projects");
  const [editModal, setEditModal] = useState<{ open: boolean; data: any; mode: "create" | "edit" }>({
    open: false, data: null, mode: "create"
  });
  const [headTabKey, setHeadTabKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Confirm delete modal
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Edit Modal field config ──
  const PM_EDIT_FIELDS: FieldConfig[] = [
    { key: "projectName", label: "Project Name", type: "text" },
    { key: "pic", label: "PIC", type: "select", options: [...RND_PICS] },
    { key: "client", label: "Client", type: "text" },
    { key: "category", label: "Category", type: "select", options: [...PM_CATEGORIES] },
    { key: "noNpf", label: "No. SPF", type: "text" },
    { key: "busdev", label: "Busdev", type: "text" },
    { key: "status", label: "Status", type: "select", options: [...PM_STATUSES] },
    { key: "tglNpfMasuk", label: "Tgl NPF Masuk", type: "date" },
    { key: "tglSelesai", label: "Tgl Selesai", type: "date" },
    { key: "totalDays", label: "Total Hari", type: "number", min: 0, max: 999 },
    { key: "revisionCount", label: "Revisi", type: "number", min: 0, max: 99 },
    { key: "trialCount", label: "Trial", type: "number", min: 0, max: 99 },
    { key: "folderFormula", label: "Folder Formula", type: "text" },
    { key: "notes", label: "Notes", type: "textarea" },
  ];

  const [currentUser, setCurrentUser] = useState<{ fullName?: string; email?: string; roles?: string[]; id?: string }>({});

  useEffect(() => {
    try {
      setCurrentUser(JSON.parse(localStorage.getItem("user") || "{}"));
    } catch {}
  }, []);

  // Head R&D detection: SUPER_ADMIN role OR Amira (Head of R&D)
  const isHead = currentUser.id
    ? (currentUser.roles?.includes?.("SUPER_ADMIN") ||
       isRndHeadAccount(currentUser.email))
    : false;
  const staffPicName = currentUser.fullName || "";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/rnd/projects");
      const items = (res.data || []).map((t: any, i: number) => ({
        id: t.id,
        no: i + 1,
        projectName: t.projectName || "",
        pic: t.pic || "",
        client: t.client || "",
        category: t.category || "New Product",
        noNpf: t.noNpf || "",
        busdev: t.busdev || "",
        status: t.status || "In progress",
        tglNpfMasuk: t.startDate?.slice(0, 10) || today().toISOString().slice(0, 10),
        tglSelesai: t.deadline?.slice(0, 10) || "",
        totalPengerjaanSample: t.totalDays || 0,
        revisionCount: t.revisionCount || 0,
        trialCount: t.trialCount || 0,
        folderFormula: t.folderFormula || "",
        notes: t.notes || "",
      })) as ProjectMonitoringItem[];
      setData(items);
    } catch {
      setData(ALL_PROJECT_MONITORING);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveField = useCallback(async (id: string, field: string, value: any) => {
    setIsSaving((prev) => ({ ...prev, [id]: true }));
    try {
      const fieldMap: Record<string, string> = {
        tglNpfMasuk: "startDate",
        tglSelesai: "deadline",
        totalPengerjaanSample: "totalDays",
      };
      await api.patch(`/rnd/projects/${id}`, { [fieldMap[field] || field]: value });
    } catch (err) {
      console.error(`Failed to save field ${field} for project ${id}:`, err);
    } finally {
      setIsSaving((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const updateField = useCallback(
    (id: string, field: keyof ProjectMonitoringItem, value: any) => {
      setData((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
      saveField(id, field, value);
    },
    [saveField],
  );

  const handleDelete = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/rnd/projects/${id}`);
      setData((prev) => prev.filter((item) => item.id !== id));
      if (expandedRow === id) setExpandedRow(null);
      toast("success", "Project berhasil dihapus");
    } catch (err) {
      console.error(`Failed to delete project ${id}:`, err);
      toast("error", "Gagal menghapus project. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ open: false, id: null });
    }
  }, [expandedRow]);

  const openCreateModal = useCallback(() => {
    setEditModal({
      open: true,
      data: {
        projectName: "", pic: isHead ? "" : staffPicName, client: "",
        category: "New Product", noNpf: "", busdev: "", status: "In progress",
        tglNpfMasuk: today().toISOString().slice(0, 10), tglSelesai: "",
        totalDays: 0, revisionCount: 0, trialCount: 0, folderFormula: "", notes: "",
      },
      mode: "create"
    });
  }, [isHead, staffPicName]);

  const openEditModal = useCallback((item: any) => {
    setEditModal({ open: true, data: { ...item }, mode: "edit" });
  }, []);

  const handleEditModalSave = useCallback(async (key: string, value: any) => {
    const { mode, data: modalData } = editModal;
    if (!modalData) return;
    // Map frontend keys to API keys
    const fm: Record<string, string> = {
      tglNpfMasuk: "startDate", tglSelesai: "deadline",
      totalDays: "totalPengerjaanSample",
    };
    const apiField = fm[key] || key;

    if (mode === "create") {
      setEditModal(prev => ({ ...prev, data: { ...prev.data, [key]: value } }));
    } else {
      if (!modalData.id) return;
      setIsSaving(p => ({ ...p, [modalData.id]: true }));
      try {
        await api.patch("/rnd/projects/" + modalData.id, { [apiField]: value });
      } catch (err) {
        console.error(`Failed to update field ${key} for project ${modalData.id}:`, err);
      }
      finally { setIsSaving(p => ({ ...p, [modalData.id]: false })); }
      setData(prev => prev.map(d => d.id === modalData.id ? { ...d, [key]: value } : d));
    }
  }, [editModal]);

  const handleEditModalClose = useCallback(async () => {
    const { mode, data: modalData } = editModal;
    if (mode === "create") {
      // Always attempt create even if projectName not yet committed from draft
      // (user may click Selesai without tabbing out of text field)
      setIsCreating(true);
      try {
        await api.post("/rnd/projects", {
          projectName: modalData?.projectName || "New Project",
          pic: modalData?.pic || (isHead ? "" : staffPicName),
          client: modalData?.client || undefined,
          category: modalData?.category || undefined,
          noNpf: modalData?.noNpf || undefined,
          busdev: modalData?.busdev || undefined,
          status: modalData?.status || "In progress",
          startDate: modalData?.tglNpfMasuk || today().toISOString().slice(0, 10),
          deadline: modalData?.tglSelesai || undefined,
          totalDays: modalData?.totalDays || undefined,
          revisionCount: modalData?.revisionCount || 0,
          trialCount: modalData?.trialCount || 0,
          notes: modalData?.notes || undefined,
        });
        await fetchData();
        toast("success", "Project berhasil dibuat");
      } catch (err) {
        console.error("Failed to create project:", err);
        toast("error", "Gagal menyimpan project. Silakan coba lagi.");
      } finally {
        setIsCreating(false);
      }
    }
    setEditModal({ open: false, data: null, mode: "create" });
  }, [editModal, isHead, staffPicName, fetchData]);

  const picList = useMemo(() => Array.from(new Set(data.map((item) => item.pic))).filter(Boolean).slice().sort(), [data]);
  const effectivePic = isHead ? selectedPic : staffPicName || null;

  const filteredData = useMemo(() => {
    let rows = [...data];
    if (filterStatus) rows = rows.filter((item) => item.status === filterStatus);
    if (isHead && effectivePic) rows = rows.filter((item) => item.pic === effectivePic);
    if (!isHead && staffPicName) rows = rows.filter((item) => item.pic.toLowerCase() === staffPicName.toLowerCase());
    return rows.slice().sort((a, b) => new Date(b.tglNpfMasuk).getTime() - new Date(a.tglNpfMasuk).getTime());
  }, [data, effectivePic, filterStatus, isHead, staffPicName]);

  const kpiData = useMemo(() => (effectivePic ? data.filter((item) => item.pic === effectivePic) : data), [data, effectivePic]);
  const sent = kpiData.filter((item) => item.status === "Terkirim").length;
  const ready = kpiData.filter((item) => item.status === "Ready To send").length;
  const inProgress = kpiData.filter((item) => item.status === "In progress").length;
  const pending = kpiData.filter((item) => item.status === "Pending").length;
  const completed = kpiData.filter((item) => item.tglSelesai);
  const avgDays = completed.length ? Math.round(completed.reduce((sum, item) => sum + calcDays(item), 0) / completed.length) : 0;
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((item) => { counts[item.status] = (counts[item.status] || 0) + 1; });
    return counts;
  }, [data]);

  if (loading) {
    return (
      <DashboardShell title="R&D" titleAccent="Project Monitoring" subtitle="Loading...">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="R&D"
      titleAccent="Project Monitoring"
      subtitle={isHead ? "Head R&D view — audit project status" : `My projects — ${staffPicName}`}
      actions={
        <div className="flex gap-2">
          <DnaButton variant="outline" icon={<FileText />} onClick={fetchData}>
            Refresh
          </DnaButton>
          {tab === "projects" ? (
            <DnaButton variant="primary" icon={<Plus />} onClick={openCreateModal} disabled={isCreating}>
              {isCreating ? "Menyimpan..." : "New Project"}
            </DnaButton>
          ) : (
            <DnaButton variant="primary" icon={<Plus />} onClick={() => setHeadTabKey(prev => prev + 1)}>
              New Entry
            </DnaButton>
          )}
        </div>
      }
    >
      {/* ── Tab Navigation ── */}
      <div className="mb-5 flex gap-1 border-b border-slate-100">
        <button type="button" onClick={() => setTab("projects")}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition border-b-2 -mb-px",
            tab === "projects" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}>
          <FolderOpen size={14} /> Project Monitoring
        </button>
        <button type="button" onClick={() => setTab("head")}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition border-b-2 -mb-px",
            tab === "head" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}>
          <UserCheck size={14} /> Head R&D Tracker
        </button>
      </div>

      {tab === "projects" && (<>
      {/* ── KPI Cards ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={kpiData.length} subValue={effectivePic || "All"} icon={<FolderOpen className="h-5 w-5" />} />
        <StatCard label="In Progress" value={inProgress} subValue={`${kpiData.length ? Math.round((inProgress / kpiData.length) * 100) : 0}%`} icon={<Clock className="h-5 w-5 text-blue-500" />} />
        <StatCard label="Ready" value={ready} subValue="Siap kirim" icon={<CheckCircle2 className="h-5 w-5 text-amber-500" />} />
        <StatCard label="Terkirim" value={sent} subValue={`${kpiData.length ? Math.round((sent / kpiData.length) * 100) : 0}%`} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />
        <StatCard label="Pending" value={pending} subValue="Menunggu" icon={<AlertTriangle className="h-5 w-5 text-purple-500" />} />
        <StatCard label="Avg Days" value={`${avgDays}d`} subValue="Rata-rata" icon={<Clock className="h-5 w-5" />} />
      </div>

      {/* ── Filter Chips ── */}
      <DashboardCard label={`Project Monitoring (${filteredData.length} projects)`} className="rounded-[28px] p-6 shadow-none hover:translate-y-0 hover:shadow-none">
        <div className="mb-5 flex flex-wrap gap-2">
          {isHead && (
            <>
              <button type="button" onClick={() => setSelectedPic(null)}
                className={cn("rounded-full px-4 py-2", TYPOGRAPHY.chip, "transition", !effectivePic ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
                All PICs
              </button>
              {picList.map((pic) => (
                <button key={pic} type="button" onClick={() => setSelectedPic(effectivePic === pic ? null : pic)}
                  className={cn("rounded-full px-4 py-2", TYPOGRAPHY.chip, "transition", effectivePic === pic ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
                  {pic}
                </button>
              ))}
            </>
          )}
          <button type="button" onClick={() => setFilterStatus(null)}
            className={cn("rounded-full px-4 py-2", TYPOGRAPHY.chip, "transition", !filterStatus ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
            All Status
          </button>
          {PM_STATUSES.filter((s) => statusCounts[s]).map((status) => (
            <button key={status} type="button" onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className={cn("rounded-full px-4 py-2", TYPOGRAPHY.chip, "transition", filterStatus === status ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
              {status} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed text-left">
            <colgroup>
              <col className="w-10" />
              <col className="w-20" />
              <col className="w-[300px]" />
              <col className="w-36" />
              <col className="w-24" />
              <col className="w-36" />
              <col className="w-20" />
              <col className="w-16" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100">
                <th className={TYPOGRAPHY.tableHeader + " px-2 py-3"}>#</th>
                <th className={TYPOGRAPHY.tableHeader + " px-2 py-3"}>PIC</th>
                <th className={TYPOGRAPHY.tableHeader + " px-2 py-3"}>Project Name</th>
                <th className={TYPOGRAPHY.tableHeader + " px-2 py-3"}>Client</th>
                <th className={TYPOGRAPHY.tableHeader + " px-2 py-3"}>Days</th>
                <th className={TYPOGRAPHY.tableHeader + " px-2 py-3"}>Status⚡</th>
                <th className={TYPOGRAPHY.tableHeader + " px-2 py-3"}>Save</th>
                <th className={TYPOGRAPHY.tableHeader + " px-2 py-3"}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {/* ── Data Rows (no dots, expandable) ── */}
              {filteredData.map((item) => {
                const days = calcDays(item);
                const isExpanded = expandedRow === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <tr key={item.id}
                      className={cn("group border-b border-slate-50 transition hover:bg-slate-50/70 cursor-pointer",
                        item.status === "Terkirim" && "bg-emerald-50/10",
                        isExpanded && "bg-blue-50/20")}
                      onClick={() => setExpandedRow(isExpanded ? null : item.id)}>
                      <td className="px-2 py-2 text-[12px] font-semibold tabular-nums text-slate-500">{item.no}</td>
                      <td className="px-2 py-2">
                        <span className="text-[12px] font-bold text-slate-800">{item.pic}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="block truncate text-[12px] font-bold text-slate-900" title={item.projectName}>
                          {item.projectName}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-[12px] font-semibold text-slate-700">{item.client || "—"}</span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-col">
                          <span className={cn("text-[12px] font-black tabular-nums", days > 14 ? "text-rose-600" : "text-slate-700")}>
                            {days}d
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">{formatDate(item.tglNpfMasuk)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <button type="button" onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); e.stopPropagation(); setQuickStatus({ id: item.id, value: item.status, rect: r }); }}
                          className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap transition hover:ring-2 hover:ring-blue-200 cursor-pointer", STATUS_STYLES[item.status] || "bg-slate-50 border-slate-200 text-slate-600")}>
                          {item.status}
                        </button>
                      </td>
                      <td className="px-2 py-2">
                        <SaveDot active={isSaving[item.id]} />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button type="button" onClick={() => openEditModal(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
                            title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button type="button" onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-slate-100 group-hover:opacity-100"
                            title="Detail">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button type="button" onClick={() => setConfirmDelete({ open: true, id: item.id })}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                            title="Hapus">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* ── Expanded Row Detail ── */}
                    {isExpanded && (
                      <tr className="bg-blue-50/30 border-b border-blue-100">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
                            {DETAIL_FIELDS.map(field => {
                              const label = FIELD_LABELS[field] || field;
                              let val = item[field as keyof ProjectMonitoringItem];
                              // Format dates
                              if ((field === "tglNpfMasuk" || field === "tglSelesai") && val) {
                                val = formatDate(val as string);
                              }
                              return (
                                <div key={field} className="space-y-0.5">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                                  <p className={cn("text-[12px] font-semibold", !val ? "text-slate-300 italic" : "text-slate-800")}>
                                    {val || "—"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                          {/* Inline edit for key fields */}
                          <div className="mt-4 pt-3 border-t border-blue-100 flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-slate-400">Category:</span>
                              <InlineSelect value={item.category || ""} options={PM_CATEGORIES} onSave={v => updateField(item.id, "category" as any, v)} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-slate-400">Busdev:</span>
                              <InlineSelect value={item.busdev || ""} options={["", ...BUSDEV_OPTIONS]} onSave={v => updateField(item.id, "busdev" as any, v)} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-slate-400">Revisi:</span>
                              <InlineNumber value={item.revisionCount || 0} min={0} max={99} onSave={v => updateField(item.id, "revisionCount" as any, v)} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-slate-400">Trial:</span>
                              <InlineNumber value={item.trialCount || 0} min={0} max={99} onSave={v => updateField(item.id, "trialCount" as any, v)} />
                            </div>
                            <InlineText value={item.noNpf || ""} placeholder="No. SPF" onSave={v => updateField(item.id, "noNpf" as any, v)} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* ── Dropdown: Status ⚡ ── */}
      <FloatingQuickSelect
        open={!!quickStatus}
        onClose={() => setQuickStatus(null)}
        title="Change Status"
        options={PM_STATUSES}
        value={quickStatus?.value || ""}
        onSelect={val => { if (quickStatus) updateField(quickStatus.id, "status" as any, val); }}
        colorMap={STATUS_STYLES}
        anchorRect={quickStatus?.rect}
      />

      {/* ── Floating Edit Modal ── */}
      <FloatingEditModal
        open={editModal.open}
        onClose={handleEditModalClose}
        title={editModal.mode === "create" ? "New Project" : "Edit Project"}
        fields={PM_EDIT_FIELDS}
        data={editModal.data || {}}
        onSave={handleEditModalSave}
      />
      </>)}

      {tab === "head" && <HeadRndTrackerTab key={headTabKey} autoOpen={headTabKey > 0} />}

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => confirmDelete.id ? handleDelete(confirmDelete.id) : {}}
        title="Hapus Project"
        message="Apakah Anda yakin ingin menghapus project ini? Tindakan ini tidak bisa dibatalkan."
        confirmLabel={isDeleting ? "Menghapus..." : "Hapus"}
        variant="danger"
        loading={isDeleting}
      />
    </DashboardShell>
  );
}
