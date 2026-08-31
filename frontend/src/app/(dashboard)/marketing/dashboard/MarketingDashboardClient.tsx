"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 Calendar,
 TrendingUp,
 Filter,
 Wallet,
 Music,
 Activity,
 Eye,
 MousePointer2,
 MousePointerClick,
 BarChart3,
 CheckCircle2,
 DollarSign,
 Target,
 PenTool,
 Globe,
 Search,
 Heart,
 MessageCircle,
 Share2,
 Bookmark
} from "lucide-react";

// --- Custom Chart matching prototype's aj component ---
interface CustomChartProps {
 data: number[];
 color: string;
 color2?: string;
 data2?: number[];
}

const CustomChart: React.FC<CustomChartProps> = ({ data, color, color2, data2 }) => {
 // Guard: the dashboard analytics endpoint can return partial shapes during
 // bootstrap or auth failures. Always coerce to an array before plotting so
 // a missing `data` field can never throw "Cannot read properties of
 // undefined (reading 'length')".
 const safeData: number[] = Array.isArray(data) ? data : [];
 const safeData2: number[] | undefined = Array.isArray(data2) ? data2 : undefined;
 const maxVal = 150;
 const i = safeData.length > 1 ? 500 / (safeData.length - 1) : 0;
 const a = safeData.map((val, idx) => `${idx * i},${150 - (val / maxVal) * 150}`).join(" ");
 const o = safeData2 ? safeData2.map((val, idx) => `${idx * i},${150 - (val / maxVal) * 150}`).join(" ") : null;

 return (
 <svg viewBox="0 0 500 150" style={{ width: "100%", height: "180px", overflow: "visible" }}>
 <defs>
 <linearGradient id={`grad-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
 <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
 <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
 </linearGradient>
 {color2 && (
 <linearGradient id={`grad-${color2.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
 <stop offset="0%" style={{ stopColor: color2, stopOpacity: 0.2 }} />
 <stop offset="100%" style={{ stopColor: color2, stopOpacity: 0 }} />
 </linearGradient>
 )}
 </defs>
 {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
 <line
 key={idx}
 x1="0"
 y1={String(150 * ratio)}
 x2="500"
 y2={String(150 * ratio)}
 stroke="#F1F5F9"
 strokeWidth="1"
 />
 ))}
 <path
 d={`M ${a}`}
 fill="none"
 stroke={color}
 strokeWidth="3"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 <path d={`M ${a} L 500,150 L 0,150 Z`} fill={`url(#grad-${color.replace("#", "")})`} />
 {o && (
 <>
 <path
 d={`M ${o}`}
 fill="none"
 stroke={color2!}
 strokeWidth="3"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 <path d={`M ${o} L 500,150 L 0,150 Z`} fill={`url(#grad-${color2!.replace("#", "")})`} />
 </>
 )}
 {safeData.map((val, idx) => (
 <circle
 key={idx}
 cx={idx * i}
 cy={150 - (val / maxVal) * 150}
 r="4"
 fill="white"
 stroke={color}
 strokeWidth="2"
 />
 ))}
 </svg>
 );
};

// --- DATA TRANSFORMATION HELPERS ---
function formatRupiah(value: unknown): string {
 const n = typeof value === "number" ? value : Number(value);
 if (!Number.isFinite(n)) return "—";
 if (n === 0) return "Rp 0";
 if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
 if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
 if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}k`;
 return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatNumber(value: unknown): string {
 const n = typeof value === "number" ? value : Number(value);
 if (!Number.isFinite(n)) return "—";
 if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
 if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
 return n.toLocaleString("id-ID");
}

function scaleTrendData(raw: number[] | undefined | null, defaultVal: number[]): number[] {
 if (!Array.isArray(raw) || raw.length === 0) return defaultVal;
 const max = Math.max(...raw, 1);
 return raw.map(v => 40 + (v / max) * 100);
}

const DASHBOARD_DUMMY_DATA = {
 acquisition: { revenue: 3185000000, clientsAcquired: 42, avgCpa: 84500 },
 funnel: { leadsQualified: 1284, leadToSampleRate: 21.4, prospects: 276, closingRate: 15.2 },
 budget: { totalAdSpend: 1248000000, budgetUsagePercent: 92, costPerLead: 97352, costPerSample: 315000 },
 trends: [
 { month: "Jan", leads: 74, cpl: 92, closing: 44, cpa: 98 },
 { month: "Feb", leads: 81, cpl: 89, closing: 48, cpa: 101 },
 { month: "Mar", leads: 88, cpl: 85, closing: 55, cpa: 97 },
 { month: "Apr", leads: 95, cpl: 84, closing: 62, cpa: 103 },
 { month: "May", leads: 102, cpl: 79, closing: 66, cpa: 100 },
 { month: "Jun", leads: 108, cpl: 76, closing: 72, cpa: 96 },
 { month: "Jul", leads: 116, cpl: 74, closing: 68, cpa: 105 },
 { month: "Aug", leads: 123, cpl: 72, closing: 74, cpa: 102 },
 { month: "Sep", leads: 129, cpl: 70, closing: 79, cpa: 106 },
 { month: "Oct", leads: 134, cpl: 68, closing: 81, cpa: 110 },
 { month: "Nov", leads: 141, cpl: 67, closing: 86, cpa: 108 },
 { month: "Dec", leads: 148, cpl: 65, closing: 90, cpa: 111 },
 ],
 productPerformance: [
 { cat: "Skincare Premium", leads: 384, sample: 124, deal: 39 },
 { cat: "Bodycare Harian", leads: 297, sample: 101, deal: 31 },
 { cat: "Haircare Repair", leads: 236, sample: 77, deal: 26 },
 { cat: "Packaging Custom", leads: 182, sample: 58, deal: 19 },
 { cat: "Maklon Trial Kit", leads: 144, sample: 43, deal: 14 },
 ],
 topContent: [
 { title: "Retinol Reels Launch", engagement: 6.8 },
 { title: "Behind The Brand Story", engagement: 6.1 },
 { title: "Packaging Before After", engagement: 5.7 },
 { title: "Founder FAQ Carousel", engagement: 5.3 },
 { title: "UGC Testimonial Cut", engagement: 5.1 },
 ],
 leadSourceRanking: [
 { name: "Meta Ads", leads: 428 },
 { name: "TikTok Ads", leads: 311 },
 { name: "Google Organic", leads: 222 },
 { name: "Instagram Organic", leads: 176 },
 { name: "Referral", leads: 89 },
 ],
 vitality: {
 totalPosts: 18,
 postTarget: 28,
 avgEngagement: 2.8,
 totalFollowers: 184200,
 engagementByType: { likes: 24800, comments: 2140, shares: 3890, saves: 4620 },
 },
 searchVisibility: { impressions: 418000, clicks: 14240, avgCtr: 3.4, avgPosition: 8.1 },
 platforms: {
 INSTAGRAM: { growth: "+4.8%", followers: "98.4K" },
 FACEBOOK: { growth: "+1.9%", followers: "24.1K" },
 YOUTUBE: { growth: "+6.1%", followers: "18.7K" },
 TIKTOK: { growth: "-1.2%", followers: "43.0K" },
 },
};

function mergeMarketingAnalytics(source?: Partial<typeof DASHBOARD_DUMMY_DATA> | null) {
 if (!source) return DASHBOARD_DUMMY_DATA;
 return {
 ...DASHBOARD_DUMMY_DATA,
 ...source,
 acquisition: { ...DASHBOARD_DUMMY_DATA.acquisition, ...(source.acquisition ?? {}) },
 funnel: { ...DASHBOARD_DUMMY_DATA.funnel, ...(source.funnel ?? {}) },
 budget: { ...DASHBOARD_DUMMY_DATA.budget, ...(source.budget ?? {}) },
 vitality: {
 ...DASHBOARD_DUMMY_DATA.vitality,
 ...(source.vitality ?? {}),
 engagementByType: {
 ...DASHBOARD_DUMMY_DATA.vitality.engagementByType,
 ...(source.vitality?.engagementByType ?? {}),
 },
 },
 searchVisibility: { ...DASHBOARD_DUMMY_DATA.searchVisibility, ...(source.searchVisibility ?? {}) },
 platforms: { ...DASHBOARD_DUMMY_DATA.platforms, ...(source.platforms ?? {}) },
 trends: source.trends?.length ? source.trends : DASHBOARD_DUMMY_DATA.trends,
 productPerformance: source.productPerformance?.length ? source.productPerformance : DASHBOARD_DUMMY_DATA.productPerformance,
 topContent: source.topContent?.length ? source.topContent : DASHBOARD_DUMMY_DATA.topContent,
 leadSourceRanking: source.leadSourceRanking?.length ? source.leadSourceRanking : DASHBOARD_DUMMY_DATA.leadSourceRanking,
 };
}

function getCriticalCardStyle(isCritical: boolean): React.CSSProperties | undefined {
 if (!isCritical) return undefined;
 return {
 border: "1px solid rgba(220,38,38,0.28)",
 boxShadow: "0 0 0 1px rgba(220,38,38,0.08), 0 18px 40px -16px rgba(220,38,38,0.34), inset 0 1px 0 rgba(255,255,255,0.7)",
 };
}

export default function MarketingDashboardClient() {
 const [activePlatform, setActivePlatform] = useState<"INSTAGRAM" | "FACEBOOK" | "YOUTUBE" | "TIKTOK">("INSTAGRAM");

 const { data } = useQuery({
 queryKey: ["marketing-analytics"],
 queryFn: async () => {
 try {
 const response = await api.get("/marketing/analytics");
 return response.data ?? DASHBOARD_DUMMY_DATA;
 } catch {
 return DASHBOARD_DUMMY_DATA;
 }
 },
 staleTime: 2 * 60 * 1000,
 });

 const analytics = mergeMarketingAnalytics(data);
 // Dynamic values or fallback
 const revenueVal = analytics.acquisition?.revenue ? formatRupiah(analytics.acquisition.revenue) : "-";
 const revenueTargetPercent = analytics.acquisition?.revenue
 ? Math.min(Math.round((analytics.acquisition.revenue / 4500000000) * 100), 100)
 : 0;
 const clientAcqVal = analytics.acquisition?.clientsAcquired ? String(analytics.acquisition.clientsAcquired) : "-";
 const avgCpaVal = analytics.acquisition?.avgCpa ? formatRupiah(analytics.acquisition.avgCpa) : "-";

 const leadsQualifiedVal = analytics.funnel?.leadsQualified ? formatNumber(analytics.funnel.leadsQualified) : "-";
 const leadToSampleRateVal = analytics.funnel?.leadToSampleRate ? `${analytics.funnel.leadToSampleRate}%` : "-";
 const prospectsVal = analytics.funnel?.prospects ? String(analytics.funnel.prospects) : "-";
 const closingRateVal = analytics.funnel?.closingRate ? `${analytics.funnel.closingRate}%` : "-";

 const totalAdSpendVal = analytics.budget?.totalAdSpend ? formatRupiah(analytics.budget.totalAdSpend) : "-";
 const budgetUsagePercentVal = analytics.budget?.budgetUsagePercent ? `${Math.round(analytics.budget.budgetUsagePercent)}%` : "-";
 const costPerLeadVal = analytics.budget?.costPerLead ? formatRupiah(analytics.budget.costPerLead) : "-";
 const costPerSampleVal = analytics.budget?.costPerSample ? formatRupiah(analytics.budget.costPerSample) : "-";

 // Trends — guard against analytics.trends being undefined or non-array.
 const trendsArr: any[] = Array.isArray(analytics.trends) ? analytics.trends : DASHBOARD_DUMMY_DATA.trends;
 const rawLeadsTrend = trendsArr.map((t: any) => t.leads as number);
 const rawCplTrend = trendsArr.map((t: any) => t.cpl as number);
 const rawClosingTrend = trendsArr.map((t: any) => t.closing as number);
 const rawCpaTrend = trendsArr.map((t: any) => t.cpa as number);

 const leadsTrend = scaleTrendData(rawLeadsTrend, DASHBOARD_DUMMY_DATA.trends.map((t) => t.leads));
 const cplTrend = scaleTrendData(rawCplTrend, DASHBOARD_DUMMY_DATA.trends.map((t) => t.cpl));
 const closingTrend = scaleTrendData(rawClosingTrend, DASHBOARD_DUMMY_DATA.trends.map((t) => t.closing));
 const cpaTrend = scaleTrendData(rawCpaTrend, DASHBOARD_DUMMY_DATA.trends.map((t) => t.cpa));

 // Product performance
 const productPerformance = analytics.productPerformance || [];

 // Vitality & Platform específicos
 const disciplinePostsVal = analytics.vitality?.totalPosts ? String(analytics.vitality.totalPosts) : "-";
 const disciplineTargetVal = analytics.vitality?.postTarget ? String(analytics.vitality.postTarget) : "-";
 const disciplineProgressVal = analytics.vitality?.totalPosts && analytics.vitality?.postTarget
 ? Math.round((analytics.vitality.totalPosts / analytics.vitality.postTarget) * 100)
 : 0;
 const erRateVal = analytics.vitality?.avgEngagement ? `${analytics.vitality.avgEngagement.toFixed(1)}%` : "-";
 const followersVal = analytics.vitality?.totalFollowers ? formatNumber(analytics.vitality.totalFollowers) : "-";
 const engLikes = analytics.vitality?.engagementByType?.likes ?? 0;
 const engComments = analytics.vitality?.engagementByType?.comments ?? 0;
 const engShares = analytics.vitality?.engagementByType?.shares ?? 0;
 const engSaves = analytics.vitality?.engagementByType?.saves ?? 0;
 const platformMetrics = analytics.platforms ?? DASHBOARD_DUMMY_DATA.platforms;

 // Platform specific deep dive calculations
 const platformDataMap = {
 INSTAGRAM: {
 color: "#E1306C",
 icon: Globe,
 growth: "—",
 followers: "—"
 },
 FACEBOOK: {
 color: "#1877F2",
 icon: Globe,
 growth: "—",
 followers: "—"
 },
 YOUTUBE: {
 color: "#FF0000",
 icon: Globe,
 growth: "—",
 followers: "—"
 },
 TIKTOK: {
 color: "#000000",
 icon: Music,
 growth: "—",
 followers: "—"
 }
 };

 platformDataMap.INSTAGRAM.growth = platformMetrics.INSTAGRAM.growth;
 platformDataMap.INSTAGRAM.followers = platformMetrics.INSTAGRAM.followers;
 platformDataMap.FACEBOOK.growth = platformMetrics.FACEBOOK.growth;
 platformDataMap.FACEBOOK.followers = platformMetrics.FACEBOOK.followers;
 platformDataMap.YOUTUBE.growth = platformMetrics.YOUTUBE.growth;
 platformDataMap.YOUTUBE.followers = platformMetrics.YOUTUBE.followers;
 platformDataMap.TIKTOK.growth = platformMetrics.TIKTOK.growth;
 platformDataMap.TIKTOK.followers = platformMetrics.TIKTOK.followers;

 const selectedPlatformInfo = platformDataMap[activePlatform];
 const SelectedPlatformIcon = selectedPlatformInfo.icon;
 const revenueCritical = revenueTargetPercent < 70;
 const funnelCritical = Number(analytics.funnel?.leadToSampleRate ?? 0) < 25;
 const budgetCritical = Number(analytics.budget?.budgetUsagePercent ?? 0) > 85;
 const vitalityCritical = disciplineProgressVal < 80 || Number(analytics.vitality?.avgEngagement ?? 0) < 3;
 const searchCritical = Number(analytics.searchVisibility?.avgCtr ?? 0) < 3;

 // Search visibility
 const searchImpressions = analytics.searchVisibility?.impressions ? formatNumber(analytics.searchVisibility.impressions) : "-";
 const searchClicks = analytics.searchVisibility?.clicks ? formatNumber(analytics.searchVisibility.clicks) : "-";
 const searchCtr = analytics.searchVisibility?.avgCtr ? `${analytics.searchVisibility.avgCtr}%` : "-";
 const searchPosition = analytics.searchVisibility?.avgPosition ? String(analytics.searchVisibility.avgPosition) : "-";

 return (
 <div
 className="view-section active"
 style={{ paddingBottom: "10rem", background: "#F8FAFC", minHeight: "100vh" }}
 >
 {/* Top 3 Cards Grid */}
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(3, 1fr)",
 gap: "1.25rem",
 marginBottom: "2.5rem",
 }}
 >
 {/* Card A: Acquisition Hub */}
 <div
 style={{
 background: "white",
 padding: "1.5rem",
 borderRadius: "32px",
 border: "1px solid #E2E8F0",
 boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
 ...getCriticalCardStyle(revenueCritical),
 }}
 >
 <div
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 marginBottom: "1.25rem",
 }}
 >
 <span
 style={{
 fontSize: "10px",
 fontWeight: 950,
 color: "#2563EB",
 background: "#EFF6FF",
 padding: "4px 10px",
 borderRadius: "8px",
 }}
 >
 ACQUISITION HUB
 </span>
 <TrendingUp color={revenueCritical ? "#DC2626" : "#2563EB"} size={16} />
 </div>
 <div style={{ marginBottom: "1.5rem" }}>
 <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#94A3B8" }}>
 REVENUE SALES (MTD)
 </p>
 <h3 style={{ margin: "4px 0", fontSize: "28px", fontWeight: 950, color: revenueCritical ? "#DC2626" : "#1E293B" }}>
 {revenueVal}
 </h3>
 <div
 style={{
 height: "6px",
 background: "#F1F5F9",
 borderRadius: "3px",
 position: "relative",
 overflow: "hidden",
 marginTop: "8px",
 }}
 >
 <div
 style={{
 width: `${revenueTargetPercent}%`,
 height: "100%",
 background: "#2563EB",
 }}
 />
 </div>
 <p style={{ margin: "6px 0 0 0", fontSize: "10px", fontWeight: 700, color: "#64748B" }}>
 Target: Rp 4.5M{" "}
 <span style={{ color: "#2563EB" }}>
 ({revenueTargetPercent}%)
 </span>
 </p>
 </div>
 <div
 style={{
 display: "flex",
 gap: "1rem",
 paddingTop: "1.25rem",
 borderTop: "1px solid #F1F5F9",
 }}
 >
 <div style={{ flex: 1 }}>
 <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
 CLIENT ACQ.
 </p>
 <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: revenueCritical ? "#DC2626" : "#1E293B" }}>
 {clientAcqVal}{" "}
 <span style={{ fontSize: "10px", color: "#10B981" }}>+12%</span>
 </p>
 </div>
 <div style={{ flex: 1, borderLeft: "1px solid #F1F5F9", paddingLeft: "1rem" }}>
 <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
 AVG CPA
 </p>
 <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: revenueCritical ? "#DC2626" : "#1E293B" }}>
 {avgCpaVal}
 </p>
 </div>
 </div>
 </div>

 {/* Card B: Funnel Efficiency */}
 <div
 style={{
 background: "white",
 padding: "1.5rem",
 borderRadius: "32px",
 border: "1px solid #E2E8F0",
 boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
 ...getCriticalCardStyle(funnelCritical),
 }}
 >
 <div
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 marginBottom: "1.25rem",
 }}
 >
 <span
 style={{
 fontSize: "10px",
 fontWeight: 950,
 color: "#8B5CF6",
 background: "#F5F3FF",
 padding: "4px 10px",
 borderRadius: "8px",
 }}
 >
 FUNNEL EFFICIENCY
 </span>
 <Filter color={funnelCritical ? "#DC2626" : "#8B5CF6"} size={16} />
 </div>
 <div style={{ marginBottom: "1.5rem" }}>
 <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#94A3B8" }}>
 LEADS QUALIFIED
 </p>
 <h3 style={{ margin: "4px 0", fontSize: "28px", fontWeight: 950, color: funnelCritical ? "#DC2626" : "#1E293B" }}>
 {leadsQualifiedVal}
 </h3>
 <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#8B5CF6" }}>
 Conversion Lead-to-Sample: {leadToSampleRateVal}
 </p>
 </div>
 <div
 style={{
 display: "flex",
 gap: "1rem",
 paddingTop: "1.25rem",
 borderTop: "1px solid #F1F5F9",
 }}
 >
 <div style={{ flex: 1 }}>
 <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
 PROSPECT
 </p>
 <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: funnelCritical ? "#DC2626" : "#1E293B" }}>
 {prospectsVal}
 </p>
 </div>
 <div style={{ flex: 1, borderLeft: "1px solid #F1F5F9", paddingLeft: "1rem" }}>
 <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
 CLOSING RATE
 </p>
 <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: funnelCritical ? "#DC2626" : "#1E293B" }}>
 {closingRateVal}
 </p>
 </div>
 </div>
 </div>

 {/* Card C: Budget Audit */}
 <div
 style={{
 background: "white",
 padding: "1.5rem",
 borderRadius: "32px",
 border: "1px solid #E2E8F0",
 boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
 ...getCriticalCardStyle(budgetCritical),
 }}
 >
 <div
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 marginBottom: "1.25rem",
 }}
 >
 <span
 style={{
 fontSize: "10px",
 fontWeight: 950,
 color: "#EF4444",
 background: "#FEF2F2",
 padding: "4px 10px",
 borderRadius: "8px",
 }}
 >
 BUDGET AUDIT
 </span>
 <Wallet color="#DC2626" size={16} />
 </div>
 <div style={{ marginBottom: "1.5rem" }}>
 <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#94A3B8" }}>
 TOTAL AD SPEND
 </p>
 <h3 style={{ margin: "4px 0", fontSize: "28px", fontWeight: 950, color: budgetCritical ? "#DC2626" : "#1E293B" }}>
 {totalAdSpendVal}
 </h3>
 <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#EF4444" }}>
 Used: {budgetUsagePercentVal} of Monthly Budget
 </p>
 </div>
 <div
 style={{
 display: "flex",
 gap: "1rem",
 paddingTop: "1.25rem",
 borderTop: "1px solid #F1F5F9",
 }}
 >
 <div style={{ flex: 1 }}>
 <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
 COST PER LEAD
 </p>
 <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: budgetCritical ? "#DC2626" : "#1E293B" }}>
 {costPerLeadVal}
 </p>
 </div>
 <div style={{ flex: 1, borderLeft: "1px solid #F1F5F9", paddingLeft: "1rem" }}>
 <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
 COST / SAMPLE
 </p>
 <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: budgetCritical ? "#DC2626" : "#1E293B" }}>
 {costPerSampleVal}
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Annual Trend Charts Grid */}
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "1fr 1fr",
 gap: "2rem",
 marginBottom: "2.5rem",
 }}
 >
 {/* Trend Chart A: leads & cpl */}
 <div
 style={{
 background: "white",
 padding: "2.5rem",
 borderRadius: "32px",
 border: "1px solid #E2E8F0",
 ...getCriticalCardStyle(funnelCritical),
 }}
 >
 <div
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 marginBottom: "2rem",
 }}
 >
 <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
 II. ANALISA TREN TAHUNAN (LEADS & CPL)
 </h3>
 <div style={{ display: "flex", gap: "15px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
 <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563EB" }} />
 <span style={{ fontSize: "9px", fontWeight: 950, color: "#64748B" }}>LEADS</span>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
 <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#06B6D4" }} />
 <span style={{ fontSize: "9px", fontWeight: 950, color: "#64748B" }}>CPL</span>
 </div>
 </div>
 </div>
 <CustomChart data={leadsTrend} color="#2563EB" data2={cplTrend} color2="#06B6D4" />
 <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
 {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
 (m) => (
 <span key={m} style={{ fontSize: "9px", fontWeight: 900, color: "#94A3B8" }}>
 {m}
 </span>
 )
 )}
 </div>
 </div>

 {/* Trend Chart B: samples & cpa */}
 <div
 style={{
 background: "white",
 padding: "2.5rem",
 borderRadius: "32px",
 border: "1px solid #E2E8F0",
 ...getCriticalCardStyle(budgetCritical),
 }}
 >
 <div
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 marginBottom: "2rem",
 }}
 >
 <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
 III. TREN SAMPLES & AKUISISI (CPA)
 </h3>
 <div style={{ display: "flex", gap: "15px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
 <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
 <span style={{ fontSize: "9px", fontWeight: 950, color: "#64748B" }}>CLOSING</span>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
 <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }} />
 <span style={{ fontSize: "9px", fontWeight: 950, color: "#64748B" }}>CPA</span>
 </div>
 </div>
 </div>
 <CustomChart data={closingTrend} color="#F59E0B" data2={cpaTrend} color2="#EF4444" />
 <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
 {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
 (m) => (
 <span key={m} style={{ fontSize: "9px", fontWeight: 900, color: "#94A3B8" }}>
 {m}
 </span>
 )
 )}
 </div>
 </div>
 </div>

 {/* Product Performance Table */}
 <div
 style={{
 background: "white",
 borderRadius: "32px",
 border: "1px solid #E2E8F0",
 padding: "1.5rem",
 marginBottom: "2.5rem",
 }}
 >
 <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
 IV. TOP LIST PRODUCT PERFORMANCE
 </h3>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ textAlign: "left", borderBottom: "2px solid #F1F5F9" }}>
 <th style={{ padding: "12px", fontSize: "11px", fontWeight: 950, color: "#64748B" }}>
 PRODUCT CATEGORY
 </th>
 <th style={{ padding: "12px", fontSize: "11px", fontWeight: 950, color: "#64748B" }}>
 LEADS
 </th>
 <th style={{ padding: "12px", fontSize: "11px", fontWeight: 950, color: "#64748B" }}>
 SAMPLES
 </th>
 <th style={{ padding: "12px", fontSize: "11px", fontWeight: 950, color: "#64748B" }}>
 CLIENT DEAL
 </th>
 </tr>
 </thead>
 <tbody>
 {productPerformance.map((p: any, idx: number) => (
 <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
 <td style={{ padding: "16px 12px", fontSize: "13px", fontWeight: 900, color: "#1E293B" }}>
 {p.cat || p.name}
 </td>
 <td style={{ padding: "16px 12px", fontSize: "13px", fontWeight: 800 }}>
 {p.leads}
 </td>
 <td style={{ padding: "16px 12px", fontSize: "13px", fontWeight: 800 }}>
 {p.sample || p.samples}
 </td>
 <td style={{ padding: "16px 12px", fontSize: "13px", fontWeight: 950, color: "#2563EB" }}>
 {p.deal || p.deals}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Vitalitas Konten & Platform Deep dive */}
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "1fr 1fr",
 gap: "2rem",
 marginBottom: "2.5rem",
 }}
 >
 {/* Vitalitas Konten */}
 <div
 style={{
 background: "white",
 padding: "2rem",
 borderRadius: "32px",
 border: "1px solid #E2E8F0",
 ...getCriticalCardStyle(vitalityCritical),
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
 <Activity color="#EC4899" />
 <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
 V. VITALITAS KONTEN
 </h3>
 </div>
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "1fr 1fr",
 gap: "1.5rem",
 marginBottom: "2rem",
 }}
 >
 <div
 style={{
 background: "#FDF2F8",
 padding: "1.5rem",
 borderRadius: "24px",
 border: "1px solid #FCE7F3",
 }}
 >
 <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "#BE185D" }}>
 DISIPLIN PRODUKSI
 </p>
 <h4 style={{ margin: "14px 0", fontSize: "24px", fontWeight: 950, color: vitalityCritical ? "#DC2626" : "#1E293B" }}>
 {disciplinePostsVal}{" "}
 <span style={{ fontSize: "12px", color: "#64748B" }}>/ {disciplineTargetVal} Konten</span>
 </h4>
 <div style={{ height: "6px", background: "white", borderRadius: "3px", overflow: "hidden" }}>
 <div style={{ width: `${disciplineProgressVal}%`, height: "100%", background: "#EC4899" }} />
 </div>
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
 <div
 style={{
 background: "#F8FAFC",
 padding: "12px",
 borderRadius: "16px",
 border: "1px solid #E2E8F0",
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 }}
 >
 <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748B" }}>ER RATE</span>
 <span style={{ fontSize: "14px", fontWeight: 950, color: vitalityCritical ? "#DC2626" : "#1E293B" }}>{erRateVal}</span>
 </div>
 <div
 style={{
 background: "#F0F9FF",
 padding: "12px",
 borderRadius: "16px",
 border: "1px solid #E0F2FE",
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 }}
 >
 <span style={{ fontSize: "9px", fontWeight: 800, color: "#0369A1" }}>FOLLOWERS</span>
 <span style={{ fontSize: "14px", fontWeight: 950, color: vitalityCritical ? "#DC2626" : "#1E293B" }}>{followersVal}</span>
 </div>
 </div>
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
 {[
 { icon: Heart, label: "Likes", value: formatNumber(engLikes) },
 { icon: MessageCircle, label: "Comments", value: formatNumber(engComments) },
 { icon: Share2, label: "Shares", value: formatNumber(engShares) },
 { icon: Bookmark, label: "Save", value: formatNumber(engSaves) },
 ].map((item, idx) => {
 const Icon = item.icon;
 return (
 <div
 key={idx}
 style={{
 textAlign: "center",
 background: "#F8FAFC",
 padding: "12px 5px",
 borderRadius: "16px",
 border: "1px solid #F1F5F9",
 }}
 >
 <Icon size={12} color="#94A3B8" style={{ display: "inline", marginBottom: "4px" }} />
 <p style={{ margin: "4px 0 0 0", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
 {item.value}
 </p>
 <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>
 {item.label}
 </p>
 </div>
 );
 })}
 </div>
 </div>

 {/* Platform Specific Audit */}
 <div
 style={{
 background: "white",
 borderRadius: "32px",
 border: "1px solid #E2E8F0",
 overflow: "hidden",
 display: "flex",
 ...getCriticalCardStyle(searchCritical),
 }}
 >
 {/* Sidebar */}
 <div
 style={{
 width: "160px",
 background: "#F8FAFC",
 borderRight: "1px solid #E2E8F0",
 display: "flex",
 flexDirection: "column",
 padding: "1.5rem 0",
 }}
 >
 <p style={{ margin: "0 1.5rem 1rem", fontSize: "9px", fontWeight: 950, color: "#94A3B8" }}>
 VI. PLATFORM
 </p>
 {(["INSTAGRAM", "FACEBOOK", "YOUTUBE", "TIKTOK"] as const).map((key) => {
 const info = platformDataMap[key];
 const Icon = info.icon;
 return (
 <button
 key={key}
 onClick={() => setActivePlatform(key)}
 style={{
 display: "flex",
 alignItems: "center",
 gap: "8px",
 padding: "10px 1.5rem",
 border: "none",
 background: activePlatform === key ? "white" : "transparent",
 color: activePlatform === key ? "#1E293B" : "#94A3B8",
 cursor: "pointer",
 textAlign: "left",
 width: "100%",
 }}
 >
 <Icon size={14} color={activePlatform === key ? info.color : "#94A3B8"} />
 <span style={{ fontSize: "9px", fontWeight: 950 }}>{key}</span>
 </button>
 );
 })}
 </div>

 {/* Detail */}
 <div style={{ flex: 1, padding: "1.5rem" }}>
 <h4 style={{ margin: "0 0 1rem 0", fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>
 {activePlatform} Audit
 </h4>
 <div
 style={{
 background: "#F8FAFC",
 padding: "12px",
 borderRadius: "16px",
 border: "1px solid #F1F5F9",
 }}
 >
 <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
 ENGAGEMENT GROWTH
 </p>
 <p style={{ margin: "4px 0", fontSize: "18px", fontWeight: 950, color: "#10B981" }}>
 {selectedPlatformInfo.growth}
 </p>
 </div>
 <div
 style={{
 background: "#F0F9FF",
 padding: "12px",
 borderRadius: "16px",
 border: "1px solid #E0F2FE",
 marginTop: "12px",
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 }}
 >
 <span style={{ fontSize: "9px", fontWeight: 800, color: "#0369A1" }}>TOTAL FOLLOWERS</span>
 <span style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>
 {selectedPlatformInfo.followers}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Top 5 Content Leaders & Ranking Sumber Leads */}
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "1.2fr 1fr",
 gap: "2rem",
 marginBottom: "2.5rem",
 }}
 >
 {/* Top 5 Content Leaders */}
 <div
 style={{
 background: "white",
 padding: "1.5rem",
 borderRadius: "32px",
 border: "1px solid #E2E8F0",
 }}
 >
 <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
 VII. TOP 5 CONTENT LEADERS
 </h3>
 <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
 {analytics.topContent.map((item: any, idx: number) => (
 <div
 key={idx}
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 padding: "10px 15px",
 background: "#F8FAFC",
 borderRadius: "12px",
 }}
 >
 <span style={{ fontSize: "12px", fontWeight: 800 }}>{item.title}</span>
 <span style={{ fontSize: "11px", fontWeight: 950, color: "#10B981" }}>
 {item.engagement}% ER
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Ranking Sumber Leads */}
 <div
 style={{
 background: "#F5F3FF",
 padding: "1.5rem",
 borderRadius: "32px",
 border: "1px solid #DDD6FE",
 }}
 >
 <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "12px", fontWeight: 950, color: "#5B21B6" }}>
 VIII. RANKING SUMBER LEADS
 </h3>
 <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
 {analytics.leadSourceRanking.map((item: any, idx: number) => (
 <div
 key={idx}
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 background: "white",
 padding: "12px 15px",
 borderRadius: "16px",
 border: "1px solid #E9D5FF",
 }}
 >
 <span style={{ fontSize: "11px", fontWeight: 950 }}>{item.name}</span>
 <span style={{ fontSize: "12px", fontWeight: 950, color: "#5B21B6" }}>
 {item.leads}
 </span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Search Visibility Audit (SEO/Ads Overview) */}
 <div style={{ borderTop: "2px solid #F1F5F9", paddingTop: "2.5rem" }}>
 <h3
 style={{
 margin: "0 0 1.5rem 0",
 fontSize: "12px",
 fontWeight: 950,
 color: "#94A3B8",
 letterSpacing: "0.1em",
 }}
 >
 IX. SEARCH VISIBILITY AUDIT (SEO/ADS OVERVIEW)
 </h3>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
 {[
 {
 label: "TOTAL IMPRESSIONS",
 val: searchImpressions,
 sub: "+18.4% vs Prev",
 icon: Eye,
 color: "#6366F1",
 bg: "#EEF2FF",
 critical: false,
 },
 {
 label: "TOTAL CLICKS",
 val: searchClicks,
 sub: "+4.2% Growth",
 icon: MousePointer2,
 color: "#10B981",
 bg: "#ECFDF5",
 critical: false,
 },
 {
 label: "AVG. CTR",
 val: searchCtr,
 sub: "Target 5.5%",
 icon: MousePointerClick,
 color: "#F59E0B",
 bg: "#FFFBEB",
 critical: searchCritical,
 },
 {
 label: "AVG. POSITION",
 val: searchPosition,
 sub: "Top 10 Benchmark",
 icon: BarChart3,
 color: "#8B5CF6",
 bg: "#F5F3FF",
 critical: Number(analytics.searchVisibility?.avgPosition ?? 0) > 10,
 },
 ].map((card, idx) => {
 const CardIcon = card.icon;
 return (
 <div
 key={idx}
 style={{
 background: "white",
 padding: "1.5rem",
 borderRadius: "24px",
 border: "1px solid #E2E8F0",
 boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
 ...getCriticalCardStyle(Boolean(card.critical)),
 }}
 >
 <div
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 marginBottom: "1rem",
 }}
 >
 <div
 style={{
 width: "36px",
 height: "36px",
 background: card.bg,
 borderRadius: "10px",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 }}
 >
 <CardIcon color={card.color} size={18} />
 </div>
 <span style={{ fontSize: "10px", fontWeight: 950, color: card.critical ? "#DC2626" : card.color }}>
 {card.sub}
 </span>
 </div>
 <div>
 <p style={{ margin: 0, fontSize: "9px", fontWeight: 900, color: "#94A3B8" }}>
 {card.label}
 </p>
 <h3 style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: 950, color: card.critical ? "#DC2626" : "#1E293B" }}>
 {card.val}
 </h3>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );
}
