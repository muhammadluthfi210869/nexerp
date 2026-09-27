// Snapshot test — Direksi Super-Admin terminal (post DNA migration).
// Mocks all child dashboards so snapshot is stable + doesn't cascade.
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// The page queries live endpoints; this snapshot must not touch the network.
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined, isLoading: false, error: null, refetch: vi.fn() }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("./../commercial/page", () => ({
  default: () => <div data-testid="mock-commercial" />,
}));
vi.mock("../../samples/rnd-dashboard/page", () => ({
  default: () => <div data-testid="mock-rnd" />,
}));
vi.mock("../../production/production-floor-dashboard/page", () => ({
  default: () => <div data-testid="mock-production" />,
}));
vi.mock("./../finance/page", () => ({
  default: () => <div data-testid="mock-finance" />,
}));

import SuperAdminTerminal from "./../super-admin/page";

describe("Direksi SuperAdminTerminal (snapshot)", () => {
  it("renders tabs navigation + marketing tab content and matches snapshot", () => {
    const { container } = render(<SuperAdminTerminal />);
    expect(container.firstChild).toMatchSnapshot();
  });
});