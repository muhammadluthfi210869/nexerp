"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Calendar,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  User,
  RotateCcw,
} from "lucide-react";
import { DnaButton, DnaBadge, DnaInput, TableWrapper } from "@/components/dna";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { cn } from "@/lib/utils";

// Milestone sub-item — each belongs to a PO group
export interface ChecklistSubItem {
  id: string;
  milestone: string;
  pic: string;
  deadline: string;
  estimasiDeadline?: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "OVERDUE";
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Grouped by PO — one row per SO in the main table
export interface ChecklistGroup {
  id: string;
  poNumber: string;
  supplier: string;
  pic: string; // main PIC for this PO
  subItems: ChecklistSubItem[];
  updatedAt?: string;
  updatedBy?: string;
  fotoKemasanUrl?: string; // Item 88: thumbnail foto kemasan
}

const PIC_DIVISI = "SCM";

const INITIAL_DATA: ChecklistGroup[] = [
  {
    id: "g1",
    poNumber: "PO-202609-0033",
    supplier: "PT Chemikas Mandiri",
    pic: "Nike Febriyanti",
    fotoKemasanUrl: "https://placehold.co/120x120/7c3aed/white?text=Botol+30ml",
    subItems: [
      { id: "m1-1", milestone: "MoU (Kontrak Maklon)", pic: "Nike Febriyanti", deadline: "2026-09-05", status: "COMPLETED", updatedAt: "2026-09-05", updatedBy: "Nike Febriyanti" },
      { id: "m1-2", milestone: "Design Kemasan (Drafting)", pic: "Edi (Creative)", deadline: "2026-09-10", estimasiDeadline: "2026-09-12", status: "IN_PROGRESS", notes: "Draft layout menunggu approval klien" },
      { id: "m1-3", milestone: "Sample & Lab Test", pic: "Dr. Hendra (QC)", deadline: "2026-09-15", estimasiDeadline: "2026-09-14", status: "PENDING" },
      { id: "m1-4", milestone: "BPOM NA (Notifikasi)", pic: "Cipta (Regulasi)", deadline: "2026-09-28", status: "PENDING" },
      { id: "m1-5", milestone: "Production", pic: "Nur Kholilah (Produksi)", deadline: "2026-10-10", status: "PENDING" },
      { id: "m1-6", milestone: "Packaging", pic: "Budi Santoso (Gudang)", deadline: "2026-10-20", status: "PENDING" },
      { id: "m1-7", milestone: "Packaging Materials Received", pic: "Nike Febriyanti", deadline: "2026-10-18", status: "PENDING" },
      { id: "m1-8", milestone: "Ship / Delivery", pic: "Agus Pratama (Logistik)", deadline: "2026-10-25", status: "PENDING" },
    ],
  },
  {
    id: "g2",
    poNumber: "PO-202609-0032",
    supplier: "CV Packindo Lestari",
    pic: "Nike Febriyanti",
    fotoKemasanUrl: "https://placehold.co/120x120/059669/white?text=Kemasan+Box",
    subItems: [
      { id: "m2-1", milestone: "Quality Check", pic: "Dr. Hendra (QC)", deadline: "2026-09-08", estimasiDeadline: "2026-09-09", status: "OVERDUE", notes: "Kemasan tidak sesuai spec" },
      { id: "m2-2", milestone: "Goods Receipt (GR)", pic: "Budi Santoso (Gudang)", deadline: "2026-09-12", status: "PENDING" },
    ],
  },
  {
    id: "g3",
    poNumber: "PO-202609-0031",
    supplier: "PT Aroma Essentia Prima",
    pic: "Nur Kholilah",
    subItems: [
      { id: "m3-1", milestone: "Customs Clearance", pic: "Agus Pratama (Logistik)", deadline: "2026-09-20", status: "PENDING" },
      { id: "m3-2", milestone: "Warehouse Receipt", pic: "Budi Santoso (Gudang)", deadline: "2026-09-22", status: "PENDING" },
    ],
  },
  {
    id: "g4",
    poNumber: "PO-202609-0030",
    supplier: "PT Botolindo Utama",
    pic: "Nike Febriyanti",
    fotoKemasanUrl: "https://placehold.co/120x120/dc2626/white?text=Dropper",
    subItems: [
      { id: "m4-1", milestone: "Final QC Pass", pic: "Dr. Hendra (QC)", deadline: "2026-09-05", estimasiDeadline: "2026-09-04", status: "COMPLETED", updatedAt: "2026-09-04", updatedBy: "Dr. Hendra" },
      { id: "m4-2", milestone: "Packaging Materials Received", pic: "Budi Santoso (Gudang)", deadline: "2026-09-06", status: "COMPLETED", updatedAt: "2026-09-06", updatedBy: "Budi Santoso" },
      { id: "m4-3", milestone: "Pack & Ship", pic: "Agus Pratama (Logistik)", deadline: "2026-09-08", status: "COMPLETED", updatedAt: "2026-09-08", updatedBy: "Agus Pratama" },
    ],
  },
];

export default function ChecklistProgressPage() {
  // Item 57: one row per SO; Item 58: PIC filter tab
  const [data, setData] = useState<ChecklistGroup[]>(INITIAL_DATA);
  const [tab, setTab] = useState<"semua" | "pic-saya">("semua");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["g1"]));
  const [editingEstimasi, setEditingEstimasi] = useState<{ groupId: string; subId: string; value: string } | null>(null);
  const [pendingDialog, setPendingDialog] = useState<{ groupId: string; subId: string } | null>(null);
  const [pendingNotes, setPendingNotes] = useState("");
  const [revertDialog, setRevertDialog] = useState<{ groupId: string; subId: string } | null>(null);
  const [currentUser, setCurrentUser] = useState("Nike Febriyanti"); // mock current user

  // Item 58: filter by PIC
  const filteredData = tab === "pic-saya"
    ? data.filter(g => g.pic === currentUser)
    : data;

  // Item 60: sort sub-items chronologically (by urutan for known milestones, fallback by deadline)
  const sortedSubItems = (subItems: ChecklistSubItem[]) =>
    [...subItems].sort((a, b) => {
      const order: Record<string, number> = {
        "MoU (Kontrak Maklon)": 1,
        "Design Kemasan (Drafting)": 2,
        "Sample & Lab Test": 3,
        "BPOM NA (Notifikasi)": 4,
        "Production": 5,
        "Packaging Materials Received": 6,
        "Packaging": 7,
        "Ship / Delivery": 8,
        "Quality Check": 9,
        "Goods Receipt (GR)": 10,
        "Customs Clearance": 11,
        "Warehouse Receipt": 12,
        "Final QC Pass": 13,
        "Pack & Ship": 14,
      };
      const oA = order[a.milestone] ?? 99;
      const oB = order[b.milestone] ?? 99;
      if (oA !== oB) return oA - oB;
      return (a.deadline || "").localeCompare(b.deadline || "");
    });

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Item 79: save estimasi
  const handleSaveEstimasi = () => {
    if (!editingEstimasi) return;
    setData(prev => prev.map(g => {
      if (g.id !== editingEstimasi.groupId) return g;
      return {
        ...g,
        subItems: g.subItems.map(s =>
          s.id === editingEstimasi.subId ? { ...s, estimasiDeadline: editingEstimasi.value } : s
        ),
      };
    }));
    setEditingEstimasi(null);
    toast.success("Estimasi deadline berhasil disimpan.");
  };

  // Item 59: validate all-done before marking one done
  const canMarkDone = (group: ChecklistGroup, subId: string): boolean => {
    const subs = group.subItems;
    const target = subs.find(s => s.id === subId);
    if (!target) return false;
    // Item 63: "Packaging" needs "Packaging Materials Received" done first
    if (target.milestone === "Packaging") {
      const packagingMat = subs.find(s => s.milestone === "Packaging Materials Received");
      if (!packagingMat || packagingMat.status !== "COMPLETED") {
        toast.error('Tidak bisa selesaikan "Packaging" sebelum "Packaging Materials Received" selesai.');
        return false;
      }
    }
    // Other sub-items: all must be done except the target itself
    const others = subs.filter(s => s.id !== subId);
    const allOthersDone = others.every(s => s.status === "COMPLETED");
    if (!allOthersDone) {
      toast.error("Tidak bisa selesaikan sebelum sub-item lain selesai.");
      return false;
    }
    return true;
  };

  const handleMarkDone = (groupId: string, subId: string) => {
    const group = data.find(g => g.id === groupId);
    if (!group) return;
    if (!canMarkDone(group, subId)) return;
    const now = new Date().toISOString().split("T")[0];
    setData(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        updatedAt: now,
        updatedBy: currentUser,
        subItems: g.subItems.map(s =>
          s.id === subId ? { ...s, status: "COMPLETED" as const, updatedAt: now, updatedBy: currentUser } : s
        ),
      };
    }));
    toast.success("Milestone berhasil ditandai selesai.");
  };

  // Item 61: PENDING requires notes
  const handleMarkPending = () => {
    if (!pendingDialog || !pendingNotes.trim()) {
      toast.error("Catatan wajib diisi saat mengubah status ke PENDING.");
      return;
    }
    const now = new Date().toISOString().split("T")[0];
    setData(prev => prev.map(g => {
      if (g.id !== pendingDialog.groupId) return g;
      return {
        ...g,
        updatedAt: now,
        updatedBy: currentUser,
        subItems: g.subItems.map(s =>
          s.id === pendingDialog.subId
            ? { ...s, status: "PENDING" as const, notes: pendingNotes, updatedAt: now, updatedBy: currentUser }
            : s
        ),
      };
    }));
    setPendingDialog(null);
    setPendingNotes("");
    toast.success("Status berhasil diubah ke PENDING.");
  };

  // Item 62: DONE can be reverted to PROCESS/DELAY
  const handleRevert = () => {
    if (!revertDialog) return;
    const now = new Date().toISOString().split("T")[0];
    setData(prev => prev.map(g => {
      if (g.id !== revertDialog.groupId) return g;
      return {
        ...g,
        updatedAt: now,
        updatedBy: currentUser,
        subItems: g.subItems.map(s =>
          s.id === revertDialog.subId
            ? { ...s, status: "IN_PROGRESS" as const, updatedAt: now, updatedBy: currentUser }
            : s
        ),
      };
    }));
    setRevertDialog(null);
    toast.success("Milestone dikembalikan ke proses.");
  };

  const overdueCount = data.reduce((sum, g) =>
    sum + g.subItems.filter(s => s.status === "OVERDUE").length, 0);

  const getStatusBadge = (status: ChecklistSubItem["status"]) => {
    const cfg: Record<ChecklistSubItem["status"], { label: string; cls: string }> = {
      COMPLETED: { label: "SELESAI", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      IN_PROGRESS: { label: "DALAM PROSES", cls: "bg-blue-50 text-blue-700 border-blue-200" },
      PENDING: { label: "PENDING", cls: "bg-amber-50 text-amber-700 border-amber-200" },
      OVERDUE: { label: "TERLAMBAT", cls: "bg-rose-50 text-rose-700 border-rose-200" },
    };
    const c = cfg[status];
    return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border", c.cls)}>{c.label}</span>;
  };

  const groupProgress = (group: ChecklistGroup) => {
    const done = group.subItems.filter(s => s.status === "COMPLETED").length;
    return Math.round((done / group.subItems.length) * 100);
  };

  return (
    <DashboardShell
      title="CHECKLIST"
      titleAccent="TRACKING"
      subtitle="Pantau milestone dan estimasi deadline pengadaan"
      actions={
        <div className="flex items-center gap-3">
          {/* Item 58: Toggle tab */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setTab("semua")}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all",
                tab === "semua"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Semua
            </button>
            <button
              onClick={() => setTab("pic-saya")}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5",
                tab === "pic-saya"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <User className="w-3 h-3" />
              Kebutuhan PIC Saya
            </button>
          </div>
          <DnaBadge status={overdueCount > 0 ? "critical" : "info"}>
            {overdueCount} Melebihi Batas
          </DnaBadge>
        </div>
      }
    >
      {/* Item 57 + 60: Grouped table, sorted chronologically */}
      <TableWrapper>
        <Table className="table-dense">
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase w-8">#</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">No. PO</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">Supplier</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase">PIC</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase text-center">Foto Kemasan</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase text-center">Progress</TableHead>
              <TableHead className="py-3 px-4 text-table-header text-slate-400 uppercase text-center">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                  Tidak ada data checklist ditemukan.
                </TableCell>
              </TableRow>
            ) : filteredData.map((group, gIdx) => (
              <>
                {/* Main row — Item 57: 1 row per SO */}
                <TableRow key={group.id} className="bg-white hover:bg-slate-50/50 transition-all border-b">
                  <TableCell className="py-3 px-4">
                    <button onClick={() => toggleGroup(group.id)} className="p-1 rounded hover:bg-slate-100 transition-colors">
                      {expandedGroups.has(group.id)
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </button>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-black text-xs uppercase italic text-slate-900">{group.poNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 font-medium text-xs text-slate-700">{group.supplier}</TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                        {group.pic.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-600">{group.pic}</span>
                    </div>
                  </TableCell>
                  {/* Item 88: Foto Kemasan thumbnail */}
                  <TableCell className="py-3 px-4 text-center">
                    {group.fotoKemasanUrl ? (
                      <a
                        href={group.fotoKemasanUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Lihat foto kemasan"
                      >
                        <img
                          src={group.fotoKemasanUrl}
                          alt="Kemasan"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 hover:ring-2 hover:ring-purple-400 transition-all"
                        />
                      </a>
                    ) : (
                      <div className="w-10 h-10 mx-auto bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all",
                            groupProgress(group) >= 80 ? "bg-emerald-500" :
                            groupProgress(group) >= 50 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${groupProgress(group)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{groupProgress(group)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <span className="text-[10px] text-slate-400">
                      {expandedGroups.has(group.id) ? "Sembunyikan" : "Lihat"} {group.subItems.length} milestone
                    </span>
                  </TableCell>
                </TableRow>

                {/* Sub-items rows — Item 60: chronological order */}
                {expandedGroups.has(group.id) && sortedSubItems(group.subItems).map((sub) => (
                  <TableRow key={sub.id} className={cn(
                    "transition-all border-b border-dashed",
                    expandedGroups.has(group.id) ? "bg-slate-50/30 hover:bg-slate-50/60" : "hidden"
                  )}>
                    <TableCell className="py-2 px-4" />
                    <TableCell className="py-2 px-4">
                      <span className="text-[10px] text-slate-400 italic ml-4">└ {sub.milestone}</span>
                    </TableCell>
                    <TableCell className="py-2 px-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className={cn("text-[11px]", sub.status === "OVERDUE" ? "text-rose-600 font-bold" : "text-slate-500")}>
                          {sub.deadline}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-4 text-[11px] text-slate-500">{sub.pic}</TableCell>
                    <TableCell className="py-2 px-4">
                      {/* Item 79: estimasiDeadline */}
                      {editingEstimasi?.groupId === group.id && editingEstimasi?.subId === sub.id ? (
                        <div className="flex items-center gap-1.5">
                          <DnaInput
                            type="date"
                            value={editingEstimasi.value}
                            onChange={e => setEditingEstimasi({ ...editingEstimasi, value: e.target.value })}
                            className="w-32 h-7 text-[10px]"
                          />
                          <DnaButton variant="primary" size="sm" className="h-7 text-[10px] px-2" onClick={handleSaveEstimasi}>Simpan</DnaButton>
                          <DnaButton variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => setEditingEstimasi(null)}>Batal</DnaButton>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingEstimasi({ groupId: group.id, subId: sub.id, value: sub.estimasiDeadline || "" })}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {sub.estimasiDeadline || <span className="text-slate-400 italic">+ Est. deadline</span>}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-4 text-center">
                      {getStatusBadge(sub.status)}
                    </TableCell>
                    <TableCell className="py-2 px-4 text-right" colSpan={1}>
                      {/* Item 59, 61, 62, 63: action buttons */}
                      <div className="flex items-center justify-end gap-1">
                        {/* Item 59/63: Done button */}
                        {sub.status !== "COMPLETED" && (
                          <button
                            onClick={() => handleMarkDone(group.id, sub.id)}
                            className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors border border-emerald-200"
                            title="Tandai selesai"
                          >
                            ✓ Selesai
                          </button>
                        )}
                        {/* Item 61: PENDING */}
                        {sub.status !== "PENDING" && (
                          <button
                            onClick={() => { setPendingDialog({ groupId: group.id, subId: sub.id }); setPendingNotes(sub.notes || ""); }}
                            className="px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition-colors border border-amber-200"
                            title="Tandai pending"
                          >
                            ⏱ Pending
                          </button>
                        )}
                        {/* Item 62: Revert dari DONE ke IN_PROGRESS */}
                        {sub.status === "COMPLETED" && (
                          <button
                            onClick={() => {
                              if (confirm(`Yakin kembalikan "${sub.milestone}" ke proses?`)) {
                                const now = new Date().toISOString().split("T")[0];
                                setData(prev => prev.map(g => {
                                  if (g.id !== group.id) return g;
                                  return {
                                    ...g,
                                    updatedAt: now,
                                    updatedBy: currentUser,
                                    subItems: g.subItems.map(s =>
                                      s.id === sub.id ? { ...s, status: "IN_PROGRESS" as const, updatedAt: now, updatedBy: currentUser } : s
                                    ),
                                  };
                                }));
                                toast.success("Milestone dikembalikan ke proses.");
                              }
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors border border-slate-200"
                            title="Kembalikan ke proses"
                          >
                            <RotateCcw className="w-3 h-3 inline" />
                          </button>
                        )}
                        {/* Show change log if available (Item 61: tanggal perubahan) */}
                        {sub.updatedAt && (
                          <span className="text-[9px] text-slate-400 ml-1" title={`Diubah oleh ${sub.updatedBy}`}>
                            {sub.updatedAt}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Item 61: Dialog catatan wajib untuk PENDING */}
      <Dialog open={!!pendingDialog} onOpenChange={o => { if (!o) { setPendingDialog(null); setPendingNotes(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              Ubah ke Status PENDING
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold text-slate-700">Catatan wajib diisi *</Label>
            <Textarea
              value={pendingNotes}
              onChange={e => setPendingNotes(e.target.value)}
              placeholder="Alasan mengapa milestone ini ditandai pending..."
              rows={3}
              className="text-xs"
            />
          </div>
          <DialogFooter className="gap-2">
            <DnaButton variant="ghost" size="sm" onClick={() => { setPendingDialog(null); setPendingNotes(""); }}>Batal</DnaButton>
            <DnaButton variant="primary" size="sm" onClick={handleMarkPending}>Simpan & Pending</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
