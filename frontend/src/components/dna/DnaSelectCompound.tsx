"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// shadcn-style compound Select using context + native <select> for form integration.
// No new deps (Radix Select not installed; uses what's there).

interface SelectContextValue {
  value: string;
  onValueChange: (v: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  setOpen: (b: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectCtx(component: string) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error(`${component} must be used inside <Select>`);
  return ctx;
}

function flattenItems(children: React.ReactNode): Array<{ value: string; label: string; disabled?: boolean }> {
  const out: Array<{ value: string; label: string; disabled?: boolean }> = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const t = child as React.ReactElement<{ value?: string; disabled?: boolean; children?: React.ReactNode }>;
    if (t.type === SelectItem && t.props.value != null) {
      const label = React.Children.toArray(t.props.children)
        .map((c) => (typeof c === "string" ? c : ""))
        .join("");
      out.push({ value: String(t.props.value), label, disabled: t.props.disabled });
    }
  });
  return out;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  name?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Select({ value, defaultValue, onValueChange, name, disabled, children }: SelectProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string>(defaultValue ?? "");
  const current = isControlled ? (value as string) : internal;
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = React.useState(false);

  const options = React.useMemo(() => flattenItems(children), [children]);
  const setVal = React.useCallback(
    (v: string) => {
      if (!isControlled) setInternal(v);
      onValueChange?.(v);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  const ctx: SelectContextValue = {
    value: current,
    onValueChange: setVal,
    triggerRef,
    setOpen,
    placeholder: undefined,
    disabled,
    name,
    options,
  };

  return (
    <SelectContext.Provider value={ctx}>
      {children}
      {/* Hidden native select for form integration */}
      <select
        name={name}
        value={current}
        disabled={disabled}
        onChange={(e) => setVal(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  className?: string;
  children?: React.ReactNode;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ className, children, onClick, ...props }, ref) {
    const ctx = useSelectCtx("SelectTrigger");
    return (
      <button
        ref={(node) => {
          (ctx.triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        type="button"
        disabled={ctx.disabled}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) ctx.setOpen(!((ctx as unknown as { _open?: boolean })._open));
          // Track open state via a data attr for simple toggle handling in SelectContent
          const btn = e.currentTarget;
          const next = btn.getAttribute("data-open") !== "true";
          btn.setAttribute("data-open", String(next));
          ctx.setOpen(next);
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
        {...props}
      >
        {children}
        <svg className="h-4 w-4 fill-current opacity-50" viewBox="0 0 20 20" aria-hidden>
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>
    );
  }
);

export interface SelectValueProps {
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const ctx = useSelectCtx("SelectValue");
  const current = ctx.options.find((o) => o.value === ctx.value);
  return <span className={className}>{current?.label ?? placeholder ?? ""}</span>;
}

export interface SelectContentProps {
  className?: string;
  children?: React.ReactNode;
  position?: "popper" | "item-aligned";
}

export function SelectContent({ className, children }: SelectContentProps) {
  const ctx = useSelectCtx("SelectContent");
  const [open, setOpen] = React.useState(false);
  // Re-render on context open changes via a small subscription
  React.useEffect(() => {
    const btn = ctx.triggerRef.current;
    if (!btn) return;
    const obs = new MutationObserver(() => {
      setOpen(btn.getAttribute("data-open") === "true");
    });
    obs.observe(btn, { attributes: true, attributeFilter: ["data-open"] });
    setOpen(btn.getAttribute("data-open") === "true");
    return () => obs.disconnect();
  }, [ctx.triggerRef]);

  if (!open) return null;
  return (
    <div
      role="listbox"
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function SelectItem({ value, disabled, className, children }: SelectItemProps) {
  const ctx = useSelectCtx("SelectItem");
  const selected = ctx.value === value;
  return (
    <div
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      onClick={() => !disabled && ctx.onValueChange(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-blue-50",
        selected && "bg-blue-50 font-semibold text-blue-700",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {selected ? (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-blue-600">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[3]">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : null}
      {children}
    </div>
  );
}
