"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DnaSheet — Visual DNA Floating Modal / Sheet Window.
 * Standardized to Centered Floating Window (Float Window di Tengah)
 * per Visual DNA Golden Rule #2 (CRUD harus floating window, bukan side drawer).
 */
export const DnaSheet = SheetPrimitive.Root;
export const DnaSheetTrigger = SheetPrimitive.Trigger;
export const DnaSheetClose = SheetPrimitive.Close;
export const DnaSheetPortal = SheetPrimitive.Portal;

export const DnaSheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DnaSheetOverlay.displayName = "DnaSheetOverlay";

export interface DnaSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  size?: "sm" | "default" | "lg" | "xl" | "full";
  variant?: "float" | "side";
  side?: "top" | "bottom" | "left" | "right";
}

const SIZE_MAP = {
  sm: "sm:max-w-md",
  default: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-6xl",
};

export const DnaSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  DnaSheetContentProps
>(({ className, children, size = "xl", variant = "float", side, ...props }, ref) => {
  // If explicitly forced to "side"
  if (variant === "side") {
    return (
      <SheetPrimitive.Portal>
        <DnaSheetOverlay />
        <SheetPrimitive.Content
          ref={ref}
          className={cn(
            "fixed inset-y-0 right-0 z-50 h-full w-full border-l border-slate-200 bg-white text-slate-900 shadow-2xl p-0 flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300",
            SIZE_MAP[size] || "sm:max-w-[700px]",
            className
          )}
          {...props}
        >
          {children}
          <SheetPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden z-10">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    );
  }

  // DEFAULT: Centered Floating Window (Float Window di Tengah)
  return (
    <SheetPrimitive.Portal>
      <DnaSheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[calc(100%-2rem)] max-h-[90vh] rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden flex flex-col",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-150",
          SIZE_MAP[size] || SIZE_MAP.xl,
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
});
DnaSheetContent.displayName = "DnaSheetContent";

export const DnaSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 px-6 py-5 border-b border-slate-100 text-left bg-white shrink-0",
      className
    )}
    {...props}
  />
);
DnaSheetHeader.displayName = "DnaSheetHeader";

export const DnaSheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      "text-[18px] font-bold text-slate-900 tracking-tight leading-snug",
      className
    )}
    {...props}
  />
));
DnaSheetTitle.displayName = "DnaSheetTitle";

export const DnaSheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-[12px] text-slate-500 font-normal leading-relaxed", className)}
    {...props}
  />
));
DnaSheetDescription.displayName = "DnaSheetDescription";

export const DnaSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0",
      className
    )}
    {...props}
  />
);
DnaSheetFooter.displayName = "DnaSheetFooter";

// Canonical Aliases for 100% Drop-in Compatibility
export const Sheet = DnaSheet;
export const SheetTrigger = DnaSheetTrigger;
export const SheetClose = DnaSheetClose;
export const SheetPortal = DnaSheetPortal;
export const SheetOverlay = DnaSheetOverlay;
export const SheetContent = DnaSheetContent;
export const SheetHeader = DnaSheetHeader;
export const SheetTitle = DnaSheetTitle;
export const SheetDescription = DnaSheetDescription;
export const SheetFooter = DnaSheetFooter;

export default DnaSheet;
