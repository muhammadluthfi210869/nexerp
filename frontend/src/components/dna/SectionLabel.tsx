import { cn } from "@/lib/utils"

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
  as?: "h2" | "h3" | "span"
}

export function SectionLabel({ children, className, as: Tag = "h2" }: SectionLabelProps) {
  return (
    <Tag className={cn("text-section-label", className)}>
      {children}
    </Tag>
  )
}
