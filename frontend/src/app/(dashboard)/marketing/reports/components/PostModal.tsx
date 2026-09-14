"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Upload } from "lucide-react";
import { DnaButton, DnaDrawer, DnaInput, DnaSelect, DnaTextarea } from "@/components/dna";
import { useDnaToast } from "@/components/dna/DnaToast";
import { marketingService, mockViewer } from "@/lib/services/marketing-service";
import type { PostPlatform, PostFormat, PostStatus, MarketingBrand, SocialPost } from "@/types/marketing-api";

const PLATFORMS: PostPlatform[] = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Website", "Paid Ads"];
const FORMATS: PostFormat[] = ["Reels", "Carousel", "Single", "Story", "TikTok", "Video", "Shorts"];
const STATUSES: PostStatus[] = ["Planning", "Brief", "Draft", "Production", "Review", "Published", "Late"];

export default function PostModal({
  isOpen,
  onClose,
  brand,
  channel,
  initialDate,
  initialPost,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  brand: string;
  channel: PostPlatform;
  initialDate?: string;
  initialPost?: SocialPost;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const toast = useDnaToast();
  const [brands, setBrands] = useState<MarketingBrand[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState({
    brandId: brand,
    platform: channel,
    title: initialPost?.title ?? "",
    date: initialDate ?? new Date().toISOString().slice(0, 10),
    format: (initialPost?.format ?? "Reels") as PostFormat,
    status: (initialPost?.status ?? "Planning") as PostStatus,
    pic: initialPost?.pic ?? "",
    progress: initialPost?.progress ?? 0,
    hook: initialPost?.hook ?? "",
    soundTrend: initialPost?.soundTrend ?? "",
    caption: initialPost?.caption ?? "",
    brief: initialPost?.brief ?? "",
    reference: initialPost?.reference ?? "",
  });

  useEffect(() => {
    if (isOpen) {
      marketingService.listBrands(mockViewer).then(setBrands);
    }
  }, [isOpen]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!form.brief.trim()) {
      toast.error("Tulis brief/topik dulu sebelum generate AI.");
      return;
    }
    setAiLoading(true);
    try {
      const result = await marketingService.generateBrief(mockViewer, {
        brandId: form.brandId,
        platform: form.platform,
        format: form.format,
        topic: form.brief,
      });
      updateField("hook", result.hook);
      updateField("caption", result.caption);
      updateField("brief", result.brief);
      toast.success("AI (beta) generated hook + caption + brief.");
    } catch (e: unknown) {
      toast.error("AI generate gagal: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!initialPost) return;
    try {
      await marketingService.uploadPostImage(mockViewer, initialPost.id, file);
      toast.success("Image uploaded.");
    } catch (e: unknown) {
      toast.error("Upload gagal: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Judul wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (initialPost) {
        await marketingService.updatePost(mockViewer, initialPost.id, { version: 1, ...form });
        toast.success("Post diperbarui.");
      } else {
        await marketingService.createPost(mockViewer, form);
        toast.success("Post dibuat.");
      }
      onSaved?.();
      onClose();
      router.refresh();
    } catch (e: unknown) {
      toast.error("Gagal simpan: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DnaDrawer isOpen={isOpen} onClose={onClose} title={initialPost ? "Edit Post" : "Buat Post Baru"} size="md">
      <div className="space-y-4">
        <DnaSelect label="Brand" options={brands.map((b) => ({ value: b.id, label: b.name }))} value={form.brandId} onChange={(v: string) => updateField("brandId", v)} required />
        <div className="grid grid-cols-2 gap-3">
          <DnaSelect label="Platform" options={PLATFORMS.map((p) => ({ value: p, label: p }))} value={form.platform} onChange={(v: string) => updateField("platform", v as PostPlatform)} required />
          <DnaSelect label="Format" options={FORMATS.map((f) => ({ value: f, label: f }))} value={form.format} onChange={(v: string) => updateField("format", v as PostFormat)} required />
        </div>
        <DnaInput label="Judul" value={form.title} onChange={(e) => updateField("title", e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <DnaInput label="Tanggal" type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} required />
          <DnaSelect label="Status" options={STATUSES.map((s) => ({ value: s, label: s }))} value={form.status} onChange={(v: string) => updateField("status", v as PostStatus)} />
        </div>
        <DnaInput label="PIC" value={form.pic} onChange={(e) => updateField("pic", e.target.value)} />
        <div>
          <label className="text-xs font-medium text-slate-700">Progress: {form.progress}%</label>
          <input type="range" min={0} max={100} value={form.progress} onChange={(e) => updateField("progress", Number(e.target.value))} className="w-full" />
        </div>
        <div className="flex items-center gap-2">
          <DnaInput label="Hook" value={form.hook} onChange={(e) => updateField("hook", e.target.value)} />
          <DnaButton variant="outline" size="sm" icon={<Sparkles className="h-4 w-4" />} onClick={handleGenerate} disabled={aiLoading} className="mt-5">
            {aiLoading ? "Generating..." : "AI (beta)"}
          </DnaButton>
        </div>
        {form.platform === "TikTok" && (
          <DnaInput label="Sound Trend" value={form.soundTrend} onChange={(e) => updateField("soundTrend", e.target.value)} />
        )}
        <DnaTextarea label="Brief" rows={3} value={form.brief} onChange={(e) => updateField("brief", e.target.value)} />
        <DnaTextarea label="Caption" rows={3} value={form.caption} onChange={(e) => updateField("caption", e.target.value)} />
        <DnaInput label="Reference URL" value={form.reference} onChange={(e) => updateField("reference", e.target.value)} />
        {initialPost && (
          <div>
            <label className="text-xs font-medium text-slate-700">Image Upload</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="text-sm" />
              <Upload className="h-4 w-4 text-emerald-600" />
            </div>
            {initialPost.imageUrl && <div className="mt-2 text-xs text-slate-500">Current: {initialPost.imageUrl}</div>}
          </div>
        )}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <DnaButton variant="outline" onClick={onClose} icon={<X className="h-4 w-4" />}>Batal</DnaButton>
          <DnaButton variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : initialPost ? "Perbarui" : "Buat"}
          </DnaButton>
        </div>
      </div>
    </DnaDrawer>
  );
}
