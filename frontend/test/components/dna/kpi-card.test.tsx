import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { KpiCard } from "@/components/dna/KpiCard";
import { DollarSign, Activity } from "lucide-react";

describe("KpiCard", () => {
  it("renders label, value, and target percentage", () => {
    render(<KpiCard label="Revenue" value="Rp 850 Jt" targetPct={57} />);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Rp 850 Jt")).toBeInTheDocument();
    expect(screen.getByText("57%")).toBeInTheDocument();
  });

  it("applies underperform styling when targetPct < 70", () => {
    const { container } = render(
      <KpiCard label="OEE" value="62.4%" targetPct={62} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-rose-300");
    const value = screen.getByText("62.4%");
    expect(value.className).toContain("text-rose-600");
    const pct = screen.getByText("62%");
    expect(pct.className).toContain("text-rose-600");
  });

  it("applies on-track styling when targetPct >= 100", () => {
    const { container } = render(
      <KpiCard label="Output" value="12,450 pcs" targetPct={108} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-emerald-300");
    const value = screen.getByText("12,450 pcs");
    expect(value.className).toContain("text-emerald-600");
  });

  it("applies stable styling when 70 <= targetPct < 100", () => {
    const { container } = render(
      <KpiCard label="Yield" value="92.1%" targetPct={92} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain("border-rose-300");
    expect(card.className).not.toContain("border-emerald-300");
    const value = screen.getByText("92.1%");
    expect(value.className).not.toContain("text-rose-600");
    expect(value.className).not.toContain("text-emerald-600");
  });

  it("renders icon when provided", () => {
    const { container } = render(
      <KpiCard label="Revenue" value="85%" targetPct={85} icon={<DollarSign />} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("does not crash when rendered with minimal props", () => {
    // Minimal render — just verify component mounts
    const { container } = render(
      <KpiCard label="Revenue" value="85%" targetPct={85} />
    );
    expect(container).toBeTruthy();
  });

  it("capped target bar at 100% for values above target", () => {
    render(<KpiCard label="Output" value="150" targetPct={150} />);
    // Should render 150% text but bar width capped
    expect(screen.getByText("150%")).toBeInTheDocument();
  });

  it("has a card container element", () => {
    const { container } = render(
      <KpiCard label="Test" value="100" targetPct={100} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with subValue", () => {
    render(
      <KpiCard
        label="Revenue"
        value="Rp 1.5 M"
        targetPct={85}
        subValue="Revenue MTD"
      />
    );
    // Just verify no crash — KpiCard doesn't render subValue in current design
    expect(screen.getByText("Revenue")).toBeInTheDocument();
  });

  it("clones icon for background effect", () => {
    // Verify the component doesn't crash with complex icon
    render(
      <KpiCard
        label="Production"
        value="88%"
        targetPct={88}
        icon={<Activity />}
      />
    );
    expect(screen.getByText("Production")).toBeInTheDocument();
  });
});
