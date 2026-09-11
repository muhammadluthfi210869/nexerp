"use client";

// Compat re-exports: maps shadcn-style names to canonical DNA primitives.
// ADR-007 / ADR-013: zero shadcn imports — all primitives resolve through DNA.

export { DnaTable as Table } from "./DnaTable";
export { DnaTableBody as TableBody } from "./DnaTable";
export { DnaTd as TableCell } from "./DnaTable";
export { DnaTableHead as TableHead } from "./DnaTable";
export { DnaTh as TableHeader } from "./DnaTable";
export { DnaTableRow as TableRow } from "./DnaTable";

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./DnaSelectCompound";

export {
  DnaTabs as Tabs,
  DnaTabsList as TabsList,
  DnaTabsTrigger as TabsTrigger,
  DnaTabsContent as TabsContent,
} from "./DnaTabs";

export {
  DnaDialog as Dialog,
  DnaDialogTrigger as DialogTrigger,
  DnaDialogPortal as DialogPortal,
  DnaDialogClose as DialogClose,
  DnaDialogOverlay as DialogOverlay,
  DnaDialogContent as DialogContent,
  DnaDialogHeader as DialogHeader,
  DnaDialogFooter as DialogFooter,
  DnaDialogTitle as DialogTitle,
  DnaDialogDescription as DialogDescription,
  DnaDialog as DnaDialogShim,
  DnaDialogContent as DnaDialogContentShim,
  DnaDialogTitle as DnaDialogTitleShim,
  DnaDialogDescription as DnaDialogDescriptionShim,
  DnaDialogHeader as DnaDialogHeaderShim,
  DnaDialogFooter as DnaDialogFooterShim,
} from "./DnaDialog";

export {
  DnaSheet as Sheet,
  DnaSheetTrigger as SheetTrigger,
  DnaSheetClose as SheetClose,
  DnaSheetContent as SheetContent,
  DnaSheetHeader as SheetHeader,
  DnaSheetFooter as SheetFooter,
  DnaSheetTitle as SheetTitle,
  DnaSheetDescription as SheetDescription,
} from "./DnaSheet";

export { DnaLabel as Label } from "./DnaLabel";
export { DnaInput as Input } from "./DnaInput";
export { DnaSwitch as Switch } from "./DnaSwitch";
export { DnaTextarea as Textarea } from "./DnaTextarea";
export { DnaCheckbox as Checkbox } from "./DnaCheckbox";
export {
  DnaCard as Card,
  DnaCardHeader as CardHeader,
  DnaCardFooter as CardFooter,
  DnaCardTitle as CardTitle,
  DnaCardDescription as CardDescription,
  DnaCardContent as CardContent,
} from "./DnaCard";
export { DnaBadge as Badge } from "./DnaBadge";
export { DnaSkeleton as Skeleton } from "./DnaSkeleton";
export { DnaProgress as Progress } from "./DnaProgress";
export {
  DnaDropdownMenu as DropdownMenu,
  DnaDropdownMenuTrigger as DropdownMenuTrigger,
  DnaDropdownMenuContent as DropdownMenuContent,
  DnaDropdownMenuItem as DropdownMenuItem,
  DnaDropdownMenuLabel as DropdownMenuLabel,
  DnaDropdownMenuSeparator as DropdownMenuSeparator,
} from "./DnaDropdownMenu";
export { DnaButton as Button } from "./DnaButton";

export {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "./DnaTooltipCompound";