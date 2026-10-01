"use client";

import React from "react";
import {
  Users,
  TrendingUp,
  ChevronRight,
  Globe,
  Share2,
} from "lucide-react";
import {
  Card,
  TableWrapper,
  SectionLabel,
  TabsContent,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { MatrixRow } from "./MatrixRow";
import {
  OrganicEntry,
  BaselineEntry,
  getCriticalCardClass,
} from "../_types/input.types";

interface SampleInputOrganicTabProps {
  organicDataMissing: boolean;
  organicMatrix: Record<string, OrganicEntry>;
  setOrganicMatrix: React.Dispatch<
    React.SetStateAction<Record<string, OrganicEntry>>
  >;
  handleKeyDown: (e: React.KeyboardEvent, index: number) => void;
  baselineData: BaselineEntry[];
}

export function SampleInputOrganicTab({
  organicDataMissing,
  organicMatrix,
  setOrganicMatrix,
  handleKeyDown,
  baselineData,
}: SampleInputOrganicTabProps) {
  return (
    <TabsContent value="organic" className="mt-0">
      <Card
        className={`rounded-2xl overflow-hidden bg-white ${getCriticalCardClass(
          organicDataMissing
        )}`}
      >
        <div className="overflow-x-auto">
          <TableWrapper>
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="bg-slate-50 border-b border-slate-200">
                  <DnaTh className="p-4 text-left w-72">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      Growth & Engagement
                    </span>
                  </DnaTh>
                  {Object.keys(organicMatrix).map((p) => (
                    <DnaTh key={p} className="p-4 text-center min-w-[200px]">
                      <span className="text-sm font-bold tracking-tight text-slate-900">
                        {p.split("_")[0]}
                      </span>
                    </DnaTh>
                  ))}
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                <MatrixRow
                  label="Total Followers"
                  icon={Users}
                  platforms={Object.keys(organicMatrix)}
                  field="totalFollowers"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={1000}
                  baseline={baselineData}
                />
                <MatrixRow
                  label="Follower Growth"
                  icon={TrendingUp}
                  platforms={Object.keys(organicMatrix)}
                  field="followerGrowth"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={1100}
                  accent="text-emerald-600"
                />
                <MatrixRow
                  label="Unfollows"
                  icon={Users}
                  platforms={Object.keys(organicMatrix)}
                  field="unfollows"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={1200}
                  accent="text-rose-600"
                />

                <DnaTableRow className="bg-slate-50/30">
                  <DnaTd colSpan={4} className="p-5 px-10">
                    <SectionLabel as="span">Content Vitality</SectionLabel>
                  </DnaTd>
                </DnaTableRow>

                <MatrixRow
                  label="Posts Created"
                  icon={ChevronRight}
                  platforms={Object.keys(organicMatrix)}
                  field="postsCount"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={1400}
                />
                <MatrixRow
                  label="Stories Created"
                  icon={ChevronRight}
                  platforms={Object.keys(organicMatrix)}
                  field="storiesCount"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={1500}
                />
                <MatrixRow
                  label="Total Reach"
                  icon={Globe}
                  platforms={Object.keys(organicMatrix)}
                  field="totalReach"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={1300}
                  baseline={baselineData}
                />

                <DnaTableRow className="bg-slate-50/30">
                  <DnaTd colSpan={4} className="p-5 px-10">
                    <SectionLabel as="span">Engagement Sum</SectionLabel>
                  </DnaTd>
                </DnaTableRow>

                <MatrixRow
                  label="Likes"
                  icon={Share2}
                  platforms={Object.keys(organicMatrix)}
                  field="likesCount"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={1700}
                />
                <MatrixRow
                  label="Comments"
                  icon={Share2}
                  platforms={Object.keys(organicMatrix)}
                  field="commentsCount"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={1800}
                />
                <MatrixRow
                  label="Saves"
                  icon={Share2}
                  platforms={Object.keys(organicMatrix)}
                  field="savesCount"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={1900}
                />
                <MatrixRow
                  label="Shares"
                  icon={Share2}
                  platforms={Object.keys(organicMatrix)}
                  field="sharesCount"
                  matrix={organicMatrix}
                  setMatrix={setOrganicMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={2000}
                />
              </DnaTableBody>
            </DnaTable>
          </TableWrapper>
        </div>
      </Card>
    </TabsContent>
  );
}
