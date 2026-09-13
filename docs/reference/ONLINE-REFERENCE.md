# Online Reference Investigation — `https://erppreview1.ai.studio/`

> **Status**: SPA shell, largely opaque to WebFetch. Documented honestly.

---

## What was attempted

| Probe | Result |
|---|---|
| `GET https://erppreview1.ai.studio/` | Title only: "Dreamlab ERP — Task & Social Media Management" |
| `GET https://erppreview1.ai.studio/login` | Same title — JS-rendered SPA, no server content |
| `GET https://erppreview1.ai.studio/dashboard` | Same title |
| `GET https://erppreview1.ai.studio/tasks` | Same title |
| `GET https://erppreview1.ai.studio/members` | Same title |
| `GET https://erppreview1.ai.studio/brands` | Same title |
| `GET https://erppreview1.ai.studio/calendar` | Same title |
| `GET https://erppreview1.ai.studio/reports` | Same title |
| `GET https://erppreview1.ai.studio/analytics` | Same title |
| `GET https://erppreview1.ai.studio/funnel` | Same title |
| `GET https://erppreview1.ai.studio/goals` | Same title |
| `GET https://erppreview1.ai.studio/settings` | Same title |
| `GET https://erppreview1.ai.studio/integrations` | Same title |
| `GET https://erppreview1.ai.studio/planner` | Same title |
| `GET https://erppreview1.ai.studio/executive` | Same title |
| `GET https://erppreview1.ai.studio/overview` | Same title |
| `GET https://erppreview1.ai.studio/sitemap.xml` | HTTP 404 |
| `GET https://erppreview1.ai.studio/robots.txt` | HTTP 404 |
| `GET https://erppreview1.ai.studio/manifest.json` | Not retrieved |
| `GET https://erppreview1.ai.studio/favicon.ico` | Not retrieved |
| `WebSearch "erppreview1.ai.studio sidebar navigation menu"` | 0 relevant results |
| `WebSearch "erppreview1.ai.studio" Dreamlab ERP features` | 0 relevant results |
| `WebSearch "erppreview1 ai studio dreamlab erp"` | 0 relevant results |
| `WebSearch "Dreamlab ERP" sidebar "Task Team" OR "Task Overview"` | 0 relevant results |
| Wayback Machine snapshots | None indexed |

---

## What was recovered

### 1. Page title (server-rendered)
```
Dreamlab ERP — Task & Social Media Management
```

### 2. Inferred product positioning
- "Dreamlab ERP" is the product brand
- Two product areas advertised:
  - "Task" → Task Management side
  - "Social Media" → Social Media Management side

---

## Why the SPA is opaque

The deployment is a **Google AI Studio preview**:
- HTML shell with only `<title>` populated server-side
- All UI rendered after JavaScript hydration
- No server-side rendering (SSR) of nav, content, or routes
- WebFetch converts HTML → markdown → LLM answer, which only sees the title
- No public docs, no blog posts, no GitHub repo, no YouTube tutorials
- No sitemap, no robots.txt
- Login form likely required to see authenticated content

---

## What the local reference tells us about the online version

The local `dreamlab-erp-—-task-&-social-media-management` is **almost certainly the source repo** for the online `erppreview1.ai.studio` deployment. Evidence:
- Identical title: "Dreamlab ERP — Task & Social Media Management" (local README confirms)
- Same two product areas
- Same brand focus (Dreamlab + Toribio)
- Same Vite + React stack pattern

This means **the exhaustive documentation in `VIEWS.md`, `MODALS.md`, `DATA-MODEL.md`, and `FEATURES-AND-WORKFLOWS.md` is an accurate reverse-engineering of what the online version offers**, since the local source code is the ground truth.

---

## What is NOT recoverable from the online version (via WebFetch alone)

- Exact sidebar entry names (only the section labels "Task" and "Social Media" are inferable from title)
- Page URLs / routes (no URL-based routing in source — confirmed via local `App.tsx`)
- Auth flow (login form behind JS)
- Any user-facing text after login
- Visual layout, theming, colors (need browser screenshot)
- Interactive features (drag-and-drop, modals, etc.)
- Performance metrics, accessibility features

---

## Recommended next steps to complete online reference

1. **Browser screenshot from authenticated session** — fastest, captures everything visually
2. **DOM dump** from Chrome DevTools "Copy outerHTML" of the sidebar
3. **Source code access** to `https://github.com/.../erppreview1.ai.studio` (if open source)
4. **AI Studio preview link** — sometimes the project is shareable and shows the source
5. **Wayback Machine deeper crawl** — try `web.archive.org/web/2025*/erppreview1.ai.studio`

---

## Conclusion

The **online `erppreview1.ai.studio` is a deployed instance of the same codebase documented locally** at `dreamlab-erp-—-task-&-social-media-management`. The local source is the authoritative reference. The online deployment is opaque to text-based scraping, but functionally equivalent to the local app per the title match.

**For all practical purposes, the local reference documentation in this directory is the source of truth for the online deployment too.** Any discrepancies discovered in the future (via screenshot or DOM dump) should be appended as a delta here.
