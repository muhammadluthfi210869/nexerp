"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DnaDialog — Canonical Visual DNA Modal Dialog.
 * Wraps @base-ui/react/dialog directly (no shadcn dep).
 * Drop-in compatible with the shadcn compound API used across the codebase.
 */

type Slot = { "data-slot"?: string };

export const DnaDialog = (props: DialogPrimitive.Root.Props) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
);

export const DnaDialogTrigger = ({
  asChild,
  ...props
}: DialogPrimitive.Trigger.Props & { asChild?: boolean }) => (
  <DialogPrimitive.Trigger
    data-slot="dialog-trigger"
    render={asChild ? (props.children as React.ReactElement) : undefined}
    {...props}
  />
);

export const DnaDialogPortal = (props: DialogPrimitive.Portal.Props) => (
  <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
);

export const DnaDialogClose = (props: DialogPrimitive.Close.Props) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
);

export const DnaDialogOverlay = ({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) => (
  <DialogPrimitive.Backdrop
    data-slot="dialog-overlay"
    className={cn(
      "fixed inset-0 isolate z-50 bg-black/40 duration-100 supports-backdrop-filter:backdrop-blur-xs",
      "data-open:animate-in data-open:fade-in-0",
      "data-closed:animate-out data-closed:fade-out-0",
      className
    )}
    {...props}
  />
);

export interface DnaDialogContentProps
  extends DialogPrimitive.Popup.Props {
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const DnaDialogContent = React.forwardRef<
  HTMLDivElement,
  DnaDialogContentProps
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <DnaDialogPortal>
    <DnaDialogOverlay />
    <DialogPrimitive.Popup
      ref={ref as React.Ref<HTMLDivElement>}
      data-slot="dialog-content"
      className={cn(
        "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-900 shadow-2xl duration-100 outline-none",
        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
        "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          data-slot="dialog-close"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Popup>
  </DnaDialogPortal>
));
DnaDialogContent.displayName = "DnaDialogContent";

export const DnaDialogHeader = ({
  className,
  ...props
}: React.ComponentProps<"div"> & Slot) => (
  <div
    data-slot="dialog-header"
    className={cn("flex flex-col space-y-1.5 pb-4 border-b border-slate-100 text-left", className)}
    {...props}
  />
);
DnaDialogHeader.displayName = "DnaDialogHeader";

export const DnaDialogFooter = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="dialog-footer"
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-slate-100 mt-5 bg-white",
      className
    )}
    {...props}
  />
);
DnaDialogFooter.displayName = "DnaDialogFooter";

export const DnaDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  DialogPrimitive.Title.Props
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref as React.Ref<HTMLHeadingElement>}
    data-slot="dialog-title"
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
  DialogPrimitive.Description.Props
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref as React.Ref<HTMLParagraphElement>}
    data-slot="dialog-description"
    className={cn("text-[12px] text-slate-500 font-normal leading-relaxed", className)}
    {...props}
  />
));
DnaDialogDescription.displayName = "DnaDialogDescription";

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