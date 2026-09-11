"use client";
import { useBrandChannel } from "./layout";
import PostPlanner from "../../components/views/PostPlanner";
import type { PostPlatform } from "@/types/marketing-api";

const PLATFORM_MAP: Record<string, PostPlatform> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", website: "Website", "paid-ads": "Paid Ads",
};

export default function ChannelPlannerPage() {
  const { brand, channel } = useBrandChannel();
  return <PostPlanner brand={`brand-${brand}`} channel={PLATFORM_MAP[channel]} />;
}
