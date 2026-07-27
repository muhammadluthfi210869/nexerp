import { describe, expect, it } from "vitest";

import { resolveMarketingTheme } from "./MarketingThemeScope";

describe("resolveMarketingTheme", () => {
  it("uses an explicit professional preference", () => {
    expect(resolveMarketingTheme("professional", "marketing-aesthetic")).toBe(
      "professional",
    );
  });

  it("uses an explicit aesthetic preference", () => {
    expect(resolveMarketingTheme("marketing-aesthetic", "professional")).toBe(
      "marketing-aesthetic",
    );
  });

  it("follows the department default", () => {
    expect(resolveMarketingTheme("follow-department", "marketing-aesthetic")).toBe(
      "marketing-aesthetic",
    );
  });
});
