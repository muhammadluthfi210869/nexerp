# NON_DASHBOARD_VISUAL_SPEC.md

## Overview

This spec covers ALL non-dashboard pages — everything EXCEPT pages under `src/app/(dashboard)/`. Non-dashboard pages include landing pages, marketing pages, public-facing routes, and standalone visual pages.

## DNA Components

Import all reusable DNA components from `@/components/dna`:

```typescript
import {
  DashboardCard,
  StatCard,
  KpiCard,
  DataCard,
  TableWrapper,
  PageSection,
  SectionLabel,
  DnaInput,
  DnaButton,
  DnaBadge,
  TabButton,
  TabButtonGroup,
  FilterBar,
} from "@/components/dna"
```

## Card Pattern

Most containers use the card pattern from `ui/card`:

```tsx
import { Card } from "@/components/ui/card"

// Standard card
<div className="rounded-2xl border border-slate-200 shadow-sm">
  {/* card content */}
</div>

// Or using the Card component directly
<Card className="rounded-2xl border border-slate-200 shadow-sm">
  {/* card content */}
</Card>
```

## Page Layout Pattern

```tsx
import { PageSection, SectionLabel } from "@/components/dna"

<PageSection>
  <SectionLabel>Section Title</SectionLabel>
  {/* content */}
</PageSection>
```

## Tab Pattern

Use `TabButtonGroup` for tab navigation:

```tsx
import { TabButtonGroup } from "@/components/dna"
import { Layers, BarChart3, Users } from "lucide-react"

const tabs = [
  { id: 'bento', label: 'Bento Overview', icon: Layers },
  { id: 'kanban', label: 'Pipeline Kanban', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
]

<TabButtonGroup
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

Or use individual `TabButton`:

```tsx
import { TabButton } from "@/components/dna"

<TabButton
  id="bento"
  label="Bento Overview"
  icon={Layers}
  isActive={activeTab === 'bento'}
  onClick={() => setActiveTab('bento')}
/>
```

## Filter Bar Pattern

```tsx
import { FilterBar } from "@/components/dna"

<FilterBar
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search leads..."
  platformValue={platform}
  onPlatformChange={setPlatform}
  platformOptions={[
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
  ]}
  statusValue={status}
  onStatusChange={setStatus}
  statusOptions={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
/>
```

## Input Pattern

```tsx
import { DnaInput } from "@/components/dna"
import { Search } from "lucide-react"

<DnaInput
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Search..."
  icon={<Search />}
/>
```

## Button Pattern

```tsx
import { DnaButton } from "@/components/dna"

<DnaButton variant="primary" size="md">
  Action Label
</DnaButton>
```

## Badge Pattern

```tsx
import { DnaBadge } from "@/components/dna"

<DnaBadge variant="success">Active</DnaBadge>
```

## Golden Reference Page

The canonical implementation reference is: `/dna-visual/golden-reference`

Use this page to verify component implementations and visual consistency.

## Rules

1. **Never use inline Tailwind for common patterns** — always import from `@/components/dna` or `@/components/ui`
2. **Use DNA components first** — before creating custom styled elements
3. **Consistent border/shadow** — `rounded-2xl border border-slate-200 shadow-sm` for card containers
4. **Scrollbar handling** — use `scrollbar-none` class for horizontal scroll containers
5. **Responsive breakpoints** — use `sm:` prefix for tablet/desktop overrides
