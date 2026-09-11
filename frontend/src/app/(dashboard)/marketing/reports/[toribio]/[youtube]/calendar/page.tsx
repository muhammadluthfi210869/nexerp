"use client";
import { useBrandChannel } from "../layout";
import PostCalendar from "../../components/views/PostCalendar";
import type { PostPlatform } from "@/types/marketing-api";

const PLATFORM_MAP: Record<string, PostPlatform> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", website: "Website", "paid-ads": "Paid Ads",
};

export default function ChannelCalendarPage() {
  const { brand, channel } = useBrandChannel();
  return <PostCalendar brand={`brand-${brand}`} channel={PLATFORM_MAP[channel]} />;
}
