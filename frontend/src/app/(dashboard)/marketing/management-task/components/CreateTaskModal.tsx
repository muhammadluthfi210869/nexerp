"use client";

import { useEffect, useState } from "react";
import { Plus, Check, Link2, Sparkles } from "lucide-react";
import { DnaModal, DnaButton } from "@/components/dna";
import { DnaDaysLeftChip } from "@/components/dna/DnaExtras";
import { marketingService } from "@/lib/services/marketing-service";
import { useDnaToast } from "@/components/dna/DnaToast";
import type { CreateTaskInput, UpdateTaskInput, TaskType, TaskPriority, MarketingBrand, MarketingProject, MarketingTask, MarketingTeamMember, MarketingViewer } from "@/types/marketing-api";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  viewer: MarketingViewer;
  defaultAssigneeId?: string;
  defaultType?: TaskType;
  initialTask?: MarketingTask | null;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreated,
  viewer,
  defaultAssigneeId,
  defaultType = "DAILY",
  initialTask,
}: CreateTaskModalProps) {
  const toast = useDnaToast();
  const canManage = viewer.roles.some((role) => ["SUPER_ADMIN", "HEAD_OPS", "MARKETING"].includes(role));
  const [brands, setBrands] = useState<MarketingBrand[]>([]);
  const [projects, setProjects] = useState<MarketingProject[]>([]);
  const [members, setMembers] = useState<MarketingTeamMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>(defaultType);
  const [projectId, setProjectId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>(defaultAssigneeId || "");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [channel, setChannel] = useState("Instagram");
  const [category, setCategory] = useState("content");
  const [outputUrl, setOutputUrl] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [brief, setBrief] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReferenceDataError(null);
      void Promise.all([
        marketingService.listBrands(viewer),
        marketingService.listProjects(viewer, { limit: 50 }),
        marketingService.listMembers(viewer),
      ]).then(([loadedBrands, loadedProjects, loadedMembers]) => {
        setBrands(loadedBrands);
        setProjects(loadedProjects.items);
        setMembers(loadedMembers);
        if (loadedBrands.length > 0 && !brandId && !initialTask) setBrandId(loadedBrands[0].id);
        if (loadedProjects.items.length > 0 && !projectId && !initialTask) setProjectId(loadedProjects.items[0].id);
        if (!initialTask && (!defaultAssigneeId || !canManage)) setAssigneeId(viewer.id);
      }).catch((error) => {
        setReferenceDataError(error instanceof Error ? error.message : "Data referensi tidak dapat dimuat.");
      });

      if (initialTask) {
        setTitle(initialTask.title || "");
        setType(initialTask.type || "DAILY");
        setProjectId(initialTask.projectId || "");
        setBrandId(initialTask.brandId || "");
        setAssigneeId(initialTask.assigneeId || defaultAssigneeId || viewer.id);
        setStartDate(initialTask.startDate ? initialTask.startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
        setDueDate(initialTask.dueDate ? initialTask.dueDate.split("T")[0] : new Date().toISOString().split("T")[0]);
        setPriority(initialTask.priority || "MEDIUM");
        setChannel(initialTask.channel || "Instagram");
        setCategory(initialTask.category || "content");
        setOutputUrl(initialTask.outputUrl || "");
        setReferenceUrl(initialTask.referenceUrl || "");
        setBrief(initialTask.brief || "");
      } else {
        setTitle("");
        setType(defaultType);
        setAssigneeId(!canManage ? viewer.id : defaultAssigneeId || viewer.id);
        const today = new Date().toISOString().split("T")[0];
        setStartDate(today);
        setDueDate(today);
        setPriority("MEDIUM");
        setChannel("Instagram");
        setCategory("content");
        setOutputUrl("");
        setReferenceUrl("");
        setBrief("");
      }
    }
  }, [isOpen, defaultAssigneeId, defaultType, initialTask, viewer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Nama task wajib diisi.");
      return;
    }
    if (!assigneeId) {
      toast.error("Pilih assignee yang terhubung ke akun ERP.");
      return;
    }

    setSubmitting(true);
    try {
      if (initialTask) {
        const updatePayload: UpdateTaskInput = {
          version: initialTask.version,
          type,
          title: title.trim(),
          projectId: type === "PROJECT" ? (projectId || undefined) : undefined,
          brandId: brandId || undefined,
          channel,
          category,
          assigneeId,
          priority,
          startDate,
          dueDate,
          outputUrl: outputUrl.trim() || undefined,
          referenceUrl: referenceUrl.trim() || undefined,
          brief: brief.trim() || undefined,
        };
        await marketingService.updateTask(viewer, initialTask.id, updatePayload);
        toast.success("Perubahan task berhasil disimpan.");
      } else {
        const createPayload: CreateTaskInput = {
          type,
          title: title.trim(),
          projectId: type === "PROJECT" ? (projectId || undefined) : undefined,
          brandId: brandId || undefined,
          channel,
          category,
          assigneeId,
          priority,
          startDate,
          dueDate,
          outputUrl: outputUrl.trim() || undefined,
          referenceUrl: referenceUrl.trim() || undefined,
          brief: brief.trim() || undefined,
          checklist: [],
        };
        await marketingService.createTask(viewer, createPayload, crypto.randomUUID());
        toast.success("Task baru berhasil ditambahkan.");
      }

      onCreated();
      onClose();
    } catch (err: any) {
      toast.error("Gagal menyimpan task: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = Boolean(initialTask);

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Task" : "Tambahkan Task Baru"}
      subtitle={isEdit ? "Perbarui informasi, jadwal, dan instruksi penugasan" : "Manajemen tugas tim Marketing & Media Sosial"}
      size="xl"
      badge={
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
          type === "PROJECT"
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-blue-50 text-blue-700 border border-blue-200"
        }`}>
          {type}
        </span>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="outline" onClick={onClose} disabled={submitting}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            icon={isEdit ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            onClick={handleSubmit}
            loading={submitting}
          >
            {isEdit ? "Simpan Perubahan" : "Simpan Task"}
          </DnaButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {referenceDataError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">{referenceDataError}</p>}
        {/* Task Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nama Task <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Analisis Leads Formulasi Skincare B2B"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition"
          />
        </div>

        {/* Type & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Task</label>
            <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => setType("DAILY")}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition ${
                  type === "DAILY"
                    ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Daily Task (Rutin)
              </button>
              <button
                type="button"
                onClick={() => setType("PROJECT")}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition ${
                  type === "PROJECT"
                    ? "bg-white text-amber-700 shadow-xs border border-amber-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Project Task (Milestone)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assignee PIC</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-xs font-semibold text-slate-800"
            >
              {(canManage ? members.filter((m) => m.userId) : [{ id: viewer.id, userId: viewer.id, name: viewer.name ?? "Saya", role: "Digital Marketing" }]).map((m) => (
                <option key={m.id} value={m.userId!}>
                  {m.name} — {m.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Name (if Project Type) & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {type === "PROJECT" ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Proyek Terkait</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-xs font-medium text-slate-800"
              >
                <option value="">-- Pilih Proyek --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Saluran / Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-xs font-medium text-slate-800"
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Website">Website</option>
                <option value="CRM">CRM / Direct</option>
                <option value="Paid Ads">Paid Ads</option>
                <option value="Team">Operasional Tim</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-xs font-semibold text-slate-800"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.handle || b.primaryPlatform})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Date, Due Date & Days Left preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sisa Waktu (Estimasi)</label>
            <div className="h-10 flex items-center px-3 rounded-xl border border-slate-200 bg-slate-50">
              <DnaDaysLeftChip dueDate={dueDate} />
            </div>
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Prioritas Task</label>
          <div className="grid grid-cols-4 gap-2">
            {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPriority(p)}
                className={`py-2 rounded-xl border text-xs font-bold transition ${
                  priority === p
                    ? p === "URGENT"
                      ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : p === "HIGH"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : p === "MEDIUM"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-800 text-white border-slate-800 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Deliverable URL & Reference URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Link Terkait / Deliverable (Figma, Drive, Doc)
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={outputUrl}
                onChange={(e) => setOutputUrl(e.target.value)}
                placeholder="https://drive.google.com/... atau https://figma.com/..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Link Referensi / Benchmark
            </label>
            <div className="relative">
              <Sparkles className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://instagram.com/p/... atau link kompetitor"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Brief Instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Brief & Instruksi Pengerjaan
          </label>
          <textarea
            rows={3}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Tuliskan objektif spesifik, deliverable yang diharapkan, angle konten, dan instruksi teknis..."
            className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed font-normal"
          />
        </div>
      </form>
    </DnaModal>
  );
}
