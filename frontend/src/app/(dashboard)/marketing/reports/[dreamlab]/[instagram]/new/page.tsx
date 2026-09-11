"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBrandChannel } from "../../layout";
import PostModal from "../../../components/PostModal";
import type { PostPlatform } from "@/types/marketing-api";

const PLATFORM_MAP: Record<string, PostPlatform> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", website: "Website", "paid-ads": "Paid Ads",
};

export default function NewPostPage() {
  const router = useRouter();
  const { brand, channel } = useBrandChannel();
  const [open, setOpen] = useState(true);

  return (
    <PostModal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        router.push(`/marketing/reports/${brand}/${channel}`);
      }}
      brand={`brand-${brand}`}
      channel={PLATFORM_MAP[channel]}
      onSaved={() => router.push(`/marketing/reports/${brand}/${channel}`)}
    />
  );
}
