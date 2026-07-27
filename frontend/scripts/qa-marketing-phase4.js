const FRONTEND_URL = "http://localhost:3003";
const API_URL = "http://localhost:3002";

const marketingRoutes = [
  "/marketing/lead-capture",
  "/marketing/management-task",
  "/marketing/management-task/overview",
  "/marketing/management-task/aurel",
  "/marketing/toribio",
];

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
];

let lastAppliedPreference = null;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "revita@nexerp.id",
      password: "password123",
    }),
  });

  assert(response.ok, `Login failed with ${response.status}`);
  return response.json();
}

async function setPreference(session, preference) {
  if (lastAppliedPreference === preference) return;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(`${API_URL}/marketing/prototype/ui-theme`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ preference }),
    });

    if (response.ok) {
      lastAppliedPreference = preference;
      return;
    }

    if (attempt === 3) {
      throw new Error(`Preference ${preference} failed with ${response.status}: ${await response.text()}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
  }
}

function storageState(session, preference) {
  return {
    cookies: [
      {
        name: "token",
        value: session.access_token,
        domain: "localhost",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 86400,
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ],
    origins: [
      {
        origin: FRONTEND_URL,
        localStorage: [
          { name: "token", value: session.access_token },
          { name: "user", value: JSON.stringify(session.user) },
          { name: "nexerp.uiTheme", value: preference },
        ],
      },
    ],
  };
}

async function checkMarketingRoute(browser, session, route, viewport, preference) {
  console.error(`QA ${preference} ${viewport.name} ${route}`);
  await setPreference(session, preference);
  const context = await browser.newContext({
    viewport,
    storageState: storageState(session, preference),
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  await page.goto(`${FRONTEND_URL}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.waitForSelector("[data-ui-theme]", { timeout: 45000 });
  await page.waitForSelector("[data-marketing-page]", { timeout: 45000 }).catch(() => undefined);
  await page
    .waitForFunction(
      (expectedTheme) => document.body.dataset.uiTheme === expectedTheme,
      preference === "professional" ? "professional" : "marketing-aesthetic",
      { timeout: 15000 },
    )
    .catch(() => undefined);
  await page
    .waitForSelector('[aria-label="Marketing department default UI theme"]', { timeout: 15000 })
    .catch(() => undefined);
  await page.waitForTimeout(1200);

  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const themeScope = document.querySelector("[data-ui-theme]");
    const focusTarget = document.querySelector("button:not([disabled]), input:not([disabled]), select:not([disabled])");

    if (focusTarget) {
      focusTarget.focus();
    }

    const focused = document.activeElement;
    const focusedStyle = focused ? window.getComputedStyle(focused) : null;
    const focusIndicator = focusedStyle
      ? [
          focusedStyle.outlineStyle,
          focusedStyle.outlineWidth,
          focusedStyle.boxShadow,
          focusedStyle.borderColor,
        ].join(" ")
      : "";

    const clippedButtons = Array.from(document.querySelectorAll("button")).filter((button) => {
      if (button.querySelector('[class*="line-clamp"]')) return false;
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && button.scrollWidth > Math.ceil(rect.width) + 2;
    }).map((button) => ({
      text: (button.textContent || "").replace(/\s+/g, " ").trim(),
      width: Math.round(button.getBoundingClientRect().width),
      scrollWidth: button.scrollWidth,
    }));

    const overlappingText = Array.from(document.querySelectorAll("h1,h2,h3,p,span,button,a,label")).some((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > window.innerWidth + 1 || rect.height > window.innerHeight + 1;
    });

    return {
      url: location.pathname,
      bodyTheme: document.body.dataset.uiTheme || null,
      scopedTheme: themeScope?.getAttribute("data-ui-theme") || null,
      bodyPreference: document.body.dataset.themePreference || null,
      surfaces: document.querySelectorAll("[data-marketing-surface]").length,
      pageMarkers: document.querySelectorAll("[data-marketing-page]").length,
      themeControl: Boolean(document.querySelector('[aria-label="Marketing UI theme"]')),
      departmentControl: Boolean(document.querySelector('[aria-label="Marketing department default UI theme"]')),
      professionalToggle: Array.from(document.querySelectorAll("button")).some((button) =>
        (button.textContent || "").includes("Professional"),
      ),
      aestheticToggle: Array.from(document.querySelectorAll("button")).some((button) =>
        (button.textContent || "").includes("Aesthetic"),
      ),
      horizontalOverflow: root.scrollWidth > window.innerWidth + 2,
      clippedButtons,
      overlappingText,
      focusIndicator,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });

  const expectedTheme = preference === "professional" ? "professional" : "marketing-aesthetic";
  assert(result.bodyTheme === expectedTheme, `${route} ${viewport.name}: body theme ${result.bodyTheme}`);
  assert(result.scopedTheme === expectedTheme, `${route} ${viewport.name}: scoped theme ${result.scopedTheme}`);
  assert(result.themeControl, `${route} ${viewport.name}: missing user theme control`);
  assert(!result.departmentControl, `${route} ${viewport.name}: department control should be hidden`);
  assert(result.professionalToggle, `${route} ${viewport.name}: missing professional toggle`);
  assert(result.aestheticToggle, `${route} ${viewport.name}: missing aesthetic toggle`);
  assert(!result.horizontalOverflow, `${route} ${viewport.name}: horizontal overflow`);
  const shotName = `phase4-${preference}-${viewport.name}-${route.replace(/^\//, "").replace(/[\/]/g, "-")}.png`;
  await page.screenshot({ path: `.playwright-cli/${shotName}`, fullPage: false });

  assert(result.clippedButtons.length === 0, `${route} ${viewport.name}: clipped button labels ${JSON.stringify(result.clippedButtons)}`);
  assert(!result.overlappingText, `${route} ${viewport.name}: oversized text element`);
  assert(result.focusIndicator && !result.focusIndicator.includes("none 0px"), `${route} ${viewport.name}: weak focus indicator`);

  await context.close();
  return result;
}

async function checkNonMarketing(browser, session) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: storageState(session, "marketing-aesthetic"),
  });
  const page = await context.newPage();
  await page.goto(`${FRONTEND_URL}/rnd/analytics`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.waitForTimeout(1200);

  const result = await page.evaluate(() => ({
    url: location.pathname,
    bodyTheme: document.body.dataset.uiTheme || null,
    scopedTheme: document.querySelector("[data-ui-theme]")?.getAttribute("data-ui-theme") || null,
    marketingControls: document.querySelectorAll('[aria-label="Marketing UI theme"]').length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
  }));

  assert(!result.bodyTheme, "Non-marketing route inherited body theme");
  assert(!result.scopedTheme, "Non-marketing route has marketing theme scope");
  assert(result.marketingControls === 0, "Non-marketing route shows marketing theme controls");
  assert(!result.horizontalOverflow, "Non-marketing route has horizontal overflow");
  await page.screenshot({ path: ".playwright-cli/phase4-non-marketing-rnd-analytics.png", fullPage: false });
  await context.close();
  return result;
}

(async () => {
  const { chromium } = await import("@playwright/test");
  const session = await login();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const route of marketingRoutes) {
    for (const viewport of viewports) {
      results.push(await checkMarketingRoute(browser, session, route, viewport, "marketing-aesthetic"));
    }
  }

  results.push(await checkMarketingRoute(browser, session, "/marketing/lead-capture", viewports[2], "professional"));
  results.push(await checkNonMarketing(browser, session));

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
