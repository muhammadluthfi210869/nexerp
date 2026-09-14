"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { DnaButton, DnaInput } from "@/components/dna";
import { marketingService, mockViewer } from "@/lib/services/marketing-service";
import type { SocialPost, PostPlatform, PostStatus } from "@/types/marketing-api";

const STATUSES: PostStatus[] = ["Planning", "Brief", "Draft", "Production", "Review", "Published", "Late"];

export default function PostPlanner({ brand, channel }: { brand: string; channel: PostPlatform }) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    marketingService.listPosts(mockViewer, { brandId: brand, channel }).then((r: { items: SocialPost[] }) => setPosts(r.items));
  }, [brand, channel]);

  const filtered = useMemo(() => {
    let items = posts;
    if (statusFilter !== "all") items = items.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.title.toLowerCase().includes(q) || (p.pic?.toLowerCase().includes(q) ?? false));
    }
    return items;
  }, [posts, statusFilter, search]);

  const newPostHref = `/marketing/reports/${brand}/${channel.toLowerCase().replace(/ /g, "-")}/new`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DnaButton variant={statusFilter === "all" ? "primary" : "outline"} size="sm" onClick={() => setStatusFilter("all")} icon={<Filter className="h-3 w-3" />}>
          Semua
        </DnaButton>
        {STATUSES.map((s) => (
          <DnaButton key={s} variant={statusFilter === s ? "primary" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>{s}</DnaButton>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <DnaInput type="search" placeholder="Cari post..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} />
          <Link href={newPostHref}>
            <DnaButton variant="primary" icon={<Plus className="h-4 w-4" />}>Buat Post</DnaButton>
          </Link>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Tanggal</th>
              <th className="text-left px-3 py-2 font-semibold">Judul</th>
              <th className="text-left px-3 py-2 font-semibold">Format</th>
              <th className="text-left px-3 py-2 font-semibold">Status</th>
              <th className="text-left px-3 py-2 font-semibold">PIC</th>
              <th className="text-left px-3 py-2 font-semibold">Progress</th>
              <th className="text-left px-3 py-2 font-semibold">Hook</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">Belum ada post untuk filter ini.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-600">{p.date}</td>
                <td className="px-3 py-2 font-medium">{p.title}</td>
                <td className="px-3 py-2 text-slate-600">{p.format}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "Published" ? "bg-emerald-100 text-emerald-700" : p.status === "Late" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>{p.status}</span>
                </td>
                <td className="px-3 py-2 text-slate-600">{p.pic ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${p.progress}%` }} /></div>
                    <span className="text-xs text-slate-500">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{p.hook ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-500">Menampilkan {filtered.length} dari {posts.length} post</div>
    </div>
  );
}
