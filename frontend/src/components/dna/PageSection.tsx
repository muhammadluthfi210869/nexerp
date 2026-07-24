import { cn } from "@/lib/utils"
import { SectionLabel } from "./SectionLabel"

interface PageSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function PageSection({ title, children, className }: PageSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <SectionLabel>{title}</SectionLabel>
      {children}
    </section>
  )
}
