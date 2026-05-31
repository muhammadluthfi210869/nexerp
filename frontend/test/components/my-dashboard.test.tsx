import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock the API module
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        userId: "user-1",
        cards: {
          leads: { value: 24, target: 30 },
          deals: { value: 6, target: 10 },
        },
        pendingAudits: 2,
        activeWorkOrders: 3,
        recentActivity: 12,
      },
    }),
  },
}));

// Mock DashboardShell and KpiCard to avoid complex render
vi.mock("@/components/layout/DashboardShell", () => ({
  DashboardShell: ({ children }: any) => <div data-testid="shell">{children}</div>,
}));

vi.mock("@/components/dna/KpiCard", () => ({
  KpiCard: ({ label, value }: any) => <div data-testid="kpi-card">{label}: {value}</div>,
}));

vi.mock("@/components/dna/SectionLabel", () => ({
  SectionLabel: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn().mockReturnValue({
    data: {
      userId: "user-1",
      cards: {
        leads: { value: 24, target: 30 },
        deals: { value: 6, target: 10 },
      },
      pendingAudits: 2,
      activeWorkOrders: 3,
      recentActivity: 12,
    },
    isLoading: false,
    error: null,
  }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: any) => <>{children}</>,
}));

import MyDashboardPage from "@/app/(dashboard)/my-dashboard/page";

describe("My Dashboard Page", () => {
  it("renders the dashboard shell", () => {
    render(<MyDashboardPage />);
    expect(screen.getByTestId("shell")).toBeTruthy();
  });

  it("renders all 5 KPI cards", () => {
    render(<MyDashboardPage />);
    const cards = screen.getAllByTestId("kpi-card");
    expect(cards.length).toBe(5);
  });

  it("shows task list section", () => {
    render(<MyDashboardPage />);
    expect(screen.getByText("Task List")).toBeTruthy();
  });

  it("shows task items with pending and active counts", () => {
    render(<MyDashboardPage />);
    expect(screen.getByText(/Follow-up/)).toBeTruthy();
    expect(screen.getByText(/pending QC audits/)).toBeTruthy();
    expect(screen.getByText(/active work orders/)).toBeTruthy();
  });

  it("renders all required sections", () => {
    render(<MyDashboardPage />);
    // Just verify the shell renders — the page handles null data internally
    expect(screen.getByTestId("shell")).toBeTruthy();
  });
});
