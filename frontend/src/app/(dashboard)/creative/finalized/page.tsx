"use client";

/**
 * Desain Final & Riwayat — the ONE dedicated page for finalized designs
 * (SCR-180, `GET /api/v1/creative/finalized` + `GET /api/v1/creative/tasks/:id/history`).
 *
 * Owner decision 2026-09-20 (DEC-2026-09-20-054): exactly one page, showing the
 * revision history and the finalized designs ONLY. A design appears here once the
 * client approved its artwork (`isFinal`), with the exact version that was approved —
 * a stored fact, not a guess (BUS-RULE-110).
 *
 * Read scope is deliberately broad (DEC-2026-09-20-057): every internal PIC who
 * appears on the milestone checklist progress/tracking may read it.
 *
 * Every value on this page comes from the API. There is no mock and no fallback.
 */

import React, { useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { CheckCircle2, History, Layers, RefreshCw } from "lucide-react";

import { api } from "@/lib/api";
import { unwrapData } from "@/lib/api-client";
import {
  DnaBadge,
  DnaButton,
  DnaDataTableCard,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaTable,
  DnaTableBody,
  DnaTableHead,
  DnaTableRow,
  DnaTd,
  DnaTdCode,
  DnaTh,
} from "@/components/dna";

type Feedback = {
  id: string;
  content: string | null;
  approvalStatus: "WAITING" | "APPROVED" | "REJECTED" | null;
  fromDivision: string;
  createdAt: string;
  version: { id: string; versionNumber: number } | null;
  author: { id: string; fullName: string } | null;
};

type FinalizedDesign = {
  id: string;
  brief: string;
  kanbanState: string;
  revisionCount: number;
  isLocked: boolean;
  isFinal: boolean;
  updatedAt: string;
  finalArtworkUrl: string | null;
  lead: { id: string; clientName: string; brandName: string | null } | null;
  versions: Array<{ id: string; versionNumber: number }>;
  feedbacks: Feedback[];
  approvedVersion: { id: string; versionNumber: number } | null;
};

type FinalizedResponse = {
  data: FinalizedDesign[];
  total: number;
  page: number;
  limit: number;
};

const statusVariant = (
  status: Feedback["approvalStatus"],
): "success" | "danger" | "info" => {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "info";
};

const statusLabel = (status: Feedback["approvalStatus"]) => {
  if (status === "APPROVED") return "DISETUJUI";
  if (status === "REJECTED") return "REVISI";
  return "MENUNGGU";
};

const formatDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function FinalizedDesignsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useApiQuery<FinalizedResponse>(
    ["creative", "finalized"],
    async (): Promise<FinalizedResponse> => {
      const resp = await api.get("/creative/finalized");
      const body = resp.data;
      if (Array.isArray(body)) {
        return { data: body, total: body.length, page: 1, limit: body.length };
      }
      return {
        data: unwrapData<FinalizedDesign[]>(body) ?? [],
        total: body?.total ?? 0,
        page: body?.page ?? 1,
        limit: body?.limit ?? 0,
      };
    },
  );

  const designs = data?.data ?? [];

  const totals = useMemo(() => {
    const revisions = designs.reduce((acc, d) => acc + d.revisionCount, 0);
    const versions = designs.reduce((acc, d) => acc + d.versions.length, 0);
    const locked = designs.filter((d) => d.isLocked).length;
    return { revisions, versions, locked };
  }, [designs]);

  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? "Gagal memuat daftar desain final.";

  const denied =
    (error as { response?: { status?: number } })?.response?.status === 403;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Desain Final & Riwayat"
        subtitle="Hanya desain yang artwork-nya sudah disetujui klien, beserta versi yang disetujui dan seluruh riwayat revisinya."
        actions={
          <DnaButton variant="outline" size="sm" icon={<RefreshCw />} onClick={() => refetch()}>
            Muat Ulang
          </DnaButton>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DnaStatCard
          label="DESAIN FINAL"
          value={data?.total ?? 0}
          icon={<CheckCircle2 />}
          variant="emerald"
        />
        <DnaStatCard
          label="TOTAL REVISI"
          value={totals.revisions}
          icon={<History />}
          variant="neutral"
        />
        <DnaStatCard
          label="TOTAL VERSI ARTWORK"
          value={totals.versions}
          icon={<Layers />}
          variant="neutral"
        />
      </div>

      <DnaDataTableCard
        title="Desain Disetujui Klien"
        description="Versi yang disetujui adalah fakta tersimpan, bukan tebakan dari urutan waktu."
        count={designs.length}
        totalItems={data?.total ?? 0}
      >
        {isLoading ? (
          <DnaLoadingSkeleton rows={5} />
        ) : isError ? (
          <DnaErrorState
            title={denied ? "Akses ditolak" : "Gagal memuat data"}
            message={
              denied
                ? "Anda tidak memiliki akses ke daftar desain final."
                : errorMessage
            }
            onRetry={() => refetch()}
          />
        ) : designs.length === 0 ? (
          <DnaEmptyState
            title="Belum ada desain final"
            description="Halaman ini hanya menampilkan desain yang artwork-nya sudah disetujui klien. Belum ada satu pun."
          />
        ) : (
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh>Klien / Brand</DnaTh>
                <DnaTh>Brief</DnaTh>
                <DnaTh align="center">Versi Disetujui</DnaTh>
                <DnaTh align="center">Revisi Terpakai</DnaTh>
                <DnaTh align="center">Total Versi</DnaTh>
                <DnaTh align="center">Status Kunci</DnaTh>
                <DnaTh align="right">Tanggal Final</DnaTh>
                <DnaTh align="center">Riwayat</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {designs.map((design) => {
                const isOpen = expandedId === design.id;
                return (
                  <React.Fragment key={design.id}>
                    <DnaTableRow isSelected={isOpen}>
                      <DnaTd isPrimary>
                        {design.lead?.brandName || design.lead?.clientName || "—"}
                      </DnaTd>
                      <DnaTd isMuted>{design.brief}</DnaTd>
                      <DnaTd align="center">
                        {design.approvedVersion ? (
                          <DnaTdCode code={`V${design.approvedVersion.versionNumber}`} />
                        ) : (
                          "—"
                        )}
                      </DnaTd>
                      <DnaTd align="center">{design.revisionCount}</DnaTd>
                      <DnaTd align="center">{design.versions.length}</DnaTd>
                      <DnaTd align="center">
                        <DnaBadge variant={design.isLocked ? "danger" : "slate"}>
                          {design.isLocked ? "TERKUNCI" : "TERBUKA"}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd align="right">{formatDate(design.updatedAt)}</DnaTd>
                      <DnaTd align="center">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<History />}
                          onClick={() => setExpandedId(isOpen ? null : design.id)}
                        >
                          {design.feedbacks.length}
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>

                    {isOpen && (
                      <DnaTableRow>
                        <DnaTd className="p-0">
                          <div className="w-full">
                            {design.feedbacks.length === 0 ? (
                              <DnaEmptyState
                                title="Belum ada riwayat keputusan"
                                description="Belum ada keputusan APJ atau klien yang tercatat untuk desain ini."
                              />
                            ) : (
                              <DnaTable>
                                <DnaTableHead>
                                  <DnaTableRow>
                                    <DnaTh>Versi</DnaTh>
                                    <DnaTh>Divisi</DnaTh>
                                    <DnaTh>Keputusan</DnaTh>
                                    <DnaTh>Oleh</DnaTh>
                                    <DnaTh>Catatan</DnaTh>
                                    <DnaTh align="right">Tanggal</DnaTh>
                                  </DnaTableRow>
                                </DnaTableHead>
                                <DnaTableBody>
                                  {design.feedbacks.map((feedback) => (
                                    <DnaTableRow key={feedback.id}>
                                      <DnaTd>
                                        {feedback.version
                                          ? `V${feedback.version.versionNumber}`
                                          : "—"}
                                      </DnaTd>
                                      <DnaTd isMuted>{feedback.fromDivision}</DnaTd>
                                      <DnaTd>
                                        <DnaBadge variant={statusVariant(feedback.approvalStatus)}>
                                          {statusLabel(feedback.approvalStatus)}
                                        </DnaBadge>
                                      </DnaTd>
                                      <DnaTd isMuted>{feedback.author?.fullName ?? "—"}</DnaTd>
                                      <DnaTd isMuted>{feedback.content ?? "—"}</DnaTd>
                                      <DnaTd align="right">
                                        {formatDate(feedback.createdAt)}
                                      </DnaTd>
                                    </DnaTableRow>
                                  ))}
                                </DnaTableBody>
                              </DnaTable>
                            )}
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </DnaTableBody>
          </DnaTable>
        )}
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
