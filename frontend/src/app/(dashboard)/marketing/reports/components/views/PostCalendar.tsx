"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { DnaButton } from "@/components/dna";
import { marketingService, mockViewer } from "@/lib/services/marketing-service";
import type { SocialPost, PostPlatform, PostStatus } from "@/types/marketing-api";

const STATUS_COLORS: Record<PostStatus, string> = {
  Planning: "border-slate-300 bg-slate-50 text-slate-700",
  Brief: "border-blue-300 bg-blue-50 text-blue-700",
  Draft: "border-violet-300 bg-violet-50 text-violet-700",
  Production: "border-amber-300 bg-amber-50 text-amber-800",
  Review: "border-yellow-300 bg-yellow-50 text-yellow-800",
  Published: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Late: "border-rose-300 bg-rose-50 text-rose-700",
};

const PLATFORM_ICON: Record<PostPlatform, string> = {
  Instagram: "IG", TikTok: "TT", YouTube: "YT", LinkedIn: "IN", Website: "WB", "Paid Ads": "AD",
};

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function PostCalendar({ brand, channel }: { brand: string; channel: PostPlatform }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [posts, setPosts] = useState<SocialPost[]>([]);

  useMemo(() => {
    marketingService.listPosts(mockViewer, { brandId: brand, channel }).then((r: { items: SocialPost[] }) => setPosts(r.items));
  }, [brand, channel]);

  const monthName = new Date(year, month).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: Array<{ day: number | null; date: string | null }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, date: dateStr });
  }

  const postsByDate = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    posts.forEach((p) => {
      if (!map.has(p.date)) map.set(p.date, []);
      map.get(p.date)!.push(p);
    });
    return map;
  }, [posts]);

  const goPrev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const goNext = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const newPostHref = `/marketing/reports/${brand}/${channel.toLowerCase().replace(/ /g, "-")}/new?date=${year}-${String(month + 1).padStart(2, "0")}-01`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="h-5 w-5" /></button>
          <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
          <button onClick={goNext} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <Link href={newPostHref}>
          <DnaButton variant="primary" icon={<Plus className="h-4 w-4" />}>Buat Post</DnaButton>
        </Link>
      </div>
      <div className="grid grid-cols-7 border border-slate-200 rounded-xl overflow-hidden bg-white">
        {DAYS.map((d) => (
          <div key={d} className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">{d}</div>
        ))}
        {cells.map((c, i) => (
          <div key={i} className={`min-h-[110px] p-1.5 border-r border-b border-slate-100 last:border-r-0 ${c.day === null ? "bg-slate-50/50" : "bg-white"}`}>
            {c.day !== null && (
              <>
                <div className="text-xs text-slate-500 mb-1">{c.day}</div>
                <div className="space-y-1">
                  {(postsByDate.get(c.date!) ?? []).slice(0, 3).map((p) => (
                    <div key={p.id} className={`text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate ${STATUS_COLORS[p.status]}`} title={`${p.title} — ${p.status}`}>
                      <span className="font-bold mr-1">{PLATFORM_ICON[p.platform]}</span>{p.title}
                    </div>
                  ))}
                  {(postsByDate.get(c.date!) ?? []).length > 3 && (
                    <div className="text-[10px] text-slate-500">+{postsByDate.get(c.date!)!.length - 3} lagi</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <span key={s} className={`px-2 py-1 rounded border ${c}`}>{s}</span>
        ))}
      </div>
    </div>
  );
}
