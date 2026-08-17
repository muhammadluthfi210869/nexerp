# Legacy Baseline — `old_erp`

This is the correct familiarity baseline for the existing users. It is not `demo.nexerp.id`; demo is the current prototype deployment and is useful for technical A/B isolation only.

## Source

- Git source: `old_erp/`
- Reference commit: `f6e0f703049db3e7d0f135738ff53536033f9fb5` (`Restore old_erp directory`)
- Representative operational pages: `old_erp/barang.html`, `old_erp/pembelian.html`, `old_erp/buat-pembelian.html`, `old_erp/d-eksekutif.html`

## Legacy UI evidence

- Static HTML with AdminLTE 3 / Bootstrap 4 structure (`sidebar-mini layout-fixed`, `main-sidebar sidebar-dark-primary`, navbar + content wrapper).
- Source Sans Pro is the declared application font.
- Data-heavy pages use DataTables Bootstrap integration and `table-sm table-striped table-bordered text-nowrap`.
- The legacy sidebar is structurally close to a 250px desktop rail; therefore changing V2 from 280px to 248px is not a meaningful familiarity improvement by itself.
- Legacy cards are utility containers around tables/forms; the current V2 bento cards and large insight surfaces are the more material visual departure.

## Correct comparison rule

The V2 question is not “is it smaller than demo?” It is:

> Can an existing user keep the old spatial model (sidebar → navbar → page title → card/table → row action) while receiving the new Visual DNA, better hierarchy, compact tokens, and responsive behavior?

Therefore future pilot review must compare `old_erp` reference screenshots/markup against `compact.nexerp.id`, while `demo.nexerp.id` remains only the untouched current-prototype control.

## Design implication

- Preserve the old page composition and table-first workflow.
- Keep sidebar width near the legacy rail instead of shrinking it for its own sake.
- Reduce card ornamentation and excessive rounding before changing navigation geometry.
- Treat the old Bootstrap/DataTables density as a reference point, then improve readability, focus, status semantics, and mobile containment around it.
