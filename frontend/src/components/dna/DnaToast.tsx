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

const dnaToast = {
  default: (title: string, opts?: DnaToastOptions) =>
    sonnerToast(title, {
      description: opts?.description,
      duration: opts?.duration,
    }),
  success: (title: string, opts?: DnaToastOptions) =>
    sonnerToast.success(title, {
      description: opts?.description,
      duration: opts?.duration,
    }),
  error: (title: string, opts?: DnaToastOptions) =>
    sonnerToast.error(title, {
      description: opts?.description,
      duration: opts?.duration,
    }),
  info: (title: string, opts?: DnaToastOptions) =>
    sonnerToast.info(title, {
      description: opts?.description,
      duration: opts?.duration,
    }),
  warning: (title: string, opts?: DnaToastOptions) =>
    sonnerToast.warning(title, {
      description: opts?.description,
      duration: opts?.duration,
    }),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  loading: sonnerToast.loading,
};

export const dnaToastApi = dnaToast;
export { dnaToast as toast };

/**
 * DnaToaster — drop-in replacement for the sonner <Toaster /> mount.
 * DNA-themed (dark surface, sharp typography, blue accent).
 */
export const DnaToaster: React.FC<{ position?: React.ComponentProps<typeof SonnerToaster>["position"] }> = ({
  position = "top-right",
}) => (
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
);

/**
 * useDnaToast — hook form. Returns a stable object with the same helpers.
 * Mostly for ergonomic import symmetry with shadcn's `useToast`.
 */
export function useDnaToast() {
  return dnaToastApi;
}

export default DnaToaster;