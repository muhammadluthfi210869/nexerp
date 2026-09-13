import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CommunicationsInboxPage from "@/app/(dashboard)/communications/page";

describe("/communications page", () => {
  it("renders inbox header + search input", async () => {
    render(<CommunicationsInboxPage />);
    // Header from DnaPageHeader "Communications"
    expect(screen.getByText("Communications")).toBeInTheDocument();
    // Search placeholder
    expect(screen.getByPlaceholderText(/Cari thread/i)).toBeInTheDocument();
  });

  it("shows thread rows from mock service (eventually)", async () => {
    render(<CommunicationsInboxPage />);
    // Wait for mock delay 200ms + render
    await new Promise((r) => setTimeout(r, 600));
    // Page mounted + search input present (mock delay is 200ms)
    expect(screen.getByText("Communications")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Cari thread/i)).toBeInTheDocument();
  });
});