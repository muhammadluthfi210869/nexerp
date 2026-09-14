"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// shadcn-style Tooltip compound.
// Minimal shim: no Radix Tooltip installed (forbidden new deps).
// TooltipProvider = no-op context.
// TooltipTrigger = asChild span wrapper.
// TooltipContent = CSS-only positioned div using hover state.
// Trade-off: no animations / portal / arrow. Adequate for hover hints on
// icon buttons in samples/input. Upgrade path: add @radix-ui/react-tooltip.

interface TooltipCtxValue {
  open: boolean;
  setOpen: (b: boolean) => void;
  triggerId: string;
}

const TooltipContext = React.createContext<TooltipCtxValue | null>(null);

function useTooltipCtx(component: string) {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error(`${component} must be used inside <Tooltip>`);
  return ctx;
}

export interface TooltipProviderProps {
  delayDuration?: number;
  children: React.ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  // Pass-through provider. delayDuration ignored in CSS-only shim.
  return <>{children}</>;
}

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (b: boolean) => void;
  delayDuration?: number;
  children: React.ReactNode;
}

export function Tooltip({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  children,
}: TooltipProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(!!defaultOpen);
  const open = isControlled ? !!controlledOpen : internalOpen;

  const triggerId = React.useId();

  const setOpen = React.useCallback(
    (b: boolean) => {
      if (!isControlled) setInternalOpen(b);
      onOpenChange?.(b);
    },
    [isControlled, onOpenChange]
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerId }}>
      <span
        className="group/dnatooltipcompound relative inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps
  extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  children: React.ReactElement;
}

export const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(
  function TooltipTrigger({ asChild, children, ...props }, ref) {
    const ctx = useTooltipCtx("TooltipTrigger");
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<Record<string, unknown>>;
      return React.cloneElement(child, {
        ...props,
        ref,
        "data-tooltip-trigger": ctx.triggerId,
        onMouseEnter: (e: React.MouseEvent) => {
          (props as { onMouseEnter?: (e: React.MouseEvent) => void }).onMouseEnter?.(e);
          ctx.setOpen(true);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          (props as { onMouseLeave?: (e: React.MouseEvent) => void }).onMouseLeave?.(e);
          ctx.setOpen(false);
        },
      });
    }
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} {...props}>
        {children}
      </span>
    );
  }
);

const sideClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
} as const;

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  hidden?: boolean;
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  function TooltipContent(
    { className, side = "top", sideOffset = 4, align = "center", children, hidden, ...props },
    ref
  ) {
    const ctx = useTooltipCtx("TooltipContent");
    if (!ctx.open || hidden) return null;

    const alignClasses =
      align === "start"
        ? "left-0"
        : align === "end"
          ? "right-0"
          : "left-1/2 -translate-x-1/2";

    return (
      <div
        ref={ref}
        role="tooltip"
        data-slot="tooltip-content"
        data-side={side}
        style={{ [side === "left" || side === "right" ? "marginTop" : "margin"]: sideOffset } as React.CSSProperties}
        className={cn(
          "pointer-events-none absolute z-50 inline-flex w-fit max-w-xs origin-center items-center gap-1.5 rounded-md bg-slate-900 dark:bg-slate-100 px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 shadow-lg",
          "animate-in fade-in-0 zoom-in-95",
          sideClasses[side],
          alignClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
