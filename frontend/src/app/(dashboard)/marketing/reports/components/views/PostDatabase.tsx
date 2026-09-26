"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
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
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Tanggal</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Judul</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Format</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Status</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">PIC</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Progress</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Hook</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Caption</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Sound Trend</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Views</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">ER%</DnaTh>
              <DnaTh className="text-left px-3 py-2 font-semibold whitespace-nowrap">Leads</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {posts.length === 0 && (
              <DnaTableRow><DnaTd colSpan={12} className="px-3 py-12 text-center text-slate-400">Database kosong.</DnaTd></DnaTableRow>
            )}
            {posts.map((p) => (
              <DnaTableRow key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.date}</DnaTd>
                <DnaTd className="px-3 py-2 font-medium max-w-xs truncate">{p.title}</DnaTd>
                <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.format}</DnaTd>
                <DnaTd className="px-3 py-2 whitespace-nowrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "Published" ? "bg-emerald-100 text-emerald-700" : p.status === "Late" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>{p.status}</span>
                </DnaTd>
                <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.pic ?? "—"}</DnaTd>
                <DnaTd className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${p.progress}%` }} /></div>
                    <span className="text-xs text-slate-500">{p.progress}%</span>
                  </div>
                </DnaTd>
                <DnaTd className="px-3 py-2 text-slate-600 max-w-xs truncate">{p.hook ?? "—"}</DnaTd>
                <DnaTd className="px-3 py-2 text-slate-600 max-w-xs truncate">{p.caption ?? "—"}</DnaTd>
                <DnaTd className="px-3 py-2 text-slate-600 max-w-xs truncate">{p.soundTrend ?? "—"}</DnaTd>
                <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.metrics?.views?.toLocaleString("id-ID") ?? "—"}</DnaTd>
                <DnaTd className="px-3 py-2 whitespace-nowrap">
                  {p.metrics?.engagementRate ? (
                    <span className={`font-semibold ${p.metrics.engagementRate >= 5 ? "text-emerald-600" : "text-slate-600"}`}>{p.metrics.engagementRate.toFixed(2)}%</span>
                  ) : "—"}
                </DnaTd>
                <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.metrics?.leadsContributed ?? "—"}</DnaTd>
              </DnaTableRow>
            ))}
          </DnaTableBody>
        </DnaTable>
      </div>
      <div className="text-xs text-slate-500">{posts.length} post di database</div>
    </div>
  );
}
