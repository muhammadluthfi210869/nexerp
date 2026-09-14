// Snapshot test — Direksi Fulfillment dashboard (post DNA migration).
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

import FulfillmentDashboard from "./../fulfillment/page";

describe("Direksi FulfillmentDashboard (snapshot)", () => {
  it("renders finished goods + shipments and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "production-plans") {
        return {
          data: [
            {
              id: "pp1",
              batch_no: "BATCH-001",
              status: "DONE",
              finishedGoods: { id: "fg1", stock_qty: 250 },
            },
          ],
          isLoading: false,
        };
      }
      if (queryKey[0] === "shipments") {
        return {
          data: [
            {
              id: "SHIP-001",
              so_id: "so1",
              logistics_id: "log1",
              status: "PACKING",
              tracking_no: "TRK-001",
              shipped_at: "2026-09-10",
              delivered_at: "",
              so: { lead: { client_name: "PT NEX KOSMETIK" } },
            },
            {
              id: "SHIP-002",
              so_id: "so2",
              logistics_id: "log2",
              status: "DELIVERED",
              tracking_no: "TRK-002",
              shipped_at: "2026-09-09",
              delivered_at: "2026-09-11",
              so: { lead: { client_name: "CV BEAUTY MANDIRI" } },
            },
          ],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    });

    const { container } = render(<FulfillmentDashboard />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders empty state (no FG / no shipments) and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
    });
    const { container } = render(<FulfillmentDashboard />);
    expect(container.firstChild).toMatchSnapshot();
  });
});