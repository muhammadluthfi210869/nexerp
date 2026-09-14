// Snapshot test — Direksi Finance dashboard (post DNA migration).
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

import FinanceDashboard from "./../finance/page";

describe("Direksi FinanceDashboard (snapshot)", () => {
  it("renders sales orders + invoices table and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [
        {
          id: "SO-2026-001",
          total_amount: 250_000_000,
          status: "PENDING_DP",
          created_at: "2026-09-01T10:00:00Z",
          lead: { client_name: "PT NEX KOSMETIK" },
          sample: { id: "s1", name: "Glow Serum 30ml" },
          invoices: [
            { id: "INV-1", so_id: "SO-2026-001", type: "DP", amount_due: 75_000_000, status: "UNPAID" },
          ],
        },
        {
          id: "SO-2026-002",
          total_amount: 480_000_000,
          status: "ACTIVE",
          created_at: "2026-09-02T11:00:00Z",
          lead: { client_name: "CV BEAUTY MANDIRI" },
          sample: { id: "s2", name: "Anti Aging Cream" },
          invoices: [
            { id: "INV-2", so_id: "SO-2026-002", type: "FINAL_PAYMENT", amount_due: 336_000_000, status: "PAID" },
          ],
        },
      ],
      isLoading: false,
    });

    const { container } = render(<FinanceDashboard />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders loading state and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const { container } = render(<FinanceDashboard />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders empty sales orders state and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
    });
    const { container } = render(<FinanceDashboard />);
    expect(container.firstChild).toMatchSnapshot();
  });
});