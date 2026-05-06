"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number; indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-base",
      className
    )}
    {...props}
  >
      <div
        className={cn("h-full w-full flex-1 bg-brand-orange transition-[width] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]", indicatorClassName)}
        style={{ width: `${value || 0}%` }}
      />
  </div>
))
Progress.displayName = "Progress"

export { Progress }

