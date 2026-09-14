"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DnaButton } from "@/components/dna";
import { marketingService, mockViewer } from "@/lib/services/marketing-service";
import type { SocialPost, PostPlatform } from "@/types/marketing-api";

export default function PostDatabase({ brand, channel }: { brand: string; channel: PostPlatform }) {
  const [posts, setPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    marketingService.listPosts(mockViewer, { brandId: brand, channel }).then((r: { items: SocialPost[] }) => setPosts(r.items));
  }, [brand, channel]);

  const newPostHref = `/marketing/reports/${brand}/${channel.toLowerCase().replace(/ /g, "-")}/new`;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link href={newPostHref}>
          <DnaButton variant="primary" icon={<Plus className="h-4 w-4" />}>Buat Post</DnaButton>
        </Link>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Tanggal</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Judul</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Format</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Status</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">PIC</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Progress</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Hook</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Caption</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Sound Trend</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Views</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">ER%</th>
              <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Leads</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr><td colSpan={12} className="px-3 py-12 text-center text-slate-400">Database kosong.</td></tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.date}</td>
                <td className="px-3 py-2 font-medium max-w-xs truncate">{p.title}</td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.format}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "Published" ? "bg-emerald-100 text-emerald-700" : p.status === "Late" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>{p.status}</span>
                </td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.pic ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${p.progress}%` }} /></div>
                    <span className="text-xs text-slate-500">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{p.hook ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{p.caption ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{p.soundTrend ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.metrics?.views?.toLocaleString("id-ID") ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {p.metrics?.engagementRate ? (
                    <span className={`font-semibold ${p.metrics.engagementRate >= 5 ? "text-emerald-600" : "text-slate-600"}`}>{p.metrics.engagementRate.toFixed(2)}%</span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.metrics?.leadsContributed ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-500">{posts.length} post di database</div>
    </div>
  );
}
