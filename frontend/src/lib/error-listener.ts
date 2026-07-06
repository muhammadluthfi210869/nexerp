"use client";

import { trackError } from "./error-tracker";

let initialized = false;

export function initErrorListeners() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("error", (event) => {
    if (event.error) {
      trackError(event.error, {
        level: "fatal",
        metadata: {
          type: "unhandled",
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    trackError(error, {
      level: "error",
      metadata: { type: "unhandled_rejection" },
    });
  });

  // Catch localStorage corruption only (no JSON.parse patch - too aggressive)
  const originalGetItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key) {
    try {
      return originalGetItem.call(this, key);
    } catch (e) {
      trackError(`localStorage corruption: ${key}`, {
        level: "warning",
        metadata: { type: "localstorage_corrupt", key },
      });
      return null;
    }
  };
}

export { trackError };
