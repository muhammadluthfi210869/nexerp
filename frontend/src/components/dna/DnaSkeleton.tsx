"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DnaSkeleton — replaces shadcn Skeleton. Single primitive with shape variant
 * (rect | circle | text) for common loading-state usages. Pure Tailwind pulse
 * animation, no shadcn dependency.
 */

export type DnaSkeletonShape = "rect" | "circle" | "text";

export interface DnaSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: DnaSkeletonShape;
  width?: string | number;
  height?: string | number;
}

const shapeClasses: Record<DnaSkeletonShape, string> = {
  rect: "rounded-lg",
  circle: "rounded-full",
  text: "rounded-md h-3",
};

export const DnaSkeleton = React.forwardRef<HTMLDivElement, DnaSkeletonProps>(
  ({ className, shape = "rect", width, height, style, ...props }, ref) => {
    const dimStyle: React.CSSProperties = {
      ...(width !== undefined && { width: typeof width === "number" ? `${width}px` : width }),
      ...(height !== undefined && { height: typeof height === "number" ? `${height}px` : height }),
      ...style,
    };
    return (
      <div
        ref={ref}
        aria-busy="true"
        aria-live="polite"
        className={cn(
          "animate-pulse bg-slate-200/80 dark:bg-slate-800/80",
          shapeClasses[shape],
          className
        )}
        style={dimStyle}
        {...props}
      />
    );
  }
);
DnaSkeleton.displayName = "DnaSkeleton";

export default DnaSkeleton;