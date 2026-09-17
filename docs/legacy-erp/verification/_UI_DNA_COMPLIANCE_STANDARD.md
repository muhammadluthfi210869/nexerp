# NEX ERP — Strict UI DNA Compliance Standard

**Status:** LOCKED certification standard.  
**Canonical owner:** `contracts/09_NON_FUNCTIONAL_CONTRACT.md §11A`.  
**Goal:** guarantee that every canonical and approved-extension application screen consumes the same maintained DNA component system instead of creating manual or hardcoded UI implementations.

## Canonical locations

| Purpose | Canonical location |
|---|---|
| Visual specification | `/visual-dna` |
| Golden reference | `/visual-dna/golden-reference` |
| Component implementation | `frontend/src/components/dna/**` |
| Public import boundary | `@/components/dna` |
| Tokens | DNA-owned exports/CSS variables surfaced through the DNA library |
| Screen population | `contracts/06_SCREEN_CONTRACT.json` plus approved extension registry |

`/dna-visual*` and `/master/dna-visual*` are temporary compatibility aliases. They may only redirect to the canonical URLs and may not own separate markup, tokens, snapshots, or behavior.

## Scope

The policy applies to:

- every page/layout under the application router;
- business/domain components rendered by those pages;
- dashboards, forms, tables, dialogs, reports, print previews, notifications, empty/loading/error states, and authentication UI;
- canonical screens and approved implementation extensions;
- new UI and all existing UI before P19 can pass.

The internals of `frontend/src/components/dna/**` may use Radix, shadcn, native controls, icons, chart libraries, and CSS to implement the DNA abstraction. That permission does not leak to application/domain code.

## Required import boundary

Application and domain UI code imports UI primitives from exactly:

```typescript
import { DnaButton, DnaInput, DnaDataTable } from "@/components/dna";
```

The following are violations outside DNA implementation:

```typescript
import { Button } from "@/components/ui/button";
import { DnaButton } from "@/components/dna/DnaButton";
import * as Dialog from "@radix-ui/react-dialog";
```

Direct subpath imports are forbidden so implementation files can be reorganized without changing every consumer. The barrel must export every certified public component and type. Deep imports, duplicate barrels, and division-specific primitive libraries are not allowed.

## Native element policy

Allowed for document structure/content when they do not create an alternative design primitive:

- fragments, `main`, `section`, `article`, `div`, `header`, `footer`, `nav`;
- `h1`–`h6`, `p`, `span`, `strong`, `em`, `small`;
- `ul`, `ol`, `li`, `dl`, `dt`, `dd`;
- non-interactive SVG/path only inside an approved DNA/icon adapter.

Forbidden in application/domain UI outside DNA implementation:

- raw `button`, `input`, `select`, `textarea`, form-control composition, checkbox, radio, switch;
- raw modal/dialog/drawer/popover/tooltip/dropdown/tab/toast;
- raw operational table, pagination, card, badge, KPI/stat, toolbar, page header, feedback state, or action menu;
- click/keyboard handlers on non-interactive elements used to imitate controls;
- duplicated component markup copied from a reference page.

When the required component does not exist, work stops at the consumer: extend DNA, add its tests/reference example/export, then use it.

## Styling policy

Application/domain UI may use only:

1. component props/variants exported by DNA;
2. semantic DNA tokens and approved CSS variables;
3. a generated class or helper exported by DNA;
4. structural layout classes from this allowlist: `flex`, `inline-flex`, `grid`, `block`, `inline`, `hidden`, approved responsive display variants, `flex-row`, `flex-col`, `flex-wrap`, `items-*`, `justify-*`, `content-*`, `self-*`, `grow`, `shrink`, `order-*`, `col-span-*`, `row-span-*`, `grid-cols-*`, and `gap-*` only where the value maps to an approved DNA spacing token.

The following are blocking violations outside DNA implementation/reference test fixtures:

- literal `#hex`, `rgb()`, `rgba()`, `hsl()`, or `hsla()`;
- Tailwind arbitrary values using `[...]` for color, size, spacing, radius, shadow, typography, position, or animation;
- raw palette/status classes that bypass semantic DNA variants;
- inline visual styles;
- local constants for color, typography, spacing, radius, shadow, breakpoint, z-index, or animation;
- CSS modules or stylesheets recreating an existing DNA primitive;
- copying visual values from `/visual-dna` instead of consuming the component/token.

Static layout values that cannot yet be represented must first be added as named DNA tokens. Data-driven chart/canvas geometry requires a registered exception; chart controls, shell, typography, color semantics, legend, tooltip, and feedback states remain DNA-owned.

## Canonical reference requirements

`/visual-dna` is the human-readable component and token specification. `/visual-dna/golden-reference` is the executable visual baseline. Both routes must:

- import their displayed components from `@/components/dna`;
- cover every public component, supported variant, interactive state, validation state, and responsive behavior;
- demonstrate normal, loading, empty, error, disabled, focus, permission-denied, and destructive-confirmation states where applicable;
- pass keyboard, focus, axe, browser, responsive, and visual regression tests;
- contain no copied alternative implementation of a DNA component;
- display the package/version or build identity used for the snapshot.

A change to a DNA component requires intentional golden snapshot review. Updating a snapshot without reviewer evidence and change rationale is a failed gate.

## Machine-enforced gates

| Gate | Required result |
|---|---|
| Canonical reference routes | Both canonical URLs resolve; legacy aliases only redirect |
| Screen coverage | 100% of canonical and approved-extension screens appear in the DNA audit manifest |
| Import boundary | 0 direct UI-kit, Radix/shadcn, DNA-subpath, duplicate-barrel, or unapproved primitive imports outside DNA |
| Native interactive scan | 0 raw/reimplemented interactive primitives outside DNA |
| Hardcoded visual scan | 0 unregistered hardcoded colors, arbitrary visual values, inline visual styles, or local visual tokens |
| Barrel integrity | Every certified component/type imports from `@/components/dna`; no broken/ambiguous export |
| Reference integrity | Golden reference consumes real barrel exports and covers all certified variants/states |
| Visual regression | 0 unapproved snapshot delta |
| Accessibility | WCAG 2.1 AA; 0 serious/critical axe findings; keyboard/focus complete |
| Responsive/browser | Required viewport and browser matrix passes |
| Exceptions | 100% schema-valid, owned, tested, unexpired; 0 exception for duplicate primitive or hardcoded brand token |

These checks are blocking in P03 CI for changed scope, in every domain phase that changes UI, and as full scans in P19, P20, and P22.

## Required implementation artifacts

The implementation phase must create and maintain:

- a generated screen-to-DNA usage manifest covering `contracts/06_SCREEN_CONTRACT.json` and approved extensions;
- an AST/import boundary checker;
- a native-interactive and reimplementation checker;
- a hardcoded visual/token checker;
- a barrel/reference integrity checker;
- `frontend/src/components/dna/dna-exceptions.yaml` with schema validation;
- component/unit/a11y tests for the DNA library;
- Playwright reference, responsive, browser, keyboard, and visual suites.

Text search alone is insufficient for JSX aliasing, re-exports, template expressions, and wrapper components; enforcement must use AST/module-resolution where required.

## Exception schema and policy

Every exception contains:

```yaml
id: DNA-EXC-XXX
file: exact/repository/path.tsx
rule: exact_rule_id
owner: named_team_or_role
rationale: why_DNA_cannot_currently_represent_it
scope: smallest_possible_line_or_component
test: automated_test_reference
created_at: YYYY-MM-DD
expires_at: YYYY-MM-DD
dna_extension_issue: tracked_follow_up
approved_by: reviewer
```

Expired exceptions fail CI. Broad directory/glob exceptions are forbidden. Exceptions cannot authorize duplicate controls/components, hardcoded brand/status tokens, inaccessible behavior, or bypass of barrel imports when an equivalent DNA export exists.

## Per-screen evidence

Each screen certification records:

- canonical screen ID and route;
- imported DNA exports;
- normal/loading/empty/error/denied/conflict states exercised;
- responsive/browser results;
- accessibility result;
- screenshot identity;
- registered exceptions, if any;
- reviewer and timestamp.

P19 cannot pass on sampling. Every screen must have evidence. P22 independently samples source imports and rendered pages; a visually matching page that bypasses `@/components/dna` fails.
