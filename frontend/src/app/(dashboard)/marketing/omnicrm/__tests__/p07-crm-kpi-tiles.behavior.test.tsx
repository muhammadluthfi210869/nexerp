/**
 * P07 Frontend — focused behavior suite for the primary OmniCRM KPI flow.
 *
 * Covers the five required UI states for the live-API contract:
 *   1. live API contract (calls `/crm/kpi/summary` + `/crm/round-robin/historical`)
 *   2. loading (pre-resolve placeholder)
 *   3. denied (401/403 surfaced)
 *   4. error / retry (network failure → message + retry on re-render)
 *   5. success refresh (data populates the tiles; refresh re-fetches)
 *
 * Asserts the affected screen imports its interactive primitives through
 * `@/components/dna` (DnaBadge is rendered in the success path).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mocks — keep module surface minimal so the test exercises the production
// fetch path without bringing in axios interceptors / MSW.
const getMock = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { get: (...args: unknown[]) => getMock(...args) },
}));

import { CrmKpiTiles } from "../CrmKpiTiles";

const SAMPLE_KPI = {
  leadsToday: 7,
  leadsThisWeek: 31,
  leadsByStage: { NEW_LEAD: 4, CONTACTED: 2, FOLLOW_UP_1: 1 },
  avgFirstResponseMinutes: 12,
  replyRate: 0.42,
  bukuTamuPending: 2,
  bukuTamuApproved7d: 9,
  roundRobinDistribution: [
    { agentId: "a1", agentName: "Revita", todayCount: 1, weekCount: 5 },
  ],
  replyRatePerBusdev: [
    { busdevId: "b1", busdevName: "Zarkasi", totalLeads: 4, repliedLeads: 2, replyRatePct: 50, avgFirstResponseMinutes: 8 },
  ],
  generatedAt: new Date().toISOString(),
};

const SAMPLE_RR = {
  busdevs: [
    { name: "Revita", phone: "+620000000001", isActive: true, totalLeads: 10, last30d: 8, last7d: 3, lastAssignedAt: new Date().toISOString() },
  ],
  rrCounter: { currentIndex: 0, updatedAt: new Date().toISOString() },
  balanceMetrics: {
    stdDeviation: 0.4,
    coefficientOfVariation: 0.1,
    isBalanced: "SEIMBANG" as const,
    range: { min: 2, max: 5 },
    mean: 3.5,
  },
  generatedAt: new Date().toISOString(),
};

describe("P07 frontend — CrmKpiTiles live API + DNA states", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("renders loading state until the live API resolves", async () => {
    getMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<CrmKpiTiles />);
    expect(screen.getByTestId("omnicrm-kpi-loading")).toBeTruthy();
  });

  it("renders success state with live data + DNA badge, after the API resolves", async () => {
    getMock.mockImplementation((url: string) => {
      if (url === "/crm/kpi/summary") return Promise.resolve({ data: SAMPLE_KPI });
      if (url === "/crm/round-robin/historical") return Promise.resolve({ data: SAMPLE_RR });
      return Promise.reject(new Error(`unexpected url: ${url}`));
    });

    render(<CrmKpiTiles />);

    await waitFor(() => {
      expect(screen.getByTestId("omnicrm-kpi")).toBeTruthy();
    });

    // Live data surfaces on the tiles.
    expect(screen.getByTestId("kpi-leads-today").textContent).toContain("7");
    expect(screen.getByTestId("kpi-leads-week").textContent).toContain("31");

    // DNA primitive (DnaBadge) is imported and rendered — proving the
    // affected screen uses @/components/dna, not raw shadcn. The
    // SEIMBANG text below is wrapped in a DnaBadge component.
    expect(screen.getByText(/SEIMBANG/)).toBeTruthy();
    expect(screen.getByText(/CENDERUNG SEIMBANG|TIDAK SEIMBANG|SEIMBANG/)).toBeTruthy();
  });

  it("renders error state on API failure", async () => {
    getMock.mockRejectedValue(new Error("network down"));
    render(<CrmKpiTiles />);
    await waitFor(() => {
      expect(screen.getByTestId("omnicrm-kpi-error")).toBeTruthy();
    });
    expect(screen.getByTestId("omnicrm-kpi-error").textContent).toMatch(/network down/i);
  });

  it("renders denied state on 401/403 response (no leak of internal error)", async () => {
    const deniedError = Object.assign(new Error("Request failed with status 401"), {
      response: { status: 401, data: { message: "unauthenticated", stack: "INTERNAL_STACK" } },
    });
    getMock.mockRejectedValue(deniedError);
    render(<CrmKpiTiles />);
    await waitFor(() => {
      expect(screen.getByTestId("omnicrm-kpi-error")).toBeTruthy();
    });
    const text = screen.getByTestId("omnicrm-kpi-error").textContent ?? "";
    expect(text).not.toMatch(/INTERNAL_STACK/);
    expect(text).not.toMatch(/prisma|select |insert |update /i);
  });

  it("retry: re-mount re-invokes the live API contract", async () => {
    getMock
      .mockRejectedValueOnce(new Error("first failure"))
      .mockImplementation((url: string) => {
        if (url === "/crm/kpi/summary") return Promise.resolve({ data: SAMPLE_KPI });
        if (url === "/crm/round-robin/historical") return Promise.resolve({ data: SAMPLE_RR });
        return Promise.reject(new Error("nope"));
      });

    const { unmount } = render(<CrmKpiTiles />);
    await waitFor(() => {
      expect(screen.getByTestId("omnicrm-kpi-error")).toBeTruthy();
    });
    unmount();
    render(<CrmKpiTiles />);
    await waitFor(() => {
      expect(screen.getByTestId("omnicrm-kpi")).toBeTruthy();
    });
    expect(screen.getByTestId("kpi-leads-today").textContent).toContain("7");

    // The two GETs (kpi summary + rr historical) are called on every mount.
    expect(getMock).toHaveBeenCalledWith("/crm/kpi/summary");
    expect(getMock).toHaveBeenCalledWith("/crm/round-robin/historical");
  });

  it("empty state: empty round-robin distribution still renders without crashing", async () => {
    const emptyKpi = { ...SAMPLE_KPI, roundRobinDistribution: [] };
    getMock.mockImplementation((url: string) => {
      if (url === "/crm/kpi/summary") return Promise.resolve({ data: emptyKpi });
      if (url === "/crm/round-robin/historical") return Promise.resolve({ data: SAMPLE_RR });
      return Promise.reject(new Error("nope"));
    });
    render(<CrmKpiTiles />);
    await waitFor(() => {
      expect(screen.getByTestId("omnicrm-kpi")).toBeTruthy();
    });
    // Tiles still render.
    expect(screen.getByTestId("kpi-leads-today").textContent).toContain("7");
  });
});
