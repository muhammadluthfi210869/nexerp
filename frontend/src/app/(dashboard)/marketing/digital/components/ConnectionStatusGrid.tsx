'use client';

import { ChevronRight, Eye } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardCard } from '@/components/dna/DashboardCard';
import type { Connection, Freshness } from '@/types/marketing-overview';
import { formatInteger, formatPercent } from '../lib/format';
import { FreshnessDot } from './FreshnessDot';

function EmptySource({ connection, compact = false }: { connection: Connection; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--gray-50)] px-5 text-center ${compact ? 'min-h-28 py-4' : 'min-h-44 py-6'}`}>
      <p className="mt-2 text-sm font-bold text-[var(--gray-900)]">Data belum tersedia</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">{connection.message}</p>
    </div>
  );
}

// Ponytail: derive per-provider freshness from overview.freshness[].
// Falls back to a fresh 'needs_configuration' when missing (defensive).
function freshnessFor(list: Freshness[], provider: string): Freshness {
  return (
    list.find((f) => f.provider === provider) ?? {
      provider,
      status: 'needs_configuration',
      lastSuccessfulSyncAt: null,
    }
  );
}

export function ConnectionStatusGrid({ freshness, metaAds, instagram, googleOrganic, onViewCampaigns }: {
  freshness: Freshness[];
  metaAds: { connection: Connection; summary: { spend: number; impressions: number; reach: number; clicks: number; leads: number }; campaigns: unknown[] };
  instagram: { connection: Connection; summary: { followers: number; media: number; likes: number; comments: number }; topPosts: Array<{ id: string; title: string; permalink: string; likes: number; comments: number }> };
  googleOrganic: { connection: Connection; summary: { clicks: number; impressions: number; ctr: number; position: number }; trend: Array<{ date: string; clicks: number }> };
  onViewCampaigns: () => void;
}) {
  const metaFresh = freshnessFor(freshness, 'meta_ads');
  const igFresh = freshnessFor(freshness, 'instagram');
  const gscFresh = freshnessFor(freshness, 'google_search_console');

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {/* Meta Ads */}
      <DashboardCard className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[var(--gray-900)]">Meta Ads</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Campaign dan paid performance.</p>
          </div>
          <FreshnessDot status={metaFresh.status} lastSync={metaFresh.lastSuccessfulSyncAt ?? null} label="Meta Ads" />
        </div>
        {metaAds.campaigns.length ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--gray-50)] p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">Impressions</p>
                <p className="mt-1 text-lg font-extrabold text-[var(--gray-900)] tabular-nums">{formatInteger(metaAds.summary.impressions)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--gray-50)] p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">Clicks</p>
                <p className="mt-1 text-lg font-extrabold text-[var(--gray-900)] tabular-nums">{formatInteger(metaAds.summary.clicks)}</p>
              </div>
            </div>
            <button type="button" onClick={onViewCampaigns} className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-xs font-bold text-[var(--status-action)] hover:underline">
              Lihat semua campaign<ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="mt-5">
            <EmptySource connection={metaAds.connection} compact />
          </div>
        )}
      </DashboardCard>

      {/* Instagram */}
      <DashboardCard className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[var(--gray-900)]">Instagram organic</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Akun professional dan top content.</p>
          </div>
          <FreshnessDot status={igFresh.status} lastSync={igFresh.lastSuccessfulSyncAt ?? null} label="Instagram" />
        </div>
        {instagram.topPosts.length ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--gray-50)] p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">Followers</p>
                <p className="mt-1 text-lg font-extrabold text-[var(--gray-900)] tabular-nums">{formatInteger(instagram.summary.followers)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--gray-50)] p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">Konten</p>
                <p className="mt-1 text-lg font-extrabold text-[var(--gray-900)] tabular-nums">{formatInteger(instagram.summary.media)}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {instagram.topPosts.slice(0, 2).map((post) => (
                <a
                  key={post.id}
                  href={post.permalink || undefined}
                  target={post.permalink ? '_blank' : undefined}
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-2 text-xs transition hover:bg-[var(--gray-50)]"
                >
                  <p className="min-w-0 truncate font-bold text-[var(--gray-900)]">{post.title}</p>
                  <span className="flex shrink-0 items-center gap-1 font-bold text-[var(--text-muted)]">
                    <Eye className="h-3.5 w-3.5" />{formatInteger(post.likes + post.comments)}
                  </span>
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-5"><EmptySource connection={instagram.connection} compact /></div>
        )}
      </DashboardCard>

      {/* Google Search Console */}
      <DashboardCard className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[var(--gray-900)]">Google organic</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Search Console: klik dan visibilitas web.</p>
          </div>
          <FreshnessDot status={gscFresh.status} lastSync={gscFresh.lastSuccessfulSyncAt ?? null} label="Google Search Console" />
        </div>
        {googleOrganic.trend.length ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--gray-50)] p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">Clicks</p>
                <p className="mt-1 text-lg font-extrabold text-[var(--gray-900)] tabular-nums">{formatInteger(googleOrganic.summary.clicks)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--gray-50)] p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--gray-500)]">CTR</p>
                <p className="mt-1 text-lg font-extrabold text-[var(--gray-900)] tabular-nums">{formatPercent(googleOrganic.summary.ctr)}</p>
              </div>
            </div>
            <div className="mt-4 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={googleOrganic.trend}>
                  <Bar dataKey="clicks" fill="var(--status-success)" radius={[5, 5, 0, 0]} />
                  <Tooltip formatter={(value) => [formatInteger(Number(value)), 'Clicks']} contentStyle={{ borderRadius: 12, borderColor: 'var(--border-color)', fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="mt-5"><EmptySource connection={googleOrganic.connection} compact /></div>
        )}
      </DashboardCard>
    </section>
  );
}
