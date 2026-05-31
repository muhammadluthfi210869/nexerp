import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DnaButton } from "@/components/dna/DnaButton";

describe("DnaButton — Loading State", () => {
  it("shows spinner when loading", () => {
    const { container } = render(
      <DnaButton variant="primary" loading>
        Submit
      </DnaButton>
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByText("Submit")).toBeTruthy();
  });

  it("is disabled when loading", () => {
    render(
      <DnaButton variant="primary" loading>
        Submit
      </DnaButton>
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("prevents onClick when loading", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <DnaButton variant="primary" loading onClick={handleClick}>
        Submit
      </DnaButton>
    );
    await user.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("fires onClick when NOT loading", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <DnaButton variant="primary" onClick={handleClick}>
        Submit
      </DnaButton>
    );
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows icon when NOT loading", () => {
    const { container } = render(
      <DnaButton variant="primary" icon={<span>+</span>}>
        Add
      </DnaButton>
    );
    expect(screen.getByText("Add")).toBeTruthy();
    expect(container.querySelector("svg")).toBeNull(); // No spinner
  });

  it("replaces icon with spinner when loading", () => {
    const { container } = render(
      <DnaButton variant="primary" loading icon={<span>+</span>}>
        Add
      </DnaButton>
    );
    expect(screen.getByText("Add")).toBeTruthy();
    // Spinner exists
    const spinner = container.querySelector("svg.animate-spin");
    expect(spinner).toBeTruthy();
  });

  it("applies cursor-wait class when loading", () => {
    render(
      <DnaButton variant="primary" loading>
        Processing
      </DnaButton>
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("cursor-wait");
  });

  it("applies reduced opacity when loading", () => {
    render(
      <DnaButton variant="primary" loading>
        Processing
      </DnaButton>
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("opacity-60");
  });
});
