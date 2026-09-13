"use client";

// DnaMention — @-mention autocomplete dropdown.
//
// ponytail: keyboard nav + selection. No debounce cache — service already
// caps results at 8 + 200ms mock latency, that's the natural throttle.
// Real impl (D1.Backend) will return ≤8 rows by query.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AtSign } from "lucide-react";
import type { CommUser } from "@/types/communication";
import { communicationService } from "@/lib/services/communication-service";

export interface DnaMentionProps {
  /** Trigger character; default "@". One component per composer. */
  trigger?: string;
  /** Current textarea content (controlled). */
  value: string;
  /** Notified when mention token is inserted. Receives full new value + the userId added. */
  onChange: (nextValue: string, mentionedUser: CommUser) => void;
  /** Optional callback to expose internal state for tests. */
  onPickerStateChange?: (open: boolean) => void;
  className?: string;
}

interface PickerState {
  open: boolean;
  query: string;
  startIndex: number; // index of the trigger char in the textarea
  users: CommUser[];
  activeIndex: number;
}

const INITIAL: PickerState = { open: false, query: "", startIndex: -1, users: [], activeIndex: 0 };

export function DnaMention({
  trigger = "@",
  value,
  onChange,
  onPickerStateChange,
  className,
}: DnaMentionProps) {
  const [state, setState] = useState<PickerState>(INITIAL);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect active trigger in the value (last @word before caret).
  // ponytail: caret index not exposed via DOM `value` — infer from last space
  // / line break before the trigger. Adequate for autocomplete UX.
  useEffect(() => {
    const lastTriggerIdx = value.lastIndexOf(trigger);
    if (lastTriggerIdx === -1) {
      if (state.open) setState(INITIAL);
      return;
    }
    const between = value.slice(lastTriggerIdx);
    // Bail if trigger is part of an email / word like "foo@bar"
    const charBefore = value[lastTriggerIdx - 1];
    if (charBefore && /[\w]/.test(charBefore)) {
      if (state.open) setState(INITIAL);
      return;
    }
    // Inline token: must be at most one word (no spaces yet)
    if (/\s/.test(between.slice(1))) {
      if (state.open) setState(INITIAL);
      return;
    }
    const query = between.slice(1);
    setState((s) => ({ ...s, open: true, query, startIndex: lastTriggerIdx }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const users = await communicationService.searchUsers(mockCommViewerFallback(), query);
      setState((s) => ({ ...s, users, activeIndex: 0 }));
    }, 300);
  }, [value, trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onPickerStateChange?.(state.open);
  }, [state.open, onPickerStateChange]);

  const select = (user: CommUser) => {
    if (state.startIndex === -1) return;
    const before = value.slice(0, state.startIndex);
    const after = value.slice(state.startIndex).replace(/@\S*/, "").trimStart();
    const token = `${trigger}[${user.id}:${user.name}]`;
    const next = `${before}${token} ${after}`.trimEnd() + " ";
    onChange(next, user);
    setState(INITIAL);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!state.open || state.users.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setState((s) => ({ ...s, activeIndex: (s.activeIndex + 1) % s.users.length }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setState((s) => ({ ...s, activeIndex: (s.activeIndex - 1 + s.users.length) % s.users.length }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const u = state.users[state.activeIndex];
      if (u) select(u);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setState(INITIAL);
    }
  };

  if (!state.open || state.users.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute z-50 left-0 right-0 bottom-full mb-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl",
        className,
      )}
      role="listbox"
      aria-label="Mention suggestions"
    >
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 flex items-center gap-1">
        <AtSign className="w-3 h-3" /> Mention ({state.users.length})
      </div>
      {state.users.map((u, i) => (
        <button
          key={u.id}
          type="button"
          role="option"
          aria-selected={i === state.activeIndex}
          onClick={() => select(u)}
          onMouseEnter={() => setState((s) => ({ ...s, activeIndex: i }))}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors",
            i === state.activeIndex ? "bg-blue-50" : "hover:bg-slate-50",
          )}
        >
          <span
            className="w-7 h-7 rounded-full text-white flex items-center justify-center font-black text-[11px] shrink-0"
            style={{ backgroundColor: u.avatarBg ?? "#94a3b8" }}
          >
            {u.initial ?? u.name[0]?.toUpperCase()}
          </span>
          <span className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-900 truncate">{u.name}</span>
            <span className="text-[10px] text-slate-500 truncate">{u.role ?? u.email}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// Internal hook for composer to wire onKeyDown without prop drilling.
export function useDnaMentionKeyDown(open: boolean): (e: React.KeyboardEvent<HTMLTextAreaElement>) => void {
  return () => {
    /* composer owns state; this is a placeholder for future shared keymap */
  };
}

// Lazy fallback to avoid circular import; resolves to mock viewer.
function mockCommViewerFallback(): import("@/types/communication").CommUser {
  // Lazy require so the dev bundler tree-shakes when real mode is on.
  // ponytail: one-liner — the mock service exposes a viewer; we mirror the shape.
  return { id: "u-revita", name: "Revita", email: "revita@dreamlab.id", role: "Digital Marketing Lead" };
}