"use client";

import React from "react";

// ── Toast Hook ──
export function useDnaToast() {
  const toastFns = {
    success: (title: string, desc?: string) => {
      console.log("[TOAST_SUCCESS]", title, desc);
    },
    error: (title: string, desc?: string) => {
      console.error("[TOAST_ERROR]", title, desc);
    },
    warning: (title: string, desc?: string) => {
      console.warn("[TOAST_WARNING]", title, desc);
    },
    info: (title: string, desc?: string) => {
      console.info("[TOAST_INFO]", title, desc);
    },
  };

  const showToast = (props: {
    type: "success" | "error" | "warning" | "info" | string;
    title: string;
    message?: string;
  }) => {
    const fn = (toastFns as any)[props.type] || toastFns.info;
    fn(props.title, props.message);
  };

  return {
    ...toastFns,
    toast: toastFns,
    showToast,
  };
}

// ── Toast Provider ──
export function DnaToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
