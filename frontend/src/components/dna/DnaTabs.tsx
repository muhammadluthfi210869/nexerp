"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * DnaTabs — replaces shadcn Tabs. Wraps @radix-ui/react-tabs with DNA visual
 * tokens. Same compound API: Tabs / TabsList / TabsTrigger / TabsContent.
 *
 * Distinct from DnaTabNav (button-group navigation). Use DnaTabs for content
 * panels; use DnaTabNav for top-page segmented navigation.
 */

export const DnaTabs = TabsPrimitive.Root;

export const DnaTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-start gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-slate-500 dark:text-slate-400",
      className
    )}
    {...props}
  />
));
DnaTabsList.displayName = "DnaTabsList";

export const DnaTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-semibold tracking-tight transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
      "dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100",
      className
    )}
    {...props}
  />
));
DnaTabsTrigger.displayName = "DnaTabsTrigger";

export const DnaTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 rounded-xl",
      className
    )}
    {...props}
  />
));
DnaTabsContent.displayName = "DnaTabsContent";

export default DnaTabs;