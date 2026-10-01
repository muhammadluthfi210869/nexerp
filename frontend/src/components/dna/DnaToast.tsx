"use client";

import * as React from "react";
import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";
import { cn } from "@/lib/utils";

/**
 * DnaToast — DNA-native toast surface over sonner (already installed).
 * Provides:
 *  - <DnaToaster /> mount with DNA-styled classes (drop into app root)
 *  - dnaToast.* thin wrapper that forwards to sonner with DNA defaults
 *  - Type-safe success / error / info / warning helpers
 *
 * Why sonner? It's already a dependency, the actual mount in the app already
 * uses it. We don't reimplement toast state — we restyle + re-export.
 */

export type DnaToastVariant = "default" | "success" | "error" | "info" | "warning";

export interface DnaToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

const normalizeTitle = (title: unknown): string => {
  if (typeof title === "string") return title;
  if (title && typeof title === "object") {
    const t = title as any;
    if (typeof t.message === "string") return t.message;
    if (typeof t.detail === "string") return t.detail;
    if (typeof t.title === "string") return t.title;
    try {
      return JSON.stringify(t);
    } catch {
      return String(t);
    }
  }
  return String(title ?? "Notification");
};

const normalizeOpts = (msgOrOpts?: string | DnaToastOptions): DnaToastOptions | undefined => {
  if (msgOrOpts === undefined) return undefined;
  if (typeof msgOrOpts === "string") return { description: msgOrOpts };
  return msgOrOpts;
};

const dnaToast = {
  default: (title: unknown, msgOrOpts?: string | DnaToastOptions) =>
    sonnerToast(normalizeTitle(title), normalizeOpts(msgOrOpts)),
  success: (title: unknown, msgOrOpts?: string | DnaToastOptions) =>
    sonnerToast.success(normalizeTitle(title), normalizeOpts(msgOrOpts)),
  error: (title: unknown, msgOrOpts?: string | DnaToastOptions) =>
    sonnerToast.error(normalizeTitle(title), normalizeOpts(msgOrOpts)),
  info: (title: unknown, msgOrOpts?: string | DnaToastOptions) =>
    sonnerToast.info(normalizeTitle(title), normalizeOpts(msgOrOpts)),
  warning: (title: unknown, msgOrOpts?: string | DnaToastOptions) =>
    sonnerToast.warning(normalizeTitle(title), normalizeOpts(msgOrOpts)),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  loading: (title: unknown, msgOrOpts?: string | DnaToastOptions) =>
    sonnerToast.loading(normalizeTitle(title), normalizeOpts(msgOrOpts)),
  // Direct callable form: dnaToast("title", "message") or dnaToast("title", { description })
  __call__: (title: unknown, msgOrOpts?: string | DnaToastOptions) =>
    sonnerToast(normalizeTitle(title), normalizeOpts(msgOrOpts)),
};

// Proxy makes `dnaToast("title", "msg")` callable as a function AND
// also exposes .success/.error/etc. method-style. Backward compat for
// pages that did `toast("title", "msg")` instead of `toast.success(...)`.
const dnaToastCallable: any = new Proxy(dnaToast, {
  apply: (_t, _this, args) => (dnaToast as any).__call__(...args),
  get: (_t, prop) => (dnaToast as any)[prop],
});

export const dnaToastApi = dnaToastCallable;
export { dnaToastCallable as dnaToast, dnaToastCallable as toast };

/**
 * DnaToaster — drop-in replacement for the sonner <Toaster /> mount.
 * DNA-themed (dark surface, sharp typography, blue accent).
 */
export const DnaToaster: React.FC<{ position?: React.ComponentProps<typeof SonnerToaster>["position"]; children?: React.ReactNode }> = ({
  position = "top-right",
  children,
}) => (
  <>
    <SonnerToaster
      position={position}
    toastOptions={{
      classNames: {
        toast: cn(
          "group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-100",
          "group-[.toaster]:border group-[.toaster]:border-slate-800 group-[.toaster]:shadow-xl",
          "group-[.toaster]:rounded-xl group-[.toaster]:text-[12px] group-[.toaster]:font-semibold"
        ),
        description: "group-[.toast]:text-slate-400 group-[.toast]:text-[11px]",
        actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
        cancelButton: "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-300",
      },
    }}
  />
    {children}
  </>
);

/**
 * useDnaToast — hook form. Returns a stable object with the same helpers.
 * Mostly for ergonomic import symmetry with shadcn's `useToast`.
 */
export function useDnaToast() {
  return dnaToastApi;
}

export default DnaToaster;