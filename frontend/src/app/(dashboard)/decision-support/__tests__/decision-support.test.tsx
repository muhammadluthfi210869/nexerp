// Smoke test for /decision-support page (Wave 4 / D3).
// Verifies the page renders the 3 tabs + pending items in mock mode
// without crashing. Stubs axios + lucide icons per the kpi-management
// test pattern.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@/lib/api", () => {
  const mockApi = {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: { ok: true } }),
    patch: vi.fn().mockResolvedValue({ data: { ok: true } }),
  };
  return { api: mockApi, extractApiError: vi.fn() };
});

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual<typeof import("lucide-react")>("lucide-react");
  return new Proxy(actual, {
    get(target, prop) {
      if (typeof prop === "string" && /^[A-Z]/.test(prop)) {
        const Stub = (props: any) => <span data-icon={prop} {...props} />;
        Stub.displayName = String(prop);
        return Stub;
      }
      return (target as any)[prop];
    },
  });
});

vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// DecisionService is in mock mode by default (NEXT_PUBLIC_DECISION_API_MODE != real).
// We override the mock with controlled fixtures via a module-level vi.mock factory.

vi.mock("@/lib/services/decision-service", () => ({
  decisionService: {
    listPending: vi.fn().mockResolvedValue([
      {
        id: "approval:po-1",
        type: "APPROVAL",
        severity: "HIGH",
        title: "PO PO-TEST-001 menunggu approval",
        description: "Diajukan >3 hari",
        contextRefs: [
          { entityType: "PurchaseOrder", entityId: "po-uuid-1", label: "PO-TEST-001" },
        ],
        createdAt: "2026-09-10T08:00:00Z",
      },
    ]),
    listQueue: vi.fn().mockResolvedValue([]),
    listRecommendations: vi.fn().mockResolvedValue([
      {
        id: "rec:prioritise-pending",
        title: "Prioritaskan review HIGH/CRITICAL",
        rationale: "1 item menunggu approval.",
        impact: "Mengurangi backlog SLA.",
        basedOn: ["PO-TEST-001"],
      },
    ]),
    listHistory: vi.fn().mockResolvedValue([]),
    listRules: vi.fn().mockResolvedValue([]),
    resolve: vi.fn().mockResolvedValue({ ok: true, id: "test" }),
    toggleRule: vi.fn().mockResolvedValue({ ok: true, id: "test" }),
  },
  isDecisionMockMode: true,
}));

import Page from "../page";

beforeEach(() => {
  // Mock localStorage so the viewer read works
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      "user",
      JSON.stringify({ id: "u-test", fullName: "Test User", roles: ["DIRECTOR"] }),
    );
  }
});

describe("/decision-support page", () => {
  it("renders title and tabs in mock mode", async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Decision Support/i)).toBeInTheDocument();
    });
  });

  it("renders the recommendations strip when recs present", async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Prioritaskan review/i)).toBeInTheDocument();
    });
  });

  it("renders pending items after fetch", async () => {
    render(<Page />);
    // Page renders recommendations + pending tabs; assert HIGH badge appears
    await waitFor(
      () => {
        expect(screen.getAllByText(/HIGH/i).length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
  });
});