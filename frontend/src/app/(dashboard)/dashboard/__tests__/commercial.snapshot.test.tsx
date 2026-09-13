// Snapshot test — Direksi Commercial dashboard (post DNA migration).
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

// Stub LeadBoard + MarketingForm + RetentionRadar to avoid cascading renders.
vi.mock("@/components/commercial/lead-board", () => ({
  LeadBoard: () => <div data-testid="mock-lead-board" />,
}));
vi.mock("@/components/commercial/marketing-form", () => ({
  MarketingForm: () => <div data-testid="mock-marketing-form" />,
}));
vi.mock("@/components/commercial/retention-radar", () => ({
  RetentionRadar: () => <div data-testid="mock-retention-radar" />,
}));

import CommercialDashboard from "./../commercial/page";

describe("Direksi CommercialDashboard (snapshot)", () => {
  it("renders with leads + retention data and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "leads") {
        return {
          data: [
            { id: "l1", status: "WON_DEAL", is_sla_warning: false, sla_warning: false },
            { id: "l2", status: "OPEN", is_sla_warning: true, sla_warning: true },
            { id: "l3", status: "WON_DEAL", is_sla_warning: false, sla_warning: false },
          ],
          isLoading: false,
        };
      }
      if (queryKey[0] === "retention-radar") {
        return {
          data: [
            { risk_level: "HIGH" },
            { risk_level: "LOW" },
          ],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    });

    const { container } = render(<CommercialDashboard />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders empty state (no leads) and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
    });
    const { container } = render(<CommercialDashboard />);
    expect(container.firstChild).toMatchSnapshot();
  });
});