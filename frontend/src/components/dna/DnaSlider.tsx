"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * DnaSlider — replaces shadcn Slider. Wraps @radix-ui/react-slider (installed)
 * with DNA visual tokens.
 */

export interface DnaSliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

export const DnaSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  DnaSliderProps
>(
  (
    {
      className,
      trackClassName,
      rangeClassName,
      thumbClassName,
      ...props
    },
    ref
  ) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800",
          trackClassName
        )}
      >
        <SliderPrimitive.Range
          className={cn("absolute h-full bg-blue-600 dark:bg-blue-500", rangeClassName)}
        />
      </SliderPrimitive.Track>
      {(Array.isArray(props.value) ? props.value : Array.isArray(props.defaultValue) ? props.defaultValue : [props.value ?? props.defaultValue ?? 0]).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "block h-4 w-4 rounded-full border-2 border-blue-600 bg-white shadow-md transition-transform",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
            "disabled:pointer-events-none disabled:opacity-50",
            thumbClassName
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
);
DnaSlider.displayName = "DnaSlider";

export default DnaSlider;