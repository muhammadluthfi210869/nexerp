"use client";

import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DnaDropdownMenu — replaces shadcn DropdownMenu. Wraps
 * @radix-ui/react-dropdown-menu (installed) with DNA visual tokens.
 *
 * Compound API mirrors Radix: Root / Trigger / Content / Item /
 * CheckboxItem / RadioItem / Label / Separator / Shortcut.
 */

export const DnaDropdownMenu = DropdownPrimitive.Root;
export const DnaDropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DnaDropdownMenuGroup = DropdownPrimitive.Group;
export const DnaDropdownMenuPortal = DropdownPrimitive.Portal;
export const DnaDropdownMenuSub = DropdownPrimitive.Sub;
export const DnaDropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export const DnaDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 shadow-xl text-slate-800 dark:text-slate-100",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
));
DnaDropdownMenuContent.displayName = "DnaDropdownMenuContent";

export const DnaDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none transition-colors",
      "focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DnaDropdownMenuItem.displayName = "DnaDropdownMenuItem";

export const DnaDropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-xs font-semibold outline-none transition-colors",
      "focus:bg-slate-100 dark:focus:bg-slate-800",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-blue-600" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownPrimitive.CheckboxItem>
));
DnaDropdownMenuCheckboxItem.displayName = "DnaDropdownMenuCheckboxItem";

export const DnaDropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-xs font-semibold outline-none transition-colors",
      "focus:bg-slate-100 dark:focus:bg-slate-800",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-blue-600" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownPrimitive.RadioItem>
));
DnaDropdownMenuRadioItem.displayName = "DnaDropdownMenuRadioItem";

export const DnaDropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DnaDropdownMenuLabel.displayName = "DnaDropdownMenuLabel";

export const DnaDropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator
    ref={ref}
    className={cn("my-1 h-px bg-slate-200 dark:bg-slate-800", className)}
    {...props}
  />
));
DnaDropdownMenuSeparator.displayName = "DnaDropdownMenuSeparator";

export const DnaDropdownMenuShortcut: React.FC<
  React.HTMLAttributes<HTMLSpanElement>
> = ({ className, ...props }) => (
  <span
    className={cn(
      "ml-auto text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500",
      className
    )}
    {...props}
  />
);
DnaDropdownMenuShortcut.displayName = "DnaDropdownMenuShortcut";

export default DnaDropdownMenu;