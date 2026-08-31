"use client";
export const dynamic = "force-dynamic";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
 TrendingUp, 
 Globe, 
 DollarSign, 
 Calendar, 
 Share2, 
 Eye, 
 MousePointer2, 
 Users,
 Zap,
 Target,
 Trophy,
 ChevronRight,
 ArrowRight,
 Sparkles,
 Info,
 AlertTriangle,
 History,
 Save,
 CheckCircle2
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { DnaButton } from "@/components/dna/DnaButton";
import { StatCard } from "@/components/dna/StatCard";
import { DnaInput } from "@/components/dna/DnaInput";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { SectionLabel } from "@/components/dna/SectionLabel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FormShell } from "@/components/layout/FormShell";

// --- TYPES ---
type Platform = "IG_ADS" | "TIKTOK_ADS" | "FB_ADS" | "GOOGLE_ADS" | "IG_ORGANIC" | "TIKTOK_ORGANIC" | "FB_ORGANIC";

interface AdsEntry {
 spend: number;
 impressions: number;
 reach: number;
 clicks: number;
 leadsGenerated: number;
}

interface OrganicEntry {
 totalFollowers: number;
 followerGrowth: number;
 unfollows: number;
 totalReach: number;
 profileVisits: number;
 postsCount: number;
 storiesCount: number;
 avgStoryViews: number;
 likesCount: number;
 commentsCount: number;
 savesCount: number;
 sharesCount: number;
}

function getCriticalCardClass(isCritical: boolean) {
 return isCritical
 ? "border-[#FECDD3] shadow-[0_0_0_1px_rgba(220,38,38,0.08),0_18px_40px_-16px_rgba(220,38,38,0.34)]"
 : "border-slate-200 shadow-sm";
}

export default function MarketingCommandCenter() {
 const [loading, setLoading] = useState(false);
 const [activeTab, setActiveTab] = useState("paid");
 const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
 const [baselineData, setBaselineData] = useState<any[]>([]);
 const [isDraftLoaded, setIsDraftLoaded] = useState(false);
 
 // --- PERMISSIONS ---
 const [user, setUser] = useState<any>(null);
 useEffect(() => {
 if (typeof window !== "undefined") {
 const savedUser = localStorage.getItem("user");
 if (savedUser) setUser(JSON.parse(savedUser));
 }
 }, []);

 const canEditTargets = useMemo(() => {
 return user?.role === "FINANCE" || user?.role === "SUPER_ADMIN";
 }, [user]);
 
 // --- STATE: PAID ADS MATRIX ---
 const [adsMatrix, setAdsMatrix] = useState<Record<string, AdsEntry>>({
 IG_ADS: { spend: 0, impressions: 0, reach: 0, clicks: 0, leadsGenerated: 0 },
 TIKTOK_ADS: { spend: 0, impressions: 0, reach: 0, clicks: 0, leadsGenerated: 0 },
 FB_ADS: { spend: 0, impressions: 0, reach: 0, clicks: 0, leadsGenerated: 0 },
 GOOGLE_ADS: { spend: 0, impressions: 0, reach: 0, clicks: 0, leadsGenerated: 0 },
 });

 // --- STATE: ORGANIC MATRIX ---
 const [organicMatrix, setOrganicMatrix] = useState<Record<string, OrganicEntry>>({
 IG_ORGANIC: { 
 totalFollowers: 0, followerGrowth: 0, unfollows: 0, totalReach: 0, profileVisits: 0,
 postsCount: 0, storiesCount: 0, avgStoryViews: 0, likesCount: 0, commentsCount: 0,
 savesCount: 0, sharesCount: 0 
 },
 TIKTOK_ORGANIC: { 
 totalFollowers: 0, followerGrowth: 0, unfollows: 0, totalReach: 0, profileVisits: 0,
 postsCount: 0, storiesCount: 0, avgStoryViews: 0, likesCount: 0, commentsCount: 0,
 savesCount: 0, sharesCount: 0 
 },
 FB_ORGANIC: { 
 totalFollowers: 0, followerGrowth: 0, unfollows: 0, totalReach: 0, profileVisits: 0,
 postsCount: 0, storiesCount: 0, avgStoryViews: 0, likesCount: 0, commentsCount: 0,
 savesCount: 0, sharesCount: 0 
 },
 });

 const [contentData, setContentData] = useState({
 publishDate: new Date().toISOString().split("T")[0],
 platform: "IG_ORGANIC",
 contentPillar: "EDUCATIONAL",
 title: "",
 url: "",
 views: 0,
 likes: 0,
 comments: 0,
 shares: 0,
 saves: 0
 });

 const [targetData, setTargetData] = useState({
 month: new Date().getMonth() + 1,
 year: new Date().getFullYear(),
 adBudget: 0,
 leadTarget: 0,
 postTarget: 0,
 revenueTarget: 0
 });

 // --- BASELINE FETCHING (H-1) ---
 useEffect(() => {
 const fetchBaseline = async () => {
 const yesterday = new Date(date);
 yesterday.setDate(yesterday.getDate() - 1);
 const isoDate = yesterday.toISOString().split('T')[0];
 try {
 const type = activeTab === 'paid' ? 'ADS' : 'ORGANIC';
 const res = await api.get(`/marketing/comparison?date=${isoDate}&type=${type}`);
 setBaselineData(res.data);
 } catch (e) {
 setBaselineData([]);
 }
 };
 if (activeTab === 'paid' || activeTab === 'organic') fetchBaseline();
 }, [date, activeTab]);

 // --- AUTO-SAVE & DRAFT RECOVERY ---
 useEffect(() => {
 if (typeof window !== "undefined") {
 const draftKey = `marketing_draft_${activeTab}`;
 const saved = localStorage.getItem(draftKey);
 if (saved && !isDraftLoaded) {
 const parsed = JSON.parse(saved);
 if (activeTab === "paid") setAdsMatrix(parsed);
 else if (activeTab === "organic") setOrganicMatrix(parsed);
 setIsDraftLoaded(true);
 }
 }
 }, [activeTab, isDraftLoaded]);

 useEffect(() => {
 if (isDraftLoaded) {
 const draftKey = `marketing_draft_${activeTab}`;
 const data = activeTab === "paid" ? adsMatrix : organicMatrix;
 localStorage.setItem(draftKey, JSON.stringify(data));
 }
 }, [adsMatrix, organicMatrix, activeTab, isDraftLoaded]);

 // --- KEYBOARD NAVIGATION ---
 const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
 if (e.key === "Enter") {
 e.preventDefault();
 const nextInput = document.querySelector(`[data-index="${index + 1}"]`) as HTMLInputElement;
 if (nextInput) {
 nextInput.focus();
 nextInput.select();
 } else {
 toast.info("End of matrix. Data is auto-saved locally.");
 }
 }
 };

 const pullPreviousData = () => {
 if (baselineData.length === 0) {
 toast.error("No H-1 data found to pull.");
 return;
 }
 if (activeTab === 'paid') {
 const newMatrix = { ...adsMatrix };
 baselineData.forEach(item => {
 if (newMatrix[item.platform]) {
 newMatrix[item.platform] = {
 spend: Number(item.spend),
 impressions: Number(item.impressions),
 reach: Number(item.reach),
 clicks: Number(item.clicks),
 leadsGenerated: Number(item.leadsGenerated)
 };
 }
 });
 setAdsMatrix(newMatrix);
 } else {
 const newMatrix = { ...organicMatrix };
 baselineData.forEach(item => {
 if (newMatrix[item.platform]) {
 newMatrix[item.platform] = {
 ...newMatrix[item.platform],
 totalFollowers: Number(item.totalFollowers),
 totalReach: Number(item.totalReach)
 };
 }
 });
 setOrganicMatrix(newMatrix);
 }
 toast.success("H-1 data populated into current matrix.");
 };

 // --- SUBMISSION ---
 const submitAds = async () => {
 setLoading(true);
 try {
 const entries = Object.entries(adsMatrix)
 .filter(([_, data]) => data.spend > 0 || data.impressions > 0)
 .map(([platform, data]) => api.post("/marketing/daily-ads", { ...data, platform, date }));

 if (entries.length === 0) {
 toast.error("No data found for any platform.");
 return;
 }

 await Promise.all(entries);
 toast.success("Ads cloud-sync successful!");
 localStorage.removeItem("marketing_draft_paid");
 } catch (err) {
 toast.error("Sync failed");
 } finally {
 setLoading(false);
 }
 };

 const submitOrganic = async () => {
 setLoading(true);
 try {
 const selectedDate = new Date(date);
 const getWeek = (d: Date) => {
 const start = new Date(d.getFullYear(), 0, 1);
 return Math.ceil((((d.getTime() - start.getTime()) / 86400000) + 1) / 7);
 };

 const entries = Object.entries(organicMatrix)
 .filter(([_, data]) => data.totalFollowers > 0 || data.totalReach > 0)
 .map(([platform, data]) => api.post("/marketing/weekly-organic", { 
 ...data, 
 platform, 
 date,
 year: selectedDate.getFullYear(),
 weekNumber: getWeek(selectedDate)
 }));

 await Promise.all(entries);
 toast.success("Organic health sync successful!");
 localStorage.removeItem("marketing_draft_organic");
 } catch (err) {
 toast.error("Sync failed");
 } finally {
 setLoading(false);
 }
 };

 const submitContent = async () => {
 setLoading(true);
 try {
 await api.post("/marketing/content-asset", contentData);
 toast.success("Content asset recorded!");
 setContentData({ ...contentData, title: "", url: "", views: 0, likes: 0, comments: 0, shares: 0, saves: 0 });
 } catch (err) {
 toast.error("Failed to record Content Asset");
 } finally {
 setLoading(false);
 }
 };

 const submitTargets = async () => {
 setLoading(true);
 try {
 await api.post("/marketing/targets", targetData);
 toast.success("Monthly targets set!");
 } catch (err) {
 toast.error("Failed to set targets");
 } finally {
 setLoading(false);
 }
 };

 // --- AGGREGATIONS ---
 const totals = useMemo(() => {
 const s = Object.values(adsMatrix).reduce((a, c) => a + c.spend, 0);
 const l = Object.values(adsMatrix).reduce((a, c) => a + c.leadsGenerated, 0);
 const c = Object.values(adsMatrix).reduce((a, c) => a + c.clicks, 0);
 const i = Object.values(adsMatrix).reduce((a, c) => a + c.impressions, 0);
 return { s, l, c, i };
 }, [adsMatrix]);

 const paidDataMissing = totals.s === 0 && totals.l === 0 && totals.c === 0 && totals.i === 0;
 const ctr = totals.i > 0 ? (totals.c / totals.i) * 100 : 0;
 const cpa = totals.l > 0 ? totals.s / totals.l : 0;
 const paidEfficiencyCritical = totals.i > 0 && ctr < 1.2;
 const paidCostCritical = totals.l > 0 && cpa > 150000;

 const organicTotals = useMemo(() => ({
 followers: Object.values(organicMatrix).reduce((a, c) => a + c.totalFollowers, 0),
 reach: Object.values(organicMatrix).reduce((a, c) => a + c.totalReach, 0),
 posts: Object.values(organicMatrix).reduce((a, c) => a + c.postsCount, 0),
 engagement:
 Object.values(organicMatrix).reduce(
 (a, c) => a + c.likesCount + c.commentsCount + c.savesCount + c.sharesCount,
 0
 ),
 }), [organicMatrix]);

 const organicDataMissing =
 organicTotals.followers === 0 &&
 organicTotals.reach === 0 &&
 organicTotals.posts === 0 &&
 organicTotals.engagement === 0;
 const contentIncomplete = !contentData.title.trim() || !contentData.url.trim();
 const targetsIncomplete =
 targetData.revenueTarget <= 0 ||
 targetData.leadTarget <= 0 ||
 targetData.postTarget <= 0 ||
 targetData.adBudget <= 0;

 return (
 <FormShell
 title="MARKETING"
 titleAccent="OPERATIONS HUB"
 subtitle="Executive Command Matrix v5.4"
 fullWidth
 actions={
 <div className="flex items-center gap-4">
 <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-5 py-3 flex items-center gap-4 transition-all hover:border-blue-400">
 <Calendar className="w-5 h-5 text-blue-600" />
 <input 
 type="date" 
 value={date} 
 onChange={(e) => setDate(e.target.value)}
 className="bg-transparent border-none outline-none font-black text-sm text-slate-700"
 />
 </div>
 
 <div className="h-10 w-[1px] bg-slate-200 mx-2 hidden md:block" />

 <DnaButton
 variant="outline"
 onClick={pullPreviousData}
 icon={<History className="w-4 h-4" />}
 >
 Pull H-1
 </DnaButton>

 <DnaButton
 variant="primary"
 size="lg"
 disabled={loading}
 onClick={activeTab === "paid" ? submitAds : submitOrganic}
 icon={loading ? undefined : <Save className="w-5 h-5" />}
 className=" blue-200 active:scale-95"
 >
 {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sync to Cloud"}
 </DnaButton>
 </div>
 }
 >
 <TooltipProvider>
 <div className="w-full max-w-[1400px] mt-4">
 <Tabs defaultValue="paid" className="space-y-8" onValueChange={(val) => { setActiveTab(val); setIsDraftLoaded(false); }}>
 
 <div className="flex items-center justify-between">
 <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
 <TabsTrigger value="paid" className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
 Paid Analytics
 </TabsTrigger>
 <TabsTrigger value="organic" className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
 Organic Health
 </TabsTrigger>
 <TabsTrigger value="content" className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
 Content Asset
 </TabsTrigger>
 <TabsTrigger value="targets" className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
 KPI Targets
 </TabsTrigger>
 </TabsList>

 <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span className="text-[11px] font-bold uppercase tracking-tight">Auto-Save Active</span>
 </div>
 </div>

 <TabsContent value="paid" className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <StatCard
 label="Aggregated Spend"
 value={`Rp ${totals.s.toLocaleString()}`}
 icon={<DollarSign />}
 subValue="Budget feed ready"
 className={paidDataMissing ? `${getCriticalCardClass(true)} [&_h3]:text-[#DC2626]` : undefined}
 />
 <StatCard
 label="Leads Acquired"
 value={totals.l}
 icon={<Users />}
 subValue="Lead stream detected"
 className={paidDataMissing ? `${getCriticalCardClass(true)} [&_h3]:text-[#DC2626]` : undefined}
 />
 <StatCard
 label="Efficiency (CTR)"
 value={`${totals.i > 0 ? ctr.toFixed(2) : 0}%`}
 icon={<TrendingUp />}
 subValue="CTR within normal range"
 className={paidEfficiencyCritical ? `${getCriticalCardClass(true)} [&_h3]:text-[#DC2626]` : undefined}
 />
 <StatCard
 label="Avg. CPA"
 value={`Rp ${totals.l > 0 ? cpa.toLocaleString() : 0}`}
 icon={<Target />}
 subValue="Acquisition cost stable"
 className={paidCostCritical ? `${getCriticalCardClass(true)} [&_h3]:text-[#DC2626]` : undefined}
 />
 </div>

 <Card className={`rounded-2xl overflow-hidden bg-white ${getCriticalCardClass(paidDataMissing)}`}>
 <div className="overflow-x-auto">
 <TableWrapper>
 <table className="w-full border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-200">
 <th className="p-4 text-left w-64">
 <span className="text-table-header text-slate-400">Performance Metric</span>
 </th>
 {Object.keys(adsMatrix).map((p) => (
 <th key={p} className="p-4 text-center min-w-[180px]">
 <div className="flex flex-col items-center gap-0.5">
 <span className="text-[11px] font-bold tracking-tight text-slate-900">{p.split('_')[0]}</span>
 <DnaBadge status="info">Paid Feed</DnaBadge>
 </div>
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 <MatrixRow 
 label="Ad Spend" 
 icon={DollarSign} 
 platforms={Object.keys(adsMatrix)} 
 field="spend" 
 matrix={adsMatrix} 
 setMatrix={setAdsMatrix} 
 onKeyDown={handleKeyDown}
 startIdx={100}
 prefix="Rp"
 baseline={baselineData}
 important
 />
 <MatrixRow 
 label="Impressions" 
 icon={Eye} 
 platforms={Object.keys(adsMatrix)} 
 field="impressions" 
 matrix={adsMatrix} 
 setMatrix={setAdsMatrix} 
 onKeyDown={handleKeyDown}
 startIdx={200}
 baseline={baselineData}
 />
 <MatrixRow 
 label="Clicks" 
 icon={MousePointer2} 
 platforms={Object.keys(adsMatrix)} 
 field="clicks" 
 matrix={adsMatrix} 
 setMatrix={setAdsMatrix} 
 onKeyDown={handleKeyDown}
 startIdx={400}
 baseline={baselineData}
 showCalc={(p: string) => {
 const ad = adsMatrix[p];
 if (ad.impressions > 0) return `CTR: ${((ad.clicks / ad.impressions)*100).toFixed(1)}%`;
 return null;
 }}
 />
 <MatrixRow 
 label="Leads Generated" 
 icon={Users} 
 platforms={Object.keys(adsMatrix)} 
 field="leadsGenerated" 
 matrix={adsMatrix} 
 setMatrix={setAdsMatrix} 
 onKeyDown={handleKeyDown}
 startIdx={500}
 baseline={baselineData}
 accent="text-emerald-600"
 showCalc={(p: string) => {
 const ad = adsMatrix[p];
 if (ad.leadsGenerated > 0) return `CPL: Rp ${(ad.spend / ad.leadsGenerated).toLocaleString()}`;
 return null;
 }}
 />
 </tbody>
 </table>
 </TableWrapper>
 </div>
 </Card>
 </TabsContent>

 <TabsContent value="organic" className="mt-0">
 <Card className={`rounded-2xl overflow-hidden bg-white ${getCriticalCardClass(organicDataMissing)}`}>
 <div className="overflow-x-auto">
 <TableWrapper>
 <table className="w-full border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-200">
 <th className="p-4 text-left w-72">
 <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Growth & Engagement</span>
 </th>
 {Object.keys(organicMatrix).map((p) => (
 <th key={p} className="p-4 text-center min-w-[200px]">
 <span className="text-sm font-bold tracking-tight text-slate-900">{p.split('_')[0]}</span>
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 <MatrixRow label="Total Followers" icon={Users} platforms={Object.keys(organicMatrix)} field="totalFollowers" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={1000} baseline={baselineData} />
 <MatrixRow label="Follower Growth" icon={TrendingUp} platforms={Object.keys(organicMatrix)} field="followerGrowth" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={1100} accent="text-emerald-600" />
 <MatrixRow label="Unfollows" icon={Users} platforms={Object.keys(organicMatrix)} field="unfollows" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={1200} accent="text-rose-600" />
 
 <tr className="bg-slate-50/30">
 <td colSpan={4} className="p-5 px-10">
 <SectionLabel as="span">Content Vitality</SectionLabel>
 </td>
 </tr>
 
 <MatrixRow label="Posts Created" icon={ChevronRight} platforms={Object.keys(organicMatrix)} field="postsCount" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={1400} />
 <MatrixRow label="Stories Created" icon={ChevronRight} platforms={Object.keys(organicMatrix)} field="storiesCount" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={1500} />
 <MatrixRow label="Total Reach" icon={Globe} platforms={Object.keys(organicMatrix)} field="totalReach" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={1300} baseline={baselineData} />
 
 <tr className="bg-slate-50/30">
 <td colSpan={4} className="p-5 px-10">
 <SectionLabel as="span">Engagement Sum</SectionLabel>
 </td>
 </tr>
 
 <MatrixRow label="Likes" icon={Share2} platforms={Object.keys(organicMatrix)} field="likesCount" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={1700} />
 <MatrixRow label="Comments" icon={Share2} platforms={Object.keys(organicMatrix)} field="commentsCount" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={1800} />
 <MatrixRow label="Saves" icon={Share2} platforms={Object.keys(organicMatrix)} field="savesCount" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={1900} />
 <MatrixRow label="Shares" icon={Share2} platforms={Object.keys(organicMatrix)} field="sharesCount" matrix={organicMatrix} setMatrix={setOrganicMatrix} onKeyDown={handleKeyDown} startIdx={2000} />
 </tbody>
 </table>
 </TableWrapper>
 </div>
 </Card>
 </TabsContent>

 <TabsContent value="content">
 <Card className={`p-6 bg-white rounded-2xl relative overflow-hidden ${contentIncomplete ? `${getCriticalCardClass(true)} [&_h2]:text-[#DC2626] [&_.content-critical]:text-[#DC2626]` : getCriticalCardClass(false)}`}>
 <div className="absolute top-0 right-0 p-6 text-blue-50/40 rotate-12"><Sparkles size={120} /></div>
 <div className="relative z-10 w-full space-y-8">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-100">
 <TrendingUp className="text-white w-6 h-6" />
 </div>
 <div>
 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Content <span className={contentIncomplete ? "content-critical" : "text-blue-600"}>Performance</span></h2>
 <p className="text-xs font-medium text-slate-500">Audit individual posts for conversion and engagement</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">Asset Title</Label>
 <DnaInput 
 value={contentData.title} 
 onChange={(e) => setContentData({...contentData, title: e.target.value})}
 placeholder="e.g. Nex Serum Launch" 
 className="font-bold text-lg" 
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">URL Reference</Label>
 <DnaInput 
 value={contentData.url} 
 onChange={(e) => setContentData({...contentData, url: e.target.value})}
 placeholder="Instagram.com/p/..." 
 className="font-bold text-blue-600" 
 />
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 {["views", "likes", "comments", "shares", "saves"].map((f) => (
 <div key={f} className="space-y-2">
 <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">{f}</Label>
 <DnaInput 
 type="number" 
 value={(contentData as any)[f] || ""}
 onChange={(e) => setContentData({...contentData, [f]: Number(e.target.value)})}
 className="font-black text-center text-xl" 
 />
 </div>
 ))}
 </div>

 <DnaButton variant="primary" onClick={submitContent} disabled={loading} className="w-full">
 Record Asset Logic
 </DnaButton>
 </div>
 </Card>
 </TabsContent>

 <TabsContent value="targets">
 <Card className={`p-6 bg-white rounded-2xl overflow-hidden ${targetsIncomplete ? `${getCriticalCardClass(true)} [&_h3]:text-[#DC2626] [&_.target-critical]:text-[#DC2626]` : getCriticalCardClass(false)}`}>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="space-y-8">
 <div className="space-y-1">
 <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Fiscal <span className={targetsIncomplete ? "target-critical" : "text-blue-600"}>KPIs</span></h3>
 <p className="text-xs font-medium text-slate-400">Set the benchmark for current marketing period</p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
 <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Active Month</Label>
 <DnaInput disabled={!canEditTargets} type="number" value={targetData.month} onChange={(e) => setTargetData({...targetData, month: Number(e.target.value)})} className="font-black text-blue-600 text-xl text-center" />
 </div>
 <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
 <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Fiscal Year</Label>
 <DnaInput disabled={!canEditTargets} type="number" value={targetData.year} onChange={(e) => setTargetData({...targetData, year: Number(e.target.value)})} className="font-black text-blue-600 text-xl text-center" />
 </div>
 </div>

 <div className="space-y-3">
 <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-2">Revenue Target (IDR)</Label>
 <div className="relative">
 <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">Rp</span>
 <DnaInput disabled={!canEditTargets} type="number" value={targetData.revenueTarget} onChange={(e) => setTargetData({...targetData, revenueTarget: Number(e.target.value)})} className="h-16 pl-16 bg-blue-50/50 border-blue-100 rounded-xl font-black text-3xl text-blue-600 focus:ring-4 focus:ring-blue-50" />
 </div>
 </div>

 </div>

 <div className="bg-blue-600 rounded-2xl p-6 text-white flex flex-col justify-between relative">
 <div className="absolute -right-6 -top-4 opacity-5"><Trophy size={140} /></div>
 
 <div className="space-y-8">
 <h4 className="text-lg font-bold uppercase tracking-widest text-blue-200">Quota Mapping</h4>
 <div className="space-y-4">
 <QuotaRow disabled={!canEditTargets} label="Qualified Leads" value={targetData.leadTarget} onChange={(v) => setTargetData({...targetData, leadTarget: v})} />
 <QuotaRow disabled={!canEditTargets} label="Content Posts" value={targetData.postTarget} onChange={(v) => setTargetData({...targetData, postTarget: v})} />
 <QuotaRow disabled={!canEditTargets} label="Ad Budget (Daily)" value={targetData.adBudget} onChange={(v) => setTargetData({...targetData, adBudget: v})} />
 </div>
 </div>

 <DnaButton variant="outline" disabled={loading || !canEditTargets} onClick={submitTargets} className="w-full mt-8 text-blue-600 border-blue-200 hover:bg-blue-50 shadow-blue-900/40">
 Commit Targets
 </DnaButton>
 </div>
 </div>
 </Card>
 </TabsContent>
 </Tabs>

 {/* 5. FOOTER CONTEXT */}
 <div className="mt-8 flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
 <Info className="w-5 h-5 text-blue-600" />
 </div>
 <div className="space-y-0.5">
 <p className="text-md font-bold text-slate-900 uppercase tracking-tight">Operation Protocol v2.4</p>
 <p className="text-[11px] text-slate-500 font-medium max-w-md">Data entries are mirrored locally. Comparison (H-1) indicators are pulled automatically.</p>
 </div>
 </div>
 <div className="mt-4 md:mt-0 flex items-center gap-3">
 <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-400">
 Latency: <span className="text-emerald-600">12ms</span>
 </div>
 <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-400">
 Region: <span className="text-blue-600">ID-JKT</span>
 </div>
 </div>
 </div>
 </div>
 </TooltipProvider>
 </FormShell>
 );
}

// --- SUB-COMPONENTS ---

function QuotaRow({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled?: boolean }) {
 return (
 <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${disabled ? 'bg-white/5 border-white/5 opacity-50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
 <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{label}</span>
 <Input 
 disabled={disabled}
 type="number" 
 value={value || ""} 
 onChange={(e) => onChange(Number(e.target.value))} 
 className="w-32 h-8 bg-transparent border-none text-right font-black text-xl text-white outline-none focus:ring-0" 
 />
 </div>
 );
}

function MatrixRow({ label, icon: Icon, platforms, field, matrix, setMatrix, onKeyDown, startIdx, prefix, important, accent, baseline, showCalc }: any) {
 return (
 <tr className="group hover:bg-slate-50 transition-colors even:bg-slate-50/20">
 <td className="p-4 border-b border-slate-100">
 <div className="flex items-center gap-3">
 <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm group-hover:border-blue-200 transition-all">
 <Icon className="w-3.5 h-3.5" />
 </div>
 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{label}</span>
 </div>
 </td>
 {platforms.map((p: string, i: number) => {
 const val = (matrix[p] as any)[field];
 const base = baseline?.find((b: any) => b.platform === p);
 const baseVal = base ? Number(base[field]) : null;
 
 // Outlier detection (5x higher than baseline)
 const isOutlier = baseVal !== null && baseVal > 0 && val > baseVal * 5;

 return (
 <td key={p} className="p-4 border-b border-slate-100 text-center">
 <div className="relative space-y-1.5">
 {prefix && <span className="absolute left-4 top-[18px] -translate-y-1/2 text-[10px] font-bold text-slate-300">{prefix}</span>}
 <Input 
 type="number"
 data-index={startIdx + i}
 value={val || ""}
 onChange={(e) => setMatrix({
 ...matrix,
 [p]: { ...matrix[p], [field]: Number(e.target.value) }
 })}
 onKeyDown={(e) => onKeyDown(e, startIdx + i)}
 className={`
 h-9 w-full border-slate-200 rounded-xl font-bold text-center transition-all text-[11px] tabular-nums
 focus:ring-2 focus:ring-blue-100 focus:bg-white
 ${important ? "bg-blue-50/50 text-blue-700" : "bg-white"}
 ${isOutlier ? "ring-2 ring-orange-400 bg-orange-50" : ""}
 ${accent || ""}
 ${prefix ? "pl-8" : ""}
 `}
 />
 
 {/* H-1 REFERENCE & LIVE CALCS */}
 <div className="flex items-center justify-between px-1">
 <div className="text-[10px] font-bold text-slate-400">
 {baseVal !== null ? `H-1: ${baseVal.toLocaleString()}` : "-"}
 </div>
 {showCalc && val > 0 && (
 <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">
 {showCalc(p)}
 </div>
 )}
 {isOutlier && (
 <Tooltip>
 <TooltipTrigger>
 <AlertTriangle className="w-3 h-3 text-orange-500" />
 </TooltipTrigger>
 <TooltipContent className="bg-orange-600 text-white font-black text-[10px] uppercase">
 High Variance Detected
 </TooltipContent>
 </Tooltip>
 )}
 </div>
 </div>
 </td>
 );
 })}
 </tr>
 );
}

