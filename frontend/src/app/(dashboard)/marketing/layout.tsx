import * as React from "react";

import { MarketingThemeScope } from "@/components/theme/MarketingThemeScope";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingThemeScope>{children}</MarketingThemeScope>;
}
