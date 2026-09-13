// Snapshot test — Direksi main dashboard (post DNA migration).
// Locks layout integrity: if shadcn/DNA className drift changes visible structure,
// the snapshot diff will surface it for review.
//
// Strategy: mock react-query useQuery so the page renders with deterministic
// audit data (no MSW roundtrip needed for marketing endpoint).
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

// Mock heavy lazy chart component so snapshot stays small + deterministic.
vi.mock("./../DashboardCharts", () => ({
  TrendAreaChart: () => <div data-testid="mock-trend-chart" />,
  SpendBarChart: () => <div data-testid="mock-spend-chart" />,
  AdSpendPieChart: () => <div data-testid="mock-ad-spend-chart" />,
}));

import DashboardPage from "./../page";

describe("Direksi DashboardPage (snapshot)", () => {
  it("renders marketing audit with seeded data and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        acquisition: {
          revenue_mtd: 250_000_000,
          target: 350_000_000,
          deal_count: 42,
          avg_cpa: 85_000,
        },
        funnel: { leads: 1200, samples: 180, closing_rate: 5.8 },
        budget: {
          total_spend: 18_500_000,
          budget_limit: 25_000_000,
          cpl: 15416,
          cost_per_sample: 102777,
        },
        trends: [
          { date: "2026-09-01", leads: 120, cpl: 16000, spend: 1_900_000 },
          { date: "2026-09-02", leads: 135, cpl: 14800, spend: 2_000_000 },
        ],
        content: [
          { id: "c1", title: "AUREON LAUNCH", category: "Reels", views: 24_000, engagement_rate: 4.2 },
        ],
        vitality: {
          followers: 120_000,
          growth: "3.4%",
          total_likes: 8_400,
          total_comments: 320,
          total_shares: 190,
          total_saves: 410,
        },
        platform_audit: [
          { platform: "META", spend: 12_000_000, leads: 800, cpl: 15000, cpc: 1200 },
          { platform: "TIKTOK", spend: 6_500_000, leads: 400, cpl: 16250, cpc: 950 },
        ],
        lead_ranking: [
          { source: "Meta Ads", count: 420 },
          { source: "TikTok Ads", count: 280 },
        ],
      },
      isLoading: false,
      isError: false,
    });

    const { container } = render(<DashboardPage />);
    expect(container.firstChild).toMatchSnapshot();
    expect(screen.getByText("Marketing")).toBeInTheDocument();
  });

  it("renders the loading skeleton state and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    const { container } = render(<DashboardPage />);
    expect(container.firstChild).toMatchSnapshot();
  });
});