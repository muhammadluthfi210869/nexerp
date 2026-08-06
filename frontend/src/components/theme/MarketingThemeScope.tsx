"use client";

import * as React from "react";
import { Monitor, Sparkles } from "lucide-react";
import { createPortal } from "react-dom";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type UiTheme = "professional" | "marketing-aesthetic";
type ThemePreference = UiTheme | "follow-department";
type ThemeSettings = {
  preference: ThemePreference;
  departmentDefaultTheme: UiTheme;
  allowUserOverride: boolean;
  canManageAppearance: boolean;
};

const STORAGE_KEY = "nexerp.uiTheme";
const FEATURE_FLAG = process.env.NEXT_PUBLIC_MARKETING_AESTHETIC_THEME;

function isThemePreference(value: string | null): value is ThemePreference {
  return (
    value === "professional" ||
    value === "marketing-aesthetic" ||
    value === "follow-department"
  );
}

export function resolveMarketingTheme(preference: ThemePreference, departmentDefaultTheme: UiTheme): UiTheme {
  const aestheticEnabled = FEATURE_FLAG !== "false";

  if (!aestheticEnabled) {
    return "professional";
  }

  if (preference === "professional") {
    return "professional";
  }

  if (preference === "marketing-aesthetic") {
    return "marketing-aesthetic";
  }

  return departmentDefaultTheme;
}

export function MarketingThemeScope({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [preference, setPreference] =
    React.useState<ThemePreference>("follow-department");
  // Default = professional untuk SEMUA akun (tanpa terkecuali). Nilai awal
  // sebelum fetch server harus sudah professional supaya tidak ada "flash"
  // aesthetic di render pertama (PLAN-RAHMAT / migrasi theme professional).
  const [departmentDefaultTheme, setDepartmentDefaultTheme] =
    React.useState<UiTheme>("professional");
  const [allowUserOverride, setAllowUserOverride] = React.useState(true);
  const [canManageAppearance, setCanManageAppearance] = React.useState(false);
  const [navbarSlot, setNavbarSlot] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const storedPreference = window.localStorage.getItem(STORAGE_KEY);
    setNavbarSlot(document.getElementById("marketing-theme-navbar-slot"));

    if (isThemePreference(storedPreference)) {
      setPreference(storedPreference);
    }

    api
      .get<ThemeSettings>("/marketing/prototype/ui-theme")
      .then((response) => {
        const settings = response.data;
        setPreference(settings.preference);
        setDepartmentDefaultTheme(settings.departmentDefaultTheme);
        setAllowUserOverride(settings.allowUserOverride);
        setCanManageAppearance(settings.canManageAppearance);
        window.localStorage.setItem(STORAGE_KEY, settings.preference);
      })
      .catch(() => {
        // Local preference remains the offline fallback for demo/staging sessions.
      });
  }, []);

  const activeTheme = resolveMarketingTheme(preference, departmentDefaultTheme);

  React.useEffect(() => {
    document.body.dataset.uiTheme = activeTheme;
    document.body.dataset.themePreference = preference;

    return () => {
      if (document.body.dataset.uiTheme === activeTheme) {
        delete document.body.dataset.uiTheme;
      }

      if (document.body.dataset.themePreference === preference) {
        delete document.body.dataset.themePreference;
      }
    };
  }, [activeTheme, preference]);

  function updatePreference(nextPreference: ThemePreference) {
    if (!allowUserOverride) {
      return;
    }

    setPreference(nextPreference);
    window.localStorage.setItem(STORAGE_KEY, nextPreference);

    api
      .patch<ThemeSettings>("/marketing/prototype/ui-theme", {
        preference: nextPreference,
      })
      .then((response) => {
        setPreference(response.data.preference);
        setDepartmentDefaultTheme(response.data.departmentDefaultTheme);
        setAllowUserOverride(response.data.allowUserOverride);
        setCanManageAppearance(response.data.canManageAppearance);
        window.localStorage.setItem(STORAGE_KEY, response.data.preference);
      })
      .catch(() => {
        // Keep localStorage preference if API persistence is unavailable.
      });
  }

  const themeControls = (
    <div className="flex min-w-max items-center gap-2">
      <div
        className="flex items-center gap-1 rounded-[16px] border border-[var(--border)] bg-white/85 p-1 shadow-[var(--aesthetic-shadow-xs)] backdrop-blur-xl"
        aria-label="Marketing UI theme"
      >
        <button
          type="button"
          onClick={() => updatePreference("professional")}
          disabled={!allowUserOverride}
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-[12px] px-2.5 text-[9px] font-black uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-50",
            activeTheme === "professional"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Monitor className="h-3.5 w-3.5" />
          Professional
        </button>
        <button
          type="button"
          onClick={() => updatePreference("marketing-aesthetic")}
          disabled={!allowUserOverride}
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-[12px] px-2.5 text-[9px] font-black uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-50",
            activeTheme === "marketing-aesthetic"
              ? "bg-[var(--primary)] text-white shadow-[var(--aesthetic-shadow-button)]"
              : "text-slate-500 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Aesthetic
        </button>
      </div>
    </div>
  );

  return (
    <>
    {navbarSlot ? createPortal(themeControls, navbarSlot) : null}
    <div
      data-ui-theme={activeTheme}
      data-theme-preference={preference}
      className={cn("marketing-aesthetic-shell", className)}
      style={{
        minHeight: "calc(100% + var(--page-py) + var(--page-pb))",
        margin: "calc(var(--page-py) * -1) calc(var(--page-px) * -1) calc(var(--page-pb) * -1)",
        padding: "var(--page-py) var(--page-px) var(--page-pb)",
      }}
    >
      {children}
    </div>
    </>
  );
}

export { STORAGE_KEY as MARKETING_UI_THEME_STORAGE_KEY };
