"use client";

import { useEffect } from "react";

/**
 * usePerformanceAudit
 * A hook that logs Page Load Metrics to the console in development
 * to help maintain the < 500ms integrity goal.
 */
export function usePerformanceAudit(pageName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    // We use a small timeout to ensure the load event has fired
    const timer = setTimeout(() => {
      const perfEntries = performance.getEntriesByType("navigation");
      if (perfEntries.length > 0) {
        const nav = perfEntries[0] as PerformanceNavigationTiming;
        const ttfb = nav.responseStart - nav.requestStart;
        const domReady = nav.domContentLoadedEventEnd - nav.startTime;
        const loadTime = nav.loadEventEnd - nav.startTime;

        console.log(
          `%c 🛡️ PERFORMANCE AUDIT: ${pageName} `,
          "background: #1e293b; color: #3b82f6; font-weight: bold; padding: 2px 4px; border-radius: 4px;"
        );
        console.table({
          "TTFB (Server Speed)": `${ttfb.toFixed(1)}ms`,
          "DOM Content Ready": `${domReady.toFixed(1)}ms`,
          "Total Page Load": `${loadTime.toFixed(1)}ms`,
          "Status": loadTime < 500 ? "✅ PASS" : "⚠️ EXCEEDS 500ms GOAL"
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [pageName]);
}

