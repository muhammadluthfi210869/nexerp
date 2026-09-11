"use client";

// OmniCRM — single-page Overview entry.
// Sub-views live at /marketing/omnicrm/{guestbook,kpi,leads/:id} as drill-downs.
// Sidebar entry "OmniCRM" lands here.

import { CrmOverviewClient } from "./CrmOverviewClient";

export default function OmniCrmPage() {
  return <CrmOverviewClient />;
}
