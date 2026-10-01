"use client";

import React from "react";
import { TrendingUp, Sparkles } from "lucide-react";
import {
  Card,
  DnaButton,
  DnaInput,
  Label,
  TabsContent,
} from "@/components/dna";
import { ContentData, getCriticalCardClass } from "../_types/input.types";

interface SampleInputContentTabProps {
  contentIncomplete: boolean;
  contentData: ContentData;
  setContentData: React.Dispatch<React.SetStateAction<ContentData>>;
  submitContent: () => Promise<void>;
  loading: boolean;
}

export function SampleInputContentTab({
  contentIncomplete,
  contentData,
  setContentData,
  submitContent,
  loading,
}: SampleInputContentTabProps) {
  return (
    <TabsContent value="content">
      <Card
        className={`p-6 bg-white rounded-2xl relative overflow-hidden ${
          contentIncomplete
            ? `${getCriticalCardClass(
                true
              )} [&_h2]:text-[#DC2626] [&_.content-critical]:text-[#DC2626]`
            : getCriticalCardClass(false)
        }`}
      >
        <div className="absolute top-0 right-0 p-6 text-blue-50/40 rotate-12">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10 w-full space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Content{" "}
                <span
                  className={
                    contentIncomplete ? "content-critical" : "text-blue-600"
                  }
                >
                  Performance
                </span>
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Audit individual posts for conversion and engagement
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">
                Asset Title
              </Label>
              <DnaInput
                value={contentData.title}
                onChange={(e) =>
                  setContentData({ ...contentData, title: e.target.value })
                }
                placeholder="e.g. Nex Serum Launch"
                className="font-bold text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">
                URL Reference
              </Label>
              <DnaInput
                value={contentData.url}
                onChange={(e) =>
                  setContentData({ ...contentData, url: e.target.value })
                }
                placeholder="Instagram.com/p/..."
                className="font-bold text-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(["views", "likes", "comments", "shares", "saves"] as const).map(
              (f) => (
                <div key={f} className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">
                    {f}
                  </Label>
                  <DnaInput
                    type="number"
                    value={(contentData as any)[f] || ""}
                    onChange={(e) =>
                      setContentData({
                        ...contentData,
                        [f]: Number(e.target.value),
                      })
                    }
                    className="font-black text-center text-xl"
                  />
                </div>
              )
            )}
          </div>

          <DnaButton
            variant="primary"
            onClick={submitContent}
            disabled={loading}
            className="w-full"
          >
            Record Asset Logic
          </DnaButton>
        </div>
      </Card>
    </TabsContent>
  );
}
