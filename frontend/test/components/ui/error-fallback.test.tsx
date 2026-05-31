import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ErrorFallback } from "@/components/ui/empty-state";

describe("ErrorFallback", () => {
  it("shows error message from Error object", () => {
    const error = new Error("Something went wrong");
    render(<ErrorFallback error={error} />);
    expect(screen.getByText(/Something went wrong/)).toBeTruthy();
  });

  it("shows Indonesian heading", () => {
    const error = new Error("Test error");
    render(<ErrorFallback error={error} />);
    expect(screen.getByText("Terjadi Kesalahan")).toBeTruthy();
  });

  it("shows retry button when retry prop is provided", () => {
    const error = new Error("Test");
    const retry = vi.fn();
    render(<ErrorFallback error={error} retry={retry} />);
    expect(screen.getByText("Coba Lagi")).toBeTruthy();
  });

  it("calls retry function when retry button is clicked", async () => {
    const error = new Error("Test");
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorFallback error={error} retry={retry} />);
    await user.click(screen.getByText("Coba Lagi"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("hides retry button when retry prop is not provided", () => {
    const error = new Error("Test");
    render(<ErrorFallback error={error} />);
    expect(screen.queryByText("Coba Lagi")).toBeNull();
  });

  it("renders alert triangle icon", () => {
    const error = new Error("Test");
    const { container } = render(<ErrorFallback error={error} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("works with custom error message", () => {
    const error = new Error("Database connection failed");
    render(<ErrorFallback error={error} />);
    expect(screen.getByText("Database connection failed")).toBeTruthy();
  });
});
