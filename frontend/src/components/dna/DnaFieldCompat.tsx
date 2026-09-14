"use client";

// Re-exports of underlying Radix / UI primitives wrapped inside DNA.
// Operational pages MUST import these through "@/components/dna" per ADR-007.

export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Dialog as DnaDialog,
  DialogContent as DnaDialogContent,
  DialogTitle as DnaDialogTitle,
  DialogDescription as DnaDialogDescription,
  DialogHeader as DnaDialogHeader,
  DialogFooter as DnaDialogFooter,
} from "@/components/ui/dialog";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export { Label } from "@/components/ui/label";
export { Input } from "@/components/ui/input";
export { Switch } from "@/components/ui/switch";
export { Textarea } from "@/components/ui/textarea";
export { Checkbox } from "@/components/ui/checkbox";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
export { Badge } from "@/components/ui/badge";
export { Skeleton } from "@/components/ui/skeleton";
export { Progress } from "@/components/ui/progress";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
export { DnaButton as Button } from "./DnaButton";
