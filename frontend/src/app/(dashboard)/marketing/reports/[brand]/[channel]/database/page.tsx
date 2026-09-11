"use client";
import { useBrandChannel } from "../layout";
import PostDatabase from "../../../components/views/PostDatabase";
import type { PostPlatform } from "@/types/marketing-api";

const PLATFORM_MAP: Record<string, PostPlatform> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", website: "Website", "paid-ads": "Paid Ads",
};

export default function ChannelDatabasePage() {
  const { brand, channel } = useBrandChannel();
  return <PostDatabase brand={`brand-${brand}`} channel={PLATFORM_MAP[channel]} />;
}
