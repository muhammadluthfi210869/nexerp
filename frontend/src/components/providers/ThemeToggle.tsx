"use client";

import React from "react";
import { useTheme, ThemePreference } from "./ThemeProvider";
import { Sun } from "lucide-react";

// ponytail: 2026-08-31 UI finalization — only the LIGHT option is exposed.
// Dark and System themes are not yet finished; per brief, they must not be
// accidentally exposed to users. Restrict options array to Light only.
const OPTIONS: Array<{ value: ThemePreference; label: string; Icon: React.ComponentType<{ size?: number }> }> = [
  { value: "light", label: "Light", Icon: Sun },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        borderRadius: 12,
        background: "var(--gray-50, #F9FAFB)",
        border: "1px solid var(--color-border, #E5E7EB)",
      }}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            title={label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 950,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              background: active ? "var(--color-card, #FFFFFF)" : "transparent",
              color: active ? "var(--color-text-main, #0F172A)" : "var(--color-text-muted, #6B7280)",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <Icon size={12} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}