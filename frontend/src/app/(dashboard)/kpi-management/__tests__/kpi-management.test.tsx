// Smoke tests for KPI Management pages (Wave 3 D2).
// Verifies each page renders without crashing. Mocks axios so we don't
// hit the backend.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@/lib/api", () => {
  const mockApi = {
    get: vi.fn().mockResolvedValue({
      data: {
        userId: "user-1",
        total: 5,
        breakdown: { CREATE: 2, PAGE_VIEW: 3 },
        completionRate: 0.5,
        pageViews: 3,
        mutations: 2,
        period: { from: "2026-01-01", to: "2026-01-08" },
      },
    }),
  };
  return { api: mockApi };
});

// Stub lucide-react icons so test output is stable
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual<typeof import("lucide-react")>("lucide-react");
  return new Proxy(actual, {
    get(target, prop) {
      if (typeof prop === "string" && /^[A-Z]/.test(prop)) {
        // Return a stub component for icon-like names
        const Stub = (props: any) => <span data-icon={prop} {...props} />;
        Stub.displayName = String(prop);
        return Stub;
      }
      return (target as any)[prop];
    },
  });
});

// Stub next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Stub DnaDatePicker / DnaSearchableSelect — they pull heavy deps
vi.mock("@/components/dna", async () => {
  const actual = await vi.importActual<any>("@/components/dna");
  return {
    ...actual,
    DnaDatePicker: ({ value, onChange }: any) => (
      <input
        data-testid="date-picker"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
    ),
    DnaSearchableSelect: ({ value, onChange, options }: any) => (
      <select
        data-testid="searchable-select"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options?.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

describe("KPI Management smoke tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PersonalKpiPage renders the header", async () => {
    const { PersonalKpiClient } = await import("../personal/PersonalKpiClient");
    render(<PersonalKpiClient />);
    expect(screen.getByText("KPI Personal")).toBeInTheDocument();
  });

  it("DivisionKpiPage renders the header", async () => {
    const { DivisionKpiClient } = await import("../division/DivisionKpiClient");
    render(<DivisionKpiClient />);
    expect(screen.getByText("KPI Per Divisi")).toBeInTheDocument();
  });

  it("KpiLandingClient renders entry cards", async () => {
    const { KpiLandingClient } = await import("../KpiLandingClient");
    render(<KpiLandingClient />);
    await waitFor(() => {
      expect(screen.getByText("KPI Management")).toBeInTheDocument();
    });
    expect(screen.getByText("KPI Personal")).toBeInTheDocument();
    expect(screen.getByText("KPI Per Divisi")).toBeInTheDocument();
  });
});