"use client";

import * as React from "react";
import {
  Dialog as RawDialog,
  DialogClose as RawDialogClose,
  DialogContent as RawDialogContent,
  DialogDescription as RawDialogDescription,
  DialogFooter as RawDialogFooter,
  DialogHeader as RawDialogHeader,
  DialogOverlay as RawDialogOverlay,
  DialogPortal as RawDialogPortal,
  DialogTitle as RawDialogTitle,
  DialogTrigger as RawDialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * DnaDialog — Canonical Visual DNA Modal Dialog.
 * Standardized with rounded-2xl, border-slate-200, subtle backdrop blur, and DNA typography tokens.
 */
export const DnaDialog = RawDialog;
export const DnaDialogTrigger = RawDialogTrigger;
export const DnaDialogPortal = RawDialogPortal;
export const DnaDialogClose = RawDialogClose;
export const DnaDialogOverlay = RawDialogOverlay;

export const DnaDialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RawDialogContent>
>(({ className, children, ...props }, ref) => (
  <RawDialogContent
    ref={ref}
    className={cn(
      "rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-6",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      className
    )}
    {...props}
  >
    {children}
  </RawDialogContent>
));
DnaDialogContent.displayName = "DnaDialogContent";

export const DnaDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <RawDialogHeader
    className={cn(
      "flex flex-col space-y-1.5 pb-4 border-b border-slate-100 text-left",
      className
    )}
    {...props}
  />
);
DnaDialogHeader.displayName = "DnaDialogHeader";

export const DnaDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof RawDialogTitle>
>(({ className, ...props }, ref) => (
  <RawDialogTitle
    ref={ref}
    className={cn(
      "text-[18px] font-bold text-slate-900 tracking-tight leading-snug",
      className
    )}
    {...props}
  />
));
DnaDialogTitle.displayName = "DnaDialogTitle";

export const DnaDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof RawDialogDescription>
>(({ className, ...props }, ref) => (
  <RawDialogDescription
    ref={ref}
    className={cn("text-[12px] text-slate-500 font-normal leading-relaxed", className)}
    {...props}
  />
));
DnaDialogDescription.displayName = "DnaDialogDescription";

export const DnaDialogFooter = ({
  className,
  ...props
}: React.ComponentProps<typeof RawDialogFooter>) => (
  <RawDialogFooter
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-slate-100 mt-5 bg-white",
      className
    )}
    {...props}
  />
);
DnaDialogFooter.displayName = "DnaDialogFooter";

// Canonical Aliases for 100% Drop-in Compatibility
export const Dialog = DnaDialog;
export const DialogClose = DnaDialogClose;
export const DialogContent = DnaDialogContent;
export const DialogDescription = DnaDialogDescription;
export const DialogFooter = DnaDialogFooter;
export const DialogHeader = DnaDialogHeader;
export const DialogOverlay = DnaDialogOverlay;
export const DialogPortal = DnaDialogPortal;
export const DialogTitle = DnaDialogTitle;
export const DialogTrigger = DnaDialogTrigger;

export default DnaDialog;
