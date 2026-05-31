import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DnaInput } from "@/components/dna/DnaInput";

describe("DnaInput — Validation States", () => {
  it("shows error text when error prop is set", () => {
    render(<DnaInput error="Nama harus diisi" />);
    expect(screen.getByText("Nama harus diisi")).toBeTruthy();
  });

  it("applies red border when error is set", () => {
    const { container } = render(<DnaInput error="Invalid" />);
    const input = container.querySelector("input")!;
    expect(input.className).toContain("border-rose-400");
  });

  it("sets aria-invalid when error is set", () => {
    const { container } = render(<DnaInput error="Invalid" />);
    const input = container.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("does NOT set aria-invalid when no error", () => {
    const { container } = render(<DnaInput />);
    const input = container.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("shows red asterisk when required and no error", () => {
    const { container } = render(<DnaInput required />);
    expect(container.textContent).toContain("*");
  });

  it("hides asterisk when error is shown (error text replaces it)", () => {
    render(<DnaInput required error="Harus diisi" />);
    expect(screen.getByText("Harus diisi")).toBeTruthy();
    // Asterisk shouldn't be visible since error text is shown
    const asterisk = screen.queryByText("*");
    expect(asterisk).toBeNull();
  });

  it("works with icon and error together", () => {
    render(<DnaInput icon={<span>🔍</span>} error="Invalid search" />);
    expect(screen.getByText("Invalid search")).toBeTruthy();
  });

  it("accepts user input normally when no error", async () => {
    const user = userEvent.setup();
    render(<DnaInput placeholder="Type..." />);
    const input = screen.getByPlaceholderText("Type...");
    await user.type(input, "hello");
    expect((input as HTMLInputElement).value).toBe("hello");
  });

  it("accepts user input even when error is shown", async () => {
    const user = userEvent.setup();
    render(<DnaInput error="Invalid" placeholder="Type..." />);
    const input = screen.getByPlaceholderText("Type...");
    await user.type(input, "corrected value");
    expect((input as HTMLInputElement).value).toBe("corrected value");
  });

  it("renders required attribute on input element", () => {
    const { container } = render(<DnaInput required />);
    const input = container.querySelector("input")!;
    expect(input.required).toBe(true);
  });
});
