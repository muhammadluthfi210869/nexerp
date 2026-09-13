// Snapshot test — Direksi QC dashboard (post DNA migration).
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

import QCPortal from "./../qc/page";

describe("Direksi QCPortal (snapshot)", () => {
  it("renders pending audits table and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [
        {
          id: "pp1",
          batch_no: "BATCH-QC-001",
          stepLogs: [
            {
              id: "sl1",
              stage: "MIXING",
              input_qty: 1000,
              qty_result: 950,
              qty_reject: 30,
              qty_quarantine: 20,
              shrinkage_qty: 50,
              created_at: "2026-09-10T10:00:00Z",
              qcAudits: [],
            },
            {
              id: "sl2",
              stage: "PACKAGING",
              input_qty: 950,
              qty_result: 920,
              qty_reject: 10,
              qty_quarantine: 20,
              shrinkage_qty: 30,
              created_at: "2026-09-11T10:00:00Z",
              qcAudits: [{ status: "FAIL" }],
            },
          ],
        },
      ],
      isLoading: false,
    });

    const { container } = render(<QCPortal />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders empty pending audits state and matches snapshot", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
    });
    const { container } = render(<QCPortal />);
    expect(container.firstChild).toMatchSnapshot();
  });
});