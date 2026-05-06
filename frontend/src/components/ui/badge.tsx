import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]",
        info:
          "border-transparent bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]",
        critical:
          "border-transparent bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] animate-pulse",
        warning:
          "border-transparent bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      role="status"
      {...props}
    >
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

