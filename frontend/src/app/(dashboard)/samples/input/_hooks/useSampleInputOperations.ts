"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  AdsEntry,
  OrganicEntry,
  ContentData,
  TargetData,
  BaselineEntry,
} from "../_types/input.types";

export function useSampleInputOperations() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("paid");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [baselineData, setBaselineData] = useState<BaselineEntry[]>([]);
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
    IG_ADS: {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      leadsGenerated: 0,
    },
    TIKTOK_ADS: {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      leadsGenerated: 0,
    },
    FB_ADS: {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      leadsGenerated: 0,
    },
    GOOGLE_ADS: {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      leadsGenerated: 0,
    },
  });

  // --- STATE: ORGANIC MATRIX ---
  const [organicMatrix, setOrganicMatrix] = useState<
    Record<string, OrganicEntry>
  >({
    IG_ORGANIC: {
      totalFollowers: 0,
      followerGrowth: 0,
      unfollows: 0,
      totalReach: 0,
      profileVisits: 0,
      postsCount: 0,
      storiesCount: 0,
      avgStoryViews: 0,
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      sharesCount: 0,
    },
    TIKTOK_ORGANIC: {
      totalFollowers: 0,
      followerGrowth: 0,
      unfollows: 0,
      totalReach: 0,
      profileVisits: 0,
      postsCount: 0,
      storiesCount: 0,
      avgStoryViews: 0,
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      sharesCount: 0,
    },
    FB_ORGANIC: {
      totalFollowers: 0,
      followerGrowth: 0,
      unfollows: 0,
      totalReach: 0,
      profileVisits: 0,
      postsCount: 0,
      storiesCount: 0,
      avgStoryViews: 0,
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      sharesCount: 0,
    },
  });

  const [contentData, setContentData] = useState<ContentData>({
    publishDate: new Date().toISOString().split("T")[0],
    platform: "IG_ORGANIC",
    contentPillar: "EDUCATIONAL",
    title: "",
    url: "",
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
  });

  const [targetData, setTargetData] = useState<TargetData>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    adBudget: 0,
    leadTarget: 0,
    postTarget: 0,
    revenueTarget: 0,
  });

  // --- BASELINE FETCHING (H-1) ---
  useEffect(() => {
    const fetchBaseline = async () => {
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const isoDate = yesterday.toISOString().split("T")[0];
      try {
        const type = activeTab === "paid" ? "ADS" : "ORGANIC";
        const res = await api.get(
          `/marketing/comparison?date=${isoDate}&type=${type}`
        );
        setBaselineData(res.data);
      } catch (e) {
        setBaselineData([]);
      }
    };
    if (activeTab === "paid" || activeTab === "organic") fetchBaseline();
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
      const nextInput = document.querySelector(
        `[data-index="${index + 1}"]`
      ) as HTMLInputElement;
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
    if (activeTab === "paid") {
      const newMatrix = { ...adsMatrix };
      baselineData.forEach((item) => {
        if (newMatrix[item.platform]) {
          newMatrix[item.platform] = {
            spend: Number(item.spend),
            impressions: Number(item.impressions),
            reach: Number(item.reach),
            clicks: Number(item.clicks),
            leadsGenerated: Number(item.leadsGenerated),
          };
        }
      });
      setAdsMatrix(newMatrix);
    } else {
      const newMatrix = { ...organicMatrix };
      baselineData.forEach((item) => {
        if (newMatrix[item.platform]) {
          newMatrix[item.platform] = {
            ...newMatrix[item.platform],
            totalFollowers: Number(item.totalFollowers),
            totalReach: Number(item.totalReach),
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
        .map(([platform, data]) =>
          api.post("/marketing/daily-ads", { ...data, platform, date })
        );

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
        return Math.ceil(
          ((d.getTime() - start.getTime()) / 86400000 + 1) / 7
        );
      };

      const entries = Object.entries(organicMatrix)
        .filter(([_, data]) => data.totalFollowers > 0 || data.totalReach > 0)
        .map(([platform, data]) =>
          api.post("/marketing/weekly-organic", {
            ...data,
            platform,
            date,
            year: selectedDate.getFullYear(),
            weekNumber: getWeek(selectedDate),
          })
        );

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
      setContentData({
        ...contentData,
        title: "",
        url: "",
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
      });
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
    const l = Object.values(adsMatrix).reduce(
      (a, c) => a + c.leadsGenerated,
      0
    );
    const c = Object.values(adsMatrix).reduce((a, c) => a + c.clicks, 0);
    const i = Object.values(adsMatrix).reduce(
      (a, c) => a + c.impressions,
      0
    );
    return { s, l, c, i };
  }, [adsMatrix]);

  const paidDataMissing =
    totals.s === 0 && totals.l === 0 && totals.c === 0 && totals.i === 0;
  const ctr = totals.i > 0 ? (totals.c / totals.i) * 100 : 0;
  const cpa = totals.l > 0 ? totals.s / totals.l : 0;
  const paidEfficiencyCritical = totals.i > 0 && ctr < 1.2;
  const paidCostCritical = totals.l > 0 && cpa > 150000;

  const organicTotals = useMemo(
    () => ({
      followers: Object.values(organicMatrix).reduce(
        (a, c) => a + c.totalFollowers,
        0
      ),
      reach: Object.values(organicMatrix).reduce(
        (a, c) => a + c.totalReach,
        0
      ),
      posts: Object.values(organicMatrix).reduce(
        (a, c) => a + c.postsCount,
        0
      ),
      engagement: Object.values(organicMatrix).reduce(
        (a, c) =>
          a + c.likesCount + c.commentsCount + c.savesCount + c.sharesCount,
        0
      ),
    }),
    [organicMatrix]
  );

  const organicDataMissing =
    organicTotals.followers === 0 &&
    organicTotals.reach === 0 &&
    organicTotals.posts === 0 &&
    organicTotals.engagement === 0;
  const contentIncomplete =
    !contentData.title.trim() || !contentData.url.trim();
  const targetsIncomplete =
    targetData.revenueTarget <= 0 ||
    targetData.leadTarget <= 0 ||
    targetData.postTarget <= 0 ||
    targetData.adBudget <= 0;

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setIsDraftLoaded(false);
  };

  return {
    loading,
    activeTab,
    date,
    baselineData,
    isDraftLoaded,
    user,
    canEditTargets,
    adsMatrix,
    organicMatrix,
    contentData,
    targetData,
    totals,
    paidDataMissing,
    ctr,
    cpa,
    paidEfficiencyCritical,
    paidCostCritical,
    organicTotals,
    organicDataMissing,
    contentIncomplete,
    targetsIncomplete,
    setDate,
    setActiveTab,
    setIsDraftLoaded,
    setAdsMatrix,
    setOrganicMatrix,
    setContentData,
    setTargetData,
    handleTabChange,
    handleKeyDown,
    pullPreviousData,
    submitAds,
    submitOrganic,
    submitContent,
    submitTargets,
  };
}
