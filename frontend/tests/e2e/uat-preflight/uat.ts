import { expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Shared helpers for the P22 UAT pre-flight suite.
 *
 * These assertions are deliberately markup-light: they ask "did a human see a
 * working page?" (no error surface, no bounce to /login, no JS crash, no 5xx)
 * instead of pinning selectors that drift every UI change. That is what makes
 * them usable as the gate a client walks through before manual UAT.
 */

export const UAT_EMAIL = process.env.UAT_EMAIL ?? 'admin@dreamlab.com';
export const UAT_PASSWORD = process.env.UAT_PASSWORD ?? 'password123';

/**
 * Wait until React owns the form. A production build serves prerendered HTML, so
 * the inputs exist and can be filled long before React attaches its handlers —
 * measured here at ~250ms idle but ~550ms with six workers racing, which is
 * exactly why a submit fired straight after `fill` used to vanish. React marks
 * every node it manages with a `__reactProps$…` key; its presence on the form is
 * the hydration signal.
 */
async function waitForReact(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const form = document.querySelector('form');
        return !!form && Object.keys(form).some((k) => k.startsWith('__reactProps'));
      },
      { timeout: 15_000 },
    )
    .catch(() => {});
}

/**
 * Every request the page has started and never heard back about.
 *
 * A page that renders but never fires `load`, and a POST that is never answered,
 * look identical from the outside — both are "the app stopped talking". Naming
 * the requests still in flight is the difference between a diagnosis and another
 * guess, and it costs nothing when everything is healthy. Call the returned
 * function to read the current list.
 */
export function trackRequests(page: Page): () => string[] {
  // Keyed by URL, not URL+method: Playwright's `Response` type exposes url() but
  // not method(), so the request and its response could not otherwise be matched.
  const open = new Map<string, number>();
  page.on('request', (r) => open.set(r.url(), Date.now()));
  page.on('response', (r) => {
    open.delete(r.url());
  });
  page.on('requestfailed', (r) => {
    open.delete(r.url());
  });
  return () =>
    [...open.entries()].map(([k, t]) => `${k} — unanswered for ${((Date.now() - t) / 1000).toFixed(1)}s`);
}

/** Log in through the real form, exactly as the client will. */
export async function loginViaUI(page: Page): Promise<void> {
  // The login form's own state, collected while it runs. A red login used to
  // report only "no request" whichever way it failed — a five-minute suite
  // re-run to learn nothing (see `loginFailure` below).
  const trail: string[] = [];
  const inFlight = trackRequests(page);
  page.on('request', (r) => {
    if (r.url().includes('/auth/')) trail.push(`req ${r.method()} ${r.url()}`);
  });
  page.on('response', (r) => {
    if (r.url().includes('/auth/')) trail.push(`res ${r.status()} ${r.url()}`);
  });
  page.on('requestfailed', (r) => {
    if (r.url().includes('/auth/')) trail.push(`failed ${r.failure()?.errorText} ${r.url()}`);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') trail.push(`console ${m.text().replace(/\s+/g, ' ').slice(0, 160)}`);
  });

  await page.goto('/login');
  await waitForReact(page);
  await page.fill('#email', UAT_EMAIL);
  await page.fill('#password', UAT_PASSWORD);

  // A production build serves prerendered HTML, and a submit that lands before
  // the form hydrates is swallowed with no request at all. Retry instead of
  // racing hydration — but never invent a pass: if no request is ever issued,
  // that is a failure, not a slow login.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const apiCall = page
      .waitForResponse((r) => r.url().includes('/auth/login'), { timeout: 10_000 })
      .catch(() => null);
    // Fire the form's submit event rather than clicking the button. onSubmit
    // sets isLoading immediately, so the button flips to disabled
    // "Authenticating...", and on success the page navigates away — a click
    // that spans either of those never settles: Playwright retries a detached
    // element until the test times out, and the suite dies at this line with a
    // stack that points at the login page instead of at any real defect.
    // Dispatching the event has no actionability check and no navigation to
    // wait on; hydration failing just means no request, which the loop catches.
    await page
      .locator('form')
      .evaluate((f: HTMLFormElement) =>
        f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
      )
      .catch(() => {});
    const response = await apiCall;
    if (!response) continue;

    expect(
      response.status(),
      `POST /api/auth/login returned ${response.status()} for ${UAT_EMAIL}`,
    ).toBeLessThan(400);

    // The POST came back, so this is no longer a login question — it is a
    // "did the app move" question. `waitForURL` needs the navigation to finish
    // its `load` event, which one unanswered subresource can hold off forever
    // while the dashboard is already on screen. Say which one.
    try {
      await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30_000 });
    } catch {
      const url = page.url();
      throw new Error(
        `POST /api/auth/login returned ${response.status()} but the app never finished ` +
          `navigating away from /login in 30s (browser is at ${url}).\n` +
          `unanswered: ${inFlight().join(' | ') || '(nothing pending)'}`,
      );
    }
    return;
  }

  // Fail closed, but say what the login page actually did.
  const state = await page
    .evaluate(() => {
      const form = document.querySelector('form');
      return {
        url: location.pathname,
        reactAttached: !!form && Object.keys(form).some((k) => k.startsWith('__reactProps')),
        submitButton: document.querySelector('button[type="submit"]')?.textContent?.trim() ?? '(none)',
        toast: document.querySelector('[data-sonner-toast], li[data-sonner-toast]')?.textContent?.slice(0, 80) ?? '(none)',
      };
    })
    .catch((e: Error) => ({ evaluateFailed: e.message.split('\n')[0] }));
  throw new Error(
    `login as ${UAT_EMAIL} issued no POST /auth/login in 3 attempts.\n` +
      `page: ${JSON.stringify(state)}\n` +
      `unanswered: ${inFlight().join(' | ') || '(nothing pending)'}\n` +
      `auth traffic: ${trail.length ? trail.join(' | ') : '(none)'}`,
  );
}

export interface PageSignals {
  /** One entry per problem, each prefixed with the route it was observed ON. */
  problems: string[];
}

/**
 * Attach failure collectors once per page, and never clear them per route.
 *
 * A crash caused by a response body only fires after that fetch resolves — by
 * which time the walk may already be on the next route. Recording the pathname
 * at the moment the problem fires keeps it attributed to the page that caused
 * it; clearing per route instead reports it against whatever page is open then.
 * (That is not hypothetical: it once blamed `/dashboard/qc` and
 * `/finance/bayar-sample` for chunks belonging to `/dashboard` and
 * `/finance/audit-ledger`.)
 */
export function watchPage(page: Page): PageSignals {
  const signals: PageSignals = { problems: [] };
  const here = () => {
    try {
      return new URL(page.url()).pathname;
    } catch {
      return '(unknown)';
    }
  };
  page.on('response', (r) => {
    if (r.status() >= 500) signals.problems.push(`${here()}: HTTP ${r.status()} ${r.url()}`);
  });

  // A fetch that is never answered hides from every check above. `api.ts` gives
  // up at 15s, the page catches that and renders a toast, and the route still
  // looks healthy: no 5xx, no console error, no error surface, content present.
  // Seen live — login POSTs aborted at 15s with "Login failed. Check your
  // credentials." on screen, which blames the password for a silent server.
  //
  // Both an abandoned request and a timed-out one reach `requestfailed` as
  // `net::ERR_ABORTED`, so the error text cannot tell them apart — the *age* can.
  // Navigating away kills pending fetches within a second; the timeout takes 15.
  // Only failures that lived at least 10s are reported.
  const startedAt = new Map<string, number>();
  page.on('request', (r) => startedAt.set(r.url(), Date.now()));
  page.on('requestfailed', (r) => {
    const url = r.url();
    if (!url.includes('/api/')) return;
    const began = startedAt.get(url);
    const lived = began ? Date.now() - began : 0;
    if (lived >= 10_000) {
      signals.problems.push(`${here()}: API call unanswered for ${Math.round(lived / 1000)}s then aborted ${url}`);
    }
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (/(Uncaught|TypeError|ReferenceError|is not a function|Cannot read prop)/.test(text)) {
      signals.problems.push(`${here()}: console ${text.replace(/\s+/g, ' ').slice(0, 200)}`);
    }
  });
  return signals;
}

/**
 * Navigate and give the page's data a chance to land before judging it.
 * `networkidle` is the signal that fetches have settled; a page with a live
 * poller never idles, so it is best-effort and the short settle follows either way.
 */
export async function visitRoute(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  await page.waitForTimeout(150);
}

const ERROR_SURFACE =
  /Application error|Unhandled Runtime Error|Something went wrong|Internal Server Error|This page could not be found/i;

/** Everything a broken page looks like, in one call. */
export async function assertPageHealthy(page: Page, label: string): Promise<void> {
  const path_ = new URL(page.url()).pathname;
  expect(path_, `${label}: bounced to /login`).not.toMatch(/^\/login/);
  const body = await page.locator('body').innerText().catch(() => '');
  expect(body.trim().length, `${label}: blank page`).toBeGreaterThan(0);
  expect(body, `${label}: error surface rendered`).not.toMatch(ERROR_SURFACE);
  // In dev the Next.js overlay host is always mounted and only shown on error,
  // so this must ask whether it is visible — a count check fails on every page.
  const overlay = page.locator('nextjs-portal');
  if ((await overlay.count()) > 0) {
    await expect(overlay.first(), `${label}: Next.js dev error overlay open`).toBeHidden();
  }
}

/**
 * Every static `page.tsx` under `(dashboard)`, discovered from the filesystem.
 * Dynamic segments (`[id]`) are skipped — they need a real record to be meaningful.
 * New routes are covered with no edit to this file.
 */
export function staticDashboardRoutes(): string[] {
  const dash = path.join(__dirname, '../../../src/app/(dashboard)');
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!/[\[\]]/.test(entry.name)) walk(full);
      } else if (entry.name === 'page.tsx') {
        const rel = path.relative(dash, dir).replace(/\\/g, '/');
        out.push(rel ? `/${rel}` : '/');
      }
    }
  };
  walk(dash);
  return out.sort();
}

/** The two modules the Fase 6 pilot run puts in front of the client. */
export const PILOT_ROUTES = [
  '/warehouse',
  '/warehouse/stok',
  '/warehouse/inbound',
  '/warehouse/release',
  '/pembelian/scm-pembelian',
  '/pembelian/purchase-requests',
  '/pembelian/kebutuhan',
  '/pembelian/receiving',
] as const;

/** Cross-department sanity: the modules the pilot feeds into. */
export const OVERVIEW_ROUTES = [
  '/finance/dashboard',
  '/finance/accounting/coa',
  '/finance/ledger',
  '/marketing/dashboard',
  '/executive/dashboard',
] as const;
