"use client";

// OmniCRM — Top-level route. Tabbed shell with 5 sub-views.
// Sub-views: inbox (kanban) | guestbook (Buku Tamu) | broadcast | monitor | kpi.
// Tab routing via ?tab= search param for deep-linkable URLs.
//
// Phase 4 implementation: inbox / guestbook / kpi wired to /crm/* endpoints.
// broadcast + monitor stubbed — Phase 5 (after Broadcasts module lands).

import { useRouter, useSearchParams } from "next/navigation";
import {
  Inbox,
  BookOpenText,
  Megaphone,
  Activity,
  BarChart3,
} from "lucide-react";
import { DnaBadge } from "@/components/dna";
import { CrmInboxClient } from "./CrmInboxClient";
import { CrmGuestbookClient } from "./CrmGuestbookClient";
import { CrmKpiTiles } from "./CrmKpiTiles";

type TabId = "inbox" | "guestbook" | "broadcast" | "monitor" | "kpi";

const TABS: { id: TabId; label: string; icon: typeof Inbox; href: string }[] = [
  { id: "inbox",     label: "Leads Inbox",   icon: Inbox,         href: "/marketing/omnicrm" },
  { id: "guestbook", label: "Buku Tamu",     icon: BookOpenText,  href: "/marketing/omnicrm?tab=guestbook" },
  { id: "broadcast", label: "Broadcast WA",  icon: Megaphone,     href: "/marketing/omnicrm?tab=broadcast" },
  { id: "monitor",   label: "WA Monitor",    icon: Activity,      href: "/marketing/omnicrm?tab=monitor" },
  { id: "kpi",       label: "Sales KPI",     icon: BarChart3,     href: "/marketing/omnicrm?tab=kpi" },
];

export default function OmniCrmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as TabId) || "inbox";

  const onTabChange = (tabId: string) => {
    const target = TABS.find((t) => t.id === tabId);
    if (target) router.push(target.href);
  };

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">OmniCRM</h1>
          <DnaBadge status="warning">MVP</DnaBadge>
        </div>
        <p className="text-sm text-muted-foreground">
          Lead capture, Buku Tamu, Broadcast, Monitor, KPI
        </p>
      </header>

      <nav role="tablist" aria-label="OmniCRM views" className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`omnicrm-${tab.id}`}
              data-testid={`omnicrm-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={
                "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
                (isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section id={`omnicrm-${currentTab}`} role="tabpanel" className="flex-1">
        {currentTab === "inbox" && (
          <div data-testid="omnicrm-inbox">
            <CrmInboxClient />
          </div>
        )}
        {currentTab === "guestbook" && (
          <div data-testid="omnicrm-guestbook">
            <CrmGuestbookClient />
          </div>
        )}
        {currentTab === "broadcast" && <div data-testid="omnicrm-broadcast">Broadcast composer (Phase 5)</div>}
        {currentTab === "monitor" && <div data-testid="omnicrm-monitor">Real-time WA monitor (Phase 5)</div>}
        {currentTab === "kpi" && (
          <div data-testid="omnicrm-kpi">
            <CrmKpiTiles />
          </div>
        )}
      </section>
    </main>
  );
}
