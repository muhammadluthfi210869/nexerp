import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { createEmptyBrandReport, EMPTY_LEAD_FUNNELS, EMPTY_TIKTOK_REPORT, EMPTY_YOUTUBE_REPORT, EMPTY_WEBSITE_REPORT, EMPTY_META_ADS_REPORT, EMPTY_GOOGLE_ADS_REPORT } from '@/app/(dashboard)/marketing/reports/workspace/data/channelReportsData';
import { TikTokSection } from '@/app/(dashboard)/marketing/reports/workspace/components/TikTokSection';
import { YouTubeSection } from '@/app/(dashboard)/marketing/reports/workspace/components/YouTubeSection';
import { WebsiteSection } from '@/app/(dashboard)/marketing/reports/workspace/components/WebsiteSection';
import { PaidAdsSection } from '@/app/(dashboard)/marketing/reports/workspace/components/PaidAdsSection';
import { NurturingFunnelSection } from '@/app/(dashboard)/marketing/reports/workspace/components/NurturingFunnelSection';

describe('Brand Workspace Zero State & Clean API Defaulting', () => {
  it('creates empty brand report with all metrics at 0', () => {
    const report = createEmptyBrandReport('Dreamlab', 'September 2026');
    expect(report.totalFollowers).toBe(0);
    expect(report.totalViews).toBe(0);
    expect(report.totalReach).toBe(0);
    expect(report.totalImpressions).toBe(0);
    expect(report.totalLikes).toBe(0);
    expect(report.totalComments).toBe(0);
    expect(report.totalShares).toBe(0);
    expect(report.totalSaves).toBe(0);
    expect(report.totalEngagements).toBe(0);
    expect(report.engagementRate).toBe(0);
    expect(report.storiesRecap?.totalStoriesCreated).toBe(0);
    expect(report.storiesRecap?.totalStoryViews).toBe(0);
    expect(report.weeklyReports).toEqual([]);
    expect(report.leadFunnels).toBeDefined();
    expect(report.leadFunnels?.every(f => f.traffic === 0 && f.prospects === 0 && f.goals === 0)).toBe(true);
  });

  it('renders TikTokSection with 0s when no data is provided', () => {
    render(<TikTokSection data={EMPTY_TIKTOK_REPORT} />);
    expect(screen.queryByText('12,400')).toBeNull();
    expect(screen.queryByText('6,820')).toBeNull();
    expect(screen.queryByText('148')).toBeNull();
  });

  it('renders YouTubeSection with 0s when no data is provided', () => {
    render(<YouTubeSection data={EMPTY_YOUTUBE_REPORT} />);
    expect(screen.queryByText('28,400')).toBeNull();
    expect(screen.queryByText('1,420')).toBeNull();
    expect(screen.queryByText('215,000')).toBeNull();
  });

  it('renders WebsiteSection with 0s when no data is provided', () => {
    render(<WebsiteSection data={EMPTY_WEBSITE_REPORT} />);
    expect(screen.queryByText('38,400')).toBeNull();
    expect(screen.queryByText('148,500')).toBeNull();
  });

  it('renders PaidAdsSection with 0s when no data is provided', () => {
    render(<PaidAdsSection metaAds={EMPTY_META_ADS_REPORT} googleAds={EMPTY_GOOGLE_ADS_REPORT} />);
    expect(screen.queryByText('384,000')).toBeNull();
    expect(screen.queryByText('312')).toBeNull();
  });

  it('renders NurturingFunnelSection with 0s when empty funnels is provided', () => {
    render(<NurturingFunnelSection funnels={EMPTY_LEAD_FUNNELS} />);
    expect(screen.queryByText('186,000')).toBeNull();
    expect(screen.queryByText('312')).toBeNull();
  });
});
