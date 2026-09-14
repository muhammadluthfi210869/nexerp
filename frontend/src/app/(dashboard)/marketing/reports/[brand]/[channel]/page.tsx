"use client";

import React, { use } from "react";
import BrandWorkspace from "../../workspace/BrandWorkspace";

const PLATFORM_MAP: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  website: "Website",
  "paid-ads": "Paid Ads",
};

export default function ChannelPlannerPage({
  params,
}: {
  params: Promise<{ brand: string; channel: string }>;
}) {
  const { brand, channel } = use(params);
  const mappedChannel = PLATFORM_MAP[channel.toLowerCase()] || "Instagram";

  return (
    <BrandWorkspace
      initialBrandSlug={brand}
      initialChannel={mappedChannel}
      initialMode="planner"
    />
  );
}
